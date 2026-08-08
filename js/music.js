// psy2 music — REVOLUTION: clean knowledge-driven sequencer/arranger.
export const SCALES={PHRY:[0,1,3,5,7,8,10],MIN:[0,2,3,5,7,8,10],HARM:[0,2,3,5,7,8,11],DORIAN:[0,2,3,5,7,9,10],PHRYDOM:[0,1,4,5,7,8,10],DHARM:[0,1,4,5,7,8,11],LYDIAN:[0,2,4,6,7,9,11],MAJOR:[0,2,4,5,7,9,11]};
export const PROGS={PHRY:[[0,0,-2,-1],[0,-1,-2,0]],MIN:[[0,8,10,0],[0,5,8,10]],HARM:[[0,8,11,0]],DORIAN:[[0,5,0,10]],PHRYDOM:[[0,1,0,10]],DHARM:[[0,1,0,11]],LYDIAN:[[0,2,0,7]],MAJOR:[[0,7,9,5]]};
// per-style identity: rhythm + synth + energy (each style = its own world)
export const PRESETS={
 'FULL-ON':{bpm:142,scale:'PHRY',bass:'roll',lead:'supersaw',kick:[0,8,16,24],hat:2,clap:1,perc:1,pad:1},
 'DARK':{bpm:147,scale:'PHRY',bass:'roll',lead:'acid',kick:[0,8,16,24],hat:2,clap:1,perc:0,pad:1,dark:1},
 'PROG':{bpm:133,scale:'DORIAN',bass:'off',lead:'pluck',kick:[0,8,16,24],hat:4,clap:0,perc:0,pad:1},
 'GOA':{bpm:140,scale:'PHRYDOM',bass:'roll',lead:'goa',kick:[0,8,16,24],hat:4,clap:0,perc:1,pad:1,arp:1},
 'ACID':{bpm:144,scale:'HARM',bass:'acid',lead:'acid',kick:[0,8,16,24],hat:2,clap:1,perc:0,pad:0},
 'HI-TECH':{bpm:170,scale:'HARM',bass:'roll',lead:'supersaw',kick:[0,8,16,24],hat:2,clap:1,perc:1,pad:0},
 'FOREST':{bpm:150,scale:'PHRY',bass:'roll',lead:'acid',kick:[0,8,16,24],hat:2,clap:0,perc:1,pad:1,dark:1},
 'NIGHT':{bpm:150,scale:'HARM',bass:'roll',lead:'acid',kick:[0,8,16,24],hat:2,clap:1,perc:0,pad:0,dark:1},
 'CHILL':{bpm:92,scale:'MAJOR',bass:'half',lead:'pluck',kick:[0,16],hat:8,clap:0,perc:0,pad:1},
 'AMBIENT':{bpm:70,scale:'LYDIAN',bass:'none',lead:'pad',kick:[],hat:0,clap:0,perc:0,pad:1},
 'PSYCHILL':{bpm:96,scale:'DHARM',bass:'half',lead:'pluck',kick:[0,16],hat:8,clap:0,perc:0,pad:1},
 'DUB':{bpm:75,scale:'MIN',bass:'wob',lead:'pluck',kick:[0,16],hat:4,clap:0,perc:0,pad:1},
 'SUOMI':{bpm:145,scale:'MIN',bass:'off',lead:'pluck',kick:[0,8,16,24],hat:2,clap:1,perc:1,pad:1},
};
export const SECTIONS=[
 {name:'INTRO',bars:8,e:0.35,kick:1,bass:1,hat:1,lead:0,pad:1},
 {name:'BUILD',bars:8,e:0.7,kick:1,bass:1,hat:1,lead:0.4,pad:1,riser:1},
 {name:'DROP',bars:16,e:1,kick:1,bass:1,hat:1,lead:1,pad:1,impact:1},
 {name:'BREAK',bars:8,e:0.3,kick:0,bass:0,hat:0,lead:0.6,pad:1},
 {name:'CLIMAX',bars:16,e:1,kick:1,bass:1,hat:1,lead:1,pad:1,impact:1},
];
export function sectionAt(bar){ let b=bar,total=SECTIONS.reduce((s,x)=>s+x.bars,0); b=b%total;
 for(const s of SECTIONS){ if(b<s.bars)return s; b-=s.bars;} return SECTIONS[0]; }
