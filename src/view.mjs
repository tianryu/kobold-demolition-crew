import { ITEMS, LEVELS } from './levels.mjs';
import { availability, tunnelDepth, tunnelPlugs, rowOf, isTower, isFrame, hasWater } from './rules.mjs';
import { discoveryNotes, guideStep, jobObjectives } from './guidance.mjs';

const art = new URL('../assets/art/', import.meta.url);
export const image = (name, extra = '') => `<img src="${new URL(name + '.webp', art)}" alt="" draggable="false" ${extra}>`;
export const symbol = (name, className = '') => name === 'demolish'
  ? `<svg aria-hidden="true" class="symbol demolition-badge ${className}" viewBox="0 0 24 24"><path d="m12 1.5 9 5v11l-9 5-9-5v-11Z" fill="#b84d36" stroke="#542b21" stroke-width="1.7"/><circle cx="12" cy="12" r="5.1" fill="none" stroke="#fff0c4" stroke-width="1.8"/><path d="M12 4v5m0 6v5M4 12h5m6 0h5" fill="none" stroke="#fff0c4" stroke-width="1.8"/></svg>`
  : name === 'shield'
  ? `<svg aria-hidden="true" class="symbol shield-badge ${className}" viewBox="0 0 24 24"><path d="M12 2.7 21 6v6.1c0 4.5-3.6 7.8-9 9.7-5.4-1.9-9-5.2-9-9.7V6Z" fill="#8d9a68" stroke="#493924" stroke-width="2"/><path d="m8 12 2.6 2.6 5.5-5.3" fill="none" stroke="#fff0c7" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : image(name, `class="symbol ${className}"`);

export const GLYPHS = {
  pause: '<path d="M9 5v14m6-14v14"/>',
  next: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  retry: '<path d="M5 8a8 8 0 1 1 0 8M5 3v5h5"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 11 9-7 9 7M6 10v10h12V10m-8 10v-6h4v6"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zm12 0c2 1 2 5 0 6m2-8c4 2 4 8 0 10"/>',
  compass: '<path d="M5 5h14v14H5zm3 10 4-6 4 6z"/>',
  details: '<path d="m6 9 6 6 6-6"/>',
};
export const glyph = name => `<svg aria-hidden="true" class="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[name]}</svg>`;

export const prettyItem = kind => kind === 'barrel' ? 'barrel' : kind === 'cache' ? 'cache' : kind;
export const moveKey = action => [action.kind, action.id || '', action.side || ''].join(':');
const getAction = node => ({ kind: node.dataset.move, id: node.dataset.item, side: node.dataset.side });
const pos = (x, row = 0) => `--pos:${x};--row:${row}`;

function goalIcons(level, board) {
  const objectives = jobObjectives(level);
  if (objectives.length > 5 || (matchMedia('(orientation: portrait)').matches && objectives.length > 3)) {
    const goals = level.goals.filter(id => !board.objects[id].gone).length;
    const safe = level.protect.filter(id => !board.objects[id].gone).length;
    return `<span class="goal-total break-goal" aria-label="还需拆除 ${goals} 处"><b>${goals}</b>${symbol(goals ? 'demolish' : 'yes')}</span>
      <span class="goal-total" aria-label="保全 ${safe} 处"><b>${safe}</b>${symbol('shield')}</span>`;
  }
  return objectives.map(({ id, kind, preserve, label }) => {
    const gone = board.objects[id].gone;
    const mark = preserve ? (gone ? 'no' : 'shield') : (gone ? 'yes' : 'demolish');
    return `<span class="goal-token ${preserve ? 'preserve' : 'break-goal'} ${gone ? 'changed' : ''}" aria-label="${label}">${symbol(prettyItem(kind))}${symbol(mark, 'goal-mark')}</span>`;
  }).join('');
}

export function receiptGoals(level, board) {
  return goalIcons(level, board);
}

