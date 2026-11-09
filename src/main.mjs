import { ITEMS, LEVELS, LOOKUP, MILESTONES, CHAPTERS, initialBoard } from './levels.mjs';
import { resolveMove } from './rules.mjs';
import { canRewindFailure, createStore, finishMove, nextContract, ownsBrace, PREF_KEY, preferences, rewindFailure, startContract, unlocked, wallet } from './save.mjs';
import { CrewAudio } from './audio.mjs';
import { glyph, image, receiptGoals, symbol, Worksite } from './view.mjs';
import { discoveryNotes, jobObjectives, MECHANICS } from './guidance.mjs';
import { createRewardedAd } from './rewarded-ad.mjs';
import { rewindAdUnitId } from './ad-config.mjs';

const app = document.querySelector('#game');
const storage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const store = createStore(storage);
const rewindAd = createRewardedAd(rewindAdUnitId);
const rewindInterval = 60_000;
let nextRewindAt = rewindInterval;
let rewindRequest;
let rewindGrant;
const settings = preferences(storage);
const GUIDE_KEY = 'kobold-crew.hidden-guides.v2';
const BUDGET_GUIDE_KEY = 'kobold-crew.budget-guide.v1';
let budgetExplained = false;
try { budgetExplained = storage.getItem(BUDGET_GUIDE_KEY)==='seen'; } catch { /* 当前窗口仍可学习规则。 */ }
function rememberBudgetRule() {
  if (budgetExplained) return;
  budgetExplained=true;
  try { storage.setItem(BUDGET_GUIDE_KEY,'seen'); } catch { /* 不影响游戏存档。 */ }
}
const hiddenGuides = new Set();
try {
  const saved = JSON.parse(storage.getItem(GUIDE_KEY) || '[]');
  if (Array.isArray(saved)) for (const id of saved) if (typeof id==='string'&&Object.hasOwn(LOOKUP,id.split('@')[0])) hiddenGuides.add(id);
} catch { /* 引导偏好读取失败时照常显示。 */ }
const audio = new CrewAudio(settings);
const lessMotion = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => !settings.motion || lessMotion.matches;
let screen;
let worksite;
// 改版地图的新材料说明可在已通关重玩时出现一次，旧的关卡级关闭偏好仍用于未改版工地。
const guideToken=level=>level.challengeRevision?`${level.id}@${level.revision}`:level.id;
let modal;
let focusOrigin;
let pendingCommit;
let pendingJob;
let bookTab = 'jobs';
let bookScroll = 0;
let selectedJob;

const control = (name, label, body, classes = 'wood-button') =>
  `<button class="${classes}" type="button" data-ui="${name}" aria-label="${label}">${body}</button>`;
const paperButton = (name, label, icon, classes = 'wood-button') => control(name, label, (icon ? symbol(icon) : '') + `<span>${label}</span>`, classes);
const numberWith = (n, icon) => `<span class="quantity"><b>${n}</b>${symbol(icon)}</span>`;
const levelAt = level => LEVELS.indexOf(level) + 1;

function updateMotion() {
  app.classList.toggle('reduced-motion', reduced());
}
updateMotion();
lessMotion.addEventListener('change', updateMotion);

function swapScreen(next) {
  const old = screen;
  screen = next;
  next.inert = false;
  app.prepend(next);
  if (old) {
    old.inert = true;
    old.setAttribute('aria-hidden', 'true');
    old.classList.add('departing');
    setTimeout(() => old.remove(), reduced() ? 75 : 240);
  }
}

function routeHash(site) {
  const next = new URL(location.href);
  next.hash = site ? 'worksite' : '';
  history.replaceState(null, '', next);
}

