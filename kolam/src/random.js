export function randomFromSeed(seed) {
  let state=2166136261;
  for(const char of String(seed)){state^=char.charCodeAt(0);state=Math.imul(state,16777619);}
  return () => {
    state=(state+0x6D2B79F5)>>>0;
    let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

export function accentsForSeed(seed) {
  const random=randomFromSeed(`${seed}:accent-style`);
  let color=random()<.68,flourish=random()<.58;
  if(!color&&!flourish)color=true;
  return {color,flourish};
}
