import test from 'node:test';
import assert from 'node:assert/strict';
import {walkingStaff,walkingLaneDuration,walkingLaneDelay} from '../src/office-walking-lane.js';
import {initialOfficeLayout} from '../src/office-layout.js';
test('walking corridor only includes staff set to walking',()=>{
 const layout=initialOfficeLayout();layout[1].status='walking';layout[3].status='walking';
 assert.deepEqual(walkingStaff(layout).map(x=>x.id),[layout[1].id,layout[3].id]);
 assert.deepEqual(walkingStaff(null),[]);
});
test('walking speed maps to safe corridor durations',()=>{
 assert.equal(walkingLaneDuration('slow'),'16s');
 assert.equal(walkingLaneDuration('normal'),'9s');
 assert.equal(walkingLaneDuration('fast'),'5s');
 assert.equal(walkingLaneDuration('unknown'),'9s');
 assert.equal(walkingLaneDelay(2),'-3.4s');
});
