import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHistory,commitHistory,undoHistory,redoHistory,resetHistory,MAX_OFFICE_HISTORY} from '../src/office-layout-history.js';
test('undo and redo restore employee layout',()=>{
 const a=[{id:'one',name:'A'}],b=[{id:'one',name:'B'}];
 const h=commitHistory(initialHistory(a),b);
 assert.deepEqual(undoHistory(h).present,a);
 assert.deepEqual(redoHistory(undoHistory(h)).present,b);
});
test('new edit clears redo and no-op edits do not pollute history',()=>{
 const a=[1],b=[2],c=[3];
 const h=commitHistory(commitHistory(initialHistory(a),b),c);
 const undone=undoHistory(h);
 assert.equal(commitHistory(undone,[4]).future.length,0);
 assert.equal(commitHistory(h,c),h);
});
test('history stays bounded and resets on external restore',()=>{
 let h=initialHistory([0]);
 for(let i=1;i<=MAX_OFFICE_HISTORY+5;i++)h=commitHistory(h,[i]);
 assert.equal(h.past.length,MAX_OFFICE_HISTORY);
 assert.deepEqual(resetHistory([99]),{past:[],present:[99],future:[]});
});
