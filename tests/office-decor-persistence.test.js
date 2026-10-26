import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSnapshot,validateRoomSnapshot} from '../src/office-room-storage.js';
import {initialOfficeLayout} from '../src/office-layout.js';
import {DEFAULT_DECOR} from '../src/office-decor.js';
test('decor persists in snapshots',()=>{
 const snapshot=createRoomSnapshot('mint',false,initialOfficeLayout(),['plant','lamp']);
 assert.equal(snapshot.ok,true);
 assert.deepEqual(snapshot.value.decor,['plant','lamp']);
});
test('old snapshots without decor remain readable',()=>{
 const old={version:1,theme:'daylight',moving:true,layout:initialOfficeLayout()};
 const loaded=validateRoomSnapshot(old);
 assert.equal(loaded.ok,true);
 assert.deepEqual(loaded.value.decor,DEFAULT_DECOR);
});
test('unknown or duplicate decor is rejected',()=>{
 assert.equal(createRoomSnapshot('daylight',true,initialOfficeLayout(),['unsafe']).ok,false);
 assert.equal(createRoomSnapshot('daylight',true,initialOfficeLayout(),['plant','plant']).ok,false);
});
