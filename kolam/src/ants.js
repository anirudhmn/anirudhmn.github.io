import {randomFromSeed} from './random.js';
import {collectFlour,cellAt} from './flour.js';
const trailSize=80,capacity=90;
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function trailCell(world,x,y){const col=Math.floor((x/world.extent+.5)*trailSize),row=Math.floor((y/world.extent+.5)*trailSize);return col<0||row<0||col>=trailSize||row>=trailSize?-1:row*trailSize+col;}
export function createAnts(seed,extent){
  const random=randomFromSeed(`${seed}:ants`),nest={x:-extent*.44,y:extent*.26};
  const ants=Array.from({length:28},(_,i)=>({x:nest.x,y:nest.y,angle:-.55+random()*1.8,mode:'resting',rest:i*2.15+random()*1.8,payload:[],feeding:0,speed:.68+random()*.22,gait:random()*6.28,wandering:0,scale:.88+random()*.32}));
  return {ants,nest,extent,random,trail:new Float32Array(trailSize**2),delivered:0,discoveries:0,time:0};
}
export function stepAnts(world,flour,dt){
  world.time+=dt;
  const decay=Math.exp(-dt/24);for(let i=0;i<world.trail.length;i++)world.trail[i]*=decay;
  for(const ant of world.ants){
    if(ant.mode==='resting'){
      ant.rest-=dt;if(ant.rest>0)continue;
      ant.mode='searching';ant.angle=-.55+(world.random()-.5)*1.9;
    }
    if(ant.mode==='feeding'){
      ant.feeding+=dt;ant.payload.push(...collectFlour(flour,ant.x,ant.y,.048,Math.min(capacity-ant.payload.length,Math.ceil(130*dt))));
      if(ant.feeding>.85||ant.payload.length>=capacity){ant.mode=ant.payload.length?'returning':'searching';ant.feeding=0;}
      continue;
    }
    if(ant.mode==='returning'){
      ant.angle+=turn(ant.angle,Math.atan2(world.nest.y-ant.y,world.nest.x-ant.x))*Math.min(1,dt*7);
      const cell=trailCell(world,ant.x,ant.y);if(cell>=0&&ant.payload.length)world.trail[cell]=Math.min(8,world.trail[cell]+dt*1.8);
      if(Math.hypot(ant.x-world.nest.x,ant.y-world.nest.y)<.09){world.delivered+=ant.payload.length;ant.payload=[];ant.mode='resting';ant.rest=1.5+world.random()*4;continue;}
    }else{
      const sensors=[-.65,0,.65].map(offset=>{
        const a=ant.angle+offset,x=ant.x+Math.cos(a)*.18,y=ant.y+Math.sin(a)*.18,cell=trailCell(world,x,y),food=cellAt(flour,x,y);
        return {offset,score:(cell<0?0:world.trail[cell])*.4+(food<0?0:Math.min(3,flour.field[food])*.7)};
      });
      sensors.sort((a,b)=>b.score-a.score);
      ant.wandering=ant.wandering*.91+(world.random()-.5)*.6;
      ant.angle+=(ant.wandering*2.3+(sensors[0].score>.02?sensors[0].offset*2.8:0))*dt;
      const payload=collectFlour(flour,ant.x,ant.y,.045,4);
      if(payload.length){ant.payload.push(...payload);ant.mode='feeding';ant.feeding=0;world.discoveries++;continue;}
    }
    const speed=ant.speed*(ant.mode==='returning'?.82:1);
    ant.x+=Math.cos(ant.angle)*speed*dt;ant.y+=Math.sin(ant.angle)*speed*dt;ant.gait+=dt*20;
    const bound=world.extent*.47;
    if(Math.abs(ant.x)>bound||Math.abs(ant.y)>bound){ant.x=Math.max(-bound,Math.min(bound,ant.x));ant.y=Math.max(-bound,Math.min(bound,ant.y));ant.angle=Math.atan2(-ant.y,-ant.x)+(world.random()-.5);}
  }
}
