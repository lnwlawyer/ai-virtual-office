import {getOfficeStorage} from './office-safe-storage.js';
import {officeHistoryShortcut} from './office-history-shortcuts.js';
import {ROOM_SLOTS,saveRoomSlot,readRoomSlot,removeRoomSlot,listRoomSlots,copyRoomSlot} from './office-room-slots.js';
import {createRoomSnapshot} from './office-room-storage.js';
import {initialHistory,commitHistory,undoHistory,redoHistory,resetHistory} from './office-layout-history.js';
import {STAFF_FILTERS,matchingStaff,nextMatchingStaff} from './office-staff-navigation.js';
import {AVATAR_STYLES,avatarStyle,setAvatarStyle} from './office-avatar-styles.js';
import {walkingStaff,walkingLaneDuration,walkingLaneDelay} from './office-walking-lane.js';
import {MOTION_SPEEDS,validMotionSpeed,motionDuration} from './office-motion.js';
import {TEAM_PRESETS,applyTeamStatus,teamStatusSummary} from './office-team.js';
import {exportRoomJSON,importRoomJSON} from './office-room-transfer.js';
import {ROOM_DECOR,DEFAULT_DECOR,toggleDecor} from './office-decor.js';
import {saveRoomSnapshot,readRoomSnapshot,removeRoomSnapshot,defaultRoomSnapshot} from './office-room-storage.js';
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
 const [confirmReset,setConfirmReset]=useState(false);
 const [confirmDeleteSaved,setConfirmDeleteSaved]=useState(false);
 const [slotId,setSlotId]=useState('1');
 const [slotVersion,setSlotVersion]=useState(0);
 const [slotAction,setSlotAction]=useState(null);
 const [pendingSlot,setPendingSlot]=useState(null);
 const [copyTarget,setCopyTarget]=useState('2');
 const [confirmTeamPreset,setConfirmTeamPreset]=useState(null);
 const [moving,setMoving]=useState(true);
 const [motionSpeed,setMotionSpeed]=useState('normal');
 const [avatarStyles,setAvatarStyles]=useState({});
 const [selected,setSelected]=useState(STAFF[0].id);
 const [staffSearch,setStaffSearch]=useState('');
 const [staffFilter,setStaffFilter]=useState('all');
 const [advancedOpen,setAdvancedOpen]=useState(false);
 const [layoutHistory,setLayoutHistory]=useState(()=>initialHistory(initialOfficeLayout()));
 const layout=layoutHistory.present;
 function setLayout(next){setLayoutHistory(h=>commitHistory(h,next));}
 function restoreLayout(next){setLayoutHistory(resetHistory(next));}
 function undoLayout(){setLayoutHistory(h=>undoHistory(h));setSaveStatus('ย้อนกลับการแก้ไขพนักงานแล้ว');}
 function redoLayout(){setLayoutHistory(h=>redoHistory(h));setSaveStatus('ทำซ้ำการแก้ไขพนักงานแล้ว');}
 const [nameDraft,setNameDraft]=useState('');
 useEffect(()=>{function onKeyDown(event){const action=officeHistoryShortcut(event);if(!action)return;if(action==='undo'&&!layoutHistory.past.length)return;if(action==='redo'&&!layoutHistory.future.length)return;event.preventDefault();setLayoutHistory(h=>action==='undo'?undoHistory(h):redoHistory(h));}window.addEventListener('keydown',onKeyDown);return ()=>window.removeEventListener('keydown',onKeyDown)},[layoutHistory.past.length,layoutHistory.future.length]);
 useEffect(()=>{setNameDraft(layout.find(x=>x.id===selected)?.name??'')},[selected,layoutHistory.present]);
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
 const walkers=walkingStaff(layout);
 const matches=matchingStaff(layout,staffSearch,staffFilter);
 const matchingIds=new Set(matches.map(x=>x.id));
 const officeStorage=getOfficeStorage();
 const slots=listRoomSlots(officeStorage);
 const chosenSlot=slots.find(x=>x.id===slotId);
 function applySnapshot(value){setTheme(value.theme);setMoving(value.moving);restoreLayout(value.layout);setDecor(value.decor);setAvatarStyles(value.avatars);setMotionSpeed(value.motionSpeed);setSelected(value.layout[0].id);setNameDraft(value.layout[0].name);setStaffSearch('');setStaffFilter('all');}
 function confirmSlotAction(){
  if(!pendingSlot)return;
  const {sourceId,targetId}=pendingSlot;
  let r;
  if(slotAction==='save'){const snapshot=createRoomSnapshot(theme,moving,layout,decor,avatarStyles,motionSpeed);r=snapshot.ok?saveRoomSlot(officeStorage,sourceId,snapshot.value):snapshot;}
  else if(slotAction==='load'){r=readRoomSlot(officeStorage,sourceId);if(r.ok)applySnapshot(r.value);}
  else if(slotAction==='delete'){r=removeRoomSlot(officeStorage,sourceId);}
  else if(slotAction==='copy'){r=copyRoomSlot(officeStorage,sourceId,targetId,{overwrite:true});}
  else return;
  setSaveStatus(r.ok?({save:'บันทึกห้องในช่องที่เลือกแล้ว',load:'เรียกคืนห้องจากช่องที่เลือกแล้ว',delete:'ลบข้อมูลช่องที่เลือกแล้ว',copy:'คัดลอกชุดการจัดห้องแล้ว'}[slotAction]):r.error);
  setSlotAction(null);setPendingSlot(null);setSlotVersion(v=>v+1);
 }
 function setStatus(status){const r=changeOfficeStatus(layout,selected,status);if(r.ok)setLayout(r.layout);}
 function commitName(){const r=renameOfficeStaff(layout,selected,nameDraft);if(r.ok){setLayout(r.layout);setNameDraft(r.layout.find(x=>x.id===selected).name);setError('');}else setError(r.error);}
 function cancelName(){setNameDraft(active.name);setError('');}
 function moveDesk(direction){const r=moveOfficeStaff(layout,selected,direction);if(r.ok){setLayout(r.layout);setError('');}}

 return <section className="office-shell">
  <div className="office-heading"><div><h2>สำนักงานเสมือนแบบโต้ตอบ</h2><p className="muted">เลือกพนักงานเพื่อดูบทบาท เปลี่ยนฉากห้อง หรือเปิดการเคลื่อนไหวของตัวการ์ตูน</p></div><span className="office-demo">ตัวละครจำลอง · ยังไม่เชื่อมต่อ AI</span></div>
  <div className="office-layout-history-controls" role="group" aria-label="ย้อนกลับหรือทำซ้ำการแก้ไขพนักงาน"><button type="button" disabled={!layoutHistory.past.length} onClick={undoLayout}>↶ ย้อนกลับ</button><button type="button" disabled={!layoutHistory.future.length} onClick={redoLayout}>↷ ทำซ้ำ</button><span>ย้อนกลับได้ {layoutHistory.past.length} ขั้นตอน · Ctrl/⌘+Z ย้อนกลับ · Ctrl/⌘+Shift+Z ทำซ้ำ</span></div>
  <div className="office-staff-finder" role="search" aria-label="ค้นหาพนักงานในสำนักงาน"><label>ค้นหาพนักงาน <input aria-label="ค้นหาชื่อหรือบทบาทพนักงาน" type="search" maxLength={80} value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="ชื่อหรือบทบาท"/></label><label>สถานะ <select aria-label="กรองสถานะพนักงาน" value={staffFilter} onChange={e=>setStaffFilter(e.target.value)}><option value="all">ทั้งหมด</option><option value="working">กำลังทำงาน</option><option value="walking">กำลังเดิน</option><option value="resting">พักงาน</option></select></label><span role="status">พบ {matches.length} / {layout.length} คน</span><button type="button" disabled={!matches.length} onClick={()=>setSelected(nextMatchingStaff(layout,staffSearch,staffFilter,selected,-1))}>ก่อนหน้า</button><button type="button" disabled={!matches.length} onClick={()=>setSelected(nextMatchingStaff(layout,staffSearch,staffFilter,selected,1))}>ถัดไป</button><button type="button" disabled={!staffSearch&&staffFilter==='all'} onClick={()=>{setStaffSearch('');setStaffFilter('all')}}>ล้างตัวกรอง</button></div>
  <button type="button" className="office-advanced-toggle" aria-expanded={advancedOpen} onClick={()=>setAdvancedOpen(v=>!v)}>{advancedOpen?'ซ่อนเครื่องมือจัดการห้อง':'เครื่องมือจัดการห้องเพิ่มเติม'}</button>
  <div className="office-toolbar">
   <label>บรรยากาศห้อง <select aria-label="เลือกบรรยากาศห้อง" value={theme} onChange={e=>{if(validRoomTheme(e.target.value))setTheme(e.target.value)}}>{ROOM_THEMES.map((x,i)=><option value={x} key={x}>{['กลางวัน','ยามเย็น','โทนมิ้นต์'][i]}</option>)}</select></label>
   <div className="office-toolbar-advanced" hidden={!advancedOpen}>
   <label className="office-file">เปลี่ยนภาพพื้นหลัง <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseBackground}/></label>
   <button type="button" onClick={clearBackground} disabled={!background}>ใช้ฉากเริ่มต้น</button>
   <button type="button" aria-pressed={moving} onClick={()=>setMoving(v=>!v)}>{moving?'หยุดการเคลื่อนไหว':'เปิดการเคลื่อนไหว'}</button>
   <label>ความเร็วการเคลื่อนไหว <select aria-label="ความเร็วตัวละคร" value={motionSpeed} onChange={e=>{if(validMotionSpeed(e.target.value))setMotionSpeed(e.target.value)}}>{MOTION_SPEEDS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
   <button type="button" aria-expanded={decorOpen} onClick={()=>setDecorOpen(v=>!v)}>{decorOpen?'ซ่อนตัวเลือกตกแต่ง':'ตกแต่งห้อง'}</button>
   <button type="button" aria-expanded={transferOpen} onClick={()=>setTransferOpen(v=>!v)}>{transferOpen?'ปิดการย้ายห้อง':'ส่งออก/นำเข้าห้อง'}</button>
   <button type="button" onClick={()=>{const r=saveRoomSnapshot(officeStorage,theme,moving,layout,decor,avatarStyles,motionSpeed);setSaveStatus(r.ok?'บันทึกการจัดห้องในเบราว์เซอร์แล้ว':r.error);}}>บันทึกการจัดห้อง</button>
   <button type="button" onClick={()=>{const r=readRoomSnapshot(officeStorage);if(!r.ok){setSaveStatus(r.error);return;}setTheme(r.value.theme);setMoving(r.value.moving);restoreLayout(r.value.layout);setDecor(r.value.decor);setAvatarStyles(r.value.avatars);setMotionSpeed(r.value.motionSpeed);setSelected(r.value.layout[0].id);setNameDraft(r.value.layout[0].name);setSaveStatus('เรียกคืนการจัดห้องสำเร็จ');}}>เรียกคืนการจัดห้อง</button>
   <button type="button" aria-expanded={confirmDeleteSaved} onClick={()=>setConfirmDeleteSaved(v=>!v)}>ลบข้อมูลที่บันทึก</button>
   <button type="button" onClick={()=>setConfirmReset(v=>!v)} aria-expanded={confirmReset}>{confirmReset?'ยกเลิกคืนค่าห้อง':'คืนค่าห้องทั้งหมด'}</button>
   </div>
  </div>
  <div className="office-slot-controls" role="group" aria-label="ช่องบันทึกการจัดห้อง"><label>ชุดการจัดห้อง <select aria-label="เลือกช่องบันทึกห้อง" value={slotId} onChange={e=>{setSlotId(e.target.value);setCopyTarget(ROOM_SLOTS.find(x=>x.id!==e.target.value).id);setSlotAction(null)}}>{slots.map(x=><option key={x.id} value={x.id}>{x.label} — {x.occupied?'มีข้อมูล':'ว่าง'}</option>)}</select></label><button type="button" onClick={()=>{setPendingSlot({sourceId:slotId,targetId:null});setSlotAction('save')}}>บันทึกชุดนี้</button><button type="button" disabled={!chosenSlot?.occupied} onClick={()=>{setPendingSlot({sourceId:slotId,targetId:null});setSlotAction('load')}}>เรียกคืนชุดนี้</button><button type="button" disabled={!chosenSlot?.occupied} onClick={()=>{setPendingSlot({sourceId:slotId,targetId:null});setSlotAction('delete')}}>ลบชุดนี้</button><label>คัดลอกไปยัง <select aria-label="ช่องปลายทางสำหรับคัดลอก" value={copyTarget} onChange={e=>{setCopyTarget(e.target.value);setSlotAction(null)}}>{ROOM_SLOTS.filter(x=>x.id!==slotId).map(x=><option key={x.id} value={x.id}>{x.label} — {slots.find(v=>v.id===x.id)?.occupied?'มีข้อมูล':'ว่าง'}</option>)}</select></label><button type="button" disabled={!chosenSlot?.occupied||copyTarget===slotId} onClick={()=>{setPendingSlot({sourceId:slotId,targetId:copyTarget});setSlotAction('copy')}}>คัดลอกชุดนี้</button></div>
  {slotAction&&<div className="office-reset-confirm" role="group" aria-label="ยืนยันการจัดการช่องบันทึก"><p>{slotAction==='save'?'ยืนยันบันทึกการจัดห้องปัจจุบัน (ข้อมูลเดิมในช่องนี้จะถูกแทนที่)':slotAction==='load'?'ยืนยันเรียกคืนชุดนี้แทนการจัดห้องปัจจุบัน':slotAction==='copy'?`ยืนยันคัดลอกไปยัง ${ROOM_SLOTS.find(x=>x.id===pendingSlot?.targetId)?.label} (ข้อมูลเดิมในช่องปลายทางจะถูกแทนที่)`:'ยืนยันลบชุดการจัดห้องที่เลือก'} — {ROOM_SLOTS.find(x=>x.id===pendingSlot?.sourceId)?.label}</p><button type="button" onClick={confirmSlotAction}>ยืนยัน</button><button type="button" onClick={()=>{setSlotAction(null);setPendingSlot(null)}}>ยกเลิก</button></div>}
  {confirmDeleteSaved&&<div className="office-reset-confirm" role="group" aria-label="ยืนยันลบข้อมูลห้องที่บันทึก"><p>ลบเฉพาะข้อมูลการจัดห้องที่บันทึกในเบราว์เซอร์ การจัดห้องที่กำลังแสดงจะไม่เปลี่ยนแปลง</p><button type="button" onClick={()=>{const r=removeRoomSnapshot(officeStorage);setSaveStatus(r.ok?'ลบข้อมูลห้องที่บันทึกไว้แล้ว':r.error);setConfirmDeleteSaved(false)}}>ยืนยันลบข้อมูลที่บันทึก</button><button type="button" onClick={()=>setConfirmDeleteSaved(false)}>ยกเลิก</button></div>}
  {confirmReset&&<div className="office-reset-confirm" role="group" aria-label="ยืนยันคืนค่าห้องทั้งหมด"><p>คืนค่าธีม พนักงาน ท่าทาง โต๊ะ ของตกแต่ง ความเร็ว และลักษณะตัวละคร รวมถึงล้างภาพพื้นหลังที่เลือกในแท็บนี้ โดยไม่ลบข้อมูลห้องที่บันทึกไว้ในเบราว์เซอร์</p><button type="button" onClick={()=>{const d=defaultRoomSnapshot();setTheme(d.theme);setMoving(d.moving);restoreLayout(d.layout);setDecor(d.decor);setAvatarStyles(d.avatars);setMotionSpeed(d.motionSpeed);setSelected(d.layout[0].id);setNameDraft(d.layout[0].name);setStaffSearch('');setStaffFilter('all');clearBackground();setConfirmReset(false);setSaveStatus('คืนค่าห้องเป็นค่าเริ่มต้นแล้ว (ข้อมูลที่บันทึกไว้ยังอยู่)');}}>ยืนยันคืนค่าห้อง</button><button type="button" onClick={()=>setConfirmReset(false)}>ยกเลิก</button></div>}
  {transferOpen&&<div className="office-transfer"><h3>ย้ายการจัดห้องด้วย JSON</h3><p className="muted">ข้อมูลเฉพาะธีม พนักงาน และของตกแต่ง ไม่รวมรูปภาพพื้นหลัง</p><div className="office-transfer-actions"><button type="button" onClick={()=>{const r=exportRoomJSON(theme,moving,layout,decor,avatarStyles,motionSpeed);if(r.ok){setTransferJSON(r.content);setSaveStatus('เตรียม JSON สำหรับคัดลอกแล้ว');}else setSaveStatus(r.error);}}>สร้าง JSON ส่งออก</button><button type="button" disabled={!transferJSON} onClick={async()=>{try{await navigator.clipboard.writeText(transferJSON);setSaveStatus('คัดลอก JSON แล้ว');}catch{setSaveStatus('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความเพื่อคัดลอกเอง');}}}>คัดลอก JSON</button></div><textarea aria-label="ข้อมูลห้อง JSON" value={transferJSON} onChange={e=>{setTransferJSON(e.target.value);setConfirmImport(false);}} placeholder="วาง JSON จากอีกเครื่องเพื่อเรียกคืน" /><label className="office-import-confirm"><input type="checkbox" checked={confirmImport} onChange={e=>setConfirmImport(e.target.checked)}/> ยืนยันว่าต้องการแทนที่การจัดห้องปัจจุบัน</label><button type="button" disabled={!confirmImport||!transferJSON.trim()} onClick={()=>{const r=importRoomJSON(transferJSON);if(!r.ok){setSaveStatus(r.error);return;}setTheme(r.value.theme);setMoving(r.value.moving);restoreLayout(r.value.layout);setDecor(r.value.decor);setAvatarStyles(r.value.avatars);setMotionSpeed(r.value.motionSpeed);setSelected(r.value.layout[0].id);setNameDraft(r.value.layout[0].name);setConfirmImport(false);setSaveStatus('นำเข้าการจัดห้องสำเร็จ');}}>นำเข้าการจัดห้อง</button></div>}
  <div className="office-team-panel"><div className="office-team-summary" aria-live="polite"><strong>ภาพรวมพนักงาน</strong><span>นั่งทำงาน {teamSummary.working}</span><span>เดิน {teamSummary.walking}</span><span>พัก {teamSummary.resting}</span></div><div className="office-team-actions" role="group" aria-label="ตั้งค่าท่าทางพนักงานทั้งหมด">{TEAM_PRESETS.map(p=><button key={p.id} type="button" aria-pressed={confirmTeamPreset===p.status} onClick={()=>setConfirmTeamPreset(p.status)}>{p.label}</button>)}</div></div>
  {confirmTeamPreset&&<div className="office-reset-confirm" role="group" aria-label="ยืนยันเปลี่ยนสถานะพนักงานทั้งทีม"><p>เปลี่ยนสถานะพนักงานทั้ง {layout.length} คนเป็น {TEAM_PRESETS.find(p=>p.status===confirmTeamPreset)?.label} ใช่หรือไม่</p><button type="button" onClick={()=>{const r=applyTeamStatus(layout,confirmTeamPreset);if(r.ok){setLayout(r.layout);setSaveStatus('เปลี่ยนสถานะพนักงานทั้งหมดแล้ว')}else setSaveStatus(r.error);setConfirmTeamPreset(null)}}>ยืนยันเปลี่ยนทั้งทีม</button><button type="button" onClick={()=>setConfirmTeamPreset(null)}>ยกเลิก</button></div>}
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
    {layout.map((entry,i)=>{const staff=STAFF.find(x=>x.id===entry.id);return <button type="button" className={'office-station office-state-'+entry.status+(selected===staff.id?' is-selected':'')+(matchingIds.has(staff.id)?'':' office-filter-dim')} key={staff.id} onClick={()=>setSelected(staff.id)} aria-pressed={selected===staff.id} aria-label={`${entry.name} — ${staff.role} — ${entry.status==='working'?'กำลังทำงาน':entry.status==='walking'?'กำลังเดิน':'พักงาน'}`} style={{'--staff-accent':staff.accent,'--avatar-hair':avatarStyle(avatarStyles[staff.id]).hair,'--avatar-skin':avatarStyle(avatarStyles[staff.id]).skin,'--walk-delay':(i%4)*-1.4+'s'}}>
      <span className="office-character" aria-hidden="true"><span className="office-hair"/><span className="office-face"><i/><i/></span><span className="office-torso"/><span className="office-arm office-arm-left"/><span className="office-arm office-arm-right"/><span className="office-leg office-leg-left"/><span className="office-leg office-leg-right"/></span>
      <span className="office-desk" aria-hidden="true"><span className="office-monitor"/><span className="office-desk-top"/><span className="office-desk-legs"/></span>
      <span className="office-name">{entry.name}</span>
      <span className="office-status">{entry.status==='working'?'กำลังทำงาน':entry.status==='walking'?'เดินสำรวจ':'พักงาน'}</span>
     </button>})}
   </div>
   <div className="office-walking-lane" aria-label={`ทางเดินสำนักงาน มีพนักงานกำลังเดิน ${walkers.length} คน`}>
    <span className="office-lane-sign" aria-hidden="true">ทางเดินสำนักงาน</span>
    {walkers.map((entry,i)=>{const staff=STAFF.find(x=>x.id===entry.id);return <button type="button" key={entry.id} className={'office-lane-walker'+(matchingIds.has(entry.id)?'':' office-filter-dim')} style={{'--staff-accent':staff.accent,'--avatar-hair':avatarStyle(avatarStyles[staff.id]).hair,'--avatar-skin':avatarStyle(avatarStyles[staff.id]).skin,'--lane-delay':walkingLaneDelay(i),'--lane-duration':walkingLaneDuration(motionSpeed)}} onClick={()=>setSelected(entry.id)} aria-label={`เลือก ${entry.name} ที่กำลังเดิน`} title={entry.name}><span className="office-walker-head" aria-hidden="true"/><span className="office-walker-body" aria-hidden="true"/><span className="office-walker-arm office-walker-arm-left" aria-hidden="true"/><span className="office-walker-arm office-walker-arm-right" aria-hidden="true"/><span className="office-walker-feet" aria-hidden="true"><i/><i/></span></button>})}
   </div>
  </div>
  <div className="office-details" aria-live="polite">
   <div><h3>{active.name}</h3><p>{person.role}</p><p className="muted">ปรับชื่อและตำแหน่งในห้องได้เฉพาะแท็บนี้ ตัวละครยังไม่ใช่ AI ที่ทำงานจริง</p></div>
   <div className="office-editor">
    <div className="office-name-editor"><label>ชื่อที่แสดง <input aria-label="ชื่อพนักงาน" maxLength={40} value={nameDraft} onChange={e=>setNameDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commitName()}if(e.key==='Escape'){e.preventDefault();cancelName()}}}/></label><button type="button" disabled={nameDraft===active.name} onClick={commitName}>บันทึกชื่อ</button><button type="button" disabled={nameDraft===active.name} onClick={cancelName}>ยกเลิก</button></div>
    <label>ลักษณะตัวละคร <select aria-label="รูปแบบตัวการ์ตูนพนักงาน" value={avatarStyles[selected]??'classic'} onChange={e=>{const r=setAvatarStyle(avatarStyles,selected,e.target.value,STAFF);if(r.ok)setAvatarStyles(r.styles)}}>{AVATAR_STYLES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
    <label>ท่าทาง <select aria-label="สถานะพนักงาน" value={active.status} onChange={e=>setStatus(e.target.value)}><option value="working">นั่งทำงาน</option><option value="walking">เดินไปมา</option><option value="resting">พักงาน</option></select></label>
    <div className="office-reorder"><button type="button" onClick={()=>moveDesk(-1)} disabled={layout[0]?.id===selected}>ย้ายโต๊ะไปก่อนหน้า</button><button type="button" onClick={()=>moveDesk(1)} disabled={layout[layout.length-1]?.id===selected}>ย้ายโต๊ะไปถัดไป</button><button type="button" onClick={()=>{restoreLayout(resetOfficeLayout());setAvatarStyles({});setSelected(STAFF[0].id);setNameDraft(STAFF[0].name);setError('');}}>คืนค่าพนักงาน</button></div>
   </div>
  </div>
  <p className="office-footnote">ชื่อพนักงาน ลำดับโต๊ะ ท่าทาง และธีมสามารถบันทึกในเบราว์เซอร์ได้ด้วยตนเอง ของตกแต่งสามารถบันทึกในเบราว์เซอร์ได้เช่นกัน สีผมและโทนตัวละครสามารถบันทึกและส่งออกไปพร้อมกับการจัดห้องได้ ภาพพื้นหลังที่อัปโหลดจะไม่ถูกบันทึกหรือส่งขึ้นเซิร์ฟเวอร์</p>
 </section>
}
