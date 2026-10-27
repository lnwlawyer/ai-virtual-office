import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_GATEWAY_ROLES,createMockAIRequest,mockAIResponse,validateAIResponse} from '../src/ai-gateway-contract.js';
test('all seven roles can execute a zero-cost local mock roundtrip',()=>{
 for(const role of AI_GATEWAY_ROLES){
  const req=createMockAIRequest(role,'ทดสอบงาน');
  assert.equal(req.ok,true);
  const result=mockAIResponse(req.request);
  assert.equal(result.ok,true);
  assert.equal(result.response.estimatedCostBaht,0);
  assert.equal(result.response.provider,'mock');
  assert.equal(validateAIResponse(result.response).ok,true);
 }
});
test('rejects invalid roles, empty prompts, oversize prompts and malformed responses',()=>{
 assert.equal(createMockAIRequest('unknown','hello').ok,false);
 assert.equal(createMockAIRequest('legal','  ').ok,false);
 assert.equal(createMockAIRequest('legal','x'.repeat(8001)).ok,false);
 assert.equal(mockAIResponse({version:1,agentRole:'unknown',prompt:'hello'}).ok,false);
 assert.equal(validateAIResponse({version:1,agentRole:'legal',status:'completed',content:'ok',provider:'mock',estimatedCostBaht:-1}).ok,false);
});
