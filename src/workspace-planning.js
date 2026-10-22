// Local-only planning utilities. No network, persistence, or AI provider calls.
export const MAX_PROMPT_LENGTH=8000;
export const WORK_MODES=Object.freeze(['Single','Compare','Team']);
export const AGENT_ROLES=Object.freeze(['Office Manager','Legal Research','Document Writer','Creative Designer','Data Analyst','Developer','Quality Reviewer']);
export function validatePrompt(input) {
  if(typeof input!=='string') return {ok:false,error:'Prompt must be text'};
  const value=input.trim();
  if(!value)return {ok:false,error:'Enter a prompt'};
  if(value.length>MAX_PROMPT_LENGTH)return {ok:false,error:'Prompt exceeds 8,000 characters'};
  return {ok:true,value};
}
export function buildPreviewPlan(mode,providerIds,prompt) {
  const checked=validatePrompt(prompt);
  if(!checked.ok)return checked;
  if(!WORK_MODES.includes(mode))return {ok:false,error:'Unsupported mode'};
  const available=['openai','gemini','claude'];
  if(!Array.isArray(providerIds)||!providerIds.length||providerIds.some(id=>!available.includes(id)))return {ok:false,error:'Invalid providers'};
  const selected=[...new Set(providerIds)];
  if(mode==='Single' && selected.length!==1)return {ok:false,error:'Single mode requires one provider'};
  if(mode==='Compare' && selected.length<2)return {ok:false,error:'Compare mode requires multiple providers'};
  return {ok:true,mode,providers:selected,prompt:checked.value,execution:'disabled',estimatedCostBaht:null};
}
export function budgetStatus(spent,limit=500) {
  if(!Number.isFinite(spent)||spent<0||!Number.isFinite(limit)||limit<=0)return {ok:false,error:'Invalid budget'};
  return {ok:true,spent,limit,remaining:Math.max(0,limit-spent),blocked:spent>=limit};
}
export function safeDocumentMetadata(name,size,type) {
  if(typeof name!=='string'||!name.trim()||name.length>180||!Number.isSafeInteger(size)||size<0||size>20*1024*1024)
    return {ok:false,error:'Invalid file metadata'};
  const types=['application/pdf','text/plain','text/markdown'];
  if(!types.includes(type))return {ok:false,error:'Unsupported document type'};
  return {ok:true,name:name.trim(),size,type,storage:'none'};
}
