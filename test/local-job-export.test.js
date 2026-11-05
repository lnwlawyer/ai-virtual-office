import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChatServer} from '../local-bridge/chat-server.js';
test('local export requires same-origin POST and a configured Bridge',async()=>{
 const app=createLocalChatServer({port:0,bridgeToken:undefined});
 const {port}=await app.listen();const base='http://127.0.0.1:'+port;
 const path='/api/jobs/123e4567-e89b-12d3-a456-426614174000/export';
 try{
  const get=await fetch(base+path);assert.equal(get.status,405);
  const noOrigin=await fetch(base+path,{method:'POST'});assert.equal(noOrigin.status,403);
  const post=await fetch(base+path,{method:'POST',headers:{Origin:base}});assert.equal(post.status,503);
 }finally{await app.close()}
});