export class Worksite {
  constructor(level, board, onTarget, onControl, reduced, onInspect) {
    this.level = level;
    this.initial = board;
    this.board = board;
    this.onTarget = onTarget;
    this.onControl = onControl;
    this.onInspect = onInspect;
    this.reduced = reduced;
    this.selected = null;
    this.forecast = null;
    this.inspection = null;
    this.inspectionForecast = null;
    this.tool = 'dig';
    this.guideNotes = discoveryNotes(level);
    this.guideIndex = 0;
    this.minerX = 1.05;
    this.plugs = tunnelPlugs(level);
    this.plugNodes = new Map();
    this.leftEdge = Math.min(1, ...level.objects.map(item => item.x - (item.feet ? .5 : .1)));
    this.rightEdge = Math.max(...level.objects.map(item => item.x + (item.feet ? .5 : .1)), ...this.plugs.map(plug => plug.x));
    this.root = document.createElement('main');
    this.root.className = 'worksite screen';
    this.root.dataset.region = String(LEVELS.indexOf(level));
    this.root.classList.toggle('advanced-site', Boolean(level.advanced));
    this.root.classList.toggle('deep-site', Boolean(level.plugs));
    this.root.classList.toggle('tiered-site', level.objects.some(item => item.row));
    this.root.classList.toggle('underground-site', Boolean(level.underground));
    this.root.style.setProperty('--surface-rows', level.underground || 0);
    this.root.dataset.chapter = String((level.chapter || 1) - 1);
    this.root.style.setProperty('--center', level.objects.length < 4 ? 4.45 : 5.1);
    this.root.innerHTML = `
      <div class="stage">
        <div class="landscape sky"></div><div class="landscape earth"></div>
        <div class="site-world">
        <div class="tunnel"></div><div class="portal at" style="${pos(1.12)}">${image('portal')}</div>
        <div class="props"></div>
        <div class="scuffs"></div><div class="miner at" style="${pos(this.minerX)}">
          ${image('miner', 'class="miner-idle"')}
          ${[1, 2, 3, 4].map(i => image('dig-' + i, `class="miner-frame" data-frame="${i}"`)).join('')}
        </div>
        <div class="effects"></div><div class="targets"></div>
        </div>
        <svg class="trajectory" aria-hidden="true"></svg>
      </div>
      <header class="job-hud">
        <button type="button" class="job-goals" data-control="objectives" aria-haspopup="dialog" aria-label="查看本关目标">
          <span class="contract-num">${symbol('contract')}<b>${String(LEVELS.indexOf(level) + 1).padStart(2, '0')}</b></span>
          <span class="goals"></span>${glyph('details')}
        </button>
        <div class="turns" aria-label="剩余工步"></div>
      </header>
      <aside class="guide-panel" inert>
        <div class="guide-copy" role="status"><b></b><p></p></div>
        <button type="button" data-control="hide-guide" aria-label="收起引导">${glyph('close')}</button>
        <button type="button" class="next-rule" data-control="next-guide" aria-label="下一条特点">${glyph('next')}</button>
      </aside>
      <button type="button" class="site-pause wood-icon" data-control="pause" aria-label="暂停">${glyph('pause')}</button>
      <div class="tool-row">
        <div class="tool-switch" role="group" aria-label="施工工具"></div>
        <button type="button" class="action-main" data-control="act" aria-label="挖这里" disabled>${symbol('shovel')}</button>
        <span class="action-cost" aria-hidden="true"><b>−1</b>${symbol('shovel')}</span>
      </div>
      ${`<nav class="world-nav" aria-label="查看工区" hidden>
        <button type="button" class="wood-icon" data-control="view-left" aria-label="查看左侧工区">${glyph('back')}</button>
        <button type="button" class="wood-icon" data-control="view-right" aria-label="查看右侧工区">${glyph('next')}</button>
      </nav>`}
      <div class="work-hint" aria-hidden="true"></div>
      <div class="sr-only" role="status" aria-live="polite"></div>
    `;
    this.stage = this.root.querySelector('.stage');
    this.props = this.root.querySelector('.props');
    this.targets = this.root.querySelector('.targets');
    this.effects = this.root.querySelector('.effects');
    this.tunnel = this.root.querySelector('.tunnel');
    this.miner = this.root.querySelector('.miner');
    this.svg = this.root.querySelector('.trajectory');
    this.actionButton = this.root.querySelector('.action-main');
    this.guide = this.root.querySelector('.guide-panel');
    this.worldNav = this.root.querySelector('.world-nav');
    this.items = new Map();
    this.handles = [];
    this.createItems();
    if (level.underground) {
      const caves = document.createElement('div'); caves.className = 'mine-caverns';
      caves.innerHTML = Array.from({length:level.underground},(_,row)=>`<div class="mine-room at" style="${pos(0,row)}"></div>`).join('')+'<div class="mine-shaft"></div>';
      this.root.querySelector('.site-world').prepend(caves);
    }
    this.mousePreview = matchMedia('(hover: hover) and (pointer: fine)');
    const inspectMouse = event => {
      const handle = event.target.closest('[data-move]');
      if (event.pointerType !== 'mouse' || !this.mousePreview.matches || this.drag || this.pointer || !handle || handle.disabled) return;
      const action = getAction(handle);
      if (this.inspectionSource !== 'mouse' || !this.inspection || moveKey(this.inspection) !== moveKey(action)) this.onInspect?.(action, 'mouse');
    };
    this.root.addEventListener('pointerover', inspectMouse);
    this.root.addEventListener('pointerout', event => {
      const handle = event.target.closest('[data-move]');
      if (handle && !handle.contains(event.relatedTarget) && this.inspectionSource === 'mouse') this.showInspection(null, null);
    });
    this.root.addEventListener('focusin', event => {
      const handle = event.target.closest('[data-move]');
      if (handle && !handle.disabled && handle.matches(':focus-visible')) this.onInspect?.(getAction(handle), 'keyboard');
    });
    this.root.addEventListener('focusout', event => {
      if (event.target.matches('[data-move]') && this.inspectionSource === 'keyboard') this.showInspection(null, null);
    });
    this.root.addEventListener('click', event => {
      const handle = event.target.closest('[data-move]');
      if (handle) {
        this.onTarget(getAction(handle));
        return;
      }
      const control = event.target.closest('[data-control]');
      if (control && !control.disabled) this.onControl(control.dataset.control);
    });
    this.root.addEventListener('pointerdown', event => {
      const button = event.target.closest('button');
      if (button) this.pointer = { id: event.pointerId, button, x: event.clientX, y: event.clientY };
      else if (!this.busy && this.camera !== undefined) this.drag = { id: event.pointerId, x: event.clientX, camera: this.camera };
    });
    this.root.addEventListener('pointermove', event => {
      // 鼠标在窗口外松开后再移入，也能恢复悬停与拖动，不能留下按住状态。
      if (event.pointerType === 'mouse' && !event.buttons) {
        this.pointer = null;
        this.drag = null;
        inspectMouse(event);
      }
      if (!this.drag || this.drag.id !== event.pointerId || this.busy) return;
      const dx = event.clientX - this.drag.x;
      if (Math.abs(dx) < 10) return;
      this.setCamera(this.drag.camera - dx / this.unit);
      this.showChoice(null, null, this.hasBrace);
    });
    this.root.addEventListener('pointerup', event => {
      this.drag = null;
      if (this.pointer?.id !== event.pointerId) return;
      const { button, x, y } = this.pointer;
      this.pointer = null;
      if (Math.hypot(event.clientX - x, event.clientY - y) > 18 || !button.contains(event.target)) {
        this.ignoreClick = true;
        setTimeout(() => { this.ignoreClick = false; }, 0);
      }
    });
    this.root.addEventListener('pointercancel', () => this.cancelPointer());
    this.root.addEventListener('click', event => {
      if (this.ignoreClick && event.detail) {
        event.stopImmediatePropagation();
        this.ignoreClick = false;
      }
    }, true);
    this.observer = new ResizeObserver(() => {
      this.layoutWorld();
      this.paintHud(this.board);
      this.updateControls(this.hasBrace);
    });
    this.observer.observe(this.root);
  }

  cancelPointer() {
    this.pointer = null;
    this.drag = null;
    if (this.inspection) this.showInspection(null, null);
  }

  // 临时预览和确认使用同一个动作；离开悬停后恢复点击选定的落点。
  get action() { return this.inspection || this.selected; }
  get preview() { return this.inspection ? this.inspectionForecast : this.forecast; }

  destroy() {
    this.observer.disconnect();
  }

