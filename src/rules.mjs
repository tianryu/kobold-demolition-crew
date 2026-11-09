const SIDES = ['left', 'right'];
export const isTower = item => ['tower', 'bellhouse'].includes(item.kind);
export const isFrame = item => ['platform', 'bridge', 'minepier', 'timber', 'ledge'].includes(item.kind);
export const isPowder = item => ['barrel', 'powderhouse'].includes(item.kind);
export const isSpring = item => ['spring', 'watertower'].includes(item.kind);
export const hasWater = item => isSpring(item) || item.kind === 'drain';
export const fallRange = item => item.kind === 'bellhouse' ? 3 : 2;
export const waterRange = item => item.kind === 'watertower' ? 3 : 2;
export const rowOf = (item, state) => state?.row ?? item.row ?? 0;
export function tunnelPlugs(level) {
  return level.plugs ?? (level.extension ? [{ id: 'extension', x: level.extension.x }] : []);
}
export function tunnelDepth(board) { return board.tunnel ?? Number(board.extended); }

/** 施工可达性只取决于连续地道的实际前沿，不接受对象编号式的前置条件。 */
function moveObstruction(level, board, action, item) {
  const plugs = tunnelPlugs(level);
  const front = plugs[tunnelDepth(board)];
  if (!front) return null;
  if (action.kind === 'extend') return (action.id || 'extension') === front.id ? null : { kind: 'plug', id: front.id, x: front.x };
  const x = item.x + (action.kind === 'dig' ? (action.side === 'left' ? -.41 : .41) : 0);
  return x > front.x ? { kind: 'plug', id: front.id, x: front.x } : null;
}
export function availability(level, board, action, hasBrace) {
  if (!action || board.reason) return 'finished';
  if (action.kind === 'extend') {
    const index = tunnelPlugs(level).findIndex(plug => plug.id === (action.id || 'extension'));
    if (index < 0 || index < tunnelDepth(board)) return 'used';
    if (!board.turns) return 'empty';
    return moveObstruction(level, board, action) ? 'blocked' : null;
  }
  const item = level.objects.find(entry => entry.id === action.id);
  if (!item || board.objects[item.id].gone) return 'used';
  if (action.kind === 'sniff') return item.scent ? null : 'used';
  if (board.turns <= 0) return 'empty';
  if (action.kind === 'brace' && !hasBrace) return 'locked';
  if (action.kind === 'brace' && board.objects[item.id].braced) return 'used';
  const access = action.kind === 'dig' ? item.feet?.[action.side]
    : action.kind === 'cut' ? item.kind === 'minepier' : action.kind === 'brace' && item.braceSlot;
  if (!access) return 'solid';
  return moveObstruction(level, board, action, item) ? 'blocked' : null;
}
function simulate(level, board, action) {
  const next = structuredClone(board), events = [], queue = [];
  const item = level.objects.find(entry => entry.id === action.id);
  const row = target => rowOf(target, next.objects[target.id]);
  const alive = target => !next.objects[target.id].gone;
  if (action.kind === 'sniff') {
    if (!next.found.includes(item.id)) next.found.push(item.id);
    events.push({ kind: 'sniff', id: item.id, x: item.x, row: row(item) });
    return { board: next, events };
  }
  next.turns--;
  if (action.kind === 'extend') {
    const plug = tunnelPlugs(level)[tunnelDepth(board)];
    if (level.plugs) next.tunnel++;
    else next.extended = true;
    events.push({ kind: 'extend', id: plug.id, x: plug.x, row: 0 });
  } else if (action.kind === 'brace') {
    next.objects[item.id].braced = true;
    events.push({ kind: 'brace', id: item.id, x: item.x, row: row(item) });
  } else if (action.kind === 'cut') {
    events.push({ kind: 'cut', id: item.id, x: item.x, row: row(item) });
    destroy(item, item);
  } else {
    events.push({ kind: 'dig', id: item.id, x: item.x, side: action.side, row: row(item) });
    fell(item, action.side, null);
  }
  for (const impact of queue) {
    const target = impact.item, state = next.objects[target.id];
    if (state.gone) continue;
    const info = { id: target.id, x: target.x, row: row(target), source: impact.source.id };
    if (target.kind === 'ledge') continue;
    if (state.braced) {
      state.braced = false;
      events.push({ kind: 'shield', ...info });
    } else if (target.kind === 'ramp' && impact.source.kind === 'boulder'
      && (impact.source.x < target.x ? 1 : -1) === (target.direction || 1)) launch(target, impact.source);
    else if (isTower(target)) fell(target, impact.source.x < target.x ? 'right' : 'left', impact.source.id);
    else if (target.kind === 'boulder') roll(target, impact.source);
    else if (target.armor && state.damage + 1 < target.armor) {
      state.damage++;
      events.push({ kind: 'dent', ...info, left: target.armor - state.damage });
    } else destroy(target, impact.source);
  }
  if (level.bonus) {
    const bonus = level.bonus;
    next.bonus ||= bonus.kind === 'double'
      ? bonus.ids.every(id => events.some(event => event.kind === 'fall' && event.id === id))
      : bonus.ids.every(id => next.objects[id].gone);
  }
  return { board: next, events };

  // 完整的实体挡墙截断这一道冲击，即使本次被打碎也不让同一冲击穿透。
  function ray(source, direction, range) {
    return rayAt(source.x, row(source), direction, range);
  }
  function rayAt(x, atRow, direction, range) {
    const targets = level.objects.filter(target => target.kind !== 'ledge' && alive(target) && row(target) === atRow
      && (target.x - x) * direction > .001 && (target.x - x) * direction <= range + .00001)
      .sort((a, b) => (a.x - b.x) * direction);
    const wall = targets.findIndex(target => target.kind === 'bulwark');
    return wall < 0 ? targets : targets.slice(0, wall + 1);
  }
  function fell(tower, side, source) {
    const state = next.objects[tower.id];
    state.gone = true; state.side = side;
    const targets = ray(tower, side === 'left' ? -1 : 1, fallRange(tower));
    const wall = targets.find(target => target.kind === 'bulwark');
    events.push({ kind: 'fall', id: tower.id, x: tower.x, row: row(tower), side, source, range: fallRange(tower),
      end: wall ? wall.x : tower.x + (side === 'left' ? -1 : 1) * (fallRange(tower) - .15), blockedBy: wall?.id ?? null, targets: targets.map(target => target.id) });
    for (const target of targets) queue.push({ item: target, source: tower });
  }
  function roll(stone, source) {
    next.objects[stone.id].gone = true;
    const direction = source.x < stone.x ? 1 : -1;
    const target = ray(stone, direction, 4)[0];
    events.push({ kind: 'roll', id: stone.id, x: stone.x, row: row(stone), side: direction > 0 ? 'right' : 'left',
      to: target?.x ?? stone.x + direction * 4, target: target?.id, source: source.id });
    if (target) queue.push({ item: target, source: stone });
  }
  // 跳板只接受从低端滚入的石头，落点遵循同一层的实体遮挡。
  function launch(ramp, stone) {
    const direction = ramp.direction || 1;
    const target = rayAt(ramp.x, row(ramp) + 1, direction, 3)[0];
    next.objects[ramp.id].gone = true;
    events.push({ kind: 'launch', id: ramp.id, stone: stone.id, x: ramp.x, row: row(ramp),
      toRow: row(ramp) + 1, to: target?.x ?? ramp.x + direction * 3, target: target?.id, side: direction > 0 ? 'right' : 'left' });
    if (target) queue.push({ item: target, source: ramp });
  }
  function destroy(target, source, dropping = false) {
    const state = next.objects[target.id]; state.gone = true;
    const wet = state.wet || level.objects.some(spring => hasWater(spring)
      && next.objects[spring.id].water?.row === row(target)
      && target.x >= next.objects[spring.id].water.left - .00001 && target.x <= next.objects[spring.id].water.right + .00001);
    if (isPowder(target) && wet && !state.wet) {
      state.wet = true;
      events.push({ kind: 'soak', id: target.id, x: target.x, row: row(target), source: source.id });
    }
    const kind = isSpring(target) ? 'flood' : isPowder(target) && !wet ? 'explode'
      : ['vault', 'cache'].includes(target.kind) ? 'open' : 'break';
    const info = { id: target.id, x: target.x, row: row(target), source: source.id };
    if (kind === 'flood') Object.assign(info, waterBounds(target, waterRange(target)));
    if (!dropping || ['explode', 'flood'].includes(kind)) events.push({ kind, ...info });
    if (kind === 'explode') {
      const range = target.kind === 'powderhouse' ? 3 : 2;
      const blast = events.at(-1);
      blast.range = range;
      blast.left = ray(target, -1, range).find(entry => entry.kind === 'bulwark')?.x ?? target.x - range;
      blast.right = ray(target, 1, range).find(entry => entry.kind === 'bulwark')?.x ?? target.x + range;
      const targets = [...ray(target, -1, range), ...ray(target, 1, range),
        ...level.objects.filter(entry => entry.kind !== 'ledge' && alive(entry) && row(entry) === row(target) && Math.abs(entry.x - target.x) <= .001)]
        .sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x) || a.x - b.x);
      for (const candidate of targets) queue.push({ item: candidate, source: target });
    }
    if (kind === 'flood') {
      spreadWater(target);
    }
    if (isFrame(target)) collapse(target, source);
    if (target.kind === 'bulwark') {
      for (const spring of level.objects.filter(entry=>hasWater(entry) && next.objects[entry.id].water?.row===row(target))) {
        const before=next.objects[spring.id].water;
        const after=waterBounds(spring,spring.kind==='drain'?2:waterRange(spring));
        if (before.left!==after.left || before.right!==after.right) {
          events.push({kind:spring.kind==='drain'?'drain':'flood',id:spring.id,x:spring.x,row:row(spring),from:row(spring)+1,refresh:true,...after});
          spreadWater(spring);
        }
      }
    }
  }
  function waterBounds(source, range) {
    const leftWall = ray(source, -1, range).find(entry => entry.kind === 'bulwark');
    const rightWall = ray(source, 1, range).find(entry => entry.kind === 'bulwark');
    return next.objects[source.id].water = { left: leftWall ? leftWall.x + .35 : source.x - range,
      right: rightWall ? rightWall.x - .35 : source.x + range, row: row(source) };
  }
  // 水的范围由几何位置决定；排水管入口在自身上方一层，可连续向下传水。
  function spreadWater(source) {
    const water = next.objects[source.id].water;
    for (const entry of level.objects.filter(entry => alive(entry) && row(entry) === water.row
      && entry.x + (entry.kind === 'timber' ? entry.span / 2 : 0) >= water.left - .00001
      && entry.x - (entry.kind === 'timber' ? entry.span / 2 : 0) <= water.right + .00001)) {
      if (isPowder(entry)) {
        next.objects[entry.id].wet = true;
        events.push({ kind: 'soak', id: entry.id, x: entry.x, row: row(entry), source: source.id });
      } else if (entry.kind === 'timber') {
        events.push({ kind: 'rot', id: entry.id, x: entry.x, row: row(entry), source: source.id });
        destroy(entry, source);
      }
    }
    for (const pipe of level.objects.filter(entry => entry.kind === 'drain' && alive(entry)
      && !next.objects[entry.id].water && row(entry) + 1 === water.row
      && entry.x >= water.left - .00001 && entry.x <= water.right + .00001)) {
      const bounds = waterBounds(pipe, 2);
      events.push({ kind: 'drain', id: pipe.id, x: pipe.x, row: row(pipe), from: water.row, ...bounds, source: source.id });
      spreadWater(pipe);
    }
  }
  function collapse(platform, source) {
    const deckRow = (platform.row ?? 0) + 1;
    const top = level.objects.filter(entry => alive(entry) && row(entry) === deckRow
      // 梁端载荷同样受到承托，避免小数坐标把恰好落在边缘的物件漏掉。
      && Math.abs(entry.x - platform.x) <= platform.span / 2 + .00001
      && !level.objects.some(other=>other.id!==platform.id && alive(other) && isFrame(other)
        && row(other)===deckRow-1 && Math.abs(entry.x-other.x)<=other.span/2+.00001));
    for (const entry of top) {
      const from = row(entry);
      next.objects[entry.id].row = row(platform);
      events.push({ kind: 'drop', id: entry.id, x: entry.x, row: row(platform), from, source: platform.id });
      const below = level.objects.filter(candidate => candidate.id !== entry.id && alive(candidate)
        && row(candidate) === row(platform) && Math.abs(candidate.x - entry.x) <= .65);
      destroy(entry, source, true);
      for (const candidate of below) for (let hit = 0; hit < (entry.kind === 'anvil' ? 2 : 1); hit++) queue.push({ item: candidate, source: entry });
    }
  }
}
function goalState(level, board) {
  const broken = level.protect.find(id => board.objects[id].gone);
  if (broken) return { type: 'protect', id: broken };
  if (level.goals.every(id => board.objects[id].gone)) return { type: 'success' };
  return null;
}
export function legalMoves(level, board, hasBrace) {
  const actions = [];
  for (const item of level.objects) {
    if (item.feet) for (const side of SIDES) actions.push({ kind: 'dig', id: item.id, side });
    if (item.kind === 'minepier') actions.push({ kind: 'cut', id: item.id });
    if (item.braceSlot) actions.push({ kind: 'brace', id: item.id });
  }
  for (const plug of tunnelPlugs(level)) actions.push({ kind: 'extend', id: plug.id });
  return actions.filter(action => !availability(level, board, action, hasBrace));
}
export function resolveMove(level, board, action, hasBrace, { checkRoute = true } = {}) {
  const error = availability(level, board, action, hasBrace);
  if (error === 'blocked') return { error, obstruction: moveObstruction(level, board, action, level.objects.find(item => item.id === action.id)) };
  if (error) return { error };
  const result = simulate(level, board, action);
  if (action.kind === 'sniff') return result;
  const goal = goalState(level, result.board);
  if (goal?.type === 'protect') goal.source = result.events.find(event => event.id === goal.id && ['break', 'open', 'drop'].includes(event.kind))?.source || null;
  result.board.reason = goal;
  // 只按已经发生的保护物损坏或明确的预算耗尽判负，不预测玩家接下来的拆法。
  if (checkRoute && !goal && result.board.turns===0) result.board.reason = { type: 'route', id: level.goals.find(id => !result.board.objects[id].gone), source:null };
  return result;
}
