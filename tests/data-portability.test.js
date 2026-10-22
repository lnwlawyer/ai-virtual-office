import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePortableBackup,exportPortableBackup} from '../src/data-portability.js';
test('empty backup is valid and portable',()=>{
 const result=exportPortableBackup([],[],[]);
 assert.equal(result.ok,true);
 assert.deepEqual(validatePortableBackup(result.content).summary,{tasks:0,outputs:0,knowledge:0});
});
test('reject malformed, unsupported and oversized backups',()=>{
 assert.equal(validatePortableBackup('{').ok,false);
 assert.equal(validatePortableBackup(JSON.stringify({schemaVersion:2,tasks:[],outputs:[],knowledge:[]})).ok,false);
 assert.equal(validatePortableBackup('x'.repeat(1024*1024+1)).ok,false);
});
test('reject invalid records and strip unknown properties',()=>{
 const backup=exportPortableBackup([{title:'task',priority:'normal',status:'todo',secret:'private'}],[],[]);
 assert.equal(backup.content.includes('private'),false);
 assert.equal(validatePortableBackup(JSON.stringify({schemaVersion:1,tasks:[{title:'x',priority:'normal',status:'bad'}],outputs:[],knowledge:[]})).ok,false);
});