  /** 镜头和可施工范围相互独立；作业热区跟随实体尺寸。 */
  layoutWorld() {
    if (!this.worldNav) return;
    const { width, height } = this.root.getBoundingClientRect();
    if (!width || !height) return;
    const portrait = height > width;
    // 使用美术的完整外沿和实际高度取景，不能只把对象中心塞进视口。
    if (!this.worldMetrics) {
      this.worldMetrics = this.level.objects.map(item => {
        const style = getComputedStyle(this.items.get(item.id));
        return { item, halfWidth: Math.max(parseFloat(style.getPropertyValue('--w')) / 2,
          item.feet ? .41 + (this.level.advanced ? .61 : .72) / 2 : 0, item.braceSlot ? 1.33 / 2 : 0),
          rise: (item.row ?? 0) * 1.6 + parseFloat(style.getPropertyValue('--h')) - parseFloat(style.getPropertyValue('--lift')) };
      });
      this.leftEdge = Math.min(.5, ...this.worldMetrics.map(({ item, halfWidth }) => item.x - halfWidth));
      this.rightEdge = Math.max(...this.worldMetrics.map(({ item, halfWidth }) => item.x + halfWidth), ...this.plugs.map(plug => plug.x + .36));
    }
    const span = this.rightEdge - this.leftEdge;
    const maxRise = Math.max(...this.worldMetrics.map(({ rise }) => rise));
    const ground = this.level.underground ? height - (portrait ? 170 : height <= 450 ? 80 : 110)
      : height * (this.root.classList.contains('tiered-site') ? (portrait ? .62 : .68) : .655);
    this.ground = ground;
    if (this.level.underground) this.root.style.setProperty('--ground', ground + 'px');
    const unit = Math.min(width * (portrait ? .165 : .091), height * .15,
      (ground - (portrait ? 170 : 77)) / maxRise,
      !portrait ? (width - 100) / span : Infinity);
    this.unit = Math.max(24, unit);
    this.root.style.setProperty('--u', this.unit + 'px');
    this.root.style.setProperty('--cave-start', this.leftEdge - .5);
    this.root.style.setProperty('--cave-width', span + 1);
    this.root.style.setProperty('--foot-spread', Math.max(0, (46 - this.unit * .82) / 2) + 'px');
    const half = (width - 78) / this.unit / 2;
    this.cameraMin = Math.min(this.leftEdge + half, (this.leftEdge + this.rightEdge) / 2);
    this.cameraMax = Math.max(this.rightEdge - half, this.cameraMin);
    this.cameraHalf = half;
    this.worldNav.hidden = this.cameraMax - this.cameraMin < .1;
    this.setCamera(this.camera ?? this.cameraMin);
    this.layoutHandles();
  }

  layoutHandles() {
    for (const { handle, anchor, action } of this.handles) {
      const style = getComputedStyle(anchor);
      let width = parseFloat(style.width), height = parseFloat(style.height);
      const isEntity = anchor.classList.contains('entity');
      let centerY = parseFloat(style.marginTop) + height * .5;
      if (action.kind === 'cut') { width = Math.min(48,Math.max(this.unit * .62, width * .36)); height = this.unit * 1.18; centerY = -this.unit * .59; }
      // 架撑针对具体作业点，不能让整根横梁的宽热区盖住邻近货箱。
      if(action.kind==='brace'){
        const target=this.level.objects.find(o=>o.id===action.id);
        if(isFrame(target)||target.kind==='drain'){
          width=Math.min(48,width);height=Math.min(48,height);
          centerY=-this.unit*(target.kind==='drain'?1.4:.2);
        }
      }
      const surfaceWidth = action.kind === 'sniff' ? Math.min(width, 44) : width;
      const surfaceHeight = action.kind === 'sniff' ? 44 : height;
      handle.style.setProperty('--surface-width', surfaceWidth + 'px');
      handle.style.setProperty('--surface-height', surfaceHeight + 'px');
      handle.style.setProperty('--target-y', centerY + 'px');
      handle.style.setProperty('--row', anchor.style.getPropertyValue('--row') || 0);
      handle.style.setProperty('--symbol-size', Math.min(40, Math.max(18, surfaceHeight * .46)) + 'px');
    }
  }

  setCamera(x) {
    this.camera = Math.max(this.cameraMin, Math.min(this.cameraMax, x));
    this.root.style.setProperty('--center', this.camera);
  }

  cameraContains(x) {
    return this.camera === undefined || Math.abs(x - this.camera) <= this.cameraHalf + .001;
  }

  moveCamera(direction) {
    const barrier = this.preview?.obstruction;
    if (barrier && !this.cameraContains(barrier.x) && Math.sign(barrier.x - this.camera) === direction) {
      this.setCamera(barrier.x);
      this.updateControls(this.hasBrace);
      return;
    }
    this.setCamera(this.camera + direction * this.cameraHalf * 1.25);
    this.showChoice(null, null, this.hasBrace);
  }

  locate(id) {
    const node = this.items.get(id); if (!node) return;
    this.setCamera(this.level.objects.find(item=>item.id===id).x);
    this.showChoice(null,null,this.hasBrace);
    node.classList.remove('located'); void node.offsetWidth; node.classList.add('located');
    setTimeout(()=>node.classList.remove('located'),1800);
  }

