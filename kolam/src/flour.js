import {randomFromSeed,accentsForSeed} from './random.js?v=20261121-easter-eggs';
import {pointAt} from './kolam.js?v=20261121-easter-eggs';
export const resolution=256;
export function cellAt(flour,x,y){
  const col=Math.floor((x/flour.extent+.5)*resolution),row=Math.floor((y/flour.extent+.5)*resolution);
  return col<0||row<0||col>=resolution||row>=resolution?-1:row*resolution+col;
}
function bezier(a,b,c,d,steps=32){
  return Array.from({length:steps+1},(_,i)=>{const t=i/steps,u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};});
}
function petalStroke(x,y,angle,length,width){
  const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;
  const base={x,y},tip={x:x+dx*length,y:y+dy*length};
  const first=bezier(base,{x:x+dx*length*.32-nx*width*1.8,y:y+dy*length*.32-ny*width*1.8},{x:tip.x-dx*length*.2-nx*width*.72,y:tip.y-dy*length*.2-ny*width*.72},tip,56);
  const second=bezier(tip,{x:tip.x-dx*length*.2+nx*width*.72,y:tip.y-dy*length*.2+ny*width*.72},{x:x+dx*length*.32+nx*width*1.8,y:y+dy*length*.32+ny*width*1.8},base,56);
  return [...first,...second.slice(1)];
}
function curlStroke(x,y,angle,length,side=1){
  const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy*side,ny=dx*side;
  const cx=x+dx*length*.78+nx*length*.34,cy=y+dy*length*.78+ny*length*.34;
  const radius=.20;
  const start={x:cx+nx*radius,y:cy+ny*radius};
  const stem=bezier({x,y},{x:x+dx*length*.42+nx*length*.04,y:y+dy*length*.42+ny*length*.04},{x:cx-dx*length*.24+nx*radius,y:cy-dy*length*.24+ny*radius},start,64);
  const spiral=[];
  for(let i=0;i<=112;i++){
    const t=i/112,theta=side*(Math.PI*2.15)*t+Math.PI/2,r=radius*(1-t)+.008;
    spiral.push({x:cx+r*Math.cos(theta),y:cy+r*Math.sin(theta)});
  }
  return [...stem,...spiral.slice(1)];
}
function flourishStrokes(x,y,angle,kind){
  const petal=(spread,length,width)=>petalStroke(x,y,angle+spread,length,width);
  if(kind==='curl')return [
    petal(-.88,.62,.14),petal(.36,1.00,.19),petal(1.30,.70,.15),
    curlStroke(x,y,angle-1.72,.94,-1),curlStroke(x,y,angle+.84,.98,1),
  ];
  if(kind==='leaf')return [
    petal(-.96,.72,.15),petal(-.10,1.02,.19),petal(.78,.84,.15),
  ];
  return [];
}
function addStrokeGrains(grains,points,random,offset){
  const cumulative=[0];
  for(let i=1;i<points.length;i++)cumulative.push(cumulative[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  const length=cumulative[cumulative.length-1],count=Math.ceil(length*1500);
  for(let i=0;i<count;i++){
    const distance=length*i/count;let index=1;while(index<cumulative.length-1&&cumulative[index]<distance)index++;
    const a=points[index-1],b=points[index],span=cumulative[index]-cumulative[index-1],t=span?(distance-cumulative[index-1])/span:0;
    const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,angle=Math.atan2(b.y-a.y,b.x-a.x),flow=1+.16*Math.sin(distance*3.1);
    const scatter=(random()+random()+random()-1.5)*.018*flow;
    grains.push({x:x-Math.sin(angle)*scatter+(random()-.5)*.009,y:y+Math.cos(angle)*scatter+(random()-.5)*.009,radius:(.002+random()*.004)*flow,shade:random(),distance:offset+distance});
  }
  return offset+length;
}
function createEasterEggFlour(path){
  const random=randomFromSeed(`${path.seed}:easter-flour`),grains=[];
  for(const dot of path.dots){
    for(let i=0;i<150;i++){
      const angle=random()*Math.PI*2,r=Math.sqrt(random())*dot.radius;
      grains.push({x:dot.x+Math.cos(angle)*r,y:dot.y+Math.sin(angle)*r,radius:.0028+random()*.0038,shade:random(),distance:-1});
    }
  }
  for(const dot of path.accentDots){
    for(let i=0;i<300;i++){
      const angle=random()*Math.PI*2,r=Math.sqrt(random())*dot.radius;
      const pigment=dot.color==='vermillion'&&dot.ring!==false&&r>=dot.radius*.5?'marigold':dot.color;
      grains.push({x:dot.x+Math.cos(angle)*r,y:dot.y+Math.sin(angle)*r,radius:.0032+random()*.0045,shade:random(),pigment,distance:-1});
    }
  }
  let drawLength=0;
  for(const stroke of path.strokes){
    const cumulative=[0];
    for(let i=1;i<stroke.length;i++)cumulative.push(cumulative[i-1]+Math.hypot(stroke[i].x-stroke[i-1].x,stroke[i].y-stroke[i-1].y));
    const length=cumulative[cumulative.length-1],count=Math.ceil(length*300);
    for(let i=0;i<count;i++){
      const distance=length*i/count;let index=1;
      while(index<cumulative.length-1&&cumulative[index]<distance)index++;
      const a=stroke[index-1],b=stroke[index],span=cumulative[index]-cumulative[index-1],t=span?(distance-cumulative[index-1])/span:0;
      const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,angle=Math.atan2(b.y-a.y,b.x-a.x);
      const flow=1+.16*Math.sin(distance*3.1),scatter=(random()+random()+random()-1.5)*.010*flow;
      grains.push({x:x-Math.sin(angle)*scatter+(random()-.5)*.006,y:y+Math.cos(angle)*scatter+(random()-.5)*.006,radius:(.005+random()*.009)*flow,shade:random(),distance:drawLength+distance});
    }
    drawLength+=length;
  }
  return {grains,extent:path.extent,drawLength,accentStyle:'easter-egg',deposited:0,totalQuantity:0,field:new Float32Array(resolution**2),cells:new Map(),removed:[]};
}
export function createFlour(path){
  if(path.easterEgg)return createEasterEggFlour(path);
  const random=randomFromSeed(`${path.seed}:flour`),grains=[];
  const {color,flourish}=accentsForSeed(path.seed),style=color?['center','scattered','tips','all'][Math.floor(random()*4)]:'none',dotColors=new Map();
  for(const dot of path.dots){
    const pair=[Math.abs(dot.x),Math.abs(dot.y)].sort((a,b)=>a-b),key=pair.join(':');
    if(!dotColors.has(key)){
      const half=(path.size-1)/2,isTip=path.layout==='square'?Math.abs(dot.x)===half&&Math.abs(dot.y)===half:Math.abs(dot.x)+Math.abs(dot.y)===half;
      const selected=style==='all'||(style==='center'&&dot.x===0&&dot.y===0)||(style==='tips'&&isTip)||(style==='scattered'&&random()<.34);
      dotColors.set(key,selected);
    }
    // A colored kolam dot covers four times the area of a plain flour dot.
    // Scale the grain count with area so the larger red/yellow mark stays as
    // full and powder-dense as the white marks around it.
    const selected=dotColors.get(key),grainCount=selected?600:150;
    for(let i=0;i<grainCount;i++){
      // Colored dots keep the same red center footprint as a plain dot, then
      // add a yellow ring of equal thickness around it.
      const a=random()*Math.PI*2,r=Math.sqrt(random())*(selected ? .086 : .043);
      const pigment=selected?(r<.043?'vermillion':'marigold'):null;
      grains.push({x:dot.x+Math.cos(a)*r,y:dot.y+Math.sin(a)*r,radius:.0032+random()*.0045,shade:random(),pigment,distance:-1});
    }
  }
  const count=Math.ceil(path.length*1500);
  for(let i=0;i<count;i++){
    const distance=path.length*i/count,p=pointAt(path,distance),q=pointAt(path,Math.min(path.length,distance+.005));
    const a=Math.atan2(q.y-p.y,q.x-p.x),flow=1+.18*Math.sin(distance*1.7)+.1*Math.sin(distance*4.3);
    const scatter=(random()+random()+random()-1.5)*.020*flow*(random()<.035?2.5:1);
    grains.push({x:p.x-Math.sin(a)*scatter+(random()-.5)*.012,y:p.y+Math.cos(a)*scatter+(random()-.5)*.012,radius:(.002+random()*.0045)*flow,shade:random(),distance});
  }
  let drawLength=path.length;
  if(flourish&&flourish!=='corner-petal'){
    const half=(path.size-1)/2;
    const corners=path.layout==='square'?[[-half,-half],[-half,half],[half,-half],[half,half]]:[[0,-half],[-half,0],[half,0],[0,half]];
    for(const [x,y] of corners){
      // Start flourishes just beyond the corner loop so they grow out of it,
      // instead of appearing as a separate mark far away from the kolam.
      const angle=Math.atan2(y,x),rootX=x+Math.cos(angle)*(path.radius+.04),rootY=y+Math.sin(angle)*(path.radius+.04);
      for(const stroke of flourishStrokes(rootX,rootY,angle,flourish))drawLength=addStrokeGrains(grains,stroke,random,drawLength);
    }
  }
  const extentMargin=flourish==='corner-petal'?2.4:flourish?3:1;
  return {grains,extent:path.size+extentMargin,drawLength,accentStyle:style,deposited:0,totalQuantity:0,field:new Float32Array(resolution**2),cells:new Map(),removed:[]};
}
export function advanceFlour(flour,distance){
  while(flour.deposited<flour.grains.length&&flour.grains[flour.deposited].distance<=distance){
    const grain=flour.grains[flour.deposited],cell=cellAt(flour,grain.x,grain.y);
    if(cell<0)throw new Error('Flour outside its field');
    grain.cell=cell;const indices=flour.cells.get(cell)||[];indices.push(flour.deposited++);flour.cells.set(cell,indices);flour.field[cell]++;flour.totalQuantity++;
  }
}
export function removeGrain(flour,index){
  const grain=flour.grains[index];if(grain.removed)return false;
  grain.removed=true;flour.removed.push(index);flour.field[grain.cell]--;flour.totalQuantity--;return true;
}
export function collectFlour(flour,x,y,radius,limit){
  if(limit<=0)return [];
  const found=[],left=Math.max(0,Math.floor((x-radius)/flour.extent*resolution+resolution/2)),right=Math.min(resolution-1,Math.floor((x+radius)/flour.extent*resolution+resolution/2));
  const top=Math.max(0,Math.floor((y-radius)/flour.extent*resolution+resolution/2)),bottom=Math.min(resolution-1,Math.floor((y+radius)/flour.extent*resolution+resolution/2));
  for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)for(const index of flour.cells.get(row*resolution+col)||[]){
    const p=flour.grains[index];if(!p.removed&&Math.hypot(p.x-x,p.y-y)<=radius){removeGrain(flour,index);found.push(index);if(found.length>=limit)return found;}
  }
  return found;
}
