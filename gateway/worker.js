// Secure-by-default Cloudflare Worker scaffold. No provider keys, no AI network calls.
export default {
 async fetch(request) {
  const url=new URL(request.url);
  if(url.pathname!=='/api/ai')return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  if(request.method!=='POST')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','allow':'POST'}});
  // Authentication, quota enforcement and upstream provider integration are intentionally absent.
  // Never process or forward an unverified request.
  return new Response(JSON.stringify({error:'AI gateway disabled',code:'GATEWAY_DISABLED'}),{status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
 }
};
