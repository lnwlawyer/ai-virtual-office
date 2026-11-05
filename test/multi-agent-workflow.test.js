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
