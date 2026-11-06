import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,parseProject,runProject} from '../local-bridge/project-workflow.js';
test('project validates route and goal',()=>{
 assert.equal(parseProject(createProject('กฎหมายที่ดิน')).route,'legal');
 assert.throws(()=>parseProject('PROJECT_V1:'+JSON.stringify({version:1,goal:'กฎหมายที่ดิน',route:'design'})),/Invalid project/);
});
test('approved project plans, delegates, reviews and consolidates',async()=>{
 const events=[];const calls=[];let reviewCount=0;
 const result=await runProject(createProject('จัดทำคู่มือกฎหมายที่ดิน'),{model:'mock',onProgress:async p=>events.push(p),generate:async prompt=>{
  calls.push(prompt);
  if(prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE')){reviewCount++;return 'VERDICT: PASS\nตรวจแล้ว'}
  return 'เนื้อหาทดสอบ';
 }});
 assert.equal(reviewCount,1);assert.equal(calls.length,5);
 assert.match(result,/สรุปโครงการ/);assert.match(result,/งานย่อย 2/);
 assert.ok(events.some(e=>e.role==='manager'&&e.status==='completed'));
});
test('project revision returns feedback to owners and blocks second rejection',async()=>{
 let reviews=0,calls=0;
 await assert.rejects(runProject(createProject('ออกแบบ UI'),{model:'mock',generate:async prompt=>{calls++;if(prompt.includes('VERDICT: PASS หรือ VERDICT: REVISE')){reviews++;return 'VERDICT: REVISE\nยังไม่ผ่าน'}return 'ร่าง';}}),/revision_limit/);
 assert.equal(reviews,2);assert.equal(calls,6);
});
