// Google Secure Token public keys. This module does not activate the AI gateway.
export const FIREBASE_CERTS_URL='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export function parseMaxAge(cacheControl){
 const match=typeof cacheControl==='string'&&/(?:^|,)\s*max-age=(\d+)(?:,|$)/i.exec(cacheControl);
 if(!match)return null;
 const seconds=Number(match[1]);
 return Number.isSafeInteger(seconds)&&seconds>0&&seconds<=86400?seconds:null;
}
export function createFirebaseKeyCache({fetcher,clock=()=>Date.now(),timeoutMs=5000}={}){
 let cached=null,expires=0,inFlight=null,generation=0;
 return {
  async get(){
   const now=clock();
   if(cached&&now<expires)return cached;
   // Never reuse expired keys when the trusted endpoint is unavailable.
   cached=null;
   expires=0;
   if(typeof fetcher!=='function')return null;
   if(inFlight)return inFlight;
   const currentGeneration=generation;
   const pending=(async()=>{try{
    if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>10000)return null;
    const response=await fetcher(FIREBASE_CERTS_URL,{method:'GET',redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
    if(!response?.ok)return null;
    const maxAge=parseMaxAge(response.headers.get('cache-control'));
    if(maxAge===null)return null;
    const data=await response.json();
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const entries=Object.entries(data);
    if(entries.length===0||entries.length>20||entries.some(([kid,cert])=>!kid||kid.length>256||typeof cert!=='string'||!cert.includes('BEGIN CERTIFICATE')||cert.length>8192))return null;
    const freshAt=clock();
    if(!Number.isFinite(freshAt)||currentGeneration!==generation)return null;
    cached=Object.freeze({...data});
    expires=freshAt+maxAge*1000;
    return cached;
   }catch{return null;}})();
   inFlight=pending;
   try{return await pending;}finally{if(inFlight===pending)inFlight=null;}
  },
  clear(){generation++;cached=null;expires=0;inFlight=null;}
 };
}
