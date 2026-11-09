import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LEVELS, initialBoard } from '../src/levels.mjs';
import { legalMoves, resolveMove, isTower, isFrame, isPowder, isSpring, fallRange, waterRange } from '../src/rules.mjs';
export const actionKey = action => `${action.kind}:${action.id || ''}:${action.side || ''}`;
const destructive = action => ['dig', 'cut'].includes(action.kind);
export const stateKey = (level, board) => JSON.stringify([board.tunnel, board.extended,
  level.objects.map(({ id }) => { const s = board.objects[id]; return [s.gone, s.braced, s.damage, s.row, s.wet, s.water]; })]);
export function solveSteps(level, { digOrder, board = initialBoard(level), limit = 100000 } = {}) {
  let frontier = [{ board, route: [], index: 0 }];
  const seen = new Set();
  while (frontier.length) {
    const next = [];
    for (const current of frontier) for (const action of legalMoves(level, current.board, true)) {
      if (digOrder && destructive(action) && actionKey(action) !== actionKey(digOrder[current.index] || {})) continue;
      const result = resolveMove(level, current.board, action, true, { checkRoute: false });
      if (result.error || result.board.reason?.type === 'protect') continue;
      const path = [...current.route, action], index = current.index + Number(destructive(action));
      if (result.board.reason?.type === 'success') return path;
      if (!result.board.turns) continue;
      const key = (digOrder ? index + ':' : '') + stateKey(level, result.board);
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size > limit) throw new Error(`${level.id} 搜索状态过多`);
      next.push({ board: result.board, route: path, index });
    }
    frontier = next;
  }
  return null;
}
/** 撑木可推迟到受击前安装：对象横坐标和可达性不会因等待变差，未受击的预装撑木可等价后移。
 * 以一次拆除及其必要防护为一段，按真实工步做最短路，避免枚举大量等价的提前架撑排列。
 * 所有操作仍调用正式规则；此工具和解法均不进入发行包。
 */
