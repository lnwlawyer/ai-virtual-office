import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeServer} from '../local-bridge/server.js';
import {processApprovedJobs} from '../local-bridge/ollama-worker.js';
import {generateWithOllama} from '../local-bridge/ollama-adapter.js';
const token='ollama-test-token-more-than-thirty-two-characters';
test('Ollama adapter uses localhost text-only API',async()=>{
 let called=false;
 const text=await generateWithOllama('hello',{fetchImpl:async(url,opts)=>{
  called=true;assert.equal(url,'http://127.0.0.1:11434/api/generate');
  const data=JSON.parse(opts.body);assert.equal(data.stream,false);assert.equal(data.model,'qwen2.5:latest');
  assert.equal(data.tools,undefined);
  return {ok:true,text:async()=>JSON.stringify({response:'สวัสดี'})};
 }});
 assert.equal(called,true);assert.equal(text,'สวัสดี');
});
test('worker processes approved jobs and never unapproved jobs',async()=>{
 const bridge=createBridgeServer({token,port:0});
 const {port}=await bridge.listen();
 const api=async(path,method='GET',body)=>{const res=await fetch('http://127.0.0.1:'+port+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return res.json()};
 try{
  const a=await api('/v1/jobs','POST',{version:1,agentRole:'developer',prompt:'approved prompt'});
  const b=await api('/v1/jobs','POST',{version:1,agentRole:'legal',prompt:'pending prompt'});
  await api('/v1/jobs/'+a.id+'/decision','POST',{decision:'approve'});
  const prompts=[];
  const result=await processApprovedJobs({token,port,generate:async prompt=>{prompts.push(prompt);return 'Real model output'}});
  assert.deepEqual(result,{completed:1,failed:0});
  assert.deepEqual(prompts,['approved prompt']);
  assert.equal((await api('/v1/jobs/'+a.id)).status,'completed');
  assert.equal((await api('/v1/jobs/'+b.id)).status,'awaiting_approval');
 }finally{await bridge.close()}
});