  createItems() {
    for (const item of this.level.objects) {
      const node = document.createElement('div');
      node.className = `entity at ${item.kind}`;
      node.dataset.id = item.id;
      node.style.cssText = pos(item.x, item.row);
      if (isFrame(item)) node.style.setProperty('--span', item.span);
      if (item.kind === 'ramp') node.style.setProperty('--ramp-direction', item.direction || 1);
      const mark = this.level.protect.includes(item.id) ? 'shield'
        : this.level.goals.includes(item.id) ? 'demolish' : '';
      node.dataset.objective = mark === 'shield' ? 'preserve' : mark ? 'demolish' : 'optional';
      node.setAttribute('role','img');
      node.setAttribute('aria-label',`${ITEMS[item.kind]}，${mark === 'shield' ? '必须保全' : mark ? '必须拆除' : '可选物件'}`);
      const alternate = ['vault', 'cache'].includes(item.kind) ? 'vault-open' : 'rubble';
      node.innerHTML = `
        <div class="object-visual">
          ${image(prettyItem(item.kind), 'class="intact"')}
          ${image(alternate, 'class="remnant"')}
          ${item.covered ? image('cache', 'class="cover-cloth"') : ''}
        </div>
        ${mark ? `<span class="object-mark" data-mark="${mark}" aria-hidden="true"><svg class="mark-arrow" width="1" height="1"><path class="arrow-outline"/><path class="arrow-line"/><path class="arrow-head"/></svg><span class="mark-icon">${symbol(mark)}</span></span>` : ''}
        ${item.braceSlot ? image('gantry', 'class="installed-brace"') : ''}
        ${item.braceSlot && this.level.advanced ? `<span class="impact-count" aria-hidden="true"><b></b>${symbol('blast')}</span>` : ''}
        ${item.armor > 1 ? `<span class="armor-count" aria-hidden="true"><b></b>${symbol('blast')}</span>` : ''}
      `;
      this.props.append(node);
      if (hasWater(item)) {
        const water = document.createElement('div');
        water.className = 'water-channel at';
        water.style.cssText = pos(item.x, item.row);
        this.props.prepend(water);
        node.water = water;
      }
      this.items.set(item.id, node);
      if (isTower(item)) {
        for (const side of ['left', 'right']) {
          const footX = item.x + (side === 'left' ? -0.41 : 0.41);
          const foot = document.createElement('span');
          foot.className = 'foot at';
          foot.classList.toggle('diggable', Boolean(item.feet[side]));
          foot.dataset.foot = side;
          foot.style.cssText = pos(footX, item.row);
          foot.innerHTML = image(item.feet[side] ? 'foot' : 'bulwark') + image('socket', 'class="socket"');
          this.props.append(foot);
          node[side + 'Foot'] = foot;
          if (item.feet[side]) this.addHandle({ kind: 'dig', id: item.id, side }, footX, 'foot-handle',
            `挖${ITEMS[item.kind]}${side === 'left' ? '左脚' : '右脚'}`);
        }
      }
      if (item.braceSlot) this.addHandle({ kind: 'brace', id: item.id }, item.x+(isFrame(item)?item.span*.36:0), 'brace-handle', `给${ITEMS[item.kind]}架撑木`);
      if (item.kind === 'minepier') this.addHandle({kind:'cut',id:item.id},item.x,'cut-handle','铲断矿柱');
      if (item.scent) this.addHandle({ kind: 'sniff', id: item.id }, item.x, 'sniff-handle', '闻一闻苫布下的藏货');
    }
    for (const [index, plug] of this.plugs.entries()) {
      const node = document.createElement('span');
      node.className = 'extension-plug at';
      node.style.cssText = pos(plug.x);
      node.innerHTML = image('foot') + image('socket', 'class="socket"');
      this.props.append(node);
      this.plugNodes.set(plug.id, node);
      const action = this.level.plugs ? { kind: 'extend', id: plug.id } : { kind: 'extend' };
      const label = this.level.plugs ? `挖开第 ${index + 1} 段土塞` : '挖开土塞';
      this.addHandle(action, plug.x, 'plug-handle', label);
    }
  }

  addHandle(action, x, css, label) {
    const handle = document.createElement('button');
    handle.className = `handle at ${css}`;
    handle.type = 'button';
    handle.setAttribute('aria-label', label);
    handle.style.cssText = pos(x);
    handle.dataset.move = action.kind;
    if (action.id) handle.dataset.item = action.id;
    if (action.side) handle.dataset.side = action.side;
    handle.innerHTML = `<span class="handle-ring"></span>${symbol(action.kind === 'sniff' ? 'scent' : action.kind === 'brace' ? 'brace-icon' : 'shovel', 'handle-symbol')}`;
    this.targets.append(handle);
    const entity = this.items.get(action.id);
    const anchor = action.kind === 'dig' ? entity[action.side + 'Foot']
      : action.kind === 'extend' ? this.plugNodes.get(action.id || 'extension') : entity;
    this.handles.push({ action, handle, x, anchor });
  }

  paint(board, hasBrace) {
    this.board = board;
    this.layoutWorld();
    for (const item of this.level.objects) {
      const node = this.items.get(item.id);
      const object = board.objects[item.id];
      node.style.setProperty('--row', rowOf(item, object));
      node.classList.toggle('wet', Boolean(object.wet));
      if (node.water) {
        node.water.style.setProperty('--row', rowOf(item, object));
        if (object.water) {
          node.water.style.setProperty('--pos', (object.water.left + object.water.right) / 2);
          node.water.style.setProperty('--water-width', object.water.right - object.water.left);
        }
        node.water.classList.toggle('flowing', Boolean(object.water));
        node.classList.toggle('flowing', Boolean(object.water && !object.gone));
      }
      node.classList.toggle('gone', object.gone);
      const badge=node.querySelector('.object-mark');
      if (badge && node.dataset.objective==='preserve' && badge.dataset.failed!==String(object.gone)) {
        badge.dataset.failed=String(object.gone);
        badge.querySelector('.mark-icon').innerHTML=symbol(object.gone?'no':'shield');
      }
      node.classList.toggle('covered', Boolean(item.covered && !board.found.includes(item.id) && !object.gone));
      node.classList.toggle('braced', object.braced);
      if (item.armor) this.paintArmor(node, item.armor - object.damage, object.damage > 0);
      if (isTower(item)) {
        node.dataset.side = object.side || '';
        node.leftFoot.classList.toggle('removed', object.side === 'left');
        node.rightFoot.classList.toggle('removed', object.side === 'right');
        for (const side of ['left', 'right']) node[side + 'Foot'].classList.toggle('buried', item.x + (side === 'left' ? -.41 : .41) > (this.plugs[tunnelDepth(board)]?.x ?? Infinity));
      }
    }
    this.paintTunnel(tunnelDepth(board));
    this.paintHud(board);
    this.updateControls(hasBrace);
  }

  paintArmor(node, left, dented) {
    node.classList.toggle('dented', dented);
    const counter = node.querySelector('.armor-count b');
    if (counter) counter.textContent = left;
  }

  paintTunnel(depth) {
    this.plugs.forEach((plug, index) => {
      const node = this.plugNodes.get(plug.id);
      node.classList.toggle('removed', index < depth);
      node.classList.toggle('unreached', index > depth);
    });
    this.root.style.setProperty('--frontier', this.plugs[depth]?.x ?? this.rightEdge + 2);
    this.tunnel.style.setProperty('--end', this.plugs[depth]?.x ?? Math.max(9.7, this.rightEdge + .1));
  }

  paintHud(board) {
    const goals = goalIcons(this.level, board);
    if (goals !== this.hudGoals) {
      this.hudGoals = goals;
      this.root.querySelector('.goals').innerHTML = goals;
    }
    if (board.turns !== this.hudTurns) {
      const spent=this.hudTurns!==undefined && board.turns<this.hudTurns;
      this.hudTurns = board.turns;
      const meter=this.root.querySelector('.turns');
      meter.innerHTML = `<span class="turn-label">剩余工步</span><b>${board.turns}</b>${symbol('shovel')}`;
      meter.setAttribute('aria-label',`剩余${board.turns}工步`);
      meter.classList.toggle('low',board.turns<=2);
      if(spent)meter.animate([{scale:'1'},{scale:'1.13',offset:.35},{scale:'1'}],{duration:this.reduced()?100:330});
    }
  }

