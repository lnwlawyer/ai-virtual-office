import {validMotionSpeed} from './office-motion.js';
import {validAvatarStyle} from './office-avatar-styles.js';
import {DEFAULT_DECOR,validDecor} from './office-decor.js';
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
 const decor=value.decor===undefined?[...DEFAULT_DECOR]:value.decor;
 if(!validDecor(decor))return {ok:false,error:'ข้อมูลของตกแต่งไม่ถูกต้อง'};
 const motionSpeed=value.motionSpeed===undefined?'normal':value.motionSpeed;
 if(!validMotionSpeed(motionSpeed))return {ok:false,error:'ความเร็วการเคลื่อนไหวไม่ถูกต้อง'};
 const avatars=value.avatars===undefined?{}:value.avatars;
 if(!avatars||typeof avatars!=='object'||Array.isArray(avatars)||Object.keys(avatars).some(id=>!ids.has(id)||!validAvatarStyle(avatars[id])))return {ok:false,error:'ข้อมูลลักษณะตัวละครไม่ถูกต้อง'};
 return {ok:true,value:{version:1,theme:value.theme,moving:value.moving,layout:value.layout.map(({id,name,status})=>({id,name,status})),decor:[...decor],avatars:{...avatars},motionSpeed}};
}
export function createRoomSnapshot(theme,moving,layout,decor=DEFAULT_DECOR,avatars={},motionSpeed='normal'){return validateRoomSnapshot({version:1,theme,moving,layout,decor,avatars,motionSpeed});}
export function readRoomSnapshot(storage){
 if(!storage)return {ok:false,error:'เบราว์เซอร์ไม่อนุญาตให้เข้าถึงข้อมูลที่บันทึก'};
 try{const raw=storage?.getItem(OFFICE_STORAGE_KEY);if(!raw)return {ok:false,error:'ยังไม่มีข้อมูลห้องที่บันทึกไว้'};if(raw.length>12000)return {ok:false,error:'ข้อมูลห้องใหญ่เกินกำหนด'};return validateRoomSnapshot(JSON.parse(raw));}
 catch{return {ok:false,error:'ไม่สามารถอ่านข้อมูลห้องได้'};}
}
export function saveRoomSnapshot(storage,theme,moving,layout,decor=DEFAULT_DECOR,avatars={},motionSpeed='normal'){
 const result=createRoomSnapshot(theme,moving,layout,decor,avatars,motionSpeed);
 if(!result.ok)return result;
 if(!storage)return {ok:false,error:'เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล'};
 try{storage.setItem(OFFICE_STORAGE_KEY,JSON.stringify(result.value));return {ok:true};}
 catch{return {ok:false,error:'ไม่สามารถบันทึกห้องในเบราว์เซอร์ได้'};}
}
export function removeRoomSnapshot(storage){
 if(!storage)return {ok:false,error:'เบราว์เซอร์ไม่อนุญาตให้ลบข้อมูลที่บันทึก'};
 try{storage.removeItem(OFFICE_STORAGE_KEY);return {ok:true};}
 catch{return {ok:false,error:'ไม่สามารถลบข้อมูลห้องได้'};}
}
export function defaultRoomSnapshot(){return {version:1,theme:'daylight',moving:true,layout:initialOfficeLayout(),decor:[...DEFAULT_DECOR],avatars:{},motionSpeed:'normal'};}
