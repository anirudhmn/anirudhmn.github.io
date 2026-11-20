import {constructKolam} from './kolam.js?v=20261120';
import {createFlour,advanceFlour} from './flour.js?v=20261120';
import {createAnts,stepAnts} from './ants.js?v=20261120';

export const drawingDuration=42;

export function createDay(seed,family){
  const path=constructKolam(seed,family),flour=createFlour(path);
  advanceFlour(flour,0);
  return {seed:String(seed),path,flour,ants:createAnts(seed,flour.extent),phase:'drawing',age:0};
}

export function finishDrawing(day){
  advanceFlour(day.flour,day.path.length);
  day.phase='living';
  day.age=0;
}

export function stepDay(day,dt){
  if(day.phase==='drawing'){
    day.age+=dt;
    advanceFlour(day.flour,day.path.length*Math.min(1,day.age/drawingDuration));
    if(day.age>=drawingDuration)finishDrawing(day);
  }else{
    day.age+=dt;
    stepAnts(day.ants,day.flour,dt);
  }
  return day;
}