  updateControls(hasBrace) {
    this.hasBrace = hasBrace;
    const key = this.selected ? moveKey(this.selected) : '';
    const activeKey = this.action ? moveKey(this.action) : '';
    const barrier = this.preview?.obstruction;
    for (const { action, handle, x } of this.handles) {
      const itemState = this.board.objects[action.id];
      const error = availability(this.level, this.board, action, hasBrace);
      const matchesTool = action.kind === 'sniff' || (action.kind === 'extend' && barrier?.kind === 'plug' && barrier.id === (action.id || 'extension'))
        || (action.kind === 'brace') === (this.tool === 'brace');
      const used = action.kind === 'sniff' ? this.board.found.includes(action.id) || itemState.gone
        : action.kind === 'extend' ? error === 'used' : itemState?.gone || (action.kind==='brace'&&itemState?.braced);
      const shown = matchesTool && !used && !this.board.reason && error !== 'blocked';
      handle.disabled = !shown || Boolean(this.busy) || !this.cameraContains(x);
      handle.setAttribute('aria-pressed', String(key === moveKey(action)));
      handle.classList.toggle('shown', shown);
      handle.classList.toggle('is-selected', key === moveKey(action));
      handle.classList.toggle('is-previewed', Boolean(this.inspection && activeKey === moveKey(action)));
      handle.classList.toggle('is-muted', Boolean(this.inspection && key === moveKey(action) && key !== activeKey));
      handle.classList.toggle('is-blocked', false);
    }
    if (this.worldNav && !this.worldNav.hidden) {
      for (const button of this.worldNav.children) {
        const left = button.dataset.control === 'view-left';
        button.disabled = Boolean(this.busy) || (left ? this.camera <= this.cameraMin + .05 : this.camera >= this.cameraMax - .05);
        button.classList.toggle('guide-cue', Boolean(barrier && !this.cameraContains(barrier.x) && (barrier.x < this.camera) === left));
      }
    }
    const switcher = this.root.querySelector('.tool-switch');
    if (hasBrace && !switcher.children.length) {
      switcher.innerHTML = `<button type="button" class="tool wood-icon" aria-label="铲子" data-control="dig">${symbol('shovel')}<span class="tool-name" aria-hidden="true">铲子</span></button>
        <button type="button" class="tool wood-icon" aria-label="撑木" data-control="brace">${symbol('brace-icon')}<span class="tool-name" aria-hidden="true">撑木</span></button>`;
    }
    for (const button of switcher.children) {
      button.setAttribute('aria-pressed', String(button.dataset.control === this.tool));
      button.disabled = Boolean(this.busy) || Boolean(this.board.reason);
    }
    const outcome = this.board.reason;
    this.actionButton.disabled = Boolean(this.busy || (!outcome && (!this.action || this.preview?.error)));
    this.actionButton.classList.toggle('ready', !this.actionButton.disabled);
    this.actionButton.dataset.control = outcome ? 'receipt' : 'act';
    this.actionButton.setAttribute('aria-keyshortcuts', 'Space');
    this.actionButton.setAttribute('aria-label', outcome ? '查看结算' : this.action?.kind === 'sniff' ? '闻一闻' : this.tool === 'brace' ? '架撑木' : '挖这里');
    const icon = outcome ? (outcome.type === 'success' ? 'yes' : 'no') : this.action?.kind === 'sniff' ? 'scent' : this.tool === 'brace' ? 'brace-icon' : 'shovel';
    if (this.actionButton.dataset.icon !== icon) {
      this.actionButton.dataset.icon = icon;
      this.actionButton.innerHTML = symbol(icon);
    }
    const paidAction=this.action && this.action.kind!=='sniff' && !outcome && !this.busy && !this.preview?.error;
    this.root.querySelector('.action-cost').classList.toggle('visible',Boolean(paidAction));
    this.root.querySelector('.action-cost').classList.toggle('last-step',Boolean(paidAction&&this.board.turns===1&&this.preview?.board?.reason?.type!=='success'));
    this.actionButton.setAttribute('aria-description',paidAction?`消耗1工步，剩余${this.board.turns}工步`:'');
    this.drawForecast();
    this.updateGuide();
    this.placeMarkers();
  }

  // 图标只在物件附近避让；箭头端点固定落在物件的可见实体上。
  placeMarkers() {
    const occupied=[];
    const box=this.root.getBoundingClientRect();
    const counters=[...this.root.querySelectorAll('.armor-count,.impact-count.visible')]
      .filter(node=>!node.closest('.entity').classList.contains('gone'));
    const blockers=[this.root.querySelector('.job-hud'),this.guide.classList.contains('visible')?this.guide:null,...counters]
      .filter(Boolean).map(n=>n.getBoundingClientRect());
    const bodies=this.level.objects.filter(o=>!this.board.objects[o.id].gone&&!isFrame(o))
      .map(o=>({id:o.id,rect:this.items.get(o.id).getBoundingClientRect()}));
    for (const item of this.level.objects) {
      const node=this.items.get(item.id),badge=node.querySelector('.object-mark');
      if (!badge) continue;
      const state=this.board.objects[item.id],r=node.getBoundingClientRect();
      const fraction=state.gone?.85:isFrame(item)?.12:item.kind==='tower'?.28:item.kind==='bellhouse'?.16:item.kind==='spring'?.45:.18;
      const tip={x:r.left+r.width*.5,y:r.top+r.height*fraction};
      const outside=!this.cameraContains(item.x)||tip.x<box.left||tip.x>box.right||tip.y<box.top||tip.y>box.bottom;
      badge.classList.toggle('outside',outside);
      if(outside||(state.gone&&node.dataset.objective!=='preserve'))continue;
      const size=badge.getBoundingClientRect().width,d=size*.5+18;
      const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      let best;
      for(const radius of [d,d+18])for(const [vx,vy] of [[0,-1],[-.9,-.65],[.9,-.65],[-1,0],[1,0],[-.7,.75],[.7,.75]]){
        const x=Math.max(box.left+size*.5+5,Math.min(box.right-size*.5-5,tip.x+vx*radius));
        const y=Math.max(box.top+size*.5+5,Math.min(box.bottom-size*.5-5,tip.y+vy*radius));
        const rect={left:x-size*.5,right:x+size*.5,top:y-size*.5,bottom:y+size*.5};
        let score=Math.hypot(x-tip.x,y-tip.y)+Math.max(0,vy)*9;
        score+=occupied.reduce((s,p)=>s+area(rect,p)*20,0)+blockers.reduce((s,p)=>s+area(rect,p)*30,0);
        score+=bodies.filter(b=>b.id!==item.id).reduce((s,b)=>s+area(rect,b.rect)*.6,0);
        for(const t of [.25,.5,.75])for(const b of bodies)if(b.id!==item.id){const px=x+(tip.x-x)*t,py=y+(tip.y-y)*t;if(px>b.rect.left&&px<b.rect.right&&py>b.rect.top&&py<b.rect.bottom)score+=40;}
        if(!best||score<best.score)best={x,y,rect,score};
      }
      occupied.push(best.rect);
      badge.style.left=(best.rect.left-r.left)+'px';badge.style.top=(best.rect.top-r.top)+'px';
      const tx=tip.x-best.rect.left,ty=tip.y-best.rect.top,c=size*.5;
      const length=Math.hypot(tx-c,ty-c)||1,ux=(tx-c)/length,uy=(ty-c)/length;
      const line=`M ${c+ux*size*.45} ${c+uy*size*.45} L ${tx} ${ty}`;
      badge.querySelector('.arrow-outline').setAttribute('d',line);badge.querySelector('.arrow-line').setAttribute('d',line);
      badge.querySelector('.arrow-head').setAttribute('d',`M ${tx} ${ty} L ${tx-ux*7-uy*4.5} ${ty-uy*7+ux*4.5} L ${tx-ux*7+uy*4.5} ${ty-uy*7-ux*4.5} Z`);
      badge.dataset.tipX=String(tip.x-r.left);badge.dataset.tipY=String(tip.y-r.top);
    }
  }

