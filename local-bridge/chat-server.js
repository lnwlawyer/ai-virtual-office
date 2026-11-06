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
import {join,resolve,sep,extname} from 'node:path';
import {homedir} from 'node:os';
const htmlPath=fileURLToPath(new URL('./chat.html',import.meta.url));
const localDist=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const staticTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
export function createLocalChatServer({port=8787,generate=generateWithOllama,model=process.env.OLLAMA_MODEL||'qwen2.5:latest',bridgeToken=process.env.LOCAL_BRIDGE_TOKEN,bridgePort=8765}={}){
 let active=false;
 const configPath=join(homedir(),'Documents','AI-Virtual-Office','ai-providers.json');
 async function providers(){try{const x=JSON.parse(await readFile(configPath,'utf8'));return Array.isArray(x)?x:[]}catch{return []}}
 async function saveProviders(items){await mkdir(join(homedir(),'Documents','AI-Virtual-Office'),{recursive:true});await writeFile(configPath,JSON.stringify(items,null,2),{encoding:'utf8',mode:0o600})}
 const publicProvider=p=>({id:p.id,name:p.name,type:p.type,model:p.model});
 async function cloudGenerate(p,prompt){
  const endpoint=p.type==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(p.model)+':generateContent':p.type==='anthropic'?'https://api.anthropic.com/v1/messages':p.endpoint;
  const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password)throw Error('HTTPS endpoint required');
  const headers={'Content-Type':'application/json'};
  let body;
  if(p.type==='gemini'){headers['x-goog-api-key']=p.key;body={contents:[{parts:[{text:prompt}]}]}}
  else if(p.type==='anthropic'){headers['x-api-key']=p.key;headers['anthropic-version']='2023-06-01';body={model:p.model,max_tokens:2048,messages:[{role:'user',content:prompt}]}}
  else{headers.Authorization='Bearer '+p.key;body={model:p.model,messages:[{role:'user',content:prompt}]}}
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('Provider HTTP '+response.status);
  const data=await response.json();
  const content=p.type==='gemini'?data.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join(''):p.type==='anthropic'?data.content?.map(x=>x.text||'').join(''):data.choices?.[0]?.message?.content;
  if(typeof content!=='string'||!content.trim())throw Error('Empty response');
  return content;
 }

 const server=http.createServer(async(req,res)=>{
  const host=req.headers.host||'';
  const validHost=/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host);
  const expected='http://'+host;
  const validOrigin=!req.headers.origin||req.headers.origin===expected;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'",'Referrer-Policy':'no-referrer'};
  function reply(status,value){res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))}
  // External sites may link to a local document, but may not call local APIs or mutate state.
  const fetchSite=req.headers['sec-fetch-site'];
  const documentNavigation=req.method==='GET'&&req.headers['sec-fetch-mode']==='navigate'&&req.headers['sec-fetch-dest']==='document'&&(/^(\/|\/office\/(?:[^?]*)?)(?:\?.*)?$/.test(req.url||''));
  const trustedSite=!fetchSite||['same-origin','none'].includes(fetchSite);
  if(!validHost||!validOrigin||(!trustedSite&&!documentNavigation))return reply(403,{error:'Local browser only'});
  if(req.method==='GET'&&req.url==='/api/bridge/status'){
   const token=bridgeToken;
   if(!token||token.length<32)return reply(200,{connected:false,reason:'Bridge token not configured'});
   try{const response=await fetch('http://127.0.0.1:'+bridgePort+'/v1/status',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(2500)});if(!response.ok)return reply(200,{connected:false,reason:'Bridge authentication or service unavailable'});const data=await response.json();return reply(200,{connected:true,status:data})}catch{return reply(200,{connected:false,reason:'Bridge is not running'})}
  }
  if(req.url==='/api/providers'){
   if(req.method==='GET')return reply(200,{providers:[{id:'local',name:'Ollama (Local)',type:'local',model},...(await providers()).map(publicProvider)]});
   if(!['POST','DELETE'].includes(req.method))return reply(405,{error:'Method not allowed'});
   if(req.headers.origin!==expected)return reply(403,{error:'Same-origin required'});
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'JSON required'});
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>6000)return reply(413,{error:'Too large'})}
   let input;try{input=JSON.parse(raw)}catch{return reply(400,{error:'Invalid JSON'})}
   const items=await providers();
   if(req.method==='DELETE'){const next=items.filter(p=>p.id!==input.id);if(next.length===items.length)return reply(404,{error:'Not found'});await saveProviders(next);return reply(200,{ok:true})}
   const {name,type,model:chosenModel,key,endpoint}=input;
   if(!['gemini','openai','anthropic','compatible'].includes(type)||typeof name!=='string'||!name.trim()||name.length>80||typeof chosenModel!=='string'||!/^[-a-zA-Z0-9_.:/]{1,120}$/.test(chosenModel)||typeof key!=='string'||key.length<8||key.length>2000)return reply(400,{error:'Invalid settings'});
   const target=type==='openai'?'https://api.openai.com/v1/chat/completions':type==='compatible'?endpoint:undefined;
   if(type==='compatible'){try{const u=new URL(target);if(u.protocol!=='https:'||u.username||u.password)return reply(400,{error:'HTTPS required'})}catch{return reply(400,{error:'Invalid endpoint'})}}
   const item={id:randomBytes(12).toString('hex'),name:name.trim(),type,model:chosenModel,key,endpoint:target};
   await saveProviders([...items,item]);return reply(201,{provider:publicProvider(item)});
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
    if(response.ok&&req.method==='POST'&&path==='/v1/jobs'&&body?.autoStart===true){
     const prompt=body.prompt||'';
     // Automatic execution is restricted to text-only analysis. No shell, file mutations, or deployments.
     if(typeof prompt!=='string'||/(?:ลบไฟล์|ลบข้อมูล|deploy|merge\\s+pr|รันคำสั่ง|execute\\s+shell|rm\\s+-rf|git\\s+push)/i.test(prompt))return reply(201,{...result,status:'awaiting_approval',requiresApproval:true});
     const decision=await fetch('http://127.0.0.1:'+bridgePort+'/v1/jobs/'+result.id+'/decision',{method:'POST',headers:{Authorization:'Bearer '+bridgeToken,'Content-Type':'application/json'},body:JSON.stringify({decision:'approve'}),signal:AbortSignal.timeout(4000)});
     if(!decision.ok)return reply(502,{error:'Job queued but automatic start failed',id:result.id});
     void processApprovedJobs({token:bridgeToken,port:bridgePort,model,generate}).catch(()=>{});
     return reply(201,{...result,status:'approved',autoStarted:true});
    }
    if(response.ok&&req.method==='POST'&&path.endsWith('/decision')&&result.status==='approved'){
     void processApprovedJobs({token:bridgeToken,port:bridgePort,model,generate}).catch(()=>{});
    }
    return reply(response.status,result);
   }catch{return reply(502,{error:'Bridge unavailable'})}
  }
  if(req.method==='GET'&&req.url?.startsWith('/office/')){
   const requested=req.url.split('?')[0];
   let decoded;try{decoded=decodeURIComponent(requested)}catch{return reply(400,{error:'Invalid path'})}
   if(decoded.includes('\\\\')||decoded.includes('\\0')||decoded.split('/').includes('..'))return reply(403,{error:'Invalid path'});
   const relative=decoded==='/office/'?'index.html':decoded.slice('/office/'.length);
   const file=resolve(localDist,relative);
   if(!file.startsWith(localDist+sep))return reply(403,{error:'Invalid path'});
   const type=staticTypes[extname(file)];if(!type)return reply(404,{error:'Not found'});
   try{const page=await readFile(file);res.writeHead(200,{...headers,'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'",'Content-Type':type});return res.end(page)}catch{return reply(404,{error:'Local dashboard not built'})}
  }
  if(req.method==='GET'&&req.url==='/'){const page=await readFile(htmlPath);res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'});return res.end(page)}
  if(req.method==='POST'&&req.url==='/api/chat'){
   if(req.headers.origin!==expected)return reply(403,{error:'Same-origin request required'});
   if(active)return reply(429,{error:'มีงานกำลังประมวลผลอยู่'});
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'JSON required'});
   let body='';
   try{
    for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000)return reply(413,{error:'ข้อความยาวเกินไป'})}
    const {prompt,role='developer',history=[],providerId='local'}=JSON.parse(body);
    let agentPrompt;
    try{agentPrompt=buildAgentPrompt(role,history,prompt)}catch{return reply(400,{error:'ข้อมูลการสนทนาไม่ถูกต้อง'});}
    active=true;
    try{const provider=providerId==='local'?null:(await providers()).find(p=>p.id===providerId);if(providerId!=='local'&&!provider)return reply(400,{error:'Unknown AI provider'});const content=provider?await cloudGenerate(provider,agentPrompt):await generate(agentPrompt,{model});return reply(200,{content})}
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
