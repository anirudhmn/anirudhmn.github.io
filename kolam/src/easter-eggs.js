// The easter egg compositions are raster-traced into individual powder grains
// in flour.js. This file only identifies the special seeds and their framing.
const easterEggSeeds=new Set(['bugs','samyukta']);

export function createEasterEgg(seed){
  const key=String(seed).trim().toLowerCase();
  if(!easterEggSeeds.has(key))return null;
  return {
    seed:String(seed),easterEgg:key,strokes:[],dots:[],accentDots:[],
    length:100,size:11.15,extent:11.45,layout:'custom',symmetry:'free',
    bonds:[],flourish:null,radius:0,
  };
}
