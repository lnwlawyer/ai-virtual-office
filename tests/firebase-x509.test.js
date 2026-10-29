import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {certificateSpki,importFirebaseCertificate} from '../gateway/firebase-x509.js';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
function der(tag,content){
 const length=content.length;
 const prefix=length<128?[length]:length<256?[0x81,length]:[0x82,length>>8,length&255];
 return Buffer.concat([Buffer.from([tag,...prefix]),content]);
}
const seq=(...parts)=>der(0x30,Buffer.concat(parts));
const empty=seq();
const serial=der(0x02,Buffer.from([1]));
const spki=publicKey.export({format:'der',type:'spki'});
const tbs=seq(der(0xa0,der(0x02,Buffer.from([2]))),serial,empty,empty,empty,empty,spki);
const cert=seq(tbs,empty,der(0x03,Buffer.from([0])));
const pem='-----BEGIN CERTIFICATE-----\n'+cert.toString('base64')+'\n-----END CERTIFICATE-----';
test('extracts SPKI from DER X509 structure and imports verification key',async()=>{
 assert.deepEqual(Buffer.from(certificateSpki(pem)),spki);
 const key=await importFirebaseCertificate(pem);
 assert.equal(key?.type,'public');
 const message=Buffer.from('verification');
 const signature=sign('RSA-SHA256',message,privateKey);
 assert.equal(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,message),true);
});
test('malformed certificates fail closed',async()=>{
 for(const value of ['','not a cert',pem+'extra','-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----']){
  assert.equal(await importFirebaseCertificate(value),null);
 }
});
