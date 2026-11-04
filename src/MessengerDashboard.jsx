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
const displayState={online:'ออนไลน์',busy:'กำลังทำงาน',waiting:'รออนุมัติ',offline:'ออฟไลน์'};
export default function MessengerDashboard({tasks=[],onCreateTaskDraft,onUpdateTaskStatus,onSaveOutput,selected,setSelected,messages,setMessages}){
 const [query,setQuery]=useState('');
 const [chatQuery,setChatQuery]=useState('');
 const [draft,setDraft]=useState('');
 const [collapsed,setCollapsed]=useState([]);
 const [pending,setPending]=useState(false);
 const [confirmClear,setConfirmClear]=useState(false);
 const staff=STAFF.find(x=>x.id===selected);
 const unreadTasks=id=>tasks.filter(t=>t.assignee===id&&t.status!=='done').length;
 const status=id=>pending&&id===selected?'busy':unreadTasks(id)>0?'busy':'online';
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
   <div className="msn-title"><strong>◈ AI Messenger</strong><small>ทีมสำนักงานเสมือน · โหมดจำลอง</small></div>
   <label className="msn-search">ค้นหาพนักงาน<input aria-label="ค้นหาพนักงาน Messenger" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อหรือหน้าที่..."/></label>
   {groups.map(group=><section className="msn-group" key={group.name}>
    <button type="button" className="msn-group-toggle" onClick={()=>setCollapsed(prev=>prev.includes(group.name)?prev.filter(x=>x!==group.name):[...prev,group.name])}>{collapsed.includes(group.name)?'▸':'▾'} {group.name} ({group.ids.length})</button>
    {!collapsed.includes(group.name)&&group.ids.map(id=>{const member=STAFF.find(x=>x.id===id);if(![member.name,member.role,moods[id]].join(' ').toLowerCase().includes(query.toLowerCase()))return null;return <button type="button" key={id} className={'msn-contact'+(selected===id?' selected':'')} onClick={()=>{setSelected(id);setConfirmClear(false);setChatQuery('')}} aria-pressed={selected===id}>
      <span className="msn-avatar" aria-hidden="true" style={{background:member.accent}}>{member.name.slice(0,1)}</span><span className="msn-contact-text"><strong>{member.name}</strong><small>{moods[id]}</small></span><span className={'msn-presence '+status(id)} title={displayState[status(id)]}/>{unreadTasks(id)>0&&<span className="msn-badge">{unreadTasks(id)}</span>}
    </button>})}
   </section>)}
  </aside>
  <div className="msn-chat">
   <div className="msn-chat-top"><span className="msn-avatar large" style={{background:staff.accent}}>{staff.name.slice(0,1)}</span><div><h2>{staff.name}</h2><p>{staff.role} · {displayState[status(selected)]}</p><small>{moods[selected]}</small></div><span className="msn-simulation">จำลอง · ไม่เชื่อม API</span></div>
   <div className="msn-chat-toolbar"><span>💬 สนทนา</span><span>งานค้าง {unreadTasks(selected)} รายการ</span><button type="button" onClick={()=>onCreateTaskDraft?.({id:staff.id,name:staff.name})}>มอบหมายงาน</button><button type="button" disabled={!(messages[selected]||[]).length} onClick={()=>setConfirmClear(true)}>ล้างบทสนทนา</button></div><label className="msn-chat-search">ค้นหาในบทสนทนา<input aria-label="ค้นหาข้อความในบทสนทนา" type="search" value={chatQuery} onChange={e=>setChatQuery(e.target.value)} placeholder="ค้นหาข้อความของพนักงานที่เลือก..." /></label>{confirmClear&&<div className="msn-clear-confirm" role="group" aria-label="ยืนยันล้างบทสนทนา"><span>ล้างเฉพาะบทสนทนากับ {staff.name}?</span><button type="button" onClick={()=>{setMessages(prev=>({...prev,[selected]:[]}));setConfirmClear(false)}}>ยืนยันล้าง</button><button type="button" onClick={()=>setConfirmClear(false)}>ยกเลิก</button></div>}
   <details className="msn-task-details"><summary>งานของ {staff.name} ({tasks.filter(t=>t.assignee===selected).length} รายการ)</summary><div className="msn-task-list">{tasks.filter(t=>t.assignee===selected).length===0?<p>ยังไม่มีงานที่ได้รับมอบหมาย</p>:tasks.filter(t=>t.assignee===selected).map(t=><div key={t.id} className="msn-task-item"><strong>{t.title}</strong><label>สถานะ <select aria-label={`สถานะงาน ${t.title}`} value={t.status} onChange={e=>onUpdateTaskStatus?.(t.id,e.target.value)}><option value="todo">ยังไม่เริ่ม</option><option value="in-progress">กำลังดำเนินการ</option><option value="done">เสร็จแล้ว</option></select></label></div>)}</div></details><div className="msn-conversation" role="log" aria-label={'บทสนทนากับ '+staff.name} aria-live="polite">
    {(messages[selected]||[]).length===0?<div className="msn-empty"><strong>เริ่มสนทนากับ {staff.name}</strong><p>ส่งคำสั่งทดลองเพื่อดูรูปแบบการทำงานของแชท คำตอบยังเป็นข้อความจำลอง ไม่ใช่ AI จริง</p></div>:(messages[selected]||[]).filter(message=>message.text.toLocaleLowerCase().includes(chatQuery.trim().toLocaleLowerCase())).length===0?<div className="msn-empty"><strong>ไม่พบข้อความที่ค้นหา</strong><p>ลองใช้คำค้นอื่น หรือล้างช่องค้นหา</p></div>:(messages[selected]||[]).filter(message=>message.text.toLocaleLowerCase().includes(chatQuery.trim().toLocaleLowerCase())).map(message=><div key={message.id} className={'msn-message '+message.who}><strong>{message.who==='user'?'คุณ':staff.name}</strong>{message.time&&<time className="msn-message-time">{message.time}</time>}<p>{message.text}</p>{message.who==='agent'&&onSaveOutput&&<button type="button" onClick={()=>onSaveOutput({agentId:selected,agentName:staff.name,content:message.text})}>บันทึกคำตอบลงคลังผลงาน</button>}</div>)}
   </div>
   <form className="msn-composer" onSubmit={send}><label htmlFor="msn-message-input">ข้อความถึง {staff.name}</label><textarea id="msn-message-input" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={8000} placeholder="พิมพ์คำสั่งถึงพนักงาน..." onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><small>Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · ข้อมูลอยู่ในแท็บนี้เท่านั้น</small><button type="submit" disabled={!draft.trim()||pending}>ส่งข้อความ</button></div></form>
  </div>
 </section>;
}
