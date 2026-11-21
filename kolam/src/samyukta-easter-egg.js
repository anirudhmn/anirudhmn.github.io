// Face details that belong only to the Samyukta portrait easter egg.
export function addSamyuktaFaceDetails(grains,world,random){
  const addStroke=(points,pigment,radius,density=2.2)=>{
    for(let segment=1;segment<points.length;segment++){
      const a=points[segment-1],b=points[segment],length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.ceil(length*density);
      for(let i=0;i<count;i++){
        const t=i/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        grains.push({x:world(x),y:world(y),radius:radius*(.78+random()*.44),shade:random(),pigment,distance:99.8+random()*.18});
      }
    }
  };

  // Light on the bridge, with a warmer contour just to its right and under
  // the tip. The asymmetry keeps the nose soft rather than diagrammatic.
  addStroke([{x:612,y:856},{x:619,y:877},{x:625,y:899},{x:638,y:916},{x:650,y:919}], 'noseLight', .0048, 2.7);
  addStroke([{x:630,y:860},{x:636,y:883},{x:642,y:902},{x:654,y:912},{x:663,y:915},{x:655,y:922},{x:643,y:922}], 'shadow', .0042, 2.4);
  addStroke([{x:637,y:926},{x:646,y:929},{x:655,y:927}], 'shadow', .0035, 2.2);

  // Fill the complete shaded lip silhouette. Dense, overlapping grains keep
  // the red continuous while the narrow center gap preserves the lip shape.
  const halfWidth=132,step=.85;
  for(let ix=-halfWidth;ix<=halfWidth;ix+=step){
    const t=ix/halfWidth,edge=Math.abs(t),x=626+ix;
    const upper=1040+20*edge*edge,seam=1073+12*edge,lower=1146-52*edge;
    for(let y=upper;y<=lower;y+=step){
      if(Math.abs(y-seam)<1.15)continue;
      grains.push({
        x:world(x+(random()-.5)*.34),
        y:world(y+(random()-.5)*.34),
        radius:.0048+random()*.0028,
        shade:.45+random()*.1,
        pigment:'lipRed',
        distance:99.8+random()*.18,
      });
    }
  }
}
