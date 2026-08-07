// psy2 validate — objective sound measurement: LUFS, crest, band balance.
// Renders the current style offline and reports numbers, so sound can be tuned to targets.
import {eng} from './engine.js';
import {seq} from './music.js';

export async function measureStyle(style, bars=2){
  const sr=44100, bpm=style.bpm, s32=60/bpm/8;
  const total=bars*(60/bpm*4)+1;
  const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  const off=new OAC(2,Math.ceil(total*sr),sr);
  // build a temp engine bound to offline ctx
  const tmp=Object.create(eng);
  tmp.ctx=off;
  // rebuild master chain into offline destination
  tmp.master=off.createGain(); tmp.master.gain.value=0.9;
  tmp.sum=off.createGain();
  tmp.comp=off.createDynamicsCompressor();
  tmp.comp.threshold.value=-14; tmp.comp.ratio.value=3;
  tmp.lim=off.createDynamicsCompressor();
  tmp.lim.threshold.value=-1.5; tmp.lim.ratio.value=20;
  tmp.sum.connect(tmp.comp); tmp.comp.connect(tmp.lim); tmp.lim.connect(tmp.master);
  tmp.master.connect(off.destination);
  tmp.noise=null;
  // schedule
  const SCALES=(await import('./core.js')).SCALES, progFor=(await import('./core.js')).progFor;
  const sc=SCALES[style.scale], prog=progFor(style);
  const motif=(await import('./music.js')).genMotif(7,sc,prog);
  let step=0,bar=0,t=0.05;
  const stepsPerBar=32;
  const totalSteps=bars*stepsPerBar;
  for(let s=0;s<totalSteps;s++){
    const barIdx=Math.floor(s/stepsPerBar);
    const sec={kick:1,bass:1,hat:1,lead:1,pad:0};
    const sd=s32;
    if(s%8===0) tmp.kick(t,1);
    if(s%8!==0&&s%2===0){const bc=prog[Math.floor(barIdx/2)%prog.length]; tmp.bass(t,(style.root||40)+bc,style.bass,sd*1.6);}
    if(s%2===0) tmp.hat(t,false,0.12);
    if(s%4===0){const deg=motif[s]||0; const bc=prog[Math.floor(barIdx/2)%prog.length]; tmp.lead(t,(style.root||40)+24+sc[deg]+bc,style.lead,sd*3,1);}
    t+=sd;
  }
  const buf=await off.startRendering();
  return analyze(buf);
}
export function analyze(buf){
  const d=buf.getChannelData(0),n=d.length;
  let peak=0,sum=0;
  for(let i=0;i<n;i++){const v=d[i]; if(Math.abs(v)>peak)peak=Math.abs(v); sum+=v*v;}
  const rms=Math.sqrt(sum/n);
  const lufs=20*Math.log10(rms+1e-8)-0.691; // approx integrated loudness
  const crest=20*Math.log10((peak+1e-8)/(rms+1e-8));
  // band balance: low(<250)/mid/high via simple one-pole
  let lp=0,hp=0,low=0,mid=0,high=0;
  const aL=0.02,aH=0.3;
  for(let i=0;i<n;i+=2){
    const v=d[i];
    lp+=aL*(v-lp); hp+=aH*(v-hp);
    low+=lp*lp; high+=(v-hp)*(v-hp); mid+=(v-lp-(v-hp))*(v-lp-(v-hp));
  }
  const tot=low+mid+high+1e-9;
  return {lufs:+lufs.toFixed(1),crest:+crest.toFixed(1),peak:+peak.toFixed(3),
    low:Math.round(low/tot*100),mid:Math.round(mid/tot*100),high:Math.round(high/tot*100)};
}
