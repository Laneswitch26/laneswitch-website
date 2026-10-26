import {pbkdf2Sync,randomBytes} from 'node:crypto';
export function makeAccounts(environment){
  const passwords={a1:environment.NAV_A1_PASSWORD,emre:environment.NAV_EMRE_PASSWORD,test:'lane switch'};
  for(const school of ['a1','emre'])if(typeof passwords[school]!=='string'||passwords[school].length<16||passwords[school].length>200)throw new Error('NAV_'+school.toUpperCase()+'_PASSWORD fehlt oder muss 16–200 Zeichen lang sein.');
  if(passwords.a1===passwords.emre)throw new Error('A1 und Emre benötigen unterschiedliche Passwörter.');
  return Object.entries(passwords).map(([school,password])=>{const salt=randomBytes(16).toString('hex');return {username:school,school,salt,hash:pbkdf2Sync(password,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex')};});
}
