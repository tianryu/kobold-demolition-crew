import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { LEVELS } from '../../src/levels.mjs';
import { createStore, startContract, SAVE_KEY, PREF_KEY } from '../../src/save.mjs';
import { resolveMove } from '../../src/rules.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: false, args: ['--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const base = process.env.BASE_URL || 'http://127.0.0.1:4176/';
const evidence = new URL('../../docs/qa/', import.meta.url);
await mkdir(evidence, { recursive: true });
const left = '[data-move=dig][data-item=start][data-side=left]';
const right = '[data-move=dig][data-item=start][data-side=right]';

function fixture(index = 2) {
  const data = createStore({ getItem: () => null, setItem: () => {} }).data;
  data.claims = Object.fromEntries(LEVELS.slice(0, index).map(level => [level.id,
    { cleared: true, bonus: false, best: level.steps, credited: level.pay }]));
  return startContract(data, LEVELS[index]);
}

async function open(width, height, touch = false, scale = 1, index = 2) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: scale });
  const initial = fixture(index);
  await context.addInitScript(({ initial, key, pref }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(initial));
    localStorage.setItem(pref, JSON.stringify({ motion: true, effects: false, music: false }));
  }, { initial, key: SAVE_KEY, pref: PREF_KEY });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base + '#worksite', { waitUntil: 'networkidle' });
  await page.bringToFront();
  await page.waitForFunction(() => document.hasFocus());
  // macOS 新建独立 Chrome 窗口的激活动画会产生一次延后的 blur。
  await page.waitForTimeout(600);
  return { context, page, initial, errors };
}
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const activePreview = page => page.locator('.handle.is-previewed');
const waitIdle = page => page.waitForFunction(() => !document.querySelector('.worksite').classList.contains('working'));
async function hover(page, node) {
  await page.mouse.move(5, 200);
  await node.hover();
  await page.waitForFunction(() => Boolean(document.querySelector('.handle.is-previewed')));
}

try {
  for (const [width, height, scale] of [[1280, 720, 1], [1920, 1080, 1], [2560, 1440, 1], [1920, 1080, 2]]) {
    const { context, page, initial, errors } = await open(width, height, false, scale);
    try {
      const target = page.locator(left);
      const metrics = await target.evaluate(handle => {
        const pos = handle.style.getPropertyValue('--pos');
        const foot = [...document.querySelectorAll('.foot')].find(n => n.style.getPropertyValue('--pos') === pos);
        const h = handle.getBoundingClientRect(), f = foot.getBoundingClientRect();
        const points = [[f.left + 2, f.top + 2], [f.right - 2, f.top + 2], [f.left + 2, f.bottom - 2], [f.right - 2, f.bottom - 2]];
        return { hit: [h.width, h.height], foot: [f.width, f.height],
          entireFootClickable: points.every(([x, y]) => handle.contains(document.elementFromPoint(x, y))),
          icon: handle.querySelector('.handle-symbol').clientWidth };
      });
      assert.ok(metrics.entireFootClickable, '土基四角都能命中，无需瞄准铲子图标');
      assert.ok(metrics.hit[0] >= 44 && metrics.hit[1] >= 44);
      assert.ok(metrics.icon >= 26, '桌面铲子随土基尺寸增长');

      await hover(page, target);
      assert.equal(await activePreview(page).getAttribute('data-side'), 'left');
      assert.equal(await target.getAttribute('aria-pressed'), 'false');
      assert.deepEqual(await saved(page), initial, '悬停预览不改存档或工步');
      await page.mouse.move(5, 200);
      assert.equal(await activePreview(page).count(), 0);
      assert.equal(await page.locator('.action-main').isDisabled(), true);
      await target.click({ position: { x: 5, y: 5 } });
      assert.equal(await target.getAttribute('aria-pressed'), 'true', '点土基边缘也能锁定');
      assert.deepEqual(await saved(page), initial, '点击选定仍不施工');
      await hover(page, page.locator(right));
      assert.equal(await activePreview(page).getAttribute('data-side'), 'right');
      await page.mouse.move(5, 200);
      assert.equal(await target.getAttribute('aria-pressed'), 'true', '离开悬停恢复锁定落点');
      assert.equal(await activePreview(page).count(), 0);

      await page.keyboard.press('Tab');
      assert.equal(await page.locator(right).evaluate(n => n === document.activeElement && n.matches(':focus-visible')), true);
      assert.equal(await activePreview(page).getAttribute('data-side'), 'right', 'Tab焦点可以预览');
      const focus = await page.locator(right).evaluate(n => ({ outline: getComputedStyle(n).outlineStyle,
        border: getComputedStyle(n.querySelector('.handle-ring')).borderStyle }));
      assert.equal(focus.outline, 'none'); assert.equal(focus.border, 'dashed', '以土基内描边显示键盘焦点');
      await page.waitForTimeout(250);
      if (scale === 1) await page.screenshot({ path: fileURLToPath(new URL(`PC焦点-${width}x${height}.png`, evidence)) });

      // 焦点预览右脚，锁定仍是左脚；确认必须执行眼前的右脚预览且只执行一次。
      await page.keyboard.press('Space');
      await waitIdle(page);
      const expected = resolveMove(LEVELS[2], initial.active.board, { kind: 'dig', id: 'start', side: 'right' }, true);
      assert.deepEqual((await saved(page)).active.board, expected.board);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, height, scale, ...metrics, hoverReadOnly: true, keyboardPreviewAndCommit: true, errors }));
    } finally { await context.close(); }
  }

  // 鼠标悬停可直接空格确认；暂停/切出窗口清掉临时预览。
  {
    const { context, page, initial, errors } = await open(1920, 1080);
    try {
      await page.locator(left).click();
      await hover(page, page.locator(right));
      await page.keyboard.press('Space');
      await waitIdle(page);
      const expected = resolveMove(LEVELS[2], initial.active.board, { kind: 'dig', id: 'start', side: 'right' }, true);
      assert.deepEqual((await saved(page)).active.board, expected.board, '鼠标预览与空格执行一致');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  {
    const { context, page, initial, errors } = await open(1280, 720);
    try {
      await hover(page, page.locator(left));
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      assert.equal(await activePreview(page).count(), 0);
      await hover(page, page.locator(left));
      await page.keyboard.press('Escape');
      await page.getByRole('dialog', { name: '暂停施工', exact: true }).waitFor();
      assert.equal(await activePreview(page).count(), 0);
      assert.deepEqual(await saved(page), initial);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }

  for (const [width, height] of [[393, 852], [640, 360]]) {
    const { context, page, initial, errors } = await open(width, height, true);
    try {
      const target = page.locator(left);
      const box = await target.boundingBox();
      assert.ok(box.width >= 43.99 && box.height >= 43.99);
      await target.tap();
      assert.equal(await activePreview(page).count(), 0, '触控不触发鼠标临时预览');
      assert.deepEqual(await saved(page), initial);
      await page.screenshot({ path: fileURLToPath(new URL(`PC适配后-触控${width}x${height}.png`, evidence)) });
      await page.locator('.action-main').tap();
      await waitIdle(page);
      const expected = resolveMove(LEVELS[2], initial.active.board, { kind: 'dig', id: 'start', side: 'left' }, true);
      assert.deepEqual((await saved(page)).active.board, expected.board);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, height, touch: true, hit: [box.width, box.height], confirmOnce: true, errors }));
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
