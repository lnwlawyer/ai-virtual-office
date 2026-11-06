import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWorkflow,runWorkflow,WORKFLOW_STAGES} from '../local-bridge/multi-agent-workflow.js';
test('multi-agent workflow executes four sequential text stages with handoff',async()=>{
 const prompt='WORKFLOW_V1:'+JSON.stringify({version:1,goal:'จัดทำสรุปแผนงาน'});
 const calls=[];
 const result=await runWorkflow(prompt,{model:'mock',generate:async text=>{calls.push(text);return 'ผลขั้นที่ '+calls.length}});
 assert.equal(calls.length,4);
 assert.deepEqual(WORKFLOW_STAGES,['analyst','writer','reviewer','manager']);
 assert.match(calls[1],/ผลขั้นที่ 1/);
 assert.match(calls[3],/ผลขั้นที่ 3/);
 assert.match(result,/manager/);
});
test('invalid workflow is rejected',()=>{
 assert.equal(parseWorkflow('normal job'),null);
 assert.throws(()=>parseWorkflow('WORKFLOW_V1:{}'),/Invalid workflow goal/);
 assert.throws(()=>parseWorkflow('WORKFLOW_V1:bad'),/Invalid workflow JSON/);
});

test('reviewer revision keeps bridge progress stages within route length',async()=>{
 const prompt='WORKFLOW_V2:'+JSON.stringify({version:2,goal:'วิเคราะห์ข้อกฎหมายเกี่ยวกับที่ดิน',route:'legal'});
 const progress=[];
 let reviewCount=0;
 const result=await runWorkflow(prompt,{
  model:'mock',
  generate:async text=>{
   if(text.includes('VERDICT: PASS หรือ VERDICT: REVISE'))return ++reviewCount===1?'VERDICT: REVISE\\nเพิ่มข้อจำกัด':'VERDICT: PASS';
   return 'ข้อเท็จจริงและข้อกฎหมาย: วิเคราะห์ข้อมูลที่มี พร้อมข้อจำกัดและข้อสรุป';
  },
  onProgress:async item=>{
   assert.ok(item.stage>=1&&item.stage<=item.total,'Bridge rejects out-of-range stage');
   progress.push(item);
  }
 });
 assert.equal(reviewCount,2);
 assert.match(result,/รายงานฉบับสุดท้าย/);
 assert.ok(progress.some(item=>item.role==='writer'&&item.status==='running'));
});
