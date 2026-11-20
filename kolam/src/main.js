import {mountKolam} from './playback.js?v=20261121';

const canvas=document.querySelector('canvas');
const menu=document.querySelector('#menu');
const seedInput=document.querySelector('#seed-input');
const notice=document.querySelector('#notice');
let work;

function dailySeed(date=new Date()){
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');
  return `kolam-${year}-${month}-${day}`;
}

function readSeed(){
  const querySeed=new URLSearchParams(location.search).get('seed');
  if(querySeed)return querySeed.slice(0,200);
  const hash=location.hash.slice(1);
  const params=new URLSearchParams(hash.includes('&')?hash.slice(hash.indexOf('&')+1):hash);
  return params.get('seed')?.slice(0,200)||null;
}

function seedUrl(seed){
  const url=new URL(location.href);
  url.searchParams.set('seed',seed);
  url.hash='';
  return `${url.pathname}${url.search}`;
}

function todayUrl(){
  const url=new URL(location.href);
  url.searchParams.delete('seed');
  url.hash='';
  return `${url.pathname}${url.search}`;
}

function mount(seed=readSeed()||dailySeed()){
  work?.dispose();
  work=mountKolam(canvas,seed);
  menu.open=false;
  notice.textContent='';
}

function useSeed(seed,shareable=true){
  const clean=String(seed).trim().slice(0,200);
  if(!clean){notice.textContent='Enter a seed to grow its kolam.';seedInput.focus();return;}
  work.renew(clean);
  history.pushState(null,'',shareable?seedUrl(clean):todayUrl());
  menu.open=false;
  notice.textContent='';
}

document.querySelector('#today').addEventListener('click',()=>useSeed(dailySeed(),false));
document.querySelector('#random').addEventListener('click',()=>{
  const bytes=crypto.getRandomValues(new Uint32Array(3));
  useSeed([...bytes].map(value=>value.toString(36)).join('-'));
});
document.querySelector('#seed-form').addEventListener('submit',event=>{
  event.preventDefault();
  useSeed(seedInput.value);
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}
});
window.addEventListener('hashchange',()=>mount());
window.addEventListener('pagehide',()=>work?.dispose());
window.addEventListener('pageshow',event=>{if(event.persisted)mount();});
mount();
