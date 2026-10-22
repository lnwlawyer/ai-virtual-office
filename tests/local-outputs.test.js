import test from 'node:test';
import assert from 'node:assert/strict';
import {createOutput,searchOutputs,exportOutputs} from '../src/local-outputs.js';
test('output validation protects length and type',()=>{
  assert.equal(createOutput('','body').ok,false);
  assert.equal(createOutput('title',' ').ok,false);
  assert.equal(createOutput('title','x'.repeat(20001)).ok,false);
  assert.equal(createOutput('title','body','other').ok,false);
});
test('search is case insensitive and type filtered',()=>{
  const a=createOutput('Land Brief','Legal analysis','analysis').output;
  const b=createOutput('Draft','Other','draft').output;
  assert.equal(searchOutputs([a,b],'LAND').length,1);
  assert.equal(searchOutputs([a,b],'','draft').length,1);
});
test('export strips unknown fields',()=>{
  const item={...createOutput('Title','Body').output,privateToken:'hidden'};
  const exported=exportOutputs([item]);
  assert.equal(exported.ok,true);
  assert.equal(exported.content.includes('hidden'),false);
});
