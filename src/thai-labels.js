export const MENU_LABELS=Object.freeze({
"Dashboard":"ภาพรวมระบบ",
"AI Command Center":"ศูนย์สั่งงาน AI",
"Virtual Office":"สำนักงานเสมือน",
"Agent Control Room":"ศูนย์ควบคุมเอเจนต์",
"Tasks & Projects":"งานและโครงการ",
"Creative Studio":"สตูดิโอสร้างสรรค์",
"Documents":"เอกสาร",
"Knowledge Base":"คลังความรู้",
"Output Library":"คลังผลงาน",
"Settings & Security":"ตั้งค่าและความปลอดภัย"
});
export const THAI_LABELS=Object.freeze({
low:"ต่ำ",normal:"ปกติ",high:"สูง",todo:"ยังไม่เริ่ม","in-progress":"กำลังดำเนินการ",done:"เสร็จแล้ว",
law:"กฎหมาย",guide:"คู่มือ",policy:"นโยบาย",general:"ทั่วไป",all:"ทั้งหมด",
note:"บันทึก",draft:"ร่างเอกสาร",analysis:"บทวิเคราะห์",
Single:"รายเดียว",Compare:"เปรียบเทียบ",Team:"ทำงานร่วมกัน"
});
export const thaiMenu=(key)=>MENU_LABELS[key]??key;
export const thaiLabel=(key)=>THAI_LABELS[key]??key;
