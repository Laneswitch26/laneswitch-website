import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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

test('Provisioning requires distinct strong school passwords; test has no school credentials',()=>{
  assert.throws(()=>makeAccounts({}));
  assert.throws(()=>makeAccounts({NAV_A1_PASSWORD:'same password long',NAV_EMRE_PASSWORD:'same password long'}));
  const rows=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456'});
  assert.deepEqual(rows.map(x=>x.school),['a1','emre','test']);
  const t=rows[2];assert.equal(t.hash,pbkdf2Sync('lane switch',Buffer.from(t.salt,'hex'),100000,32,'sha256').toString('hex'));
  assert.ok(!JSON.stringify(rows).includes('fixture password'));
});

test('Production bundle isolates Navigator routes, rejects missing configuration, and secures responses',async()=>{
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',serviceBindings:{ASSETS:async req=>new Response(new URL(req.url).pathname,{headers:{'Content-Type':'text/html'}})}});
  try{
    for(const p of ['/navigator/zugang','/navigator/zugang/','/navigator/a1','/navigator/emre']){
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
  const accounts=makeAccounts({NAV_A1_PASSWORD:'A1 fixture password 123',NAV_EMRE_PASSWORD:'Emre fixture password 456'});
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{NAV_ACCOUNTS:JSON.stringify(accounts)},serviceBindings:{ASSETS:async()=>new Response('app')}});
  try{
    const db=await mf.getD1Database('DB');for(const q of (await readFile('drizzle/0001_navigator.sql','utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
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
    const crossWrite=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin:'https://laneswitch.de','Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'test',password:'lane switch'})});
    assert.equal(crossWrite.status,403);
    assert.equal(crossWrite.headers.get('access-control-allow-origin'),null);
    const r=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'test',password:'lane switch'})});
    assert.equal(r.status,200);const data=await r.json();assert.equal(data.school,'test');
    assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
    const publish=await mf.dispatchFetch(origin+'/api/navigator',{method:'POST',headers:{origin,'Content-Type':'application/json',cookie:r.headers.get('set-cookie').split(';')[0],'x-csrf-token':data.csrf},body:JSON.stringify({action:'publish',data:{name:'Test'}})});
    assert.equal(publish.status,403);
  }finally{await mf.dispose();}
});
