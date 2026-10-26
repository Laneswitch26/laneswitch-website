import {readFile,writeFile,rm,appendFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {makeAccounts} from './accounts.mjs';
import {withSecretsFile} from './secrets-file.mjs';

// No login automation, DNS changes, paid-plan activation or credential logging.
const expectedAccount='565efa139d3990e026b8bcf6a8c8963e';
const token=process.env.CLOUDFLARE_API_TOKEN?.trim();
const registry=makeAccounts(process.env);
if(!token)throw new Error('GitHub-Secret CLOUDFLARE_API_TOKEN fehlt.');
if(process.env.CLOUDFLARE_ACCOUNT_ID!==expectedAccount)throw new Error('Cloudflare-Konto stimmt nicht mit der bestehenden GitHub-Verknüpfung überein.');
const apiBase=`https://api.cloudflare.com/client/v4/accounts/${expectedAccount}`;
async function api(path,options={}){
  const r=await fetch(apiBase+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});
  const body=await r.json();
  if(!r.ok||!body.success){
    if(r.status===401||r.status===403)await diagnoseAccess();
    throw new Error(`Cloudflare ${r.status}; Fehlercodes: ${(body.errors||[]).map(x=>x.code).join(',')}. Berechtigungen prüfen.`);
  }
  return body.result;
}
// Domain routes stay empty until their DNS/zone configuration has been inspected.
const routes=JSON.parse(await readFile('routes.json','utf8'));
const allowed=new Set(['laneswitch.de/navigator/*','laneswitch.de/api/navigator*','laneswitch.online/navigator/*','laneswitch.online/api/navigator*']);
if(!Array.isArray(routes)||routes.some(r=>!allowed.has(r.pattern)||!['laneswitch.de','laneswitch.online'].includes(r.zone_name)||!r.pattern.startsWith(r.zone_name+'/')))throw new Error('Nur die vorgesehenen Navigator-Pfade dürfen zugeordnet werden.');

const dbName='laneswitch-navigator-eu';
const matches=(await api('/d1/database?name='+dbName+'&per_page=100')).filter(x=>x.name===dbName);
if(matches.length>1)throw new Error('Mehrere Datenbanken gefunden; keine automatische Auswahl.');
let db=matches[0];
if(!db)db=await api('/d1/database',{method:'POST',body:JSON.stringify({name:dbName,jurisdiction:'eu'})});
if(db.jurisdiction!=='eu'||!/^[a-f0-9-]{36}$/.test(db.uuid))throw new Error('EU-Datenbank konnte nicht eindeutig bestätigt werden.');
const config=JSON.parse(await readFile('wrangler.json','utf8'));
config.account_id=expectedAccount;
config.routes=routes;
config.d1_databases[0].database_id=db.uuid;

