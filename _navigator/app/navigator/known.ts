// Bekannte, bereits öffentliche Angaben aus den LANE-SWITCH-Partnerprofilen
// (laneswitch.online/konzept/kooperationen/fahrschulen/…), Stand 29.10.2026.
// Nur Grunddaten des Schritts „Profil“. Werden ausschließlich auf Knopfdruck
// in den Entwurf übernommen und bleiben danach frei bearbeitbar.
export type KnownKey='name'|'address'|'classes'|'phone'|'email'|'website'|'hours';
export type KnownProfile={source:string,values:Partial<Record<KnownKey,string>>};

export const knownLabels:Record<KnownKey,string>={
 name:'Name der Fahrschule',address:'Anschrift',classes:'Führerscheinklassen',phone:'Telefon',
 email:'E-Mail',website:'Website',hours:'Öffnungszeiten / Erreichbarkeit'
};

export const knownProfiles:Record<string,KnownProfile>={
 a1:{source:'deinem LANE-SWITCH-Partnerprofil',values:{
  name:'A1 Fahrschule',
  address:'Hauptstraße 173, 44652 Herne (Wanne-Eickel)',
  classes:'B, B Automatik, BE, B96, A1, A2, A, AM, Mofa',
  phone:'02325 300 71 25',
  email:'info@fahrschule-a1.de',
  website:'https://fahrschule-a1.de/',
  hours:'Büro: Mo. bis Do. 16:00 bis 19:00 Uhr · Theorieunterricht: Mo., Di. und Do. 19:00 bis 20:30 Uhr'
 }},
 emre:{source:'deinem LANE-SWITCH-Partnerprofil',values:{
  name:'Fahrschule Emre',
  address:'Hauptstraße 204, 44649 Herne · Bahnhofstraße 124, 44629 Herne · Große-Perdekamp-Straße 19, 45657 Recklinghausen',
  classes:'B, BF17, B78, B197, BE, B96, A1, A2, A, B196',
  phone:'02325 559 42 99',
  email:'info@fahrschule-emre.de',
  website:'https://fahrschule-emre.de/',
  hours:'Büro Hauptstraße und Recklinghausen: Mo. bis Do. 12:30 bis 18:30 Uhr, Fr. 10:00 bis 15:00 Uhr · Büro Bahnhofstraße (Tel. 02323 919 60 20): Mo. bis Do. 10:00 bis 18:30 Uhr, Fr. 10:00 bis 15:00 Uhr · Theorieunterricht: Mo. bis Do. 18:30 bis 20:00 Uhr'
 }},
 // Testzugang: erkennbar fiktive Beispielwerte, damit die Übernahme ausprobiert werden kann.
 test:{source:'den Beispielangaben des Testbereichs',values:{
  name:'Beispiel-Fahrschule (Test)',
  address:'Musterstraße 1, 12345 Musterstadt',
  classes:'B, BE, A',
  phone:'01234 567890',
  email:'info@example.com',
  website:'https://example.com/',
  hours:'Mo. bis Fr. 10:00 bis 18:00 Uhr'
 }}
};

export type ImportPlan={fill:KnownKey[],conflicts:KnownKey[]};
export function planImport(current:Record<string,unknown>,profile:KnownProfile):ImportPlan{
 const fill:KnownKey[]=[],conflicts:KnownKey[]=[];
 for(const [k,v] of Object.entries(profile.values) as [KnownKey,string][]){
  const now=String(current[k]??'').trim();
  if(!now)fill.push(k);else if(now!==v.trim())conflicts.push(k);
 }
 return {fill,conflicts};
}
export function applyImport(current:Record<string,unknown>,profile:KnownProfile,keys:KnownKey[]){
 const next:Record<string,string>={};for(const k of keys){const v=profile.values[k];if(v!==undefined)next[k]=v;}return next;
}
export function fileSlug(name:string,fallback:string){
 const s=name.replace(/ä/g,'ae').replace(/Ä/g,'Ae').replace(/ö/g,'oe').replace(/Ö/g,'Oe').replace(/ü/g,'ue').replace(/Ü/g,'Ue').replace(/ß/g,'ss').normalize('NFKD').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
 return s||fallback;
}
