import test from 'node:test';
import assert from 'node:assert/strict';
import {initialOfficeLayout,renameOfficeStaff,changeOfficeStatus,moveOfficeStaff,resetOfficeLayout} from '../src/office-layout.js';
test('seven staff retain stable identities and safe names',()=>{
 const original=initialOfficeLayout();
 assert.equal(original.length,7);
 const renamed=renameOfficeStaff(original,original[0].id,'ผู้จัดการใหม่');
 assert.equal(renamed.ok,true);
 assert.equal(renamed.layout[0].name,'ผู้จัดการใหม่');
 assert.equal(original[0].name,'ผู้จัดการสำนักงาน');
 assert.equal(renameOfficeStaff(original,original[0].id,' ').ok,false);
 assert.equal(renameOfficeStaff(original,original[0].id,'ก'.repeat(41)).ok,false);
});
test('walking, working and resting statuses are validated',()=>{
 const layout=initialOfficeLayout();
 assert.equal(changeOfficeStatus(layout,layout[0].id,'walking').layout[0].status,'walking');
 assert.equal(changeOfficeStatus(layout,layout[0].id,'unknown').ok,false);
});
test('reordering preserves all staff and enforces boundaries',()=>{
 const layout=initialOfficeLayout();
 assert.equal(moveOfficeStaff(layout,layout[0].id,-1).ok,false);
 const moved=moveOfficeStaff(layout,layout[0].id,1);
 assert.equal(moved.ok,true);
 assert.equal(moved.layout[1].id,layout[0].id);
 assert.deepEqual(resetOfficeLayout(),initialOfficeLayout());
});
