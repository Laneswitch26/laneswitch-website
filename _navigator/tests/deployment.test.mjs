import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {pbkdf2Sync} from 'node:crypto';
import {makeAccounts} from '../scripts/accounts.mjs';

test('Actual static assets serve the editor shell without canonical redirects',async()=>{
  const config=JSON.parse(await readFile('wrangler.json','utf8'));
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:config.compatibility_date,assets:{directory:config.assets.directory,binding:config.assets.binding,routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:config.assets.run_worker_first},assetConfig:{html_handling:config.assets.html_handling}}});
  try{
    for(const path of ['/navigator/zugang','/navigator/zugang/','/navigator/a1','/navigator/emre','/navigator/test']){
      const r=await mf.dispatchFetch('https://laneswitch.de'+path,{redirect:'manual'});
      assert.equal(r.status,200,`${path}: ${r.headers.get('location')}`);
      assert.match(await r.text(),/<div id="root"><\/div>/);
      assert.match(r.headers.get('x-robots-tag'),/noindex/);
      assert.equal(r.headers.get('cache-control'),'no-store');
    }
    assert.equal((await mf.dispatchFetch('https://laneswitch.de/navigator/assets/app.js')).status,200);
    assert.equal((await mf.dispatchFetch('https://laneswitch.de/navigator/app.html')).status,404);
  }finally{await mf.dispose();}
});

test('Provisioning requires distinct strong passwords; test account only with its own secret',()=>{
  assert.throws(()=>makeAccounts({}));
  assert.throws(()=>makeAccounts({NAV_A1_PASSWORD:'same password long',NAV_EMRE_PASSWORD:'same password long'}));
  assert.deepEqual(makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456'}).map(x=>x.school),['a1','emre']);
  assert.throws(()=>makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'short'}));
  assert.throws(()=>makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'A1 fixture password 123'}));
  const rows=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'Test fixture password 789'});
  assert.deepEqual(rows.map(x=>x.school),['a1','emre','test']);
  const t=rows[2];assert.equal(t.hash,pbkdf2Sync('Test fixture password 789',Buffer.from(t.salt,'hex'),100000,32,'sha256').toString('hex'));
  assert.ok(!JSON.stringify(rows).includes('fixture password'));
});

test('Production bundle isolates Navigator routes, rejects missing configuration, and secures responses',async()=>{
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',serviceBindings:{ASSETS:async req=>new Response(new URL(req.url).pathname,{headers:{'Content-Type':'text/html'}})}});
  try{
    for(const p of ['/navigator/zugang','/navigator/zugang/','/navigator/demo','/navigator/admin','/navigator/registrierung','/navigator/a1','/navigator/emre']){
      const r=await mf.dispatchFetch('https://laneswitch.de'+p);
      assert.equal(r.status,200);assert.equal(await r.text(),'/navigator/app.html');
      assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-frame-options'),'DENY');
    }
    assert.equal((await mf.dispatchFetch('https://laneswitch.de/api/navigator')).status,503);
    for(const p of ['/','/navigator','/navigator/unbekannt','/navigator/app.html','/scripts/deploy.mjs','/api/other'])assert.equal((await mf.dispatchFetch('https://laneswitch.de'+p)).status,404);
    assert.equal((await mf.dispatchFetch('https://laneswitch.de/navigator/zugang',{method:'POST'})).status,405);
  }finally{await mf.dispose();}
});

