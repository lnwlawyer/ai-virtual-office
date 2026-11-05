// Local Ollama adapter. Only text generation, no tool calls or shell execution.
export const OLLAMA_DEFAULT_MODEL='qwen2.5:latest';
export async function generateWithOllama(prompt,{model=OLLAMA_DEFAULT_MODEL,fetchImpl=fetch,timeoutMs=120000}={}){
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>8000)throw new Error('Invalid prompt');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model))throw new Error('Invalid Ollama model');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchImpl('http://127.0.0.1:11434/api/generate',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({model,prompt,stream:false,options:{num_predict:1024}}),
   signal:controller.signal
  });
  if(!response.ok)throw new Error('Ollama returned HTTP '+response.status);
  const body=await response.text();
  if(body.length>100000)throw new Error('Ollama response too large');
  const data=JSON.parse(body);
  if(typeof data.response!=='string'||!data.response.trim())throw new Error('Empty Ollama response');
  return data.response.slice(0,20000);
 }finally{clearTimeout(timer)}
}
