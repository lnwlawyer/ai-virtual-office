// Contract-only simulation. No fetch, provider credentials, cloud writes or paid calls.
export const AI_GATEWAY_VERSION=1;
export const AI_GATEWAY_ROLES=Object.freeze(['manager','legal','writer','designer','analyst','developer','reviewer']);
export function createMockAIRequest(role,prompt){
 if(!AI_GATEWAY_ROLES.includes(role))return {ok:false,error:'Unsupported agent role'};
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>8000)return {ok:false,error:'Invalid prompt'};
 return {ok:true,request:{version:AI_GATEWAY_VERSION,agentRole:role,prompt:prompt.trim()}};
}
export function mockAIResponse(request){
 if(!request||request.version!==AI_GATEWAY_VERSION||!AI_GATEWAY_ROLES.includes(request.agentRole)||typeof request.prompt!=='string'||!request.prompt.trim()||request.prompt.length>8000)return {ok:false,error:'Invalid mock request'};
 return {ok:true,response:{version:AI_GATEWAY_VERSION,agentRole:request.agentRole,status:'simulated',content:'[ผลจำลอง] รับคำสั่งแล้ว: '+request.prompt.slice(0,200),provider:'mock',estimatedCostBaht:0}};
}
export function validateAIResponse(data){
 if(!data||data.version!==AI_GATEWAY_VERSION||!AI_GATEWAY_ROLES.includes(data.agentRole)||!['simulated','completed'].includes(data.status)||typeof data.content!=='string'||!data.content.trim()||data.content.length>20000||typeof data.provider!=='string'||!data.provider.trim()||!Number.isFinite(data.estimatedCostBaht)||data.estimatedCostBaht<0)return {ok:false,error:'Invalid gateway response'};
 return {ok:true,value:data};
}
