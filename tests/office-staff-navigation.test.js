import test from 'node:test';
import assert from 'node:assert/strict';
import {matchingStaff,nextMatchingStaff} from '../src/office-staff-navigation.js';
import {initialOfficeLayout,changeOfficeStatus} from '../src/office-layout.js';
test('search by Thai name or role without changing desk order',()=>{
 const layout=initialOfficeLayout();
 assert.equal(matchingStaff(layout,'นักวิจัย').length,1);
 assert.equal(matchingStaff(layout,'วิเคราะห์กฎหมาย').length,1);
 assert.equal(matchingStaff(layout,'').length,7);
 assert.deepEqual(layout,initialOfficeLayout());
});
test('filter by working walking or resting and navigate matching staff',()=>{
 let layout=initialOfficeLayout();
 layout=changeOfficeStatus(layout,layout[0].id,'walking').layout;
 layout=changeOfficeStatus(layout,layout[1].id,'walking').layout;
 assert.equal(matchingStaff(layout,'','walking').length,2);
 assert.equal(nextMatchingStaff(layout,'','walking',layout[0].id,1),layout[1].id);
 assert.equal(nextMatchingStaff(layout,'','walking',layout[0].id,-1),layout[1].id);
 assert.equal(nextMatchingStaff(layout,'none','walking',layout[0].id),null);
});
test('reject invalid search or filter inputs',()=>{
 assert.deepEqual(matchingStaff(initialOfficeLayout(),'','invalid'),[]);
 assert.deepEqual(matchingStaff(initialOfficeLayout(),null,'all'),[]);
});
