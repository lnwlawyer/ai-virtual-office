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

test('pending slot deletion stays bound to its original selection',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('ช่องหนึ่ง');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('2');
 await name.fill('ช่องสอง');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('1');
 await page.getByRole('button',{name:'ลบชุดนี้'}).click();
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('2');
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await page.getByRole('button',{name:'เรียกคืนชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ช่องสอง');
 await page.getByRole('combobox',{name:'เลือกช่องบันทึกห้อง'}).selectOption('1');
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeDisabled();
});

test('reset room preserves saved slots and can restore a saved room',async({page})=>{
 await openOffice(page);
 const name=page.getByRole('textbox',{name:'ชื่อพนักงาน'});
 await name.fill('ห้องก่อนคืนค่า');
 await page.getByRole('button',{name:'บันทึกชื่อ'}).click();
 await page.getByRole('button',{name:'บันทึกชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await page.getByRole('button',{name:'เครื่องมือจัดการห้องเพิ่มเติม'}).click();
 await page.getByRole('button',{name:'คืนค่าห้องทั้งหมด',exact:true}).click();
 await page.getByRole('group',{name:'ยืนยันคืนค่าห้องทั้งหมด'}).getByRole('button',{name:'ยืนยันคืนค่าห้อง'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).not.toHaveText('ห้องก่อนคืนค่า');
 await expect(page.locator('.office-station')).toHaveCount(7);
 await expect(page.getByRole('button',{name:'เรียกคืนชุดนี้'})).toBeEnabled();
 await page.getByRole('button',{name:'เรียกคืนชุดนี้'}).click();
 await page.getByRole('group',{name:'ยืนยันการจัดการช่องบันทึก'}).getByRole('button',{name:'ยืนยัน'}).click();
 await expect(page.locator('.office-station').first().locator('.office-name')).toHaveText('ห้องก่อนคืนค่า');
});

test('invalid portable backup cannot overwrite existing tasks',async({page})=>{
 await page.goto('/');
 const nav=page.getByRole('navigation',{name:'เมนูหลัก'});
 await nav.getByRole('button',{name:/Tasks & Projects|งานและโครงการ/}).click();
 await page.getByRole('textbox',{name:'Task title'}).fill('งานที่ต้องรักษา');
 await page.getByRole('button',{name:'เพิ่มงาน'}).click();
 await expect(page.getByRole('heading',{name:'งานที่ต้องรักษา'})).toBeVisible();
 await nav.getByRole('button',{name:/Settings & Security|ตั้งค่าและความปลอดภัย/}).click();
 await page.getByRole('button',{name:'เตรียมข้อมูลสำรอง'}).click();
 const backup=page.getByRole('textbox',{name:'ข้อมูลสำรอง JSON'});
 await expect(backup).not.toBeEmpty();
 await backup.fill('{"invalid":true}');
 await page.getByRole('checkbox',{name:/ฉันเข้าใจว่าการกู้คืน/}).check();
 await page.getByRole('button',{name:'กู้คืนข้อมูลในแท็บนี้'}).click();
 await expect(page.getByRole('status').filter({hasText:'Unsupported backup version'})).toBeVisible();
 await nav.getByRole('button',{name:/Tasks & Projects|งานและโครงการ/}).click();
 await expect(page.getByRole('heading',{name:'งานที่ต้องรักษา'})).toBeVisible();
});

test('portable backup roundtrip restores tasks outputs and knowledge',async({page})=>{
 await page.goto('/');
 const nav=page.getByRole('navigation',{name:'เมนูหลัก'});
 await nav.getByRole('button',{name:/Tasks & Projects|งานและโครงการ/}).click();
 await page.getByRole('textbox',{name:'Task title'}).fill('งานจากข้อมูลสำรอง');
 await page.getByRole('button',{name:'เพิ่มงาน'}).click();
 await nav.getByRole('button',{name:/Output Library|คลังผลงาน/}).click();
 await page.getByRole('textbox',{name:'ชื่อผลงาน'}).fill('ผลงานจากข้อมูลสำรอง');
 await page.getByRole('textbox',{name:'เนื้อหาผลงาน'}).fill('เนื้อหาสำหรับทดสอบการกู้คืน');
 await page.getByRole('button',{name:'บันทึกในแท็บ'}).click();
 await nav.getByRole('button',{name:/Knowledge Base|คลังความรู้/}).click();
 await page.getByRole('textbox',{name:'ชื่อเรื่องความรู้'}).fill('ความรู้จากข้อมูลสำรอง');
 await page.getByRole('textbox',{name:'เนื้อหาความรู้'}).fill('ข้อมูลความรู้สำหรับทดสอบ');
 await page.getByRole('button',{name:'เพิ่มรายการ'}).click();
 await nav.getByRole('button',{name:/Settings & Security|ตั้งค่าและความปลอดภัย/}).click();
 await page.getByRole('button',{name:'เตรียมข้อมูลสำรอง'}).click();
 const backup=page.getByRole('textbox',{name:'ข้อมูลสำรอง JSON'});
 const original=JSON.parse(await backup.inputValue());
 expect(original.tasks).toHaveLength(1);
 expect(original.outputs).toHaveLength(1);
 expect(original.knowledge).toHaveLength(1);
 await backup.fill(JSON.stringify({schemaVersion:1,tasks:[],outputs:[],knowledge:[]}));
 await page.getByRole('checkbox',{name:/ฉันเข้าใจว่าการกู้คืน/}).check();
 await page.getByRole('button',{name:'กู้คืนข้อมูลในแท็บนี้'}).click();
 await expect(page.getByRole('status').filter({hasText:'กู้คืนข้อมูลในแท็บสำเร็จ'})).toBeVisible();
 await backup.fill(JSON.stringify(original));
 await page.getByRole('checkbox',{name:/ฉันเข้าใจว่าการกู้คืน/}).check();
 await page.getByRole('button',{name:'กู้คืนข้อมูลในแท็บนี้'}).click();
 await nav.getByRole('button',{name:/Tasks & Projects|งานและโครงการ/}).click();
 await expect(page.getByRole('heading',{name:'งานจากข้อมูลสำรอง'})).toBeVisible();
 await nav.getByRole('button',{name:/Output Library|คลังผลงาน/}).click();
 await expect(page.getByRole('heading',{name:'ผลงานจากข้อมูลสำรอง'})).toBeVisible();
 await nav.getByRole('button',{name:/Knowledge Base|คลังความรู้/}).click();
 await expect(page.getByRole('heading',{name:'ความรู้จากข้อมูลสำรอง'})).toBeVisible();
});

test('selected office staff can prepare an editable local task draft without auto-creating a task',async({page})=>{
 await openOffice(page);
 await page.getByRole('button',{name:'สร้างร่างงานสำหรับพนักงานนี้'}).click();
 await expect(page.getByRole('heading',{name:/Tasks & Projects|งานและโครงการ/})).toBeVisible();
 const draft=page.getByRole('textbox',{name:'Task title'});
 await expect(draft).toHaveValue(/งานสำหรับ ผู้จัดการสำนักงาน:/);
 await expect(page.getByRole('status').filter({hasText:'0 completed / 0 tasks'})).toBeVisible();
 await draft.fill('ตรวจสอบงานสำนักงาน');
 await page.getByRole('button',{name:'เพิ่มงาน'}).click();
 await expect(page.getByRole('heading',{name:'ตรวจสอบงานสำนักงาน'})).toBeVisible();
});

test('AI command center runs local mock without a network request',async({page})=>{
 const calls=[];
 page.on('request',r=>{if(r.url().includes('/api/ai'))calls.push(r.url())});
 await page.goto('/');
 await page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:/AI Command Center|ศูนย์สั่งงาน AI|ศูนย์ควบคุม AI|ศูนย์บัญชาการ AI/}).click();
 await page.getByRole('button',{name:'ทดลองส่งคำสั่งแบบจำลอง'}).click();
 await expect(page.getByRole('alert')).toContainText('Invalid prompt');
 await page.getByPlaceholder('เขียนคำสั่งโดยไม่ส่งไปยังบริการ AI').fill('ตรวจสอบเอกสาร');
 await page.getByRole('button',{name:'ทดลองส่งคำสั่งแบบจำลอง'}).click();
 await expect(page.getByRole('status').filter({hasText:'ผลจำลอง · ไม่มีการเรียก API'})).toContainText('ตรวจสอบเอกสาร');
 expect(calls).toHaveLength(0);
});

test('simulated AI response can be saved to output library without network',async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:/ศูนย์สั่งงาน AI|AI Command Center|ศูนย์ควบคุม AI|ศูนย์บัญชาการ AI/}).click();
 await page.getByRole('textbox',{name:/ร่างคำสั่ง AI/}).fill('ทดสอบบันทึกผล');
 await page.getByRole('button',{name:'ทดลองส่งคำสั่งแบบจำลอง'}).click();
 await expect(page.getByRole('status').filter({hasText:'[ผลจำลอง]'})).toBeVisible();
 await page.getByRole('button',{name:'บันทึกผลจำลองลงคลังผลงาน'}).click();
 await expect(page.getByRole('heading',{name:'คลังผลงานภายในเบราว์เซอร์'})).toBeVisible();
 await expect(page.getByText('[ผลจำลอง] รับคำสั่งแล้ว: ทดสอบบันทึกผล')).toBeVisible();
});

