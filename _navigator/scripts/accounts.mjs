import {pbkdf2Sync,randomBytes} from 'node:crypto';
// All passwords come from GitHub Secrets. The optional test account is only
// created when NAV_TEST_PASSWORD is set; it can never publish content.
export function makeAccounts(environment){
  const passwords={a1:environment.NAV_A1_PASSWORD,emre:environment.NAV_EMRE_PASSWORD};
  if(environment.NAV_TEST_PASSWORD!==undefined&&environment.NAV_TEST_PASSWORD!=='')passwords.test=environment.NAV_TEST_PASSWORD;
  for(const school of Object.keys(passwords))if(typeof passwords[school]!=='string'||passwords[school].length<16||passwords[school].length>200)throw new Error('NAV_'+school.toUpperCase()+'_PASSWORD fehlt oder muss 16–200 Zeichen lang sein.');
  if(new Set(Object.values(passwords)).size!==Object.keys(passwords).length)throw new Error('Alle Navigator-Konten benötigen unterschiedliche Passwörter.');
  return Object.entries(passwords).map(([school,password])=>{const salt=randomBytes(16).toString('hex');return {username:school,school,salt,hash:pbkdf2Sync(password,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex')};});
}
