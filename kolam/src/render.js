import {randomFromSeed} from './random.js?v=20261121-pixel-trace-6';
import {resolution} from './flour.js?v=20261121-pixel-trace-6';
export function createRenderer(canvas,path){
  const ground=document.createElement('canvas'),powder=document.createElement('canvas');
  const c=canvas.getContext('2d'),g=ground.getContext('2d'),f=powder.getContext('2d');
  let width,height,scale,cx,cy,drawn=0,removed=0;
  function resize(){
    const bounds=canvas.getBoundingClientRect();
    width=Math.max(1,bounds.width||window.innerWidth);height=Math.max(1,bounds.height||window.innerHeight);const ratio=Math.min(devicePixelRatio||1,2);
    for(const surface of [canvas,ground,powder]){surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);surface.getContext('2d').setTransform(ratio,0,0,ratio,0,0);}
    const flourishMargin=path.flourish==='corner-petal'?1.4:path.flourish?2.4:0;
    scale=Math.min(width*.92,height*.90)/(path.size-.1+flourishMargin);cx=width/2;cy=height*.50;drawn=0;removed=0;
    const random=randomFromSeed(`${path.seed}:ground`);
    const base=g.createLinearGradient(0,0,width,height);
    base.addColorStop(0,'#1b211e');base.addColorStop(.52,'#171c1a');base.addColorStop(1,'#111817');
    g.fillStyle=base;g.fillRect(0,0,width,height);
    const halo=g.createRadialGradient(cx,cy,0,cx,cy,Math.max(width,height)*.56);
    halo.addColorStop(0,'rgba(132,112,76,.18)');halo.addColorStop(.28,'rgba(67,76,61,.12)');halo.addColorStop(1,'rgba(17,24,23,0)');
    g.fillStyle=halo;g.fillRect(0,0,width,height);
    for(let i=0;i<3800;i++){
      const warm=random()<.28;
      g.fillStyle=warm?'rgba(226,202,156,.065)':'rgba(183,201,184,.045)';
      const grain=.35+random()*.75;
      g.fillRect(random()*width,random()*height,grain,grain);
    }
    const vignette=g.createRadialGradient(cx,cy*.92,Math.min(width,height)*.2,cx,cy,width*.77);
    vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(3,8,8,.38)');
    g.fillStyle=vignette;g.fillRect(0,0,width,height);
  }
  function drawGrain(p){
    if(p.removed)return;
    f.fillStyle=p.pigment==='vermillion'?(p.shade<.5?'rgba(196,54,37,.98)':'rgba(225,70,48,1)'):p.pigment==='marigold'?(p.shade<.5?'rgba(208,151,25,.98)':'rgba(244,192,45,1)'):p.shade<.16?'rgba(175,174,151,.42)':p.shade<.65?'rgba(231,225,202,.70)':'rgba(251,244,220,.83)';
    f.beginPath();f.ellipse(cx+p.x*scale,cy+p.y*scale,Math.max(.24,p.radius*scale),Math.max(.20,p.radius*scale*.72),p.shade*3,0,Math.PI*2);f.fill();
  }
  function redrawRemoved(flour){
    const tiles=new Set(),side=flour.extent/32;
    for(;removed<flour.removed.length;removed++){
      const p=flour.grains[flour.removed[removed]];tiles.add(`${Math.floor((p.x+flour.extent/2)/side)},${Math.floor((p.y+flour.extent/2)/side)}`);
    }
    const pad=Math.max(.014,1/scale);
    for(const tile of tiles){
      const [col,row]=tile.split(',').map(Number),x=col*side-flour.extent/2-pad,y=row*side-flour.extent/2-pad,size=side+pad*2;
      f.save();f.beginPath();f.rect(cx+x*scale,cy+y*scale,size*scale,size*scale);f.clip();f.clearRect(cx+x*scale,cy+y*scale,size*scale,size*scale);
      const left=Math.max(0,Math.floor((x-pad)/flour.extent*resolution+resolution/2)),right=Math.min(resolution-1,Math.floor((x+size+pad)/flour.extent*resolution+resolution/2));
      const top=Math.max(0,Math.floor((y-pad)/flour.extent*resolution+resolution/2)),bottom=Math.min(resolution-1,Math.floor((y+size+pad)/flour.extent*resolution+resolution/2));
      for(let iy=top;iy<=bottom;iy++)for(let ix=left;ix<=right;ix++)for(const index of flour.cells.get(iy*resolution+ix)||[])drawGrain(flour.grains[index]);
      f.restore();
    }
  }
  function drawAnt(ant){
    if(ant.mode==='resting')return;
    c.save();c.translate(cx+ant.x*scale,cy+ant.y*scale);c.rotate(ant.angle);
    const size=Math.max(18,scale*.22)*(ant.scale||1),stride=ant.mode==='feeding'?0:Math.sin(ant.gait);
    c.lineCap='round';c.lineJoin='round';
    // Six long, jointed legs sit behind the body so they remain easy to read.
    for(let side=-1;side<=1;side+=2)for(let leg=0;leg<3;leg++){
      const hip=[-.17,.015,.17][leg]*size,swing=stride*(leg===1?-1:1)*side*size*.11;
      const kneeX=hip+[-.11,.02,.12][leg]*size+swing*.45;
      const footX=hip+[-.29,.02,.32][leg]*size+swing;
      c.strokeStyle='rgba(36,22,15,.98)';c.lineWidth=Math.max(1.5,size*.085);c.beginPath();
      c.moveTo(hip,side*.035*size);c.lineTo(kneeX,side*.30*size);c.lineTo(footX,side*.54*size);c.stroke();
      c.strokeStyle='rgba(184,126,78,.95)';c.lineWidth=Math.max(.7,size*.028);c.beginPath();
      c.moveTo(hip,side*.04*size);c.lineTo(kneeX,side*.30*size);c.lineTo(footX,side*.53*size);c.stroke();
    }
    // Three distinct, warm brown body segments with a soft rim highlight.
    c.fillStyle='#351b12';c.strokeStyle='#b77c4e';c.lineWidth=Math.max(.8,size*.035);
    c.beginPath();c.ellipse(-.30*size,0,.235*size,.175*size,-.06,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#5b3020';c.beginPath();c.ellipse(-.015*size,0,.125*size,.115*size,0,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#402116';c.beginPath();c.ellipse(.245*size,0,.175*size,.155*size,.02,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='rgba(245,190,126,.68)';c.beginPath();c.ellipse(-.36*size,-.07*size,.12*size,.04*size,-.12,0,Math.PI*2);c.fill();
    // Two curved antennae and short mandibles mark the head at the front.
    c.strokeStyle='#e0ad78';c.lineWidth=Math.max(1,size*.045);c.beginPath();
    c.moveTo(.34*size,-.075*size);c.quadraticCurveTo(.48*size,-.30*size,.66*size,-.26*size);
    c.moveTo(.34*size,.075*size);c.quadraticCurveTo(.48*size,.30*size,.66*size,.26*size);
    c.stroke();
    c.strokeStyle='#27170f';c.lineWidth=Math.max(.8,size*.04);c.beginPath();
    c.moveTo(.38*size,-.055*size);c.lineTo(.49*size,-.13*size);c.moveTo(.38*size,.055*size);c.lineTo(.49*size,.13*size);c.stroke();
    // The collected flour rides at the mandibles; it stays attached to the ant.
    if(ant.payload.length){
      const parcel=Math.min(1,Math.max(.65,ant.payload.length/24));
      c.fillStyle='rgba(20,15,11,.7)';c.beginPath();c.ellipse(.52*size,.015*size,.205*size*parcel,.155*size*parcel,.15,0,Math.PI*2);c.fill();
      c.fillStyle='#f3ecd6';c.strokeStyle='#fff8e7';c.lineWidth=Math.max(.6,size*.025);
      c.beginPath();c.ellipse(.54*size,-.005*size,.18*size*parcel,.13*size*parcel,.15,0,Math.PI*2);c.fill();c.stroke();
      c.fillStyle='#fff9e9';
      for(const [x,y,r] of [[.47,-.10,.045],[.58,.075,.038],[.63,-.055,.03]]){c.beginPath();c.arc(x*size,y*size,r*size,0,Math.PI*2);c.fill();}
    }
    c.restore();
  }
  function draw(day){
    const {flour,ants}=day;
    if(!ants.edgeInitialized){
      ants.nest={x:-width/(2*scale)+Math.max(10/scale,.035),y:(height/2-cy)/scale};
      for(const ant of ants.ants){ant.x=ants.nest.x;ant.y=ants.nest.y;ant.angle=0;ant.entryAngle=0;}
      ants.edgeInitialized=true;
    }
    if(drawn===0)removed=flour.removed.length;
    for(;drawn<flour.deposited;drawn++)drawGrain(flour.grains[drawn]);
    redrawRemoved(flour);c.clearRect(0,0,width,height);c.drawImage(ground,0,0,width,height);c.drawImage(powder,0,0,width,height);
    for(const ant of ants.ants)drawAnt(ant);
  }
  resize();return {draw,resize,dispose(){for(const surface of [canvas,ground,powder]){surface.width=0;surface.height=0;}}};
}
