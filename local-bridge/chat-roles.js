export const LOCAL_AGENT_ROLES=Object.freeze({
 manager:{label:'ผู้จัดการสำนักงาน',instruction:'คุณเป็นผู้จัดการสำนักงาน AI ช่วยจัดลำดับงานและประสานงาน ตอบภาษาไทยอย่างชัดเจน'},
 legal:{label:'ฝ่ายกฎหมาย',instruction:'คุณเป็นผู้ช่วยวิเคราะห์ข้อกฎหมาย ระบุข้อจำกัดและข้อเท็จจริงที่ต้องตรวจสอบ ไม่สร้างแหล่งอ้างอิงหรือข้อกฎหมายขึ้นเอง ตอบภาษาไทย'},
 writer:{label:'ฝ่ายเอกสาร',instruction:'คุณเป็นผู้ช่วยร่างและปรับปรุงเอกสารภาษาไทยให้กระชับ เป็นทางการและถูกต้อง'},
 designer:{label:'ฝ่ายออกแบบ',instruction:'คุณเป็นผู้ช่วยออกแบบและวางแนวคิด UX/UI อธิบายเป็นข้อความภาษาไทย ไม่อ้างว่าได้สร้างไฟล์ภาพแล้ว'},
 analyst:{label:'ฝ่ายวิเคราะห์',instruction:'คุณเป็นผู้ช่วยวิเคราะห์ข้อมูล ตรวจสอบความสอดคล้องของตัวเลข ไม่แต่งข้อมูลที่ไม่มีให้'},
 developer:{label:'ฝ่ายพัฒนา',instruction:'คุณเป็นผู้ช่วยเขียนและตรวจสอบโค้ด ให้คำแนะนำอย่างปลอดภัย ไม่อ้างว่าได้รันโค้ดหรือแก้เครื่องแล้ว'},
 reviewer:{label:'ฝ่ายตรวจสอบ',instruction:'คุณเป็นผู้ช่วยตรวจคุณภาพและความเสี่ยง ชี้ข้อบกพร่องอย่างเป็นระบบ'}
});
export function buildAgentPrompt(role,history,message){
 if(!Object.hasOwn(LOCAL_AGENT_ROLES,role))throw new Error('Invalid agent role');
 if(typeof message!=='string'||!message.trim()||message.length>4000)throw new Error('Invalid message');
 if(!Array.isArray(history)||history.length>12||history.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>1500))throw new Error('Invalid history');
 const context=history.map(m=>(m.role==='user'?'ผู้ใช้: ':'ผู้ช่วย: ')+m.content).join('\n');
 const prompt=LOCAL_AGENT_ROLES[role].instruction+'\nข้อกำหนด: เป็นการสนทนาด้วยข้อความเท่านั้น ไม่สามารถสั่งงานเครื่องหรือเข้าถึงไฟล์ได้\n'+(context?'ประวัติการสนทนา:\n'+context+'\n':'')+'ผู้ใช้: '+message+'\nผู้ช่วย:';
 if(prompt.length>8000)throw new Error('Conversation too long');
 return prompt;
}
