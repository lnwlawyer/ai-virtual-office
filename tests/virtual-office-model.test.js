import test from 'node:test';
import assert from 'node:assert/strict';
import {STAFF,ROOM_THEMES,validateBackgroundFile,validRoomTheme} from '../src/virtual-office-model.js';
test('seven unique Thai staff roles with stable IDs',()=>{
 assert.equal(STAFF.length,7);
 assert.equal(new Set(STAFF.map(x=>x.id)).size,7);
 for(const staff of STAFF){assert.match(staff.name,/[ก-๙]/);assert.ok(staff.role);}
});
test('safe background file types and size bounds',()=>{
 assert.equal(validateBackgroundFile({type:'image/png',size:100}).ok,true);
 assert.equal(validateBackgroundFile({type:'image/webp',size:100}).ok,true);
 assert.equal(validateBackgroundFile({type:'image/svg+xml',size:100}).ok,false);
 assert.equal(validateBackgroundFile({type:'image/jpeg',size:4*1024*1024}).ok,false);
 assert.equal(validateBackgroundFile(null).ok,false);
});
test('preset room themes are bounded',()=>{
 assert.equal(ROOM_THEMES.length,3);
 assert.equal(validRoomTheme('mint'),true);
 assert.equal(validRoomTheme('unexpected'),false);
});
