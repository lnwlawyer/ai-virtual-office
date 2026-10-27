import test from 'node:test';
import assert from 'node:assert/strict';
import {officeHistoryShortcut} from '../src/office-history-shortcuts.js';
const event=(key,extras={})=>({key,ctrlKey:true,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,target:{closest:()=>null,isContentEditable:false},...extras});
test('Ctrl or Command Z undo and Shift Z / Y redo',()=>{
 assert.equal(officeHistoryShortcut(event('z')),'undo');
 assert.equal(officeHistoryShortcut(event('Z',{shiftKey:true})),'redo');
 assert.equal(officeHistoryShortcut(event('y')),'redo');
 assert.equal(officeHistoryShortcut(event('z',{ctrlKey:false,metaKey:true})),'undo');
});
test('native editable controls retain keyboard history',()=>{
 for(const selector of ['input','textarea','select','[contenteditable]','[role="textbox"]'])assert.equal(officeHistoryShortcut(event('z',{target:{closest:q=>q.includes(selector)?{}:null}})),null);
 assert.equal(officeHistoryShortcut(event('z',{target:{isContentEditable:true}})),null);
});
test('ignore unrelated, alt-modified and already handled events',()=>{
 assert.equal(officeHistoryShortcut(event('a')),null);
 assert.equal(officeHistoryShortcut(event('z',{altKey:true})),null);
 assert.equal(officeHistoryShortcut(event('z',{defaultPrevented:true})),null);
 assert.equal(officeHistoryShortcut(event('z',{ctrlKey:false,metaKey:false})),null);
});