test('Built Worker uses its actual D1 binding and hashed registry for login',async()=>{
  const accounts=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'Test fixture password 789'});
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{NAV_ACCOUNTS:JSON.stringify(accounts)},serviceBindings:{ASSETS:async()=>new Response('app')}});
  try{
    const db=await mf.getD1Database('DB');for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
    const origin='https://laneswitch.online';
    const publicResult=await mf.dispatchFetch(origin+'/api/navigator?action=public&school=a1',{headers:{origin:'https://laneswitch.de'}});
    assert.equal(publicResult.status,404);
    assert.equal(publicResult.headers.get('access-control-allow-origin'),'https://laneswitch.de');
    assert.equal(publicResult.headers.get('access-control-allow-credentials'),null);
    for(const path of ['?action=me','?action=file&id=anything']){
      const privateResult=await mf.dispatchFetch(origin+'/api/navigator'+path,{headers:{origin:'https://laneswitch.de'}});
      assert.equal(privateResult.status,401);
      assert.equal(privateResult.headers.get('access-control-allow-origin'),null);
    }
    const foreign=await mf.dispatchFetch(origin+'/api/navigator?action=public&school=a1',{headers:{origin:'https://example.org'}});
    assert.equal(foreign.headers.get('access-control-allow-origin'),null);
    const crossWrite=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin:'https://laneswitch.de','Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'test',password:'Test fixture password 789'})});
    assert.equal(crossWrite.status,403);
    assert.equal(crossWrite.headers.get('access-control-allow-origin'),null);
    const r=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'test',password:'Test fixture password 789'})});
    assert.equal(r.status,200);const data=await r.json();assert.equal(data.school,'test');
    assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
    const publish=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'Content-Type':'application/json',cookie:r.headers.get('set-cookie').split(';')[0],'x-csrf-token':data.csrf},body:JSON.stringify({action:'publish',data:{name:'Test'}})});
    assert.equal(publish.status,403);
  }finally{await mf.dispose();}
});


test('AI Studio: full app requires server-side session; test account gets only static demo',async()=>{
  const accounts=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'Test fixture password 789',NAV_ADMIN_PASSWORD:'Admin fixture password 987'});
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',d1Databases:['DB'],kvNamespaces:['AI_STUDIO_KV'],bindings:{NAV_ACCOUNTS:JSON.stringify(accounts)},serviceBindings:{ASSETS:async()=>new Response('app')}});
  try{
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
    await (await mf.getKVNamespace('AI_STUDIO_KV')).put('studio-v06','<!doctype html><title>PRIVATE-STUDIO-TEST</title><div>Test-Creator</div>');
    const origin='https://laneswitch.online',studio=origin+'/navigator/ai-studio';
    const anonymous=await mf.dispatchFetch(studio,{redirect:'manual'});
    assert.equal(anonymous.status,302);assert.equal(anonymous.headers.get('location'),'/navigator/zugang?next=ai-studio');
    assert.ok(!(await anonymous.text()).includes('PRIVATE-STUDIO-TEST'));
    assert.equal((await mf.dispatchFetch(studio,{method:'POST'})).status,405);
    const login=async(username,password)=>{
      const res=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({action:'login',username,password})});
      assert.equal(res.status,200);return res.headers.get('set-cookie').split(';')[0];
    };
    const partner=await login('a1','A1 fixture password 123');
    const part=await mf.dispatchFetch(studio,{headers:{cookie:partner}});
    assert.equal(part.status,200);assert.match(await part.text(),/PRIVATE-STUDIO-TEST/);
    assert.equal(part.headers.get('cache-control'),'no-store');
    const demo=await login('test','Test fixture password 789');
    const testRes=await mf.dispatchFetch(studio,{headers:{cookie:demo}});
    assert.equal(testRes.status,200);
    const publicDemo=await testRes.text();
    assert.match(publicDemo,/MUSTERFAHRSCHULE/);assert.doesNotMatch(publicDemo,/PRIVATE-STUDIO-TEST/);
    assert.doesNotMatch(publicDemo,/PRODUKTION AKTIV/);
    const admin=await login('admin','Admin fixture password 987');
    const adminRes=await mf.dispatchFetch(studio,{headers:{cookie:admin}});
    assert.equal(adminRes.status,200);assert.match(await adminRes.text(),/PRIVATE-STUDIO-TEST/);
  }finally{await mf.dispose();}
});


