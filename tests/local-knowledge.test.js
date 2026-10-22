import test from 'node:test';
import assert from 'node:assert/strict';
import {createKnowledge,searchKnowledge,knowledgeSummary} from '../src/local-knowledge.js';
test('reject invalid entries and categories',()=>{
  assert.equal(createKnowledge('','body').ok,false);
  assert.equal(createKnowledge('Title','').ok,false);
  assert.equal(createKnowledge('Title','Body','other').ok,false);
  assert.equal(createKnowledge('Title','Body','law','x'.repeat(301)).ok,false);
});
test('search title, content and keywords with category filters',()=>{
  const a=createKnowledge('Land rules','Ownership','law','registry').item;
  const b=createKnowledge('Manual','How to file','guide','procedure').item;
  assert.equal(searchKnowledge([a,b],'REGISTRY').length,1);
  assert.equal(searchKnowledge([a,b],'file','guide').length,1);
  assert.equal(searchKnowledge([a,b],'','law').length,1);
  assert.equal(knowledgeSummary([a,b]).total,2);
});
