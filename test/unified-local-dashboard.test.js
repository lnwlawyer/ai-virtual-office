import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalChatServer} from '../local-bridge/chat-server.js';
test('local dashboard routes do not expose arbitrary files',async()=>{
 const server=createLocalChatServer({port:0});
 const address=await server.listen(),base='http://127.0.0.1:'+address.port;
 try{
  const traversal=await fetch(base+'/office/%2e%2e%2fpackage.json');
  assert.notEqual(traversal.status,200);
  const missing=await fetch(base+'/office/missing.js');
  assert.equal(missing.status,404);
 }finally{await server.close()}
});