  updateGuide() {
    const step = guideStep(this.level, this.board, this.tool, this.action, this.preview, this.guideIndex, this.guideNotes);
    const show = !this.busy && !this.board.reason && this.guideEnabled && Boolean(step);
    this.guide.inert = !show;
    this.guide.classList.toggle('visible', show);
    if (step) {
      const heading = this.guide.querySelector('b');
      const body = this.guide.querySelector('p');
      if (heading.dataset.rule !== step.key) { heading.innerHTML = symbol(step.icon) + `<span>${step.title}</span>`; heading.dataset.rule = step.key; }
      if (body.textContent !== step.text) body.textContent = step.text;
    }
    this.guide.querySelector('.next-rule').hidden = this.guideNotes.length <= 1;
    if (show) this.placeGuide();
    this.guideTarget?.classList.remove('guide-cue');
    this.guideTarget = step?.cue ? this.root.querySelector(step.cue) : null;
    this.guideTarget?.classList.add('guide-cue');
  }

  // 短横屏在两侧选择遮挡较少的位置，避免引导盖住上层拆除目标。
  placeGuide() {
    const root = this.root.getBoundingClientRect();
    this.guide.style.left = '';
    this.guide.style.right = '';
    if (root.height > 450 || root.height > root.width || !this.level.objects.some(item => item.row)) return;
    const panel = this.guide.getBoundingClientRect();
    const top = panel.top - root.top;
    const left = parseFloat(getComputedStyle(this.root.querySelector('.job-hud')).left) || 16;
    const right = panel.left - root.left;
    const objects = this.level.objects.filter(item => !this.board.objects[item.id].gone).map(item => ({
      rect: this.items.get(item.id).getBoundingClientRect(),
      weight: this.level.goals.includes(item.id) ? 3 : 1,
    }));
    const score = x => objects.reduce((sum, { rect, weight }) => {
      const w = Math.max(0, Math.min(x + panel.width, rect.right - root.left) - Math.max(x, rect.left - root.left));
      const h = Math.max(0, Math.min(top + panel.height, rect.bottom - root.top) - Math.max(top, rect.top - root.top));
      return sum + w * h * weight;
    }, 0);
    if (score(left) + 100 < score(right)) {
      this.guide.style.left = left + 'px';
      this.guide.style.right = 'auto';
    }
  }

