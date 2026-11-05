import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeServer} from '../local-bridge/server.js';
import {fetchStatusReport} from '../local-bridge/export-status.js';
const token='export-status-test-token-more-than-32-characters';
test('exports sanitized status without bearer token or prompt content',async()=>{
 const bridge=createBridgeServer({token,port:0});
 const {port}=await bridge.listen();
 try{
  const response=await fetch('http://127.0.0.1:'+port+'/v1/jobs',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({version:1,agentRole:'legal',prompt:'Private legal details'})});
  assert.equal(response.status,201);
  const report=await fetchStatusReport({token,port});
  assert.equal(report.totals.all,1);
  assert.equal(report.totals.awaiting_approval,1);
  const serialized=JSON.stringify(report);
  assert.equal(serialized.includes(token),false);
  assert.equal(serialized.includes('Private legal details'),false);
  await assert.rejects(fetchStatusReport({token:'wrong',port}));
 }finally{await bridge.close()}
});
