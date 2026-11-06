import React,{useState,useEffect,useRef} from 'react';
import {STAFF} from './virtual-office-model.js';

import './messenger-dashboard.css';

const groups=[
 {name:'บริหารและประสานงาน',ids:['manager','reviewer']},
 {name:'กฎหมายและเอกสาร',ids:['legal','writer']},
 {name:'สร้างสรรค์และข้อมูล',ids:['designer','analyst']},
 {name:'พัฒนาระบบ',ids:['developer']}
];
const moods={manager:'พร้อมรับเรื่องทุกแผนก ☕',legal:'ค้นคำตอบจากข้อเท็จจริง 📚',writer:'ร่างงานอยู่ อย่าเพิ่งปิดไฟ ✍️',designer:'ไอเดียใหม่กำลังมา 🎨',analyst:'ตัวเลขไม่เคยโกหก 📊',developer:'แก้บั๊กอีกนิดเดียว 💻',reviewer:'ตรวจให้ครบก่อนส่งงาน ✓'};
const quickPromptsByRole={
 manager:['สรุปงานของทีมวันนี้','จัดลำดับความสำคัญของงาน','วางแผนประสานงานระหว่างฝ่าย'],
 legal:['วิเคราะห์ประเด็นข้อกฎหมาย','สรุปข้อเท็จจริงและข้อกฎหมาย','ตรวจสอบเอกสารอ้างอิงทางกฎหมาย'],
 writer:['จัดทำร่างหนังสือราชการ','ปรับข้อความให้กระชับเป็นทางการ','สรุปสาระสำคัญเป็นหัวข้อ'],
 designer:['เสนอแนวคิดอินโฟกราฟิก','จัดโครงร่างสไลด์นำเสนอ','ออกแบบแนวทางภาพประกอบ'],
 analyst:['วิเคราะห์ข้อมูลและแนวโน้ม','ตรวจสอบความสอดคล้องของตัวเลข','จัดทำสรุปผลเชิงสถิติ'],
 developer:['ตรวจสอบปัญหาโปรแกรม','เสนอแนวทางแก้ไขบั๊ก','ออกแบบแผนการทดสอบระบบ'],
 reviewer:['ตรวจสอบความครบถ้วนของงาน','ประเมินความเสี่ยงก่อนเผยแพร่','สรุปข้อเสนอแนะเพื่อปรับปรุง']
};
const displayState={online:'ออนไลน์',busy:'กำลังทำงาน',waiting:'รออนุมัติ',offline:'ออฟไลน์'};
export default function MessengerDashboard({tasks=[],onCreateTaskDraft,onUpdateTaskStatus,onSaveOutput,selected,setSelected,messages,setMessages}){
 const [query,setQuery]=useState('');
 const [activeOnly,setActiveOnly]=useState(false);
 const [draftOnly,setDraftOnly]=useState(false);
 const [sortContacts,setSortContacts]=useState('default');
 const [appendQuickPrompt,setAppendQuickPrompt]=useState(false);
 const [pendingDeleteId,setPendingDeleteId]=useState(null);
 const [chatQuery,setChatQuery]=useState('');
 const [messageFilter,setMessageFilter]=useState('all');
 const [searchCaseSensitive,setSearchCaseSensitive]=useState(false);
 const [drafts,setDrafts]=useState({});
 const draft=drafts[selected]||'';
 const setDraft=value=>setDrafts(prev=>({...prev,[selected]:value}));
 const [collapsed,setCollapsed]=useState([]);
 const [pending,setPending]=useState(false);
 const local=['127.0.0.1','localhost'].includes(window.location.hostname);
 const [jobs,setJobs]=useState([]);
 const [jobError,setJobError]=useState('');
 const [jobMode,setJobMode]=useState('chat');
 const [jobDetail,setJobDetail]=useState(null);
 const [providers,setProviders]=useState([{id:'local',name:'Ollama (Local)',type:'local'}]);
 const [providerId,setProviderId]=useState('local');
 const [providerForm,setProviderForm]=useState({name:'',type:'gemini',model:'',key:'',endpoint:''});
 const [providerNotice,setProviderNotice]=useState('');
 async function refreshProviders(){if(!local)return;try{const r=await fetch('/api/providers');if(r.ok){const data=await r.json();setProviders(data.providers||[]);setProviderId(prev=>(data.providers||[]).some(p=>p.id===prev)?prev:'local')}}catch{setProviderNotice('ไม่สามารถโหลดรายชื่อโมเดล')}}
 useEffect(()=>{refreshProviders()},[local]);
 async function addProvider(event){event.preventDefault();try{const r=await fetch('/api/providers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(providerForm)});const data=await r.json();if(!r.ok)throw Error(data.error||'เพิ่มไม่ได้');setProviderForm({name:'',type:'gemini',model:'',key:'',endpoint:''});setProviderNotice('เพิ่มผู้ให้บริการแล้ว');await refreshProviders()}catch(error){setProviderNotice(error.message)}}
 async function removeProvider(id){try{const r=await fetch('/api/providers',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(!r.ok)throw Error();setProviderNotice('ลบการเชื่อมต่อแล้ว');await refreshProviders()}catch{setProviderNotice('ลบไม่สำเร็จ')}}

 const trackedJobs=useRef(new Map());
 const reportedJobs=useRef(new Set());
 const polling=useRef(false);
 async function refreshJobs(){
  if(!local||polling.current)return;
  polling.current=true;
  try{
   const r=await fetch('/api/jobs');if(!r.ok)throw Error('ไม่สามารถอ่านคิวงาน');
   const data=await r.json();
   const list=Array.isArray(data)?data:Array.isArray(data.jobs)?data.jobs:[];
   setJobs(list);setJobError('');
   for(const job of list){
    const tracked=trackedJobs.current.get(job.id);
    if(!tracked||reportedJobs.current.has(job.id)||!['completed','failed','rejected'].includes(job.status))continue;
    const detailResponse=await fetch('/api/jobs/'+encodeURIComponent(job.id));
    if(!detailResponse.ok)continue;
    const detail=await detailResponse.json();
    if(!['completed','failed','rejected'].includes(detail.status))continue;
    reportedJobs.current.add(job.id);
    trackedJobs.current.delete(job.id);
    const resultText=typeof detail.content==='string'?detail.content.trim():'';
    const title=detail.status==='completed'?'งานเสร็จแล้ว':detail.status==='failed'?'งานไม่สำเร็จ':'งานถูกปฏิเสธ';
    const report='รายงานจากผู้จัดการ · '+title+' · '+tracked.label+' · เลขงาน '+job.id.slice(0,8)+'\\n'+(resultText||'ไม่มีรายละเอียดผลการทำงาน');
    const message={id:crypto.randomUUID(),who:'agent',text:report,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
    setMessages(prev=>({...prev,[tracked.chatRole]:[...(prev[tracked.chatRole]||[]),message]}));
   }
  }catch{setJobError('ไม่สามารถเชื่อมต่อคิวงานในเครื่อง')}
  finally{polling.current=false}
 }
 useEffect(()=>{if(!local)return;refreshJobs();const id=setInterval(refreshJobs,2000);return()=>clearInterval(id)},[local]);
 async function decide(job,decision){try{const r=await fetch('/api/jobs/'+encodeURIComponent(job.id)+'/decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision})});if(!r.ok)throw Error();await refreshJobs()}catch{setJobError('ไม่สามารถดำเนินการอนุมัติได้')}}
 async function viewJob(job){try{const r=await fetch('/api/jobs/'+encodeURIComponent(job.id));if(!r.ok)throw Error();setJobDetail(await r.json())}catch{setJobError('ไม่สามารถอ่านผลการทำงานได้')}}
 const taskIntent=message=>{
  const value=message.trim();
  if(/สวัสดี|แนะนำตัว|คุณเป็นใคร|ทำอะไรได้บ้าง|ช่วยอะไรได้บ้าง|ทำหน้าที่อะไร|คืออะไร|หมายถึงอะไร|ขอบคุณ|ทักทาย/i.test(value))return false;
  return /มอบหมาย|ส่งงาน|ให้ฝ่าย|จัดทำ(?:รายงาน|เอกสาร|หนังสือ|สไลด์)|ตรวจสอบ(?:เอกสาร|ข้อมูล|ข้อกฎหมาย|งาน)|วิเคราะห์(?:ข้อมูล|สถิติ|กฎหมาย)|ร่าง(?:หนังสือ|เอกสาร)|ออกแบบ(?:ภาพ|อินโฟกราฟิก|หน้าจอ)|พัฒนา(?:ระบบ|เว็บไซต์|โปรแกรม)|แก้ไข(?:บั๊ก|โค้ด|ระบบ)|สร้าง(?:ภาพ|ไฟล์|โปรแกรม)|วางแผน(?:โครงการ|งาน)|ประเมิน(?:ความเสี่ยง|โครงการ)/.test(value);
 };
 const fallbackRole=message=>/กฎหมาย|ที่ดิน|มาตรา|คำพิพากษา|สัญญา|legal/i.test(message)?'legal':/โค้ด|โปรแกรม|เว็บไซต์|บั๊ก|API|ซอฟต์แวร์/i.test(message)?'developer':/ออกแบบ|ภาพ|อินโฟกราฟิก|สไลด์/i.test(message)?'designer':/ข้อมูล|สถิติ|ตัวเลข|วิเคราะห์/i.test(message)?'analyst':/เอกสาร|หนังสือ|รายงาน|ร่าง/i.test(message)?'writer':'reviewer';
 async function planManagerTask(message){
  const instruction='คุณเป็นผู้จัดการสำนักงาน AI จงเลือกฝ่ายที่เหมาะสมที่สุดสำหรับงานที่ผู้ใช้สั่ง โดยเลือกจาก legal,writer,analyst,designer,developer,reviewer เท่านั้น ตอบ JSON เพียงอย่างเดียวรูปแบบ {"role":"legal","reason":"เหตุผลสั้น"} ห้ามตอบอย่างอื่น งาน: '+message;
  let chosen=fallbackRole(message),reason='เลือกตามประเภทงาน';
  try{
   const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'manager',prompt:instruction,history:[],providerId})});
   if(r.ok){const result=await r.json();const match=String(result.content||'').match(/\\{[^{}]*"role"\\s*:\\s*"(legal|writer|analyst|designer|developer|reviewer)"[^{}]*\\}/);
    if(match){const parsed=JSON.parse(match[0]);chosen=parsed.role;reason=String(parsed.reason||reason).slice(0,180);}
   }
  }catch{}
  return {role:chosen,label:STAFF.find(s=>s.id===chosen)?.name||chosen,reason};
 }
 const routeFor=goal=>/กฎหมาย|ที่ดิน|มาตรา|คำพิพากษา|legal|law/i.test(goal)?'legal':/โค้ด|โปรแกรม|เว็บไซต์|บั๊ก|code|software|api/i.test(goal)?'development':/ออกแบบ|ภาพ|อินโฟกราฟิก|ui|ux|design/i.test(goal)?'design':'general';

 const [exportNotice,setExportNotice]=useState('');
 const [copyNotice,setCopyNotice]=useState('');
 const [confirmClear,setConfirmClear]=useState(false);
 const [confirmClearAll,setConfirmClearAll]=useState(false);
 const staff=STAFF.find(x=>x.id===selected);
 const conversation=messages[selected]||[];
 const totalMessages=Object.values(messages).reduce((sum,items)=>sum+(Array.isArray(items)?items.length:0),0);
 const hasRosterFilters=Boolean(query.trim())||activeOnly||draftOnly||sortContacts!=='default';
 const visibleContactCount=STAFF.filter(member=>(!activeOnly||(messages[member.id]||[]).length>0)&&(!draftOnly||(drafts[member.id]||'').trim())&&[member.name,member.role,moods[member.id]].join(' ').toLowerCase().includes(query.toLowerCase())).length;
 const visibleMessages=conversation.filter(message=>(messageFilter==='all'||message.who===messageFilter)&&(searchCaseSensitive?message.text.includes(chatQuery.trim()):message.text.toLocaleLowerCase().includes(chatQuery.trim().toLocaleLowerCase())));
 const hasMessageFilters=Boolean(chatQuery.trim())||messageFilter!=='all'||searchCaseSensitive;
 const unreadTasks=id=>tasks.filter(t=>t.assignee===id&&t.status!=='done').length;
 const status=id=>pending&&id===selected?'busy':unreadTasks(id)>0?'busy':'online';
 async function copyMessage(message){
  try{
   if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
   await navigator.clipboard.writeText(message.text);
   setCopyNotice('คัดลอกข้อความแล้ว');
  }catch{
   setCopyNotice('ไม่สามารถคัดลอกได้ โปรดตรวจสอบสิทธิ์คลิปบอร์ด');
  }
 }
 function exportAllJSON(){
  if(!totalMessages)return;
  const data={version:1,source:'AI Virtual Office simulated Messenger',exportedAt:new Date().toISOString(),conversations:STAFF.map(member=>({employee:{id:member.id,name:member.name,role:member.role},messages:(messages[member.id]||[]).map(item=>({who:item.who,text:item.text,time:item.time||null}))}))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='messenger-all-conversations.json';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  setExportNotice('เตรียมไฟล์รวมทุกบทสนทนาแล้ว');
 }
 function exportJSON(){
  const items=messages[selected]||[];
  if(!items.length)return;
  const data={version:1,source:'AI Virtual Office simulated Messenger',employee:{id:staff.id,name:staff.name,role:staff.role},exportedAt:new Date().toISOString(),messages:items.map(item=>({who:item.who,text:item.text,time:item.time||null}))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='messenger-'+selected+'-transcript.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setExportNotice('เตรียมไฟล์ JSON สำหรับดาวน์โหลดแล้ว');
 }
 function exportTranscript(){
  const items=messages[selected]||[];
  if(!items.length)return;
  const content=['บทสนทนากับ '+staff.name,'ข้อมูลจากระบบ AI จำลอง ไม่ใช่คำตอบจาก AI API','',...items.map(item=>'['+(item.time||'ไม่ระบุเวลา')+'] '+(item.who==='user'?'คุณ':staff.name)+': '+item.text)].join('\n');
  const blob=new Blob(['\uFEFF',content],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='messenger-'+selected+'-transcript.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setExportNotice('เตรียมไฟล์บทสนทนาสำหรับดาวน์โหลดแล้ว');
 }
 async function send(event){
  event.preventDefault();
  if(pending||!local)return;
  const text=draft.trim();if(!text||text.length>4000)return;
  const role=selected;
  const history=(messages[role]||[]).slice(-8).map(m=>({role:m.who==='user'?'user':'assistant',content:m.text.slice(0,1500)}));
  const sent={id:crypto.randomUUID(),who:'user',text,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
  setMessages(prev=>({...prev,[role]:[...(prev[role]||[]),sent]}));setDraft('');setPending(true);
  try{
   const delegation=jobMode==='chat'&&role==='manager'&&taskIntent(text)?await planManagerTask(text):null;
   if(delegation){
    const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:1,agentRole:delegation.role,prompt:text,autoStart:true})});
    const result=await r.json();if(!r.ok)throw Error(result.error||'ส่งงานไม่สำเร็จ');
    trackedJobs.current.set(result.id,{chatRole:role,label:delegation.label});
    const response={id:crypto.randomUUID(),who:'agent',text:'ผู้จัดการเลือก '+delegation.label+' ('+delegation.reason+') และส่งงานแล้ว (เลขงาน '+result.id.slice(0,8)+') · '+(result.autoStarted?'กำลังประมวลผลทันที':'งานนี้ต้องอนุมัติก่อนเริ่ม'),time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
    setMessages(prev=>({...prev,[role]:[...(prev[role]||[]),response]}));await refreshJobs();
   }else if(jobMode!=='chat'){
    const goal=text.slice(0,1500),route=routeFor(goal);
    const prompt=jobMode==='project'?'PROJECT_V1:'+JSON.stringify({version:1,goal,route}):'WORKFLOW_V2:'+JSON.stringify({version:2,goal,route});
    const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:1,agentRole:'manager',prompt,autoStart:true})});
    if(!r.ok)throw Error('ไม่สามารถส่งเข้าคิวงาน');
    const result=await r.json();
    trackedJobs.current.set(result.id,{chatRole:role,label:'ทีมงาน AI'});
    const response={id:crypto.randomUUID(),who:'agent',text:(result.autoStarted?'เริ่มประมวลผลงานแล้ว':'รับงานเข้าคิวแล้ว งานนี้ต้องอนุมัติก่อนเริ่ม')+(result.id?' · '+result.id.slice(0,8):''),time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
    setMessages(prev=>({...prev,[role]:[...(prev[role]||[]),response]}));await refreshJobs();
   }else{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,prompt:text,history,providerId})});
    const result=await r.json();if(!r.ok)throw Error(result.error||'Ollama ไม่พร้อม');
    const response={id:crypto.randomUUID(),who:'agent',text:result.content,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
    setMessages(prev=>({...prev,[role]:[...(prev[role]||[]),response]}));
   }
  }catch(error){setMessages(prev=>({...prev,[role]:[...(prev[role]||[]),{id:crypto.randomUUID(),who:'agent',text:'ไม่สำเร็จ: '+error.message,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}]}))}
  finally{setPending(false)}
 }
 return <section className="msn-shell" aria-label="AI Messenger Dashboard">
  <aside className="msn-roster">
   <div className="msn-title"><strong>◈ AI Messenger</strong><small>{STAFF.length} พนักงาน · {totalMessages} ข้อความ</small></div><details className="msn-roster-management"><summary>จัดการบทสนทนา</summary><div className="msn-roster-tools"><button type="button" disabled={!totalMessages} onClick={exportAllJSON}>ส่งออกทุกบทสนทนา JSON</button><button type="button" disabled={!totalMessages} onClick={()=>setConfirmClearAll(true)}>ล้างทุกบทสนทนา</button></div></details>{confirmClearAll&&<div className="msn-clear-confirm" role="group" aria-label="ยืนยันล้างทุกบทสนทนา"><span>ล้างบทสนทนาพนักงานทั้ง 7 คน? ไม่สามารถย้อนกลับได้</span><button type="button" onClick={()=>{setMessages({});setConfirmClearAll(false);setConfirmClear(false);setPendingDeleteId(null)}}>ยืนยันล้างทั้งหมด</button><button type="button" onClick={()=>setConfirmClearAll(false)}>ยกเลิกทั้งหมด</button></div>}
   <details className="msn-roster-filters"><summary>ค้นหาและกรองพนักงาน</summary><div className="msn-roster-filter-content"><label className="msn-search">ค้นหาพนักงาน<input aria-label="ค้นหาพนักงาน Messenger" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อหรือหน้าที่..."/></label><label className="msn-active-only"><input type="checkbox" checked={activeOnly} onChange={e=>setActiveOnly(e.target.checked)}/> แสดงเฉพาะพนักงานที่มีบทสนทนา</label><label className="msn-active-only"><input type="checkbox" checked={draftOnly} onChange={e=>setDraftOnly(e.target.checked)}/> เฉพาะพนักงานที่มีข้อความร่าง</label><label className="msn-sort-contacts">เรียงภายในแผนก <select aria-label="เรียงรายชื่อพนักงาน" value={sortContacts} onChange={e=>setSortContacts(e.target.value)}><option value="default">ตามแผนก</option><option value="messages">ข้อความมากไปน้อย</option><option value="name">ตามชื่อ</option></select></label><small className="msn-visible-count">แสดง {visibleContactCount} จาก {STAFF.length} คน</small><button type="button" className="msn-roster-reset" disabled={!hasRosterFilters} onClick={()=>{setQuery("");setActiveOnly(false);setDraftOnly(false);setSortContacts("default")}}>รีเซ็ตตัวกรองพนักงาน</button></div></details>
   {groups.map(group=><section className="msn-group" key={group.name}>
    <button type="button" className="msn-group-toggle" onClick={()=>setCollapsed(prev=>prev.includes(group.name)?prev.filter(x=>x!==group.name):[...prev,group.name])}>{collapsed.includes(group.name)?'▸':'▾'} {group.name} ({group.ids.length})</button>
    {!collapsed.includes(group.name)&&[...group.ids].sort((a,b)=>sortContacts==='messages'?(messages[b]||[]).length-(messages[a]||[]).length:sortContacts==='name'?STAFF.find(x=>x.id===a).name.localeCompare(STAFF.find(x=>x.id===b).name,'th'):0).map(id=>{const member=STAFF.find(x=>x.id===id);if(![member.name,member.role,moods[id]].join(' ').toLowerCase().includes(query.toLowerCase())||(activeOnly&&!(messages[id]||[]).length)||(draftOnly&&!(drafts[id]||'').trim()))return null;return <button type="button" key={id} className={'msn-contact'+(selected===id?' selected':'')} onClick={()=>{setSelected(id);setConfirmClear(false);setPendingDeleteId(null);setChatQuery('');setMessageFilter('all');setSearchCaseSensitive(false);setExportNotice('');setCopyNotice('')}} aria-pressed={selected===id}>
      <span className="msn-avatar" aria-hidden="true" style={{background:member.accent}}>{member.name.slice(0,1)}</span><span className="msn-contact-text"><strong>{member.name}</strong><small>{moods[id]}</small></span><span className={'msn-presence '+status(id)} title={displayState[status(id)]}/>{(messages[id]||[]).length>0&&<span className="msn-chat-count" title="จำนวนข้อความ">{(messages[id]||[]).length}</span>}{(drafts[id]||'').trim()&&<span className="msn-draft-marker" title="มีข้อความร่าง">ร่าง</span>}{unreadTasks(id)>0&&<span className="msn-badge">{unreadTasks(id)}</span>}
    </button>})}
   </section>)}
  </aside>
  <div className="msn-chat">
   <div className="msn-chat-top"><span className="msn-avatar large" style={{background:staff.accent}}>{staff.name.slice(0,1)}</span><div><h2>{staff.name}</h2><p>{staff.role} · {displayState[status(selected)]}</p><small>{moods[selected]}</small></div><span className="msn-simulation">{local?'Ollama ในเครื่อง':'ต้องเปิด Local Dashboard'}</span></div>
   <div className="msn-chat-toolbar"><span>💬 {conversation.length} ข้อความ · งานค้าง {unreadTasks(selected)}</span></div><details className="msn-advanced-tools"><summary>ค้นหา · ส่งออก · ตัวกรอง · จัดการข้อความ</summary><div className="msn-advanced-actions"><button type="button" disabled={!conversation.length} onClick={exportTranscript}>ส่งออก TXT</button><button type="button" disabled={!conversation.length} onClick={exportJSON}>ส่งออก JSON</button><button type="button" disabled={!conversation.length} onClick={()=>setConfirmClear(true)}>ล้างบทสนทนา</button></div><label className="msn-chat-search">ค้นหาในบทสนทนา<input aria-label="ค้นหาข้อความในบทสนทนา" type="search" value={chatQuery} onChange={e=>setChatQuery(e.target.value)} placeholder="ค้นหาข้อความของพนักงานที่เลือก..." /></label><label className="msn-search-case"><input type="checkbox" checked={searchCaseSensitive} onChange={e=>setSearchCaseSensitive(e.target.checked)}/> ตรงตัวพิมพ์ใหญ่–เล็ก</label>{chatQuery&&<button type="button" className="msn-reset-search" onClick={()=>setChatQuery("")}>ล้างคำค้นหา</button>}<label className="msn-message-filter">แสดงข้อความ <select aria-label="กรองข้อความตามผู้ส่ง" value={messageFilter} onChange={e=>setMessageFilter(e.target.value)}><option value="all">ทั้งหมด</option><option value="user">เฉพาะข้อความของฉัน</option><option value="agent">เฉพาะพนักงาน AI</option></select></label><div className="msn-filter-summary"><span>แสดง {visibleMessages.length} จาก {conversation.length} ข้อความ</span><button type="button" disabled={!visibleMessages.length} onClick={()=>{const text=visibleMessages.map(item=>"["+(item.time||"ไม่ระบุเวลา")+"] "+(item.who==="user"?"คุณ":staff.name)+": "+item.text).join("\n");if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>setCopyNotice("คัดลอกข้อความที่แสดงแล้ว")).catch(()=>setCopyNotice("ไม่สามารถคัดลอกได้"))}else{setCopyNotice("ไม่สามารถคัดลอกได้")}}}>คัดลอกข้อความที่แสดง</button><button type="button" disabled={!hasMessageFilters} onClick={()=>{setChatQuery("");setMessageFilter("all");setSearchCaseSensitive(false)}}>รีเซ็ตตัวกรองข้อความ</button></div></details>{copyNotice&&<p className="msn-export-notice" role="status">{copyNotice}</p>}{exportNotice&&<p className="msn-export-notice" role="status">{exportNotice}</p>}{confirmClear&&<div className="msn-clear-confirm" role="group" aria-label="ยืนยันล้างบทสนทนา"><span>ล้างเฉพาะบทสนทนากับ {staff.name}?</span><button type="button" onClick={()=>{setMessages(prev=>({...prev,[selected]:[]}));setConfirmClear(false);setPendingDeleteId(null)}}>ยืนยันล้าง</button><button type="button" onClick={()=>setConfirmClear(false)}>ยกเลิก</button></div>}
   <details className="msn-task-details"><summary>งานของ {staff.name} ({tasks.filter(t=>t.assignee===selected).length} รายการ)</summary><div className="msn-task-list">{tasks.filter(t=>t.assignee===selected).length===0?<p>ยังไม่มีงานที่ได้รับมอบหมาย</p>:tasks.filter(t=>t.assignee===selected).map(t=><div key={t.id} className="msn-task-item"><strong>{t.title}</strong><label>สถานะ <select aria-label={`สถานะงาน ${t.title}`} value={t.status} onChange={e=>onUpdateTaskStatus?.(t.id,e.target.value)}><option value="todo">ยังไม่เริ่ม</option><option value="in-progress">กำลังดำเนินการ</option><option value="done">เสร็จแล้ว</option></select></label></div>)}</div></details><div className="msn-conversation" role="log" aria-label={'บทสนทนากับ '+staff.name} aria-live="polite">
    {(messages[selected]||[]).length===0?<div className="msn-empty"><strong>เริ่มสนทนากับ {staff.name}</strong><p>พิมพ์เพื่อสนทนากับ Ollama ในเครื่อง หรือเลือกส่งงานหลายฝ่ายและโครงการเพื่อรออนุมัติ</p></div>:visibleMessages.length===0?<div className="msn-empty"><strong>ไม่พบข้อความที่ค้นหา</strong><p>ลองใช้คำค้นอื่น หรือล้างช่องค้นหา</p></div>:visibleMessages.map(message=><div key={message.id} className={'msn-message '+message.who}><strong>{message.who==='user'?'คุณ':staff.name}</strong>{message.time&&<time className="msn-message-time">{message.time}</time>}<p>{message.text}</p><button type="button" onClick={()=>copyMessage(message)}>คัดลอกข้อความ</button>{message.who==='user'&&<button type="button" onClick={()=>setDraft(message.text.slice(0,8000))}>นำข้อความกลับมาแก้ไข</button>}<button type="button" onClick={()=>setPendingDeleteId(message.id)}>ลบข้อความ</button>{pendingDeleteId===message.id&&<div className="msn-message-delete-confirm" role="group" aria-label="ยืนยันลบข้อความ"><span>ลบข้อความนี้เท่านั้น?</span><button type="button" onClick={()=>{setMessages(prev=>({...prev,[selected]:(prev[selected]||[]).filter(item=>item.id!==message.id)}));setPendingDeleteId(null)}}>ยืนยันลบข้อความ</button><button type="button" onClick={()=>setPendingDeleteId(null)}>ยกเลิกลบข้อความ</button></div>}{message.who==='agent'&&onSaveOutput&&<button type="button" onClick={()=>onSaveOutput({agentId:selected,agentName:staff.name,content:message.text})}>บันทึกคำตอบลงคลังผลงาน</button>}</div>)}
   </div>
   <details className="msn-task-details"><summary>คิวงาน AI · รออนุมัติ {jobs.filter(j=>j.status==='awaiting_approval').length} รายการ</summary>{jobError&&<p role="alert">{jobError}</p>}{!local?<p>เปิดผ่าน http://127.0.0.1:8787/office/ เพื่อเชื่อม Ollama และ Bridge</p>:<div className="msn-job-list">{jobs.slice(0,20).map(job=><div key={job.id} className="msn-task-item"><span>{job.agentRole} · {job.status} · {job.id.slice(0,8)}</span>{job.status==='awaiting_approval'&&<><button type="button" onClick={()=>decide(job,'approve')}>อนุมัติ</button><button type="button" onClick={()=>decide(job,'reject')}>ปฏิเสธ</button></>}<button type="button" onClick={()=>viewJob(job)}>ดูผล</button></div>)}</div>}{jobDetail&&<div><button type="button" onClick={()=>setJobDetail(null)}>ปิดผล</button><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:280,overflow:'auto'}}>{jobDetail.content||jobDetail.status||'ยังไม่มีผล'}</pre></div>}</details><form className="msn-composer" onSubmit={send}><div className="msn-composer-controls"><label htmlFor="msn-provider">โมเดล AI <select id="msn-provider" aria-label="เลือกโมเดล AI" value={providerId} onChange={e=>setProviderId(e.target.value)}>{providers.map(p=><option key={p.id} value={p.id}>{p.name} · {p.model||'Local'}</option>)}</select></label><details className="msn-provider-settings"><summary>จัดการโมเดล API</summary><div className="msn-quick-prompt-items"><label>ชื่อการเชื่อมต่อ<input aria-label="ชื่อการเชื่อมต่อ" value={providerForm.name} onChange={e=>setProviderForm(p=>({...p,name:e.target.value}))}/></label><label>ผู้ให้บริการ<select aria-label="ผู้ให้บริการ API" value={providerForm.type} onChange={e=>setProviderForm(p=>({...p,type:e.target.value}))}><option value="gemini">Gemini</option><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="compatible">OpenAI-compatible</option></select></label><label>ชื่อโมเดล<input aria-label="ชื่อโมเดล API" value={providerForm.model} onChange={e=>setProviderForm(p=>({...p,model:e.target.value}))}/></label>{providerForm.type==='compatible'&&<label>HTTPS API endpoint<input aria-label="API endpoint" value={providerForm.endpoint} onChange={e=>setProviderForm(p=>({...p,endpoint:e.target.value}))}/></label>}<label>API Key<input type="password" autoComplete="off" aria-label="API Key" value={providerForm.key} onChange={e=>setProviderForm(p=>({...p,key:e.target.value}))}/></label><button type="button" onClick={addProvider}>เพิ่มการเชื่อมต่อ</button>{providers.filter(p=>p.id!=='local').map(p=><div key={p.id}><span>{p.name} · {p.model}</span> <button type="button" onClick={()=>removeProvider(p.id)}>ลบ {p.name}</button></div>)}{providerNotice&&<small role="status">{providerNotice}</small>}<small>API Key เก็บใน Local Bridge ไม่ส่งไป GitHub · การใช้ Cloud API อาจมีค่าใช้จ่าย</small></div></details><details className="msn-quick-prompts" aria-label="ตัวเลือกคำสั่ง" style={{flexShrink:0}}><summary>ตัวเลือกคำสั่ง · ${jobMode==='chat'?'สนทนา':jobMode==='workflow'?'งานหลายฝ่าย':'โครงการ'} ▾</summary><div className="msn-quick-prompt-items"><label htmlFor="msn-mode">รูปแบบคำสั่ง <select id="msn-mode" aria-label="รูปแบบคำสั่ง" value={jobMode} onChange={e=>setJobMode(e.target.value)}><option value="chat">สนทนา</option><option value="workflow">งานหลายฝ่าย (รออนุมัติ)</option><option value="project">โครงการ (รออนุมัติ)</option></select></label><strong>คำสั่งด่วน</strong><label className="msn-prompt-append"><input type="checkbox" checked={appendQuickPrompt} onChange={e=>setAppendQuickPrompt(e.target.checked)}/> เพิ่มต่อท้ายข้อความร่าง</label>{quickPromptsByRole[selected].map(prompt=><button key={prompt} type="button" onClick={()=>setDraft((appendQuickPrompt&&draft?draft+"\n"+prompt:prompt).slice(0,8000))}>{prompt}</button>)}</div></details></div><label htmlFor="msn-message-input">ข้อความถึง {staff.name}</label><button type="button" className="msn-clear-draft" disabled={!draft} onClick={()=>setDraft('')}>ล้างข้อความร่าง</button><textarea id="msn-message-input" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4000} placeholder="พิมพ์คำสั่งถึงพนักงาน..." onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><small>Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · {draft.length}/8000 ตัวอักษร · เชื่อม AI ผ่าน Local Dashboard เท่านั้น</small>{draft.length>=3750&&<strong className="msn-draft-warning" role="status">ข้อความใกล้ครบขีดจำกัด 8,000 ตัวอักษร</strong>}<button type="submit" disabled={!local||!draft.trim()||pending}>ส่งข้อความ</button></div></form>
  </div>
 </section>;
}
