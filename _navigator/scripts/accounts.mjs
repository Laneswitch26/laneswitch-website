import {pbkdf2Sync,randomBytes} from 'node:crypto';
// All passwords come from GitHub Secrets. The optional test account is only
// created when NAV_TEST_PASSWORD is set; it can never publish content.
export function makeAccounts(environment){
  const passwords={a1:environment.NAV_A1_PASSWORD,emre:environment.NAV_EMRE_PASSWORD};
  if(environment.NAV_TEST_PASSWORD!==undefined&&environment.NAV_TEST_PASSWORD!=='')passwords.test=environment.NAV_TEST_PASSWORD;
  for(const school of Object.keys(passwords))if(typeof passwords[school]!=='string'||passwords[school].length<16||passwords[school].length>200)throw new Error('NAV_'+school.toUpperCase()+'_PASSWORD fehlt oder muss 16–200 Zeichen lang sein.');
  if(new Set(Object.values(passwords)).size!==Object.keys(passwords).length)throw new Error('Alle Navigator-Konten benötigen unterschiedliche Passwörter.');
  const rows=Object.entries(passwords).map(([school,password])=>({username:school,school,password}));
  // Optionaler Admin-Zugang (Einladungen, Partnerfirmen, Freigaben) nur mit eigenem Secret.
  if(environment.NAV_ADMIN_PASSWORD!==undefined&&environment.NAV_ADMIN_PASSWORD!==''){
    const password=environment.NAV_ADMIN_PASSWORD,username=(environment.NAV_ADMIN_USER||'admin').trim().toLowerCase();
    if(typeof password!=='string'||password.length<16||password.length>200)throw new Error('NAV_ADMIN_PASSWORD muss 16–200 Zeichen lang sein.');
    if(Object.values(passwords).includes(password))throw new Error('Der Admin-Zugang benötigt ein eigenes Passwort.');
    if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)||['a1','emre','test'].includes(username))throw new Error('NAV_ADMIN_USER ist ungültig.');
    rows.push({username,school:'_admin',password});
  }
  return rows.map(({username,school,password})=>{const salt=randomBytes(16).toString('hex');return {username,school,salt,hash:pbkdf2Sync(password,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex')};});
}
