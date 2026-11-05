import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChatServer} from '../local-bridge/chat-server.js';
test('localhost Messenger serves UI and replies with real adapter result',async()=>{
 const chat=createLocalChatServer({port:0,generate:async prompt=>{assert.equal(prompt,'สวัสดี');return 'พร้อมใช้งาน'}});
 const {port}=await chat.listen();
 const base='http://127.0.0.1:'+port;
 try{
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/AI Messenger/);
  const response=await fetch(base+'/api/chat',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({prompt:'สวัสดี'})});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{content:'พร้อมใช้งาน'});
  const cross=await fetch(base+'/api/chat',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({prompt:'สวัสดี'})});
  assert.equal(cross.status,403);
  const noOrigin=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'สวัสดี'})});
  assert.equal(noOrigin.status,403);
 }finally{await chat.close()}
});
