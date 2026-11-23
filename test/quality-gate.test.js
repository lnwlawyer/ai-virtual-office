import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowV2,runWorkflow,reviewVerdict} from '../local-bridge/multi-agent-workflow.js';
test('quality gate parses only explicit reviewer verdicts',()=>{
 assert.equal(reviewVerdict('VERDICT: PASS\nตรวจแล้ว'),'PASS');
 assert.equal(reviewVerdict('ไม่แน่ใจ'),'REVISE');
 assert.equal(reviewVerdict('VERDICT: REVISE'),'REVISE');
 assert.equal(reviewVerdict('VERDICT: INSUFFICIENT_EVIDENCE\nไม่มีเอกสาร'),'INSUFFICIENT_EVIDENCE');
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
 assert.equal(calls.length,6);
 assert.match(result,/manager/);
 assert.match(result,/VERDICT: PASS/);
});
test('rejected reviews return unapproved draft without calling manager',async()=>{
 let calls=0;
 let reviews=0;
 const result=await runWorkflow(createWorkflowV2('แก้บั๊กเว็บไซต์'),{model:'mock',generate:async prompt=>{
  calls++;
  if(prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE')){reviews++;return 'VERDICT: REVISE\\nยังผิด';}
  return 'ร่าง';
 }});
 assert.equal(reviews,3);
 assert.equal(calls,6);
 assert.match(result,/ยังไม่ผ่านการตรวจสอบคุณภาพ/);
 assert.match(result,/ยังผิด/);
 assert.doesNotMatch(result,/รายงานฉบับสุดท้าย \(ผ่านการตรวจทานภายใน AI\)/);
});
test('V1 remains compatible with unstructured reviewer response',async()=>{
 let count=0;
 await runWorkflow('WORKFLOW_V1:'+JSON.stringify({version:1,goal:'แผนทั่วไป'}),{model:'mock',generate:async()=>{count++;return 'ok'}});
 assert.equal(count,4);
});

test('legal workflow halts on missing evidence without futile revisions or manager approval',async()=>{
 const calls=[];
 const result=await runWorkflow(createWorkflowV2('ตรวจสอบกฎหมายที่ดิน'),{model:'mock',generate:async prompt=>{
  calls.push(prompt);
  if(prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE'))return 'VERDICT: INSUFFICIENT_EVIDENCE\\nไม่มีเอกสารกฎหมายต้นทางที่ตรวจสอบได้';
  return 'ข้อเท็จจริงและข้อกฎหมายที่ยังไม่ยืนยัน';
 }});
 assert.equal(calls.length,3);
 assert.match(result,/ข้อมูลหลักฐานไม่เพียงพอ/);
 assert.match(result,/ไม่มีเอกสารกฎหมายต้นทาง/);
 assert.doesNotMatch(result,/รายงานฉบับสุดท้าย \\(ผ่านการตรวจทานภายใน AI\\)/);
});
