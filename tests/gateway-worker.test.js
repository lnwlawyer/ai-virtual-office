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
