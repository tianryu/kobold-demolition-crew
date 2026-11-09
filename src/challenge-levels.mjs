// 本批重做第20–25、30–35关。共用的是物理结构骨架，变化落在冲击去向、承重与保护窗口。
const o=(id,kind,x,row=0,e={})=>({id,kind,x,...(row?{row}:{}),...e});
const t=(id,x,row=0,kind='tower')=>o(id,kind,x,row,{feet:{left:true,right:true}});
const c=(id,x,row=0)=>o(id,'cargo',x,row,{braceSlot:true});
const p=(id,x,row,span,kind='minepier',armor)=>o(id,kind,x,row,{span,...(armor?{armor}:{})});
const door=(id,x,row,armor)=>o(id,'iron',x,row,{armor});
const level=(id,objects,goals,protect,underground=0)=>({id,title:id,objects,goals,protect,underground,advanced:true,steps:24,plugs:[]});
function ground(n){let k=n>=23?7:6;let a=[t('west',k-5),o('west-rock','boulder',k-3.5),t('west-inner',k-1.5),t('east-inner',k+2),o('east-rock','boulder',k+4),t('east',k+5.5),p('arch',k,0,3,'bridge',4)];let goals=['arch'],keep=[];
 if(n===20){a.push(o('load','vault',k,1),c('west-cargo',k-4),c('east-cargo',k+4.7));goals.push('load');keep.push('west-cargo','east-cargo');}
 else {a.push(c('cargo',k));keep.push('cargo');}
 if(n===21){a.push(o('load','vault',k,1));goals.push('load');}
 if(n===22){a.push(o('load','barrel',k,1),p('water-floor',k+4.1,0,3.2,'ledge'),o('water','watertower',k+2.7,1),t('water-work',k+4.5,1));goals.push('load');}
 if(n>=23){a.push(o('load','barrel',k-.2,1),p('top-floor',k,1,1.8,'platform'),o('factory','powderhouse',k-.2,2),p('fire-floor',k-2,0,2.6,'ledge'),t('fire-work',k-1.5,1),p('east-floor',k+3.1,0,3.2,'ledge'),door('upper-door',k+1.8,1,3),t('water-work',k+4.5,1,'bellhouse'),o('water','watertower',n===25?k-2.1:k+2.7,1));goals.push('load','factory','upper-door','water-work');
  if(n>=24){a.find(o=>o.id==='top-floor').span=.7;a.push(c('upper-west-cargo',k-3.2,1),o('fire-wall','bulwark',k+.8,1,{armor:n===25?2:1}),p('wall-work',k+.8,1,.6),o('wall-weight','cargo',k+.8,2));keep.push('upper-west-cargo');goals.push('fire-wall');}
  if(n===25){
    a.push(t('upper-nudge',k+2.8,1),o('door-load','cargo',k+1.8,2));
    a.find(o=>o.id==='upper-door').armor=4;
    const release=a.find(o=>o.id==='water-work');release.kind='minepier';release.span=5.4;delete release.feet;
    Object.assign(a.find(o=>o.id==='water'),{x:k+2.7,row:2});
  }
 }
 return level('G'+n,a,goals,keep,n>=22?2:0);
}
function mine(n){let k=n>=32?7:6;let a=[p('west',k-5.5,0,2.4),o('west-load','barrel',k-4.4,1),o('west-rock','boulder',k-4),p('west-inner',k-3,0,2),o('west-inner-load','cargo',k-2.2,1),o('west-inner-rock','boulder',k-1.8),p('east-inner',k+3,0,2),o('east-inner-load','cargo',k+2.2,1),o('east-inner-rock','boulder',k+1.8),p('east',k+5.5,0,2.4),o('east-load','barrel',k+4.4,1),o('east-rock','boulder',k+4)];let goals=[],keep=[];
 if(n===30){a.push(p('arch',k,0,3,'bridge',4),o('load','vault',k,1),c('cargo',k));goals.push('arch','load');keep.push('cargo');a.push(c('west-cargo',k-6.4),c('east-cargo',k+6.4));keep.push('west-cargo','east-cargo');}
 else {a.push(c('west-cargo',k-6.4),c('east-cargo',k+6.4));keep.push('west-cargo','east-cargo');}
 if(n===31){a.push(door('door',k,0,6),p('weight-work',k-.8,0,1.8),o('weight','anvil',k,1));goals.push('door');}
 if(n>=32){a.push(p('arch',k,0,3,'bridge',4),o('weight','anvil',k,1),c('cargo',k));goals.push('arch','weight');keep.push('cargo');
  let xpos=n>=33?k-1.4:k;
  a.push(p('upper-work',n>=33?k-1.4:k-1.2,1,n>=33?.5:2.6),p('upper-footing',n>=33?k-1.4:k-1.2,0,n>=33?.3:.8,'ledge'),o('upper-load',n>=34?'powderhouse':'barrel',xpos,2));
  if(n>=33){
    // 把可铲断的柱身分开，梁端仍落在原载荷位置，短横屏也能准确选柱。
    a.find(o=>o.id==='upper-work').x=k-4.8;a.find(o=>o.id==='upper-work').span=6.8;
    a.find(o=>o.id==='upper-footing').x=k-4.8;
    a.push(c('upper-east-cargo',k-3,1),p('east-ledge',k-3,0,.4,'ledge'),o('upper-wall','bulwark',k-.7,1,{armor:n>=34?2:1}),p('wall-work',k+.7,1,2.8),p('wall-footing',k+.7,0,.3,'ledge'),o('wall-weight',n>=34?'anvil':'cargo',k-.7,2));keep.push('upper-east-cargo');goals.push('upper-wall');
  }
  if(n===34){a.push(c('upper-west-cargo',k+1.4,1),p('west-ledge',k+1.4,0,.4,'ledge'));keep.push('upper-west-cargo');}
  if(n===35){a.push(door('upper-door',k+1.5,1,2),p('door-ledge',k+1.5,0,.4,'ledge'),t('upper-tower',k+4,1,'bellhouse'),p('tower-ledge',k+4,0,.3,'ledge'));goals.push('upper-door');}
 }
 return level('M'+n,a,goals,keep,n>=32?2:1);
}


