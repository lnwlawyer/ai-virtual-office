// Google Secure Token public keys. This module does not activate the AI gateway.
export const FIREBASE_CERTS_URL='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export function parseMaxAge(cacheControl){
 const match=typeof cacheControl==='string'&&/(?:^|,)\s*max-age=(\d+)(?:,|$)/i.exec(cacheControl);
 if(!match)return null;
 const seconds=Number(match[1]);
 return Number.isSafeInteger(seconds)&&seconds>0&&seconds<=86400?seconds:null;
}
export function createFirebaseKeyCache({fetcher,clock=()=>Date.now()}={}){
 let cached=null,expires=0;
 return {
  async get(){
   const now=clock();
   if(cached&&now<expires)return cached;
   if(typeof fetcher!=='function')return null;
   try{
    const response=await fetcher(FIREBASE_CERTS_URL,{method:'GET',redirect:'error'});
    if(!response?.ok)return null;
    const maxAge=parseMaxAge(response.headers.get('cache-control'));
    if(maxAge===null)return null;
    const data=await response.json();
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const entries=Object.entries(data);
    if(entries.length===0||entries.length>20||entries.some(([kid,cert])=>!kid||kid.length>256||typeof cert!=='string'||!cert.includes('BEGIN CERTIFICATE')||cert.length>8192))return null;
    cached=Object.freeze({...data});
    expires=clock()+maxAge*1000;
    return cached;
   }catch{return null;}
  },
  clear(){cached=null;expires=0;}
 };
}