test('Testzugang mit Laufzeit: eigene Studio-Variante, Verlängern, Umwandeln und Sperre nach Ablauf',async()=>{
  const accounts=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'Test fixture password 789',NAV_ADMIN_PASSWORD:'Admin fixture password 987'});
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',d1Databases:['DB'],kvNamespaces:['AI_STUDIO_KV'],bindings:{NAV_ACCOUNTS:JSON.stringify(accounts)},serviceBindings:{ASSETS:async()=>new Response('app')}});
  try{
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
    const kv=await mf.getKVNamespace('AI_STUDIO_KV');
    await kv.put('studio-v06','<title>PRIVATE-STUDIO-TEST</title>');await kv.put('studio-test','<title>TRIAL-STUDIO-TEST</title>');
    const origin='https://laneswitch.online',studio=origin+'/navigator/ai-studio';
    const post=async(body,cookie,csrf)=>mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:JSON.stringify(body)});
    const adminLogin=await post({action:'login',username:'admin',password:'Admin fixture password 987'});
    const adminCookie=adminLogin.headers.get('set-cookie').split(';')[0],adminCsrf=(await adminLogin.json()).csrf;
    const inv=await (await post({action:'createInvite',name:'Testfahrschule Muster',trial:true,trialDays:10},adminCookie,adminCsrf)).json();
    assert.equal(inv.trialDays,10);
    const reg=await post({action:'register',token:inv.link.split('#')[1],username:'testfahrschule',password:'Ein sehr langes Passwort 12',consent:true});
    assert.equal(reg.status,200);const cookie=reg.headers.get('set-cookie').split(';')[0];const state=await reg.json();
    assert.ok(state.trialUntil>Date.now()+9*86400000&&state.trialUntil<Date.now()+11*86400000);
    const trialStudio=await mf.dispatchFetch(studio,{headers:{cookie}});
    assert.equal(trialStudio.status,200);const body=await trialStudio.text();
    assert.match(body,/TRIAL-STUDIO-TEST/);assert.doesNotMatch(body,/PRIVATE-STUDIO-TEST/);
    const overview=await (await post({action:'adminOverview'},adminCookie,adminCsrf)).json();
    const row=overview.schools.find(s=>s.school===inv.school);assert.ok(row.trialUntil>0);
    const extended=await (await post({action:'setSchool',school:inv.school,trialDays:14},adminCookie,adminCsrf)).json();
    assert.ok(extended.schools.find(s=>s.school===inv.school).trialUntil>row.trialUntil+13*86400000);
    // Abgelaufen: Anmeldung und bestehende Sitzung werden abgewiesen, Daten bleiben erhalten.
    await db.prepare('UPDATE nav_schools SET trial_until=? WHERE school=?').bind(Date.now()-1000,inv.school).run();
    const expiredLogin=await post({action:'login',username:'testfahrschule',password:'Ein sehr langes Passwort 12'});
    assert.equal(expiredLogin.status,403);
    assert.equal((await mf.dispatchFetch(studio,{headers:{cookie},redirect:'manual'})).status,302);
    // Verlängern reaktiviert, Umwandeln hebt die Befristung auf und liefert das volle Studio.
    await post({action:'setSchool',school:inv.school,trialDays:5},adminCookie,adminCsrf);
    const again=await post({action:'login',username:'testfahrschule',password:'Ein sehr langes Passwort 12'});assert.equal(again.status,200);
    await post({action:'setSchool',school:inv.school,convert:true},adminCookie,adminCsrf);
    const fullCookie=(await post({action:'login',username:'testfahrschule',password:'Ein sehr langes Passwort 12'})).headers.get('set-cookie').split(';')[0];
    assert.match(await (await mf.dispatchFetch(studio,{headers:{cookie:fullCookie}})).text(),/PRIVATE-STUDIO-TEST/);
  }finally{await mf.dispose();}
});


