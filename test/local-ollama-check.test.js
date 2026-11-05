import test from 'node:test';
import assert from 'node:assert/strict';
import {checkLocalOllama} from '../local-bridge/check-ollama.js';
test('diagnostics list installed models without generating or executing commands',async()=>{
 const status=await checkLocalOllama({fetchImpl:async(url)=>{
  assert.equal(url,'http://127.0.0.1:11434/api/tags');
  return {ok:true,json:async()=>({models:[{name:'qwen2.5:latest'}]})};
 }});
 assert.equal(status.reachable,true);
 assert.equal(status.modelInstalled,true);
});
test('diagnostics report missing model without claiming it is installed',async()=>{
 const status=await checkLocalOllama({fetchImpl:async()=>({ok:true,json:async()=>({models:[]})})});
 assert.equal(status.modelInstalled,false);
});
