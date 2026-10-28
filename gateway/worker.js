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
export default {
 async fetch(request) {
  const url=new URL(request.url);
  if(url.pathname!=='/api/ai')return json(404,{error:'Not found'});
  if(request.method!=='POST')return json(405,{error:'Method not allowed'},{allow:'POST'});
  const length=request.headers.get('content-length');
  if(length!==null && (!/^[0-9]+$/.test(length)||Number(length)>MAX_AI_BODY_BYTES))return json(413,{error:'Request too large'});
  // The gateway is disabled regardless of payload. Inspect only byte counts, never log or echo the body.
  if(!(await withinBodyLimit(request.body)))return json(413,{error:'Request too large'});
  return json(503,{error:'AI gateway disabled',code:'GATEWAY_DISABLED'});
 }
};
