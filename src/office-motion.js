export const MOTION_SPEEDS=Object.freeze([
{id:'slow',label:'ช้า',duration:'6s'},
{id:'normal',label:'ปกติ',duration:'3.2s'},
{id:'fast',label:'เร็ว',duration:'1.6s'}
]);
export function validMotionSpeed(value){return MOTION_SPEEDS.some(x=>x.id===value);}
export function motionDuration(value){return MOTION_SPEEDS.find(x=>x.id===value)?.duration??'3.2s';}
