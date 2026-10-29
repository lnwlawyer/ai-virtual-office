import test from 'node:test';
import assert from 'node:assert/strict';
import {createFirebaseKeyCache,FIREBASE_CERTS_URL,parseMaxAge} from '../gateway/firebase-key-cache.js';
test('cache-control max-age must be bounded and positive',()=>{
 assert.equal(parseMaxAge('public, max-age=3600'),3600);
 for(const value of ['no-store','max-age=0','max-age=999999999','max-age=abc'])assert.equal(parseMaxAge(value),null);
});
test('fixed endpoint and bounded cache lifetime',async()=>{
 let calls=0,time=1000;
 const fetcher=async(url,options)=>{
  calls++;
  assert.equal(url,FIREBASE_CERTS_URL);
  assert.equal(options.redirect,'error');
  return {ok:true,headers:new Headers({'cache-control':'public, max-age=10'}),json:async()=>({'kid-1':'-----BEGIN CERTIFICATE-----TEST-----END CERTIFICATE-----'})};
 };
 const cache=createFirebaseKeyCache({fetcher,clock:()=>time});
 assert.ok(await cache.get());
 time+=5000;
 assert.ok(await cache.get());
 assert.equal(calls,1);
 time+=6000;
 assert.ok(await cache.get());
 assert.equal(calls,2);
});
test('network failures and malformed responses fail closed',async()=>{
 for(const fetcher of [
  async()=>{throw new Error('offline');},
  async()=>({ok:false}),
  async()=>({ok:true,headers:new Headers(),json:async()=>({kid:'-----BEGIN CERTIFICATE-----'})}),
  async()=>({ok:true,headers:new Headers({'cache-control':'max-age=10'}),json:async()=>({kid:'invalid'})})
 ]){
  const cache=createFirebaseKeyCache({fetcher});
  assert.equal(await cache.get(),null);
 }
});
