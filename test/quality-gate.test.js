import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowV2,runWorkflow,reviewVerdict} from '../local-bridge/multi-agent-workflow.js';
test('quality gate parses only explicit reviewer verdicts',()=>{
 assert.equal(reviewVerdict('VERDICT: PASS\nตรวจแล้ว'),'PASS');
 assert.equal(reviewVerdict('ไม่แน่ใจ'),'REVISE');
 assert.equal(reviewVerdict('VERDICT: REVISE'),'REVISE');
});
test('review rejection triggers one revision and second review before manager',async()=>{
 const calls=[];let reviews=0;
 const generate=async prompt=>{
  calls.push(prompt);
  if(prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE')){reviews++;return reviews===1?'VERDICT: REVISE\nปรับปรุงรายละเอียด':'VERDICT: PASS\nผ่านการตรวจ';}
  return 'ร่างผลลัพธ์';
 };
 const result=await runWorkflow(createWorkflowV2('สรุปกฎหมายที่ดิน'),{generate,model:'mock'});
 assert.equal(reviews,2);
 assert.equal(calls.length,7);
 assert.match(result,/manager/);
 assert.match(result,/VERDICT: PASS/);
});
test('two rejected reviews block manager',async()=>{
 let calls=0;
 await assert.rejects(runWorkflow(createWorkflowV2('แก้บั๊กเว็บไซต์'),{model:'mock',generate:async prompt=>{calls++;return prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE')?'VERDICT: REVISE\nยังผิด':'ร่าง';}}),/revision_limit/);
 assert.equal(calls,4);
});
test('V1 remains compatible with unstructured reviewer response',async()=>{
 let count=0;
 await runWorkflow('WORKFLOW_V1:'+JSON.stringify({version:1,goal:'แผนทั่วไป'}),{model:'mock',generate:async()=>{count++;return 'ok'}});
 assert.equal(count,4);
});
