// Standalone loopback-only local text chat. No terminal execution, secrets or cloud calls.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {generateWithOllama} from './ollama-adapter.js';
import {buildAgentPrompt} from './chat-roles.js';
const htmlPath=fileURLToPath(new URL('./chat.html',import.meta.url));
export function createLocalChatServer({port=8787,generate=generateWithOllama,model=process.env.OLLAMA_MODEL||'qwen2.5:latest'}={}){
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
   const token=process.env.LOCAL_BRIDGE_TOKEN;
   if(!token||token.length<32)return reply(200,{connected:false,reason:'Bridge token not configured'});
   try{const response=await fetch('http://127.0.0.1:8765/v1/status',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(2500)});if(!response.ok)return reply(200,{connected:false,reason:'Bridge authentication or service unavailable'});const data=await response.json();return reply(200,{connected:true,status:data})}catch{return reply(200,{connected:false,reason:'Bridge is not running'})}
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
 createLocalChatServer().listen().then(address=>console.log('Open http://127.0.0.1:'+address.port+' in your browser (local Ollama Messenger)')).catch(error=>{console.error(error.message);process.exitCode=1});
}
