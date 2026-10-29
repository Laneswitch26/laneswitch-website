export const schools = new Set(['a1','emre','test']);
export const hex = (b:ArrayBuffer|Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
export const unhex = (s:string) => Uint8Array.from(s.match(/.{2}/g)||[],c=>parseInt(c,16));
export async function digest(s:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));}
export function equal(a:string,b:string){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
export async function verify(password:string,salt:string,hash:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return equal(hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:100000,hash:'SHA-256'},key,256)),hash);}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export function validData(input:unknown): Record<string,unknown> {
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Ungültige Angaben.');
 const raw=input as Record<string,unknown>;const data:Record<string,unknown>={};
 for(const k of ['name','tagline','address','email','phone','website','hours','classes','registration','training','exam','after','notice','priceDate']){if(raw[k]!==undefined&&typeof raw[k]!=='string')throw new Error('Ungültige Angaben.');const v=(raw[k] as string||'').trim();if(v.length>12000)throw new Error('Text zu lang.');data[k]=v;}
 if(data.website&&!/^https?:\/\//i.test(data.website as string))throw new Error('Website bitte mit https:// eingeben.');
 const logo=raw.logo||'';if(typeof logo!=='string'||logo.length>410000||(logo&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo)))throw new Error('Nur PNG-Logos bis 300 KB sind erlaubt.');if(logo&&!logo.startsWith('data:image/png;base64,iVBORw0KGgo'))throw new Error('Ungültiges PNG.');data.logo=logo;
 if(!Array.isArray(raw.prices||[])||(raw.prices as unknown[]||[]).length>60)throw new Error('Maximal 60 Preispositionen.');data.prices=(raw.prices as Record<string,unknown>[]||[]).map(p=>{if(!p||typeof p!=='object')throw new Error('Ungültiger Preis.');const row:Record<string,string>={};for(const k of ['label','amount','unit']){if(typeof p[k]!=='string'&&typeof p[k]!=='number')throw new Error('Ungültiger Preis.');row[k]=String(p[k]).slice(0,200);}return row;});
 if(!Array.isArray(raw.documents||[])||(raw.documents as unknown[]||[]).length>5)throw new Error('Maximal fünf Dokumente.');data.documents=(raw.documents as Record<string,unknown>[]||[]).map(d=>{if(!d||typeof d.id!=='string'||!/^[-a-f0-9]{36}$/.test(d.id)||typeof d.name!=='string')throw new Error('Ungültiges Dokument.');return {id:d.id,name:d.name.slice(0,150)};});
 return data;
}

// ---- Registrierung, Admin und Partner (Migration 0002) ----
export const ADMIN='_admin';
// Feste Kürzel der Bestandsfahrschulen für Rabattcodes.
export const staticCodes:Record<string,string>={a1:'A1',emre:'EMRE',test:'TEST'};
// Pfade unter /navigator/, die nie als Fahrschul-Adresse vergeben werden.
export const reservedSlugs=new Set(['zugang','demo','admin','registrierung','assets','app','api','navigator','login','test','a1','emre']);
export const PBKDF2_ITERATIONS=100000;
export async function hashPassword(password:string){const salt=hex(crypto.getRandomValues(new Uint8Array(16)));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:PBKDF2_ITERATIONS,hash:'SHA-256'},key,256));return {salt,hash};}
export function slugify(name:string){return name.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40).replace(/-+$/,'');}
export const validSlug=(s:string)=>/^[a-z0-9][a-z0-9-]{1,39}$/.test(s)&&!reservedSlugs.has(s);
export const validUsername=(s:string)=>/^[a-z0-9][a-z0-9._-]{2,39}$/.test(s);
export const validPassword=(s:string)=>typeof s==='string'&&s.length>=12&&s.length<=200;
export const validCode=(s:string)=>/^[A-Z0-9]{2,20}$/.test(s);
export function codeFromName(name:string){const words=name.toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS').normalize('NFKD').replace(/[^A-Z0-9 ]+/g,' ').split(/\s+/).filter(w=>w&&w!=='FAHRSCHULE');return (words.join('')||'FS').slice(0,16);}
export function benefitCode(partnerCode:string,schoolCode:string,discount:string){return [partnerCode,schoolCode,discount].filter(Boolean).join('-');}
const text=(v:unknown,max:number,label:string)=>{if(v===undefined||v===null)return '';if(typeof v!=='string')throw new Error('Ungültige Angaben: '+label+'.');const t=v.trim();if(t.length>max)throw new Error('Angabe zu lang: '+label+'.');return t;};
export function validPartner(input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Ungültige Angaben.');
 const r=input as Record<string,unknown>;
 const p={name:text(r.name,120,'Name'),code:text(r.code,20,'Kürzel').toUpperCase(),discount:text(r.discount,8,'Rabatt'),services:text(r.services,3000,'Leistungen'),benefitSchool:text(r.benefitSchool,2000,'Vorteil Fahrschule'),benefitStudents:text(r.benefitStudents,2000,'Vorteil Fahrschüler'),conditions:text(r.conditions,2000,'Bedingungen'),validUntil:text(r.validUntil,60,'Gültig bis'),contactName:text(r.contactName,120,'Ansprechpartner'),phone:text(r.phone,60,'Telefon'),email:text(r.email,160,'E-Mail'),website:text(r.website,300,'Website'),logo:typeof r.logo==='string'?r.logo:''};
 if(!p.name)throw new Error('Bitte einen Firmennamen eingeben.');
 if(!validCode(p.code))throw new Error('Kürzel bitte mit 2 bis 20 Großbuchstaben oder Ziffern, ohne Leerzeichen.');
 if(p.discount&&!/^\d{1,3}$/.test(p.discount))throw new Error('Rabatt bitte als ganze Zahl in Prozent, z. B. 5.');
 if(p.discount&&(Number(p.discount)<1||Number(p.discount)>100))throw new Error('Rabatt bitte zwischen 1 und 100 Prozent.');
 if(p.website&&!/^https?:\/\//i.test(p.website))throw new Error('Website bitte mit https:// eingeben.');
 if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
 if(p.logo&&(p.logo.length>410000||!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/=]+$/.test(p.logo)))throw new Error('Nur PNG-Logos bis 300 KB sind erlaubt.');
 return p;
}
export type Partner=ReturnType<typeof validPartner>;
