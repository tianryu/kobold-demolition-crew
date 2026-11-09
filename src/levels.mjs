import { CURATED_LEVELS } from './curated-levels.mjs';
import { DEEP_LEVELS } from './deep-levels.mjs';
import { rebuildChallenges } from './challenge-levels.mjs';
export const LEVELS = [...CURATED_LEVELS, ...DEEP_LEVELS].map(rebuildChallenges);
export const LOOKUP = Object.fromEntries(LEVELS.map(level => [level.id, level]));
export const CHAPTERS = ['旧城连锁', '承台与掩体', '滚道与借力', '水火工地', '全局拆解', '矿柱与地下', '重锤与承重', '弹射与跨层', '竖井与排水', '朽木与连动'];
export const ITEMS = {
  tower: '箭塔', vault: '金库', shed: '废料棚', barrel: '火药桶',
  cargo: '货箱', gate: '废门', cache: '暗仓', iron: '加固门', bulwark: '挡墙', platform: '承台', boulder: '滚石', spring: '泉眼', bellhouse: '钟楼', bridge: '石拱承台', powderhouse: '火药工坊', watertower: '水塔', cottage: '民居', minepier:'矿柱', anvil:'重锤', ramp:'弹射跳板', drain:'排水管', timber:'朽木承台',ledge:'岩层顶板',
};
export const MILESTONES = [
  { coins: 70, name: '施工招牌', icon: 'sign' },
  { coins: 160, name: '完工纪念墙', icon: 'wall' },
];

export function initialBoard(level) {
  return {
    turns: level.steps, extended: false, found: [], bonus: false, reason: null,
    ...(level.plugs ? { tunnel: 0 } : {}),
    objects: Object.fromEntries(level.objects.map(item => [item.id, {
      gone: false, braced: false, side: null, ...(item.armor ? { damage: 0 } : {}),
      ...(item.row ? { row: item.row } : {}), ...(['spring', 'watertower', 'drain'].includes(item.kind) ? { water: null } : {}), ...(['barrel', 'powderhouse'].includes(item.kind) ? { wet: false } : {}),
    }])),
  };
}
