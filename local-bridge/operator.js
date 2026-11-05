// Manual local operator: review, approve/reject and record results; never executes shell commands.
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
const token=process.env.LOCAL_BRIDGE_TOKEN;
const base='http://127.0.0.1:'+String(Number(process.env.LOCAL_BRIDGE_PORT||8765));
if(!token||token.length<32){console.error('Set LOCAL_BRIDGE_TOKEN (32+ chars) before starting the operator');process.exit(1)}
const api=async(path,method='GET',body)=>{
 const res=await fetch(base+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await res.json();
 if(!res.ok)throw new Error(data.error||'Bridge error');
 return data;
};
const rl=createInterface({input,output});
try{
 const {jobs}=await api('/v1/jobs');
 const waiting=jobs.filter(j=>j.status==='awaiting_approval');
 if(!waiting.length)console.log('No pending jobs');
 for(const entry of waiting){
  const job=await api('/v1/jobs/'+entry.id);
  console.log('\nRole:',job.agentRole,'\nPrompt:',job.prompt);
  const decision=(await rl.question('Approve this data-only job? [y/N] ')).trim().toLowerCase()==='y'?'approve':'reject';
  await api('/v1/jobs/'+job.id+'/decision','POST',{decision});
  if(decision==='reject'){console.log('Rejected',job.id);continue}
  console.log('Approved. Run any external agent separately under your own control; paste its text result here.');
  const content=await rl.question('Result text (empty to mark failed): ');
  const status=content.trim()?'completed':'failed';
  await api('/v1/jobs/'+job.id+'/result','POST',{status,content:content||'No result supplied'});
  console.log('Recorded',job.id,status);
 }
}catch(error){console.error(error.message);process.exitCode=1}finally{rl.close()}
