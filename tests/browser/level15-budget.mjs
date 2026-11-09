import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { LEVELS, initialBoard } from '../../src/levels.mjs';
import { resolveMove } from '../../src/rules.mjs';
import { createStore, startContract, finishMove, SAVE_KEY, PREF_KEY, wallet } from '../../src/save.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: false, args: ['--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const base = process.env.BASE_URL || 'http://127.0.0.1:4176/';
const level = LEVELS[14];
const proofs = JSON.parse(readFileSync(new URL('../fixtures/curated-proofs.json', import.meta.url)));
const prefix = [{ kind: 'dig', id: 'middle', side: 'left' }, { kind: 'brace', id: 'cargo' },
  { kind: 'dig', id: 'start', side: 'right' }, { kind: 'brace', id: 'cargo' }];
const final = { kind: 'dig', id: 'finish', side: 'left' };
function seeded() {
  const data = createStore({ getItem: () => null, setItem: () => {} }).data;
  data.claims = Object.fromEntries(LEVELS.slice(0, 14).map(l => [l.id,
    { cleared: true, bonus: false, best: proofs[l.id].shortest, credited: l.pay }]));
  return startContract(data, level);
}
function oldFailure() {
  const data = seeded(), old = { ...level, steps: 4, revision: 2 };
  let board = initialBoard(old);
  for (const action of prefix) board = resolveMove(old, board, action, true).board;
  assert.equal(board.reason.type, 'route'); assert.equal(board.turns, 0);
  data.active = { id: old.id, layoutRevision: old.revision, board, receipt: null };
  return data;
}
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const idle = page => page.waitForFunction(() => !document.querySelector('.worksite').classList.contains('working'));
async function act(page, action, touch, width) {
  const activate = node => touch ? node.tap() : node.click();
  await activate(page.locator(`[data-control=${action.kind === 'brace' ? 'brace' : 'dig'}]`));
  const target = page.locator(`[data-move=${action.kind}][data-item=${action.id}]${action.side ? `[data-side=${action.side}]` : ''}`);
  for (let i = 0; await target.isDisabled() && i < 12; i++) {
    const b = await target.boundingBox(), side = b.x + b.width / 2 < width / 2 ? 'left' : 'right';
    await activate(page.locator(`[data-control=view-${side}]`));
  }
  await activate(target);
  if (touch) await page.locator('.action-main').tap(); else await page.keyboard.press('Space');
  await idle(page);
}
try {
  for (const [width, height, touch, legacy] of [[1920, 1080, false, true], [393, 852, true, true], [1280, 720, false, false]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const initial = legacy ? oldFailure() : seeded();
    await context.addInitScript(({ initial, key, pref }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(initial));
      localStorage.setItem(pref, JSON.stringify({ music: false, effects: false, motion: true }));
    }, { initial, key: SAVE_KEY, pref: PREF_KEY });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    try {
      await page.goto(base + '#worksite', { waitUntil: 'networkidle' });
      if (!touch) {
        const safe = await page.locator('[data-id=safe]').boundingBox();
        assert.ok(safe.x >= 0 && safe.x + safe.width <= width, '右缘大金库不得被裁掉');
      }
      if (legacy) {
        assert.equal(await page.getByRole('dialog', { name: '委托失败', exact: true }).count(), 0);
        assert.equal(await page.locator('.turns b').textContent(), '1');
        assert.equal(await page.locator('[data-id=cargo]').evaluate(n => n.classList.contains('braced')), true);
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('.turns b').textContent(), '1', '重复刷新不能累加工步');
        await page.waitForTimeout(300);
        await page.screenshot({ path: fileURLToPath(new URL(`../../docs/qa/15关-恢复现场-${width}.png`, import.meta.url)) });
      } else {
        assert.equal(await page.locator('.turns b').textContent(), '5');
        for (const action of prefix) await act(page, action, touch, width);
        assert.equal(await page.locator('.turns b').textContent(), '1');
        assert.equal(await page.getByRole('dialog').count(), 0, '补架后不会立即判负');
      }
      await act(page, final, touch, width);
      await page.getByRole('dialog', { name: '委托完成', exact: true }).waitFor();
      const data = await read(page);
      assert.equal(data.active.layoutRevision, 3); assert.equal(data.active.board.turns, 0);
      assert.equal(data.active.board.objects.door.gone, true); assert.equal(data.active.board.objects.cargo.gone, false);
      assert.equal(data.active.board.objects.safe.gone, false); assert.equal(wallet(data) - wallet(initial), level.pay);
      await page.waitForTimeout(300);
      await page.screenshot({ path: fileURLToPath(new URL(`../../docs/qa/15关-补架后通关-${width}.png`, import.meta.url)) });
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(wallet(await read(page)), wallet(data), '刷新结算不重复领取');
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, height, touch, oldFailedSave: legacy, restoredTurns: 1, finishAfterRebrace: true, creditedOnce: level.pay, errors }));
    } finally { await context.close(); }
  }

  // 预算失败应直接告诉玩家缺工步，不能让目标图标冒充损坏原因。
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage(), data = seeded();
    let board = initialBoard(level);
    for (const action of prefix) board = resolveMove(level, board, action, true).board;
    board.reason = { type: 'route', id: 'door', source: null }; board.turns = 0;
    const failed = finishMove(data, level, board);
    await context.addInitScript(({ failed, key }) => localStorage.setItem(key, JSON.stringify(failed)), { failed, key: SAVE_KEY });
    await page.goto(base + '#worksite', { waitUntil: 'networkidle' });
    assert.equal(await page.getByLabel('工步用尽，目标尚未拆完', { exact: true }).count(), 1);
    await page.waitForTimeout(300);
    await page.screenshot({ path: fileURLToPath(new URL('../../docs/qa/工步耗尽-明确原因.png', import.meta.url)) });
    await context.close();
  }
} finally { await browser.close(); }
