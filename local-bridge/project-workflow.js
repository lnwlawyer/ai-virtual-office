// One approved job represents a bounded multi-agent project; no tools or shell execution.
import {buildAgentPrompt} from './chat-roles.js';
import {reviewVerdict,routeWorkflow} from './multi-agent-workflow.js';
export const PROJECT_PREFIX='PROJECT_V1:';
const ROUTES={legal:['legal','writer'],development:['developer','analyst'],design:['designer','writer'],general:['analyst','writer']};
export function createProject(goal){
 if(typeof goal!=='string'||!goal.trim()||goal.length>1500)throw Error('Invalid project goal');
 return PROJECT_PREFIX+JSON.stringify({version:1,goal:goal.trim(),route:routeWorkflow(goal)});
}
export function parseProject(prompt){
 if(typeof prompt!=='string'||!prompt.startsWith(PROJECT_PREFIX))return null;
 let data;try{data=JSON.parse(prompt.slice(PROJECT_PREFIX.length))}catch{throw Error('Invalid project JSON')}
 if(!data||data.version!==1||typeof data.goal!=='string'||!data.goal.trim()||data.goal.length>1500||data.route!==routeWorkflow(data.goal))throw Error('Invalid project');
 return {goal:data.goal.trim(),route:data.route};
}
const ask=async(generate,model,role,text)=>{
 const result=await generate(buildAgentPrompt(role,[],text.slice(0,3800)),{model});
 if(typeof result!=='string'||!result.trim())throw Error('Project agent returned empty response');
 return result.slice(0,3500);
};
export async function runProject(prompt,{generate,model,onProgress=async()=>{}}){
 const project=parseProject(prompt);if(!project)throw Error('Not a project');
 const roles=ROUTES[project.route],tasks=[];
 const report=async(role,stage,status)=>onProgress({role,stage,total:4,status});
 // Fixed scope and explicit handoff: manager plans, two specialists execute, reviewer checks, manager consolidates.
 await report('manager',1,'running');
 const plan=await ask(generate,model,'manager','แบ่งโครงการต่อไปนี้เป็น 2 งานย่อยที่ชัดเจนและตรวจสอบได้ โดยไม่กล่าวอ้างว่าได้แก้ไฟล์หรือใช้เครื่องมือจริง: '+project.goal);
 await report('manager',1,'completed');
 for(let i=0;i<roles.length;i++){
  const role=roles[i];
  await report(role,i+2,'running');
  const output=await ask(generate,model,role,'เป้าหมายโครงการ: '+project.goal+'\nแผนผู้จัดการ (ข้อมูลอ้างอิง): '+plan.slice(0,1100)+'\nรับผิดชอบงานย่อยลำดับ '+(i+1)+' จากสองงาน แสดงผลลัพธ์พร้อมข้อจำกัดและสิ่งที่ต้องตรวจสอบ');
  tasks.push({role,output});await report(role,i+2,'completed');
 }
 let draft=tasks.map((t,i)=>'งานย่อย '+(i+1)+' ('+t.role+'):\n'+t.output.slice(0,1500)).join('\n\n');
 let review='',accepted=false;
 for(let attempt=0;attempt<2;attempt++){
  await report('reviewer',4,'running');
  review=await ask(generate,model,'reviewer','ตรวจสอบผลงานโครงการตามเป้าหมาย: '+project.goal+'\n'+draft+'\nเริ่มคำตอบด้วยบรรทัด VERDICT: PASS หรือ VERDICT: REVISE จากนั้นระบุข้อผิดพลาดหรือข้อจำกัด');
  await report('reviewer',4,'completed');
  if(reviewVerdict(review)==='PASS'){accepted=true;break}
  if(attempt===1)break;
  // Return review to both original owners once, then review again.
  for(let i=0;i<tasks.length;i++){
   const t=tasks[i];await report(t.role,i+2,'running');
   t.output=await ask(generate,model,t.role,'ปรับปรุงงานย่อยจากข้อเสนอแนะฝ่ายตรวจสอบ\nเป้าหมาย: '+project.goal+'\nงานเดิม: '+t.output.slice(0,1100)+'\nข้อเสนอแนะ: '+review.slice(0,1100));
   await report(t.role,i+2,'completed');
  }
  // Update draft for second review.
  const updated=tasks.map((t,i)=>'งานย่อย '+(i+1)+' ('+t.role+'):\n'+t.output.slice(0,1500)).join('\n\n');
  draft=updated;
 }
 if(!accepted)throw Error('Project quality gate rejected (revision_limit)');
 await report('manager',4,'running');
 const final=await ask(generate,model,'manager','สรุปผลโครงการเป็นรายงานเดียว\nเป้าหมาย: '+project.goal+'\n'+tasks.map((t,i)=>'งานย่อย '+(i+1)+': '+t.output.slice(0,1100)).join('\n')+'\nผลตรวจสอบ: '+review.slice(0,700)+'\nระบุว่านี่เป็นผลจากโมเดล ไม่ใช่การตรวจสอบข้อเท็จจริงภายนอก');
 await report('manager',4,'completed');
 return ('โครงการ: '+project.goal+'\nแผนงาน:\n'+plan+'\n\n'+tasks.map((t,i)=>'งานย่อย '+(i+1)+' - '+t.role+'\n'+t.output).join('\n\n')+'\n\nผลตรวจสอบ:\n'+review+'\n\nสรุปโครงการ:\n'+final).slice(0,19000);
}
