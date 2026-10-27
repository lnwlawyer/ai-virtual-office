import {test,expect} from '@playwright/test';
async function openOffice(page){
 await page.goto('/');
 await page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:/สำนักงานเสมือน|Virtual Office/}).click();
 await expect(page.getByRole('heading',{name:'สำนักงานเสมือนแบบโต้ตอบ'})).toBeVisible();
 await expect(page.locator('.office-station')).toHaveCount(7);
 await expect(page.locator('.office-room')).toHaveClass(/office-daylight/);
}
test('approved 2D room renders seven staff and searchable statuses',async({page})=>{
 await openOffice(page);
 await expect(page.locator('.office-room')).not.toHaveClass(/office-isometric/);
 await page.getByRole('searchbox',{name:'ค้นหาชื่อหรือบทบาทพนักงาน'}).fill('นักวิจัย');
 await expect(page.getByRole('status').filter({hasText:'พบ 1 / 7 คน'})).toBeVisible();
 await expect(page.locator('.office-station.office-filter-dim')).toHaveCount(6);
 await page.getByRole('button',{name:'ล้างตัวกรอง'}).click();
 await expect(page.locator('.office-station.office-filter-dim')).toHaveCount(0);
});
test('edit staff, undo redo, save and restore slot without cloud',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await expect(name).toHaveValue('ผู้จัดการสำนักงาน');
 await name.fill('ผู้จัดการทดสอบ');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ผู้จัดการทดสอบ');
 await page.getByRole('button',{name:/ย้อนกลับ/}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ผู้จัดการสำนักงาน');
 await page.getByRole('button',{name:/ทำซ้ำ/}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ผู้จัดการทดสอบ');
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.getByRole('status').filter({hasText:'บันทึกห้องในช่องที่เลือกแล้ว'})).toBeVisible();
 await name.fill('ชื่อใหม่');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'เรียกคืนชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ผู้จัดการทดสอบ');
});
test('bulk change and deletion require confirmation',async({page})=>{
 await openOffice(page);
 await page.getByRole('button',{name:'ทุกคนพัก'}).click();
 await expect(page.getByRole('group',{name:'ยืนยันเปลี่ยนสถานะพนักงานทั้งทีม'})).toBeVisible();
 await page.getByRole('group',{name:'ยืนยันเปลี่ยนสถานะพนักงานทั้งทีม'}).getByRole('button',{name:'ยกเลิก'}).click();
 await expect(page.locator('.office-station.office-state-working')).toHaveCount(7);
 await page.getByRole('button',{name:'ทุกคนพัก'}).click();
 await page.getByRole('group',{name:'ยืนยันเปลี่ยนสถานะพนักงานทั้งทีม'}).getByRole('button',{name:'ยืนยันเปลี่ยนทั้งทีม'}).click();
 await expect(page.locator('.office-station.office-state-resting')).toHaveCount(7);
 await page.getByRole('button',{name:'เครื่องมือจัดการห้องเพิ่มเติม'}).click();
 await page.getByRole('button',{name:'ลบข้อมูลที่บันทึก'}).click();
 await expect(page.getByRole('group',{name:'ยืนยันลบข้อมูลห้องที่บันทึก'})).toBeVisible();
 await page.getByRole('group',{name:'ยืนยันลบข้อมูลห้องที่บันทึก'}).getByRole('button',{name:'ยกเลิก'}).click();
});

test('copying a saved room requires confirmation and preserves source',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('ต้นฉบับ');await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('button',{name:'คัดลอกชุดนี้'}).click();
 await expect(page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'})).toContainText('แบบที่ 2');
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยกเลิก'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('2');
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeDisabled();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('1');
 await page.getByRole('button',{name:'คัดลอกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('2');
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await name.fill('แก้ไขชั่วคราว');await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'เรียกคืนชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ต้นฉบับ');
});
test('JSON export/import validates confirmation and restores employee data',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('สำนักงานส่งออก');await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'เครื่องมือจัดการห้องเพิ่มเติม'}).click();
 await page.getByRole('button',{name:'ส่งออก/นำเข้าห้อง'}).click();
 await page.getByRole('button',{name:'สร้าง JSON ส่งออก'}).click();
 const json=await page.getByRole('textbox',{name:'ข้อมูลห้อง JSON'}).inputValue();
 expect(JSON.parse(json).layout[0].name).toBe('สำนักงานส่งออก');
 await name.fill('ก่อนนำเข้า');await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await expect(page.getByRole('button',{name:'นำเข้าการจัดห้อง'})).toBeDisabled();
 await page.getByRole('checkbox',{name:/ยืนยันว่าต้องการแทนที่/}).check();
 await page.getByRole('button',{name:'นำเข้าการจัดห้อง'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('สำนักงานส่งออก');
 await page.getByRole('textbox',{name:'ข้อมูลห้อง JSON'}).fill('{invalid');
 await page.getByRole('checkbox',{name:/ยืนยันว่าต้องการแทนที่/}).check();
 await page.getByRole('button',{name:'นำเข้าการจัดห้อง'}).click();
 await expect(page.getByRole('status').filter({hasText:'ไฟล์ JSON ไม่ถูกต้อง'})).toBeVisible();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('สำนักงานส่งออก');
});
test('room stays within viewport width and staff controls remain reachable',async({page})=>{
 await openOffice(page);
 const width=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));
 expect(width.document).toBeLessThanOrEqual(width.viewport+2);
 await expect(page.getByRole('button',{name:'เครื่องมือจัดการห้องเพิ่มเติม'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'})).toBeVisible();
});

test('keyboard undo redo works outside editors without stealing text input undo',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('ทดสอบคีย์ลัด');await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.locator('.office-heading h2').click();
 await page.keyboard.press('ControlOrMeta+z');
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ผู้จัดการสำนักงาน');
 await page.keyboard.press('ControlOrMeta+Shift+z');
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ทดสอบคีย์ลัด');
 await name.focus();
 await page.keyboard.press('ControlOrMeta+z');
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ทดสอบคีย์ลัด');
});
