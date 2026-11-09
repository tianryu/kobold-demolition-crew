// 第26–50关：逐张手工配置的共享结构；函数只简写物件字段，不拼接独立工段。
const obj=(id,kind,x,row=0,extra={})=>({id,kind,x,...(row?{row}:{}),...extra});
const pier=(id,x,row,span)=>obj(id,'minepier',x,row,{span});
const deck=(id,x,row,span)=>obj(id,'ledge',x,row,{span});
const wood=(id,x,row,span)=>obj(id,'timber',x,row,{span});
const tower=(id,x,row=0,kind='tower')=>obj(id,kind,x,row,{feet:{left:true,right:true}});
const cargo=(id,x,row=0)=>obj(id,'cargo',x,row,{braceSlot:true});
const iron=(id,x,row,n)=>obj(id,'iron',x,row,{armor:n});
const wall=(id,x,row,n=1)=>obj(id,'bulwark',x,row,{armor:n});
const ramp=(id,x,row=0,direction=1)=>obj(id,'ramp',x,row,{direction});
const maps=[
 ['矿柱货仓',1,[pier('roof',2.1,0,4),obj('powder','barrel',3.3,1),obj('door','gate',2.8),cargo('cargo',4.9)],['door'],['cargo']],
 ['两处落点',1,[pier('west',2.0,0,3),pier('east',7.0,0,3),obj('load','barrel',3.2,1),obj('water','spring',5.8,1),obj('powder','barrel',5.0),iron('door',3.2,0,2),cargo('cargo',4.4)],['door'],['cargo']],
 ['双层矿顶',2,[pier('lower',2.4,0,4),pier('upper',2.8,1,2.6),obj('powder','barrel',3.5,2),iron('door',3.5,0,2),cargo('cargo',4.8)],['door'],['cargo']],
 ['夹墙货廊',1,[pier('west',2.1,0,3),pier('east',6.8,0,3.2),obj('west-load','barrel',3.2,1),obj('east-load','barrel',5.6,1),iron('door',3.9,0,2),wall('wall',4.4),cargo('cargo',4.9)],['door','wall'],['cargo']],
 ['下层承重',2,[pier('base',4.3,0,6),pier('west',2.7,1,2.2),pier('east',6.0,1,2.2),obj('west-load','barrel',2.7,2),obj('east-load','barrel',6.0,2),iron('door',6.0,0,2),cargo('cargo',4.5)],['door'],['cargo']],
 ['重锤货间',1,[pier('west',2.3,0,3.4),pier('east',6.4,0,3.4),obj('weight','anvil',3.5,1),obj('powder','barrel',4.9,1),iron('door',3.5,0,3),cargo('cargo',6.0)],['door'],['cargo']],
 ['货箱上方',2,[pier('lower',2.0,0,2.8),deck('east-floor',5.8,0,3.4),pier('upper',5.8,1,3.6),obj('weight','anvil',3.0,1),obj('powder','barrel',4.3,2),obj('shed','cottage',5.6,1),cargo('cargo',3.0)],['lower','shed'],['cargo']],
 ['重锤与挡墙',1,[pier('west',2.4,0,3.4),pier('east',6.6,0,3.4),obj('weight','anvil',4.0,1),obj('powder','barrel',5.0,1),wall('wall',4.0,0,2),obj('door','gate',3.2),cargo('cargo',5.7)],['wall','door'],['cargo']],
 ['深井工坊',2,[pier('west',2.4,0,3.4),pier('east',7.1,0,3.4),pier('upper',7.1,1,3.4),obj('weight','anvil',4.0,1),obj('powder','powderhouse',5.6,2),wall('wall',4.0,0,2),obj('door','gate',3.2),cargo('cargo',4.9)],['wall','door'],['cargo']],
 ['三层重墙',1,[pier('west',1.6,0,5.4),pier('east',7.1,0,3.2),obj('weight','anvil',4.0,1),obj('west-load','barrel',3.0,1),obj('east-load','powderhouse',5.6,1),wall('wall',4.0,0,3),iron('door',2.7,0,3),cargo('cargo',6.7)],['wall','door'],['cargo']],
 ['跳板工地',1,[tower('start',1.0),obj('rock','boulder',2.7),ramp('ramp',4.5),deck('upper',6.9,0,6),obj('powder','powderhouse',6.5,1),obj('door','gate',8.4,1),cargo('cargo',4.0,1)],['door'],['cargo']],
 ['弹道前的石墙',1,[tower('start',1.0),obj('rock','boulder',2.9),wall('wall',4.0,0,2),pier('release',5.0,0,2.4),obj('weight','anvil',4.0,1),ramp('ramp',6.8),deck('upper',8.4,0,4.4),obj('powder','powderhouse',8.3,1),obj('door','gate',9.8,1),cargo('cargo',6.4,1)],['door','wall'],['cargo']],
 ['反向跳板',1,[tower('start',10.0),obj('rock','boulder',8.4),ramp('ramp',6.8,0,-1),pier('base',4.6,0,3.8),pier('release',3.5,1,3.4),obj('weight','anvil',5.0,2),wall('door',5.0,1,3),cargo('cargo',4.0,1)],['door'],['base','cargo']],
 ['高处的水塔',1,[tower('start',1.0),obj('rock','boulder',2.7),ramp('ramp',4.8),deck('upper',7.5,0,8),obj('powder','powderhouse',6.0,1),iron('door',7.7,1,2),obj('water','watertower',9.0,1),tower('bell',10.5,1,'bellhouse'),cargo('cargo',4.3,1)],['door','bell'],['cargo']],
 ['两次腾空',2,[tower('start',1.0),obj('rock','boulder',2.7),ramp('lower-ramp',4.5),deck('base',9.0,0,10),obj('upper-rock','boulder',6.0,1),ramp('upper-ramp',7.5,1),deck('upper',9.5,1,8),pier('release',8.8,2,3.4),obj('weight','anvil',10.4,3),obj('powder','powderhouse',9.3,2),wall('wall',10.4,2,2),obj('door','gate',11.8,2),cargo('cargo',7.0,2)],['wall','door'],['cargo']],
 ['排水竖井',1,[deck('floor',3.2,0,3.2),pier('water-release',2.0,1,3.4),obj('stone','boulder',3.5,2),obj('water','spring',3.5,1),obj('pipe','drain',4.2),pier('load-release',7.6,0,3.4),obj('load','barrel',6.2,1),obj('powder','barrel',5.8),obj('safe','vault',4.5),cargo('cargo',6.8)],['powder'],['safe','cargo']],
 ['井下两层水渠',2,[deck('floor',3.2,0,4),deck('upper',3.2,1,3.2),pier('water-release',2.0,2,3.4),obj('stone','boulder',3.5,3),obj('water','spring',3.5,2),obj('upper-pipe','drain',4.2,1),obj('pipe','drain',4.2),pier('load-release',7.6,0,3.4),obj('load','barrel',6.2,1),obj('powder','barrel',5.8),obj('safe','vault',4.5),cargo('cargo',6.8)],['powder','water'],['safe','cargo']],
 ['矿井火种',1,[deck('floor',3.2,0,3.2),pier('water-release',2.0,1,3.4),obj('stone','boulder',3.5,2),obj('water','spring',3.5,1),obj('pipe','drain',4.2),pier('load-release',7.6,0,3.4),obj('load','barrel',6.2,1),obj('door','gate',4.5),cargo('cargo',7.1)],['door','water'],['cargo']],
 ['竖井里的重锤',2,[deck('base',3.8,0,4),deck('west-floor',2.5,1,3),pier('anvil-release',5.5,1,3),obj('weight','anvil',4.2,2),pier('water-release',1.5,2,3),obj('stone','boulder',2.8,3),obj('water','watertower',2.8,2),obj('upper-pipe','drain',3.5,1),obj('pipe','drain',5.0),wall('wall',4.2,1,2),pier('load-release',8.0,0,3.4),obj('load','powderhouse',6.5,1),obj('safe','vault',4.5),cargo('cargo',7.1)],['wall','load'],['safe','cargo']],
 ['同一根排水管',2,[deck('base',4.3,0,1.8),deck('upper',3.5,1,3.2),pier('water-release',2.0,2,3.4),obj('stone','boulder',3.5,3),obj('water','watertower',3.5,2),obj('upper-pipe','drain',4.2,1),obj('pipe','drain',4.2),pier('west',1.5,0,3.4),obj('west-load','barrel',2.8,1),pier('east',8.0,0,3.4),obj('east-load','powderhouse',6.5,1),iron('door',4.8,0,2),cargo('cargo',5.5)],['door','water'],['cargo']],
 ['朽木仓架',0,[tower('start',1.0),obj('water','watertower',2.7),wood('wood',4.2,0,2.8),obj('weight','anvil',5.2,1),obj('powder','barrel',3.5,1),iron('door',5.2,0,2),cargo('cargo',3.5)],['door'],['cargo']],
 ['工坊与旧木架',0,[tower('start',1.4),obj('water','watertower',3.0),wood('wood',3.4,0,2.4),obj('weight','anvil',4.3,1),pier('load-release',8.0,0,4.8),obj('powder','barrel',5.7,1),iron('door',4.3,0,3),cargo('cargo',6.7)],['door','water'],['cargo']],
 ['上层保全单',2,[deck('base',6.0,0,10),pier('anvil-release',3.0,1,3.4),obj('weight','anvil',4.5,2),obj('pipe','drain',4.5,1),wood('wood',5.8,1,1.8),cargo('cargo',5.8,2),deck('east-floor',8.8,1,3.0),obj('water','watertower',7.4,2),pier('water-release',8.8,2,3.0),obj('stone','boulder',7.4,3)],['water'],['cargo']],
 ['矿顶下的货箱',1,[pier('water-release',1.0,0,3.4),obj('water','watertower',.8,1),wood('wood',5.6,0,5.8),pier('upper',2.8,1,1.6),obj('powder','barrel',3.4,2),obj('weight','anvil',3.4,1),obj('load','barrel',6.3,1),iron('door',6.3,0,2),cargo('cargo',3.4)],['door'],['cargo']],
 ['最后的地下货场',2,[tower('start',1.0),obj('rock','boulder',2.7),ramp('ramp',3.4),wood('wood',4.5,0,2.0),obj('upper-rock','boulder',4.3,1),cargo('cargo',4.95),deck('east-floor',9.8,0,4),pier('anvil-release',9.8,1,3.4),obj('weight','anvil',8.2,2),iron('door',8.2,1,3),deck('west-floor',2.0,0,2.0),pier('water-release',2.4,1,3.0),obj('stone','boulder',2.7,2),obj('water','spring',2.7,1),obj('pipe','drain',4.2)],['door','wood'],['cargo']],
];
// 每关保留一次准备余量，难点来自结构、材料和跨层传递。
const budgets=[3,4,3,4,4,4,3,4,4,4,3,4,3,4,4,4,4,4,5,5,3,4,3,3,4];
export const DEEP_LEVELS=maps.map(([title,underground,objects,goals,protect],i)=>({
 id:`deepwork-${i+26}`,title,underground,objects,goals,protect,
 chapter:6+Math.floor(i/5),region:['矿柱与地下','重锤与承重','弹射与跨层','竖井与排水','朽木与连动'][Math.floor(i/5)],
 brief:`${underground?`地下${underground===2?'两':'一'}层工地。`:''}拆除${goals.length}处标记目标，保全${protect.length}处盾牌物件。`,
 advanced:true,revision:1,steps:budgets[i],pay:950+i*75,plugs:[],
}));
