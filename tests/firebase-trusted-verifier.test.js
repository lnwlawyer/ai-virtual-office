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

test('end-to-end trusted certificate verifies a signed Firebase ID token',async()=>{
 const {generateKeyPairSync,sign}=await import('node:crypto');
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const der=(tag,body)=>{
  const len=body.length;
  const prefix=len<128?[len]:len<256?[0x81,len]:[0x82,len>>8,len&255];
  return Buffer.concat([Buffer.from([tag,...prefix]),body]);
 };
 const seq=(...parts)=>der(0x30,Buffer.concat(parts));
 const empty=seq();
 const spki=publicKey.export({format:'der',type:'spki'});
 const tbs=seq(der(0xa0,der(0x02,Buffer.from([2]))),der(0x02,Buffer.from([1])),empty,empty,empty,empty,spki);
 const certificate=seq(tbs,empty,der(0x03,Buffer.from([0])));
 const pem='-----BEGIN CERTIFICATE-----\n'+certificate.toString('base64')+'\n-----END CERTIFICATE-----';
 const projectId='demo-project',now=2000000000;
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const header=encode({alg:'RS256',typ:'JWT',kid:'test-key'});
 const payload=encode({aud:projectId,iss:'https://securetoken.google.com/'+projectId,sub:'user-123',iat:now-60,auth_time:now-120,exp:now+3600});
 const signed=header+'.'+payload;
 const token=signed+'.'+sign('RSA-SHA256',Buffer.from(signed),privateKey).toString('base64url');
 let fetches=0;
 const verifier=createTrustedFirebaseVerifier({projectId,clock:()=>now*1000,fetcher:async(url,options)=>{
  fetches++;
  assert.equal(url,'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  assert.equal(options.redirect,'error');
  return {ok:true,headers:new Headers({'cache-control':'max-age=30'}),json:async()=>({'test-key':pem})};
 }});
 assert.deepEqual(await verifier(token),{uid:'user-123',issuedAt:now-60,expiresAt:now+3600});
 assert.equal(await verifier(token.slice(0,-2)+'xx'),null);
 assert.equal(fetches,1);
});
