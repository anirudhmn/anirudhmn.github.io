import {constructKolam} from './kolam.js?v=20261121-easter-eggs';
import {createFlour,advanceFlour} from './flour.js?v=20261121-easter-eggs';
import {createAnts,stepAnts} from './ants.js?v=20261121-easter-eggs';

export const drawingDuration=42;

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
    advanceFlour(day.flour,day.flour.drawLength*Math.min(1,day.age/drawingDuration));
    if(day.age>=drawingDuration)finishDrawing(day);
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
