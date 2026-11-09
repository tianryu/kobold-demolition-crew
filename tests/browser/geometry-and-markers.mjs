import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-first-run']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto(process.env.BASE_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const{Worksite}=await import('./src/view.mjs');const{LEVELS,initialBoard}=await import('./src/levels.mjs');
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:50';document.body.append(host);
  let compared=0;const mismatches=[];let markers=0;
  for(const level of LEVELS){
   const site=new Worksite(level,initialBoard(level),()=>{},()=>{},()=>true);host.append(site.root);site.paint(initialBoard(level),true);
   const before=[...site.items.values()].map(n=>{const r=n.getBoundingClientRect();return[r.x,r.y,r.width,r.height]});
   const old=document.createElement('style');old.textContent='.entity{transform:translate(-50%,-100%)!important;margin-left:0!important;margin-top:calc(var(--u)*var(--lift))!important}';document.head.append(old);
   const after=[...site.items.values()].map(n=>{const r=n.getBoundingClientRect();return[r.x,r.y,r.width,r.height]});old.remove();
   if(before.some((a,i)=>a.some((v,j)=>Math.abs(v-after[i][j])>.05)))mismatches.push(level.id);compared++;
   // 将美术与徽章都纳入命中检测，验证徽章中心不会被前景图片盖住。
   site.root.querySelectorAll('.handle').forEach(n=>n.style.pointerEvents='none');
   site.root.querySelectorAll('.intact,.object-mark').forEach(n=>n.style.pointerEvents='auto');
   for(const item of level.objects){
    const badge=site.items.get(item.id).querySelector('.object-mark');if(!badge||!site.cameraContains(item.x))continue;
    const r=badge.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(x<0||x>innerWidth||y<0||y>innerHeight)continue;
    if(!badge.contains(document.elementFromPoint(x,y)))mismatches.push(level.id+':marker:'+item.id);markers++;
   }
   site.destroy();site.root.remove();
  }
  host.remove();return{compared,markers,mismatches};
 });
 assert.deepEqual(result.mismatches,[]);console.log(JSON.stringify(result));
}finally{await browser.close()}
