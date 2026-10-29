import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {readFile,rm,readdir} from 'node:fs/promises';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
// Admin, Einladungslinks, Registrierung, Freigabe, Sperre und Partner-Vorteile gegen echte D1-Tabellen.
const path=new URL('../.nav-reg-bundle.mjs',import.meta.url);
await build({entryPoints:['app/api/navigator/route.ts'],bundle:true,format:'esm',platform:'node',outfile:path.pathname,plugins:[{name:'env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__navEnv;',loader:'js'}));}}]});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
let n=0;const ok=(cond,msg)=>{assert.ok(cond,msg);n++;};const eq=(a,b,msg)=>{assert.equal(a,b,msg);n++;};
try{
 const db=await mf.getD1Database('DB');
 for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
 const acct=(username,school,pw)=>{const salt=randomBytes(16).toString('hex');return {username,school,salt,hash:pbkdf2Sync(pw,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex')};};
 globalThis.__navEnv={DB:db,NAV_ACCOUNTS:JSON.stringify([acct('a1','a1','a1 password long'),acct('emre','emre','emre password long'),acct('steven','_admin','admin password long')])};
 const {GET,POST}=await import(path.href);
 const origin='https://laneswitch.online';let ipCounter=0;
 const post=(body,auth={},extra={})=>POST(new Request(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'10.0.0.'+(ipCounter++%200),...(auth.cookie?{cookie:auth.cookie,'x-csrf-token':auth.csrf}:{}),...extra},body:JSON.stringify(body)}));
 const get=(q,auth={})=>GET(new Request(origin+'/api/navigator?'+q,{headers:auth.cookie?{cookie:auth.cookie}:{}}));
 async function login(username,password){const r=await post({action:'login',username,password});const j=await r.json();return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],...j};}

 // Admin-Anmeldung und strikte Trennung von Fahrschul-Aktionen
 const admin=await login('steven','admin password long');eq(admin.status,200,'admin login');eq(admin.admin,true,'admin flag');
 eq((await post({action:'save',data:{name:'x'}},admin)).status,400,'admin cannot save school data');
 eq((await get('action=benefits',admin)).status,400,'admin has no benefits');
 const a1=await login('a1','a1 password long');eq(a1.status,200);
 eq((await post({action:'adminOverview'},a1)).status,400,'school cannot call admin actions');
 eq((await post({action:'createInvite',name:'Fahrschule Böse'},a1)).status,400,'school cannot invite');
 eq((await post({action:'adminOverview'})).status,401,'admin actions need login');
 eq((await post({action:'adminOverview'},{cookie:admin.cookie,csrf:'wrong'})).status,403,'admin actions need csrf');

 // Einladung erstellen
 let r=await post({action:'createInvite',name:'Fahrschule Müller & Söhne',days:14},admin);eq(r.status,200);let inv=await r.json();
 eq(inv.school,'fahrschule-mueller-soehne','slug from name');
 ok(/^https:\/\/laneswitch\.online\/navigator\/registrierung#[a-f0-9]{64}$/.test(inv.link),'link with token after #');
 eq(inv.code,'MUELLERSOEHNE','code derived from name');
 const token=inv.link.split('#')[1];
 eq((await post({action:'createInvite',name:'Andere',code:'A1'},admin)).status,400,'static code is reserved');
 eq((await post({action:'createInvite',name:'Zweite',code:'MUELLERSOEHNE'},admin)).status,400,'open invite code reserved');
 const tokenRow=await db.prepare('SELECT token FROM nav_invites WHERE school=?').bind('fahrschule-mueller-soehne').first();ok(tokenRow.token!==token,'token stored only as digest');

 // Registrierung
 r=await post({action:'inviteInfo',token});eq(r.status,200);eq((await r.json()).name,'Fahrschule Müller & Söhne');
 eq((await post({action:'inviteInfo',token:'0'.repeat(64)})).status,404,'unknown token');
 eq((await post({action:'register',token,username:'Ab',password:'long enough password',consent:true})).status,400,'username too short');
 eq((await post({action:'register',token,username:'mueller',password:'short',consent:true})).status,400,'password too short');
 eq((await post({action:'register',token,username:'mueller',password:'long enough password'})).status,400,'consent required');
 eq((await post({action:'register',token,username:'a1',password:'long enough password',consent:true})).status,400,'static username reserved');
 eq((await post({action:'register',token,username:'steven',password:'long enough password',consent:true})).status,400,'admin username reserved');
 r=await post({action:'register',token,username:'Mueller',password:'long enough password',consent:true});eq(r.status,200,'register ok');
 let reg=await r.json();eq(reg.school,'fahrschule-mueller-soehne');eq(reg.registered,true);eq(reg.approved,false);eq(reg.data.name,'Fahrschule Müller & Söhne','draft prefilled with name');
 ok(/HttpOnly; Secure; SameSite=Strict/.test(r.headers.get('set-cookie')),'secure session cookie');
 const m={cookie:r.headers.get('set-cookie').split(';')[0],csrf:reg.csrf};
 eq((await post({action:'register',token,username:'other',password:'long enough password',consent:true})).status,404,'invite single use');
 const stored=await db.prepare('SELECT * FROM nav_accounts WHERE school=?').bind('fahrschule-mueller-soehne').first();ok(!JSON.stringify(stored).includes('long enough password'),'no plaintext password');eq(stored.username,'mueller','username lowercased');

 // Login mit selbst gewählten Zugangsdaten, Speichern, Veröffentlichen ohne Freigabe
 const m2=await login('mueller','long enough password');eq(m2.status,200);eq(m2.school,'fahrschule-mueller-soehne');
 eq((await login('mueller','wrong password long')).status,401);
 eq((await post({action:'save',data:{name:'Fahrschule Müller'}},m)).status,200);
 eq((await post({action:'publish',data:{name:'Fahrschule Müller',classes:'B'},listed:true},m)).status,200,'publish allowed before approval');
 eq((await get('action=public&school=fahrschule-mueller-soehne')).status,404,'not public before approval');
 eq((await (await get('action=directory')).json()).schools.length,0,'not in directory before approval');
 eq((await post({action:'adminOverview'},m)).status,400,'registered school cannot call admin actions');
 // Fremde Daten bleiben getrennt
 eq((await get('action=me',a1)).status,200);eq((await (await get('action=me',a1)).json()).school,'a1');

 // Freigabe durch Admin
 r=await post({action:'setSchool',school:'fahrschule-mueller-soehne',approved:true},admin);eq(r.status,200);
 const over=await r.json();const row=over.schools.find(s=>s.school==='fahrschule-mueller-soehne');eq(row.approved,true);eq(row.username,'mueller');eq(row.published,true);
 eq((await get('action=public&school=fahrschule-mueller-soehne')).status,200,'public after approval');
 const dir=await (await get('action=directory')).json();eq(dir.schools.length,1);eq(dir.schools[0].name,'Fahrschule Müller');
 eq((await post({action:'setSchool',school:'a1',approved:false},admin)).status,404,'fixed schools not changed via admin');

 // Partner und automatisch erzeugte Codes
 eq((await post({action:'savePartner',data:{name:'Eingeprägt',code:'eingepraegt x',discount:'5'}},admin)).status,400,'invalid partner code');
 eq((await post({action:'savePartner',data:{name:'Eingeprägt',code:'EINGEPRAEGT',discount:'500'}},admin)).status,400,'invalid discount');
 r=await post({action:'savePartner',data:{name:'Eingeprägt',code:'eingepraegt',discount:'5',services:'Gravuren',benefitSchool:'5 % auf jede Bestellung',website:'https://example.com'}},admin);eq(r.status,200);
 const partner=(await r.json()).partners[0];eq(partner.code,'EINGEPRAEGT');
 eq((await post({action:'savePartner',data:{name:'Doppelt',code:'EINGEPRAEGT'}},admin)).status,400,'partner code unique');
 let b=await (await get('action=benefits',a1)).json();eq(b.benefits[0].benefitCode,'EINGEPRAEGT-A1-5','static school code');
 b=await (await get('action=benefits',m)).json();eq(b.benefits[0].benefitCode,'EINGEPRAEGT-MUELLERSOEHNE-5','registered school code');
 eq((await get('action=benefits')).status,401,'benefits need login');
 await post({action:'savePartner',id:partner.id,data:{name:'Eingeprägt',code:'EINGEPRAEGT',discount:'5'},active:false},admin);
 eq((await (await get('action=benefits',a1)).json()).benefits.length,0,'inactive partner hidden');

 // Neuer Zugangslink für bestehende Fahrschule (Passwort vergessen): Daten bleiben, alte Sitzungen enden
 r=await post({action:'createInvite',school:'fahrschule-mueller-soehne'},admin);eq(r.status,200);const renew=(await r.json()).link.split('#')[1];
 eq((await (await post({action:'inviteInfo',token:renew})).json()).renewal,true);
 eq((await post({action:'register',token:renew,username:'mueller-neu',password:'another long password',consent:true})).status,200);
 eq((await get('action=me',m)).status,401,'old session ended');
 eq((await login('mueller','long enough password')).status,401,'old credentials invalid');
 const m3=await login('mueller-neu','another long password');eq(m3.status,200);eq(m3.data.name,'Fahrschule Müller','content kept');

 // Widerruf und Ablauf
 r=await post({action:'createInvite',name:'Fahrschule Widerruf'},admin);const revoked=(await r.json());
 await post({action:'revokeInvite',school:revoked.school},admin);
 eq((await post({action:'inviteInfo',token:revoked.link.split('#')[1]})).status,404,'revoked invite');
 r=await post({action:'createInvite',name:'Fahrschule Abgelaufen'},admin);const old=(await r.json());
 await db.prepare('UPDATE nav_invites SET expires=? WHERE school=?').bind(Date.now()-1,old.school).run();
 eq((await post({action:'register',token:old.link.split('#')[1],username:'abgelaufen',password:'long enough password',consent:true})).status,404,'expired invite');

 // Sperre
 eq((await post({action:'setSchool',school:'fahrschule-mueller-soehne',disabled:true},admin)).status,200);
 eq((await get('action=me',{cookie:m3.cookie})).status,401,'disabled: session ended');
 eq((await login('mueller-neu','another long password')).status,401,'disabled: no login');
 eq((await get('action=public&school=fahrschule-mueller-soehne')).status,404,'disabled: not public');
 eq((await (await get('action=directory')).json()).schools.length,0,'disabled: not in directory');

 // Bremse gegen Durchprobieren von Einladungslinks
 let last=0;for(let i=0;i<32;i++)last=(await POST(new Request(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body:JSON.stringify({action:'inviteInfo',token:'1'.repeat(64)})}))).status;
 eq(last,429,'invite lookup throttled');
 console.log('Navigator: '+n+' Registrierungs-/Admin-Prüfungen bestanden.');
}finally{await mf.dispose();delete globalThis.__navEnv;await rm(path,{force:true});}
