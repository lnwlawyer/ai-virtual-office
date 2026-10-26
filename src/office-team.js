import {OFFICE_STATUSES} from './office-layout.js';
export const TEAM_PRESETS=Object.freeze([
{id:'focus',label:'ทุกคนทำงาน',status:'working'},
{id:'walk',label:'ทุกคนเดิน',status:'walking'},
{id:'break',label:'ทุกคนพัก',status:'resting'}
]);
export function applyTeamStatus(layout,status){
 if(!Array.isArray(layout)||!OFFICE_STATUSES.includes(status)||layout.some(x=>!x||typeof x.id!=='string'))return {ok:false,error:'ไม่สามารถตั้งค่าสถานะทีมได้'};
 return {ok:true,layout:layout.map(x=>({...x,status}))};
}
export function teamStatusSummary(layout){
 const counts={working:0,walking:0,resting:0};
 if(!Array.isArray(layout))return counts;
 for(const entry of layout){if(OFFICE_STATUSES.includes(entry?.status))counts[entry.status]++;}
 return counts;
}
