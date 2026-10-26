import {STAFF,validRoomTheme} from './virtual-office-model.js';
import {OFFICE_STATUSES,initialOfficeLayout} from './office-layout.js';
export const OFFICE_STORAGE_KEY='ai-virtual-office:room:v1';
export function validateRoomSnapshot(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!validRoomTheme(value.theme)||typeof value.moving!=='boolean'||!Array.isArray(value.layout)||value.layout.length!==STAFF.length)return {ok:false,error:'รูปแบบห้องไม่ถูกต้อง'};
 const ids=new Set(STAFF.map(x=>x.id)),seen=new Set();
 for(const entry of value.layout){
  if(!entry||typeof entry!=='object'||!ids.has(entry.id)||seen.has(entry.id)||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>40||!OFFICE_STATUSES.includes(entry.status))return {ok:false,error:'ข้อมูลพนักงานไม่ถูกต้อง'};
  seen.add(entry.id);
 }
 return {ok:true,value:{version:1,theme:value.theme,moving:value.moving,layout:value.layout.map(({id,name,status})=>({id,name,status}))}};
}
export function createRoomSnapshot(theme,moving,layout){return validateRoomSnapshot({version:1,theme,moving,layout});}
export function readRoomSnapshot(storage){
 try{const raw=storage?.getItem(OFFICE_STORAGE_KEY);if(!raw)return {ok:false,error:'ยังไม่มีข้อมูลห้องที่บันทึกไว้'};if(raw.length>12000)return {ok:false,error:'ข้อมูลห้องใหญ่เกินกำหนด'};return validateRoomSnapshot(JSON.parse(raw));}
 catch{return {ok:false,error:'ไม่สามารถอ่านข้อมูลห้องได้'};}
}
export function saveRoomSnapshot(storage,theme,moving,layout){
 const result=createRoomSnapshot(theme,moving,layout);
 if(!result.ok)return result;
 try{storage?.setItem(OFFICE_STORAGE_KEY,JSON.stringify(result.value));return {ok:true};}
 catch{return {ok:false,error:'ไม่สามารถบันทึกห้องในเบราว์เซอร์ได้'};}
}
export function removeRoomSnapshot(storage){
 try{storage?.removeItem(OFFICE_STORAGE_KEY);return {ok:true};}
 catch{return {ok:false,error:'ไม่สามารถลบข้อมูลห้องได้'};}
}
export function defaultRoomSnapshot(){return {version:1,theme:'daylight',moving:true,layout:initialOfficeLayout()};}