await writeFile('.deploy.json',JSON.stringify(config));
function wrangler(args,input){
  const childEnv={...process.env,CLOUDFLARE_API_TOKEN:token,CI:'true',WRANGLER_SEND_METRICS:'false'};
  delete childEnv.NAV_A1_PASSWORD;delete childEnv.NAV_EMRE_PASSWORD;
  const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','.deploy.json'],{input,encoding:'utf8',env:childEnv,maxBuffer:4*1024*1024});
  if(result.status!==0){
    let details=(result.stdout||'')+'\n'+(result.stderr||'');
    for(const secret of [token,process.env.NAV_A1_PASSWORD,process.env.NAV_EMRE_PASSWORD,...registry.flatMap(a=>[a.hash,a.salt])])if(secret)details=details.split(secret).join('[REDACTED]');
    console.error(details.slice(-5000));
    throw new Error('Wrangler-Schritt '+args[0]+' fehlgeschlagen.');
  }
}
try{
  wrangler(['d1','migrations','apply','DB','--remote']);
  // No plaintext school passwords in this file; removed even when deployment fails.
  await withSecretsFile({NAV_ACCOUNTS:JSON.stringify(registry)},file=>wrangler(['deploy','--secrets-file',file]));
  const {subdomain}=await api('/workers/subdomain');
  if(!/^[a-z0-9-]+$/.test(subdomain))throw new Error('Workers-Testadresse nicht verifiziert.');
  const origin=`https://laneswitch-navigator.${subdomain}.workers.dev`;
  await smoke(origin);
  if(routes.length)for(const host of new Set(routes.map(r=>r.zone_name)))await smoke('https://'+host);
  const note=`Navigator erfolgreich bereitgestellt und Anmeldung aller drei Konten geprüft: ${origin}/navigator/zugang\n${routes.length?'Konfigurierte eigene Domains zusätzlich geprüft.':'Noch nicht auf laneswitch.de / laneswitch.online geschaltet. DNS und Pfadrouten separat prüfen.'}\n`;
  console.log(note);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,note);
  await inspectDomains();
}finally{await rm('.deploy.json',{force:true});}
async function smoke(origin){
  const page=await fetch(origin+'/navigator/zugang',{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!page.ok||!page.headers.get('x-robots-tag')?.includes('noindex'))throw new Error('Prüfung der Zugangsseite fehlgeschlagen.');
  for(const [school,password] of Object.entries({a1:process.env.NAV_A1_PASSWORD,emre:process.env.NAV_EMRE_PASSWORD,test:'lane switch'})){
    const r=await fetch(origin+'/api/navigator',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:school,password}),signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error('Anmeldeprüfung fehlgeschlagen: '+school+' HTTP '+r.status);
    const data=await r.json(),cookie=r.headers.get('set-cookie')?.split(';')[0];
    if(data.school!==school||!cookie||!data.csrf)throw new Error('Kontozuordnung nicht bestätigt: '+school);
    const out=await fetch(origin+'/api/navigator',{method:'POST',headers:{origin,'Content-Type':'application/json',cookie,'x-csrf-token':data.csrf},body:'{"action":"logout"}',signal:AbortSignal.timeout(30000)});
    if(!out.ok)throw new Error('Abmeldeprüfung fehlgeschlagen: '+school);
  }
}
async function inspectDomains(){
  for(const name of ['laneswitch.de','laneswitch.online']){
    try{
      const base='https://api.cloudflare.com/client/v4';
      async function read(path){const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const j=await r.json();if(!r.ok||!j.success)throw new Error('HTTP '+r.status+' / Codes '+(j.errors||[]).map(e=>e.code).join(','));return j.result;}
      const zones=await read('/zones?account.id='+expectedAccount+'&name='+name);
      if(zones.length!==1){console.log('Domainprüfung '+name+': keine eindeutige Zone im verbundenen Konto.');continue;}
      const zone=zones[0];console.log('Domainprüfung '+name+': Status '+zone.status);
      const records=await read('/zones/'+zone.id+'/dns_records?name='+name);
      console.log(JSON.stringify({domain:name,dns:records.filter(r=>['A','AAAA','CNAME'].includes(r.type)).map(r=>({type:r.type,target:r.content,proxied:r.proxied}))}));
      const routes=await read('/zones/'+zone.id+'/workers/routes');
      console.log(JSON.stringify({domain:name,routes:routes.map(r=>({pattern:r.pattern,script:r.script}))}));
    }catch(e){console.log('Domainprüfung '+name+' noch nicht möglich: '+e.message);}
  }
}
async function diagnoseAccess(){
  // Read-only diagnostics. Never print token IDs, token values, account contents or policies.
  const root='https://api.cloudflare.com/client/v4';
  async function status(label,path){
    try{
      const r=await fetch(root+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
      const body=await r.json();
      console.log(JSON.stringify({check:label,http:r.status,success:body.success===true,codes:(body.errors||[]).map(e=>e.code),...(label.includes('token')&&body.success?{status:body.result?.status}:{})}));
      return r.ok&&body.success;
    }catch{console.log(JSON.stringify({check:label,error:'Keine auswertbare Antwort'}));return false;}
  }
  const userToken=await status('user-token-validity','/user/tokens/verify');
  if(!userToken)await status('account-token-validity','/accounts/'+expectedAccount+'/tokens/verify');
  await status('target-account-access','/accounts/'+expectedAccount);
  await status('workers-read-access','/accounts/'+expectedAccount+'/workers/scripts');
}
