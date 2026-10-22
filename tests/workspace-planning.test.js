import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePrompt,buildPreviewPlan,budgetStatus,safeDocumentMetadata,AGENT_ROLES} from '../src/workspace-planning.js';
test('prompt validates empty and overlong input',()=>{
  assert.equal(validatePrompt(' ').ok,false);
  assert.equal(validatePrompt('a'.repeat(8001)).ok,false);
  assert.equal(validatePrompt('  hello  ').value,'hello');
});
test('preview plans never execute AI requests',()=>{
  const plan=buildPreviewPlan('Compare',['openai','gemini'],'draft a memo');
  assert.equal(plan.ok,true);assert.equal(plan.execution,'disabled');assert.equal(plan.estimatedCostBaht,null);
  assert.equal(buildPreviewPlan('Single',['openai','gemini'],'hello').ok,false);
  assert.equal(buildPreviewPlan('Team',['unknown'],'hello').ok,false);
});
test('budget guard stops at threshold',()=>{
  assert.equal(budgetStatus(499).blocked,false);
  assert.equal(budgetStatus(500).blocked,true);
  assert.equal(budgetStatus(501).remaining,0);
  assert.equal(budgetStatus(-1).ok,false);
});
test('documents accept metadata only; no upload',()=>{
  assert.equal(safeDocumentMetadata('law.pdf',100,'application/pdf').storage,'none');
  assert.equal(safeDocumentMetadata('bad.exe',100,'application/octet-stream').ok,false);
  assert.equal(safeDocumentMetadata('big.pdf',21*1024*1024,'application/pdf').ok,false);
  assert.equal(AGENT_ROLES.length,7);
});
