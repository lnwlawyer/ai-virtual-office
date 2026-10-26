import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSnapshot,readRoomSnapshot,saveRoomSnapshot,removeRoomSnapshot,OFFICE_STORAGE_KEY} from '../src/office-room-storage.js';
import {initialOfficeLayout} from '../src/office-layout.js';
test('save and restore valid room without background image or unknown fields',()=>{
 const map=new Map();const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const layout=initialOfficeLayout();layout[0].name='หัวหน้าสำนักงาน';
 assert.equal(saveRoomSnapshot(storage,'mint',false,layout).ok,true);
 const loaded=readRoomSnapshot(storage);
 assert.equal(loaded.ok,true);
 assert.equal(loaded.value.theme,'mint');
 assert.equal(loaded.value.layout[0].name,'หัวหน้าสำนักงาน');
 assert.equal(JSON.stringify(loaded.value).includes('background'),false);
 assert.equal(removeRoomSnapshot(storage).ok,true);
 assert.equal(map.has(OFFICE_STORAGE_KEY),false);
});
test('reject corrupt, duplicate or oversized room snapshots',()=>{
 const layout=initialOfficeLayout();
 assert.equal(createRoomSnapshot('bad',true,layout).ok,false);
 assert.equal(createRoomSnapshot('mint',true,[...layout.slice(0,-1),layout[0]]).ok,false);
 assert.equal(readRoomSnapshot({getItem:()=>'{'}).ok,false);
 assert.equal(readRoomSnapshot({getItem:()=> 'x'.repeat(12001)}).ok,false);
});
test('storage failures do not crash',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(readRoomSnapshot(storage).ok,false);
 assert.equal(saveRoomSnapshot(storage,'daylight',true,initialOfficeLayout()).ok,false);
 assert.equal(removeRoomSnapshot(storage).ok,false);
});
