import {STAFF} from './virtual-office-model.js';
export const OFFICE_STATUSES=Object.freeze(['working','walking','resting']);
export function initialOfficeLayout(){return STAFF.map(x=>({id:x.id,name:x.name,status:'working'}));}
export function renameOfficeStaff(layout,id,name){
 if(!Array.isArray(layout)||!STAFF.some(x=>x.id===id)||typeof name!=='string'||!name.trim()||name.trim().length>40)return {ok:false,error:'กรุณาระบุชื่อไม่เกิน 40 ตัวอักษร'};
 return {ok:true,layout:layout.map(x=>x.id===id?{...x,name:name.trim()}:x)};
}
export function changeOfficeStatus(layout,id,status){
 if(!Array.isArray(layout)||!STAFF.some(x=>x.id===id)||!OFFICE_STATUSES.includes(status))return {ok:false,error:'สถานะไม่ถูกต้อง'};
 return {ok:true,layout:layout.map(x=>x.id===id?{...x,status}:x)};
}
export function moveOfficeStaff(layout,id,direction){
 if(!Array.isArray(layout)||![-1,1].includes(direction))return {ok:false,error:'ทิศทางไม่ถูกต้อง'};
 const index=layout.findIndex(x=>x.id===id),target=index+direction;
 if(index<0||target<0||target>=layout.length)return {ok:false,error:'ไม่สามารถย้ายตำแหน่งได้'};
 const result=layout.map(x=>({...x}));[result[index],result[target]]=[result[target],result[index]];
 return {ok:true,layout:result};
}
export function resetOfficeLayout(){return initialOfficeLayout()}