export function solve(level,{digOrder,board=initialBoard(level),limit=100000}={}) {
  const buckets=Array.from({length:board.turns+1},()=>[]),best=new Map();
  buckets[0].push({board,route:[],index:0});
  const impacted=new Set(['shield','dent','break','open','explode','fall','roll','flood']);
  for(let cost=0;cost<buckets.length;cost++)for(const current of buckets[cost]){
    if(current.board.reason?.type==='success')return current.route;
    const key=(digOrder?current.index+':':'')+stateKey(level,current.board);
    if((best.get(key)??cost)<cost)continue;
    const moves=legalMoves(level,current.board,true);
    for(const action of moves.filter(a=>a.kind!=='brace')){
      if(digOrder&&destructive(action)&&actionKey(action)!==actionKey(digOrder[current.index]||{}))continue;
      const base=resolveMove(level,current.board,action,true,{checkRoute:false});
      const hitIds=new Set(base.events.filter(e=>impacted.has(e.kind)).map(e=>e.id));
      const braces=moves.filter(a=>a.kind==='brace'&&hitIds.has(a.id));
      // 每种准备只在这一轮确实吸收撞击时保留，否则把该撑木留到后面即可。
      for(let mask=0;mask<2**braces.length;mask++){
        let prepared=current.board;const prep=[];
        for(let i=0;i<braces.length;i++)if(mask&(2**i)){
          if(prepared.turns<=1){prepared=null;break;}
          prepared=resolveMove(level,prepared,braces[i],true,{checkRoute:false}).board;prep.push(braces[i]);
        }
        if(!prepared)continue;
        const result=mask?resolveMove(level,prepared,action,true,{checkRoute:false}):base;
        if(result.board.reason?.type==='protect'||prep.some(a=>result.board.objects[a.id].braced))continue;
        const route=[...current.route,...prep,action],nextCost=route.length;
        if(nextCost>=buckets.length||(!result.board.turns&&result.board.reason?.type!=='success'))continue;
        const index=current.index+Number(destructive(action));
        const nextKey=(digOrder?index+':':'')+stateKey(level,result.board);
        if((best.get(nextKey)??Infinity)<=nextCost)continue;
        best.set(nextKey,nextCost);
        if(best.size>limit)throw new Error(level.id+' 搜索状态过多');
        buckets[nextCost].push({board:result.board,route,index});
      }
    }
  }
  return null;
}
export function permutations(items) {
  if (!items.length) return [[]];
  return items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]));
}
/** 潜在物理影响图：只连实际冲击范围、垂直承托和坠落落点，不使用关卡前置 ID。 */
export function interactionComponents(level) {
  const graph = new Map(level.objects.map(item => [item.id, new Set()]));
  const connect = (a, b) => { graph.get(a.id).add(b.id); graph.get(b.id).add(a.id); };
  for (const a of level.objects) for (const b of level.objects) {
    if (a === b) continue;
    const ay = a.row || 0, by = b.row || 0;
    if (isFrame(a) && by === ay + 1 && Math.abs(a.x - b.x) <= a.span / 2 + .00001) connect(a, b);
    const range = isTower(a) ? fallRange(a) : isPowder(a) ? (a.kind === 'powderhouse' ? 3 : 2)
      : isSpring(a) ? waterRange(a) : a.kind === 'boulder' ? 4 : a.kind === 'ramp' ? 3 : a.kind === 'drain' ? 2 : 0;
    if (range && by <= ay && Math.abs(a.x - b.x) <= range + .00001) connect(a, b);
    if (a.kind === 'ramp' && by === ay + 1 && Math.abs(a.x - b.x) <= 3) connect(a, b);
    if (a.kind === 'drain' && by === ay + 1 && Math.abs(a.x - b.x) <= 3) connect(a, b);
    if (ay > by && Math.abs(a.x - b.x) <= .65) connect(a, b);
  }
  const visited = new Set(), parts = [];
  for (const item of level.objects) {
    if (visited.has(item.id)) continue;
    const queue = [item.id], component = [];
    for (const id of queue) { if (visited.has(id)) continue; visited.add(id); component.push(id); queue.push(...graph.get(id)); }
    parts.push(component);
  }
  return parts;
}
export function audit(level) {
  const route = solve(level);
  if (!route) throw new Error(level.id + ' 无解');
  const digs = route.filter(destructive);
  // 五次以上拆除不再用阶乘穷举拖慢日常验证。保留所有单次移位、倒序及固定种子样本，明确标记抽样口径。
  const exhaustive = digs.length <= 4;
  const possibleOrders = digs.reduce((n,_,i)=>n*(i+1),1);
  let variants;
  if(exhaustive) variants=permutations(digs);
  else {
    const unique=new Map();
    const add=order=>unique.set(order.map(actionKey).join('|'),order);
    add(digs);add([...digs].reverse());
    for(let from=0;from<digs.length;from++)for(let to=0;to<digs.length;to++){
      const order=[...digs],item=order.splice(from,1)[0];order.splice(to,0,item);add(order);
    }
    let seed=17041;
    for(let trial=0;unique.size<Math.min(64,possibleOrders)&&trial<1000;trial++){
      const order=[...digs];
      for(let i=order.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[order[i],order[j]]=[order[j],order[i]];}
      add(order);
    }
    variants=[...unique.values()];
  }
  const evaluated=variants.map(digOrder=>({digOrder,valid:Boolean(solve(level,{digOrder}))}));
  const valid=evaluated.filter(result=>result.valid);
  const invalid=evaluated.find(result=>!result.valid)?.digOrder;
  return { route, shortest: route.length, destructiveActions: digs.length,
    validOrders: valid.length, possibleOrders, testedOrders:variants.length, exhaustive, rejectedOrder: invalid || null,
    components: interactionComponents(level) };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const selected=process.argv.slice(2).map(Number);
  const proofs=selected.length?JSON.parse(readFileSync(new URL('../tests/fixtures/curated-proofs.json',import.meta.url))):{};
  for(const [i,level]of LEVELS.entries())if(!selected.length||selected.includes(i+1)){
    proofs[level.id]=audit(level);console.log('已搜索',i+1,level.title,proofs[level.id].shortest);
  }
  writeFileSync(new URL('../tests/fixtures/curated-proofs.json', import.meta.url), JSON.stringify(proofs, null, 2) + '\n');
  let meaningful = 0;
  for (const [index, level] of LEVELS.entries()) {
    const proof = proofs[level.id];
    meaningful += Number(Boolean(proof.rejectedOrder));
    console.log(`${index + 1} ${level.title} ${proof.shortest}/${level.steps}步 ${proof.exhaustive===false?'抽样':''}拆序${proof.validOrders}/${proof.testedOrders??proof.possibleOrders} 连通工地${proof.components.length}`);
  }
  console.log(`共${LEVELS.length}关，${meaningful}关存在不能靠重新安排撑木补救的拆序反例。`);
}
