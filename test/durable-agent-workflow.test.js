import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBridgeServer} from '../local-bridge/server.js';

test('Bridge preserves jobs and approval decisions across restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bridge-persistence-'));
 const path=join(dir,'state.json');
 const token='a'.repeat(64);
 const start=async()=>{const bridge=createBridgeServer({token,port:0,storagePath:path});const address=await bridge.listen();return {bridge,base:'http://127.0.0.1:'+address.port}};
 const request=async(base,route,method='GET',body)=>{
  const r=await fetch(base+route,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  assert.ok(r.ok,'HTTP '+r.status);return r.json();
 };
 let one;
 try{
  one=await start();
  const created=await request(one.base,'/v1/jobs','POST',{version:1,agentRole:'developer',prompt:'Review project status'});
  await request(one.base,'/v1/jobs/'+created.id+'/decision','POST',{decision:'approve'});
  await one.bridge.close();one=null;
  const two=await start();
  try{
   const job=await request(two.base,'/v1/jobs/'+created.id);
   assert.equal(job.status,'approved');
   assert.equal(job.prompt,'Review project status');
   const list=await request(two.base,'/v1/jobs');
   assert.equal(list.jobs.length,1);
  }finally{await two.bridge.close()}
 }finally{if(one)await one.bridge.close();await rm(dir,{recursive:true,force:true})}
});
