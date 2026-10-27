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
