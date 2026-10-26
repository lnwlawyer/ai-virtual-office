import test from 'node:test';
import assert from 'node:assert/strict';
import {MENU_LABELS,thaiMenu,thaiLabel} from '../src/thai-labels.js';
test('all ten navigation destinations have Thai labels',()=>{
 assert.equal(Object.keys(MENU_LABELS).length,10);
 for(const [key,value] of Object.entries(MENU_LABELS)){assert.match(value,/[ก-๙]/);assert.notEqual(key,value);}
});
test('internal IDs remain unchanged and fallbacks work',()=>{
 assert.equal(thaiMenu('Dashboard'),'ภาพรวมระบบ');
 assert.equal(thaiLabel('in-progress'),'กำลังดำเนินการ');
 assert.equal(thaiLabel('unrecognized'),'unrecognized');
});
