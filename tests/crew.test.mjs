import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { LEVELS, LOOKUP, initialBoard } from '../src/levels.mjs';
import { LEGACY_CATALOG } from '../src/legacy-catalog.mjs';
import { isFrame, resolveMove } from '../src/rules.mjs';
import { audit, solve, interactionComponents } from '../tools/analyze-levels.mjs';
import { createStore, decodeProgress, startContract, finishMove, wallet, nextContract, SAVE_KEY } from '../src/save.mjs';
const proofs=JSON.parse(readFileSync(new URL('./fixtures/curated-proofs.json',import.meta.url)));
function disk(){const data=new Map();return{data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
function play(level,route,board=initialBoard(level)){
 const events=[];for(const action of route){const result=resolveMove(level,board,action,true);assert.equal(result.error,undefined,JSON.stringify(action));board=result.board;events.push(...result.events)}return{board,events};
}
const dig=(id,side)=>({kind:'dig',id,side});
const brace=id=>({kind:'brace',id});

test('50关，每张地图都是一个物理影响连通工地，承台按坐标承托上层',()=>{
 assert.equal(LEVELS.length,50);assert.equal(new Set(LEVELS.map(l=>l.id)).size,50);
 for(const l of LEVELS){
  assert.equal(interactionComponents(l).length,1,l.id);
  assert.ok(!l.objects.some(o=>/^s\d-/.test(o.id)),l.id+' 不再拼接独立模板');
  assert.ok(!l.plugs?.some(p=>p.requiresClear));
  for(const o of l.objects)if(o.row)assert.ok(l.objects.some(d=>isFrame(d)&&(d.row||0)+1===o.row&&Math.abs(d.x-o.x)<=d.span/2+.00001),l.id+' '+o.id);
 }
});
test('50关的最短解可执行，至少46关存在无法通过重排撑木补救的拆序反例',()=>{
 let constrained=0;
 for(const l of LEVELS){
  const proof=audit(l);assert.equal(proof.shortest,proofs[l.id].shortest,l.id);
  assert.equal(play(l,proof.route).board.reason.type,'success');
  if(proof.rejectedOrder){constrained++;assert.equal(solve(l,{digOrder:proof.rejectedOrder}),null,l.id);}
 }
 assert.ok(constrained>=46);
});
test('连续通关与刷新、重复领取均幂等，账本为50/50',()=>{
 const store=createStore(disk());
 for(const l of LEVELS){
  assert.equal(nextContract(store.data).id,l.id);store.save(startContract(store.data,l));
  for(const action of proofs[l.id].route){const r=resolveMove(l,store.data.active.board,action,true);store.save(finishMove(store.data,l,r.board));assert.deepEqual(decodeProgress(JSON.stringify(store.data)),store.data);}
  assert.equal(store.data.active.board.reason.type,'success');
 }
 const amount=LEVELS.reduce((sum,l)=>sum+l.pay,0);assert.equal(wallet(store.data),amount);assert.equal(Object.keys(store.data.claims).length,50);assert.equal(nextContract(store.data),null);
 const last=LEVELS.at(-1);store.save(startContract(store.data,last));store.save(finishMove(store.data,last,play(last,proofs[last.id].route).board));assert.deepEqual(store.data.active.receipt,{base:0,bonus:0});assert.equal(wallet(store.data),amount);
});
test('旧50关的金额与交工记录归档，移除中的第17关不会损坏整个存档',()=>{
 const old={version:1,revision:7,claims:Object.fromEntries(LEGACY_CATALOG.map(l=>[l.id,{cleared:true,bonus:Boolean(l.bonus),best:l.steps}])),active:{id:'deep-three-plus-two',board:{turns:3},receipt:null}};
 const raw=JSON.stringify(old),device=disk();device.setItem(SAVE_KEY,raw);const store=createStore(device);
 assert.equal(store.data.version,2);assert.equal(store.data.active,null);assert.equal(store.data.history.length,50);assert.equal(wallet(store.data),34170);
 assert.equal(Object.keys(store.data.claims).length,3,'仅原样保留的3张工单继续视为已交');
 assert.equal(nextContract(store.data).id,'structural-29');assert.equal(device.getItem(SAVE_KEY),raw,'迁移读取不覆盖原存档');assert.equal(device.getItem(SAVE_KEY+'.before-curation'),raw);
 store.save(startContract(store.data,nextContract(store.data)));assert.equal(JSON.parse(device.getItem(SAVE_KEY)).version,2);assert.equal(wallet(createStore(device).data),34170);
});
test('原样保留的货场可接续施工；之后重玩已归档关卡不会重复发款',()=>{
 const l=LEVELS[0],one=resolveMove(l,initialBoard(l),brace('cargo'),true).board;
 const old={version:1,revision:1,claims:{},active:{id:l.id,board:one,receipt:null}};
 const p=decodeProgress(JSON.stringify(old));assert.deepEqual(p.active.board,one);assert.equal(p.active.layoutRevision,l.revision);
 const paid=finishMove(p,l,resolveMove(l,one,dig('tower','right'),true).board);assert.equal(wallet(paid),35);
 const cleared=decodeProgress(JSON.stringify({version:1,revision:2,claims:{[l.id]:{cleared:true,bonus:false,best:2}},active:null}));
 const replay=startContract(cleared,l);const done=finishMove(replay,l,play(l,proofs[l.id].route).board);assert.equal(wallet(done),35);assert.equal(done.active.receipt.base,0);
});
test('先推石与先炸工坊的结果不同，提前爆炸会消耗尚未使用的发射源',()=>{
 const l=LOOKUP['structural-34'];const first=play(l,[brace('cargo'),dig('bell','left')]);
 assert.ok(first.events.some(e=>e.kind==='roll'&&e.id==='rock'&&e.side==='left'));
 assert.equal(first.board.objects.start.gone,true);assert.equal(first.board.objects.door.gone,false);
 assert.equal(solve(l,{board:first.board}),null);assert.equal(play(l,proofs[l.id].route).board.reason.type,'success');
});
test('同一座石拱：先左后右会把直接撞击和落火挤在一轮，反序可分开补撑',()=>{
 const l=LOOKUP['structural-30'];const bad=play(l,[dig('start','right'),brace('cargo'),dig('bell','left')]);
 assert.equal(bad.board.reason.type,'protect');assert.deepEqual(bad.events.filter(e=>e.id==='cargo').map(e=>e.kind),['brace','shield','break']);
 assert.equal(play(l,proofs[l.id].route).board.reason.type,'success');
});
test('过早放水会消耗之后需要的干火药，仍允许玩家继续施工',()=>{
 for(const n of [23,41,42,46,50]){
  const l=LEVELS[n-1],b=resolveMove(l,initialBoard(l),dig('water-work','left'),true);
  assert.ok(!b.error);assert.ok(b.events.some(e=>e.kind==='flood'));assert.equal(solve(l,{board:b.board}),null,l.id);
  assert.equal(b.board.reason,null,'不因预测无解而提前判负');
 }
});
test('多层物件先坠落再触发滚石，空中的建筑不会被地面倒塔隔空击中',()=>{
 const l=LEVELS[28];const result=play(l,proofs[l.id].route);assert.ok(result.events.some(e=>e.kind==='drop'&&e.from===2));assert.ok(result.events.some(e=>e.kind==='roll'));assert.equal(result.board.objects.arch.gone,true);assert.equal(result.board.objects.cargo.gone,false);
 const tiny={id:'height',advanced:true,steps:2,objects:[{id:'t',x:1,kind:'tower',feet:{left:true,right:true}},{id:'v',x:2,kind:'vault',row:1},{id:'g',x:2,kind:'gate'}],goals:['g'],protect:['v']};assert.equal(play(tiny,[dig('t','right')]).board.objects.v.gone,false);
});
test('只读预览与执行共用规则，存储写入失败和多窗口覆盖均保持原快照',()=>{
 const l=LEVELS[0],board=initialBoard(l);resolveMove(l,board,dig('tower','right'),true);assert.deepEqual(board,initialBoard(l));
 const device=disk(),a=createStore(device),b=createStore(device);const active=startContract(a.data,l);a.save(active);assert.throws(()=>b.save(active),/另一窗口/);
 const before=a.data;device.setItem=()=>{throw Error('quota')};assert.throws(()=>a.save(active),/quota/);assert.deepEqual(a.data,before);
});

test('第15关容许补架后拆最后一塔，旧预算失败现场能接续且只补一次',()=>{
 const l=LEVELS[14],old={...l,steps:4,revision:2};
 const sequence=[dig('middle','left'),brace('cargo'),dig('start','right'),brace('cargo')];
 const failed=play(old,sequence).board;
 assert.equal(failed.reason.type,'route');assert.equal(failed.turns,0);
 assert.equal(failed.objects.cargo.braced,true);assert.equal(failed.objects.finish.gone,false);assert.equal(failed.objects.door.damage,1);
 const fresh=play(l,sequence).board;assert.equal(fresh.reason,null);assert.equal(fresh.turns,1);
 const after=play(l,[dig('finish','left')],fresh);assert.equal(after.board.reason.type,'success');
 assert.equal(after.board.objects.cargo.gone,false);assert.equal(after.board.objects.safe.gone,false);
 const data=createStore(disk()).data;
 data.claims=Object.fromEntries(LEVELS.slice(0,14).map(level=>[level.id,{cleared:true,bonus:false,best:proofs[level.id].shortest,credited:level.pay}]));
 data.active={id:l.id,layoutRevision:2,board:failed,receipt:null};
 const upgraded=decodeProgress(JSON.stringify(data));assert.deepEqual(upgraded.active.board,fresh);assert.equal(upgraded.active.layoutRevision,3);
 assert.deepEqual(decodeProgress(JSON.stringify(upgraded)),upgraded,'刷新不能重复增加工步');
 const completed=finishMove(upgraded,l,after.board);assert.equal(wallet(completed)-wallet(upgraded),l.pay);
 assert.equal(decodeProgress(JSON.stringify(completed)).active.board.reason.type,'success');
 const broken=play(old,[dig('middle','right')]).board;assert.equal(broken.reason.type,'protect');
 data.active.board=broken;assert.equal(decodeProgress(JSON.stringify(data)).active.board.reason.type,'protect','预算修正不能复活被砸坏的货箱');
});
