import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('comparison',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [name,port] of [['before-main',4174],['after-pr34',4173]]){
  const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1,reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:'+port+'/ai-virtual-office/',{waitUntil:'networkidle',timeout:45000});
  await page.locator('nav button').nth(2).click();
  await page.locator('.office-room').waitFor({state:'visible'});
  await page.locator('.office-room').screenshot({path:'comparison/'+name+'.png',animations:'disabled'});
  await page.close();
 }
}finally{await browser.close();}
