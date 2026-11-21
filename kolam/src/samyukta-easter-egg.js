// Face details that belong only to the Samyukta portrait easter egg.
export function addSamyuktaFaceDetails(grains,world,random,revealDistance){
  const addStroke=(points,pigment,radius,density=2.2)=>{
    for(let segment=1;segment<points.length;segment++){
      const a=points[segment-1],b=points[segment],length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.ceil(length*density);
      for(let i=0;i<count;i++){
        const t=i/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        grains.push({x:world(x),y:world(y),radius:radius*(.78+random()*.44),shade:random(),pigment,distance:revealDistance(x,y)});
      }
    }
  };

  // Light on the bridge, with a warmer contour just to its right and under
  // the tip. The asymmetry keeps the nose soft rather than diagrammatic.
  addStroke([{x:612,y:856},{x:619,y:877},{x:625,y:899},{x:638,y:916},{x:650,y:919}], 'noseLight', .0048, 2.7);
  addStroke([{x:630,y:860},{x:636,y:883},{x:642,y:902},{x:654,y:912},{x:663,y:915},{x:655,y:922},{x:643,y:922}], 'shadow', .0042, 2.4);
  addStroke([{x:637,y:926},{x:646,y:929},{x:655,y:927}], 'shadow', .0035, 2.2);

  // Continue the raster's red flour through the full lip-shaped unshaded area.
  // These bounds follow the wider, fuller outline in the close-up; grain size,
  // shade, and pigment match the existing vermillion pixels in the portrait.
  const centerX=605,halfWidth=72;
  for(let i=0,added=0;i<5000&&added<1030;i++){
    const x=centerX+(random()*2-1)*halfWidth,t=(x-centerX)/halfWidth,edge=Math.abs(t);
    const upper=554+20*edge*edge-2.3*Math.exp(-(((edge-.22)/.16)**2));
    const lower=614-38*edge*edge;
    const y=upper+random()*(lower-upper);
    // Keep a narrow natural lip crease, while powdering both sides all the way
    // to their contours so no black patch remains inside the outline.
    const seam=578+3*edge;
    if(Math.abs(y-seam)<1.3)continue;
    const shade=random()*.15;
    grains.push({
      x:world(x),y:world(y),
      radius:.003+shade*.003,
      shade,
      pigment:'vermillion',
      distance:revealDistance(x,y),
    });
    added++;
  }
}
