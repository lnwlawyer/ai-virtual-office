import test from 'node:test';
import assert from 'node:assert/strict';
import {runWorkflow} from '../local-bridge/multi-agent-workflow.js';
const prompt='WORKFLOW_V1:'+JSON.stringify({version:1,goal:'ทดสอบ'});
test('reports failing second stage without leaking backend errors',async()=>{
 let calls=0;
 await assert.rejects(runWorkflow(prompt,{model:'mock',generate:async()=>{calls++;if(calls===2)throw new Error('Ollama returned HTTP 404');return 'ok'}}),/Workflow failed at writer \(model_not_found\)/);
 assert.equal(calls,2);
});
test('reports empty response at first stage',async()=>{
 await assert.rejects(runWorkflow(prompt,{model:'mock',generate:async()=>''}),/Workflow failed at analyst \(empty_response\)/);
});
