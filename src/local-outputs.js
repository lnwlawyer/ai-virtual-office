// Ephemeral output library. Content is never sent to a server or stored persistently.
export const OUTPUT_TYPES=Object.freeze(['note','draft','analysis']);
export function createOutput(title,content,type='note') {
  if(typeof title!=='string'||!title.trim()||title.trim().length>160)return {ok:false,error:'Title must be 1–160 characters'};
  if(typeof content!=='string'||!content.trim()||content.length>20000)return {ok:false,error:'Content must be 1–20,000 characters'};
  if(!OUTPUT_TYPES.includes(type))return {ok:false,error:'Unsupported output type'};
  return {ok:true,output:{title:title.trim(),content:content.trim(),type}};
}
export function searchOutputs(outputs,query='',type='all') {
  if(!Array.isArray(outputs)||typeof query!=='string'||!['all',...OUTPUT_TYPES].includes(type))return [];
  const q=query.trim().toLocaleLowerCase();
  return outputs.filter(o=>o&&typeof o.title==='string'&&typeof o.content==='string'&&
    (type==='all'||o.type===type)&&(!q||o.title.toLocaleLowerCase().includes(q)||o.content.toLocaleLowerCase().includes(q)));
}
export function exportOutputs(outputs) {
  if(!Array.isArray(outputs)||outputs.some(o=>!createOutput(o?.title,o?.content,o?.type).ok))return {ok:false,error:'Invalid outputs'};
  return {ok:true,content:JSON.stringify({schemaVersion:1,outputs:outputs.map(({title,content,type})=>({title,content,type}))},null,2)};
}
