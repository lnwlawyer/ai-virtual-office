import React,{useState} from 'react';
import {STAFF} from './virtual-office-model.js';
import {createMockAIRequest,mockAIResponse} from './ai-gateway-contract.js';
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
 function send(event){
  event.preventDefault();
  if(pending)return;
  const request=createMockAIRequest(selected,draft);
  if(!request.ok)return;
  const sent={id:crypto.randomUUID(),who:'user',text:request.request.prompt,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
  setMessages(prev=>({...prev,[selected]:[...(prev[selected]||[]),sent]}));
  setDraft('');
  setPending(true);
  const result=mockAIResponse(request.request);
  const response={id:crypto.randomUUID(),who:'agent',text:result.ok?result.response.content:'ไม่สามารถจำลองคำตอบได้',time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
  setMessages(prev=>({...prev,[selected]:[...(prev[selected]||[]),response]}));
  setPending(false);
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
   <div className="msn-chat-top"><span className="msn-avatar large" style={{background:staff.accent}}>{staff.name.slice(0,1)}</span><div><h2>{staff.name}</h2><p>{staff.role} · {displayState[status(selected)]}</p><small>{moods[selected]}</small></div><span className="msn-simulation">จำลอง · ไม่เชื่อม API</span></div>
   <div className="msn-chat-toolbar"><span>💬 {conversation.length} ข้อความ · งานค้าง {unreadTasks(selected)}</span><button type="button" onClick={()=>onCreateTaskDraft?.({id:staff.id,name:staff.name})}>มอบหมายงาน</button></div><details className="msn-advanced-tools"><summary>ค้นหา · ส่งออก · ตัวกรอง · จัดการข้อความ</summary><div className="msn-advanced-actions"><button type="button" disabled={!conversation.length} onClick={exportTranscript}>ส่งออก TXT</button><button type="button" disabled={!conversation.length} onClick={exportJSON}>ส่งออก JSON</button><button type="button" disabled={!conversation.length} onClick={()=>setConfirmClear(true)}>ล้างบทสนทนา</button></div><label className="msn-chat-search">ค้นหาในบทสนทนา<input aria-label="ค้นหาข้อความในบทสนทนา" type="search" value={chatQuery} onChange={e=>setChatQuery(e.target.value)} placeholder="ค้นหาข้อความของพนักงานที่เลือก..." /></label><label className="msn-search-case"><input type="checkbox" checked={searchCaseSensitive} onChange={e=>setSearchCaseSensitive(e.target.checked)}/> ตรงตัวพิมพ์ใหญ่–เล็ก</label>{chatQuery&&<button type="button" className="msn-reset-search" onClick={()=>setChatQuery("")}>ล้างคำค้นหา</button>}<label className="msn-message-filter">แสดงข้อความ <select aria-label="กรองข้อความตามผู้ส่ง" value={messageFilter} onChange={e=>setMessageFilter(e.target.value)}><option value="all">ทั้งหมด</option><option value="user">เฉพาะข้อความของฉัน</option><option value="agent">เฉพาะพนักงาน AI</option></select></label><div className="msn-filter-summary"><span>แสดง {visibleMessages.length} จาก {conversation.length} ข้อความ</span><button type="button" disabled={!visibleMessages.length} onClick={()=>{const text=visibleMessages.map(item=>"["+(item.time||"ไม่ระบุเวลา")+"] "+(item.who==="user"?"คุณ":staff.name)+": "+item.text).join("\n");if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>setCopyNotice("คัดลอกข้อความที่แสดงแล้ว")).catch(()=>setCopyNotice("ไม่สามารถคัดลอกได้"))}else{setCopyNotice("ไม่สามารถคัดลอกได้")}}}>คัดลอกข้อความที่แสดง</button><button type="button" disabled={!hasMessageFilters} onClick={()=>{setChatQuery("");setMessageFilter("all");setSearchCaseSensitive(false)}}>รีเซ็ตตัวกรองข้อความ</button></div></details>{copyNotice&&<p className="msn-export-notice" role="status">{copyNotice}</p>}{exportNotice&&<p className="msn-export-notice" role="status">{exportNotice}</p>}{confirmClear&&<div className="msn-clear-confirm" role="group" aria-label="ยืนยันล้างบทสนทนา"><span>ล้างเฉพาะบทสนทนากับ {staff.name}?</span><button type="button" onClick={()=>{setMessages(prev=>({...prev,[selected]:[]}));setConfirmClear(false);setPendingDeleteId(null)}}>ยืนยันล้าง</button><button type="button" onClick={()=>setConfirmClear(false)}>ยกเลิก</button></div>}
   <details className="msn-task-details"><summary>งานของ {staff.name} ({tasks.filter(t=>t.assignee===selected).length} รายการ)</summary><div className="msn-task-list">{tasks.filter(t=>t.assignee===selected).length===0?<p>ยังไม่มีงานที่ได้รับมอบหมาย</p>:tasks.filter(t=>t.assignee===selected).map(t=><div key={t.id} className="msn-task-item"><strong>{t.title}</strong><label>สถานะ <select aria-label={`สถานะงาน ${t.title}`} value={t.status} onChange={e=>onUpdateTaskStatus?.(t.id,e.target.value)}><option value="todo">ยังไม่เริ่ม</option><option value="in-progress">กำลังดำเนินการ</option><option value="done">เสร็จแล้ว</option></select></label></div>)}</div></details><div className="msn-conversation" role="log" aria-label={'บทสนทนากับ '+staff.name} aria-live="polite">
    {(messages[selected]||[]).length===0?<div className="msn-empty"><strong>เริ่มสนทนากับ {staff.name}</strong><p>ส่งคำสั่งทดลองเพื่อดูรูปแบบการทำงานของแชท คำตอบยังเป็นข้อความจำลอง ไม่ใช่ AI จริง</p></div>:visibleMessages.length===0?<div className="msn-empty"><strong>ไม่พบข้อความที่ค้นหา</strong><p>ลองใช้คำค้นอื่น หรือล้างช่องค้นหา</p></div>:visibleMessages.map(message=><div key={message.id} className={'msn-message '+message.who}><strong>{message.who==='user'?'คุณ':staff.name}</strong>{message.time&&<time className="msn-message-time">{message.time}</time>}<p>{message.text}</p><button type="button" onClick={()=>copyMessage(message)}>คัดลอกข้อความ</button>{message.who==='user'&&<button type="button" onClick={()=>setDraft(message.text.slice(0,8000))}>นำข้อความกลับมาแก้ไข</button>}<button type="button" onClick={()=>setPendingDeleteId(message.id)}>ลบข้อความ</button>{pendingDeleteId===message.id&&<div className="msn-message-delete-confirm" role="group" aria-label="ยืนยันลบข้อความ"><span>ลบข้อความนี้เท่านั้น?</span><button type="button" onClick={()=>{setMessages(prev=>({...prev,[selected]:(prev[selected]||[]).filter(item=>item.id!==message.id)}));setPendingDeleteId(null)}}>ยืนยันลบข้อความ</button><button type="button" onClick={()=>setPendingDeleteId(null)}>ยกเลิกลบข้อความ</button></div>}{message.who==='agent'&&onSaveOutput&&<button type="button" onClick={()=>onSaveOutput({agentId:selected,agentName:staff.name,content:message.text})}>บันทึกคำตอบลงคลังผลงาน</button>}</div>)}
   </div>
   <form className="msn-composer" onSubmit={send}><details className="msn-quick-prompts" aria-label="ข้อความสั่งงานที่ใช้บ่อย"><summary>คำสั่งด่วน (เลือกเพื่อเปิด)</summary><div className="msn-quick-prompt-items"><strong>คำสั่งด่วน</strong><label className="msn-prompt-append"><input type="checkbox" checked={appendQuickPrompt} onChange={e=>setAppendQuickPrompt(e.target.checked)}/> เพิ่มต่อท้ายข้อความร่าง</label>{quickPromptsByRole[selected].map(prompt=><button key={prompt} type="button" onClick={()=>setDraft((appendQuickPrompt&&draft?draft+"\n"+prompt:prompt).slice(0,8000))}>{prompt}</button>)}</div></details><label htmlFor="msn-message-input">ข้อความถึง {staff.name}</label><button type="button" className="msn-clear-draft" disabled={!draft} onClick={()=>setDraft('')}>ล้างข้อความร่าง</button><textarea id="msn-message-input" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={8000} placeholder="พิมพ์คำสั่งถึงพนักงาน..." onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><small>Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · {draft.length}/8000 ตัวอักษร · ข้อมูลอยู่ในแท็บนี้เท่านั้น</small>{draft.length>=7500&&<strong className="msn-draft-warning" role="status">ข้อความใกล้ครบขีดจำกัด 8,000 ตัวอักษร</strong>}<button type="submit" disabled={!draft.trim()||pending}>ส่งข้อความ</button></div></form>
  </div>
 </section>;
}
