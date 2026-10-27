import {STAFF} from './virtual-office-model.js';
import {OFFICE_STATUSES} from './office-layout.js';
export const STAFF_FILTERS=Object.freeze(['all',...OFFICE_STATUSES]);
export function matchingStaff(layout,query='',status='all'){
 if(!Array.isArray(layout)||typeof query!=='string'||!STAFF_FILTERS.includes(status))return [];
 const q=query.trim().toLocaleLowerCase('th-TH');
 return layout.filter(entry=>{
  const staff=STAFF.find(s=>s.id===entry?.id);
  return Boolean(staff)&&(status==='all'||entry.status===status)&&(!q||entry.name.toLocaleLowerCase('th-TH').includes(q)||staff.role.toLocaleLowerCase('th-TH').includes(q));
 });
}
export function nextMatchingStaff(layout,query,status,current,direction=1){
 const matches=matchingStaff(layout,query,status);
 if(!matches.length)return null;
 const index=matches.findIndex(x=>x.id===current);
 const next=index<0?(direction<0?matches.length-1:0):(index+direction+matches.length)%matches.length;
 return matches[next].id;
}
