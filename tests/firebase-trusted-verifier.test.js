import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrustedFirebaseVerifier} from '../gateway/firebase-trusted-verifier.js';
test('trusted verifier fails closed when certificate retrieval fails',async()=>{
 const verifier=createTrustedFirebaseVerifier({projectId:'demo-project',fetcher:async()=>{throw Error('offline');}});
 assert.equal(await verifier('invalid.token'),null);
});
test('trusted verifier rejects malformed certificates without accepting token',async()=>{
 const verifier=createTrustedFirebaseVerifier({projectId:'demo-project',fetcher:async()=>({
  ok:true,headers:new Headers({'cache-control':'max-age=30'}),json:async()=>({'kid':'-----BEGIN CERTIFICATE-----invalid-----END CERTIFICATE-----'})
 })});
 assert.equal(await verifier('invalid.token'),null);
});
test('trusted verifier rejects absent project and does not fetch',async()=>{
 const verifier=createTrustedFirebaseVerifier({fetcher:async()=>{throw Error('should not fetch');}});
 assert.equal(await verifier('anything'),null);
});