  drawForecast() {
    const box = this.root.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const unit = parseFloat(this.root.style.getPropertyValue('--u')) || Math.min(box.width * .091, box.height * .15);
    const center = Number(this.root.style.getPropertyValue('--center'));
    const ground = this.ground ?? box.height * .655;
    const y = row => ground - (row || 0) * 1.6 * unit;
    const x = value => box.width / 2 + (value - center) * unit;
    this.svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const events = this.busy ? [] : (this.preview?.events || []);
    const barrier = !this.busy && this.preview?.obstruction;
    const stop = barrier && this.handles.find(({ action }) => moveKey(action) === moveKey(this.action))?.handle;
    const opened = events.find(event => event.kind === 'extend');
    const danger = this.preview?.board?.reason?.type === 'protect';
    this.root.classList.toggle('forecast-danger', Boolean(danger));
    for (const item of this.level.objects) {
      const node = this.items.get(item.id);
      const hits = events.filter(event => event.id === item.id && ['open', 'break', 'shield', 'explode', 'dent', 'drop', 'roll', 'soak', 'flood'].includes(event.kind));
      node.classList.toggle('forecast-hit', hits.length > 0);
      node.classList.toggle('forecast-protect', events.some(event => event.id === item.id && event.kind === 'brace'));
      const openIndex = opened && this.plugs.findIndex(plug => plug.id === opened.id);
      node.classList.toggle('forecast-access', Boolean(opened && item.x > opened.x && item.x <= (this.plugs[openIndex + 1]?.x ?? Infinity) && (item.feet || item.braceSlot)));
      const impact = node.querySelector('.impact-count');
      if (impact) {
        if (hits.length > 1) impact.querySelector('b').textContent = hits.length;
        impact.classList.toggle('visible', hits.length > 1);
      }
    }
    const arrow = danger ? 'warn-arrow' : 'fall-arrow';
    const stopY = ground + unit * (this.action?.kind === 'extend' ? .70 : this.action?.kind === 'brace' ? -.345 : .105);
    const barrierY = ground + unit * (barrier?.kind === 'plug' ? .79 : -.54);
    const paths = `
      ${events.filter(event => event.kind === 'fall').map(event => {
        const dir = event.side === 'right' ? 1 : -1;
        const start = x(event.x + dir * .13);
        const floor = y(event.row);
        const end = x(event.end);
        return `<path class="fall-guide" d="M ${start} ${floor - unit * 2.28} Q ${x(event.x + dir * 1.25)} ${floor - unit * 2.12}, ${end} ${floor - unit * (event.blockedBy ? 1.4 : .54)}" marker-end="url(#${arrow})"/>`;
      }).join('')}
      ${events.filter(event => event.kind === 'explode').map(event => `<path class="blast-guide" d="M ${x(event.left)} ${y(event.row) - 4} Q ${x(event.x)} ${y(event.row) - unit * 1.1}, ${x(event.right)} ${y(event.row) - 4}"/>`).join('')}
      ${events.filter(event => event.kind === 'roll').map(event => `<path class="roll-guide" d="M ${x(event.x)} ${y(event.row) - unit * .45} L ${x(event.to)} ${y(event.row) - unit * .45}" marker-end="url(#${arrow})"/>`).join('')}
      ${events.filter(event => event.kind === 'launch').map(event => `<path class="launch-guide" d="M ${x(event.x)} ${y(event.row)-unit*.4} Q ${x((event.x+event.to)/2)} ${y(event.toRow)-unit*1.8}, ${x(event.to)} ${y(event.toRow)-unit*.5}" marker-end="url(#${arrow})"/>`).join('')}
      ${events.filter(event => event.kind === 'drop').map(event => `<path class="drop-guide" d="M ${x(event.x)} ${y(event.from) - unit * .4} L ${x(event.x)} ${y(event.row) - unit * .4}" marker-end="url(#${arrow})"/>`).join('')}
      ${events.filter(event => ['flood','drain'].includes(event.kind)).map(event => `${event.kind==='drain'?`<path class="water-guide" d="M ${x(event.x)} ${y(event.from)} L ${x(event.x)} ${y(event.row)}"/>`:''}<path class="water-guide" d="M ${x(event.left)} ${y(event.row) - 3} L ${x(event.right)} ${y(event.row) - 3}"/>`).join('')}
      ${stop ? `<path class="plug-guide" d="M ${x(Number(stop.style.getPropertyValue('--pos')))} ${stopY}
        Q ${x(barrier.x + .65)} ${barrierY + unit * .26}, ${x(barrier.x + .32)} ${barrierY}" marker-end="url(#fall-arrow)"/>
        <circle class="plug-guide" cx="${x(barrier.x)}" cy="${barrierY}" r="${unit * .39}"/>` : ''}
    `;
    if (paths === this.forecastPaths) return;
    this.forecastPaths = paths;
    if (!this.svg.querySelector('defs')) {
      this.svg.innerHTML = `<defs>${[['fall-arrow', '#ffdc80'], ['warn-arrow', '#ffb69a']].map(([id, color]) =>
        `<marker id="${id}" orient="auto" markerWidth="5" markerHeight="5" refX="4" refY="2.5"><path d="M0 0L5 2.5L0 5Z" fill="${color}"/></marker>`).join('')}</defs>`;
    }
    if (this.previewLayer) {
      const previous = this.previewLayer;
      previous.classList.add('guide-out');
      setTimeout(() => previous.remove(), this.reduced() ? 75 : 180);
    }
    this.previewLayer = null;
    if (paths.trim()) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.classList.toggle('danger', Boolean(danger));
      group.innerHTML = paths;
      this.svg.append(group);
      this.previewLayer = group;
    }
  }

  showChoice(action, result, hasBrace) {
    this.selected = action;
    this.forecast = result;
    this.inspection = null;
    this.inspectionForecast = null;
    this.inspectionSource = null;
    this.paintChoiceHint(result);
    this.updateControls(hasBrace);
  }

  showInspection(action, result, source) {
    this.inspection = action;
    this.inspectionForecast = result;
    this.inspectionSource = action ? source : null;
    this.paintChoiceHint(this.preview);
    this.updateControls(this.hasBrace);
  }

  paintChoiceHint(result) {
    const hint = this.root.querySelector('.work-hint');
    hint.className = 'work-hint';
    hint.innerHTML = '';
    if (result?.error) {
      hint.classList.add('visible');
      hint.innerHTML = symbol(result.error === 'blocked' ? 'foot' : 'no')
        + (result.error === 'blocked' ? glyph('next') + symbol('shovel') : '');
    } else if (result?.board?.reason?.type === 'route' && result.board.turns === 0) {
      hint.classList.add('visible');
      hint.innerHTML = `<b>0</b>${symbol('shovel')}${symbol('no')}`;
    } else if (this.level.bonus && !this.board.bonus && result?.board?.bonus) {
      hint.classList.add('visible', 'bonus-hint');
      hint.innerHTML = `<b>${this.level.bonus.amount}</b>${symbol('coin')}`;
    }
    this.root.querySelector('.sr-only[role=status]').textContent = result?.error === 'blocked'
      ? '前方是尚未开挖的土层'
      : result?.board?.reason?.type === 'route' && result.board.turns === 0
        ? '这次施工会用尽工步，目标尚未拆完'
      : result?.board?.reason?.type === 'protect'
        ? (result.events.some(event => event.id === result.board.reason.id && event.kind === 'shield')
          ? '同一轮会撞到货箱两次' : '这一铲会损坏要保护的物件')
        : '';
  }

