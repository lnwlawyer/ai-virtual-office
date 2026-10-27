import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_SLOT_PREFIX,saveRoomSlot,readRoomSlot,removeRoomSlot,listRoomSlots,copyRoomSlot} from '../src/office-room-slots.js';
import {defaultRoomSnapshot} from '../src/office-room-storage.js';
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('three named slots remain independent and preserve existing storage key',()=>{
 const s=storage(),a=defaultRoomSnapshot(),b={...a,theme:'mint'};
 assert.equal(saveRoomSlot(s,'1',a).ok,true);
 assert.equal(saveRoomSlot(s,'2',b).ok,true);
 assert.equal(readRoomSlot(s,'1').value.theme,'daylight');
 assert.equal(readRoomSlot(s,'2').value.theme,'mint');
 assert.equal(listRoomSlots(s).filter(x=>x.occupied).length,2);
 assert.equal(removeRoomSlot(s,'1').ok,true);
 assert.equal(readRoomSlot(s,'2').ok,true);
 assert.ok(ROOM_SLOT_PREFIX.endsWith(':'));
});
test('invalid slots, corrupted payload and invalid snapshots are rejected',()=>{
 const s=storage();
 assert.equal(saveRoomSlot(s,'__proto__',defaultRoomSnapshot()).ok,false);
 assert.equal(saveRoomSlot(s,'1',{version:1}).ok,false);
 s.setItem(ROOM_SLOT_PREFIX+'1','{');
 assert.equal(readRoomSlot(s,'1').ok,false);
});

test('copy slot requires explicit overwrite and never mutates source',()=>{
 const s=storage(),a=defaultRoomSnapshot(),b={...a,theme:'mint'};
 saveRoomSlot(s,'1',a);saveRoomSlot(s,'2',b);
 assert.equal(copyRoomSlot(s,'1','2').ok,false);
 assert.equal(readRoomSlot(s,'2').value.theme,'mint');
 assert.equal(copyRoomSlot(s,'1','2',{overwrite:true}).ok,true);
 assert.equal(readRoomSlot(s,'2').value.theme,'daylight');
 assert.equal(readRoomSlot(s,'1').value.theme,'daylight');
 assert.equal(copyRoomSlot(s,'1','1',{overwrite:true}).ok,false);
 assert.equal(copyRoomSlot(s,'3','2',{overwrite:true}).ok,false);
});
