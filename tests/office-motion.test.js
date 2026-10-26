import test from 'node:test';
import assert from 'node:assert/strict';
import {MOTION_SPEEDS,validMotionSpeed,motionDuration} from '../src/office-motion.js';
test('movement speeds are bounded to known CSS durations',()=>{
 assert.equal(MOTION_SPEEDS.length,3);
 assert.equal(validMotionSpeed('slow'),true);
 assert.equal(validMotionSpeed('normal'),true);
 assert.equal(validMotionSpeed('fast'),true);
 assert.equal(validMotionSpeed('0s;url(x)'),false);
 assert.equal(motionDuration('slow'),'6s');
 assert.equal(motionDuration('fast'),'1.6s');
 assert.equal(motionDuration('unknown'),'3.2s');
});
