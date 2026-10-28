import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../gateway/worker.js';
const request=(path,method='POST')=>new Request('https://example.invalid'+path,{method});
test('gateway returns 404 for unrelated routes',async()=>{
 const response=await worker.fetch(request('/anything'));
 assert.equal(response.status,404);
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('gateway rejects non-POST requests',async()=>{
 const response=await worker.fetch(request('/api/ai','GET'));
 assert.equal(response.status,405);
 assert.equal(response.headers.get('allow'),'POST');
});
test('gateway rejects all AI POST requests without forwarding',async()=>{
 const response=await worker.fetch(request('/api/ai'));
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'AI gateway disabled',code:'GATEWAY_DISABLED'});
 assert.equal(response.headers.get('cache-control'),'no-store');
});

test('gateway rejects declared oversized requests without processing the body',async()=>{
 const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',headers:{'content-length':'16385'}}));
 assert.equal(response.status,413);
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
});
test('gateway stays disabled for small requests and does not echo prompts',async()=>{
 const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'private test prompt'})}));
 assert.equal(response.status,503);
 assert.equal((await response.text()).includes('private test prompt'),false);
});

test('gateway rejects malformed content-length headers',async()=>{
 for(const value of ['invalid','-1','1.5','1e5']){
  const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',headers:{'content-length':value}}));
  assert.equal(response.status,413);
 }
});
test('gateway remains disabled at the declared 16 KiB boundary',async()=>{
 const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',headers:{'content-length':'16384'}}));
 assert.equal(response.status,503);
});

test('gateway rejects oversized actual body even without Content-Length',async()=>{
 const body='x'.repeat(16385);
 const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',body}));
 assert.equal(response.status,413);
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('gateway remains disabled for body at exact limit',async()=>{
 const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',body:'x'.repeat(16384)}));
 assert.equal(response.status,503);
});
test('gateway rejects multi-chunk oversized body without echoing content',async()=>{
 const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('secret '+ 'x'.repeat(8192)));controller.enqueue(new TextEncoder().encode('y'.repeat(8192)));controller.close();}});
 const response=await worker.fetch(new Request('https://example.invalid/api/ai',{method:'POST',body,duplex:'half'}));
 assert.equal(response.status,413);
 assert.equal((await response.text()).includes('secret'),false);
});
