import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBridgeServer} from '../local-bridge/server.js';
const token='persistent-test-token-with-more-than-32-chars';
test('approved and completed jobs survive bridge restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bridge-store-'));
 const storagePath=join(dir,'jobs.json');
 const start=async()=>{const bridge=createBridgeServer({token,port:0,storagePath});const {port}=await bridge.listen();const call=(path,method='GET',body)=>fetch('http://127.0.0.1:'+port+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {bridge,call}};
 try{
  const first=await start();
  const created=await (await first.call('/v1/jobs','POST',{version:1,agentRole:'developer',prompt:'Review code'})).json();
  assert.equal((await first.call('/v1/jobs/'+created.id+'/decision','POST',{decision:'approve'})).status,200);
  await first.bridge.close();
  const second=await start();
  assert.equal((await (await second.call('/v1/jobs/'+created.id)).json()).status,'approved');
  assert.equal((await second.call('/v1/jobs/'+created.id+'/result','POST',{status:'completed',content:'Reviewed'})).status,200);
  await second.bridge.close();
  const third=await start();
  assert.equal((await (await third.call('/v1/jobs/'+created.id)).json()).content,'Reviewed');
  await third.bridge.close();
  const saved=JSON.parse(await readFile(storagePath,'utf8'));
  assert.equal(saved.jobs.length,1);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('corrupted state fails closed rather than starting with empty jobs',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bridge-corrupt-'));
 const storagePath=join(dir,'jobs.json');
 try{
  const {writeFile}=await import('node:fs/promises');
  await writeFile(storagePath,'{broken');
  const bridge=createBridgeServer({token,port:0,storagePath});
  await assert.rejects(bridge.listen());
 }finally{await rm(dir,{recursive:true,force:true})}
});
