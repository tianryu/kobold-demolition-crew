import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LEVELS,initialBoard} from '../src/levels.mjs';
import {resolveMove,legalMoves} from '../src/rules.mjs';
import {solve,solveSteps} from '../tools/analyze-levels.mjs';
import {CURATED_LEVELS} from '../src/curated-levels.mjs';
import {createStore,startContract,decodeProgress,wallet} from '../src/save.mjs';
const proofs=JSON.parse(readFileSync(new URL('./fixtures/curated-proofs.json',import.meta.url)));
const dig=(id,side)=>({kind:'dig',id,side});

test('小数坐标的梁端仍有承托，铲断后沿实际位置坠落',()=>{
 const l={id:'decimal-edge',steps:2,objects:[{id:'pier',kind:'minepier',x:7.7,span:2.8},{id:'load',kind:'cargo',x:6.3,row:1},{id:'door',kind:'iron',x:6.3,armor:1}],goals:['door'],protect:[]};
 const r=resolveMove(l,initialBoard(l),{kind:'cut',id:'pier'},true);
 assert.ok(r.events.some(e=>e.kind==='drop'&&e.id==='load'));assert.equal(r.board.reason.type,'success');
});

test('20–50关均包含至少四次关键拆除及不可任意交换的拆序，预算保留准备余量',()=>{
 for(const [i,l] of LEVELS.entries())if(i>=19){
  const p=proofs[l.id];assert.ok(p.shortest>=6,l.title);assert.ok(p.destructiveActions>=4,l.title);
  assert.ok(p.rejectedOrder,l.title);assert.ok(l.steps>=p.shortest+2,l.title);
  assert.ok(l.objects.every(o=>!o.feet||Object.values(o.feet).every(Boolean)),'不使用单侧操作锁');
  assert.deepEqual(l.plugs,[],'不使用建筑编号前置锁');
 }
 assert.ok(proofs[LEVELS[49].id].shortest>=12);
});

test('错误滚道顺序会消耗冲击来源，但剩余工步内不提前判负',()=>{
 const l=LEVELS[19];let b=resolveMove(l,initialBoard(l),{kind:'brace',id:'west-cargo'},true).board;
 const r=resolveMove(l,b,dig('west','right'),true);
 assert.ok(r.events.some(e=>e.kind==='roll'&&e.target==='west-inner'));
 assert.equal(r.board.reason,null);assert.ok(r.board.turns>0);assert.equal(solve(l,{board:r.board}),null);
 assert.ok(legalMoves(l,r.board,true).length>0);
});

test('多层水路需要在施工冲击后仍能通水，破管不会被当作隐藏的失败条件',()=>{
 for(const n of [42,45,48,50]){
  const l=LEVELS[n-1],route=proofs[l.id].route;
  assert.ok(route.some(a=>a.kind==='brace'&&a.id==='pipe'),l.title);
  let board=initialBoard(l),broken=false;
  for(const action of route){
   if(action.kind==='brace'&&action.id==='pipe')continue;
   const r=resolveMove(l,board,action,true);assert.ok(!r.error);board=r.board;
   if(action.id==='fire-work'){broken=board.objects.pipe.gone;break;}
  }
  assert.equal(broken,true);assert.equal(board.reason,null);assert.equal(solve(l,{board}),null);
 }
});

test('只按真实的保护损坏或预算归零结算，最后一工步成功优先于预算失败',()=>{
 const tiny={id:'spent',steps:3,objects:[{id:'tower',kind:'tower',x:1,feet:{left:true,right:true}},{id:'door',kind:'iron',x:2,armor:2}],goals:['door'],protect:[]};
 const noMoves=resolveMove(tiny,initialBoard(tiny),dig('tower','right'),true).board;
 assert.equal(noMoves.reason,null);assert.equal(noMoves.turns,2);assert.equal(legalMoves(tiny,noMoves,true).length,0);
 const empty={...tiny,steps:1};const spent=resolveMove(empty,initialBoard(empty),dig('tower','right'),true).board;
 assert.equal(spent.reason.type,'route');assert.equal(spent.turns,0);
 const l={...LEVELS[0],steps:2};let b=resolveMove(l,initialBoard(l),{kind:'brace',id:'cargo'},true).board;
 b=resolveMove(l,b,dig('tower','right'),true).board;assert.equal(b.turns,0);assert.equal(b.reason.type,'success');
 const last={...l,steps:1};assert.equal(resolveMove(last,initialBoard(last),dig('tower','right'),true).board.reason.type,'protect');
});

test('准备动作最短路与逐工步穷举一致，解法长度包含撑木费用',()=>{
 for(const n of [1,4,20,21,31]){
  const l=LEVELS[n-1];assert.equal(solve(l).length,solveSteps(l).length,l.title);
 }
});

test('改版只重开当前工地，保留已交记录、当前关及收入，不重复发奖',()=>{
 const device=new Map(),storage={getItem:k=>device.get(k)??null,setItem:(k,v)=>device.set(k,v)};
 const l=LEVELS[19],old=CURATED_LEVELS[19];let p=createStore(storage).data;
 p.claims=Object.fromEntries(LEVELS.slice(0,20).map(level=>[level.id,{cleared:true,bonus:false,best:1,credited:level.pay}]));
 p.active={id:l.id,layoutRevision:old.revision,board:initialBoard(old),receipt:null};
 const next=decodeProgress(JSON.stringify(p));assert.equal(next.active.id,l.id);assert.deepEqual(next.active.board,initialBoard(l));
 assert.deepEqual(next.claims,p.claims);assert.equal(wallet(next),wallet(p));assert.deepEqual(decodeProgress(JSON.stringify(next)),next);
 const active=startContract(next,l);active.active.board.reason={type:'route',id:l.goals[0]};active.active.board.turns=3;
 assert.equal(decodeProgress(JSON.stringify(active)).active.board.reason,null,'清除旧版提前判负');
 active.active.board.turns=0;assert.equal(decodeProgress(JSON.stringify(active)).active.board.reason.type,'route','保留真正的预算失败');
});
