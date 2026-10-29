// Verify a Firebase token using certificates fetched from the fixed trusted endpoint.
// This function is not wired to the disabled Worker route.
import {createFirebaseKeyCache} from './firebase-key-cache.js';
import {importFirebaseCertificate} from './firebase-x509.js';
import {verifyFirebaseIdToken} from './firebase-id-token.js';
export function createTrustedFirebaseVerifier({projectId,fetcher,clock=()=>Date.now()}={}){
 const cache=createFirebaseKeyCache({fetcher,clock});
 return async function verify(token){
  if(typeof projectId!=='string'||!projectId||typeof token!=='string')return null;
  const certificates=await cache.get();
  if(!certificates)return null;
  const publicKeys=Object.create(null);
  for(const [kid,pem] of Object.entries(certificates)){
   const key=await importFirebaseCertificate(pem);
   if(!key)return null;
   publicKeys[kid]=key;
  }
  return verifyFirebaseIdToken(token,{projectId,publicKeys,now:Math.floor(clock()/1000)});
 };
}
