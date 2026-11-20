import {randomFromSeed} from './random.js?v=20261121';
import {resolution} from './flour.js?v=20261121';
export function createRenderer(canvas,path){
  const ground=document.createElement('canvas'),powder=document.createElement('canvas'),ornament=document.createElement('canvas');
  const c=canvas.getContext('2d'),g=ground.getContext('2d'),f=powder.getContext('2d'),o=ornament.getContext('2d');
  let width,height,scale,cx,cy,drawn=0,removed=0;
  function resize(){
    width=window.innerWidth;height=window.innerHeight;const ratio=Math.min(devicePixelRatio||1,2);
    for(const surface of [canvas,ground,powder,ornament]){surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);surface.getContext('2d').setTransform(ratio,0,0,ratio,0,0);}
    scale=Math.min(width*.78,height*.75)/(path.size-.1);cx=width/2;cy=height*.51;drawn=0;removed=0;
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
    drawOrnaments();
  }
  function drawOrnaments(){
    const random=randomFromSeed(`${path.seed}:rangoli`),vermillion='#c85b43',marigold='#e5b74f';
    const px=(x,y)=>({x:cx+x*scale,y:cy+y*scale});
    function powderDot(x,y,r,color){
      const p=px(x,y),radius=r*scale;
      o.fillStyle=color;o.beginPath();o.arc(p.x,p.y,radius,0,Math.PI*2);o.fill();
      o.fillStyle='rgba(255,246,220,.42)';
      for(let i=0;i<10;i++){const a=random()*Math.PI*2,d=radius*(.25+random()*.9);o.fillRect(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,.7+random(),.7+random());}
    }
    function petal(x,y,angle,length,width,color){
      const p=px(x,y),l=length*scale,w=width*scale;
      o.save();o.translate(p.x,p.y);o.rotate(angle);o.fillStyle=color;o.strokeStyle='rgba(246,229,184,.9)';o.lineWidth=Math.max(1,scale*.014);
      o.beginPath();o.moveTo(0,0);o.bezierCurveTo(-w,-l*.3,-w*.75,-l,0,-l);o.bezierCurveTo(w*.75,-l,w,-l*.3,0,0);o.fill();o.stroke();o.restore();
    }
    function flourish(x,y,angle,size,color){
      const p=px(x,y),s=size*scale;
      o.save();o.translate(p.x,p.y);o.rotate(angle);o.strokeStyle=color;o.lineWidth=Math.max(1,scale*.018);o.lineCap='round';o.beginPath();
      o.moveTo(0,0);o.bezierCurveTo(s*.08,-s*.5,s*.65,-s*.48,s*.48,-s*.08);o.bezierCurveTo(s*.36,s*.18,s*.05,s*.05,s*.22,-s*.18);
      o.moveTo(-s*.08,-s*.05);o.quadraticCurveTo(-s*.48,-s*.38,-s*.42,-s*.72);o.stroke();o.restore();
    }
    const reach=(path.size-1)/2+.12,variants=['lotus','sprig','points'];
    const motif=variants[Math.floor(random()*variants.length)],rotation=random()*Math.PI/2;
    for(let i=0;i<4;i++){
      const a=rotation+i*Math.PI/2,x=Math.cos(a)*reach,y=Math.sin(a)*reach;
      if(motif==='lotus'){
        for(let j=-2;j<=2;j++)petal(x,y,a-Math.PI/2+j*.34,.24+random()*.06,.07,j===0?marigold:vermillion);
        powderDot(x,y,.035,marigold);
      }else if(motif==='sprig'){
        flourish(x,y,a-Math.PI/2,.34,vermillion);powderDot(x,y,.035,marigold);
      }else{
        for(let j=-1;j<=1;j++)powderDot(x+Math.cos(a+Math.PI/2)*j*.105,y+Math.sin(a+Math.PI/2)*j*.105,.032,j===0?marigold:vermillion);
        petal(x,y,a-Math.PI/2,.22,.06,vermillion);
      }
    }
    powderDot(0,0,.052,vermillion);powderDot(0,0,.022,marigold);
    o.fillStyle='rgba(226,179,75,.88)';
    for(const p of path.dots){
      if(Math.abs(p.x)+Math.abs(p.y)<2&&random()<.28){const q=px(p.x,p.y);o.beginPath();o.arc(q.x,q.y,Math.max(.5,scale*.018),0,Math.PI*2);o.fill();}
    }
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
    const size=Math.max(8.5,scale*.115)*(ant.scale||1),stride=ant.mode==='feeding'?0:Math.sin(ant.gait);
    c.lineCap='round';c.lineJoin='round';c.strokeStyle='rgba(35,24,17,.9)';c.lineWidth=Math.max(.75,size*.075);c.beginPath();
    for(let side=-1;side<=1;side+=2)for(let leg=0;leg<3;leg++){
      const x=[-.04,.04,.15][leg]*size,swing=stride*(leg===1?-1:1)*side*size*.095;
      c.moveTo(x,side*size*.015);
      c.lineTo(x+size*(leg===2?.03:-.02)+swing,side*size*.20);
      c.lineTo(x+size*(leg===0?-.17:leg===1?.17:.24)+swing,side*size*.34);
    }
    c.stroke();
    c.fillStyle='#221a15';c.strokeStyle='rgba(196,147,93,.72)';c.lineWidth=Math.max(.45,size*.045);
    c.beginPath();c.ellipse(-.25*size,0,.205*size,.145*size,-.04,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#38251a';c.beginPath();c.ellipse(.015*size,0,.105*size,.09*size,0,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#241a14';c.beginPath();c.ellipse(.285*size,0,.145*size,.13*size,0,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='rgba(235,194,134,.55)';c.beginPath();c.ellipse(-.29*size,-.055*size,.105*size,.035*size,-.12,0,Math.PI*2);c.fill();
    c.strokeStyle='rgba(217,180,130,.85)';c.lineWidth=Math.max(.45,size*.04);c.beginPath();
    c.moveTo(.36*size,-.065*size);c.quadraticCurveTo(.51*size,-.22*size,.46*size,-.30*size);
    c.moveTo(.36*size,.065*size);c.quadraticCurveTo(.51*size,.22*size,.46*size,.30*size);
    c.moveTo(.39*size,-.045*size);c.lineTo(.45*size,-.075*size);c.moveTo(.39*size,.045*size);c.lineTo(.45*size,.075*size);c.stroke();
    if(ant.payload.length){const parcel=Math.min(1,ant.payload.length/60);c.fillStyle='#eee7cf';c.beginPath();c.ellipse(.47*size,0,.10*size*parcel,.09*size*parcel,.2,0,Math.PI*2);c.fill();}
    c.restore();
  }
  function draw(day){
    const {flour,ants}=day;
    if(drawn===0)removed=flour.removed.length;
    for(;drawn<flour.deposited;drawn++)drawGrain(flour.grains[drawn]);
    redrawRemoved(flour);c.clearRect(0,0,width,height);c.drawImage(ground,0,0,width,height);c.drawImage(powder,0,0,width,height);
    const accentAlpha=day.phase==='drawing'?Math.min(1,day.age/42):day.phase==='living'?Math.max(0,day.flour.totalQuantity/(day.flour.initialQuantity||1)):0;
    c.globalAlpha=accentAlpha;c.drawImage(ornament,0,0,width,height);c.globalAlpha=1;
    for(const ant of ants.ants)drawAnt(ant);
  }
  resize();return {draw,resize,dispose(){for(const surface of [canvas,ground,powder,ornament]){surface.width=0;surface.height=0;}}};
}