function workshop() {
  rewindGrant = undefined;
  if (modal) closeModal(false);
  worksite?.destroy();
  worksite = null;
  routeHash(false);
  const progress = store.data;
  const next = nextContract(progress);
  const resumed = progress.active && !progress.active.board.reason;
  const label = resumed ? '继续施工' : !progress.claims[LEVELS[0].id] ? '第一次开工' : next ? '继续施工' : '查看工单';
  const section = document.createElement('main');
  section.className = 'workshop screen';
  section.innerHTML = `
    <div class="workshop-back"></div>
    <section class="home-block">
      <div class="workshop-kicker">地下工棚</div>
      <h1 aria-label="狗头人拆迁队">${image('title', 'class="title-art"')}</h1>
      <div class="home-main">${paperButton('continue', label, 'shovel', 'gold-button home-start')}</div>
      <nav class="home-nav" aria-label="工棚">
        ${paperButton('jobs', '工单', 'contract')}${paperButton('ledger', '回收账本', 'ledger')}
      </nav>
      ${store.issue ? '<p class="storage-note"></p>' : ''}
    </section>
    <aside class="workshop-balance" aria-label="工棚累计收入">${numberWith(wallet(progress), 'coin')}</aside>
    <div class="workshop-upgrades" aria-label="工棚陈列">
      ${MILESTONES.filter(item => wallet(progress) >= item.coins).map(item => image(item.icon, `class="upgrade ${item.icon}" title="${item.name}"`)).join('')}
    </div>
    <footer class="workshop-footer">${paperButton('settings', '设置', 'gear', 'quiet-button')}
      ${control('credits', '鸣谢', '鸣谢', 'quiet-button')}
    </footer>
  `;
  if (store.issue) section.querySelector('.storage-note').textContent = store.issue;
  swapScreen(section);
}

function enter(level, resume = false) {
  if (!unlocked(level, store.data)) return;
  if (!resume) {
    try {
      store.save(startContract(store.data, level));
    } catch (error) {
      showSaveError(error, () => enter(level));
      return;
    }
    rewindGrant = undefined;
  }
  closeModal(false);
  worksite?.destroy();
  routeHash(true);
  const board = store.data.active.board;
  worksite = new Worksite(level, board, choose, siteControl, reduced, inspect);
  worksite.guideEnabled = !hiddenGuides.has(guideToken(level)) && (!store.data.claims[level.id]?.cleared
    || Boolean(level.challengeRevision&&worksite.guideNotes.length));
  if (!budgetExplained && !board.reason) {
    worksite.guideNotes=[{key:'tools',...MECHANICS.tools},...worksite.guideNotes.filter(note=>note.key!=='tools')];
    worksite.guideEnabled=true;
  }
  swapScreen(worksite.root);
  worksite.paint(board, ownsBrace(store.data));
  if (board.reason) {
    worksite.flagFailure(board.reason);
    showReceipt();
  }
}

function choose(action, useSound = true) {
  if (!worksite || worksite.busy || modal) return;
  if (useSound && action.kind !== 'sniff') audio.play('tap');
  if (action.kind === 'extend') worksite.tool = 'dig';
  if (action.kind === 'brace') worksite.tool = 'brace';
  const board = store.data.active.board;
  const result = resolveMove(worksite.level, board, action, ownsBrace(store.data));
  worksite.showChoice(action, result, ownsBrace(store.data));
  if (action.kind === 'sniff' && !result.error) commit(action);
}

function inspect(action, source) {
  if (!worksite || worksite.busy || modal || worksite.board.reason) return;
  const result = resolveMove(worksite.level, store.data.active.board, action, ownsBrace(store.data));
  worksite.showInspection(action, result, source);
}

function siteControl(action) {
  if (!worksite || modal || worksite.busy) return;
  if (action === 'view-left' || action === 'view-right') return worksite.moveCamera(action === 'view-left' ? -1 : 1);
  if (action === 'objectives') return showObjectives();
  if (action.startsWith('locate:')) return worksite.locate(action.slice(7));
  if (action === 'next-guide') {
    if (worksite.guideNotes[worksite.guideIndex]?.key==='tools') rememberBudgetRule();
    if (++worksite.guideIndex >= worksite.guideNotes.length) return siteControl('hide-guide');
    return worksite.updateGuide();
  }
  if (action === 'pause') return showPause();
  if (action === 'receipt') return showReceipt();
  if (action === 'act') return commit(worksite.action);
  if (action === 'hide-guide') {
    if (worksite.guideNotes.some(note=>note.key==='tools')) rememberBudgetRule();
    hiddenGuides.add(guideToken(worksite.level));
    try { storage.setItem(GUIDE_KEY, JSON.stringify([...hiddenGuides])); } catch { /* 当前窗口仍记住选择。 */ }
    worksite.guideEnabled = false;
    worksite.updateGuide();
    return;
  }
  audio.play('tap');
  worksite.tool = action;
  worksite.showChoice(null, null, ownsBrace(store.data));
}

