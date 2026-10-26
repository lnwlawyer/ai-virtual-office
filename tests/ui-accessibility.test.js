import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Thai document language and accessible navigation are configured',()=>{
 const html=readFileSync('index.html','utf8');
 const app=readFileSync('src/main.jsx','utf8');
 assert.match(html,/<html lang="th">/);
 assert.ok(app.includes('aria-label="เมนูหลัก"'));
 assert.ok(app.includes('aria-current={page===x?"page":undefined}'));
});
test('responsive styles and visible keyboard focus are present',()=>{
 const css=readFileSync('src/style.css','utf8');
 for(const value of ['max-width:780px','max-width:420px','focus-visible','prefers-reduced-motion'])assert.ok(css.includes(value),value);
});
