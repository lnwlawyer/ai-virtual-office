// Pure, offline Firebase ID token verifier. Never trust JWT headers as a key URL.
const decoder=new TextDecoder();
function decodePart(part){
 if(!/^[A-Za-z0-9_-]+$/.test(part))throw new Error('Invalid token encoding');
 const base64=part.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(base64+'='.repeat((4-base64.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function parsePart(part){return JSON.parse(decoder.decode(decodePart(part)));}
export async function verifyFirebaseIdToken(token,{projectId,publicKeys,now=Math.floor(Date.now()/1000)}={}){
 if(typeof token!=='string'||token.length>8192||!projectId||typeof projectId!=='string'||!publicKeys||typeof publicKeys!=='object')return null;
 const parts=token.split('.');
 if(parts.length!==3)return null;
 try{
  const [headerPart,payloadPart,signaturePart]=parts;
  const header=parsePart(headerPart),claims=parsePart(payloadPart);
  if(header.alg!=='RS256'||header.typ!=='JWT'||typeof header.kid!=='string'||!header.kid||!Object.hasOwn(publicKeys,header.kid))return null;
  // Reject conflicting key references or critical extensions; keys are always selected locally.
  if(header.jku!==undefined||header.jwk!==undefined||header.x5u!==undefined||header.crit!==undefined)return null;
  const key=publicKeys[header.kid];
  const isCryptoKey=typeof CryptoKey!=='undefined'&&key instanceof CryptoKey;
  if(isCryptoKey){
   if(key.type!=='public'||key.algorithm?.name!=='RSASSA-PKCS1-v1_5'||key.algorithm?.hash?.name!=='SHA-256'||!key.usages.includes('verify'))return null;
  }else if(!key||key.kty!=='RSA'||key.alg!=='RS256'||key.use!=='sig'||!Array.isArray(key.key_ops)||!key.key_ops.includes('verify'))return null;
  if(claims.aud!==projectId||claims.iss!==`https://securetoken.google.com/${projectId}`)return null;
  if(typeof claims.sub!=='string'||!claims.sub||claims.sub.length>128)return null;
  if(!Number.isInteger(now)||!Number.isInteger(claims.exp)||!Number.isInteger(claims.iat)||!Number.isInteger(claims.auth_time))return null;
  if(claims.exp<=now||claims.iat>now||claims.auth_time>now||claims.iat>claims.exp||claims.auth_time>claims.iat)return null;
  const imported=isCryptoKey?key:await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,decodePart(signaturePart),new TextEncoder().encode(headerPart+'.'+payloadPart));
  return verified?{uid:claims.sub,issuedAt:claims.iat,expiresAt:claims.exp}:null;
 }catch{return null;}
}