async function commit(action) {
  const activeSite = worksite;
  if (!activeSite || activeSite.busy || modal || !action) return;
  const board = store.data.active.board;
  const result = resolveMove(activeSite.level, board, action, ownsBrace(store.data));
  if (result.error) return;
  const wasBraced = ownsBrace(store.data);
  try {
    store.save(finishMove(store.data, activeSite.level, result.board));
  } catch (error) {
    showSaveError(error, () => commit(action));
    return;
  }

  activeSite.busy = true;
  activeSite.root.classList.add('working');
  activeSite.root.querySelector('.site-pause').disabled = true;
  activeSite.showChoice(null, null, wasBraced);
  audio.play('tap');
  const receipt = store.data.active.receipt;
  const paid = Boolean(receipt && receipt.base + receipt.bonus > 0);
  await activeSite.play(result.events, result.board, name => audio.play(name), paid);
  if (activeSite !== worksite) return;
  activeSite.busy = false;
  activeSite.root.classList.remove('working');
  activeSite.root.querySelector('.site-pause').disabled = false;
  if (action.kind === 'brace') activeSite.tool = 'dig';
  activeSite.paint(result.board, ownsBrace(store.data));
  if (result.board.reason) {
    activeSite.flagFailure(result.board.reason);
    audio.play(result.board.reason.type === 'success' ? 'win' : 'fail');
    showReceipt();
  }
}

function openModal(content, label, className = '') {
  const replacing = Boolean(modal);
  closeModal(false, replacing);
  if (!replacing) focusOrigin = document.activeElement;
  const layer = document.createElement('div');
  layer.className = `dialog-layer ${className}`;
  layer.inert = false;
  layer.innerHTML = `<section role="dialog" aria-modal="true" tabindex="-1" aria-label="${label}" class="dialog">${content}</section>`;
  app.append(layer);
  modal = layer;
  screen.inert = true;
  worksite?.cancelPointer();
  layer.querySelector('.dialog').focus({ preventScroll: true });
  return layer;
}

function closeModal(restoreFocus = true, keepFocusOrigin = false) {
  if (!modal) return;
  const previous = modal;
  modal = null;
  previous.inert = true;
  previous.setAttribute('aria-hidden', 'true');
  previous.classList.add('departing');
  setTimeout(() => previous.remove(), reduced() ? 75 : 190);
  if (screen) screen.inert = false;
  if (restoreFocus && focusOrigin?.isConnected) focusOrigin.focus({ preventScroll: true });
  if (!keepFocusOrigin) focusOrigin = null;
}

const cross = label => control('close', label, glyph('close'), 'paper-cross');

function showObjectives() {
  const { level, board } = worksite;
  const targets = jobObjectives(level).map(({ id, kind, label, preserve }) => {
    const gone = board.objects[id].gone;
    const mark = preserve ? (gone ? 'no' : 'shield') : (gone ? 'yes' : 'demolish');
    return `<li class="${preserve?'keep-goal':'break-goal'}">${symbol(kind)}<strong>${label}</strong>${symbol(mark, 'objective-status')}${control('locate', '定位'+label, glyph('compass'), 'small-action locate-goal').replace('data-ui="locate"',`data-ui="locate" data-item="${id}"`)}</li>`;
  }).join('');
  // 规则页与首次介绍共用事实文案，避免承台耐久变化后仍显示旧的固定次数。
  const tools = `
    <li>${symbol('demolish')}<div><strong>目标标记</strong><p>${MECHANICS.targets.text}点击定位可找到对应目标。</p></div></li>
    <li>${symbol('shovel')}<div><strong>工步</strong><p>${MECHANICS.tools.text}</p></div></li>
    ${discoveryNotes(level,true).filter(note=>!['targets','tools'].includes(note.key)).map(note=>`<li>${symbol(note.icon)}<div><strong>${note.title}</strong><p>${note.text}</p></div></li>`).join('')}
  `;
  openModal(`${cross('关闭本关目标')}<h2>本关目标</h2>
    <ul class="objective-list">${targets}</ul>
    <ul class="objective-tools" aria-label="施工工具">${tools}</ul>
    <div class="system-actions">
      ${paperButton('close', '继续施工', 'shovel', 'gold-button')}
      ${board.reason ? '' : control('show-guide', '重看引导', glyph('retry') + '<span>重看引导</span>')}
    </div>`, '本关目标', 'system-sheet objectives-sheet');
}

