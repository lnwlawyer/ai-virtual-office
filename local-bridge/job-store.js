// Atomic JSON snapshots for local bridge state; no network, commands or external dependencies.
import {readFile,writeFile,rename,mkdir,chmod} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
const STATES=new Set(['awaiting_approval','approved','rejected','completed','failed']);
export function createJobStore(filePath){
 if(!filePath||typeof filePath!=='string')throw new Error('A storage file path is required');
 const path=resolve(filePath);
 const jobs=new Map();
 let tail=Promise.resolve();
 async function load(){
  let raw;
  try{raw=await readFile(path,'utf8')}catch(error){if(error.code==='ENOENT')return jobs;throw error}
  const parsed=JSON.parse(raw);
  if(!parsed||parsed.version!==1||!Array.isArray(parsed.jobs)||parsed.jobs.length>100)throw new Error('Invalid bridge state');
  const next=new Map();
  for(const job of parsed.jobs){
   if(!job||typeof job.id!=='string'||!/^[0-9a-f-]{36}$/.test(job.id)||typeof job.agentRole!=='string'||typeof job.prompt!=='string'||!STATES.has(job.status)||next.has(job.id))throw new Error('Invalid persisted job');
   next.set(job.id,job);
  }
  jobs.clear();for(const [id,job] of next)jobs.set(id,job);
  return jobs;
 }
 async function save(){
  const snapshot=JSON.stringify({version:1,jobs:[...jobs.values()]});
  const tmp=path+'.'+randomUUID()+'.tmp';
  await mkdir(dirname(path),{recursive:true,mode:0o700});
  try{
   await writeFile(tmp,snapshot,{encoding:'utf8',mode:0o600,flag:'wx'});
   await rename(tmp,path);
   await chmod(path,0o600);
  }catch(error){
   try{const {unlink}=await import('node:fs/promises');await unlink(tmp)}catch{}
   throw error;
  }
 }
 function commit(mutator){
  const run=tail.then(async()=>{
   const previous=new Map([...jobs].map(([id,job])=>[id,{...job}]));
   const value=mutator(jobs);
   try{await save()}catch(error){jobs.clear();for(const [id,job] of previous)jobs.set(id,job);throw error}
   return value;
  });
  tail=run.catch(()=>{});
  return run;
 }
 return {jobs,load,commit,path};
}
