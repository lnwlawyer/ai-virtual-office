// Opt-in localhost-only bridge. Queue and manual results only; no shell execution.
import http from 'node:http';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {validateBridgeJob,validateBridgeResult} from '../src/local-agent-bridge-contract.js';
const MAX_BODY=12000;
export function createBridgeServer({token=randomBytes(32).toString('hex'),host='127.0.0.1',port=8765}={}){
 if(!/^(127\.0\.0\.1|::1)$/.test(host))throw new Error('Only loopback binding is supported');
 if(typeof token!=='string'||token.length<32)throw new Error('Bridge token must be at least 32 characters');
 const jobs=new Map();
 const authorized=req=>{
  const supplied=req.headers.authorization;
  const expected='Bearer '+token;
  return typeof supplied==='string'&&Buffer.byteLength(supplied)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));
 };
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
 const readBody=async req=>{
  let data='';
  for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>MAX_BODY)throw new Error('Body too large')}
  try{return JSON.parse(data)}catch{throw new Error('Invalid JSON')}
 };
 const server=http.createServer(async(req,res)=>{
  // Reject cross-origin browser access, including DNS rebinding attempts.
  if(req.headers.origin||!['127.0.0.1','localhost','[::1]'].includes((req.headers.host||'').split(':')[0]))return json(res,403,{error:'Local clients only'});
  if(!authorized(req))return json(res,401,{error:'Unauthorized'});
  const url=new URL(req.url,'http://localhost');
  try{
   if(req.method==='GET'&&url.pathname==='/v1/health')return json(res,200,{version:1,status:'ready',execution:'manual-only'});
   if(req.method==='POST'&&url.pathname==='/v1/jobs'){
    const checked=validateBridgeJob(await readBody(req));
    if(!checked.ok)return json(res,400,{error:checked.error});
    if(jobs.size>=100)return json(res,429,{error:'Queue full'});
    const job={id:randomUUID(),...checked.value,status:'queued',createdAt:new Date().toISOString()};
    jobs.set(job.id,job);return json(res,201,{id:job.id,status:job.status});
   }
   if(req.method==='GET'&&url.pathname==='/v1/jobs')return json(res,200,{jobs:[...jobs.values()].map(({id,agentRole,status,createdAt})=>({id,agentRole,status,createdAt}))});
   const match=/^\/v1\/jobs\/([0-9a-f-]{36})(?:\/result)?$/.exec(url.pathname);
   if(match&&jobs.has(match[1])){
    const job=jobs.get(match[1]);
    if(req.method==='GET'&&!url.pathname.endsWith('/result'))return json(res,200,job);
    if(req.method==='POST'&&url.pathname.endsWith('/result')){
     if(job.status!=='queued')return json(res,409,{error:'Job already resolved'});
     const checked=validateBridgeResult(await readBody(req));
     if(!checked.ok)return json(res,400,{error:checked.error});
     Object.assign(job,checked.value,{finishedAt:new Date().toISOString()});
     return json(res,200,{id:job.id,status:job.status});
    }
   }
   return json(res,404,{error:'Not found'});
  }catch(error){return json(res,error.message==='Body too large'?413:400,{error:error.message})}
 });
 return {server,token,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);resolve(server.address())})}),close:()=>new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()))};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const bridge=createBridgeServer({token:process.env.LOCAL_BRIDGE_TOKEN,port:Number(process.env.LOCAL_BRIDGE_PORT||8765)});
 bridge.listen().then(address=>console.log('Local Agent Bridge listening on http://127.0.0.1:'+address.port+' (manual-only, no command execution)')).catch(error=>{console.error(error.message);process.exitCode=1});
}