test('selected office staff opens matching simulated AI agent',async({page})=>{
 await openOffice(page);
 await page.locator('.office-station').nth(1).click();
 await page.getByRole('button',{name:'ส่งคำสั่งให้พนักงานนี้ (จำลอง)'}).click();
 await expect(page.getByRole('heading',{name:/ศูนย์สั่งงาน AI|AI Command Center|ศูนย์ควบคุม AI|ศูนย์บัญชาการ AI/})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'บทบาท Mock AI'})).toHaveValue('legal');
 await page.getByRole('textbox',{name:/ร่างคำสั่ง AI/}).fill('สรุปประเด็นกฎหมาย');
 await page.getByRole('button',{name:'ทดลองส่งคำสั่งแบบจำลอง'}).click();
 await expect(page.getByRole('status').filter({hasText:'สรุปประเด็นกฎหมาย'})).toBeVisible();
});

test('office staff task draft assigns the selected agent',async({page})=>{
 await openOffice(page);
 await page.locator('.office-station').nth(1).click();
 await page.getByRole('button',{name:'สร้างร่างงานสำหรับพนักงานนี้'}).click();
 await expect(page.getByRole('heading',{name:/งานและโครงการ|Tasks & Projects|จัดการงาน/})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'พนักงานผู้รับผิดชอบ'})).toHaveValue('legal');
 await page.getByRole('textbox',{name:'Task title'}).fill('ตรวจสอบเอกสารกฎหมาย');
 await page.getByRole('button',{name:'เพิ่มงาน'}).click();
 await expect(page.getByText('ตรวจสอบเอกสารกฎหมาย')).toBeVisible();
 await expect(page.getByText('ผู้รับผิดชอบ: Legal Research')).toBeVisible();
});