test('AI Studio: Beitragspakete speichern/abrufen/löschen und Feedback im Admin',async()=>{
  const accounts=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456',NAV_TEST_PASSWORD:'Test fixture password 789',NAV_ADMIN_PASSWORD:'Admin fixture password 987'});
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',d1Databases:['DB'],kvNamespaces:['AI_STUDIO_KV'],bindings:{NAV_ACCOUNTS:JSON.stringify(accounts)},serviceBindings:{ASSETS:async()=>new Response('app')}});
  try{
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
    await (await mf.getKVNamespace('AI_STUDIO_KV')).put('studio-v06','<title>STUDIO</title>');
    const origin='https://laneswitch.online';
    const post=async(body,cookie,csrf)=>mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:JSON.stringify(body)});
    const login=async(u,p)=>{const r=await post({action:'login',username:u,password:p});assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:(await r.json()).csrf};};
    const a1=await login('a1','A1 fixture password 123');
    const studio=await mf.dispatchFetch(origin+'/navigator/ai-studio',{headers:{cookie:a1.cookie}});
    assert.match(studio.headers.get('content-security-policy'),/connect-src 'self'/);
    const img='data:image/jpeg;base64,'+Buffer.from([0xff,0xd8,0xff,0xd9]).toString('base64');
    const bad=await post({action:'savePost',title:'',caption:'x'},a1.cookie,a1.csrf);assert.equal(bad.status,400);
    const saved=await post({action:'savePost',title:'Auffrischungsstunden Herbst',topic:'Auffrischung',format:'instagram',caption:'Wieder sicher am Steuer.',image:img,task:'LS-001',provider:'claude'},a1.cookie,a1.csrf);
    assert.equal(saved.status,200);const {id}=await saved.json();
    const list=await (await mf.dispatchFetch(origin+'/api/navigator?action=posts',{headers:{cookie:a1.cookie}})).json();
    assert.equal(list.posts.length,1);assert.equal(list.posts[0].title,'Auffrischungsstunden Herbst');assert.equal(list.posts[0].hasImage,true);assert.equal(list.limit,100);
    const pic=await mf.dispatchFetch(origin+'/api/navigator?action=postImage&id='+id,{headers:{cookie:a1.cookie}});
    assert.equal(pic.status,200);assert.equal(pic.headers.get('content-type'),'image/jpeg');
    // Andere Fahrschule sieht nichts
    const emre=await login('emre','Emre fixture password 456');
    assert.equal((await mf.dispatchFetch(origin+'/api/navigator?action=postImage&id='+id,{headers:{cookie:emre.cookie}})).status,404);
    assert.equal((await (await mf.dispatchFetch(origin+'/api/navigator?action=posts',{headers:{cookie:emre.cookie}})).json()).posts.length,0);
    assert.equal((await post({action:'deletePost',id},emre.cookie,emre.csrf)).status,200);
    assert.equal((await (await mf.dispatchFetch(origin+'/api/navigator?action=posts',{headers:{cookie:a1.cookie}})).json()).posts.length,1);
    // Feedback
    assert.equal((await post({action:'sendFeedback',rating:11},a1.cookie,a1.csrf)).status,400);
    assert.equal((await (await mf.dispatchFetch(origin+'/api/navigator?action=feedbackStatus',{headers:{cookie:a1.cookie}})).json()).given,false);
    assert.equal((await post({action:'sendFeedback',rating:8,text:'Bild mit Claude klappte gut.',provider:'claude'},a1.cookie,a1.csrf)).status,200);
    assert.equal((await (await mf.dispatchFetch(origin+'/api/navigator?action=feedbackStatus',{headers:{cookie:a1.cookie}})).json()).given,true);
    const admin=await login('admin','Admin fixture password 987');
    const ov=await (await post({action:'adminOverview'},admin.cookie,admin.csrf)).json();
    assert.equal(ov.feedback.length,1);assert.equal(ov.feedback[0].rating,8);assert.equal(ov.feedback[0].name,'A1 Fahrschule');
    // Löschen durch Eigentümer
    assert.equal((await post({action:'deletePost',id},a1.cookie,a1.csrf)).status,200);
    assert.equal((await (await mf.dispatchFetch(origin+'/api/navigator?action=posts',{headers:{cookie:a1.cookie}})).json()).posts.length,0);
  }finally{await mf.dispose();}
});
