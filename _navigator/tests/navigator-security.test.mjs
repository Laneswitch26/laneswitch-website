import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const path=new URL('../.nav-test-bundle.mjs',import.meta.url);
await build({entryPoints:['app/api/navigator/route.ts'],bundle:true,format:'esm',platform:'node',outfile:path.pathname,plugins:[{name:'env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__navEnv;',loader:'js'}));}}]});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const q of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))await db.prepare(q.trim()).run();
 const credentials=['a1','emre','test'].map(s=>{const salt=randomBytes(16).toString('hex');return {username:s,school:s,salt,hash:pbkdf2Sync('test password',Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex')};});
 globalThis.__navEnv={DB:db,NAV_ACCOUNTS:JSON.stringify(credentials)};
 const {GET,POST}=await import(path.href);
 const origin='https://navigator.example';
 const req=(body,cookie='',csrf='',headers={})=>new Request(origin+'/api/navigator',{method:'POST',headers:{origin,'content-type':'application/json',cookie,'x-csrf-token':csrf,...headers},body:JSON.stringify(body)});
 async function login(username){const r=await POST(req({action:'login',username,password:'test password'}));assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],...(await r.json())};}
 const a=await login('a1'),e=await login('emre'),t=await login('test');
 assert.equal((await GET(new Request(origin+'/api/navigator?action=me'))).status,401);
 assert.equal((await POST(req({action:'save',data:{name:'A1'}},a.cookie))).status,403);
 assert.equal((await POST(req({action:'save',data:{name:'A1'}},a.cookie,a.csrf,{origin:'https://evil.example'}))).status,403);
 assert.equal((await POST(req({action:'save',school:'emre',data:{name:'A1 private'}},a.cookie,a.csrf))).status,200);
 const emre=await (await GET(new Request(origin+'/api/navigator?action=me',{headers:{cookie:e.cookie}}))).json();assert.equal(emre.data.name,undefined);
 assert.equal((await GET(new Request(origin+'/api/navigator?action=public&school=a1'))).status,404);
 assert.equal((await POST(req({action:'publish',data:{name:'Demo'}},t.cookie,t.csrf))).status,403);
 assert.equal((await POST(req({action:'publish',data:{name:'A1 public'},listed:true},a.cookie,a.csrf))).status,200);
 assert.equal((await (await GET(new Request(origin+'/api/navigator?action=public&school=a1'))).json()).data.name,'A1 public');
 assert.equal((await POST(req({action:'save',data:{name:'Unpublished change'}},a.cookie,a.csrf))).status,200);
 assert.equal((await (await GET(new Request(origin+'/api/navigator?action=public&school=a1'))).json()).data.name,'A1 public');
 const form=new FormData();form.set('file',new File(['%PDF-1.4\n%%EOF'],'info.pdf',{type:'application/pdf'}));const upload=await POST(new Request(origin+'/api/navigator?action=upload',{method:'POST',headers:{origin,cookie:a.cookie,'x-csrf-token':a.csrf},body:form}));assert.equal(upload.status,200);const f=await upload.json();
 assert.equal((await GET(new Request(origin+'/api/navigator?action=file&id='+f.id,{headers:{cookie:e.cookie}}))).status,404);
 assert.equal((await GET(new Request(origin+'/api/navigator?action=file&id='+f.id+'&school=a1'))).status,404);
 assert.equal((await POST(req({action:'save',data:{name:'Emre',documents:[f]}},e.cookie,e.csrf))).status,400);
 assert.equal((await POST(req({action:'publish',data:{name:'A1',documents:[f]}},a.cookie,a.csrf))).status,200);
 assert.equal((await GET(new Request(origin+'/api/navigator?action=file&id='+f.id+'&school=a1'))).status,200);
 assert.equal((await POST(req({action:'unpublish'},a.cookie,a.csrf))).status,200);
 assert.equal((await GET(new Request(origin+'/api/navigator?action=file&id='+f.id+'&school=a1'))).status,404);
 assert.equal((await POST(new Request(origin+'/api/navigator',{method:'POST',headers:{origin},body:'x'.repeat(1500001)}))).status,413);
 assert.equal((await POST(new Request(origin+'/api/navigator',{method:'POST',headers:{origin},body:'{broken'}))).status,400);
 assert.equal((await POST(req({action:'logout'},a.cookie,a.csrf))).status,200);
 assert.equal((await GET(new Request(origin+'/api/navigator?action=me',{headers:{cookie:a.cookie}}))).status,401);
 for(let i=0;i<9;i++){const r=await POST(req({action:'login',username:'missing',password:'bad'}));assert.equal(r.status,i<8?401:429);}
 console.log('Navigator: 23 security/integration assertions passed (real D1 via Miniflare).');
}finally{await mf.dispose();delete globalThis.__navEnv;await rm(path,{force:true});}
