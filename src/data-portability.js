// Explicit JSON export/import preview. Never auto-save or sync personal content.
const LIMIT=1024*1024;
const MAX_ITEMS=250;
export function validatePortableBackup(raw) {
  if(typeof raw!=='string'||raw.length>LIMIT)return {ok:false,error:'Backup exceeds 1 MB'};
  let data;
  try{data=JSON.parse(raw);}catch{return {ok:false,error:'Invalid JSON'};}
  if(!data||typeof data!=='object'||Array.isArray(data)||data.schemaVersion!==1)return {ok:false,error:'Unsupported backup version'};
  const names=['tasks','outputs','knowledge'];
  for(const name of names)if(!Array.isArray(data[name])||data[name].length>MAX_ITEMS)return {ok:false,error:'Invalid '+name+' list'};
  for(const task of data.tasks)if(!task||typeof task.title!=='string'||!task.title.trim()||task.title.length>160||!['low','normal','high'].includes(task.priority)||!['todo','in-progress','done'].includes(task.status))return {ok:false,error:'Invalid task'};
  for(const out of data.outputs)if(!out||typeof out.title!=='string'||!out.title.trim()||out.title.length>160||typeof out.content!=='string'||!out.content.trim()||out.content.length>20000||!['note','draft','analysis'].includes(out.type))return {ok:false,error:'Invalid output'};
  for(const item of data.knowledge)if(!item||typeof item.title!=='string'||!item.title.trim()||item.title.length>160||typeof item.body!=='string'||!item.body.trim()||item.body.length>20000||typeof item.keywords!=='string'||item.keywords.length>300||!['law','guide','policy','general'].includes(item.category))return {ok:false,error:'Invalid knowledge entry'};
  return {ok:true,summary:{tasks:data.tasks.length,outputs:data.outputs.length,knowledge:data.knowledge.length}};
}
export function exportPortableBackup(tasks,outputs,knowledge) {
  const data={schemaVersion:1,tasks:tasks.map(({title,priority,status})=>({title,priority,status})),outputs:outputs.map(({title,content,type})=>({title,content,type})),knowledge:knowledge.map(({title,body,category,keywords})=>({title,body,category,keywords}))};
  const content=JSON.stringify(data,null,2);
  const checked=validatePortableBackup(content);
  return checked.ok?{ok:true,content,summary:checked.summary}:checked;
}

export function restorePortableBackup(raw,confirm=false) {
  const validation=validatePortableBackup(raw);
  if(!validation.ok)return validation;
  if(confirm!==true)return {ok:false,error:'Explicit confirmation required'};
  const parsed=JSON.parse(raw);
  const tasks=parsed.tasks.map(({title,priority,status})=>({title,priority,status}));
  const outputs=parsed.outputs.map(({title,content,type})=>({title,content,type}));
  const knowledge=parsed.knowledge.map(({title,body,category,keywords})=>({title,body,category,keywords}));
  return {ok:true,tasks,outputs,knowledge,summary:validation.summary,storage:'memory-only'};
}
