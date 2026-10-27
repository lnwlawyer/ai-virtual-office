import {validateRoomSnapshot} from './office-room-storage.js';
export const ROOM_SLOT_PREFIX='ai-virtual-office:slot:v1:';
export const ROOM_SLOTS=Object.freeze([{id:'1',label:'แบบที่ 1'},{id:'2',label:'แบบที่ 2'},{id:'3',label:'แบบที่ 3'}]);
export function validRoomSlot(id){return ROOM_SLOTS.some(x=>x.id===id);}
export function readRoomSlot(storage,id){
 if(!validRoomSlot(id))return {ok:false,error:'ช่องบันทึกไม่ถูกต้อง'};
 try{const raw=storage?.getItem(ROOM_SLOT_PREFIX+id);if(!raw)return {ok:false,error:'ช่องนี้ยังไม่มีข้อมูล'};if(raw.length>12000)return {ok:false,error:'ข้อมูลห้องใหญ่เกินกำหนด'};return validateRoomSnapshot(JSON.parse(raw));}
 catch{return {ok:false,error:'อ่านข้อมูลช่องบันทึกไม่สำเร็จ'};}
}
export function saveRoomSlot(storage,id,snapshot){
 if(!validRoomSlot(id))return {ok:false,error:'ช่องบันทึกไม่ถูกต้อง'};
 const result=validateRoomSnapshot(snapshot);if(!result.ok)return result;
 try{storage?.setItem(ROOM_SLOT_PREFIX+id,JSON.stringify(result.value));return {ok:true};}
 catch{return {ok:false,error:'บันทึกข้อมูลช่องนี้ไม่สำเร็จ'};}
}
export function removeRoomSlot(storage,id){
 if(!validRoomSlot(id))return {ok:false,error:'ช่องบันทึกไม่ถูกต้อง'};
 try{storage?.removeItem(ROOM_SLOT_PREFIX+id);return {ok:true};}
 catch{return {ok:false,error:'ลบข้อมูลช่องนี้ไม่สำเร็จ'};}
}
export function listRoomSlots(storage){return ROOM_SLOTS.map(slot=>({...slot,occupied:readRoomSlot(storage,slot.id).ok}));}