export function mulberry(seed){let a=seed|0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function genMotif(seed,scale){ const rnd=mulberry(seed),n=scale.length,A=new Array(32);
 let deg=Math.min(7,n-1);
 for(let s=0;s<32;s++){ if(s%8===0)deg=[0,Math.min(4,n-1),Math.min(7,n-1)][Math.floor(rnd()*3)];
  else if(s%4===0)deg+=rnd()<0.5?-1:1; else if(rnd()<0.4)deg+=rnd()<0.5?-1:1;
  deg=Math.max(0,Math.min(n-1,deg)); A[s]=deg;} return A; }
export const seq={
 playing:false,timer:null,nextTime:0,stepIdx:0,bar:0,st:null,eng:null,style:null,preset:null,motif:[],dj:false,
 bind(st,eng){this.st=st;this.eng=eng;},
 setStyle(name,seed){ this.preset=PRESETS[name]||PRESETS['FULL-ON']; this.styleName=name;
  this.motif=genMotif(seed||7,SCALES[this.preset.scale]); },
 start(){ const E=this.eng; E.init(); E.ctx.resume(); if(this.playing)return;
  this.playing=true; this.stepIdx=0; this.bar=0; this.nextTime=E.ctx.currentTime+0.1;
  this.timer=setInterval(()=>this.tick(),25); },
 stop(){ this.playing=false; clearInterval(this.timer); },
 tick(){ const E=this.eng,bpm=(this.st&&this.st.bpm)||this.preset.bpm,s32=60/bpm/8;
  while(this.nextTime<E.ctx.currentTime+0.15){ this.step(this.stepIdx,this.nextTime); this.stepIdx=(this.stepIdx+1)%32; this.nextTime+=s32; } },
 step(s,t){ const E=this.eng,P=this.preset,sc=SCALES[P.scale],sec=sectionAt(this.bar);
  const bpm=(this.st&&this.st.bpm)||P.bpm, sd=60/bpm/8;
  if(s===0){ E.autoLoudness(); E.setAutomation(sec.e);
    if(sec.impact&&E.impact)E.impact(t);
    if(sec.riser&&E.riser)E.riser(t+sd*8,sd*16);
    if(this.dj&&this.bar%16===0){ this.motif=genMotif(7+this.bar*13,sc); }
    if(P.pad&&E.pad&&sec.pad)E.pad(t,(this.st&&this.st.root)||40,[0,3,7],sd*8*2);
  }
  // kick
  if(sec.kick&&P.kick.includes(s))E.kick(t,1);
  // bass
  if(sec.bass&&P.bass!=='none'){
    const prog=(PROGS[P.scale]||PROGS.MIN)[Math.floor(this.bar/8)%2];
    const root=((this.st&&this.st.root)||40)+prog[Math.floor(this.bar/2)%4];
    if(P.bass==='roll'){ if(s%2===0)E.bass(t,root,P.bass,sd*1.5); }
    else if(P.bass==='off'){ if(s%8===4||s%8===20)E.bass(t,root,P.bass,sd*3); }
    else if(P.bass==='half'){ if(s%16===0)E.bass(t,root,P.bass,sd*7); }
    else if(P.bass==='wob'){ if(s%8===0)E.bass(t,root,P.bass,sd*7); }
    else if(P.bass==='acid'){ if(s%2===0)E.bass(t,root,'acid',sd*1.5); }
  }
  // hats
  if(sec.hat&&P.hat>0&&s%P.hat===0)E.hat(t,false,0.1+sec.e*0.06);
  if(sec.hat&&s%8===4)E.hat(t,true,0.12);
  if(P.clap&&sec.kick&&(s===8||s===24))E.clap(t);
  if(P.perc&&sec.hat&&(s===6||s===14||s===22||s===30))E.shaker(t);
  // lead / arp
  if(sec.lead){
    if(P.arp){ if(s%2===0){const tn=[0,2,4,7][(s/2)%4];E.lead(t,(this.st&&this.st.root)||40+24+sc[tn%sc.length],P.lead,sd*1.8,0.8);} }
    else if(s%4===0){ const deg=this.motif[s]||0;
      const prog=(PROGS[P.scale]||PROGS.MIN)[Math.floor(this.bar/8)%2];
      E.lead(t,((this.st&&this.st.root)||40)+24+sc[deg]+prog[Math.floor(this.bar/2)%4],P.lead,sd*3,sec.lead); }
    if((s===12||s===28)&&P.lead==='supersaw'){ const prog=(PROGS[P.scale]||PROGS.MIN)[0];
      [0,3,7].forEach(iv=>E.lead(t,((this.st&&this.st.root)||40)+24+sc[iv%sc.length],P.lead,sd*1.5,0.5)); }
  }
  if(s===31)this.bar++;
 },
 setDJ(on){ this.dj=on; },
};
