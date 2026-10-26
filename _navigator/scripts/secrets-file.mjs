import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Wrangler opens a file path; /dev/stdin is not reopenable for Node child-process sockets.
// Use a private, short-lived file on the ephemeral runner, outside the repository.
export async function withSecretsFile(secrets,callback){
  const directory=await mkdtemp(join(tmpdir(),'navigator-secrets-'));
  const file=join(directory,'secrets.json');
  try{
    await writeFile(file,JSON.stringify(secrets),{mode:0o600,flag:'wx'});
    return await callback(file);
  }finally{await rm(directory,{recursive:true,force:true});}
}
