import {constructKolam} from './kolam.js';
import {createFlour,advanceFlour,removeGrain,resolution} from './flour.js';
import {createAnts,stepAnts} from './ants.js';
export const timing={drawing:48,living:192,washing:16,quiet:10};
export function createDay(seed,family,number=0){
  const path=constructKolam(seed,family),flour=createFlour(path);
  advanceFlour(flour,0);
  return {seed:String(seed),number,path,flour,ants:createAnts(seed,flour.extent),phase:'drawing',age:0,wash:null,nextSeed:null,manual:false};
}
export function finishDrawing(day){advanceFlour(day.flour,day.path.length);day.phase='living';day.age=0;}
export function beginWashing(day,nextSeed){
  day.manual=Boolean(nextSeed);day.nextSeed=nextSeed||`${day.seed}:renewal:${day.number+1}`;
  if(day.phase==='washing'||day.phase==='quiet')return;
  day.phase='washing';day.age=0;day.wash={progress:0,flowTime:0,front:-day.flour.extent/2,columns:new Uint16Array(resolution),quantity:0,particles:[]};
  day.ants.retreat=true;for(const ant of day.ants.ants)if(ant.mode!=='resting')ant.mode='returning';
}
function washFlour(day){
  const {wash,flour}=day;wash.progress=Math.min(1,day.age/timing.washing);wash.front=(wash.progress-.5)*flour.extent;
  for(let col=0;col<resolution;col++){
    const target=Math.min(resolution,Math.floor(wash.progress*resolution+Math.sin(col*.11)*2.4*Math.sin(wash.progress*Math.PI)));
    while(wash.columns[col]<target){
      const cell=wash.columns[col]++*resolution+col;
      for(const index of flour.cells.get(cell)||[])if(removeGrain(flour,index)){
        wash.quantity++;if(index%35===0){const p=flour.grains[index];wash.particles.push({x:p.x,y:p.y,born:wash.progress,shade:p.shade});}
      }
    }
  }
}
export function stepDay(day,dt){
  day.age+=dt;if(day.wash)day.wash.flowTime+=dt;
  if(day.phase==='drawing'){
    advanceFlour(day.flour,day.path.length*Math.min(1,day.age/timing.drawing));
    if(day.age>35)stepAnts(day.ants,day.flour,dt);
    if(day.age>=timing.drawing){day.phase='living';day.age=0;}
  }else if(day.phase==='living'){
    stepAnts(day.ants,day.flour,dt);if(day.age>=timing.living)beginWashing(day);
  }else if(day.phase==='washing'){
    washFlour(day);stepAnts(day.ants,day.flour,dt);if(day.age>=timing.washing){day.phase='quiet';day.age=0;}
  }else{
    stepAnts(day.ants,day.flour,dt);
    if(day.age>=timing.quiet)return createDay(day.nextSeed,day.manual?undefined:{layout:day.path.layout,size:day.path.size},day.number+1);
  }
  return day;
}
