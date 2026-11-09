import { LEVELS, LOOKUP, initialBoard } from './levels.mjs';
import { LEGACY_CATALOG } from './legacy-catalog.mjs';
import { legalMoves } from './rules.mjs';
export const SAVE_KEY = 'kobold-crew.progress.v1';
export const PREF_KEY = 'kobold-crew.settings.v1';
const base = () => ({ version: 2, revision: 0, banked: 0, history: [], claims: {}, active: null });
const own = (object, key) => Object.hasOwn(object, key);
const legacy = Object.fromEntries(LEGACY_CATALOG.map(level => [level.id, level]));
export function unlocked(level, progress) {
  const index = LEVELS.indexOf(level);
  return index === 0 || Boolean(progress.claims[level.id]?.cleared)
    || (index > 0 && Boolean(progress.claims[LEVELS[index - 1].id]?.cleared));
}
export function ownsBrace() { return true; }
export function wallet(progress) {
  return progress.banked + Object.values(progress.claims).reduce((sum, claim) => sum + claim.credited, 0);
}
export function nextContract(progress) {
  return LEVELS.find(level => unlocked(level, progress) && !progress.claims[level.id]?.cleared) || null;
}
function validBoard(level, board) {
  return board && Number.isInteger(board.turns) && board.turns >= 0 && board.turns <= level.steps
    && typeof board.extended === 'boolean' && Array.isArray(board.found)
    && (!level.plugs || (Number.isInteger(board.tunnel) && board.tunnel >= 0 && board.tunnel <= level.plugs.length))
    && board.found.every(id => level.objects.some(item => item.id === id && item.scent))
    && typeof board.bonus === 'boolean' && board.objects
    && level.objects.every(item => {
      const state = board.objects[item.id];
      return state && typeof state.gone === 'boolean' && typeof state.braced === 'boolean'
        && [null, 'left', 'right'].includes(state.side)
        && (state.row === undefined || (Number.isInteger(state.row) && state.row >= 0 && state.row <= (item.row ?? 0)))
        && (state.wet === undefined || typeof state.wet === 'boolean')
        && (!['spring', 'watertower', 'drain'].includes(item.kind) || state.water === null || (state.water && Number.isFinite(state.water.left) && Number.isFinite(state.water.right)
          && state.water.left >= item.x - (item.kind === 'watertower' ? 3.00001 : 2.00001) && state.water.right <= item.x + (item.kind === 'watertower' ? 3.00001 : 2.00001)
          && state.water.left <= state.water.right && state.water.row === (state.row ?? item.row ?? 0)))
        && (!item.armor || (Number.isInteger(state.damage) && state.damage >= 0 && state.damage < item.armor));
    })
    && (board.reason === null || ['success', 'protect', 'route'].includes(board.reason?.type));
}


/** 旧版已经到账的回收与工单留在历史账本；重构后的地图不冒用旧解法记为通关。 */
function migrateFifty(progress) {
  const next = { ...base(), revision: progress.revision };
  for (const [id, claim] of Object.entries(progress.claims)) {
    const old = legacy[id];
    if (!old || claim?.cleared !== true || typeof claim.bonus !== 'boolean'
      || !Number.isInteger(claim.best) || claim.best < 1 || claim.best > old.steps || (claim.bonus && !old.bonus)) throw new Error('旧工单记录无法识别');
    const credited = old.pay + (claim.bonus ? old.bonus : 0);
    next.history.push({ id, credited, best: claim.best });
    next.banked += credited;
    if (LOOKUP[id]?.revision === 1) next.claims[id] = { cleared: true, bonus: false, best: claim.best, credited: 0 };
  }
  const oldActive = progress.active;
  const level = oldActive && LOOKUP[oldActive.id];
  if (level?.revision === 1 && !oldActive.board?.reason && unlocked(level, next) && validBoard(level, oldActive.board)) {
    next.active = { ...oldActive, layoutRevision: level.revision };
  }
  return next;
}

