import {env} from 'cloudflare:workers';
import {digest,hex,equal,verify,sameOrigin,validData,schools,ADMIN,staticCodes,hashPassword,slugify,validSlug,validUsername,validPassword,validCode,codeFromName,benefitCode,validPartner,type Partner} from './security';
export const dynamic='force-dynamic';
const cookieName='__Host-nav';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
const reply=(data:unknown,status=200,extra:Record<string,string>={})=>Response.json(data,{status,headers:{...headers,...extra}});
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const DAY=86400000;
// Meldungen dieser Klasse werden unverändert an die Oberfläche gegeben.
class PublicError extends Error{constructor(message:string,public status=400){super(message);}}

type Account={username:string,school:string,salt:string,hash:string};
type Session={school:string,csrf:string,expires:number,account_version:string,token:string};
type SchoolRow={school:string,name:string,code:string,approved:number,disabled:number,created:number};
const db=()=>env.DB;

// ---- Konten ----
// Feste Konten (A1, Emre, Test, Admin) kommen gehasht aus dem Secret NAV_ACCOUNTS.
function staticAccounts():Account[]{try{return JSON.parse((env as unknown as Record<string,string>).NAV_ACCOUNTS||'[]').filter((x:Account)=>(schools.has(x.school)||x.school===ADMIN)&&/^[a-f0-9]{32,128}$/.test(x.salt)&&/^[a-f0-9]{64}$/.test(x.hash));}catch{return [];}}
// Registrierte Fahrschulen liegen in D1. Gesperrte Fahrschulen haben kein gültiges Konto.
async function registeredBy(field:'username'|'school',value:string):Promise<Account|null>{return await db().prepare(`SELECT a.username,a.school,a.salt,a.hash FROM nav_accounts a JOIN nav_schools s ON s.school=a.school WHERE a.${field}=? AND s.disabled=0`).bind(value).first<Account>()||null;}
async function accountForUsername(username:string){return staticAccounts().find(x=>x.username.toLowerCase()===username)||await registeredBy('username',username);}
async function accountForSchool(school:string){return staticAccounts().find(x=>x.school===school)||(schools.has(school)||school===ADMIN?null:await registeredBy('school',school));}
async function usernameTaken(username:string){return staticAccounts().some(x=>x.username.toLowerCase()===username)||['admin','a1','emre','test'].includes(username)||!!await db().prepare('SELECT 1 FROM nav_accounts WHERE username=?').bind(username).first();}
async function schoolRow(school:string){return await db().prepare('SELECT * FROM nav_schools WHERE school=?').bind(school).first<SchoolRow>();}
// Öffentlich sichtbar: Bestandsfahrschulen (außer Test) oder registrierte, freigegebene, nicht gesperrte Fahrschulen.
async function publicSchool(school:string){if(school==='test'||school===ADMIN)return false;if(schools.has(school))return true;const row=await schoolRow(school);return !!row&&row.approved===1&&row.disabled===0;}
async function schoolCode(school:string){if(staticCodes[school])return staticCodes[school];return (await schoolRow(school))?.code||'';}

