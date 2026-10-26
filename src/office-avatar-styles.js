export const AVATAR_STYLES=Object.freeze([
{id:'classic',label:'มาตรฐาน',hair:'#384b5a',skin:'#efbb91'},
{id:'warm',label:'โทนอุ่น',hair:'#634434',skin:'#dca17c'},
{id:'cool',label:'โทนเย็น',hair:'#263b53',skin:'#f2c9a9'},
{id:'silver',label:'ผมสีเงิน',hair:'#8998a3',skin:'#e8b998'}
]);
export function validAvatarStyle(id){return AVATAR_STYLES.some(x=>x.id===id);}
export function avatarStyle(id){return AVATAR_STYLES.find(x=>x.id===id)??AVATAR_STYLES[0];}
export function setAvatarStyle(styles,id,style,staff){
 if(!staff.some(x=>x.id===id)||!validAvatarStyle(style))return {ok:false,error:'รูปแบบตัวละครไม่ถูกต้อง'};
 return {ok:true,styles:{...styles,[id]:style}};
}
