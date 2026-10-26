import test from 'node:test';
import assert from 'node:assert/strict';
import {exportPortableBackup,restorePortableBackup} from '../src/data-portability.js';
test('restore requires explicit confirmation',()=>{
 const raw=exportPortableBackup([],[],[]).content;
 assert.equal(restorePortableBackup(raw).ok,false);
 assert.equal(restorePortableBackup(raw,true).storage,'memory-only');
});
test('restore round-trips three modules and strips unexpected fields',()=>{
 const raw=exportPortableBackup([{title:'Task',priority:'high',status:'todo'}],[{title:'Memo',content:'Draft',type:'draft'}],[{title:'Law',body:'Text',category:'law',keywords:'land'}]).content;
 const result=restorePortableBackup(raw,true);
 assert.equal(result.ok,true);
 assert.deepEqual(result.summary,{tasks:1,outputs:1,knowledge:1});
 assert.equal(Object.keys(result.tasks[0]).length,3);
});
test('restore rejects malformed and unsupported versions',()=>{
 assert.equal(restorePortableBackup('bad',true).ok,false);
 assert.equal(restorePortableBackup('{"schemaVersion":9}',true).ok,false);
});
