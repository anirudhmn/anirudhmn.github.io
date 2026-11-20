import {mountKolam} from './playback.js';
import {svgFor} from './kolam.js';
const canvas=document.querySelector('canvas'),menu=document.querySelector('#menu'),pause=document.querySelector('#pause'),notice=document.querySelector('#notice');
const motion=matchMedia('(prefers-reduced-motion: reduce)');let work;
function readSeed(){const raw=location.hash.slice(1);const query=raw.includes('&')?raw.slice(raw.indexOf('&')+1):raw;return new URLSearchParams(query).get('seed')?.slice(0,200)||'4';}
function urlFor(seed,path){return `#before-dawn&seed=${encodeURIComponent(seed)}`+(path?`&layout=${path.layout}&size=${path.size}`:'');}
function readFamily(){const params=new URLSearchParams(location.hash.slice(1).split('&').slice(1).join('&')),layout=params.get('layout'),size=Number(params.get('size'));return (layout==='diamond'&&[7,9].includes(size))||(layout==='square'&&[5,7].includes(size))?{layout,size}:undefined;}
function label(){pause.textContent=work.paused?'Resume':'Pause';}
function mount(){work?.dispose();work=mountKolam(canvas,readSeed(),day=>history.replaceState(null,'',urlFor(day.seed,day.path)),readFamily());menu.open=false;notice.textContent='';label();}
pause.addEventListener('click',()=>{work.setPaused(!work.paused);label();});
document.querySelector('#renew').addEventListener('click',()=>{
  const bytes=crypto.getRandomValues(new Uint32Array(2)),seed=[...bytes].map(n=>n.toString(36)).join('-');
  work.renew(seed);history.pushState(null,'',urlFor(seed));menu.open=false;notice.textContent='';
});
document.querySelector('#share').addEventListener('click',async()=>{
  try{const url=new URL(location.href);const day=work.day;url.hash=day.nextSeed?urlFor(day.nextSeed,day.manual?undefined:day.path):urlFor(day.seed,day.path);await navigator.clipboard.writeText(url.href);notice.textContent='Link copied.';}
  catch{notice.textContent='Copy the address from your browser to share this day.';}
});
document.querySelector('#save').addEventListener('click',()=>{
  const path=work.day.path,url=URL.createObjectURL(new Blob([svgFor(path)],{type:'image/svg+xml'}));
  const a=document.createElement('a');a.href=url;a.download=`before-dawn-${path.seed.replace(/[^a-zA-Z0-9-]/g,'-')}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice.textContent='Saved the complete line drawing.';
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
motion.addEventListener('change',()=>queueMicrotask(label));window.addEventListener('hashchange',mount);
window.addEventListener('pagehide',()=>work.dispose());window.addEventListener('pageshow',event=>{if(event.persisted)mount();});mount();