// 矿室通过下落载荷与共用滚道衔接，新材料沿用前章的规划压力。
function introduce(n){let l=mine(30),k=6;l.id='N'+n;l.underground=n>=28?2:1;
 if(n>=27){l.objects.find(o=>o.id==='load').kind='barrel';l.objects.push(p('water-work',k-3.5,1,2),p('water-footing',k-3.5,0,.3,'ledge'),o('water-load','cargo',k-2.6,2),o('water','watertower',k-2.6,1),p('water-floor',k-2.6,0,.3,'ledge'));}
 if(n>=28&&n<30){l.objects.push(o('wall','bulwark',k-(n===29?2:2.8),0,{armor:n>=29?2:1}),p('wall-work',k-1.55,0,2.5),o('wall-load','cargo',k-(n===29?2.3:2.8),1));l.goals.push('wall');}
 if(n===29){l.objects.push(p('wall-upper',k-1.6,1,3),o('wall-upper-load','cargo',k-3.1,2));}
 if(n===30){
   l.objects.push(t('cross-bell',k+1.1,0,'bellhouse'));
   l.objects.find(o=>o.id==='arch').armor=5;
   l.objects.find(o=>o.id==='east-inner-rock').x=k+2.5;
   l.objects.find(o=>o.id==='east-inner-load').x=k+2.7;
 }
 return l;
}