export function decodeProgress(raw) {
  if (!raw) return base();
  let progress = JSON.parse(raw);
  if (![1, 2].includes(progress?.version) || !Number.isInteger(progress.revision) || progress.revision < 0
    || !progress.claims || typeof progress.claims !== 'object' || Array.isArray(progress.claims)) throw new Error('存档格式无法识别');
  if (progress.version === 1) progress = migrateFifty(progress);
  if (!Number.isInteger(progress.banked) || progress.banked < 0 || !Array.isArray(progress.history)) throw new Error('回收账本无法识别');
  const seen = new Set();
  for (const record of progress.history) {
    const old = legacy[record.id];
    if (!old || seen.has(record.id) || ![old.pay, old.pay + (old.bonus || 0)].includes(record.credited)
      || !Number.isInteger(record.best) || record.best < 1 || record.best > old.steps) throw new Error('历史回收无法识别');
    seen.add(record.id);
  }
  if (progress.history.reduce((sum, entry) => sum + entry.credited, 0) !== progress.banked) throw new Error('历史金额无法识别');
  for (const [id, claim] of Object.entries(progress.claims)) {
    const level = LOOKUP[id];
    if (!own(LOOKUP, id) || claim?.cleared !== true || typeof claim.bonus !== 'boolean'
      || (claim.bonus && !level.bonus) || !Number.isInteger(claim.best) || claim.best < 1 || claim.best > level.steps
      || ![0, level.pay, level.pay + (level.bonus?.amount || 0)].includes(claim.credited)) throw new Error('工单记录无法识别');
  }
  if (progress.active !== null) {
    const level = own(LOOKUP, progress.active?.id) && LOOKUP[progress.active.id];
    // 仅预算修正的地图保留施工现场，包括因旧预算耗尽而失败的现场。
    const previous = level?.previousBudget;
    if (previous && progress.active.layoutRevision === previous.layoutRevision) {
      const board = progress.active.board;
      if (!validBoard({ ...level, steps: previous.steps }, board) || level.steps <= previous.steps) throw new Error('施工预算无法识别');
      const spentOut = board.turns === 0 && board.reason?.type === 'route';
      board.turns += level.steps - previous.steps;
      if (spentOut && legalMoves(level, { ...board, reason: null }, true).length) board.reason = null;
      progress.active.layoutRevision = level.revision;
    }
    if (level && progress.active.layoutRevision !== level.revision) {
      // 地图改版只重新布置这一单；保留玩家所在关、已交工记录与已到账收入。
      progress.active = {id:level.id,layoutRevision:level.revision,board:initialBoard(level),receipt:null};
      return progress;
    }
    const receipt = progress.active?.receipt;
    if (!level || !unlocked(level, progress) || !validBoard(level, progress.active.board)
      || (progress.active.board.reason?.type === 'success' && (!receipt || ![0, level.pay].includes(receipt.base)
        || ![0, level.bonus?.amount || 0].includes(receipt.bonus)))
      || (progress.active.board.reason?.type !== 'success' && receipt !== null)) throw new Error('施工记录无法识别');
    if (progress.active.board.reason?.type==='route' && progress.active.board.turns>0) progress.active.board.reason=null;
    if (progress.active.beforeFailure && !canRewindFailure(progress, level)) delete progress.active.beforeFailure;
  }
  return progress;
}
export function startContract(progress, level) {
  if (!unlocked(level, progress)) return progress;
  return { ...progress, active: { id: level.id, layoutRevision: level.revision, board: initialBoard(level), receipt: null } };
}
export function finishMove(progress, level, board) {
  if (progress.active?.id !== level.id || progress.active.board.reason) return progress;
  const active = { id: level.id, layoutRevision: level.revision, board, receipt: null };
  if (progress.active.rewindUsed) active.rewindUsed = true;
  const previousBoard = progress.active.board;
  if (!active.rewindUsed && level !== LEVELS[0] && isFailure(board)
    && level.steps - previousBoard.turns >= 2 && previousBoard.turns === board.turns + 1) {
    active.beforeFailure = previousBoard;
  }
  if (board.reason?.type !== 'success') return { ...progress, active };
  const prior = progress.claims[level.id];
  const earnedBonus = Boolean(level.bonus && board.bonus);
  active.receipt = { base: prior?.cleared ? 0 : level.pay,
    bonus: earnedBonus && !prior?.bonus ? level.bonus.amount : 0 };
  const claim = { cleared: true, bonus: Boolean(prior?.bonus || earnedBonus),
    best: Math.min(prior?.best ?? Infinity, level.steps - board.turns),
    credited: (prior?.credited || 0) + active.receipt.base + active.receipt.bonus };
  return { ...progress, claims: { ...progress.claims, [level.id]: claim }, active };
}

