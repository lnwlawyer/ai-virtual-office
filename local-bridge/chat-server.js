// Standalone loopback-only local text chat. No terminal execution, secrets or cloud calls.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {generateWithOllama} from './ollama-adapter.js';
import {buildAgentPrompt} from './chat-roles.js';
import {createBridgeServer} from './server.js';
import {processApprovedJobs} from './ollama-worker.js';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
const htmlPath=fileURLToPath(new URL('./chat.html',import.meta.url));
export function createLocalChatServer({port=8787,generate=generateWithOllama,model=process.env.OLLAMA_MODEL||'qwen2.5:latest',bridgeToken=process.env.LOCAL_BRIDGE_TOKEN,bridgePort=8765}={}){
 let active=false;
 const server=http.createServer(async(req,res)=>{
  const host=req.headers.host||'';
  const validHost=/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host);
  const expected='http://'+host;
  const validOrigin=!req.headers.origin||req.headers.origin===expected;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'",'Referrer-Policy':'no-referrer'};
  function reply(status,value){res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))}
  if(!validHost||!validOrigin||req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))return reply(403,{error:'Local browser only'});
  if(req.method==='GET'&&req.url==='/api/bridge/status'){
   const token=bridgeToken;
   if(!token||token.length<32)return reply(200,{connected:false,reason:'Bridge token not configured'});
   try{const response=await fetch('http://127.0.0.1:'+bridgePort+'/v1/status',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(2500)});if(!response.ok)return reply(200,{connected:false,reason:'Bridge authentication or service unavailable'});const data=await response.json();return reply(200,{connected:true,status:data})}catch{return reply(200,{connected:false,reason:'Bridge is not running'})}
  }
  if(req.url==='/api/exports'&&req.method==='GET'){
   const dir=join(homedir(),'Documents','AI-Virtual-Office','exports');
   try{
    const entries=await readdir(dir,{withFileTypes:true});
    const names=entries.filter(e=>e.isFile()&&/^job-[0-9a-f-]{36}\.txt$/.test(e.name)).map(e=>e.name).sort().slice(0,200);
    const files=await Promise.all(names.map(async filename=>{const info=await stat(join(dir,filename));return {filename,size:info.size,modifiedAt:info.mtime.toISOString()}}));
    return reply(200,{files});
   }catch(error){return error.code==='ENOENT'?reply(200,{files:[]}):reply(500,{error:'Unable to list exports'})}
  }
  if(req.url?.startsWith('/api/jobs/')){
   const exportMatch=/^\/api\/jobs\/([0-9a-f-]{36})\/export$/.exec(req.url);
   if(exportMatch){
    if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
    if(req.headers.origin!==expected)return reply(403,{error:'Same-origin required'});
    if(!bridgeToken||bridgeToken.length<32)return reply(503,{error:'Bridge unavailable'});
    try{
     const result=await fetch('http://127.0.0.1:'+bridgePort+'/v1/jobs/'+exportMatch[1],{headers:{Authorization:'Bearer '+bridgeToken},signal:AbortSignal.timeout(4000)});
     if(!result.ok)return reply(result.status,{error:'Job not found'});
     const job=await result.json();
     if(job.status!=='completed'||typeof job.content!=='string')return reply(409,{error:'Only completed jobs can be exported'});
     const dir=join(homedir(),'Documents','AI-Virtual-Office','exports');
     await mkdir(dir,{recursive:true});
     const filename='job-'+job.id+'.txt';
     await writeFile(join(dir,filename),job.content,{encoding:'utf8',flag:'wx'});
     return reply(201,{saved:true,filename,folder:'Documents/AI-Virtual-Office/exports'});
    }catch(error){return reply(error.code==='EEXIST'?409:500,{error:error.code==='EEXIST'?'Already exported':'Unable to export'})}
   }
  }
  if(req.url?.startsWith('/api/jobs')){
   if(!bridgeToken||bridgeToken.length<32)return reply(503,{error:'Bridge unavailable'});
   if(req.method!=='GET'&&req.headers.origin!==expected)return reply(403,{error:'Same-origin required'});
   const path=req.url==='/api/jobs'?'/v1/jobs':req.url.replace(/^\/api\/jobs\//,'/v1/jobs/');
   if(!/^\/v1\/jobs(?:\/[0-9a-f-]{36}(?:\/decision)?)?$/.test(path))return reply(404,{error:'Not found'});
   if(!['GET','POST'].includes(req.method))return reply(405,{error:'Method not allowed'});
   let body;
   if(req.method==='POST'){
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'JSON required'});
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12000)return reply(413,{error:'Too large'})}
    try{body=JSON.parse(raw)}catch{return reply(400,{error:'Invalid JSON'})}
   }
   try{
    const response=await fetch('http://127.0.0.1:'+bridgePort+path,{method:req.method,headers:{Authorization:'Bearer '+bridgeToken,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(4000)});
    const result=await response.json();
    if(response.ok&&req.method==='POST'&&path.endsWith('/decision')&&result.status==='approved'){
     void processApprovedJobs({token:bridgeToken,port:bridgePort,model,generate}).catch(()=>{});
    }
    return reply(response.status,result);
   }catch{return reply(502,{error:'Bridge unavailable'})}
  }
  if(req.method==='GET'&&req.url==='/'){const page=await readFile(htmlPath);res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'});return res.end(page)}
  if(req.method==='POST'&&req.url==='/api/chat'){
   if(req.headers.origin!==expected)return reply(403,{error:'Same-origin request required'});
   if(active)return reply(429,{error:'มีงานกำลังประมวลผลอยู่'});
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'JSON required'});
   let body='';
   try{
    for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000)return reply(413,{error:'ข้อความยาวเกินไป'})}
    const {prompt,role='developer',history=[]}=JSON.parse(body);
    let agentPrompt;
    try{agentPrompt=buildAgentPrompt(role,history,prompt)}catch{return reply(400,{error:'ข้อมูลการสนทนาไม่ถูกต้อง'});}
    active=true;
    try{const content=await generate(agentPrompt,{model});return reply(200,{content})}
    finally{active=false}
   }catch{return reply(502,{error:'Ollama ไม่พร้อมใช้งานหรือประมวลผลไม่สำเร็จ'})}
  }
  return reply(404,{error:'Not found'});
 });
 return {server,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address())})}),close:()=>new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()))};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const token=process.env.LOCAL_BRIDGE_TOKEN||randomBytes(32).toString('hex');
 const bridge=createBridgeServer({token,port:8765,storagePath:process.env.LOCAL_BRIDGE_STORAGE_PATH||join(homedir(),'Documents','AI-Virtual-Office','bridge-jobs.json')});
 bridge.listen().then(async()=>{const chat=createLocalChatServer({bridgeToken:token});const address=await chat.listen();void processApprovedJobs({token,port:8765}).catch(error=>console.error('Recovery worker:',error.message));return address}).then(address=>console.log('Open http://127.0.0.1:'+address.port+' (Messenger + persistent approval queue)')).catch(error=>{console.error(error.message);process.exitCode=1});
}
