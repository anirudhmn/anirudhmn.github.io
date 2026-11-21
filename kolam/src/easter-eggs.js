import {easterEggTemplates} from './easter-egg-data.js?v=20261121-easter-eggs';

const sourceExtent=10.8,sourcePixels=1254;
const toWorld=value=>(value/(sourcePixels-1)-.5)*sourceExtent;

export function createEasterEgg(seed){
  const key=String(seed).trim().toLowerCase();
  const template=easterEggTemplates[key];
  if(!template)return null;
  const strokes=template.strokes.map(line=>{
    const points=line.map(([x,y])=>({x:toWorld(x),y:toWorld(y)}));
    if(points.length>2){
      const first=points[0],last=points[points.length-1];
      if(Math.hypot(first.x-last.x,first.y-last.y)>.001)points.push({...first});
    }
    return points;
  });
  const dots=template.dots.map(([x,y,r])=>({x:toWorld(x),y:toWorld(y),radius:r*sourceExtent/(sourcePixels-1)}));
  const accentDots=template.accentDots.map(({x,y,r,color,ring})=>({x:toWorld(x),y:toWorld(y),radius:r*sourceExtent/(sourcePixels-1),color,ring}));
  if(key==='samyukta'){
    const pixelStroke=points=>strokes.push(points.map(([x,y])=>({x:toWorld(x),y:toWorld(y)})));
    const ellipse=(cx,cy,rx,ry)=>pixelStroke(Array.from({length:36},(_,i)=>{const a=i*Math.PI*2/35;return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];}));
    // Bring back the eyes and nose ring as clear kolam marks in the portrait.
    ellipse(525,430,12,10);ellipse(675,430,12,10);ellipse(556,511,8,10);
    pixelStroke([[479,405],[495,398],[514,396],[533,399],[548,405]]);
    pixelStroke([[650,405],[667,399],[686,399],[702,405],[713,408]]);
    accentDots.push({x:toWorld(628),y:toWorld(297),radius:.055,color:'vermillion',ring:false});
  }
  const length=strokes.reduce((total,line)=>total+line.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-line[i].x,p.y-line[i].y),0),0);
  return {seed:String(seed),easterEgg:key,strokes,dots,accentDots,length,size:11.15,extent:11.45,layout:'custom',symmetry:'free',flourish:null,radius:0};
}
