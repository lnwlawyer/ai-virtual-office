import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowV2,runWorkflow} from '../local-bridge/multi-agent-workflow.js';
test('legal stage Ollama error identifies stage',async()=>{await assert.rejects(runWorkflow(createWorkflowV2('กฎหมายที่ดิน'),{model:'mock',generate:async()=>{throw Error('Ollama returned HTTP 404')}}),/Workflow failed at legal \(model_not_found\)/)});
test('Bridge progress failure identifies stage',async()=>{await assert.rejects(runWorkflow(createWorkflowV2('กฎหมายที่ดิน'),{model:'mock',generate:async()=> 'ok',onProgress:async()=>{throw Error('Bridge returned HTTP 400')}}),/Workflow progress failed at legal \(bridge_error\)/)});
