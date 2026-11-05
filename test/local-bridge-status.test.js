import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeServer} from '../local-bridge/server.js';
import {buildBridgeStatus} from '../local-bridge/status.js';
const token='status-test-token-longer-than-thirty-two-chars';
test('status summarizes jobs without exposing prompts or tokens',async()=>{
 const bridge=createBridgeServer({token,port:0});
 const {port}=await bridge.listen();
 const url='http://127.0.0.1:'+port;
 const request=(path,method='GET',body)=>fetch(url+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 try{
  assert.equal((await fetch(url+'/v1/status')).status,401);
  const created=await (await request('/v1/jobs','POST',{version:1,agentRole:'developer',prompt:'Private prompt'})).json();
  const status=await (await request('/v1/status')).json();
  assert.equal(status.totals.all,1);
  assert.equal(status.totals.awaiting_approval,1);
  assert.equal(status.connectedDevices,0);
  assert.equal(status.agents.find(agent=>agent.id==='developer').pendingApproval,1);
  assert.equal(status.recent[0].id,created.id);
  assert.equal(JSON.stringify(status).includes('Private prompt'),false);
  assert.equal(JSON.stringify(status).includes(token),false);
  await request('/v1/jobs/'+created.id+'/decision','POST',{decision:'reject'});
  const after=await (await request('/v1/status')).json();
  assert.equal(after.totals.rejected,1);
 }finally{await bridge.close()}
});
test('empty status is explicitly disconnected',()=>{
 const status=buildBridgeStatus(new Map());
 assert.equal(status.agents.length,7);
 assert.ok(status.agents.every(agent=>agent.connection==='not_connected'));
 assert.equal(status.connectedDevices,0);
});
