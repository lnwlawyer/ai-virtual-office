import React,{useState} from 'react';
import {AI_GATEWAY_ROLES} from './ai-gateway-contract.js';
import {validateBridgeStatusSnapshot} from './bridge-status-snapshot.js';
const names=['ผู้จัดการสำนักงาน','ฝ่ายกฎหมาย','ฝ่ายเอกสาร','ฝ่ายออกแบบ','ฝ่ายวิเคราะห์','ฝ่ายพัฒนา','ฝ่ายตรวจสอบ'];
const statuses={awaiting_approval:'รออนุมัติ',approved:'อนุมัติแล้ว',rejected:'ปฏิเสธ',completed:'เสร็จสิ้น',failed:'ล้มเหลว'};
export default function LocalBridgePanel(){
 const [raw,setRaw]=useState('');
 const [snapshot,setSnapshot]=useState(null);
 const [error,setError]=useState('');
 function inspect(){
  try{
   if(raw.length>50000)throw new Error('ข้อมูลเกินขนาดที่กำหนด');
   const result=validateBridgeStatusSnapshot(JSON.parse(raw));
   if(!result.ok)throw new Error(result.error);
   setSnapshot(result.value);setError('');
  }catch(e){setSnapshot(null);setError(e instanceof SyntaxError?'JSON ไม่ถูกต้อง':e.message)}
 }
 return <section className="panel" aria-label="สถานะ Local Agent Bridge">
  <h2>สถานะ Local Agent Bridge (อ่านอย่างเดียว)</h2>
  <p className="muted">ไม่มีการเชื่อมต่อเครื่องหรือ Terminal จากหน้าเว็บนี้ ข้อมูลจะปรากฏเฉพาะเมื่อวางรายงาน JSON จาก GET /v1/status ที่เรียกด้วยเครื่องมือในเครื่องของคุณ ไม่ต้องวาง Token หรือคำสั่งลับ</p>
  <label>รายงานสถานะ JSON (ไม่บันทึกลงเซิร์ฟเวอร์)<textarea aria-label="รายงานสถานะ Bridge" rows={4} value={raw} maxLength={50001} onChange={e=>setRaw(e.target.value)} placeholder='{"version":1,"mode":"local_manual_only",...}' /></label>
  <div className="switch"><button type="button" onClick={inspect}>แสดงสถานะจากรายงาน</button><button type="button" onClick={()=>{setRaw('');setSnapshot(null);setError('')}}>ล้างข้อมูล</button></div>
  {error&&<p role="alert">{error}</p>}
  {!snapshot?<p role="status">ยังไม่มีรายงาน · Windows 11 / Mac mini: ยังไม่เชื่อมต่อ</p>:<>
   <p role="status">รายงานจากเครื่อง (ไม่ใช่สถานะสด) · งานทั้งหมด {snapshot.totals.all} · รออนุมัติ {snapshot.totals.awaiting_approval} · อนุมัติแล้ว {snapshot.totals.approved} · เสร็จสิ้น {snapshot.totals.completed} · เครื่องที่เชื่อมต่อ 0</p>
   <div className="cards">{snapshot.agents.map((a,i)=><article key={a.id}><h3>{names[i]}</h3><p>ยังไม่เชื่อมต่อ · ดำเนินงานด้วยคน</p><p>งาน {a.totalJobs} · รออนุมัติ {a.pendingApproval} · อนุมัติแล้ว {a.approved}</p></article>)}</div>
   <h3>ประวัติงานล่าสุด (สูงสุด 20 รายการ)</h3>
   {snapshot.recent.length===0?<p>ไม่มีรายการ</p>:<ul>{snapshot.recent.map(j=><li key={j.id}>{names[AI_GATEWAY_ROLES.indexOf(j.agentRole)]} · {statuses[j.status]} · {j.id.slice(0,8)}</li>)}</ul>}
  </>}
 </section>;
}
