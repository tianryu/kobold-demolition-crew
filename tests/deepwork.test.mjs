import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS, initialBoard } from '../src/levels.mjs';
import { resolveMove, isFrame } from '../src/rules.mjs';
import { solve } from '../tools/analyze-levels.mjs';
import { decodeProgress, createStore, startContract, nextContract, wallet } from '../src/save.mjs';
import { discoveryNotes, guideStep, jobObjectives } from '../src/guidance.mjs';
const proofs=JSON.parse(readFileSync(new URL('./fixtures/curated-proofs.json',import.meta.url)));
const run=(l,route)=>{let board=initialBoard(l),events=[];for(const a of route){let r=resolveMove(l,board,a,true);assert.ok(!r.error);board=r.board;events.push(...r.events)}return{board,events}};
const level=n=>LEVELS[n-1],cut=id=>({kind:'cut',id}),brace=id=>({kind:'brace',id});

test('后25张地图保留五组机制，每处高层载荷有实际承托，允许共用支座',()=>{
 assert.equal(LEVELS.slice(25).length,25);assert.deepEqual([...new Set(LEVELS.slice(25).map(l=>l.chapter))],[6,7,8,9,10]);
 for(const l of LEVELS.slice(25)){
  assert.ok(l.steps<=proofs[l.id].shortest+2);assert.ok(l.goals.every(id=>!l.protect.includes(id)));
  for(const o of l.objects.filter(o=>o.row))assert.ok(l.objects.some(f=>isFrame(f)&&(f.row||0)+1===o.row&&Math.abs(f.x-o.x)<=f.span/2+.00001),l.id+o.id);
 }
 for(const kind of ['minepier','anvil','ramp','drain','timber'])assert.ok(LEVELS.slice(25).some(l=>l.objects.some(o=>o.kind===kind)));
});
test('叠柱把载荷送入下层；拆上柱会在不同楼层消耗载荷',()=>{
 const l={id:'stacked',steps:3,objects:[{id:'base',kind:'minepier',x:2,span:4},{id:'upper',kind:'minepier',x:2,row:1,span:2},{id:'load',kind:'cargo',x:2,row:2},{id:'door',kind:'iron',x:2,armor:2}],goals:['door'],protect:[]};
 const r=run(l,[cut('base')]);assert.equal(r.board.reason.type,'success');assert.ok(r.events.some(e=>e.kind==='drop'&&e.from===2&&e.row===0));
 const wrong=run(l,[cut('upper')]);assert.equal(solve(l,{board:wrong.board}),null);
});
test('重锤坠落造成两次独立撞击，砸向保护箱时一副撑木不够',()=>{
 const l={id:'hammer',steps:3,objects:[{id:'pier',kind:'minepier',x:1,span:4},{id:'weight',kind:'anvil',x:2,row:1},{id:'door',kind:'iron',x:2,armor:3}],goals:['door'],protect:[]};
 const r=run(l,[cut('pier')]);assert.equal(r.events.filter(e=>e.id==='door'&&e.kind==='dent').length,2);
 const protectedLevel={...l,objects:[...l.objects.slice(0,2),{id:'cargo',kind:'cargo',x:2,braceSlot:true}],goals:['pier'],protect:['cargo']};
 const bad=run(protectedLevel,[brace('cargo'),cut('pier')]);assert.equal(bad.board.reason.type,'protect');
});
test('两块跳板跨两层接力；挡墙没拆时滚石会消耗在墙上',()=>{
 const l=level(40),r=run(l,proofs[l.id].route);assert.deepEqual(r.events.filter(e=>e.kind==='launch').map(e=>e.toRow),[1,2,2]);
 const bad=run(level(37),[brace('west-cargo'),{kind:'dig',id:'west',side:'right'}]);assert.ok(bad.events.some(e=>e.kind==='roll'&&e.target==='west-wall-work'));assert.equal(solve(level(37),{board:bad.board}),null);
});
test('水从两根管道向下传递，刷新保留出水层、范围和湿火药',()=>{
 const l=level(42),route=proofs[l.id].route,r=run(l,route.slice(0,route.findIndex(a=>a.id==='water-work')+1));assert.deepEqual(r.events.filter(e=>e.kind==='drain').map(e=>e.row),[2,1]);assert.equal(r.board.objects.load.wet,true);
 const p=createStore({getItem:()=>null,setItem:()=>{}}).data;p.claims=Object.fromEntries(LEVELS.slice(0,41).map(o=>[o.id,{cleared:true,bonus:false,best:proofs[o.id].shortest,credited:o.pay}]));
 const s=startContract(p,l);s.active.board=r.board;assert.deepEqual(decodeProgress(JSON.stringify(s)),s);
});
test('朽木浸水后坍塌，湿火药不会补足重门所缺的撞击',()=>{
 const l=level(47),bad=run(l,[{kind:'dig',id:'water-work',side:'left'}]);assert.ok(bad.events.some(e=>e.kind==='rot'));assert.equal(solve(l,{board:bad.board}),null);
 const withoutBackup=proofs[l.id].route.filter(a=>!(a.kind==='brace'&&a.id==='cargo-backup'));
 const lost=run(l,withoutBackup.slice(0,withoutBackup.findIndex(a=>a.id==='fire-work')+1));assert.equal(lost.board.reason.type,'protect');
 const win=run(level(50),proofs[level(50).id].route);assert.equal(win.board.reason.type,'success');assert.ok(win.events.some(e=>e.kind==='drain'));assert.ok(win.events.some(e=>e.kind==='rot'));
});
test('原25关进度原样接续第26关，金额和最佳记录不重置',()=>{
 const p=createStore({getItem:()=>null,setItem:()=>{}}).data;p.claims=Object.fromEntries(LEVELS.slice(0,25).map(l=>[l.id,{cleared:true,bonus:false,best:proofs[l.id].shortest,credited:l.pay}]));
 const decoded=decodeProgress(JSON.stringify(p));assert.deepEqual(decoded,p);assert.equal(wallet(decoded),8735);assert.equal(nextContract(decoded).id,'deepwork-26');
});
test('自动提示只在新物件首次出现时给出能力介绍，选择和预览不会产生解法文本',()=>{
 const seen=new Set();let total=0;
 for(const l of LEVELS){
  const notes=discoveryNotes(l);for(const n of notes){assert.ok(!seen.has(n.key),n.key);seen.add(n.key);total++;}
  assert.deepEqual(guideStep(l,initialBoard(l),'dig',null,null),notes[0]||null);
  assert.deepEqual(guideStep(l,initialBoard(l),'brace',brace('cargo'),{board:{reason:{type:'protect'}}}),notes[0]||null);
  assert.ok(!l.tip);assert.ok(!/先.*再|先.*后/.test(l.brief));
  const goals=jobObjectives(l);for(const g of goals){assert.ok(!Object.hasOwn(g,'number'));assert.ok(['拆除','保全'].some(v=>g.label.startsWith(v)));}
 }
 assert.ok(total>15);assert.equal(discoveryNotes(level(29)).length,0);
});

