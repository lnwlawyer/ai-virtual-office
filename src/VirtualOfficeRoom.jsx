import React,{useState,useEffect,useRef} from 'react';
import {STAFF,ROOM_THEMES,validRoomTheme,validateBackgroundFile} from './virtual-office-model.js';
import './virtual-office.css';

export default function VirtualOfficeRoom(){
 const [theme,setTheme]=useState('daylight');
 const [background,setBackground]=useState('');
 const [error,setError]=useState('');
 const [moving,setMoving]=useState(true);
 const [selected,setSelected]=useState(STAFF[0].id);
 const [statuses,setStatuses]=useState(Object.fromEntries(STAFF.map(x=>[x.id,'working'])));
 const imageUrl=useRef('');
 useEffect(()=>()=>{if(imageUrl.current)URL.revokeObjectURL(imageUrl.current)},[]);
 function chooseBackground(event){
  const file=event.target.files?.[0];
  if(!file)return;
  const result=validateBackgroundFile(file);
  if(!result.ok){setError(result.error);event.target.value='';return;}
  const url=URL.createObjectURL(file);
  if(imageUrl.current)URL.revokeObjectURL(imageUrl.current);
  imageUrl.current=url;setBackground(url);setError('');event.target.value='';
 }
 function clearBackground(){
  if(imageUrl.current)URL.revokeObjectURL(imageUrl.current);
  imageUrl.current='';setBackground('');setError('');
 }
 const person=STAFF.find(x=>x.id===selected)??STAFF[0];
 return <section className="office-shell">
  <div className="office-heading"><div><h2>สำนักงานเสมือนแบบโต้ตอบ</h2><p className="muted">เลือกพนักงานเพื่อดูบทบาท เปลี่ยนฉากห้อง หรือเปิดการเคลื่อนไหวของตัวการ์ตูน</p></div><span className="office-demo">ตัวละครจำลอง · ยังไม่เชื่อมต่อ AI</span></div>
  <div className="office-toolbar">
   <label>บรรยากาศห้อง <select aria-label="เลือกบรรยากาศห้อง" value={theme} onChange={e=>{if(validRoomTheme(e.target.value))setTheme(e.target.value)}}>{ROOM_THEMES.map((x,i)=><option value={x} key={x}>{['กลางวัน','ยามเย็น','โทนมิ้นต์'][i]}</option>)}</select></label>
   <label className="office-file">เปลี่ยนภาพพื้นหลัง <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseBackground}/></label>
   <button type="button" onClick={clearBackground} disabled={!background}>ใช้ฉากเริ่มต้น</button>
   <button type="button" aria-pressed={moving} onClick={()=>setMoving(v=>!v)}>{moving?'หยุดการเคลื่อนไหว':'เปิดการเคลื่อนไหว'}</button>
  </div>
  {error&&<p role="alert" className="office-error">{error}</p>}
  <div className={'office-room office-'+theme+(moving?' is-moving':'')} style={background?{backgroundImage:'linear-gradient(#071e2d44,#071e2d33),url("'+background+'")'}:undefined} aria-label="ภาพจำลองห้องทำงานพร้อมพนักงาน 7 ตำแหน่ง">
   <div className="office-window" aria-hidden="true"><span>☀</span></div>
   <div className="office-clock" aria-hidden="true">◷</div>
   <div className="office-plant" aria-hidden="true">🌿</div>
   <div className="office-floor" aria-hidden="true"/>
   <div className="office-desks">
    {STAFF.map((staff,i)=><button type="button" className={'office-station'+(selected===staff.id?' is-selected':'')} key={staff.id} onClick={()=>setSelected(staff.id)} aria-pressed={selected===staff.id} style={{'--staff-accent':staff.accent,'--walk-delay':(i%4)*-1.4+'s'}}>
      <span className="office-character" aria-hidden="true"><span className="office-hair"/><span className="office-face"><i/><i/></span><span className="office-torso"/><span className="office-arm office-arm-left"/><span className="office-arm office-arm-right"/><span className="office-leg office-leg-left"/><span className="office-leg office-leg-right"/></span>
      <span className="office-desk" aria-hidden="true"><span className="office-monitor"/><span className="office-desk-top"/><span className="office-desk-legs"/></span>
      <span className="office-name">{staff.name}</span>
      <span className="office-status">{statuses[staff.id]==='working'?'กำลังทำงาน':statuses[staff.id]==='walking'?'เดินสำรวจ':'พักงาน'}</span>
     </button>)}
   </div>
  </div>
  <div className="office-details" aria-live="polite"><div><h3>{person.name}</h3><p>{person.role}</p><p className="muted">ตัวละครเป็นภาพจำลอง ยังไม่สามารถสั่งงาน AI หรือเข้าถึงเอกสารได้</p></div><label>สถานะจำลอง <select aria-label="สถานะพนักงาน" value={statuses[selected]} onChange={e=>setStatuses(v=>({...v,[selected]:e.target.value}))}><option value="working">กำลังทำงาน</option><option value="walking">เดินสำรวจ</option><option value="resting">พักงาน</option></select></label></div>
  <p className="office-footnote">ภาพพื้นหลังที่เลือกใช้เฉพาะในแท็บนี้ ไม่อัปโหลดหรือบันทึกบนเซิร์ฟเวอร์ รีเฟรชแล้วกลับเป็นฉากเริ่มต้น</p>
 </section>
}
