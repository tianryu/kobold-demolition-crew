import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { LEVELS } from '../../src/levels.mjs';
import { createStore, startContract, SAVE_KEY, PREF_KEY } from '../../src/save.mjs';
import { discoveryNotes } from '../../src/guidance.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-first-run']});
const base=process.env.BASE_URL||'http://127.0.0.1:4176/';
try{
 for(const [index,width,height,touch]of[[0,1280,720,false],[25,1280,720,false],[28,393,852,true],[39,640,360,true],[41,393,852,true],[45,1280,720,false],[49,393,852,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const data=createStore({getItem:()=>null,setItem:()=>{}}).data;
  data.claims=Object.fromEntries(LEVELS.slice(0,index===45?index+1:index).map(l=>[l.id,{cleared:true,bonus:false,best:1,credited:l.pay}]));
  const initial=startContract(data,LEVELS[index]);
  await context.addInitScript(({initial,key,pref})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(initial));localStorage.setItem(pref,JSON.stringify({motion:true,music:false,effects:false}));localStorage.setItem('kobold-crew.budget-guide.v1','seen');},{initial,key:SAVE_KEY,pref:PREF_KEY});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  const act=node=>touch?node.tap():node.click();
  try{
   await page.goto(base+'#worksite',{waitUntil:'networkidle'});await page.waitForTimeout(300);
   const l=LEVELS[index];
   assert.equal(await page.locator('.entity[data-objective=demolish] .object-mark').count(),l.goals.length);
   assert.equal(await page.locator('.entity[data-objective=preserve] .object-mark').count(),l.protect.length);
   assert.equal(await page.locator('.entity[data-objective=optional] .object-mark').count(),0);
   assert.equal(await page.locator('.object-mark b,.goal-number').count(),0,'目标不再显示编号');
   const pointers=await page.locator('.object-mark:not(.outside)').evaluateAll(nodes=>nodes.map(n=>{
     const entity=n.closest('.entity'),r=entity.getBoundingClientRect(),x=Number(n.dataset.tipX),y=Number(n.dataset.tipY),s=getComputedStyle(n);
     return {id:entity.dataset.id,inside:x>=0&&x<=r.width&&y>=0&&y<=r.height,arrow:Boolean(n.querySelector('.arrow-head').getAttribute('d')),transparent:s.backgroundColor==='rgba(0, 0, 0, 0)'};
   }));
   assert.ok(pointers.every(p=>p.inside&&p.arrow&&p.transparent),JSON.stringify(pointers));
   assert.equal(await page.locator('.guide-panel').evaluate(n=>n.classList.contains('visible')),discoveryNotes(l).length>0);
   assert.equal(await page.locator('.handle[aria-pressed=true]').count(),0,'不能预选某条解法的第一步');
   if(discoveryNotes(l).length){await act(page.getByRole('button',{name:'收起引导',exact:true}));await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.guide-panel.visible').count(),0);}
   await act(page.getByRole('button',{name:'查看本关目标',exact:true}));
   await page.getByRole('dialog',{name:'本关目标',exact:true}).waitFor();
   assert.match(await page.locator('.objective-tools').textContent(),/没有标记的物件可自行取舍/);
   const goal=l.protect.at(-1);await act(page.locator(`[data-ui=locate][data-item="${goal}"]`));
   await page.waitForTimeout(250);
   assert.equal(await page.locator('.dialog-layer:not(.departing)').count(),0);
   const target=page.locator(`[data-id="${goal}"]`);assert.equal(await target.evaluate(n=>n.classList.contains('located')),true);
   const box=await target.boundingBox();assert.ok(box.x+box.width>0&&box.x<width,'定位目标进入当前视口');
   assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY),initial,'看目标和定位不改施工档');
   await page.waitForTimeout(400);
   await page.screenshot({path:fileURLToPath(new URL(`../../docs/qa/1.4.0-目标规则-${index+1}-${width}.png`,import.meta.url))});
   assert.deepEqual(errors,[]);console.log(JSON.stringify({stage:index+1,width,height,newNotes:discoveryNotes(l).map(n=>n.key),markedGoals:l.goals.length,markedProtected:l.protect.length,locateReadOnly:true,errors}));
  }finally{await context.close()}
 }
}finally{await browser.close()}
