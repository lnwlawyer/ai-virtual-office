import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowV2,parseWorkflow,workflowRoles,runWorkflow,routeWorkflow} from '../local-bridge/multi-agent-workflow.js';
test('V2 selects bounded role routes by goal',()=>{
 assert.equal(routeWorkflow('ตรวจสอบกฎหมายที่ดิน'),'legal');
 assert.deepEqual(workflowRoles(parseWorkflow(createWorkflowV2('ตรวจสอบกฎหมายที่ดิน'))),['legal','writer','reviewer','manager']);
 assert.deepEqual(workflowRoles(parseWorkflow(createWorkflowV2('แก้บั๊กเว็บไซต์'))),['developer','reviewer','manager']);
 assert.deepEqual(workflowRoles(parseWorkflow(createWorkflowV2('ออกแบบ UI'))),['designer','reviewer','manager']);
 assert.deepEqual(workflowRoles(parseWorkflow(createWorkflowV2('แผนประจำวัน'))),['analyst','writer','reviewer','manager']);
});
test('V2 rejects tampered role routing',()=>{
 assert.throws(()=>parseWorkflow('WORKFLOW_V2:'+JSON.stringify({version:2,goal:'แก้บั๊กเว็บไซต์',route:'legal'})),/Invalid workflow route/);
});
test('V2 reports stage progress sequentially',async()=>{
 const events=[];const result=await runWorkflow(createWorkflowV2('แก้บั๊กเว็บไซต์'),{model:'mock',generate:async prompt=>prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE')?'VERDICT: PASS\nผ่าน':'ผลลัพธ์',onProgress:async p=>events.push(p)});
 assert.equal(events.length,6);assert.deepEqual(events.map(e=>e.status),['running','completed','running','completed','running','completed']);
 assert.equal(events[5].stage,3);assert.match(result,/manager/);
});