// 弹射、排水和朽木都接到主目标的传递链中，不单独拼接教学工段。
function launch(n){let a=[],goals=['door','weight'],keep=['cargo','west-cargo','east-cargo'];
 if(n<40){a=[t('west',.5),o('west-rock','boulder',2),o('west-ramp','ramp',5,0,{direction:1}),t('east',17.5),o('east-rock','boulder',16),o('east-ramp','ramp',13,0,{direction:-1}),p('floor',9.35,0,7.9,'ledge'),p('west-upper',5.8,1,6.5),p('east-upper',12.2,1,6.5),o('weight','anvil',9,2),o('west-fire','powderhouse',7.8,1),o('east-fire','powderhouse',11.8,1),door('door',9,1,4),c('cargo',9.9,1),c('west-cargo',1),c('east-cargo',17)];
 if(n>=37)a.push(p('west-wall-work',3,0,2.4),o('west-weight','anvil',4,1),o('west-wall','bulwark',4,0,{armor:2}));
 if(n>=38)a.push(p('east-wall-work',14.8,0,2.4),o('east-weight','anvil',14,1),o('east-wall','bulwark',14,0,{armor:2}));
 if(n===39){a.push(p('center',9,1,2.6,'minepier',3),o('load','barrel',9.9,2),p('water-floor',12,1,2.8,'ledge'),o('water','watertower',11,2),t('water-work',12.8,2));goals.push('load');}
 }else{
 a=[t('west',.5),o('west-rock','boulder',2),o('west-ramp','ramp',4.8,0,{direction:1}),o('upper-rock','boulder',6.3,1),o('upper-ramp','ramp',8.3,1,{direction:1}),t('east',20,1),o('east-rock','boulder',18.5,1),o('east-ramp','ramp',15.6,1,{direction:-1}),p('lower-floor',13,0,14,'ledge'),p('floor',12,1,9,'ledge'),p('west-upper',8.9,2,5.5),p('east-upper',14.8,2,6.5),o('weight','anvil',11.6,3),o('west-fire','powderhouse',10.4,2),o('east-fire','powderhouse',14.4,2),door('door',11.6,2,4),c('cargo',12.5,2),c('west-cargo',1),c('east-cargo',19.3,1),p('west-wall-work',3,0,2.4),o('west-weight','anvil',4,1),o('west-wall','bulwark',4,0,{armor:2}),p('east-wall-work',17.3,1,1.4),o('east-weight','anvil',17.1,2),o('east-wall','bulwark',17.1,1,{armor:2}),p('center',11.6,2,2.6,'minepier',3),o('load','barrel',12.5,3),p('water-floor',14.9,2,2.4,'ledge'),o('water','watertower',14,3),t('water-work',15.8,3)];goals.push('load');
 }
 return level('L'+n,a,goals,keep,2);
}
function water(n,wooden=false){const k=8,high=[42,45,48,50].includes(n),wall=n>=43,remote=n>=44;
 const base=mine(30),a=base.objects.filter(o=>!['arch','load','cargo'].includes(o.id)).map(o=>({...o,x:o.x+2}));
 let goals=['core','upper-door','water-work'],keep=['west-cargo','east-cargo','upper-cargo'];
 if(wooden){a.find(o=>o.id==='west-inner-load').braceSlot=true;a.find(o=>o.id==='west-load').braceSlot=true;a.push(door('core',k,0,6),p('wood',k-.8,0,2.7,'timber'),o('load','anvil',k+.5,1));goals.push('wood','load');}
 else {a.push(p('core',k,0,3,'bridge',4),o('load','barrel',k+.5,1),c('cargo',k));goals.push('load');keep.push('cargo');}
 a.push(p('fire-work',k+2,1,7.6),p('fire-footing',k+2,0,.2,'ledge'),o('fire','barrel',k-1.8,2),door('upper-door',k-3.5,1,2),p('door-footing',k-3.5,0,.3,'ledge'),t('upper-bell',k-(remote?7.4:5.4),1,'bellhouse'),p('bell-footing',k-(remote?7.4:5.4),0,.3,'ledge'),c('upper-cargo',k-1,1),p('cargo-footing',k-1,0,.3,'ledge'),o('pipe','drain',k+.9,1),p('pipe-footing',k+.9,0,.3,'ledge'));
 const wrow=high?3:2;
 a.push(p('water-floor',k+1.8,wrow-1,2.2,'ledge'),o('water','watertower',k+.9,wrow),t('water-work',k+2.7,wrow));
 // 每一块固定顶板自身也有下层地质承托。
 a.push(p('water-footing',k+1.8,0,.3,'ledge'));
 if(high){a.push(p('upper-water-footing',k+1.8,1,.3,'ledge'),o('upper-pipe','drain',k-.1,2),p('upper-pipe-footing',k-.1,1,.3,'ledge'),p('pipe-base',k-.1,0,.3,'ledge'));}
 if(high){
  // 多层水路穿过作业冲击区：保留通水能力也是拆序的一部分，不只是加长管线。
  a.find(o=>o.id==='upper-pipe').x=k-1.2;
  a.find(o=>o.id==='upper-pipe-footing').x=k-1.2;a.find(o=>o.id==='pipe-base').x=k-1.2;
  a.find(o=>o.id==='pipe').x=k+.1;a.find(o=>o.id==='pipe-footing').x=k+.1;
 }
 if(wall){a.push(o('fire-wall','bulwark',k-2.7,1,{armor:2}),p('wall-work',k-2.7,1,.5),o('wall-weight','anvil',k-2.7,2),p('wall-footing',k-2.7,0,.3,'ledge'));goals.push('fire-wall');}
 if(remote)a.push(o('remote-fire','powderhouse',k-5.7,1),p('remote-footing',k-5.7,0,.3,'ledge'));
 if(wooden){a.push(o('ground-pipe','drain',k+2.5));a.find(o=>o.id==='wall-weight').x=k-2.5;a.find(o=>o.id==='west-inner-load').armor=3;a.find(o=>o.id==='wall-work').span=1.2;a.find(o=>o.id==='remote-fire').x=k-6.3;a.find(o=>o.id==='remote-footing').x=k-6.3;a.find(o=>o.id==='upper-bell').x=k-7.9;a.find(o=>o.id==='bell-footing').x=k-7.9;}
 if(wooden&&high){a.find(o=>o.id==='ground-pipe').x=k+2.1;a.find(o=>o.id==='east-load').x=k+4.1;a.find(o=>o.id==='east').x=k+5.2;}
 if(wooden&&n>=47){a.push(p('cargo-wood',k-1,1,1.2,'timber'),p('cargo-backup',k-.5,1,1.6,'minepier'),c('high-cargo',k-1,2),p('backup-footing',k-.5,0,.3,'ledge'));a.find(o=>o.id==='cargo-backup').braceSlot=true;keep.push('high-cargo');}
 if(n===50){
  // 一路从地表弹入矿井上层，另外三路保留矿柱落点；共同消耗同一重门的耐久。
  for(const item of a)item.row=(item.row||0)+1;
  const removed=new Set(['west','west-load','west-cargo']);
  for(let i=a.length-1;i>=0;i--)if(removed.has(a[i].id))a.splice(i,1);
  a.push(p('mine-floor',k,0,18,'ledge'),t('launch-work',k-8),o('launch-rock','boulder',k-6.5),o('launch-ramp','ramp',k-4.5,0,{direction:1}),c('west-cargo',k-7.4));
 }
 for(const item of a)if(item.kind==='drain')item.braceSlot=true;
 return level((wooden?'T':'W')+n,a,goals,keep,2);
}

