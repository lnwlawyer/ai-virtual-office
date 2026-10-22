// Ephemeral task board: no persistence, external APIs, or automation.
export const TASK_STATUSES=Object.freeze(['todo','in-progress','done']);
export const TASK_PRIORITIES=Object.freeze(['low','normal','high']);
export function createTask(title,priority='normal') {
  if(typeof title!=='string'||!title.trim()||title.trim().length>160)return {ok:false,error:'Task title must be 1–160 characters'};
  if(!TASK_PRIORITIES.includes(priority))return {ok:false,error:'Unsupported priority'};
  return {ok:true,task:{title:title.trim(),priority,status:'todo'}};
}
export function updateTaskStatus(task,status) {
  if(!task||!TASK_STATUSES.includes(task.status)||!TASK_STATUSES.includes(status))return {ok:false,error:'Invalid task status'};
  return {ok:true,task:{...task,status}};
}
export function taskSummary(tasks) {
  if(!Array.isArray(tasks))return {ok:false,error:'Invalid task list'};
  if(tasks.some(t=>!t||!TASK_STATUSES.includes(t.status)))return {ok:false,error:'Invalid task'};
  return {ok:true,total:tasks.length,todo:tasks.filter(t=>t.status==='todo').length,inProgress:tasks.filter(t=>t.status==='in-progress').length,done:tasks.filter(t=>t.status==='done').length};
}
export function safeExportTasks(tasks) {
  const summary=taskSummary(tasks);
  if(!summary.ok)return summary;
  return {ok:true,content:JSON.stringify({schemaVersion:1,tasks:tasks.map(({title,priority,status})=>({title,priority,status}))},null,2)};
}
