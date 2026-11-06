import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request} from 'node:http';
function browserRequest(url,headers){return new Promise((resolve,reject)=>{const req=request(url,{headers},res=>{res.resume();res.on('end',()=>resolve({status:res.statusCode}));});req.on('error',reject);req.end();});}
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

test('external top-level navigation is allowed but cross-site APIs remain blocked',async()=>{
 const server=createLocalChatServer({port:0});
 const address=await server.listen(),base='http://127.0.0.1:'+address.port;
 try{
  const headers={'sec-fetch-site':'cross-site','sec-fetch-mode':'navigate','sec-fetch-dest':'document'};
  const page=await browserRequest(base+'/',headers);
  assert.equal(page.status,200);
  const api=await browserRequest(base+'/api/bridge/status',headers);
  assert.equal(api.status,403);
  const mutation=await fetch(base+'/api/chat',{method:'POST',headers:{'sec-fetch-site':'cross-site','sec-fetch-mode':'cors','origin':'https://example.com','content-type':'application/json'},body:'{}'});
  assert.equal(mutation.status,403);
 }finally{await server.close()}
});
