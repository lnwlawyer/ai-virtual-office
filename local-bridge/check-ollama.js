// Safe local diagnostics: read-only checks, no bridge job creation, no command execution.
import {generateWithOllama} from './ollama-adapter.js';
export async function checkLocalOllama({fetchImpl=fetch,model='qwen2.5:latest',generate=generateWithOllama}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetchImpl('http://127.0.0.1:11434/api/tags',{signal:controller.signal});
  if(!response.ok)throw new Error('Ollama health HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.models))throw new Error('Unexpected Ollama model list');
  const installed=data.models.map(item=>item.name).filter(name=>typeof name==='string');
  const found=installed.includes(model);
  return {reachable:true,modelInstalled:found,model,installed};
 }finally{clearTimeout(timer)}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const model=process.env.OLLAMA_MODEL||'qwen2.5:latest';
 checkLocalOllama({model}).then(async status=>{
  console.log('Ollama localhost:',status.reachable?'reachable':'unavailable');
  console.log('Requested model:',status.model,status.modelInstalled?'installed':'not installed');
  console.log('Installed models:',status.installed.join(', ')||'(none)');
  if(!status.modelInstalled){process.exitCode=1;return}
  if(process.env.OLLAMA_SMOKE_GENERATE==='1'){
   const answer=await generateWithOllama('ตอบคำว่า พร้อมใช้งาน เป็นภาษาไทยอย่างสั้น',{model,timeoutMs:60000});
   console.log('Local generation result:',answer.slice(0,400));
  }
 }).catch(error=>{console.error('Local Ollama check failed:',error.message);process.exitCode=1});
}
