import {randomFromSeed} from './random.js';
import {resolution} from './flour.js';
export function createRenderer(canvas,path){
  const ground=document.createElement('canvas'),powder=document.createElement('canvas');
  const c=canvas.getContext('2d'),g=ground.getContext('2d'),f=powder.getContext('2d');
  let width,height,scale,cx,cy,drawn=0,removed=0;
  function resize(){
    width=window.innerWidth;height=window.innerHeight;const ratio=Math.min(devicePixelRatio||1,2);
    for(const surface of [canvas,ground,powder]){surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);surface.getContext('2d').setTransform(ratio,0,0,ratio,0,0);}
    scale=Math.min(width*.75,height*.72)/(path.size-.1);cx=width/2;cy=height*.53;drawn=0;removed=0;
    const random=randomFromSeed(`${path.seed}:ground`);g.fillStyle='#242827';g.fillRect(0,0,width,height);
    for(let i=0;i<65;i++){
      const x=random()*width,y=random()*height,r=50+random()*Math.min(width,height)*.45;
      const glow=g.createRadialGradient(x,y,0,x,y,r);
      glow.addColorStop(0,i%3?'rgba(75,78,63,.075)':'rgba(10,20,22,.13)');glow.addColorStop(1,'rgba(30,35,32,0)');
      g.fillStyle=glow;g.fillRect(0,0,width,height);
    }
    for(let i=0;i<width*height/18;i++){
      g.fillStyle=random()<.5?'rgba(6,15,15,.08)':'rgba(126,122,95,.035)';
      g.fillRect(random()*width,random()*height,.4+random()*.9,.3+random()*.8);
    }
    const edge=height*.032;g.fillStyle='#30312b';g.fillRect(0,0,width,edge);
    g.strokeStyle='rgba(13,17,16,.55)';g.lineWidth=2;g.beginPath();g.moveTo(0,edge);
    for(let x=0;x<=width;x+=12)g.lineTo(x,edge+(random()-.5)*1.1);g.stroke();
    const light=g.createLinearGradient(0,0,0,height);light.addColorStop(0,'rgba(150,146,118,.035)');light.addColorStop(.6,'rgba(0,0,0,0)');light.addColorStop(1,'rgba(0,9,11,.14)');g.fillStyle=light;g.fillRect(0,0,width,height);
  }
  function drawGrain(p){
    if(p.removed)return;
    f.fillStyle=p.shade<.16?'rgba(175,174,151,.42)':p.shade<.65?'rgba(231,225,202,.70)':'rgba(251,244,220,.83)';
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
    const size=Math.max(6.8,scale*.09),stride=ant.mode==='feeding'?0:Math.sin(ant.gait);
    c.strokeStyle='rgba(116,105,76,.65)';c.lineWidth=.55;c.beginPath();
    for(let sign=-1;sign<=1;sign+=2)for(let leg=0;leg<3;leg++){
      const x=(leg-1)*size*.14,swing=stride*(leg===1?-1:1)*sign*size*.06;
      c.moveTo(x,0);c.lineTo(x+size*.04+swing,sign*size*.24);c.lineTo(x-size*.12+swing,sign*size*.36);
    }
    c.stroke();c.fillStyle='#111714';c.strokeStyle='rgba(117,106,73,.58)';c.lineWidth=.4;
    for(const [x,rx,ry] of [[-.23,.22,.15],[.04,.12,.11],[.25,.13,.12]]){c.beginPath();c.ellipse(x*size,0,rx*size,ry*size,0,0,Math.PI*2);c.fill();c.stroke();}
    c.beginPath();c.moveTo(size*.32,-size*.07);c.lineTo(size*.49,-size*.19);c.moveTo(size*.32,size*.07);c.lineTo(size*.49,size*.19);c.stroke();
    if(ant.payload.length){const parcel=Math.min(1,ant.payload.length/60);c.fillStyle='#eee7cf';c.beginPath();c.ellipse(size*.47,0,size*.12*parcel,size*.1*parcel,.2,0,Math.PI*2);c.fill();}
    c.restore();
  }
  function draw(day){
    const {flour,ants,wash}=day;
    if(drawn===0)removed=flour.removed.length;
    for(;drawn<flour.deposited;drawn++)drawGrain(flour.grains[drawn]);
    redrawRemoved(flour);c.clearRect(0,0,width,height);c.drawImage(ground,0,0,width,height);c.drawImage(powder,0,0,width,height);
    for(const ant of ants.ants)drawAnt(ant);
    if(wash){
      for(const p of wash.particles){
        const age=wash.flowTime/16-p.born,alpha=Math.max(0,.65-age*1.6);if(!alpha)continue;
        const x=p.x+Math.sin(p.y*13+p.shade*6)*age*.1,y=p.y+age*flour.extent*1.65;
        c.fillStyle=`rgba(193,199,182,${alpha})`;c.fillRect(cx+x*scale,cy+y*scale,.7,(.006+age*.035)*scale);
      }
      if(wash.progress<1){
        const y=cy+wash.front*scale,x=cx-flour.extent*scale/2,sheen=c.createLinearGradient(0,y-25,0,y+8);
        sheen.addColorStop(0,'rgba(112,134,129,0)');sheen.addColorStop(.75,'rgba(112,134,129,.12)');sheen.addColorStop(1,'rgba(112,134,129,0)');c.fillStyle=sheen;c.fillRect(x,y-25,flour.extent*scale,33);
      }
    }
  }
  resize();return {draw,resize,dispose(){for(const surface of [canvas,ground,powder]){surface.width=0;surface.height=0;}}};
}
