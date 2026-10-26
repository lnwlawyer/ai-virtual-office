import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultRoomSnapshot,validateRoomSnapshot} from '../src/office-room-storage.js';
import {initialOfficeLayout} from '../src/office-layout.js';
import {DEFAULT_DECOR} from '../src/office-decor.js';
test('complete room reset defaults are valid and consistent',()=>{
 const d=defaultRoomSnapshot();
 assert.equal(validateRoomSnapshot(d).ok,true);
 assert.equal(d.theme,'daylight');
 assert.equal(d.moving,true);
 assert.equal(d.motionSpeed,'normal');
 assert.deepEqual(d.layout,initialOfficeLayout());
 assert.deepEqual(d.decor,DEFAULT_DECOR);
 assert.deepEqual(d.avatars,{});
});
