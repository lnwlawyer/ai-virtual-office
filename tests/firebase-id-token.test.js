import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {verifyFirebaseIdToken} from '../gateway/firebase-id-token.js';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),alg:'RS256',use:'sig',key_ops:['verify']};
const now=2000000000,projectId='demo-project';
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function token(overrides={},header={}) {
 const h=encode({alg:'RS256',typ:'JWT',kid:'test-key',...header});
 const p=encode({aud:projectId,iss:'https://securetoken.google.com/'+projectId,sub:'user-123',iat:now-60,auth_time:now-120,exp:now+3600,...overrides});
 const message=h+'.'+p;
 return message+'.'+sign('RSA-SHA256',Buffer.from(message),privateKey).toString('base64url');
}
const options={projectId,publicKeys:{'test-key':jwk},now};
test('valid Firebase token verifies with trusted RSA public key',async()=>{
 assert.deepEqual(await verifyFirebaseIdToken(token(),options),{uid:'user-123',issuedAt:now-60,expiresAt:now+3600});
});
test('invalid signature, unknown key and algorithm are rejected',async()=>{
 const good=token();
 const parts=good.split('.');
 assert.equal(await verifyFirebaseIdToken(parts[0]+'.'+encode({aud:'other'})+'.'+parts[2],options),null);
 assert.equal(await verifyFirebaseIdToken(token({}, {kid:'unknown'}),options),null);
 assert.equal(await verifyFirebaseIdToken(token({}, {alg:'none'}),options),null);
});
test('issuer, audience, subject and time claims fail closed',async()=>{
 for(const claims of [{aud:'other'},{iss:'https://evil.example'},{sub:''},{sub:'x'.repeat(129)},{exp:now},{iat:now+1},{auth_time:now+1},{exp:'later'}]){
  assert.equal(await verifyFirebaseIdToken(token(claims),options),null);
 }
});
test('malformed and missing trusted key input is rejected',async()=>{
 for(const input of ['','a.b.c','a.b.c.d',token()]){
  assert.equal(await verifyFirebaseIdToken(input,{...options,publicKeys:{}}),null);
 }
 assert.equal(await verifyFirebaseIdToken(token(),{...options,publicKeys:{'test-key':{...jwk,alg:'HS256'}}}),null);
});
