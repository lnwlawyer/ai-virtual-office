import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeServer} from '../local-bridge/server.js';
const token='approval-test-token-with-more-than-32-characters';
const payload={version:1,agentRole:'developer',prompt:'Summarize the changes'};
test('bridge requires an explicit approval and rejects repeated decisions/results',async()=>{
 const bridge=createBridgeServer({token,port:0});
 const {port}=await bridge.listen();
 const url='http://127.0.0.1:'+port;
 const request=(path,method='GET',body)=>fetch(url+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 try{
  const created=await request('/v1/jobs','POST',payload);
  assert.equal(created.status,201);
  const {id}=await created.json();
  assert.equal((await (await request('/v1/jobs/'+id)).json()).status,'awaiting_approval');
  assert.equal((await request('/v1/jobs/'+id+'/result','POST',{status:'completed',content:'unsafe'})).status,409);
  assert.equal((await request('/v1/jobs/'+id+'/decision','POST',{decision:'invalid'})).status,400);
  assert.equal((await request('/v1/jobs/'+id+'/decision','POST',{decision:'approve'})).status,200);
  assert.equal((await request('/v1/jobs/'+id+'/decision','POST',{decision:'reject'})).status,409);
  assert.equal((await request('/v1/jobs/'+id+'/result','POST',{status:'completed',content:'Done'})).status,200);
  assert.equal((await request('/v1/jobs/'+id+'/result','POST',{status:'completed',content:'Again'})).status,409);
  const rejected=await (await request('/v1/jobs','POST',payload)).json();
  assert.equal((await request('/v1/jobs/'+rejected.id+'/decision','POST',{decision:'reject'})).status,200);
  assert.equal((await request('/v1/jobs/'+rejected.id+'/result','POST',{status:'completed',content:'No'})).status,409);
 }finally{await bridge.close()}
});
