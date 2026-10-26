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
