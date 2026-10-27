import test from 'node:test';
import assert from 'node:assert/strict';
import {getOfficeStorage} from '../src/office-safe-storage.js';
import {readRoomSnapshot,saveRoomSnapshot,removeRoomSnapshot,defaultRoomSnapshot} from '../src/office-room-storage.js';
import {readRoomSlot,saveRoomSlot,removeRoomSlot,listRoomSlots} from '../src/office-room-slots.js';
test('blocked localStorage getter does not crash room rendering',()=>{
 const blocked={get localStorage(){throw new Error('SecurityError')}};
 assert.equal(getOfficeStorage(blocked),null);
 assert.equal(getOfficeStorage(null),null);
 assert.equal(listRoomSlots(getOfficeStorage(blocked)).length,3);
 assert.equal(listRoomSlots(null).some(x=>x.occupied),false);
});
test('unavailable storage never reports false success',()=>{
 const room=defaultRoomSnapshot();
 assert.equal(readRoomSnapshot(null).ok,false);
 assert.equal(saveRoomSnapshot(null,room.theme,room.moving,room.layout,room.decor,room.avatars,room.motionSpeed).ok,false);
 assert.equal(removeRoomSnapshot(null).ok,false);
 assert.equal(readRoomSlot(null,'1').ok,false);
 assert.equal(saveRoomSlot(null,'1',room).ok,false);
 assert.equal(removeRoomSlot(null,'1').ok,false);
});
test('storage object with denied methods returns a controlled error',()=>{
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')},removeItem(){throw Error('denied')}};
 const room=defaultRoomSnapshot();
 assert.equal(getOfficeStorage({localStorage:denied}),denied);
 assert.equal(readRoomSlot(denied,'1').ok,false);
 assert.equal(saveRoomSlot(denied,'1',room).ok,false);
 assert.equal(removeRoomSlot(denied,'1').ok,false);
});
