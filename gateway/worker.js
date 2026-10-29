// Disabled Cloudflare Worker gateway. No credentials, provider calls or persistence.
export const MAX_AI_BODY_BYTES=16*1024;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function json(status,payload,extra={}){return new Response(JSON.stringify(payload),{status,headers:{...headers,...extra}});}
export async function withinBodyLimit(body,limit=MAX_AI_BODY_BYTES){
 if(!body)return true;
 const reader=body.getReader();
 let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)return true;
   total+=value.byteLength;
   if(total>limit)return false;
  }
 }finally{await reader.cancel().catch(()=>{});}
}
export function allowedBrowserOrigin(origin,allowedOrigin){
 if(typeof origin!=='string'||typeof allowedOrigin!=='string')return false;
 try{
  const requested=new URL(origin),configured=new URL(allowedOrigin);
  return requested.protocol==='https:'&&configured.protocol==='https:'&&
   requested.origin===origin&&configured.origin===allowedOrigin&&
   requested.origin===configured.origin;
 }catch{return false;}
}
// Deliberately no token verification until a trusted issuer and key validation are implemented.
export function gatewayAuthConfigured(env){
 return typeof env?.AUTH_ISSUER==='string'&&env.AUTH_ISSUER.length>0&&
  typeof env?.AUTH_AUDIENCE==='string'&&env.AUTH_AUDIENCE.length>0;
}
export default {
 async fetch(request,env={}) {
  const url=new URL(request.url);
  if(url.pathname!=='/api/ai')return json(404,{error:'Not found'});
  // Reject browser-origin requests unless a single exact HTTPS origin is configured.
  // This is a browser policy check, NOT authentication.
  const origin=request.headers.get('origin');
  if(origin&&!allowedBrowserOrigin(origin,env.ALLOWED_BROWSER_ORIGIN))return json(403,{error:'Origin not allowed'});
  if(request.method==='OPTIONS')return json(405,{error:'Method not allowed'},{allow:'POST'});
  if(request.method!=='POST')return json(405,{error:'Method not allowed'},{allow:'POST'});
  const length=request.headers.get('content-length');
  if(length!==null && (!/^[0-9]+$/.test(length)||Number(length)>MAX_AI_BODY_BYTES))return json(413,{error:'Request too large'});
  // A configured issuer/audience alone does not authenticate anyone.
  // Keep rejecting every request until verified JWT signatures and claims are implemented.
  if(!gatewayAuthConfigured(env))return json(503,{error:'AI gateway disabled',code:'GATEWAY_DISABLED'});
  // The gateway is disabled regardless of payload. Inspect only byte counts, never log or echo the body.
  if(!(await withinBodyLimit(request.body)))return json(413,{error:'Request too large'});
  return json(503,{error:'AI gateway disabled',code:'GATEWAY_DISABLED'});
 }
};
