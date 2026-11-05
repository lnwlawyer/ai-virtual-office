// Create a local data-only job from the command line, without exposing the token in arguments.
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {AI_GATEWAY_ROLES} from '../src/ai-gateway-contract.js';
const token=process.env.LOCAL_BRIDGE_TOKEN;
if(!token||token.length<32){console.error('Set LOCAL_BRIDGE_TOKEN first');process.exit(1)}
const rl=createInterface({input:stdin,output:stdout});
try{
 const role=(await rl.question('Agent role ('+AI_GATEWAY_ROLES.join(', ')+') [developer]: ')).trim()||'developer';
 if(!AI_GATEWAY_ROLES.includes(role))throw new Error('Unsupported agent role');
 const prompt=(await rl.question('Prompt: ')).trim();
 if(!prompt||prompt.length>8000)throw new Error('Prompt must be 1-8000 characters');
 const port=Number(process.env.LOCAL_BRIDGE_PORT||8765);
 const res=await fetch('http://127.0.0.1:'+port+'/v1/jobs',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({version:1,agentRole:role,prompt})});
 if(!res.ok)throw new Error('Bridge rejected job: HTTP '+res.status);
 const job=await res.json();
 console.log('Created job:',job.id,'status:',job.status);
}catch(error){console.error(error.message);process.exitCode=1}finally{rl.close()}
