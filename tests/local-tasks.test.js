import test from 'node:test';
import assert from 'node:assert/strict';
import {createTask,updateTaskStatus,taskSummary,safeExportTasks} from '../src/local-tasks.js';
test('task creation rejects invalid input',()=>{
  assert.equal(createTask(' ').ok,false);
  assert.equal(createTask('x'.repeat(161)).ok,false);
  assert.equal(createTask('Draft briefing','urgent').ok,false);
  assert.equal(createTask(' Draft briefing ').task.title,'Draft briefing');
});
test('task status and summary are deterministic',()=>{
  const a=createTask('Prepare note').task;
  const b=updateTaskStatus(a,'done').task;
  assert.equal(a.status,'todo');
  assert.deepEqual(taskSummary([a,b]),{ok:true,total:2,todo:1,inProgress:0,done:1});
  assert.equal(updateTaskStatus(a,'invalid').ok,false);
});
test('export contains no external calls or arbitrary fields',()=>{
  const content=safeExportTasks([{title:'Note',priority:'high',status:'todo',secret:'do-not-export'}]).content;
  assert.equal(content.includes('do-not-export'),false);
  assert.equal(JSON.parse(content).schemaVersion,1);
});
