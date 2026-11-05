import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChatServer} from '../local-bridge/chat-server.js';
test('export inventory is a read-only local endpoint',async()=>{
 const app=createLocalChatServer({port:0});const {port}=await app.listen();const base='http://127.0.0.1:'+port;
 try{
  const r=await fetch(base+'/api/exports');assert.equal(r.status,200);const data=await r.json();assert.ok(Array.isArray(data.files));assert.ok(data.files.length<=200);
  for(const file of data.files)assert.match(file.filename,/^job-[0-9a-f-]{36}\.txt$/);
  const bad=await fetch(base+'/api/exports',{method:'POST',headers:{Origin:base}});assert.equal(bad.status,404);
  const cross=await fetch(base+'/api/exports',{headers:{Origin:'https://evil.example'}});assert.equal(cross.status,403);
 }finally{await app.close()}
});
