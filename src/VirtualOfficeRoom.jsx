import {MOTION_SPEEDS,validMotionSpeed,motionDuration} from './office-motion.js';
import {TEAM_PRESETS,applyTeamStatus,teamStatusSummary} from './office-team.js';
import {exportRoomJSON,importRoomJSON} from './office-room-transfer.js';
import {ROOM_DECOR,DEFAULT_DECOR,toggleDecor} from './office-decor.js';
import {saveRoomSnapshot,readRoomSnapshot,removeRoomSnapshot} from './office-room-storage.js';
import {initialOfficeLayout,renameOfficeStaff,changeOfficeStatus,moveOfficeStaff,resetOfficeLayout} from './office-layout.js';
import React,{useState,useEffect,useRef} from 'react';
import {STAFF,ROOM_THEMES,validRoomTheme,validateBackgroundFile} from './virtual-office-model.js';
import './virtual-office.css';

export default function VirtualOfficeRoom(){
 const [theme,setTheme]=useState('daylight');
 const [background,setBackground]=useState('');
 const [error,setError]=useState('');
 const [saveStatus,setSaveStatus]=useState('');
 const [decor,setDecor]=useState([...DEFAULT_DECOR]);
 const [decorOpen,setDecorOpen]=useState(false);
 const [transferOpen,setTransferOpen]=useState(false);
 const [transferJSON,setTransferJSON]=useState('');
 const [confirmImport,setConfirmImport]=useState(false);
 const [moving,setMoving]=useState(true);
 const [motionSpeed,setMotionSpeed]=useState('normal');
 const [selected,setSelected]=useState(STAFF[0].id);
 const [layout,setLayout]=useState(initialOfficeLayout);
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
 const active=layout.find(x=>x.id===selected)??layout[0];
 const teamSummary=teamStatusSummary(layout);
 function setStatus(status){const r=changeOfficeStatus(layout,selected,status);if(r.ok)setLayout(r.layout);}
 function setName(name){if(!name.trim()){setError('ชื่อพนักงานต้องไม่ว่าง');return;}const r=renameOfficeStaff(layout,selected,name);if(r.ok){setLayout(r.layout);setError('');}else setError(r.error);}
 function moveDesk(direction){const r=moveOfficeStaff(layout,selected,direction);if(r.ok){setLayout(r.layout);setError('');}}

 return <section className="office-shell">
  <div className="office-heading"><div><h2>สำนักงานเสมือนแบบโต้ตอบ</h2><p className="muted">เลือกพนักงานเพื่อดูบทบาท เปลี่ยนฉากห้อง หรือเปิดการเคลื่อนไหวของตัวการ์ตูน</p></div><span className="office-demo">ตัวละครจำลอง · ยังไม่เชื่อมต่อ AI</span></div>
  <div className="office-toolbar">
   <label>บรรยากาศห้อง <select aria-label="เลือกบรรยากาศห้อง" value={theme} onChange={e=>{if(validRoomTheme(e.target.value))setTheme(e.target.value)}}>{ROOM_THEMES.map((x,i)=><option value={x} key={x}>{['กลางวัน','ยามเย็น','โทนมิ้นต์'][i]}</option>)}</select></label>
   <label className="office-file">เปลี่ยนภาพพื้นหลัง <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseBackground}/></label>
   <button type="button" onClick={clearBackground} disabled={!background}>ใช้ฉากเริ่มต้น</button>
   <button type="button" aria-pressed={moving} onClick={()=>setMoving(v=>!v)}>{moving?'หยุดการเคลื่อนไหว':'เปิดการเคลื่อนไหว'}</button>
   <label>ความเร็วการเคลื่อนไหว <select aria-label="ความเร็วตัวละคร" value={motionSpeed} onChange={e=>{if(validMotionSpeed(e.target.value))setMotionSpeed(e.target.value)}}>{MOTION_SPEEDS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
   <button type="button" aria-expanded={decorOpen} onClick={()=>setDecorOpen(v=>!v)}>{decorOpen?'ซ่อนตัวเลือกตกแต่ง':'ตกแต่งห้อง'}</button>
   <button type="button" aria-expanded={transferOpen} onClick={()=>setTransferOpen(v=>!v)}>{transferOpen?'ปิดการย้ายห้อง':'ส่งออก/นำเข้าห้อง'}</button>
   <button type="button" onClick={()=>{const r=saveRoomSnapshot(window.localStorage,theme,moving,layout,decor);setSaveStatus(r.ok?'บันทึกการจัดห้องในเบราว์เซอร์แล้ว':r.error);}}>บันทึกการจัดห้อง</button>
   <button type="button" onClick={()=>{const r=readRoomSnapshot(window.localStorage);if(!r.ok){setSaveStatus(r.error);return;}setTheme(r.value.theme);setMoving(r.value.moving);setLayout(r.value.layout);setDecor(r.value.decor);setSelected(r.value.layout[0].id);setSaveStatus('เรียกคืนการจัดห้องสำเร็จ');}}>เรียกคืนการจัดห้อง</button>
   <button type="button" onClick={()=>{const r=removeRoomSnapshot(window.localStorage);setSaveStatus(r.ok?'ลบการจัดห้องที่บันทึกไว้แล้ว':r.error);}}>ลบข้อมูลที่บันทึก</button>
  </div>
  {transferOpen&&<div className="office-transfer"><h3>ย้ายการจัดห้องด้วย JSON</h3><p className="muted">ข้อมูลเฉพาะธีม พนักงาน และของตกแต่ง ไม่รวมรูปภาพพื้นหลัง</p><div className="office-transfer-actions"><button type="button" onClick={()=>{const r=exportRoomJSON(theme,moving,layout,decor);if(r.ok){setTransferJSON(r.content);setSaveStatus('เตรียม JSON สำหรับคัดลอกแล้ว');}else setSaveStatus(r.error);}}>สร้าง JSON ส่งออก</button><button type="button" disabled={!transferJSON} onClick={async()=>{try{await navigator.clipboard.writeText(transferJSON);setSaveStatus('คัดลอก JSON แล้ว');}catch{setSaveStatus('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความเพื่อคัดลอกเอง');}}}>คัดลอก JSON</button></div><textarea aria-label="ข้อมูลห้อง JSON" value={transferJSON} onChange={e=>{setTransferJSON(e.target.value);setConfirmImport(false);}} placeholder="วาง JSON จากอีกเครื่องเพื่อเรียกคืน" /><label className="office-import-confirm"><input type="checkbox" checked={confirmImport} onChange={e=>setConfirmImport(e.target.checked)}/> ยืนยันว่าต้องการแทนที่การจัดห้องปัจจุบัน</label><button type="button" disabled={!confirmImport||!transferJSON.trim()} onClick={()=>{const r=importRoomJSON(transferJSON);if(!r.ok){setSaveStatus(r.error);return;}setTheme(r.value.theme);setMoving(r.value.moving);setLayout(r.value.layout);setDecor(r.value.decor);setSelected(r.value.layout[0].id);setConfirmImport(false);setSaveStatus('นำเข้าการจัดห้องสำเร็จ');}}>นำเข้าการจัดห้อง</button></div>}
  <div className="office-team-panel"><div className="office-team-summary" aria-live="polite"><strong>ภาพรวมพนักงาน</strong><span>นั่งทำงาน {teamSummary.working}</span><span>เดิน {teamSummary.walking}</span><span>พัก {teamSummary.resting}</span></div><div className="office-team-actions" role="group" aria-label="ตั้งค่าท่าทางพนักงานทั้งหมด">{TEAM_PRESETS.map(p=><button key={p.id} type="button" onClick={()=>{const r=applyTeamStatus(layout,p.status);if(r.ok){setLayout(r.layout);setSaveStatus('เปลี่ยนท่าทางพนักงานทั้งหมดแล้ว');}else setSaveStatus(r.error)}}>{p.label}</button>)}</div></div>
  {decorOpen&&<fieldset className="office-decor-controls"><legend>เลือกของตกแต่งในห้อง</legend>{Object.entries(ROOM_DECOR).map(([id,item])=><label key={id}><input type="checkbox" checked={decor.includes(id)} onChange={()=>{const r=toggleDecor(decor,id);if(r.ok)setDecor(r.decor)}}/>{item.symbol} {item.label}</label>)}</fieldset>}
  {error&&<p role="alert" className="office-error">{error}</p>}
  {saveStatus&&<p role="status" className="office-save-status">{saveStatus}</p>}
  <div className={'office-room office-'+theme+(moving?' is-moving':'')} style={{'--office-motion-duration':motionDuration(motionSpeed),...(background?{backgroundImage:'linear-gradient(#071e2d44,#071e2d33),url("'+background+'")'}:{})}} aria-label="ภาพจำลองห้องทำงานพร้อมพนักงาน 7 ตำแหน่ง">
   <div className="office-window" aria-hidden="true"><span>☀</span></div>
   <div className="office-clock" aria-hidden="true">◷</div>
   <div className="office-plant" aria-hidden="true">{decor.includes('plant')?'🌿':''}</div>
   {decor.includes('books')&&<div className="office-decor-books" aria-hidden="true">📚</div>}
   {decor.includes('board')&&<div className="office-decor-board" aria-hidden="true">📋 <span>งานวันนี้</span></div>}
   {decor.includes('coffee')&&<div className="office-decor-coffee" aria-hidden="true">☕</div>}
   {decor.includes('lamp')&&<div className="office-decor-lamp" aria-hidden="true">💡</div>}
   <div className="office-floor" aria-hidden="true"/>
   <div className="office-desks">
    {layout.map((entry,i)=>{const staff=STAFF.find(x=>x.id===entry.id);return <button type="button" className={'office-station office-state-'+entry.status+(selected===staff.id?' is-selected':'')} key={staff.id} onClick={()=>setSelected(staff.id)} aria-pressed={selected===staff.id} style={{'--staff-accent':staff.accent,'--walk-delay':(i%4)*-1.4+'s'}}>
      <span className="office-character" aria-hidden="true"><span className="office-hair"/><span className="office-face"><i/><i/></span><span className="office-torso"/><span className="office-arm office-arm-left"/><span className="office-arm office-arm-right"/><span className="office-leg office-leg-left"/><span className="office-leg office-leg-right"/></span>
      <span className="office-desk" aria-hidden="true"><span className="office-monitor"/><span className="office-desk-top"/><span className="office-desk-legs"/></span>
      <span className="office-name">{entry.name}</span>
      <span className="office-status">{entry.status==='working'?'กำลังทำงาน':entry.status==='walking'?'เดินสำรวจ':'พักงาน'}</span>
     </button>})}
   </div>
  </div>
  <div className="office-details" aria-live="polite">
   <div><h3>{active.name}</h3><p>{person.role}</p><p className="muted">ปรับชื่อและตำแหน่งในห้องได้เฉพาะแท็บนี้ ตัวละครยังไม่ใช่ AI ที่ทำงานจริง</p></div>
   <div className="office-editor">
    <label>ชื่อที่แสดง <input aria-label="ชื่อพนักงาน" maxLength={40} value={active.name} onChange={e=>setName(e.target.value)} /></label>
    <label>ท่าทาง <select aria-label="สถานะพนักงาน" value={active.status} onChange={e=>setStatus(e.target.value)}><option value="working">นั่งทำงาน</option><option value="walking">เดินไปมา</option><option value="resting">พักงาน</option></select></label>
    <div className="office-reorder"><button type="button" onClick={()=>moveDesk(-1)} disabled={layout[0]?.id===selected}>ย้ายโต๊ะไปก่อนหน้า</button><button type="button" onClick={()=>moveDesk(1)} disabled={layout[layout.length-1]?.id===selected}>ย้ายโต๊ะไปถัดไป</button><button type="button" onClick={()=>{setLayout(resetOfficeLayout());setSelected(STAFF[0].id);setError('');}}>คืนค่าพนักงาน</button></div>
   </div>
  </div>
  <p className="office-footnote">ชื่อพนักงาน ลำดับโต๊ะ ท่าทาง และธีมสามารถบันทึกในเบราว์เซอร์ได้ด้วยตนเอง ของตกแต่งสามารถบันทึกในเบราว์เซอร์ได้เช่นกัน ภาพพื้นหลังที่อัปโหลดจะไม่ถูกบันทึกหรือส่งขึ้นเซิร์ฟเวอร์</p>
 </section>
}