function showPause() {
  if (worksite?.busy) return;
  worksite?.cancelPointer();
  openModal(`${cross('关闭暂停')}<h2>暂停施工</h2>
    <div class="system-actions">
      ${paperButton('close', '继续施工', 'shovel', 'gold-button')}
      ${control('restart-ask', '重做本单', glyph('retry') + '<span>重做本单</span>')}
      ${paperButton('settings', '设置', 'gear')}${control('home', '返回工棚', glyph('home') + '<span>返回工棚</span>')}
    </div>`, '暂停施工', 'system-sheet');
}

function showSettings() {
  const toggles = [
    ['music', '背景音乐'], ['effects', '施工音效'], ['motion', '完整动效'],
  ];
  openModal(`<h2>设置</h2>
    <div class="settings-list">${toggles.map(([key, name]) =>
      `<label class="setting"><span>${name}</span><input type="checkbox" data-setting="${key}" ${settings[key] ? 'checked' : ''}></label>`).join('')}</div>
    ${control('from-settings', '返回', glyph('back') + '<span>返回</span>')}`, '设置', 'system-sheet');
}

function showCredits() {
  openModal(`${cross('关闭鸣谢')}<h2>鸣谢</h2><div class="credits-copy">
    <p><b>背景音乐</b><br>RandomMind《Medieval: The Bard’s Tale》</p>
    <p><b>施工与界面音效</b><br>Kenney、TinyWorlds、BMacZero、StarNinjas、qubodup</p>
    <p><b>界面字体</b><br>Noto Serif SC，Noto CJK 项目</p>
    <p>音乐与音效采用 CC0 1.0，字体采用 SIL OFL 1.1。</p>
    </div>`, '鸣谢', 'system-sheet');
}

function showSaveError(error, retry) {
  pendingCommit = retry;
  const layer = openModal(`<h2>工单暂未保存</h2><p class="save-error"></p><div class="system-actions">
    ${paperButton('retry-save', '重试保存', 'contract', 'gold-button')}${control('reload', '重新载入', glyph('retry') + '<span>重新载入</span>')}
    ${control('close', '返回', glyph('back') + '<span>返回</span>')}
  </div>`, '工单暂未保存', 'system-sheet');
  layer.querySelector('.save-error').textContent = error?.message || '设备未能写入存档。';
}

