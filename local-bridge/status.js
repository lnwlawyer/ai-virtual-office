import {AI_GATEWAY_ROLES} from '../src/ai-gateway-contract.js';
const STATUSES=['awaiting_approval','approved','rejected','completed','failed'];
export function buildBridgeStatus(jobs){
 const values=[...jobs.values()];
 const totals=Object.fromEntries(STATUSES.map(status=>[status,values.filter(job=>job.status===status).length]));
 const agents=AI_GATEWAY_ROLES.map(id=>{
  const assigned=values.filter(job=>job.agentRole===id);
  const last=assigned.at(-1);
  return {id,connection:'not_connected',execution:'manual_only',totalJobs:assigned.length,pendingApproval:assigned.filter(job=>job.status==='awaiting_approval').length,approved:assigned.filter(job=>job.status==='approved').length,lastJobStatus:last?.status||null,lastActivity:last?.finishedAt||last?.decidedAt||last?.createdAt||null};
 });
 return {version:1,mode:'local_manual_only',connectedDevices:0,totals:{all:values.length,...totals},agents,recent:values.slice(-20).reverse().map(({id,agentRole,status,createdAt,decidedAt,finishedAt})=>({id,agentRole,status,createdAt,decidedAt:decidedAt||null,finishedAt:finishedAt||null}))};
}