function isFailure(board) {
  return board.reason?.type === 'protect' || (board.reason?.type === 'route' && board.turns === 0);
}

export function canRewindFailure(progress, level) {
  const active = progress.active;
  const checkpoint = active?.beforeFailure;
  return Boolean(level !== LEVELS[0] && active?.id === level.id && active.layoutRevision === level.revision
    && !active.rewindUsed && isFailure(active.board) && validBoard(level, checkpoint) && checkpoint.reason === null
    && level.steps - checkpoint.turns >= 2 && checkpoint.turns === active.board.turns + 1);
}

/** 回撤仅更换当前施工现场。保留账本和交工记录，一局内的使用次数随存档写入。 */
export function rewindFailure(progress, level) {
  if (!canRewindFailure(progress, level)) return progress;
  return {
    ...progress,
    active: {
      id: level.id,
      layoutRevision: level.revision,
      board: progress.active.beforeFailure,
      receipt: null,
      rewindUsed: true,
    },
  };
}
export function createStore(storage) {
  let raw = null, data = base(), readable = true, issue = '';
  try { raw = storage.getItem(SAVE_KEY); }
  catch { readable = false; issue = '存储不可用。本次进度只保留在当前窗口。'; }
  if (readable && raw) {
    try {
      data = decodeProgress(raw);
      const previousActive=JSON.parse(raw).active;
      if(previousActive&&data.active&&previousActive.layoutRevision!==data.active.layoutRevision&&data.active.id===previousActive.id
        &&!LOOKUP[data.active.id]?.previousBudget)issue='本关结构已更新，施工现场已重新布置。关卡进度和回收账本已保留。';
      if (JSON.parse(raw).version === 1) {
        issue = '工单已更新为50单。原回收与已交记录已归档，重构工地将重新开工。';
        try { storage.setItem(SAVE_KEY + '.before-curation', raw); } catch { /* 主存档仍完整保留，首次施工时再原子提交。 */ }
      }
    } catch {
      try { storage.setItem(SAVE_KEY + '.backup.' + Date.now(), raw); issue = '旧存档读取失败，已保留副本。'; }
      catch { readable = false; issue = '旧存档读取失败，本次进度只保留在当前窗口。'; }
    }
  }
  return {
    get data() { return data; },
    get issue() { return issue; },
    save(proposed) {
      const next = { ...proposed, revision: data.revision + 1 };
      const serialized = JSON.stringify(next);
      if (readable) {
        if (storage.getItem(SAVE_KEY) !== raw) throw new Error('另一窗口更新了工单。请重新载入。');
        storage.setItem(SAVE_KEY, serialized); raw = serialized;
      }
      data = next; return data;
    },
  };
}
export function preferences(storage) {
  const defaults = { music: true, effects: true, motion: true };
  try {
    const saved = JSON.parse(storage.getItem(PREF_KEY) || '{}');
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [
      key, typeof saved?.[key] === 'boolean' ? saved[key] : value,
    ]));
  } catch {
    return defaults;
  }
}
