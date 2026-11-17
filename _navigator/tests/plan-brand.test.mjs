import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {readFile,rm,readdir} from 'node:fs/promises';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
// Lernkontrolle: Darstellung (Name, Absender, Logo) je Fahrschule speichern, lesen und schützen.
const path=new URL('../.nav-plan-bundle.mjs',import.meta.url);
await build({entryPoints:['app/api/navigator/route.ts'],bundle:true,format:'esm',platform:'node',outfile:path.pathname,plugins:[{name:'env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__navEnv;',loader:'js'}));}}]});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
let n=0;const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++;};
try{
 const db=await mf.getD1Database('DB');
 for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
 const acct=(username,school,pw)=>{const salt=randomBytes(16).toString('hex');return {username,school,salt,hash:pbkdf2Sync(pw,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex')};};
 globalThis.__navEnv={DB:db,NAV_ACCOUNTS:JSON.stringify([acct('a1','a1','a1 password long'),acct('emre','emre','emre password long'),acct('steven','_admin','admin password long')])};
 const {GET,POST}=await import(path.href);
 const origin='https://laneswitch.online';let ip=0;
 const post=(body,auth={})=>POST(new Request(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'10.1.0.'+(ip++%200),...(auth.cookie?{cookie:auth.cookie,'x-csrf-token':auth.csrf}:{})},body:JSON.stringify(body)}));
 const get=(q,auth={})=>GET(new Request(origin+'/api/navigator?'+q,{headers:auth.cookie?{cookie:auth.cookie}:{}}));
 const login=async(u,p)=>{const r=await post({action:'login',username:u,password:p});const j=await r.json();return {cookie:r.headers.get('set-cookie')?.split(';')[0],...j};};
 const a1=await login('a1','a1 password long'),emre=await login('emre','emre password long'),admin=await login('steven','admin password long');
 const logo='data:image/png;base64,iVBORw0KGgo=';
 eq((await post({action:'savePlanBrand',brand:{fs:'X'}})).status,401,'save needs login');
 eq((await post({action:'savePlanBrand',brand:{fs:'X'}},{cookie:a1.cookie,csrf:'falsch'})).status,403,'save needs csrf');
 eq((await post({action:'savePlanBrand',brand:{fs:'X'}},admin)).status,400,'admin has no plan brand');
 eq((await (await get('action=planBrand',a1)).json()).brand,null,'empty at start');
 let r=await post({action:'savePlanBrand',brand:{fs:'  Fahrschule A1  ',abs:'Überreicht von A1',logo}},a1);eq(r.status,200);
 eq((await (await get('action=planBrand',a1)).json()).brand,{fs:'Fahrschule A1',abs:'Überreicht von A1',logo},'saved and trimmed');
 eq((await (await get('action=planBrand',emre)).json()).brand,null,'other school sees nothing of a1');
 eq((await post({action:'savePlanBrand',brand:{fs:'x',logo:'data:image/svg+xml;base64,PHN2Zz4='}},a1)).status,400,'svg logo rejected');
 eq((await post({action:'savePlanBrand',brand:{fs:'x',logo:'javascript:alert(1)'}},a1)).status,400,'non-image rejected');
 eq((await post({action:'savePlanBrand',brand:{fs:'y'.repeat(200)}},emre)).status,200);eq((await (await get('action=planBrand',emre)).json()).brand.fs.length,60,'name capped');
 eq((await (await get('action=planBrand&school=a1')).json()).brand.fs,'Fahrschule A1','public read for shared links');
 eq((await get('action=planBrand&school=gibtsnicht')).status,404,'unknown school 404');
 eq((await get('action=planBrand&school=test')).status,404,'test school never public');
 eq((await get('action=planBrand')).status,401,'own brand needs login');
 r=await post({action:'savePlanBrand',brand:null},a1);eq(r.status,200);eq((await (await get('action=planBrand',a1)).json()).brand,null,'reset');
 console.log('Navigator: '+n+' Lernkontrolle-Prüfungen bestanden.');
}finally{await mf.dispose();delete globalThis.__navEnv;await rm(path,{force:true});}
