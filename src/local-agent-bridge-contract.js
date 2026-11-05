// Local bridge protocol v1. Data-only messages; never executable shell commands.
import {AI_GATEWAY_ROLES} from './ai-gateway-contract.js';
export const LOCAL_BRIDGE_VERSION=1;
export const LOCAL_BRIDGE_MAX_PROMPT=8000;
export function validateBridgeJob(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==LOCAL_BRIDGE_VERSION||!AI_GATEWAY_ROLES.includes(value.agentRole)||typeof value.prompt!=='string'||!value.prompt.trim()||value.prompt.length>LOCAL_BRIDGE_MAX_PROMPT)return {ok:false,error:'Invalid bridge job'};
 return {ok:true,value:{version:LOCAL_BRIDGE_VERSION,agentRole:value.agentRole,prompt:value.prompt.trim()}};
}
export function validateBridgeResult(value){
 if(!value||typeof value!=='object'||!['completed','failed'].includes(value.status)||typeof value.content!=='string'||value.content.length>20000)return {ok:false,error:'Invalid bridge result'};
 return {ok:true,value:{status:value.status,content:value.content}};
}
