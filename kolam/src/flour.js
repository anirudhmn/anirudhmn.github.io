import {randomFromSeed} from './random.js?v=20261120';
import {pointAt} from './kolam.js?v=20261120';
export const resolution=256;
export function cellAt(flour,x,y){
  const col=Math.floor((x/flour.extent+.5)*resolution),row=Math.floor((y/flour.extent+.5)*resolution);
  return col<0||row<0||col>=resolution||row>=resolution?-1:row*resolution+col;
}
export function createFlour(path){
  const random=randomFromSeed(`${path.seed}:flour`),grains=[];
  for(const dot of path.dots)for(let i=0;i<100;i++){
    const a=random()*Math.PI*2,r=Math.sqrt(random())*.033;
    grains.push({x:dot.x+Math.cos(a)*r,y:dot.y+Math.sin(a)*r,radius:.003+random()*.004,shade:random(),distance:-1});
  }
  const count=Math.ceil(path.length*1500);
  for(let i=0;i<count;i++){
    const distance=path.length*i/count,p=pointAt(path,distance),q=pointAt(path,Math.min(path.length,distance+.005));
    const a=Math.atan2(q.y-p.y,q.x-p.x),flow=1+.18*Math.sin(distance*1.7)+.1*Math.sin(distance*4.3);
    const scatter=(random()+random()+random()-1.5)*.020*flow*(random()<.035?2.5:1);
    grains.push({x:p.x-Math.sin(a)*scatter+(random()-.5)*.012,y:p.y+Math.cos(a)*scatter+(random()-.5)*.012,radius:(.002+random()*.0045)*flow,shade:random(),distance});
  }
  return {grains,extent:path.size+1,deposited:0,totalQuantity:0,field:new Float32Array(resolution**2),cells:new Map(),removed:[]};
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
