// Opt-in localhost-only bridge. Queue and manual results only; no shell execution.
import http from 'node:http';
import {createJobStore} from './job-store.js';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {validateBridgeJob,validateBridgeResult} from '../src/local-agent-bridge-contract.js';
import {buildBridgeStatus} from './status.js';
const MAX_BODY=12000;
const MAX_RESULT_BODY=90000;
export function createBridgeServer({token=randomBytes(32).toString('hex'),host='127.0.0.1',port=8765,storagePath=null}={}){
 if(!/^(127\.0\.0\.1|::1)$/.test(host))throw new Error('Only loopback binding is supported');
 if(typeof token!=='string'||token.length<32)throw new Error('Bridge token must be at least 32 characters');
 const store=storagePath?createJobStore(storagePath):null;
 const jobs=store?store.jobs:new Map();
 const commit=mutator=>store?store.commit(mutator):Promise.resolve(mutator(jobs));
 const authorized=req=>{
  const supplied=req.headers.authorization;
  const expected='Bearer '+token;
  return typeof supplied==='string'&&Buffer.byteLength(supplied)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));
 };
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
 const readBody=async(req,maxBytes=MAX_BODY)=>{
  let data='';
  for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>maxBytes)throw new Error('Body too large')}
  try{return JSON.parse(data)}catch{throw new Error('Invalid JSON')}
 };
 const server=http.createServer(async(req,res)=>{
  // Reject cross-origin browser access, including DNS rebinding attempts.
  if(req.headers.origin||!['127.0.0.1','localhost'].includes(req.headers.host?.split(':')[0])&&!/^\[::1\](?::\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'Local clients only'});
  if(!authorized(req))return json(res,401,{error:'Unauthorized'});
  const url=new URL(req.url,'http://localhost');
  try{
   if(req.method==='GET'&&url.pathname==='/v1/health')return json(res,200,{version:1,status:'ready',execution:'manual-only'});
   if(req.method==='GET'&&url.pathname==='/v1/status')return json(res,200,buildBridgeStatus(jobs));
   if(req.method==='POST'&&url.pathname==='/v1/jobs'){
    const checked=validateBridgeJob(await readBody(req));
    if(!checked.ok)return json(res,400,{error:checked.error});
    if(jobs.size>=100)return json(res,429,{error:'Queue full'});
    const job={id:randomUUID(),...checked.value,status:'awaiting_approval',createdAt:new Date().toISOString()};
    await commit(map=>map.set(job.id,job));return json(res,201,{id:job.id,status:job.status});
   }
   if(req.method==='GET'&&url.pathname==='/v1/jobs')return json(res,200,{jobs:[...jobs.values()].map(({id,agentRole,status,createdAt})=>({id,agentRole,status,createdAt}))});
   const match=/^\/v1\/jobs\/([0-9a-f-]{36})(?:\/(result|decision|progress))?$/.exec(url.pathname);
   if(match&&jobs.has(match[1])){
    const job=jobs.get(match[1]);
    if(req.method==='GET'&&!match[2])return json(res,200,job);
    if(req.method==='POST'&&match[2]==='decision'){
     if(job.status!=='awaiting_approval')return json(res,409,{error:'Decision already recorded'});
     const decision=await readBody(req);
     if(!decision||!['approve','reject'].includes(decision.decision))return json(res,400,{error:'Invalid decision'});
     await commit(()=>{job.status=decision.decision==='approve'?'approved':'rejected';job.decidedAt=new Date().toISOString()});
     return json(res,200,{id:job.id,status:job.status});
    }
    if(req.method==='POST'&&match[2]==='progress'){
     if(job.status!=='approved')return json(res,409,{error:'Job not approved'});
     const progress=await readBody(req);
     if(!progress||!['analyst','writer','reviewer','manager','legal','developer','designer'].includes(progress.role)||!['running','completed'].includes(progress.status)||!Number.isInteger(progress.stage)||!Number.isInteger(progress.total)||progress.stage<1||progress.total>4||progress.stage>progress.total)return json(res,400,{error:'Invalid progress'});
     await commit(()=>{job.progress={role:progress.role,status:progress.status,stage:progress.stage,total:progress.total,updatedAt:new Date().toISOString()}});
     return json(res,200,{id:job.id,progress:job.progress});
    }
    if(req.method==='POST'&&match[2]==='result'){
     if(job.status!=='approved')return json(res,409,{error:'Job not approved or already resolved'});
     const checked=validateBridgeResult(await readBody(req,MAX_RESULT_BODY));
     if(!checked.ok)return json(res,400,{error:checked.error});
     await commit(()=>Object.assign(job,checked.value,{finishedAt:new Date().toISOString()}));
     return json(res,200,{id:job.id,status:job.status});
    }
   }
   return json(res,404,{error:'Not found'});
  }catch(error){return json(res,error.message==='Body too large'?413:400,{error:error.message})}
 });
 return {server,token,listen:async()=>{if(store)await store.load();return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);resolve(server.address())})})},close:()=>new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()))};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(!process.env.LOCAL_BRIDGE_TOKEN){console.error('LOCAL_BRIDGE_TOKEN is required (at least 32 characters)');process.exit(1)}
 const bridge=createBridgeServer({token:process.env.LOCAL_BRIDGE_TOKEN,port:Number(process.env.LOCAL_BRIDGE_PORT||8765),storagePath:process.env.LOCAL_BRIDGE_STORAGE_PATH||null});
 bridge.listen().then(address=>console.log('Local Agent Bridge listening on http://127.0.0.1:'+address.port+' (manual-only, no command execution)')).catch(error=>{console.error(error.message);process.exitCode=1});
}