  async play(events, final, sound, paid) {
    const scratch = structuredClone(this.board);
    const wait = ms => new Promise(resolve => setTimeout(resolve, this.reduced() ? Math.round(ms * .35) : ms));
    for (const event of events) {
      if (this.worldNav && !this.worldNav.hidden && !this.cameraContains(event.x)) {
        this.setCamera(event.x);
        await wait(125);
      }
      const node = this.items.get(event.id);
      const side = event.side === 'left' ? -1 : 1;
      this.effectRow = event.row || 0;
      if (['dig', 'cut', 'extend', 'brace', 'sniff'].includes(event.kind)) {
        const workAt = event.kind === 'dig' ? event.x + side * .42 : event.x;
        if (this.level.underground && (this.minerRow || 0)!==(event.row || 0)) {
          this.miner.style.setProperty('--pos',this.leftEdge-.2);
          this.minerX=this.leftEdge-.2;
          await wait(100);
          this.miner.style.setProperty('--row',event.row || 0);
          this.minerRow=event.row || 0;
          await wait(100);
        }
        this.miner.style.setProperty('--face', workAt < this.minerX ? -1 : 1);
        this.minerX = workAt;
        this.miner.style.setProperty('--pos', workAt);
        this.miner.style.setProperty('--row', event.row || 0);
        await wait(110);
      }
      switch (event.kind) {
        case 'dig':
        case 'cut':
        case 'extend': {
          this.miner.dataset.digging = 'true';
          for (const frame of [1, 2, 3, 4]) {
            this.miner.dataset.frame = frame;
            if (frame === 2) {
              sound('dig');
              this.effect('dust', event.x + (event.kind === 'dig' ? side * .42 : 0), event.kind==='cut'?-.56:.38, 'ground-dust');
              if (event.kind === 'extend') {
                this.paintTunnel(tunnelDepth(final));
              } else if (event.kind === 'dig') {
                node[event.side + 'Foot'].classList.add('removed');
              }
            }
            await wait(frame === 2 ? 95 : 47);
          }
          delete this.miner.dataset.digging;
          break;
        }
        case 'fall':
          node.style.setProperty('--rotation', `${side * (event.blockedBy ? 48 : 85)}deg`);
          node.dataset.side = event.side;
          node.classList.add('tipping');
          if (event.source) sound('crack');
          await wait(430);
          node.classList.add('gone');
          node.classList.remove('tipping');
          node[event.side + 'Foot'].classList.add('removed');
          this.effect('dust', event.x + side * 1.12, -.03, 'impact-dust');
          sound('fall');
          this.shake();
          await wait(65);
          break;
        case 'open':
          node.classList.add('gone');
          node.classList.remove('covered');
          this.effect('dust', event.x, -.2, 'impact-dust');
          if (paid) {
            for (let i = 0; i < 5; i++) this.effect('coin', event.x, -.55, 'flying-coin', i);
            sound('coin');
          } else {
            sound('crack');
            if (final.reason?.type === 'protect') this.effect('no', event.x, -.83, 'rising-mark');
          }
          await wait(270);
          break;
        case 'drop': {
          node.style.setProperty('--row', event.row);
          const fall = node.animate([{ translate: `0 ${-(event.from - event.row) * 1.6 * this.unit}px`, opacity: 1 }, { translate: '0 0', opacity: .1 }], { duration: this.reduced() ? 100 : 450, easing: 'cubic-bezier(.6,.04,.9,.5)' });
          await fall.finished;
          node.classList.add('gone');
          this.effect('dust', event.x, -.2, 'impact-dust');
          sound('fall');
          break;
        }
        case 'roll': {
          const distance = (event.to - event.x) * this.unit;
          const ball = node.querySelector('.intact');
          await ball.animate([{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: `${distance}px 0`, rotate: `${(event.to - event.x) * 100}deg`, opacity: .1 }], { duration: this.reduced() ? 120 : 540, easing: 'ease-in' }).finished;
          node.classList.add('gone');
          this.effect('dust', event.to, -.1, 'impact-dust');
          sound('fall');
          break;
        }
        case 'launch': {
          node.classList.add('gone');
          const ball=document.createElement('span'); ball.className='launched-stone at'; ball.style.cssText=pos(event.x,event.row); ball.innerHTML=image('boulder'); this.effects.append(ball);
          const dx=(event.to-event.x)*this.unit;
          await ball.animate([{translate:'0 0',opacity:1},{translate:`${dx*.5}px ${-this.unit*2.7}px`,opacity:1,offset:.5},{translate:`${dx}px ${-this.unit*1.6}px`,opacity:0}],{duration:this.reduced()?130:480,easing:'ease-in-out'}).finished;
          ball.remove(); sound('brace'); break;
        }
        case 'rot': node.classList.add('wet'); sound('crack'); await wait(110); break;
        case 'drain':
          node.classList.add('flowing');
          node.water?.style.setProperty('--pos',(event.left+event.right)/2);
          node.water?.style.setProperty('--water-width',event.right-event.left); node.water?.classList.add('flowing');
          sound('sniff'); await wait(200); break;
        case 'flood':
          node.classList.add('gone');
          node.water?.style.setProperty('--row', event.row);
          node.water?.style.setProperty('--pos', (event.left + event.right) / 2);
          node.water?.style.setProperty('--water-width', event.right - event.left);
          node.water?.classList.add('flowing');
          sound('sniff');
          await wait(250);
          break;
        case 'soak':
          node.classList.add('wet');
          sound('sniff');
          await wait(110);
          break;
        case 'break':
          node.classList.add('gone');
          node.classList.remove('covered');
          this.effect('dust', event.x, -.16, 'impact-dust');
          sound('crack');
          await wait(155);
          break;
        case 'dent':
          this.paintArmor(node, event.left, true);
          this.effect('dust', event.x, -.52, 'impact-dust');
          sound('fall');
          await wait(210);
          break;
        case 'explode':
          node.classList.add('gone');
          this.effect('blast', event.x, -.32, 'explosion');
          this.effect('dust', event.x + .42, -.06, 'impact-dust');
          this.effect('dust', event.x - .46, -.08, 'impact-dust');
          sound('blast');
          this.shake();
          await wait(280);
          break;
        case 'brace':
          node.classList.add('braced');
          sound('brace');
          this.effect('yes', event.x, -.95, 'rising-mark');
          await wait(230);
          break;
        case 'shield':
          node.classList.remove('braced');
          this.effect('brace-icon', event.x, -.38, 'brace-splinter');
          this.effect('yes', event.x, -.94, 'rising-mark');
          sound('brace');
          await wait(155);
          break;
        case 'sniff':
          node.classList.remove('covered');
          this.effect('scent', event.x, -.75, 'rising-mark');
          this.effect('coin', event.x, -1.12, 'rising-mark');
          sound('sniff');
          await wait(385);
          break;
      }
      if (event.id && ['fall', 'open', 'break', 'explode', 'drop', 'roll', 'flood'].includes(event.kind)) scratch.objects[event.id].gone = true;
      if (['dig', 'cut', 'extend', 'brace'].includes(event.kind)) scratch.turns = final.turns;
      this.paintHud(scratch);
    }
    if (events.some(event => event.kind === 'open')) await wait(130);
  }

  shake() {
    if (this.reduced()) return;
    this.stage.animate([{ translate: '0 0' }, { translate: '3px 1px' }, { translate: '-2px 0' }, { translate: '0 0' }], { duration: 160 });
  }

  effect(name, x, y, css, index = 0) {
    const node = document.createElement('span');
    node.className = `effect at ${css}`;
    node.style.cssText = `${pos(x, this.effectRow)};--dy:${y};--i:${index};--travel:${1.12 - x}`;
    node.innerHTML = image(name);
    this.effects.append(node);
    setTimeout(() => node.remove(), 1150);
  }

  flagFailure(reason) {
    if (reason?.type!=='protect'||!reason.id) return;
    this.items.get(reason.id)?.classList.add('failure-target');
    this.items.get(reason.source)?.classList.add('failure-source');
  }
}
