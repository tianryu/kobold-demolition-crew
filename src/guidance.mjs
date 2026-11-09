import { ITEMS, LEVELS } from './levels.mjs';

// 规则卡只解释对象的能力，不引用关卡物件ID、左右顺序或某条解法。
export const MECHANICS = {
  targets: {title:'工地标记',icon:'demolish',text:'红色靶标必须拆除，蓝绿盾牌必须保全。没有标记的物件可自行取舍。'},
  tools: {title:'工步规则',icon:'shovel',text:'左上角是剩余工步。挖土、拆柱、架撑木各消耗1工步。工步用尽且目标未完成，就会失败；预览、换工具和定位不消耗工步。'},
  brace: {title:'撑木',icon:'brace-icon',text:'带架撑位置的物件可以装撑木，吸收一次撞击后撑木会损坏。同一轮的多次撞击分别计算，撑木不能代替失去的承重。'},
  barrel:{title:'火药桶',icon:'barrel',text:'被撞碎时引爆同层左右两格。浸湿的火药只会破碎，不会爆炸。'},
  tower:{title:'箭塔',icon:'tower',text:'挖掉哪边的土基，就向哪边倒。倒塌可撞到同层两格内的物件，实心石基不能开挖。'},
  iron:{title:'加固门',icon:'iron',text:'数字表示还需要几次撞击。每次冲击都会留下损伤，连锁中的多次冲击也分别计算。'},
  platform:{title:'承台',icon:'platform',text:'承台托住高一层的物件。承台坍塌后，上方物件会坠落，并撞击正下方的东西。'},
  bulwark:{title:'挡墙',icon:'bulwark',text:'挡墙截断同层倒塔、爆炸和水流。即使这一击拆掉挡墙，同一道冲击也不会穿透。'},
  boulder:{title:'滚石',icon:'boulder',text:'受撞后顺着撞击方向滚动，最远四格。撞到第一件实物就停，也能推动另一块滚石。'},
  spring:{title:'泉眼',icon:'spring',text:'撞开后向同层左右两格出水。水会浸湿火药，也会被挡墙拦住。'},
  bellhouse:{title:'钟楼',icon:'bellhouse',text:'钟楼向失去土基的一侧倒塌，能撞到同层三格远的物件。'},
  bridge:{title:'石拱承台',icon:'bridge',text:'石拱托住上层物件。撞击会留下损伤，图标旁的数字表示还需几次撞击；最后一次撞击使石拱坍塌。'},
  powderhouse:{title:'火药工坊',icon:'powderhouse',text:'爆炸可达同层左右三格。被水浸湿后只会破碎，落地时也会受当地水域影响。'},
  watertower:{title:'水塔',icon:'watertower',text:'撞开后向同层左右三格出水，水流会被挡墙拦住。'},
  minepier:{title:'矿柱',icon:'minepier',text:'可以直接铲断柱身。柱子失去承重后，上层物件会沿所在位置坠落；叠放的矿柱也会继续坍塌。'},
  anvil:{title:'重锤',icon:'anvil',text:'重锤坠落时，对正下方物件造成两次撞击。横向撞碎重锤不会触发坠落重击。'},
  ramp:{title:'弹射跳板',icon:'ramp',text:'滚石从低端进入后，会被弹向前方高一层，最远三格。跳板只能使用一次，从高端撞来会撞坏它。'},
  drain:{title:'排水管',icon:'drain',text:'入口在高一层，出水口在下层，出水范围为左右两格。水管可向下接力，也可架撑挡一次撞击；被撞坏后不能继续通水。'},
  timber:{title:'朽木承台',icon:'timber',text:'朽木能承重，但受到撞击或被水浸到支脚就会坍塌。上方物件会随之坠落。'},
  ledge:{title:'岩层顶板',icon:'ledge',text:'岩层顶板是矿室的固定顶面，能够承重，无法拆除。顶板下的洞室可以通行。'},
  reinforcedcargo:{title:'加固货箱',icon:'cargo',text:'数字表示还需几次撞击才会破碎。撑木先吸收一次撞击，货箱已有的损伤不会因此恢复。'},
  underground:{title:'地下矿室',icon:'portal',text:'地表下有相通的矿室。物件只会撞到同层目标，承重坍塌、竖井排水与坠落可以跨层传递。'},
};
const featureKeys = level => [...new Set([
  ...(LEVELS.indexOf(level)===0?['tools','targets']:[]),
  ...level.objects.flatMap(item=>[...(item.braceSlot?['brace']:[]),...(item.kind==='cargo'&&item.armor?['reinforcedcargo']:[]),...(MECHANICS[item.kind]?[item.kind]:[])]),
  ...(level.underground?['underground']:[]),
])];
/** 首次出现时自动介绍；主动打开规则时可回看当前地图涉及的全部能力。 */
export function discoveryNotes(level, review=false) {
  return featureKeys(level).filter(key=>review || !LEVELS.slice(0,LEVELS.indexOf(level)).some(prior=>featureKeys(prior).includes(key)))
    .map(key=>({key,...MECHANICS[key]}));
}
export function guideStep(level, board, tool, action, forecast, index=0, notes=discoveryNotes(level)) {
  return notes[index] || null;
}
export function jobObjectives(level) {
  return [...level.goals.map(id=>[id,false]),...level.protect.map(id=>[id,true])].map(([id,preserve])=>{
    const item=level.objects.find(o=>o.id===id);
    const peers=level.objects.filter(o=>o.kind===item.kind&&(preserve?level.protect:level.goals).includes(o.id));
    const rows=[...new Set(peers.map(o=>o.row||0))].sort((a,b)=>a-b);
    const row=item.row||0,sameRow=peers.filter(o=>(o.row||0)===row).sort((a,b)=>a.x-b.x);
    const vertical=rows.length>1?(row===rows[0]?'下层':row===rows.at(-1)?'上层':'中层'):'';
    const lateral=sameRow.length>1?(sameRow[0]===item?'左侧':sameRow.at(-1)===item?'右侧':'中间'):'';
    const position=vertical+lateral;
    return {id,kind:item.kind,preserve,label:(preserve?'保全':'拆除')+position+(item.name||ITEMS[item.kind])};
  });
}
