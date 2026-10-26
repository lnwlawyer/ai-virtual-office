export const ROOM_DECOR=Object.freeze({
plant:{label:'ต้นไม้',symbol:'🌿'},
books:{label:'ชั้นหนังสือ',symbol:'📚'},
board:{label:'กระดานงาน',symbol:'📋'},
coffee:{label:'มุมกาแฟ',symbol:'☕'},
lamp:{label:'โคมไฟ',symbol:'💡'}
});
export const DEFAULT_DECOR=Object.freeze(['plant','books','board']);
export function validDecor(items){
 return Array.isArray(items)&&items.length<=Object.keys(ROOM_DECOR).length&&new Set(items).size===items.length&&items.every(x=>Object.hasOwn(ROOM_DECOR,x));
}
export function toggleDecor(items,id){
 if(!validDecor(items)||!Object.hasOwn(ROOM_DECOR,id))return {ok:false,error:'รายการตกแต่งไม่ถูกต้อง'};
 return {ok:true,decor:items.includes(id)?items.filter(x=>x!==id):[...items,id]};
}
export function roomDecorSnapshot(items){return validDecor(items)?{ok:true,decor:[...items]}:{ok:false,error:'ข้อมูลตกแต่งไม่ถูกต้อง'};}
