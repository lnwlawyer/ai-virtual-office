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

test('restricted browser storage still renders office and reports failed saves',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Storage access blocked','SecurityError')}});
 });
 await openOffice(page);
 await expect(page.locator('.office-station')).toHaveCount(7);
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeDisabled();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-save-status')).toContainText('เบราว์เซอร์ไม่อนุญาต');
 await page.getByRole('button',{name:'เครื่องมือจัดการห้องเพิ่มเติม'}).click();
 await page.getByRole('button',{name:'บันทึกการจัดห้อง',exact:true}).click();
 await expect(page.locator('.office-save-status')).toContainText('เบราว์เซอร์ไม่อนุญาต');
});

test('reduced motion preference disables 2D office character animation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await openOffice(page);
 await expect(page.locator('.office-station')).toHaveCount(7);
 const animations=await page.locator('.office-room').evaluate(room=>[...room.querySelectorAll('*')].flatMap(el=>el.getAnimations()).filter(a=>a.effect?.getComputedTiming().iterations===Infinity).length);
 expect(animations).toBe(0);
});

test('history shortcuts do not intercept browser keys without office changes',async({page})=>{
 await openOffice(page);
 await expect(page.getByRole('button',{name:/ย้อนกลับ/}).first()).toBeDisabled();
 await expect(page.getByRole('button',{name:/ทำซ้ำ/}).first()).toBeDisabled();
 await page.locator('.office-heading h2').click();
 const result=await page.evaluate(()=>{
  const undo=new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true});
  const redo=new KeyboardEvent('keydown',{key:'z',ctrlKey:true,shiftKey:true,bubbles:true,cancelable:true});
  window.dispatchEvent(undo);window.dispatchEvent(redo);
  return {undoPrevented:undo.defaultPrevented,redoPrevented:redo.defaultPrevented};
 });
 expect(result).toEqual({undoPrevented:false,redoPrevented:false});
});

test('saved room survives reload but never automatically overwrites the default layout',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('บันทึกข้ามรีเฟรช');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await page.reload();
 await page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:/สำนักงานเสมือน|Virtual Office/}).click();
 await expect(page.locator('.office-station')).toHaveCount(7);
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ผู้จัดการสำนักงาน');
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await page.getByRole('button',{name:'เรียกคืนชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('บันทึกข้ามรีเฟรช');
});

test('office save slots are isolated between independent browser contexts',async({page,browser})=>{
 await openOffice(page);
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 const separateContext=await browser.newContext();
 try{
  const otherPage=await separateContext.newPage();
  await openOffice(otherPage);
  await expect(otherPage.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeDisabled();
  await expect(otherPage.locator('.office-station')).toHaveCount(7);
 }finally{await separateContext.close();}
});

test('tampered room JSON cannot replace current staff or settings',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('ข้อมูลเดิมที่ต้องรักษา');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'เครื่องมือจัดการห้องเพิ่มเติม'}).click();
 await page.getByRole('button',{name:'ส่งออก/นำเข้าห้อง'}).click();
 await page.getByRole('button',{name:'สร้าง JSON ส่งออก'}).click();
 const field=page.getByRole('textbox',{name:'ข้อมูลห้อง JSON'});
 const original=JSON.parse(await field.inputValue());
 original.layout[0].name='ชื่อที่ไม่ควรนำเข้า';
 original.layout[1].id=original.layout[0].id;
 await field.fill(JSON.stringify(original));
 await page.getByRole('checkbox',{name:/ยืนยันว่าต้องการแทนที่/}).check();
 await page.getByRole('button',{name:'นำเข้าการจัดห้อง'}).click();
 await expect(page.getByRole('status').filter({hasText:'ข้อมูลพนักงานไม่ถูกต้อง'})).toBeVisible();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ข้อมูลเดิมที่ต้องรักษา');
 await expect(page.locator('.office-station')).toHaveCount(7);
});

test('deleting one saved room slot preserves another slot and requires confirmation',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('ชุดหนึ่ง');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('2');
 await name.fill('ชุดสอง');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('1');
 await page.getByRole('button',{name:'ลบชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยกเลิก'}).click();
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await page.getByRole('button',{name:'ลบชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeDisabled();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('2');
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await page.getByRole('button',{name:'เรียกคืนชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ชุดสอง');
});
