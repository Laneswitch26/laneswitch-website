import test from 'node:test';
import assert from 'node:assert/strict';
import {stat,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {withSecretsFile} from '../scripts/secrets-file.mjs';
test('Secret file is private, readable by the real child process and removed on success',async()=>{
  let used;
  await withSecretsFile({NAV_ACCOUNTS:'hashed-fixture'},async path=>{
    used=path;assert.equal((await stat(path)).mode&0o777,0o600);
    const r=spawnSync(process.execPath,['-e',"const fs=require('node:fs'); const j=JSON.parse(fs.readFileSync(process.argv[1])); process.exit(j.NAV_ACCOUNTS==='hashed-fixture'?0:1)",path],{encoding:'utf8'});
    assert.equal(r.status,0);
  });
  await assert.rejects(readFile(used),{code:'ENOENT'});
});
test('Secret file is removed if deployment fails',async()=>{
  let used;
  await assert.rejects(withSecretsFile({NAV_ACCOUNTS:'hashed-fixture'},path=>{used=path;throw Error('deployment failed');}),/deployment failed/);
  await assert.rejects(readFile(used),{code:'ENOENT'});
});
