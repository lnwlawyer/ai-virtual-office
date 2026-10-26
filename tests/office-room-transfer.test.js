import test from 'node:test';
import assert from 'node:assert/strict';
import {exportRoomJSON,importRoomJSON,MAX_ROOM_IMPORT_BYTES} from '../src/office-room-transfer.js';
import {initialOfficeLayout} from '../src/office-layout.js';
test('round-trip office settings without image or secrets',()=>{
 const r=exportRoomJSON('mint',false,initialOfficeLayout(),['plant','lamp']);
 assert.equal(r.ok,true);
 const imported=importRoomJSON(r.content);
 assert.equal(imported.ok,true);
 assert.equal(imported.value.theme,'mint');
 assert.deepEqual(imported.value.decor,['plant','lamp']);
 assert.equal(r.content.includes('background'),false);
});
test('reject invalid, huge and tampered files',()=>{
 assert.equal(importRoomJSON('{broken').ok,false);
 assert.equal(importRoomJSON('x'.repeat(MAX_ROOM_IMPORT_BYTES+1)).ok,false);
 const r=exportRoomJSON('daylight',true,initialOfficeLayout(),['plant']);
 const changed=JSON.parse(r.content);changed.decor=['malicious'];
 assert.equal(importRoomJSON(JSON.stringify(changed)).ok,false);
});
