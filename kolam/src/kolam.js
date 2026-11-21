import {randomFromSeed,accentsForSeed} from './random.js?v=20261120-color-98';
const TAU=Math.PI*2,opening=Math.PI/4-.055;

// X crossing, D uncrossed join, B unjoined loops. This selects a single-strand
// subset of the local bond vocabulary in Gopalan & VanLeeuwen (1503.02130).
export function constructKolam(seed='4',family) {
  const random=randomFromSeed(seed),generated=random()<.5?'diamond':'square';
  const layout=family?.layout||generated;
  const flourish=accentsForSeed(seed).flourish;
  const generatedSize=layout==='diamond'?(random()<.7?7:9):(random()<.7?5:7);
  const size=family?.size||generatedSize,symmetry=random()<.45?'half-turn':'two-mirrors';
  const radius=.35+random()*.012,dots=[],half=(size-1)/2;
  for(let y=-half;y<=half;y++)for(let x=-half;x<=half;x++)if(layout==='square'||Math.abs(x)+Math.abs(y)<=half)dots.push({x,y});
  const index=new Map(dots.map((p,i)=>[`${p.x},${p.y}`,i])),candidates=[];
  dots.forEach((p,a)=>{
    for(const [dx,dy,angle] of [[1,0,0],[0,1,Math.PI/2]]){
      const b=index.get(`${p.x+dx},${p.y+dy}`);if(b!==undefined)candidates.push({a,b,angle});
    }
  });
  const key=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
  function orbit({a,b}) {
    const transform=(i,fx,fy)=>index.get(`${dots[i].x*(fx?-1:1)},${dots[i].y*(fy?-1:1)}`);
    const flips=symmetry==='half-turn'?[[false,false],[true,true]]:[[false,false],[true,false],[false,true],[true,true]];
    return flips.map(([x,y])=>key(transform(a,x,y),transform(b,x,y))).sort()[0];
  }
  for(let attempt=0;attempt<3000;attempt++){
    const types=new Map();
    const bonds=candidates.map(c=>{
      const group=orbit(c);if(!types.has(group)){const r=random();types.set(group,r<.68?'X':r<.84?'D':'B');}
      return {...c,type:types.get(group)};
    });
    if(bonds.filter(b=>b.type==='X').length<candidates.length*.5)continue;
    const path=assemble(dots,radius,bonds,{layout,flourish,size});
    if(path)return {...path,seed:String(seed),size,layout,symmetry,bonds,radius,flourish};
  }
  const bonds=candidates.map(c=>({...c,type:c.angle===0||dots[c.a].x===0?'X':'B'}));
  const path=assemble(dots,radius,bonds,{layout,flourish,size});
  if(!path)throw new Error('Could not construct a closed kolam');
  return {...path,seed:String(seed),size,layout,symmetry,bonds,radius,flourish};
}
function assemble(positions,radius,bonds,design) {
  const dots=positions.map(p=>({...p,cuts:[]})),joins=[],ports=[],edges=[];
  for(const bond of bonds)if(bond.type!=='B'){
    const a={angle:bond.angle,dot:bond.a},b={angle:(bond.angle+Math.PI)%TAU,dot:bond.b};
    dots[bond.a].cuts.push(a);dots[bond.b].cuts.push(b);joins.push([a,b,bond.type]);
  }
  function port(cut,sign){
    const angle=cut.angle+sign*opening,dot=dots[cut.dot],id=ports.length;
    ports.push({x:dot.x+radius*Math.cos(angle),y:dot.y+radius*Math.sin(angle),angle,sign,edges:[]});return id;
  }
  function edge(a,b,points){const id=edges.length;edges.push({a,b,points});ports[a].edges.push(id);ports[b].edges.push(id);}
  for(const dot of dots){
    if(!dot.cuts.length)return null;
    dot.cuts.sort((a,b)=>a.angle-b.angle);
    for(const cut of dot.cuts){cut.minus=port(cut,-1);cut.plus=port(cut,1);}
    for(let i=0;i<dot.cuts.length;i++){
      const start=dot.cuts[i],end=dot.cuts[(i+1)%dot.cuts.length],a=start.angle+opening;
      let b=end.angle-opening;while(b<=a)b+=TAU;
      const corner=design.flourish==='corner-petal'&&isCorner(dot,design.layout,(design.size-1)/2),outward=Math.atan2(dot.y,dot.x);
      let outwardAngle=outward;while(outwardAngle<a)outwardAngle+=TAU;
      const turnsAtCorner=corner&&outwardAngle<=b;
      const count=Math.ceil((b-a)*28),points=turnsAtCorner
        ?cornerPetalArc(dot,radius,a,b,outward)
        :Array.from({length:count+1},(_,j)=>{const angle=a+(b-a)*j/count;return {x:dot.x+radius*Math.cos(angle),y:dot.y+radius*Math.sin(angle)};});
      edge(start.plus,end.minus,points);
    }
  }
  function bridge(a,b){
    const p=ports[a],q=ports[b],handle=.23;
    const c={x:p.x+p.sign*Math.sin(p.angle)*handle,y:p.y-p.sign*Math.cos(p.angle)*handle};
    const d={x:q.x+q.sign*Math.sin(q.angle)*handle,y:q.y-q.sign*Math.cos(q.angle)*handle};
    edge(a,b,Array.from({length:25},(_,i)=>{
      const t=i/24,u=1-t;return {x:u*u*u*p.x+3*u*u*t*c.x+3*u*t*t*d.x+t*t*t*q.x,y:u*u*u*p.y+3*u*u*t*c.y+3*u*t*t*d.y+t*t*t*q.y};
    }));
  }
  for(const [a,b,type] of joins){if(type==='X'){bridge(a.minus,b.minus);bridge(a.plus,b.plus);}else{bridge(a.minus,b.plus);bridge(a.plus,b.minus);}}
  const visited=new Set(),points=[];let current=0;
  while(true){
    const next=ports[current].edges.find(id=>!visited.has(id));if(next===undefined)break;
    visited.add(next);const e=edges[next],forward=current===e.a,part=forward?e.points:[...e.points].reverse();
    points.push(...(points.length?part.slice(1):part));current=forward?e.b:e.a;
  }
  if(current!==0||visited.size!==edges.length||ports.some(p=>p.edges.length!==2))return null;
  let length=0;points[0].distance=0;
  for(let i=1;i<points.length;i++){length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);points[i].distance=length;}
  return {points,dots:positions,length,edgeCount:edges.length,visitedCount:visited.size};
}
function isCorner(dot,layout,half){
  return layout==='square'?Math.abs(dot.x)===half&&Math.abs(dot.y)===half:Math.abs(dot.x)+Math.abs(dot.y)===half;
}
function bezierPoints(a,b,c,d,steps=48){
  return Array.from({length:steps+1},(_,i)=>{const t=i/steps,u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};});
}
function cornerPetalArc(dot,radius,startAngle,endAngle,outward,length=.66){
  let start={x:dot.x+radius*Math.cos(startAngle),y:dot.y+radius*Math.sin(startAngle)};
  let end={x:dot.x+radius*Math.cos(endAngle),y:dot.y+radius*Math.sin(endAngle)},a=startAngle,b=endAngle,reverse=false;
  const side={x:-Math.sin(outward),y:Math.cos(outward)};
  const startSide=(start.x-dot.x)*side.x+(start.y-dot.y)*side.y,endSide=(end.x-dot.x)*side.x+(end.y-dot.y)*side.y;
  if(startSide>endSide){[start,end]=[end,start];[a,b]=[b,a];reverse=true;}
  const forward={x:Math.cos(outward),y:Math.sin(outward)},tip={x:dot.x+forward.x*(radius+length),y:dot.y+forward.y*(radius+length)};
  const tangentA={x:-Math.sin(a),y:Math.cos(a)},tangentB={x:-Math.sin(b),y:Math.cos(b)},tipHandle=.24;
  const left=bezierPoints(start,{x:start.x+tangentA.x*.20,y:start.y+tangentA.y*.20},{x:tip.x-side.x*tipHandle,y:tip.y-side.y*tipHandle},tip);
  const right=bezierPoints(tip,{x:tip.x-side.x*tipHandle,y:tip.y-side.y*tipHandle},{x:end.x-tangentB.x*.20,y:end.y-tangentB.y*.20},end);
  const points=[...left,...right.slice(1)];
  return reverse?points.reverse():points;
}
export function pointAt(path,distance){
  const points=path.points;let low=1,high=points.length-1;
  while(low<high){const mid=(low+high)>>1;if(points[mid].distance<distance)low=mid+1;else high=mid;}
  const a=points[low-1],b=points[low],t=Math.max(0,Math.min(1,(distance-a.distance)/(b.distance-a.distance)));
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
export function svgFor(path){
  const edge=path.size/2+.4,d=path.points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ')+'Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-edge} ${-edge} ${edge*2} ${edge*2}"><title>Kolam — seed ${path.seed.replace(/[<>&"']/g,'')}</title><rect x="${-edge}" y="${-edge}" width="${edge*2}" height="${edge*2}" fill="#171c1a"/><g fill="#eee8d7">${path.dots.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="0.025"/>`).join('')}</g><path d="${d}" fill="none" stroke="#eee8d7" stroke-width="0.017" stroke-linejoin="round"/></svg>`;
}