function showBook(tab = bookTab) {
  if (modal?.classList.contains('book-layer')) bookScroll = modal.querySelector('.job-list')?.scrollTop ?? bookScroll;
  bookTab = tab;
  const progress = store.data;
  const selected = LOOKUP[selectedJob] || nextContract(progress) || LEVELS.at(-1);
  selectedJob = selected.id;

  const jobs = LEVELS.map((level, i) => {
    const status = progress.claims[level.id]?.cleared ? 'yes' : unlocked(level, progress) ? 'contract' : 'lock';
    return `${i % 5 === 0 ? `<div class="chapter-heading">${CHAPTERS[Math.floor(i / 5)]}</div>` : ''}<button type="button" class="job-ticket ${level === selected ? 'active' : ''}" data-job="${level.id}"
      aria-current="${level === selected ? 'true' : 'false'}"><span class="job-index">${String(i + 1).padStart(2, '0')}</span>
      <span>${level.title}</span>${symbol(status)}</button>`;
  }).join('');
  const completed = Object.keys(progress.claims).length;
  const detail = `<section class="job-detail">
    <span class="region-name">${selected.region}</span><h3>${selected.title}</h3><p>${selected.brief}</p>
    <div class="detail-symbols">${receiptGoals(selected, initialBoard(selected))}${numberWith(selected.steps, 'shovel')}${numberWith(selected.pay, 'coin')}</div>
    ${unlocked(selected, progress) ? paperButton('open-job', '开工', 'shovel', 'gold-button') : ''}
  </section>`;
  const ledger = `<section class="ledger">
    <div class="ledger-heading"><span>累计回收</span>${numberWith(wallet(progress), 'coin')}<span>${completed} / ${LEVELS.length} 单</span></div>
    <div class="ledger-milestones">${MILESTONES.map(milestone => {
      const ready = wallet(progress) >= milestone.coins;
      return `<div class="milestone ${ready ? 'collected' : ''}">${symbol(milestone.icon)}<div><b>${milestone.name}</b>
      <progress value="${Math.min(wallet(progress), milestone.coins)}" max="${milestone.coins}"></progress></div>
      ${ready ? symbol('yes') : numberWith(milestone.coins, 'coin')}</div>`;
    }).join('')}</div>
    <div class="ledger-lines">${LEVELS.filter(level => progress.claims[level.id]?.cleared).map(level => {
      const claim = progress.claims[level.id];
      return `<div><span>${level.title}</span>${(claim.credited ? numberWith(claim.credited, 'coin') : '<span>已归档</span>')}${claim.bonus ? symbol('yes') : ''}</div>`;
    }).join('')}</div>
    ${progress.history.length ? `<details class="legacy-ledger"><summary>此前回收 · ${progress.history.length} 单 ${numberWith(progress.banked, 'coin')}</summary><p>旧版已交工单与回收金额保留。重构后的工地可重新挑战。</p></details>` : ''}
  </section>`;
  const layer = openModal(`${cross('关闭工棚面板')}
    <div class="book-tabs" role="tablist" aria-label="工棚">
      <button id="tab-jobs" type="button" role="tab" aria-controls="book-content" aria-selected="${tab === 'jobs'}" data-ui="jobs">${symbol('contract')}工单</button>
      <button id="tab-ledger" type="button" role="tab" aria-controls="book-content" aria-selected="${tab === 'ledger'}" data-ui="ledger">${symbol('ledger')}回收账本</button>
    </div><div class="book-content" id="book-content" role="tabpanel" aria-labelledby="tab-${tab}">${tab === 'jobs' ? `<div class="job-list">${jobs}</div>${detail}` : ledger}</div>`,
  '工棚', 'book-layer');
  const list = layer.querySelector('.job-list');
  if (list) {
    list.scrollTop = bookScroll;
    const ticket = list.querySelector('.job-ticket.active');
    if (ticket.offsetTop + ticket.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = ticket.offsetTop + ticket.offsetHeight - list.clientHeight;
    } else if (ticket.offsetTop < list.scrollTop) {
      list.scrollTop = ticket.offsetTop;
    }
  }
}

function showReceipt() {
  if (!worksite || !store.data.active.board.reason) return;
  const { level } = worksite;
  const { board, receipt } = store.data.active;
  const success = board.reason.type === 'success';
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  const campaignComplete = success && !next;
  const lost = level.objects.find(item => item.id === board.reason.id);
  const source = level.objects.find(item => item.id === board.reason.source);
  const nextIcon = level.unlock === 'brace' && receipt?.base ? symbol('brace-icon')
    : next ? receiptGoals(next, initialBoard(next)) : symbol('wall');
  const amount = receipt ? receipt.base + receipt.bonus : 0;
  const pendingRewind = rewindGrant === store.data;
  const offerRewind = canRewindFailure(store.data, level)
    && (pendingRewind || (performance.now() >= nextRewindAt && rewindAd.available()));
  const result = success
    ? `<div class="receipt-goals">${receiptGoals(level, board)}${amount ? numberWith(amount, 'coin') : ''}</div>
       ${receipt?.bonus ? `<div class="bonus-mark">${symbol(level.bonus.icon)}${symbol('yes')}</div>` : ''}`
    : board.reason.type === 'route' && board.turns === 0
      ? `<p class="receipt-reason">工步用尽</p><div class="receipt-goals" aria-label="工步用尽，目标尚未拆完">${numberWith(0, 'shovel')}${symbol('no')}</div>`
      : `<div class="receipt-goals" aria-label="${source ? ITEMS[source.kind] + '影响了' : ''}${lost ? ITEMS[lost.kind] : '委托目标'}">${source ? symbol(source.kind) + glyph('next') : ''}${lost ? symbol(lost.kind) : ''}${symbol('no')}</div>`;
  openModal(`${cross('关闭结算')}${symbol(campaignComplete ? 'wall' : success ? 'yes' : 'no', campaignComplete ? 'result-seal campaign-seal' : 'result-seal')}
      ${result}
      ${offerRewind ? `<div class="receipt-rewind">
        ${control('rewind', pendingRewind ? '继续撤回' : '看广告撤回一步', glyph('video') + `<span>${pendingRewind ? '继续撤回' : '看广告撤回一步'}</span>`)}
        <p class="rewind-status" role="status">${pendingRewind ? '视频已看完，可以继续撤回。' : '看完后恢复最后一步前的工地，每局一次。'}</p>
      </div>` : ''}
      <div class="receipt-nav">
        ${control('home', '返回工棚', glyph('home'), 'small-action')}
        ${control('restart', '再拆一次', glyph('retry'), success ? 'small-action' : 'gold-button icon-action')}
        ${success && next ? control('next', '下一单', `<span class="next-preview">${nextIcon}</span>${glyph('next')}`, 'gold-button icon-action') : ''}
        ${success && !next ? control('jobs-home', '回看工单', symbol('contract') + glyph('next'), 'gold-button icon-action') : ''}
      </div>`, success ? '委托完成' : '委托失败', 'receipt-layer');
}

