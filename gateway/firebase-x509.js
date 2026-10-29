// Extract the public key from a trusted X.509 certificate; no request-supplied certificates.
function tlv(bytes,offset){
 if(offset>=bytes.length)throw new Error('Truncated DER');
 const tag=bytes[offset],first=bytes[offset+1];
 if(first===undefined)throw new Error('Truncated DER length');
 let length=first,pos=offset+2;
 if(first&128){
  const count=first&127;
  if(count===0||count>3||pos+count>bytes.length)throw new Error('Invalid DER length');
  length=0;
  for(let i=0;i<count;i++)length=length*256+bytes[pos++];
  if(length<128)throw new Error('Nonminimal DER length');
 }
 const end=pos+length;
 if(end>bytes.length)throw new Error('Truncated DER value');
 return {tag,start:offset,content:pos,end};
}
export function certificateSpki(pem){
 if(typeof pem!=='string'||pem.length>8192)throw new Error('Invalid certificate');
 const match=/^-----BEGIN CERTIFICATE-----\s+([A-Za-z0-9+/=\s]+)\s+-----END CERTIFICATE-----\s*$/.exec(pem);
 if(!match)throw new Error('Invalid certificate PEM');
 const base64=match[1].replace(/\s/g,'');
 if(!base64||base64.length%4!==0)throw new Error('Invalid certificate base64');
 const raw=atob(base64);
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const cert=tlv(bytes,0);
 if(cert.tag!==0x30||cert.end!==bytes.length)throw new Error('Invalid certificate sequence');
 const tbs=tlv(bytes,cert.content);
 if(tbs.tag!==0x30)throw new Error('Invalid TBS certificate');
 let pos=tbs.content;
 let field=tlv(bytes,pos);
 if(field.tag===0xa0){pos=field.end;field=tlv(bytes,pos);}
 for(const tag of [0x02,0x30,0x30,0x30,0x30]){
  if(field.tag!==tag)throw new Error('Invalid certificate field');
  pos=field.end;
  field=tlv(bytes,pos);
 }
 if(field.tag!==0x30||field.end>tbs.end)throw new Error('Invalid SPKI');
 return bytes.slice(field.start,field.end);
}
export async function importFirebaseCertificate(pem){
 try{
  return await crypto.subtle.importKey('spki',certificateSpki(pem),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 }catch{return null;}
}
