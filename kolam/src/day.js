import {constructKolam} from './kolam.js?v=20261121-pixel-trace-18';
import {createFlour,advanceFlour} from './flour.js?v=20261121-pixel-trace-18';
import {createAnts,stepAnts} from './ants.js?v=20261121-1000-ant-load-2';

export const drawingDuration=42;
const drawingTimeFor=day=>day.flour.drawDuration??drawingDuration;

export function createDay(seed,family){
  const path=constructKolam(seed,family),flour=createFlour(path);
  advanceFlour(flour,0);
  return {seed:String(seed),family,path,flour,ants:createAnts(seed,flour.extent),phase:'drawing',age:0};
}

export function finishDrawing(day){
  advanceFlour(day.flour,day.flour.drawLength);
  day.flour.initialQuantity=day.flour.totalQuantity;
  day.phase='living';
  day.age=0;
}

export function stepDay(day,dt){
  if(day.phase==='drawing'){
    day.age+=dt;
    const duration=drawingTimeFor(day);
    advanceFlour(day.flour,day.flour.drawLength*Math.min(1,day.age/duration));
    if(day.age>=duration)finishDrawing(day);
  }else{
    day.age+=dt;
    if(day.phase==='living'){
      stepAnts(day.ants,day.flour,dt);
      if(day.flour.totalQuantity===0){day.phase='complete';day.age=0;}
    }else if(day.age>=3){
      return createDay(day.seed,day.family);
    }
  }
  return day;
}
