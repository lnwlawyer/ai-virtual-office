import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeServer} from '../local-bridge/server.js';
import {validateBridgeJob} from '../src/local-agent-bridge-contract.js';
const token='test-token-that-is-longer-than-32-characters';
const payload={version:1,agentRole:'developer',prompt:'Review repository status'};
test('bridge validates roles, prompt and data-only protocol',()=>{
 assert.equal(validateBridgeJob(payload).ok,true);
 assert.equal(validateBridgeJob({...payload,agentRole:'shell'}).ok,false);
 assert.equal(validateBridgeJob({...payload,prompt:' '}).ok,false);
});
test('bridge is authenticated, loopback-only and manually resolves jobs',async()=>{
 const bridge=createBridgeServer({token,port:0});
 const {port}=await bridge.listen();
 const url='http://127.0.0.1:'+port;
 const request=(path,options={})=>fetch(url+path,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});
 try{
  assert.equal((await fetch(url+'/v1/health')).status,401);
  assert.equal((await request('/v1/health',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal((await request('/v1/health')).status,200);
  const invalid=await request('/v1/jobs',{method:'POST',body:JSON.stringify({...payload,agentRole:'terminal'})});
  assert.equal(invalid.status,400);
  const created=await request('/v1/jobs',{method:'POST',body:JSON.stringify(payload)});
  assert.equal(created.status,201);
  const {id}=await created.json();
  assert.equal((await (await request('/v1/jobs/'+id)).json()).status,'queued');
  assert.equal((await request('/v1/jobs/'+id+'/result',{method:'POST',body:JSON.stringify({status:'completed',content:'Reviewed'})})).status,200);
  assert.equal((await (await request('/v1/jobs/'+id)).json()).content,'Reviewed');
  assert.equal((await request('/v1/jobs/'+id+'/result',{method:'POST',body:JSON.stringify({status:'completed',content:'again'})})).status,409);
 }finally{await bridge.close()}
});
test('bridge refuses network binding',()=>assert.throws(()=>createBridgeServer({host:'0.0.0.0',token}),/loopback/));
