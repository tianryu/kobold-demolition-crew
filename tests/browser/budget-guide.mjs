import assert from 'node:assert/strict';
import {LEVELS,initialBoard} from '../../src/levels.mjs';
import {createStore,startContract,SAVE_KEY,PREF_KEY} from '../../src/save.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false});
const base=process.env.BASE_URL||'http://127.0.0.1:4176/';
try{
 for(const [width,height,touch]of [[1280,720,false],[393,852,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const l=LEVELS[16];let initial=createStore({getItem:()=>null,setItem:()=>{}}).data;
  initial.claims=Object.fromEntries(LEVELS.slice(0,16).map(o=>[o.id,{cleared:true,bonus:false,best:1,credited:o.pay}]));
  initial=startContract(initial,l);
  await context.addInitScript(({initial,key,pref,id})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(initial));
   localStorage.setItem(pref,JSON.stringify({motion:false,music:false,effects:false}));
   localStorage.setItem('kobold-crew.hidden-guides.v2',JSON.stringify([id]));
  },{initial,key:SAVE_KEY,pref:PREF_KEY,id:l.id});
  const page=await context.newPage(),act=node=>touch?node.tap():node.click();
  const site=page.locator('.worksite:not(.departing)');
  try{
   await page.goto(base+'#worksite',{waitUntil:'networkidle'});
   assert.match(await site.locator('.guide-panel.visible').textContent(),/工步规则.*各消耗1工步/s);
   assert.match(await site.locator('.turns').textContent(),/剩余工步4/);
   await act(site.locator('[data-control=hide-guide]'));
   assert.equal(await page.evaluate(()=>localStorage.getItem('kobold-crew.budget-guide.v1')),'seen');
   await act(site.locator('[data-control=brace]'));
   await act(site.locator('[data-move=brace][data-item=cargo]'));
   assert.equal(await site.locator('.action-cost.visible').count(),1);
   assert.match(await site.locator('.action-cost').textContent(),/−1/);
   assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY),initial,'选点和预览不耗工步');
   await act(site.locator('.action-main'));
   await page.waitForFunction(()=>!document.querySelector('.worksite:not(.departing)').classList.contains('working'));
   assert.equal(await site.locator('.turns b').textContent(),'3');
   await page.reload({waitUntil:'networkidle'});assert.equal(await site.locator('.guide-panel.visible').count(),0);
   await act(site.locator('[data-control=objectives]'));
   await act(page.getByRole('button',{name:'重看引导',exact:true}));
   assert.match(await site.locator('.guide-panel.visible').textContent(),/工步规则/);
   // 独立测试档只剩一工步，检查预览、真实归零和失败说明，避免改动玩家档。
   const last=structuredClone(initial);last.active.board=initialBoard(l);last.active.board.turns=1;
   await page.evaluate(({last,key})=>localStorage.setItem(key,JSON.stringify(last)),{last,key:SAVE_KEY});
   await page.reload({waitUntil:'networkidle'});
   await act(site.locator('[data-control=objectives]'));
   await act(page.locator('[data-ui=locate][data-item=bell]'));
   await act(site.locator('[data-move=dig][data-item=bell][data-side=right]'));
   assert.equal(await site.locator('.action-cost.last-step.visible').count(),1);
   await act(site.locator('.action-main'));
   await page.getByRole('dialog',{name:'委托失败',exact:true}).waitFor();
   assert.equal(await page.locator('.receipt-reason').textContent(),'工步用尽');
   assert.equal(await site.locator('.failure-target').count(),0,'预算失败不把未完成目标伪装成保护损坏');
   console.log(JSON.stringify({width,height,returningTutorial:true,previewFree:true,costVisible:true,lastStepFailureClear:true}));
  }finally{await context.close()}
 }
}finally{await browser.close()}
