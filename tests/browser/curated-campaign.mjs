import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS, initialBoard } from '../../src/levels.mjs';
import { resolveMove } from '../../src/rules.mjs';
import { LEGACY_CATALOG } from '../../src/legacy-catalog.mjs';
import { SAVE_KEY, PREF_KEY, wallet, createStore, startContract } from '../../src/save.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const from=Number(process.env.CAMPAIGN_FROM||0),to=Number(process.env.CAMPAIGN_TO||LEVELS.length);
const motion=process.env.CAMPAIGN_MOTION!=='false';
const proofs = JSON.parse(readFileSync(new URL('../fixtures/curated-proofs.json', import.meta.url)));
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: false, args: ['--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4176/';
async function campaign(width, height, touch) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  await context.addInitScript(({pref,motion}) => {
    localStorage.setItem(pref, JSON.stringify({ motion, music: false, effects: false }));
    localStorage.setItem('kobold-crew.budget-guide.v1','seen');
  }, {pref:PREF_KEY,motion});
  if(from){const data=createStore({getItem:()=>null,setItem:()=>{}}).data;data.claims=Object.fromEntries(LEVELS.slice(0,from).map(l=>[l.id,{cleared:true,bonus:false,best:proofs[l.id].shortest,credited:l.pay}]));const seeded=startContract(data,LEVELS[from]);await context.addInitScript(({seeded,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seeded));},{seeded,key:SAVE_KEY});}
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const site = page.locator('.worksite:not(.departing)');
  const activate = node => touch ? node.tap() : node.click();
  const button = name => page.getByRole('button', { name, exact: true });
  let pans = 0, actions = 0;
  try {
    await page.goto(baseURL+(from?'#worksite':''), { waitUntil: 'networkidle' });
    if(!from){await activate(button('第一次开工'));assert.equal(await site.locator('.action-main').isDisabled(),true,'不预选答案');}
    for (const [index, level] of [...LEVELS.entries()].slice(from,to)) {
      let board = initialBoard(level);
      const guide=site.locator('.guide-panel.visible [data-control=hide-guide]');
      if(await guide.count())await activate(guide);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).active.id, SAVE_KEY), level.id);
      const hud = await site.locator('.job-hud').boundingBox();
      assert.ok(hud.x + hud.width <= width - 72, '平台退出区域');
      if (!touch) {
        const clipped = await site.locator('.entity').evaluateAll(nodes => nodes.filter(node => {
          const r = node.getBoundingClientRect();
          return r.left < -.1 || r.right > innerWidth + .1 || r.top < -.1;
        }).map(node => ({id:node.dataset.id,rect:node.getBoundingClientRect().toJSON(),unit:node.closest('.worksite').style.getPropertyValue('--u'),center:node.closest('.worksite').style.getPropertyValue('--center')})));
        assert.deepEqual(clipped, [], `${index + 1}关完整建筑应在PC视口内`);
      }
      for (const [step, action] of proofs[level.id].route.entries()) {
        const expected = resolveMove(level, board, action, true); assert.ok(!expected.error); board = expected.board;
        await activate(site.locator(`[data-control=${action.kind === 'brace' ? 'brace' : 'dig'}]`));
        const target = site.locator(`[data-move=${action.kind}]${action.id && action.id !== 'extension' ? `[data-item=${action.id}]` : ''}${action.side ? `[data-side=${action.side}]` : ''}`);
        for (let i = 0; await target.isDisabled() && i < 20; i++) {
          const box = await target.boundingBox(); const dir = box.x + box.width / 2 < width / 2 ? 'left' : 'right';
          const nav = site.locator(`[data-control=view-${dir}]`); assert.ok(await nav.isEnabled()); await activate(nav); pans++;
        }
        const box = await target.boundingBox(); assert.ok(box.width >= 43.99 && box.height >= 43.99);
        await activate(target);
        if (touch) await site.locator('.action-main').tap(); else await page.keyboard.press('Space');
        await page.waitForFunction(() => !document.querySelector('.worksite:not(.departing)').classList.contains('working'));
        assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).active.board, SAVE_KEY), board, `${index + 1}:${step}快照`);
        actions++;
        if ([7, 16, 24, 27, 34, 41, 48].includes(index) && step === proofs[level.id].route.length - 2) {
          await page.reload({ waitUntil: 'networkidle' });
          assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).active.board, SAVE_KEY), board);
        }
      }
      if([25,27,35,39,41,45,49].includes(index)){await page.waitForTimeout(250);await page.screenshot({path:`/tmp/kobold-new-${width}-${index+1}.png`});}
      assert.equal(board.reason.type, 'success'); await page.getByRole('dialog', { name: '委托完成', exact: true }).waitFor();
      console.log(`${width} ${index + 1}/${LEVELS.length} ${level.title} ${proofs[level.id].shortest}步`);
      if (index < to-1) await activate(button('下一单'));
    }
    if(to<LEVELS.length){assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,touch,from:from+1,to,actions,pans,errors}));return;}
    await activate(button('回看工单'));
    assert.equal(await page.locator('.job-list .job-ticket').count(), LEVELS.length);
    assert.equal(await page.locator('.chapter-heading').count(), 10);
    await activate(page.getByRole('tab', { name: '回收账本' }));
    assert.match(await page.locator('.ledger-heading').textContent(), /50 \/ 50/);
    const data = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    assert.equal(wallet(data), LEVELS.reduce((sum, level) => sum + level.pay, 0));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, height, touch, completed: LEVELS.length-from, fullMotion: motion, actions, pans, wallet: wallet(data), errors }));
  } catch (error) { await page.screenshot({ path: `/tmp/kobold-curated-fail-${width}.png` }); throw error; }
  finally { await context.close(); }
}
async function migration() {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 } });
  const page = await context.newPage();
  const old = { version: 1, revision: 17, claims: Object.fromEntries(LEGACY_CATALOG.map(l => [l.id, { cleared: true, bonus: Boolean(l.bonus), best: l.steps }])),
    active: { id: 'deep-three-plus-two', board: { turns: 3 }, receipt: null } };
  await context.addInitScript(({ key, old, pref }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(old));
    localStorage.setItem(pref, JSON.stringify({ motion: false, music: false, effects: false }));
  }, { key: SAVE_KEY, old, pref: PREF_KEY });
  try {
    await page.goto(baseURL + '#worksite', { waitUntil: 'networkidle' });
    assert.match(await page.locator('.storage-note').textContent(), /更新为50单/);
    assert.equal(await page.locator('.workshop-balance b').textContent(), '34170');
    await page.getByRole('button', { name: '回收账本', exact: true }).click();
    assert.match(await page.locator('.ledger-heading').textContent(), /3 \/ 50/);
    assert.match(await page.locator('.legacy-ledger').textContent(), /50 单/);
    await page.getByRole('button', { name: '关闭工棚面板', exact: true }).click();
    await page.getByRole('button', { name: '继续施工', exact: true }).click();
    const current = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    assert.equal(current.version, 2); assert.equal(current.active.id, 'structural-29'); assert.equal(current.banked, 34170);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key + '.before-curation')).claims['deep-three-plus-two'].cleared, SAVE_KEY), true);
    console.log('旧五十关存档迁移、34170回收保留、历史账本与新工单接续通过');
  } finally { await context.close(); }
}
try {
  if (process.env.CAMPAIGN_WIDTH) await campaign(Number(process.env.CAMPAIGN_WIDTH), Number(process.env.CAMPAIGN_HEIGHT || 360), process.env.CAMPAIGN_TOUCH!=='false');
  else await Promise.all([campaign(1280, 720, false), campaign(393, 852, true), migration()]);
}
finally { await browser.close(); }
