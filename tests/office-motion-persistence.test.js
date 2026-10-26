import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSnapshot,validateRoomSnapshot} from '../src/office-room-storage.js';
import {exportRoomJSON,importRoomJSON} from '../src/office-room-transfer.js';
import {initialOfficeLayout} from '../src/office-layout.js';
test('walking speed survives save and JSON transfer',()=>{
 const layout=initialOfficeLayout();
 const saved=createRoomSnapshot('mint',true,layout,['plant'],{},'fast');
 assert.equal(saved.ok,true);
 assert.equal(saved.value.motionSpeed,'fast');
 const portable=exportRoomJSON('mint',true,layout,['plant'],{},'slow');
 assert.equal(importRoomJSON(portable.content).value.motionSpeed,'slow');
});
test('older snapshots default to normal speed',()=>{
 const old={version:1,theme:'daylight',moving:true,layout:initialOfficeLayout()};
 assert.equal(validateRoomSnapshot(old).value.motionSpeed,'normal');
});
test('unapproved motion speed is rejected',()=>{
 assert.equal(createRoomSnapshot('daylight',true,initialOfficeLayout(),['plant'],{},'unsafe').ok,false);
});
