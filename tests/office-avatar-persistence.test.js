import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSnapshot,validateRoomSnapshot} from '../src/office-room-storage.js';
import {exportRoomJSON,importRoomJSON} from '../src/office-room-transfer.js';
import {initialOfficeLayout} from '../src/office-layout.js';
import {STAFF} from '../src/virtual-office-model.js';
test('avatar styles persist and survive portable room JSON',()=>{
 const avatars={[STAFF[0].id]:'silver',[STAFF[1].id]:'warm'};
 const snapshot=createRoomSnapshot('mint',true,initialOfficeLayout(),['plant'],avatars);
 assert.equal(snapshot.ok,true);
 assert.deepEqual(snapshot.value.avatars,avatars);
 const portable=exportRoomJSON('mint',true,initialOfficeLayout(),['plant'],avatars);
 assert.deepEqual(importRoomJSON(portable.content).value.avatars,avatars);
});
test('old room snapshots without avatar styles load as classic defaults',()=>{
 const result=validateRoomSnapshot({version:1,theme:'daylight',moving:true,layout:initialOfficeLayout()});
 assert.equal(result.ok,true);
 assert.deepEqual(result.value.avatars,{});
});
test('reject unknown staff, unapproved styles and malformed avatar objects',()=>{
 for(const avatars of [{bad:'warm'},{[STAFF[0].id]:'url(x)'},['silver'],null]){
  assert.equal(createRoomSnapshot('daylight',true,initialOfficeLayout(),['plant'],avatars).ok,false);
 }
});
