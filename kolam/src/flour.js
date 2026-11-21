import {randomFromSeed,accentsForSeed} from './random.js?v=20261121-pixel-trace-17';
import {pointAt} from './kolam.js?v=20261121-pixel-trace-17';
import {rasterEasterEggs} from './easter-egg-raster-data.js?v=20261121-pixel-trace-17';
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
function keepPetalOutsideDot(points,dot,radius,clearance=.035){
  return points.map((point,index)=>{
    if(index===0||index===points.length-1)return point;
    const dx=point.x-dot.x,dy=point.y-dot.y,distance=Math.hypot(dx,dy),minimum=radius+clearance;
    if(distance>=minimum)return point;
    const angle=Math.atan2(dy,dx);
    return {x:dot.x+Math.cos(angle)*minimum,y:dot.y+Math.sin(angle)*minimum};
  });
}
function createEasterEggFlour(path){
  const encoded=rasterEasterEggs[path.easterEgg];
  if(!encoded)throw new Error(`Missing pixel trace for ${path.easterEgg}`);
  const binary=Uint8Array.from(atob(encoded),char=>char.charCodeAt(0));
  const pixels=1254,sourceExtent=10.8,world=value=>(value/(pixels-1)-.5)*sourceExtent;
  const grains=[];let drawLength=100;
  const revealRandom=randomFromSeed(`${path.seed}:easter-reveal`),tileReveal=new Map(),tileSize=16;
  for(let i=0;i<binary.length;i+=6){
    const x=binary[i]|binary[i+1]<<8,y=binary[i+2]|binary[i+3]<<8,shade=binary[i+4]/255,kind=binary[i+5];
    const tile=`${Math.floor(x/tileSize)}:${Math.floor(y/tileSize)}`;
    if(!tileReveal.has(tile))tileReveal.set(tile,revealRandom());
    const patchProgress=tileReveal.get(tile),grainProgress=revealRandom();
    grains.push({
      x:world(x),y:world(y),
      radius:kind===3?.003+.004*shade:kind===0?.0045+.006*shade:kind===4?.003+.003*shade:.006+.005*shade,
      shade,pigment:kind===1||kind===4?'vermillion':kind===2?'marigold':undefined,
      distance:(patchProgress*.84+grainProgress*.16)*drawLength,
    });
  }
  // The original nose trace sits faintly among the facial flour. Add a short,
  // clearly placed highlight and warm shadow to define its bridge and tip.
  // Fill the lips in one red and leave a narrow background seam at the center.
  if(path.easterEgg==='samyukta'){
    const addFeatureStroke=(points,pigment,radius,density=2.2)=>{
      for(let segment=1;segment<points.length;segment++){
        const a=points[segment-1],b=points[segment],length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.ceil(length*density);
        for(let i=0;i<count;i++){
          const t=i/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
          grains.push({x:world(x),y:world(y),radius:radius*(.78+revealRandom()*.44),shade:revealRandom(),pigment,distance:99.8+revealRandom()*.18});
        }
      }
    };
    // Light on the bridge, with a warmer contour just to its right and under
    // the tip. The asymmetry keeps the nose soft rather than diagrammatic.
    addFeatureStroke([{x:612,y:856},{x:619,y:877},{x:625,y:899},{x:638,y:916},{x:650,y:919}], 'noseLight', .0048, 2.7);
    addFeatureStroke([{x:630,y:860},{x:636,y:883},{x:642,y:902},{x:654,y:912},{x:663,y:915},{x:655,y:922},{x:643,y:922}], 'shadow', .0042, 2.4);
    addFeatureStroke([{x:637,y:926},{x:646,y:929},{x:655,y:927}], 'shadow', .0035, 2.2);

    // Softly filled upper and lower lips with a defined center seam.
    const lipHalfWidth=120;
    for(let ix=-120;ix<=120;ix+=1.65){
      const t=ix/lipHalfWidth,edge=Math.abs(t),x=626+ix;
      const upper=1053+15*edge*edge, seam=1078+10*edge, lower=1138-50*edge;
      for(let y=upper;y<=lower;y+=1.7){
        if(Math.abs(y-seam)<1.5)continue;
        const jitterX=(revealRandom()-.5)*1.2,jitterY=(revealRandom()-.5)*1.2;
        grains.push({x:world(x+jitterX),y:world(y+jitterY),radius:.0042+revealRandom()*.0028,shade:.25+revealRandom()*.6,pigment:'lipRed',distance:99.8+revealRandom()*.18});
      }
    }
  }
  grains.sort((a,b)=>a.distance-b.distance);
  return {grains,extent:path.extent,drawLength,drawDuration:60,accentStyle:'easter-egg',deposited:0,totalQuantity:0,field:new Float32Array(resolution**2),cells:new Map(),removed:[]};
}
export function createFlour(path){
  if(path.easterEgg)return createEasterEggFlour(path);
  const random=randomFromSeed(`${path.seed}:flour`),grains=[];
  const {color,flourish}=accentsForSeed(path.seed),style=color?['center','scattered','tips'][Math.floor(random()*3)]:'none',dotColors=new Map(),dotRepresentatives=new Map();
  for(const dot of path.dots){
    const key=[Math.abs(dot.x),Math.abs(dot.y)].sort((a,b)=>a-b).join(':');
    if(!dotRepresentatives.has(key))dotRepresentatives.set(key,dot);
  }
  for(const [key,dot] of dotRepresentatives){
    const half=(path.size-1)/2,isTip=path.layout==='square'?Math.abs(dot.x)===half&&Math.abs(dot.y)===half:Math.abs(dot.x)+Math.abs(dot.y)===half;
    dotColors.set(key,(style==='center'&&dot.x===0&&dot.y===0)||(style==='tips'&&isTip)||(style==='scattered'&&random()<.34));
  }
  if(dotColors.size>0&&[...dotColors.values()].every(Boolean))dotColors.set(dotColors.keys().next().value,false);
  for(const dot of path.dots){
    const pair=[Math.abs(dot.x),Math.abs(dot.y)].sort((a,b)=>a-b),key=pair.join(':');
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
      const angle=Math.atan2(y,x),rootX=x+Math.cos(angle)*(path.radius+.08),rootY=y+Math.sin(angle)*(path.radius+.08);
      for(const rawStroke of flourishStrokes(rootX,rootY,angle,flourish)){
        const stroke=flourish==='leaf'?keepPetalOutsideDot(rawStroke,{x,y},path.radius):rawStroke;
        drawLength=addStrokeGrains(grains,stroke,random,drawLength);
      }
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