async function session(req:Request){const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=await db().prepare('SELECT * FROM nav_sessions WHERE token=? AND expires>?').bind(await digest(token),Date.now()).first<Session>();if(!row)return null;const a=await accountForSchool(row.school);if(!a||await digest(a.hash)!==row.account_version)return null;return row;}
async function startSession(school:string,hash:string){const now=Date.now(),token=random(),s:Session={token:await digest(token),school,csrf:random(),expires:now+8*3600000,account_version:await digest(hash)};await db().batch([db().prepare('INSERT INTO nav_sessions (token,school,csrf,expires,account_version) VALUES (?,?,?,?,?)').bind(s.token,s.school,s.csrf,s.expires,s.account_version),db().prepare('DELETE FROM nav_sessions WHERE expires<?').bind(now),db().prepare('DELETE FROM nav_throttle WHERE until<?').bind(now)]);return {s,cookie:`${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`};}
async function state(s:Session){
 if(s.school===ADMIN)return {admin:true,school:ADMIN,csrf:s.csrf};
 const row=await db().prepare('SELECT * FROM nav_documents WHERE school=?').bind(s.school).first<{draft:string,published:string|null,listed:number}>();const files=await db().prepare('SELECT id,name FROM nav_files WHERE school=?').bind(s.school).all();
 const reg=schools.has(s.school)?null:await schoolRow(s.school);
 return {school:s.school,data:row?JSON.parse(row.draft):{},published:!!row?.published,listed:!!row?.listed,csrf:s.csrf,files:files.results,registered:!!reg,approved:reg?reg.approved===1:true};
}
async function ownsDocs(school:string,data:Record<string,unknown>){for(const f of data.documents as {id:string}[]){if(!await db().prepare('SELECT id FROM nav_files WHERE id=? AND school=?').bind(f.id,school).first())throw new Error('Dokument gehört nicht zu diesem Zugang.');}}
// Einfache Bremse gegen Durchprobieren (wie beim Login), je Schlüssel und Zeitfenster von 15 Minuten.
async function throttle(key:string,limit:number){const now=Date.now();await db().prepare('DELETE FROM nav_throttle WHERE until<?').bind(now).run();const k=await digest(key);await db().prepare('INSERT INTO nav_throttle (key,count,until) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(k,now+900000).run();const row=await db().prepare('SELECT count FROM nav_throttle WHERE key=?').bind(k).first<{count:number}>();if((row?.count||0)>limit)throw new PublicError('Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.',429);}

// ---- Partner und Vorteile ----
async function partners(activeOnly:boolean){const rows=await db().prepare(`SELECT id,data,active,updated FROM nav_partners${activeOnly?' WHERE active=1':''} ORDER BY updated DESC`).all<{id:string,data:string,active:number,updated:number}>();return rows.results.map(r=>({id:r.id,active:r.active===1,updated:r.updated,...JSON.parse(r.data) as Partner}));}
async function benefitsFor(school:string){const code=await schoolCode(school);return (await partners(true)).map(p=>({...p,benefitCode:benefitCode(p.code,code,p.discount)}));}

// ---- Admin ----
async function adminOverview(){
 const docs=(await db().prepare('SELECT school,published IS NOT NULL AS published,listed,updated FROM nav_documents').all<{school:string,published:number,listed:number,updated:number}>()).results;
 const doc=(s:string)=>docs.find(d=>d.school===s);
 const fixed=['a1','emre','test'].map(s=>({school:s,name:s==='a1'?'A1 Fahrschule':s==='emre'?'Fahrschule Emre':'Testzugang',code:staticCodes[s],fixed:true,approved:s!=='test',disabled:false,created:0,published:!!doc(s)?.published,listed:!!doc(s)?.listed,updated:doc(s)?.updated||0,username:s}));
 const reg=(await db().prepare('SELECT s.*,a.username FROM nav_schools s LEFT JOIN nav_accounts a ON a.school=s.school ORDER BY s.created DESC').all<SchoolRow&{username:string|null}>()).results.map(r=>({school:r.school,name:r.name,code:r.code,fixed:false,approved:r.approved===1,disabled:r.disabled===1,created:r.created,published:!!doc(r.school)?.published,listed:!!doc(r.school)?.listed,updated:doc(r.school)?.updated||0,username:r.username||''}));
 const invites=(await db().prepare('SELECT school,name,code,expires,created,used FROM nav_invites WHERE used IS NULL AND expires>? ORDER BY created DESC').bind(Date.now()).all()).results;
 return {schools:[...fixed,...reg],invites,partners:await partners(false)};
}
async function createInvite(body:Record<string,unknown>,origin:string){
 const days=Math.min(60,Math.max(1,Number(body.days)||14));
 let school=String(body.school||'').trim(),name=String(body.name||'').trim().slice(0,120),code=String(body.code||'').trim().toUpperCase();
 if(school){
  // Neuer Zugangslink für eine bereits registrierte Fahrschule (z. B. Passwort vergessen). Daten bleiben erhalten.
  const row=await schoolRow(school);if(!row)throw new PublicError('Fahrschule nicht gefunden.',404);name=row.name;code=row.code;
 }else{
  if(name.length<3)throw new PublicError('Bitte den Namen der Fahrschule eingeben.');
  code=code||codeFromName(name);if(!validCode(code))throw new PublicError('Kürzel bitte mit 2 bis 20 Großbuchstaben oder Ziffern.');
  if(Object.values(staticCodes).includes(code)||await db().prepare('SELECT 1 FROM nav_schools WHERE code=? UNION SELECT 1 FROM nav_invites WHERE code=? AND used IS NULL AND expires>?').bind(code,code,Date.now()).first())throw new PublicError('Dieses Kürzel ist bereits vergeben. Bitte ein anderes wählen.');
  const base=slugify(name)||'fahrschule';school=validSlug(base)?base:'fahrschule-'+base;
  for(let i=2;!validSlug(school)||await db().prepare('SELECT 1 FROM nav_schools WHERE school=? UNION SELECT 1 FROM nav_invites WHERE school=? AND used IS NULL AND expires>?').bind(school,school,Date.now()).first();i++){school=(base.slice(0,36)+'-'+i);if(i>50)throw new PublicError('Bitte einen eindeutigeren Namen wählen.');}
 }
 // Nur ein offener Link je Fahrschule: ältere Links werden ungültig.
 await db().prepare('UPDATE nav_invites SET used=0 WHERE school=? AND used IS NULL').bind(school).run();
 const token=random(),now=Date.now();
 await db().prepare('INSERT INTO nav_invites (token,school,name,code,expires,created,used) VALUES (?,?,?,?,?,?,NULL)').bind(await digest(token),school,name,code,now+days*DAY,now).run();
 // Der Schlüssel steht hinter „#“ und wird so nie an einen Server oder in Protokolle übertragen.
 return {link:origin+'/navigator/registrierung#'+token,school,name,code,expires:now+days*DAY};
}
async function adminAction(action:string,body:Record<string,unknown>,origin:string){
 if(action==='adminOverview')return adminOverview();
 if(action==='createInvite')return createInvite(body,origin);
 if(action==='revokeInvite'){await db().prepare('UPDATE nav_invites SET used=0 WHERE school=? AND used IS NULL').bind(String(body.school||'')).run();return adminOverview();}
 if(action==='setSchool'){const school=String(body.school||'');const row=await schoolRow(school);if(!row)throw new PublicError('Nur registrierte Fahrschulen können hier geändert werden.',404);
  const approved=typeof body.approved==='boolean'?(body.approved?1:0):row.approved,disabled=typeof body.disabled==='boolean'?(body.disabled?1:0):row.disabled;
  await db().prepare('UPDATE nav_schools SET approved=?,disabled=? WHERE school=?').bind(approved,disabled,school).run();
  if(disabled)await db().prepare('DELETE FROM nav_sessions WHERE school=?').bind(school).run();return adminOverview();}
 if(action==='savePartner'){const p=validPartner(body.data);const id=typeof body.id==='string'&&/^[-a-f0-9]{36}$/.test(body.id)?body.id:crypto.randomUUID();
  if((await partners(false)).some(x=>x.id!==id&&x.code===p.code))throw new PublicError('Dieses Firmenkürzel ist bereits vergeben.');
  await db().prepare('INSERT INTO nav_partners (id,data,active,updated) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,active=excluded.active,updated=excluded.updated').bind(id,JSON.stringify(p),body.active===false?0:1,Date.now()).run();return adminOverview();}
 // Registrierte Fahrschule endgültig löschen: Zugang, Sitzungen, Navigator-Inhalte, Unterlagen, Einladungen, Profil.
 // Zur Sicherheit muss der Name der Fahrschule exakt mitgeschickt werden. Feste Konten (A1, Emre, Test) sind ausgenommen.
 if(action==='deleteSchool'){const school=String(body.school||'');const row=await schoolRow(school);if(!row)throw new PublicError('Nur registrierte Fahrschulen können gelöscht werden.',404);
  if(String(body.confirm||'').trim()!==row.name)throw new PublicError('Zum Löschen bitte den Namen der Fahrschule exakt eingeben.');
  await db().batch(['nav_sessions','nav_files','nav_documents','nav_accounts','nav_invites','nav_schools'].map(t=>db().prepare(`DELETE FROM ${t} WHERE school=?`).bind(school)));
  return adminOverview();}
 if(action==='deletePartner'){await db().prepare('DELETE FROM nav_partners WHERE id=?').bind(String(body.id||'')).run();return adminOverview();}
 throw new PublicError('Unbekannte Aktion.');
}

// ---- Registrierung über Einladungslink ----
async function openInvite(token:unknown){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;return await db().prepare('SELECT * FROM nav_invites WHERE token=? AND used IS NULL AND expires>?').bind(await digest(token),Date.now()).first<{token:string,school:string,name:string,code:string}>();}
async function register(body:Record<string,unknown>){
 const invite=await openInvite(body.token);if(!invite)throw new PublicError('Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet. Bitte fordere bei LANE SWITCH einen neuen Link an.',404);
 const username=String(body.username||'').trim().toLowerCase(),password=String(body.password||'');
 if(!validUsername(username))throw new PublicError('Benutzername: 3 bis 40 Zeichen, Kleinbuchstaben, Ziffern sowie . _ - erlaubt.');
 if(!validPassword(password))throw new PublicError('Passwort: mindestens 12 und höchstens 200 Zeichen.');
 if(body.consent!==true)throw new PublicError('Bitte bestätige die Hinweise zur Registrierung.');
 const existing=await db().prepare('SELECT username FROM nav_accounts WHERE school=?').bind(invite.school).first<{username:string}>();
 if(existing?.username!==username&&await usernameTaken(username))throw new PublicError('Dieser Benutzername ist bereits vergeben.');
 // Link verbrauchen; nur eine gleichzeitige Anfrage kann gewinnen.
 const used=await db().prepare('UPDATE nav_invites SET used=? WHERE token=? AND used IS NULL AND expires>?').bind(Date.now(),invite.token,Date.now()).run();
 if(!used.meta.changes)throw new PublicError('Dieser Link wurde bereits verwendet.',409);
 const {salt,hash}=await hashPassword(password),now=Date.now();
 try{await db().batch([
  db().prepare('INSERT INTO nav_schools (school,name,code,approved,disabled,created) VALUES (?,?,?,0,0,?) ON CONFLICT(school) DO NOTHING').bind(invite.school,invite.name,invite.code,now),
  db().prepare('INSERT INTO nav_accounts (school,username,salt,hash,created) VALUES (?,?,?,?,?) ON CONFLICT(school) DO UPDATE SET username=excluded.username,salt=excluded.salt,hash=excluded.hash').bind(invite.school,username,salt,hash,now),
  db().prepare('DELETE FROM nav_sessions WHERE school=?').bind(invite.school),
  db().prepare('INSERT INTO nav_documents (school,draft,listed,updated) VALUES (?,?,0,?) ON CONFLICT(school) DO NOTHING').bind(invite.school,JSON.stringify({name:invite.name}),now)
 ]);}catch{await db().prepare('UPDATE nav_invites SET used=NULL WHERE token=?').bind(invite.token).run();throw new PublicError('Registrierung fehlgeschlagen. Bitte einen anderen Benutzernamen wählen oder später erneut versuchen.');}
 return startSession(invite.school,hash);
}

export async function GET(req:Request){try{const u=new URL(req.url),action=u.searchParams.get('action');if(action==='public'){const school=u.searchParams.get('school')||'';if(!/^[a-z0-9-]{1,40}$/.test(school)||!await publicSchool(school))return reply({error:'Nicht gefunden.'},404);const row=await db().prepare('SELECT published,listed FROM nav_documents WHERE school=?').bind(school).first<{published:string|null,listed:number}>();if(!row?.published)return reply({error:'Nicht veröffentlicht.'},404);return reply({school,data:JSON.parse(row.published),listed:!!row.listed},200);}
 // Öffentliches Verzeichnis: nur freigegebene, veröffentlichte und im Profil verlinkte registrierte Fahrschulen.
 if(action==='directory'){const rows=(await db().prepare('SELECT s.school,d.published FROM nav_schools s JOIN nav_documents d ON d.school=s.school WHERE s.approved=1 AND s.disabled=0 AND d.published IS NOT NULL AND d.listed=1 ORDER BY s.name').all<{school:string,published:string}>()).results;return reply({schools:rows.map(r=>{const d=JSON.parse(r.published);return {school:r.school,name:d.name||'',tagline:d.tagline||'',address:d.address||'',classes:d.classes||'',logo:d.logo||''};})});}
 if(action==='file'){const id=u.searchParams.get('id')||'',school=u.searchParams.get('school');let owner:string;if(school){if(!/^[a-z0-9-]{1,40}$/.test(school)||!await publicSchool(school))return reply({error:'Nicht gefunden.'},404);const r=await db().prepare('SELECT published FROM nav_documents WHERE school=?').bind(school).first<{published:string|null}>();if(!r?.published||!JSON.parse(r.published).documents.some((d:{id:string})=>d.id===id))return reply({error:'Nicht gefunden.'},404);owner=school;}else{const s=await session(req);if(!s||s.school===ADMIN)return reply({error:'Bitte anmelden.'},401);owner=s.school;}
 const f=await db().prepare('SELECT bytes,name FROM nav_files WHERE id=? AND school=?').bind(id,owner).first<{bytes:ArrayBuffer,name:string}>();if(!f)return reply({error:'Nicht gefunden.'},404);return new Response(f.bytes,{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="dokument.pdf"; filename*=UTF-8''${encodeURIComponent(f.name)}`,'Content-Security-Policy':"sandbox; default-src 'none'"}});}
 const s=await session(req);if(!s)return reply({error:'Bitte anmelden.'},401);
 if(action==='benefits'){if(s.school===ADMIN)return reply({error:'Nicht verfügbar.'},400);return reply({benefits:await benefitsFor(s.school)});}
 return reply(await state(s));}catch{return reply({error:'Der Navigator ist vorübergehend nicht verfügbar.'},503);}}
async function bounded(req:Request){const reader=req.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let total=0;while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>1500000){await reader.cancel();throw new Error('BODY_LIMIT');}chunks.push(value);}const out=new Uint8Array(total);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;}
export async function POST(req:Request){try{if(!sameOrigin(req))return reply({error:'Ungültiger Ursprung.'},403);if(Number(req.headers.get('content-length')||0)>1500000)return reply({error:'Datei zu groß.'},413);
 const rawBody=await bounded(req);const safeReq=new Request(req.url,{method:'POST',headers:req.headers,body:rawBody});const u=new URL(req.url);const upload=u.searchParams.get('action')==='upload';const body=upload?{}:await safeReq.json() as Record<string,unknown>;const action=upload?'upload':String(body.action||'');
 const ip=req.headers.get('cf-connecting-ip')||'unknown';
 if(action==='login'){const username=String(body.username||'').trim().toLowerCase(),password=String(body.password||'');if(username.length>80||password.length>200)return reply({error:'Anmeldung fehlgeschlagen.'},401);
 const now=Date.now();await db().prepare('DELETE FROM nav_throttle WHERE until<?').bind(now).run();const ipKey=await digest('ip:'+ip);await db().prepare('INSERT INTO nav_throttle (key,count,until) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(ipKey,now+900000).run();const ipCount=await db().prepare('SELECT count FROM nav_throttle WHERE key=?').bind(ipKey).first<{count:number}>();if((ipCount?.count||0)>40)return reply({error:'Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.'},429);const key=await digest('account:'+username);await db().prepare('INSERT INTO nav_throttle (key,count,until) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END, until=CASE WHEN until<? THEN excluded.until ELSE until END').bind(key,now+900000,now,now).run();const limit=await db().prepare('SELECT count FROM nav_throttle WHERE key=?').bind(key).first<{count:number}>();if((limit?.count||0)>8)return reply({error:'Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.'},429);
 const a=await accountForUsername(username);const ok=await verify(password,a?.salt||'0'.repeat(32),a?.hash||'0'.repeat(64));if(!a||!ok)return reply({error:'Benutzername oder Passwort falsch.'},401);
 const {s,cookie}=await startSession(a.school,a.hash);return reply(await state(s),200,{'Set-Cookie':cookie});}
 // Einladungslink prüfen und registrieren: ohne Anmeldung, aber gebremst.
 if(action==='inviteInfo'){await throttle('invite:'+ip,30);const invite=await openInvite(body.token);if(!invite)return reply({error:'Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet. Bitte fordere bei LANE SWITCH einen neuen Link an.'},404);const renewal=!!await db().prepare('SELECT 1 FROM nav_accounts WHERE school=?').bind(invite.school).first();return reply({name:invite.name,renewal});}
 if(action==='register'){await throttle('register:'+ip,10);const {s,cookie}=await register(body);return reply(await state(s),200,{'Set-Cookie':cookie});}
 const s=await session(req);if(!s)return reply({error:'Bitte anmelden.'},401);if(!equal(req.headers.get('x-csrf-token')||'',s.csrf))return reply({error:'Sicherheitsprüfung fehlgeschlagen. Bitte neu anmelden.'},403);
 if(action==='logout'){await db().prepare('DELETE FROM nav_sessions WHERE token=?').bind(s.token).run();return reply({ok:true},200,{'Set-Cookie':`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});}
 // Admin und Fahrschulen haben strikt getrennte Aktionen.
 if(s.school===ADMIN)return reply(await adminAction(action,body,new URL(req.url).origin));
 if(action==='upload'){const form=await safeReq.formData(),file=form.get('file');if(!(file instanceof File)||file.size>1024*1024||file.size<5||file.type!=='application/pdf')return reply({error:'Bitte eine PDF bis 1 MB auswählen.'},400);const bytes=await file.arrayBuffer();if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return reply({error:'Ungültige PDF-Datei.'},400);const id=crypto.randomUUID(),name=file.name.replace(/[\x00-\x1f"\\/]/g,'').slice(0,150)||'Unterlage.pdf';const result=await db().prepare('INSERT INTO nav_files (id,school,name,bytes,size,created) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM nav_files WHERE school=?)<5').bind(id,s.school,name,bytes,file.size,Date.now(),s.school).run();if(!result.meta.changes)return reply({error:'Maximal fünf Dateien. Bitte zuerst eine ungenutzte Datei löschen.'},409);return reply({id,name});}
 if(action==='deleteFile'){const row=await db().prepare('SELECT published FROM nav_documents WHERE school=?').bind(s.school).first<{published:string|null}>();if(row?.published&&JSON.parse(row.published).documents.some((d:{id:string})=>d.id===body.id))return reply({error:'Das Dokument ist veröffentlicht. Bitte zuerst aus der Veröffentlichung entfernen.'},409);await db().prepare('DELETE FROM nav_files WHERE id=? AND school=?').bind(String(body.id||''),s.school).run();return reply({ok:true});}
 if(action==='save'||action==='publish'){if(action==='publish'&&s.school==='test')return reply({error:'Der Testzugang kann nicht öffentlich veröffentlichen.'},403);if(JSON.stringify(body.data).length>500000)return reply({error:'Angaben zu umfangreich.'},413);const data=validData(body.data);await ownsDocs(s.school,data);const serialized=JSON.stringify(data);if(action==='publish'){if(!data.name)return reply({error:'Bitte einen Fahrschulnamen eingeben.'},400);await db().prepare('INSERT INTO nav_documents (school,draft,published,listed,updated) VALUES (?,?,?,?,?) ON CONFLICT(school) DO UPDATE SET draft=excluded.draft,published=excluded.published,listed=excluded.listed,updated=excluded.updated').bind(s.school,serialized,serialized,body.listed===true?1:0,Date.now()).run();}else{await db().prepare('INSERT INTO nav_documents (school,draft,listed,updated) VALUES (?,?,0,?) ON CONFLICT(school) DO UPDATE SET draft=excluded.draft,updated=excluded.updated').bind(s.school,serialized,Date.now()).run();}return reply(await state(s));}
 if(action==='unpublish'){await db().prepare('UPDATE nav_documents SET published=NULL,listed=0,updated=? WHERE school=?').bind(Date.now(),s.school).run();return reply(await state(s));}return reply({error:'Unbekannte Aktion.'},400);
 }catch(e){if(e instanceof Error&&e.message==='BODY_LIMIT')return reply({error:'Datei zu groß.'},413);if(e instanceof PublicError)return reply({error:e.message},e.status);return reply({error:e instanceof Error&&(/Ungültig|Nur PNG|Logo|lang|Website|Preis|Dokument|Maximal|Bitte|Kürzel|Rabatt|E-Mail/.test(e.message))?e.message:'Aktion konnte nicht abgeschlossen werden.'},400);}}
