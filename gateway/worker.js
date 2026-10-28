// Disabled Cloudflare Worker gateway. No credentials, provider calls or persistence.
export const MAX_AI_BODY_BYTES=16*1024;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function json(status,payload,extra={}){return new Response(JSON.stringify(payload),{status,headers:{...headers,...extra}});}
export default {
 async fetch(request) {
  const url=new URL(request.url);
  if(url.pathname!=='/api/ai')return json(404,{error:'Not found'});
  if(request.method!=='POST')return json(405,{error:'Method not allowed'},{allow:'POST'});
  // Check only the advertised body size; do not read request bodies while disabled.
  const length=request.headers.get('content-length');
  if(length!==null && (!/^[0-9]+$/.test(length)||Number(length)>MAX_AI_BODY_BYTES))return json(413,{error:'Request too large'});
  // Authentication, quotas, and upstream integrations are intentionally not implemented.
  return json(503,{error:'AI gateway disabled',code:'GATEWAY_DISABLED'});
 }
};
