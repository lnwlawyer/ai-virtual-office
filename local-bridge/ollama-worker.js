// Explicit opt-in local worker: processes only jobs already approved by the operator.
import {generateWithOllama} from './ollama-adapter.js';
import {parseWorkflow,runWorkflow} from './multi-agent-workflow.js';
const BASE='http://127.0.0.1:';
export async function processApprovedJobs({token,port=8765,model='qwen2.5:latest',fetchImpl=fetch,generate=generateWithOllama}={}){
 if(typeof token!=='string'||token.length<32)throw new Error('LOCAL_BRIDGE_TOKEN is required');
 if(!Number.isInteger(Number(port))||Number(port)<1||Number(port)>65535)throw new Error('Invalid bridge port');
 const api=async(path,method='GET',body)=>{
  const response=await fetchImpl(BASE+port+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok)throw new Error('Bridge returned HTTP '+response.status);
  return response.json();
 };
 const {jobs}=await api('/v1/jobs');
 let completed=0,failed=0;
 for(const entry of jobs.filter(job=>job.status==='approved')){
  const job=await api('/v1/jobs/'+entry.id);
  if(job.status!=='approved')continue;
  try{
   const content=parseWorkflow(job.prompt)?await runWorkflow(job.prompt,{generate,model,onProgress:progress=>api('/v1/jobs/'+job.id+'/progress','POST',progress)}):await generate(job.prompt,{model});
   await api('/v1/jobs/'+job.id+'/result','POST',{status:'completed',content});
   completed++;
  }catch(error){
   // Do not expose sensitive prompt or server internals in job results.
   const safe=/^Workflow failed at (analyst|writer|reviewer|manager) \((timeout|model_not_found|ollama_unavailable|generation_error|empty_response)\)$/.test(error?.message||'')?error.message:'Local Ollama generation failed';
   await api('/v1/jobs/'+job.id+'/result','POST',{status:'failed',content:safe});
   failed++;
  }
 }
 return {completed,failed};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 processApprovedJobs({token:process.env.LOCAL_BRIDGE_TOKEN,port:Number(process.env.LOCAL_BRIDGE_PORT||8765),model:process.env.OLLAMA_MODEL||'qwen2.5:latest'})
  .then(result=>console.log('Local Ollama processing:',JSON.stringify(result)))
  .catch(error=>{console.error(error.message);process.exitCode=1});
}