test('有其他承托时载荷留在原层，全部承托失去后才坠落',()=>{
 const l={id:'shared-support',advanced:true,steps:3,objects:[{id:'a',kind:'minepier',x:1,span:4},{id:'b',kind:'minepier',x:3,span:4},{id:'cargo',kind:'cargo',x:2,row:1}],goals:['a','b'],protect:['cargo']};
 let r=run(l,[cut('a')]);assert.equal(r.board.objects.cargo.gone,false);assert.ok(!r.events.some(e=>e.kind==='drop'));
 const last=resolveMove(l,r.board,cut('b'),true);assert.equal(last.board.reason.type,'protect');assert.equal(last.board.objects.cargo.row,0);
});
test('拆掉拦水墙后已有水流重新延伸，不把流动限制做成隐藏拆序锁',()=>{
 const l={id:'reflow',advanced:true,steps:3,objects:[{id:'a',kind:'minepier',x:.5,span:2.4},{id:'water',kind:'watertower',x:1.5,row:1},{id:'b',kind:'minepier',x:4.8,span:3},{id:'weight',kind:'anvil',x:3.4,row:1},{id:'wall',kind:'bulwark',x:3.4,armor:2},{id:'powder',kind:'barrel',x:4.2}],goals:['wall'],protect:[]};
 const r=run(l,[cut('a'),cut('b')]);assert.ok(r.events.some(e=>e.kind==='flood'&&e.refresh));assert.equal(r.board.objects.powder.wet,true);assert.equal(r.board.objects.water.water.right,4.5);
});
