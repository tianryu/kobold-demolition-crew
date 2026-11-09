import assert from 'node:assert/strict';
import { LEVELS } from '../../src/levels.mjs';
import { resolveMove } from '../../src/rules.mjs';
import { createStore, PREF_KEY, SAVE_KEY, startContract } from '../../src/save.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false });
const level = LEVELS[2];
const progress = startContract({ ...createStore({ getItem: () => null }).data,
  claims: Object.fromEntries(LEVELS.slice(0, 2).map(job => [job.id, { cleared: true, best: job.steps, bonus: false, credited: job.pay }]))
}, level);
for (const action of [{ kind: 'brace', id: 'cargo' }, { kind: 'dig', id: 'start', side: 'left' }]) {
  progress.active.board = resolveMove(level, progress.active.board, action, true).board;
}
const url = (process.env.BASE_URL || 'http://127.0.0.1:4176/') + '#worksite';

try {
  for (const [width, height, mockHost] of [[1280, 720, false], [1280, 720, true], [640, 360, true], [393, 852, true]]) {
    const touch = width < 700;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const act = target => touch ? target.tap() : target.click();
    await page.addInitScript(({ progress, save, pref, mockHost }) => {
      if (!localStorage.getItem(save)) localStorage.setItem(save, JSON.stringify(progress));
      localStorage.setItem(pref, JSON.stringify({ motion: false, music: false, effects: false }));
      localStorage.setItem('kobold-crew.budget-guide.v1', 'seen');
      if (!mockHost) return;
      let close;
      window.adFixture = { shows: 0, finish(result) { const cb = close; cb?.(result); cb?.(result); } };
      window.tap = { createRewardedVideoAd: () => ({
        show: async () => { window.adFixture.shows++; },
        load: async () => {},
        onClose: callback => { close = callback; },
        offClose: () => { close = undefined; },
        onError() {}, offError() {}, destroy() {},
      }) };
    }, { progress, save: SAVE_KEY, pref: PREF_KEY, mockHost });
    if (mockHost) await page.route('**/src/ad-config.mjs', route => route.fulfill({
      contentType: 'text/javascript', body: "export const rewindAdUnitId = 'isolated-browser-fixture';",
    }));
    await page.clock.install();
    await page.goto(url);
    const site = page.locator('.worksite:not(.departing)');
    const offer = page.getByRole('button', { name: '看广告撤回一步' });
    const failed = page.getByRole('dialog', { name: '委托失败' });
    const readSave = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    const failMove = async () => {
      const target = site.locator('[data-move="dig"][data-item="bell"][data-side="left"]');
      while (await target.isDisabled()) await act(site.locator('[data-control="view-right"]'));
      await act(target);
      await act(site.locator('.action-main'));
      await failed.waitFor();
    };
    try {
      await failMove();
      assert.equal(await offer.count(), 0, '开局一分钟内隐藏入口');
      await page.clock.fastForward(61_000);
      await act(failed.getByRole('button', { name: '关闭结算' }));
      await act(site.locator('.action-main'));
      await failed.waitFor();
      if (!mockHost) {
        assert.equal(await offer.count(), 0, '普通网页隐藏入口');
      } else {
        const box = await offer.boundingBox();
        assert.ok(box && box.height >= 44 && box.x >= 0 && box.x + box.width <= width && box.y + box.height <= height);
        const failureSave = await readSave();
        await act(offer);
        assert.equal(await failed.getByRole('button', { name: '再拆一次' }).isDisabled(), true);
        assert.deepEqual(await readSave(), failureSave, '展示完成不发奖');
        await page.evaluate(() => window.adFixture.finish({ isEnded: false }));
        await failed.getByText('看完视频才能撤回。', { exact: true }).waitFor();
        assert.deepEqual(await readSave(), failureSave);
        await act(offer);
        await page.evaluate(() => window.adFixture.finish({ isEnded: true }));
        await failed.waitFor({ state: 'hidden' });
        const restored = await readSave();
        assert.deepEqual(restored.active.board, progress.active.board);
        assert.equal(restored.active.rewindUsed, true);
        assert.deepEqual(restored.claims, progress.claims);
        assert.equal(restored.revision, failureSave.revision + 1);
        await failMove();
        assert.equal(await offer.count(), 0, '一局只可回撤一次');
      }
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, height, mockHost, verified: true }));
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
