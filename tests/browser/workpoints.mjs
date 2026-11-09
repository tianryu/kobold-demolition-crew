import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false});
try{
 for(const [width,height]of [[1280,720],[393,852],[640,360]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
   const {Worksite}=await import('./src/view.mjs'),{LEVELS,initialBoard}=await import('./src/levels.mjs');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:50';document.body.append(host);
   const blocked=[],visited=new Set();let workpoints=0;
   for(const [index,level]of LEVELS.entries())if(index>=19){
    const site=new Worksite(level,initialBoard(level),()=>{},()=>{},()=>true);host.append(site.root);site.paint(initialBoard(level),true);
    for(let camera=site.cameraMin;camera<=site.cameraMax+site.cameraHalf;camera+=Math.max(1,site.cameraHalf)){
     site.setCamera(camera);
     for(const tool of ['dig','brace']){
      site.tool=tool;site.updateControls(true);
      for(const {handle,action}of site.handles){
       if(handle.disabled)continue;
       const key=[level.id,action.kind,action.id,action.side].join(':');if(visited.has(key))continue;visited.add(key);
       const r=handle.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
       const hit=document.elementFromPoint(x,y)?.closest('button');workpoints++;
       if(!handle.contains(hit)&&hit!==handle)blocked.push({stage:index+1,key,at:[x,y],hit:hit?.dataset});
      }
     }
    }
    site.destroy();site.root.remove();
   }
   host.remove();return{workpoints,blocked};
  });
  assert.deepEqual(result.blocked,[]);console.log(JSON.stringify({width,height,workpoints:result.workpoints,blocked:[]}));await page.close();
 }
}finally{await browser.close()}
