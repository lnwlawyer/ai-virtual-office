export function walkingStaff(layout){return Array.isArray(layout)?layout.filter(x=>x?.status==='walking'):[];}
export function walkingLaneDuration(speed){
 return speed==='slow'?'16s':speed==='fast'?'5s':'9s';
}
export function walkingLaneDelay(index){return `-${index*1.7}s`;}
