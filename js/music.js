// psy2 music — harmonic 32-step sequencer + intelligent arrangement.
import {SCALES,PROG,progFor,clamp,RHYTHM,SOUND} from './core.js?v=2';
export function mulberry(seed){let a=seed|0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// generate a melodic motif (32 steps) that follows the scale & chord roots
function chordRoot(style,bar){
  const progs=progFor(style);
  const prog=progs[Math.floor(bar/8)%progs.length]||progs[0];
  return (prog&&prog[Math.floor(bar/2)%prog.length])||0;
}
export function genMotif(seed,scale,prog){
  const rnd=mulberry(seed),n=scale.length,A=new Array(32);
  let deg=Math.min(7,n-1);
  for(let s=0;s<32;s++){
    const pr=Array.isArray(prog[0])?prog[Math.floor(s/8)%prog.length]:prog;
    const bc=pr[Math.floor(s/4)%pr.length]||0;
    if(s%8===0) deg=Math.max(0,Math.min(n-1,Math.abs(bc)%n)); // land on chord root each bar
    else if(s%4===0) deg+=rnd()<0.5?-1:1;
    else if(rnd()<0.4) deg+=rnd()<0.5?-1:1;
    deg=Math.max(0,Math.min(n-1,deg));
    A[s]=deg;
  }
  return A;
}

// section energy curve: intro->build->drop->break->climax (real musical arc)
export const SECTIONS=[
 {name:'INTRO',bars:8,kick:1,bass:1,hat:0.3,lead:0,pad:1,energy:0.4},
 {name:'BUILD',bars:8,kick:1,bass:1,hat:0.7,lead:0.3,pad:1,energy:0.7,rise:true},
 {name:'DROP',bars:16,kick:1,bass:1,hat:1,lead:1,pad:1,energy:1},
 {name:'BREAK',bars:8,kick:0,bass:0,hat:0,lead:0.6,pad:1,energy:0.3},
 {name:'CLIMAX',bars:16,kick:1,bass:1,hat:1,lead:1,pad:1,energy:1},
];
export function sectionAt(bar){
  let b=bar,total=SECTIONS.reduce((s,x)=>s+x.bars,0);
  b=b%total;
  for(const s of SECTIONS){ if(b<s.bars)return s; b-=s.bars; }
  return SECTIONS[0];
}

export const seq={
 playing:false,timer:null,nextTime:0,stepIdx:0,bar:0,st:null,eng:null,style:null,motif:[],
 bind(st,eng){this.st=st;this.eng=eng;},
 setStyle(style,seed){ this.style=style; this.motif=genMotif(seed||7,SCALES[style.scale],progFor(style)); },
 start(){
   const E=this.eng; E.init(); E.ctx.resume();
   if(this.playing)return; this.playing=true;
   this.stepIdx=0; this.bar=0; this.nextTime=E.ctx.currentTime+0.1;
   this.timer=setInterval(()=>this.tick(),25);
 },
 stop(){ this.playing=false; clearInterval(this.timer); },
 tick(){
   const E=this.eng,st=this.st,bpm=st.bpm||this.style.bpm,s32=60/bpm/8;
   while(this.nextTime<E.ctx.currentTime+0.15){ this.step(this.stepIdx,this.nextTime); this.stepIdx=(this.stepIdx+1)%32; this.nextTime+=s32; }
 },
 step(s,t){
   const E=this.eng,st=this.st,style=this.style,sc=SCALES[style.scale],prog=progFor(style);
   const sec=sectionAt(this.bar);
   // AUTOMATION: master filter follows section energy (trance sweep)
   if(s===0&&this.eng&&this.eng.setAutomation){ this.eng.setAutomation(sec.energy); }
   const bpm=st.bpm||style.bpm,sd=60/bpm/8;
   const human=(Math.random()-0.5)*0.006; // micro-timing soul
   const RH=(typeof RHYTHM!=='undefined'&&RHYTHM[style.name])||{kick:[0,8,16,24],bass:'roll',hat:2,open:[]};
   const SS2=(typeof SOUND!=='undefined'&&SOUND[style.name])||{};
   // clap: backbeat for driving styles
   if(sec.kick&&E.clap&&(style.name==='FULL-ON'||style.name==='ACID'||style.name==='DARK'||style.name==='NIGHT')&&(s===8||s===24)) E.clap(t+human,1);
   // perc: tribal hits
   if(sec.hat&&E.perc&&RH.bass==='roll'&&(s===6||s===14||s===22||s===30)) E.perc(t+human,300+((s*53)%200),0.3);
   // section transitions: riser at end of BUILD, impact+crash at DROP start
   if(s===0){
     if(E.riser&&sec.name==='BUILD'){ /* riser over the build handled below */ }
   }
   if(E.riser&&s===24&&this.bar%8===7&&sec.name==='BUILD'){ E.riser(t,(60/(st.bpm||style.bpm))*4*2); }
   if(E.impact&&s===0&&sec.name==='DROP'){ E.impact(t); }
   // shaker offbeats for groove
   if(E.shaker&&sec.hat&&s%4===2) E.shaker(t+human,0.8);
   // zap: psy blips on random off-beats (psy styles)
   if(E.zap&&sec.lead&&(style.name==='FULL-ON'||style.name==='GOA'||style.name==='HI-TECH'||style.name==='SUOMI')&&s%8===7&&Math.random()<0.5) E.zap(t);
   // tom fill at end of 4-bar phrase
   if(E.tom&&s===28&&this.bar%4===3){ E.tom(t,180); E.tom(t+sd*1.5,150); E.tom(t+sd*3,120); }
   // granular texture in breaks
   if(E.granular&&s===0&&sec.name==='BREAK'){ E.granular(t,(60/(st.bpm||style.bpm))*4*2); }
   // ride for chill/dub
   if(E.ride&&(style.name==='CHILL'||style.name==='DUB'||style.name==='PSYCHILL')&&s%8===0) E.ride(t);
   // downSweep at end of drop phrases
   if(E.downSweep&&s===0&&this.bar%8===0&&sec.name==='CLIMAX'){ E.downSweep(t,(60/(st.bpm||style.bpm))*2); }
   if(s===0){ /* bar head */ if(sec.pad&&E.pad){ E.pad(t,(style.root||40),[0,3,7],(60/(st.bpm||style.bpm))*4*2,style.pad||'warm'); } }
   // kick: per-style pattern
   if(sec.kick&&RH.kick.includes(s)) E.kick(t+human,1);
   // bass: per-style groove following chord root
   if(sec.bass&&RH.bass!=='none'){
     const barChord=chordRoot(style,this.bar);
     const root=style? (style.root||40):40;
     if(RH.bass==='roll'){ if(s%2===0) E.bass(t+human,root+barChord,style.bass,sd*1.6); }
     else if(RH.bass==='offbeat'){ if(s%8===4||s%8===12||s%8===20||s%8===28) E.bass(t+human,root+barChord,style.bass,sd*3); }
     else if(RH.bass==='half'){ if(s%16===0) E.bass(t+human,root+barChord,style.bass,sd*7); }
     else if(RH.bass==='wobble'){ if(s%8===0) E.bass(t+human,root+barChord,style.bass,sd*7); }
   }
   // hats: per-style density
   if(sec.hat&&RH.hat>0&&s%RH.hat===0) E.hat(t+human,false,0.1+sec.hat*0.06);
   if(sec.hat>0.6&&RH.open.includes(s)) E.hat(t+human,true,0.12);
   // lead: motif follows chords
   const SS=(typeof SOUND!=='undefined'&&SOUND[style.name])||{};
   if(sec.lead&&SS.arp){
     // arpeggio: cycle chord tones every 2 steps
     if(s%2===0){ const tones=[0,2,4,7]; const tn=tones[(s/2)%4]; const barChord=chordRoot(style,this.bar);
       E.lead(t+human,(style.root||40)+24+sc[tn%sc.length]+barChord,style.lead,sd*1.8,sec.lead*0.8); }
   } else if(sec.lead&&s%4===0){
     const deg=this.motif[s]||0;
     const barChord=chordRoot(style,this.bar);
     E.lead(t+human,(style.root||40)+24+sc[deg]+barChord,style.lead,sd*3,sec.lead);
   }
   if(s===31){
     this.bar++;
     // DJ mode: every 16 bars, evolve to a related style (harmonic, varied, endless)
     if(this.dj&&this.bar%16===0){
       // infinite flow WITHIN the style: evolve motif + sweep for continuous trance flow
       if(this.eng&&this.eng.sweepTransition){ this.eng.sweepTransition(2*(60/(this.st.bpm||this.style.bpm)*4)); }
       this.motif=genMotif(7+this.bar*13, SCALES[this.style.scale], progFor(this.style));
     }
   }
 },
 setDJ(on,styles){ this.dj=on; this.styles=styles||[]; },
}
