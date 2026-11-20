import {createDay,finishDrawing,stepDay} from './day.js?v=20261121';
import {createRenderer} from './render.js?v=20261121';
export function mountKolam(canvas,seed,onRenew=()=>{},family){
  let day=createDay(seed,family),render=createRenderer(canvas,day.path);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=motion.matches,frame=0,last=null,accumulator=0,disposed=false;
  if(paused)finishDrawing(day);render.draw(day);
  function replace(next,automatic=false){day=next;render.dispose();render=createRenderer(canvas,day.path);if(automatic)onRenew(day);}
  function tick(now){
    frame=0;if(disposed||paused||document.hidden)return;
    if(last!==null)accumulator+=Math.min(.1,(now-last)/1000);last=now;
    while(accumulator>=1/30){const next=stepDay(day,1/30);if(next!==day)replace(next,!day.manual);accumulator-=1/30;}
    render.draw(day);frame=requestAnimationFrame(tick);
  }
  function start(){last=null;if(!frame&&!paused&&!document.hidden&&!disposed)frame=requestAnimationFrame(tick);}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();}
  function resize(){render.resize();render.draw(day);}
  function reduced(){if(motion.matches){paused=true;cancelAnimationFrame(frame);frame=0;if(day.phase==='drawing')finishDrawing(day);render.draw(day);}}
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',visibility);
  if(typeof motion.addEventListener==='function')motion.addEventListener('change',reduced);
  else motion.addListener(reduced);
  start();
  return {
    get day(){return day;},get paused(){return paused;},
    setPaused(value){paused=value;cancelAnimationFrame(frame);frame=0;start();},
    renew(nextSeed){replace(createDay(nextSeed));if(paused)finishDrawing(day);render.draw(day);start();},
    dispose(){
      disposed=true;cancelAnimationFrame(frame);
      window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',visibility);
      if(typeof motion.removeEventListener==='function')motion.removeEventListener('change',reduced);
      else motion.removeListener(reduced);
      render.dispose();
    },
  };
}
