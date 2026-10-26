import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_DECOR,DEFAULT_DECOR,validDecor,toggleDecor,roomDecorSnapshot} from '../src/office-decor.js';
test('decor presets are safe and optional',()=>{
 assert.equal(validDecor(DEFAULT_DECOR),true);
 assert.equal(Object.keys(ROOM_DECOR).length,5);
 assert.equal(validDecor(['plant','plant']),false);
 assert.equal(validDecor(['script']),false);
});
test('decor can be enabled and disabled without mutating original',()=>{
 const first=toggleDecor(DEFAULT_DECOR,'coffee');
 assert.equal(first.ok,true);
 assert.equal(first.decor.includes('coffee'),true);
 assert.equal(DEFAULT_DECOR.includes('coffee'),false);
 assert.equal(toggleDecor(first.decor,'coffee').decor.includes('coffee'),false);
 assert.equal(toggleDecor(first.decor,'unsafe').ok,false);
 assert.equal(roomDecorSnapshot(first.decor).ok,true);
});