const rebuilt = new Map([
 ...Array.from({length:6},(_,i)=>[i+20,ground(i+20)]),
 ...Array.from({length:5},(_,i)=>[i+26,introduce(i+26)]),
 ...Array.from({length:5},(_,i)=>[i+31,mine(i+31)]),
 ...Array.from({length:5},(_,i)=>[i+36,launch(i+36)]),
 ...Array.from({length:10},(_,i)=>[i+41,water(i+41,i>=5)]),
]);
const names=['交错滚道','拱下货箱','带水承重','上下火线','隔墙承压','旧城交汇','四路矿室','有水的落点','重叠支座','深井双载','交叠承重','重门借力','锤下保全','墙后落火','双层药库','矿井交汇','交叉弹道','墙后的跳板','双侧清障','上层承压','三层腾空','火种与水路','两层出水口','隔墙竖井','远端药库','井下交汇','湿脚木架','备用矿柱','层间保全','旧木深井','地下总工地'];
const minimum=[6,7,8,8,10,11,7,7,8,8,9,7,7,9,10,10,8,9,10,13,13,11,12,12,12,13,12,13,14,13,14];
/** 保留工单ID、收入与通关账本；只重开结构已经更新的施工现场。 */
export function rebuildChallenges(level,index) {
 const n=index+1,layout=rebuilt.get(n);
 if(!layout)return level;
 return {...level,...layout,id:level.id,title:names[n-20],revision:(level.revision||1)+1,
   // 固定岩板位于矿层之内，高层地图向地下展开，不能把矿室顶板悬在天空中。
   underground:layout.underground?Math.max(layout.underground,...layout.objects.map(o=>o.row||0)):0,
   steps:minimum[n-20]+2,challengeRevision:1,
   brief:'拆除红色靶标指向的物件，保全盾牌指向的物件。',
 };
}
