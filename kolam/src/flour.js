import {randomFromSeed,accentsForSeed} from './random.js?v=20261123';
import {pointAt} from './kolam.js?v=20261123';
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
  const left={x:x-nx*width,y:y-ny*width},tip={x:x+dx*length,y:y+dy*length},right={x:x+nx*width,y:y+ny*width};
  const first=bezier(left,{x:x+dx*length*.35-nx*width*1.4,y:y+dy*length*.35-ny*width*1.4},{x:tip.x-dx*length*.22-nx*width*.65,y:tip.y-dy*length*.22-ny*width*.65},tip);
  const second=bezier(tip,{x:tip.x-dx*length*.22+nx*width*.65,y:tip.y-dy*length*.22+ny*width*.65},{x:x+dx*length*.35+nx*width*1.4,y:y+dy*length*.35+ny*width*1.4},right);
  return [...first,...second.slice(1),left];
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
export function createFlour(path){
  const random=randomFromSeed(`${path.seed}:flour`),grains=[];
  const style=accentsForSeed(path.seed).color?['center','scattered','tips','all'][Math.floor(random()*4)]:'none',dotColors=new Map();
  for(const dot of path.dots){
    const pair=[Math.abs(dot.x),Math.abs(dot.y)].sort((a,b)=>a-b),key=pair.join(':');
    if(!dotColors.has(key)){
      const selected=style==='all'||(style==='center'&&dot.x===0&&dot.y===0)||(style==='tips'&&Math.abs(dot.x)+Math.abs(dot.y)===(path.size-1)/2)||(style==='scattered'&&random()<.34);
      dotColors.set(key,selected?(random()<.52?'vermillion':'marigold'):null);
    }
    const pigment=dotColors.get(key);
    for(let i=0;i<150;i++){
    const a=random()*Math.PI*2,r=Math.sqrt(random())*.043;
    grains.push({x:dot.x+Math.cos(a)*r,y:dot.y+Math.sin(a)*r,radius:.003+random()*.004,shade:random(),pigment,distance:-1});
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
  if(accentsForSeed(path.seed).flourish){
    const half=(path.size-1)/2;
    for(let arm=0;arm<4;arm++){
      const angle=arm*Math.PI/2,x=Math.cos(angle)*half,y=Math.sin(angle)*half;
      for(const spread of [-.44,0,.44])drawLength=addStrokeGrains(grains,petalStroke(x,y,angle+spread,.30,.075),random,drawLength);
    }
  }
  return {grains,extent:path.size+1,drawLength,deposited:0,totalQuantity:0,field:new Float32Array(resolution**2),cells:new Map(),removed:[]};
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