function applyRewind(snapshot, site) {
  if (snapshot !== store.data || snapshot !== rewindGrant || site !== worksite) return;
  const restored = rewindFailure(snapshot, site.level);
  if (restored === snapshot) return;
  try {
    store.save(restored);
  } catch (error) {
    showSaveError(error, () => applyRewind(snapshot, site));
    return;
  }
  rewindGrant = undefined;
  enter(site.level, true);
  worksite.setCamera(site.camera);
  worksite.showChoice(null, null, ownsBrace(store.data));
  worksite.root.querySelector('.site-pause').focus({ preventScroll: true });
}

async function requestRewind() {
  const site = worksite;
  const snapshot = store.data;
  if (!site || !canRewindFailure(snapshot, site.level) || rewindRequest) return;
  if (rewindGrant === snapshot) return applyRewind(snapshot, site);
  if (performance.now() < nextRewindAt) return;
  const status = modal?.querySelector('.rewind-status');
  if (!status) return;
  const buttons = [...modal.querySelectorAll('button:not(:disabled)')];
  const layer = modal;
  const request = new AbortController();
  rewindRequest = request;
  layer.setAttribute('aria-busy', 'true');
  buttons.forEach(button => { button.disabled = true; });
  status.textContent = '正在等待视频结束…';
  audio.suspended = true;
  audio.sync();

  const result = await rewindAd.watch(request.signal).catch(() => 'unavailable');
  rewindRequest = undefined;
  audio.suspended = false;
  audio.sync();
  if (site !== worksite || layer !== modal || snapshot !== store.data) return;
  layer.removeAttribute('aria-busy');
  buttons.forEach(button => { button.disabled = false; });

  if (result === 'completed' && !request.signal.aborted) {
    nextRewindAt = performance.now() + rewindInterval;
    rewindGrant = snapshot;
    applyRewind(snapshot, site);
  } else {
    status.textContent = result === 'skipped' ? '看完视频才能撤回。'
      : result === 'timeout' ? '视频响应超时，刷新后可再试。'
      : '视频暂不可用，请稍后再试。';
    const button = layer.querySelector('[data-ui="rewind"]');
    button.disabled = !rewindAd.available();
    if (!button.disabled) button.focus({ preventScroll: true });
  }
}

function showReplacement(level) {
  const active = store.data.active;
  if (active && !active.board.reason) {
    if (active.id === level.id) return enter(level, true);
    pendingJob = level;
    openModal(`<h2>换一张工单？</h2><p>当前未交的工单会重置。</p><div class="system-actions">
      ${paperButton('switch-confirm', '换单', 'contract', 'gold-button')}${control('jobs', '返回工单', glyph('back') + '<span>返回工单</span>')}</div>`,
      '换一张工单', 'system-sheet');
  } else enter(level);
}

