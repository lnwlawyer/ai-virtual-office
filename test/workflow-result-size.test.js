import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeServer} from '../local-bridge/server.js';
test('Bridge accepts long Thai workflow results but keeps job requests bounded',async()=>{
 const token='a'.repeat(64), bridge=createBridgeServer({token,port:0});
 const addr=await bridge.listen(),base='http://127.0.0.1:'+addr.port;
 const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()}};
 try{
  const created=await post('/v1/jobs',{version:1,agentRole:'manager',prompt:'ทดสอบ'});
  assert.equal(created.status,201);
  const id=created.data.id;
  assert.equal((await post('/v1/jobs/'+id+'/decision',{decision:'approve'})).status,200);
  const content='สรุปผลการวิเคราะห์กฎหมายไทย '.repeat(400);
  assert.ok(Buffer.byteLength(JSON.stringify({status:'completed',content}))>12000);
  assert.ok(content.length<20000);
  const done=await post('/v1/jobs/'+id+'/result',{status:'completed',content});
  assert.equal(done.status,200);
  assert.equal(done.data.status,'completed');
  const tooBig=await post('/v1/jobs',{version:1,agentRole:'manager',prompt:'ก'.repeat(5000)});
  assert.equal(tooBig.status,413);
 }finally{await bridge.close()}
});
