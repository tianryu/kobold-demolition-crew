import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardedAd } from '../src/rewarded-ad.mjs';
import { LEVELS, initialBoard } from '../src/levels.mjs';
import { resolveMove } from '../src/rules.mjs';
import { canRewindFailure, createStore, decodeProgress, finishMove, rewindFailure, startContract } from '../src/save.mjs';

function videoFixture(show = async () => {}) {
  const close = new Set();
  const errors = new Set();
  let destroyed = 0;
  const ad = {
    show,
    load: async () => {},
    onClose: callback => close.add(callback),
    offClose: callback => close.delete(callback),
    onError: callback => errors.add(callback),
    offError: callback => errors.delete(callback),
    destroy: () => { destroyed++; },
  };
  return {
    ad,
    close,
    errors,
    get destroyed() { return destroyed; },
    getPlatform: () => ({ createRewardedVideoAd: ({ adUnitId }) => {
      assert.equal(adUnitId, 'isolated-fixture');
      return ad;
    } }),
  };
}

test('只有完整观看标记发出回撤资格，展示、提前关闭和重复关闭各自独立', async () => {
  const fixture = videoFixture();
  const rewarded = createRewardedAd('isolated-fixture', fixture.getPlatform);
  const showing = rewarded.watch();
  assert.equal(await rewarded.watch(), 'unavailable');
  const [oldClose] = fixture.close;
  oldClose(undefined);
  assert.equal(await showing, 'skipped');
  assert.equal(fixture.close.size, 0);
  const next = rewarded.watch();
  oldClose({ isEnded: true });
  const [activeClose] = fixture.close;
  activeClose({ isEnded: true });
  activeClose({ isEnded: true });
  assert.equal(await next, 'completed');
  assert.equal(fixture.destroyed, 2);
  assert.equal(fixture.errors.size, 0);
});

test('广告加载失败、页面退出和超时都清理监听并且不发奖', async () => {
  const failed = videoFixture(async () => { throw Error('no ad'); });
  assert.equal(await createRewardedAd('isolated-fixture', failed.getPlatform).watch(), 'unavailable');
  assert.equal(failed.destroyed, 1);
  const delayed = videoFixture();
  const rewarded = createRewardedAd('isolated-fixture', delayed.getPlatform, 15);
  const pending = rewarded.watch();
  const [lateClose] = delayed.close;
  assert.equal(await pending, 'timeout');
  lateClose({ isEnded: true });
  assert.equal(delayed.close.size, 0);
  assert.equal(await rewarded.watch(), 'unavailable');
  const aborted = videoFixture();
  const controller = new AbortController();
  const leaving = createRewardedAd('isolated-fixture', aborted.getPlatform).watch(controller.signal);
  controller.abort();
  assert.equal(await leaving, 'aborted');
  assert.equal(aborted.errors.size, 0);
});

test('回撤从持久存档恢复最后一步前的施工，失败原因与每局次数随存档保留', () => {
  const level = LEVELS[2];
  const claims = Object.fromEntries(LEVELS.slice(0, 2).map(job => [job.id, {
    cleared: true, best: job.steps, bonus: false, credited: job.pay,
  }]));
  const progress = startContract({ ...createStore({ getItem: () => null }).data, claims }, level);
  const actions = [{ kind: 'brace', id: 'cargo' }, { kind: 'dig', id: 'start', side: 'left' }];
  const before = actions.reduce((board, action) => resolveMove(level, board, action, true).board, initialBoard(level));
  progress.active.board = before;
  const accident = { kind: 'dig', id: 'bell', side: 'left' };
  const failed = finishMove(progress, level, resolveMove(level, before, accident, true).board);
  assert.equal(failed.active.board.reason.type, 'protect');
  const reloaded = decodeProgress(JSON.stringify(failed));
  assert.equal(canRewindFailure(reloaded, level), true);
  const restored = rewindFailure(reloaded, level);
  assert.deepEqual(restored.active.board, before);
  assert.deepEqual(restored.claims, claims);
  assert.equal(restored.active.rewindUsed, true);
  assert.equal(rewindFailure(restored, level), restored);
  const again = finishMove(restored, level, resolveMove(level, before, accident, true).board);
  assert.equal(canRewindFailure(decodeProgress(JSON.stringify(again)), level), false);
  assert.equal(startContract(again, level).active.rewindUsed, undefined);
});