app.addEventListener('click', event => {
  if (rewindRequest) return;
  const job = event.target.closest('[data-job]');
  if (job) {
    audio.play('tap');
    selectedJob = job.dataset.job;
    showBook('jobs');
    modal.querySelector('[data-job="' + selectedJob + '"]')?.focus({ preventScroll: true });
    return;
  }
  const button = event.target.closest('[data-ui]');
  if (!button || button.disabled) return;
  const action = button.dataset.ui;
  audio.play('tap');
  switch (action) {
    case 'continue': {
      const progress = store.data;
      const active = progress.active;
      const next = nextContract(progress);
      if (active && !active.board.reason) enter(LOOKUP[active.id], true);
      else if (next) enter(next);
      else showBook('jobs');
      break;
    }
    case 'jobs': showBook('jobs'); break;
    case 'ledger': showBook('ledger'); break;
    case 'open-job': showReplacement(LOOKUP[selectedJob]); break;
    case 'switch-confirm': if (pendingJob) enter(pendingJob); break;
    case 'jobs-home': selectedJob = worksite.level.id; workshop(); showBook('jobs'); break;
    case 'settings': showSettings(); break;
    case 'credits': showCredits(); break;
    case 'locate':
      closeModal();
      worksite?.locate(button.dataset.item);
      break;
    case 'show-guide':
      closeModal();
      if (worksite) {
        worksite.guideNotes = [{key:'tools',...MECHANICS.tools},...discoveryNotes(worksite.level,true).filter(note=>note.key!=='tools')];
        worksite.guideIndex = 0;
        worksite.guideEnabled = true;
        worksite.updateGuide();
      }
      break;
    case 'close':
      if (modal?.classList.contains('book-layer')) bookScroll = modal.querySelector('.job-list')?.scrollTop ?? bookScroll;
      closeModal();
      break;
    case 'from-settings': if (worksite) showPause(); else closeModal(); break;
    case 'home': workshop(); break;
    case 'restart': if (worksite) enter(worksite.level); break;
    case 'rewind': requestRewind(); break;
    case 'restart-ask':
      openModal(`<h2>重做本单？</h2><p>工地恢复开工前的样子。</p><div class="system-actions">
      ${control('restart', '重做本单', glyph('retry') + '<span>重做本单</span>', 'gold-button')}
      ${control('pause-again', '取消', glyph('back') + '<span>取消</span>')}</div>`, '重做本单', 'system-sheet');
      break;
    case 'pause-again': showPause(); break;
    case 'next': {
      const level = LEVELS[LEVELS.indexOf(worksite.level) + 1];
      if (level) enter(level);
      break;
    }
    case 'retry-save': {
      const operation = pendingCommit;
      pendingCommit = null;
      closeModal(false);
      operation?.();
      break;
    }
    case 'reload': location.reload(); break;
  }
});

app.addEventListener('change', event => {
  const setting = event.target.dataset.setting;
  if (!setting) return;
  settings[setting] = event.target.checked;
  try { storage.setItem(PREF_KEY, JSON.stringify(settings)); } catch { /* 本窗口继续使用这项设置。 */ }
  audio.sync();
  updateMotion();
});

document.addEventListener('keydown', event => {
  if (rewindRequest) {
    event.preventDefault();
    return;
  }
  audio.unlock();
  if (event.key === 'Escape') {
    if (modal) closeModal();
    else if (worksite && !worksite.busy) showPause();
  }
  if (!modal && worksite && !worksite.busy && !event.repeat) {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
      event.preventDefault();
      siteControl(['arrowleft', 'a'].includes(key) ? 'view-left' : 'view-right');
    } else if (key === '1' || key === '2') siteControl(key === '1' ? 'dig' : 'brace');
    else if (event.code === 'Space') {
      event.preventDefault();
      siteControl('act');
    }
  }
  if (event.key !== 'Tab' || !modal) return;
  const controls = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
  const first = controls[0];
  const last = controls.at(-1);
  if (!first) return;
  if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
document.addEventListener('click', () => audio.unlock(), { capture: true });
document.addEventListener('visibilitychange', () => {
  audio.hidden = document.hidden;
  audio.sync();
  worksite?.cancelPointer();
});
window.addEventListener('blur', () => worksite?.cancelPointer());
window.addEventListener('pagehide', () => rewindRequest?.abort());

const active = store.data.active;
if (location.hash === '#worksite' && active) enter(LOOKUP[active.id], true);
else workshop();
