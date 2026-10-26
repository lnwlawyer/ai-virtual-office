import {validateRoomSnapshot,createRoomSnapshot} from './office-room-storage.js';
export const MAX_ROOM_IMPORT_BYTES=12000;
export function exportRoomJSON(theme,moving,layout,decor,avatars={}){
 const r=createRoomSnapshot(theme,moving,layout,decor,avatars);
 if(!r.ok)return r;
 return {ok:true,content:JSON.stringify(r.value,null,2)};
}
export function importRoomJSON(raw){
 if(typeof raw!=='string'||!raw.trim()||new TextEncoder().encode(raw).length>MAX_ROOM_IMPORT_BYTES)return {ok:false,error:'ไฟล์ JSON ว่างหรือใหญ่เกิน 12 KB'};
 try{return validateRoomSnapshot(JSON.parse(raw))}
 catch{return {ok:false,error:'ไฟล์ JSON ไม่ถูกต้อง'};}
}
