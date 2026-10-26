export const STAFF=Object.freeze([
{id:'manager',name:'ผู้จัดการสำนักงาน',role:'บริหารและประสานงาน',desk:0,accent:'#3b7f95'},
{id:'legal',name:'นักวิจัยกฎหมาย',role:'ค้นคว้าและวิเคราะห์กฎหมาย',desk:1,accent:'#8968a9'},
{id:'writer',name:'เจ้าหน้าที่ร่างเอกสาร',role:'จัดทำเอกสารและรายงาน',desk:2,accent:'#ca8954'},
{id:'designer',name:'นักออกแบบ',role:'ออกแบบสื่อและงานสร้างสรรค์',desk:3,accent:'#4f9c85'},
{id:'analyst',name:'นักวิเคราะห์ข้อมูล',role:'วิเคราะห์ข้อมูลและสรุปผล',desk:4,accent:'#668ac2'},
{id:'developer',name:'นักพัฒนาระบบ',role:'พัฒนาและดูแลซอฟต์แวร์',desk:5,accent:'#c07082'},
{id:'reviewer',name:'ผู้ตรวจสอบคุณภาพ',role:'ตรวจทานและควบคุมคุณภาพ',desk:6,accent:'#a88b42'}
]);
export const ROOM_THEMES=Object.freeze(['daylight','evening','mint']);
export function validRoomTheme(value){return ROOM_THEMES.includes(value)}
export function validateBackgroundFile(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))return {ok:false,error:'รองรับเฉพาะไฟล์ PNG, JPG หรือ WebP'};
 if(!Number.isFinite(file.size)||file.size<=0||file.size>3*1024*1024)return {ok:false,error:'รูปภาพต้องมีขนาดไม่เกิน 3 MB'};
 return {ok:true};
}
