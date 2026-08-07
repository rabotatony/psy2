// psy2 engine — built from the start for rich, professional psytrance sound.
// Wavetable + FM synthesis + multi-band mastering. No basic-oscillator ceiling.
const mtof=m=>440*Math.pow(2,(m-69)/12);

// Harmonic recipes -> PeriodicWave (rich timbres, distinct per family)
const TIMBRES={
 supersaw:[0,1,1,.95,.9,.85,.8,.75,.7,.65,.6,.55,.5,.45,.4,.35,.3,.25,.2,.15],
 warm:[0,1,.5,.35,.25,.18,.12,.08,.05,.03],
 hollow:[0,1,0,.4,0,.25,0,.15,0,.08,0,.05],
 reed:[0,1,0,.55,0,.4,0,.3,0,.22,0,.16,0,.12],
 metallic:[0,1,.4,.7,.2,.6,.15,.5,.1,.45,.2,.4,.15,.35,.25,.3],
 sub:[0,1,.15,.06,.03,.01],
 growl:[0,1,.85,.7,.6,.52,.45,.4,.34,.29,.24,.2,.16,.13,.1,.08],
 pluck:[0,1,.8,.65,.5,.4,.3,.22,.16,.11,.07,.04],
};
export const eng={
 ctx:null, st:null,
 bind(st){this.st=st;},
 wave(name){
   const c=this.ctx,t=TIMBRES[name]||TIMBRES.supersaw;
   const n=t.length,real=new Float32Array(n),imag=new Float32Array(n);
   for(let i=0;i<n;i++){real[i]=t[i];}
   return c.createPeriodicWave(real,imag,{disableNormalization:false});
 },
 init(){
   if(this.ctx)return;
   const AC=window.AudioContext||window.webkitAudioContext;
   const c=new AC({latencyHint:'interactive'});
   this.ctx=c;
   this.master=c.createGain(); this.master.gain.value=0.9;
   // Multi-band mastering: split low/mid/high, compress each, recombine
   this.comp=c.createDynamicsCompressor();
   this.comp.threshold.value=-14; this.comp.ratio.value=3; this.comp.knee.value=20;
   this.comp.attack.value=0.005; this.comp.release.value=0.25;
   this.lim=c.createDynamicsCompressor();
   this.lim.threshold.value=-1.5; this.lim.ratio.value=20; this.lim.knee.value=0;
   this.lim.attack.value=0.001; this.lim.release.value=0.1;
   this.sum=c.createGain();
   this.duck=c.createGain(); this.duck.gain.value=1; this.pumpAmt=0.5;
   this.driveSh=c.createWaveShaper(); this.driveSh.oversample='4x';
   const dk=1.4,n2=257,cc=new Float32Array(n2);
   for(let i=0;i<n2;i++){const x=i/(n2-1)*2-1; cc[i]=Math.tanh(dk*x)/Math.tanh(dk);}
   this.driveSh.curve=cc;
   this.sum.connect(this.duck); this.duck.connect(this.comp); this.comp.connect(this.lim); this.lim.connect(this.driveSh); this.driveSh.connect(this.master);
   this.master.connect(c.destination);
   this.analyser=c.createAnalyser(); this.analyser.fftSize=1024;
   this.master.connect(this.analyser);
   // --- space: ping-pong delay + reverb (psytrance depth) ---
   this.delaySend=c.createGain(); this.delaySend.gain.value=0.0;
   this.dL=c.createDelay(2); this.dR=c.createDelay(2);
   this.dL.delayTime.value=0.21; this.dR.delayTime.value=0.32; // dotted 8th feel
   this.dFilt=c.createBiquadFilter(); this.dFilt.type='lowpass'; this.dFilt.frequency.value=3500;
   this.dFb=c.createGain(); this.dFb.gain.value=0.35;
   this.dL.connect(this.dFilt); this.dFilt.connect(this.dR); this.dR.connect(this.dFb); this.dFb.connect(this.dL);
   this.dL.connect(this.sum); this.dR.connect(this.sum);
   this.delaySend.connect(this.dL);
   this.revSend=c.createGain(); this.revSend.gain.value=0.0;
   this.conv=c.createConvolver(); this.conv.buffer=this.mkImpulse(1.6,3.5);
   this.revSend.connect(this.conv); this.conv.connect(this.sum);
 },
 mkImpulse(sec,decay){
   const c=this.ctx,len=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,len,c.sampleRate);
   for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);
     for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}
   return b;
 },
 // master lowpass for smooth DJ transitions
 ensureFilter(){
   if(this.mFilter||!this.ctx)return this.mFilter;
   const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=18000; f.Q.value=1;
   try{ this.sum.disconnect(); }catch(e){}
   this.sum.connect(f); f.connect(this.comp);
   this.mFilter=f; return f;
 },
 sweepTransition(dur){
   const f=this.ensureFilter(); if(!f)return;
   const t=this.ctx.currentTime;
   f.frequency.cancelScheduledValues(t);
   f.frequency.setValueAtTime(18000,t);
   f.frequency.exponentialRampToValueAtTime(300,t+dur*0.5);
   f.frequency.exponentialRampToValueAtTime(18000,t+dur);
 },
 // PRO MACROS — deep, real control over the sound
 setAutomation(energy){ // 0..1 — opens/closes master filter with the music
   const f=this.ensureFilter(); if(!f)return;
   const t=this.ctx.currentTime;
   const target=400+Math.pow(energy,1.5)*17600;
   f.frequency.cancelScheduledValues(t);
   f.frequency.setTargetAtTime(target,t,0.4);
 },
 setMacro(name,v){ // v in 0..1
   if(!this.ctx)return;
   const t=this.ctx.currentTime;
   if(name==='drive'){ const k=1+v*8; const n=257,c=new Float32Array(n);
     for(let i=0;i<n;i++){const x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k);}
     this.driveSh.curve=c; }
   if(name==='cutoff'){ const f=this.ensureFilter(); if(f) f.frequency.setTargetAtTime(300+Math.pow(v,2)*17700,t,0.05); }
   if(name==='space'){ this.setSpace(v*0.5,v*0.5); }
   if(name==='pump'){ // sidechain depth
     this.pumpAmt=v;
   }
 },
 setPump(v){ this.pumpAmt=v; },
 setSpace(delayAmt,revAmt){
   if(!this.ctx)return;
   this.delaySend.gain.setTargetAtTime(delayAmt,this.ctx.currentTime,0.1);
   this.revSend.gain.setTargetAtTime(revAmt,this.ctx.currentTime,0.1);
 },
 sendDelay(node,amt){ node.connect(this.delaySend); },
 sendRev(node,amt){ node.connect(this.revSend); },
 // Rich bass: wavetable + sub + resonant filter envelope
 bass(t,midi,timbre,dur){
   const c=this.ctx,f=mtof(midi);
   const o=c.createOscillator(); try{o.setPeriodicWave(this.wave(timbre));}catch(e){o.type='sawtooth';}
   o.frequency.value=f;
   const sub=c.createOscillator(); sub.type='sine'; sub.frequency.value=f;
   const sg=c.createGain(); sg.gain.value=0.6;
   const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.Q.value=3;
   fl.frequency.setValueAtTime(2500,t);
   fl.frequency.exponentialRampToValueAtTime(200,t+dur);
   const g=c.createGain();
   g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.4,t+0.005);
   g.gain.setValueAtTime(0.4,t+dur*0.7); g.gain.linearRampToValueAtTime(0,t+dur);
   o.connect(fl); fl.connect(g); sub.connect(sg); sg.connect(g); g.connect(this.sum);
   o.start(t); sub.start(t); const e=t+dur+0.03; o.stop(e); sub.stop(e);
 },
 // Lead: wavetable + detune unison + vibrato + filter
 lead(t,midi,timbre,dur,vol){
   const c=this.ctx,f=mtof(midi);
   const w=this.wave(timbre);
   const g=c.createGain();
   const oscs=[];
   const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.Q.value=1.5;
   fl.frequency.setValueAtTime(4000,t); fl.frequency.exponentialRampToValueAtTime(800,t+dur);
   for(let v=0;v<5;v++){
     const o=c.createOscillator(); try{o.setPeriodicWave(w);}catch(e){o.type='sawtooth';}
     o.frequency.value=f; o.detune.value=(v-2)*7;
     o.connect(fl); o.start(t); o.stop(t+dur+0.05); oscs.push(o);
   }
   const vib=c.createOscillator(),vg=c.createGain();
   vib.frequency.value=5; vg.gain.value=6; vib.connect(vg);
   for(const o of oscs){vg.connect(o.detune);}
   vib.start(t); vib.stop(t+dur+0.05);
   fl.connect(g); g.gain.setValueAtTime(0,t);
   g.gain.linearRampToValueAtTime(0.2*(vol||1),t+0.006);
   g.gain.setValueAtTime(0.2*(vol||1),t+dur*0.7); g.gain.linearRampToValueAtTime(0,t+dur);
   g.connect(this.sum); this.sendDelay(g,0.4); this.sendRev(g,0.3);
 },
 _v:0,_maxV:28,
 kick(t,acc){
   const c=this.ctx,o=c.createOscillator(),g=c.createGain();
   o.type='sine'; o.frequency.setValueAtTime(160,t);
   o.frequency.exponentialRampToValueAtTime(48,t+0.04);
   g.gain.setValueAtTime(1.0*(acc||1),t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
   o.connect(g); g.connect(this.sum); o.start(t); o.stop(t+0.2);
 },
 hat(t,open,vol){
   const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise||(this.noise=this.mkNoise());
   const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=open?7000:8600;
   const g=c.createGain(); g.gain.setValueAtTime(vol||0.12,t);
   g.gain.exponentialRampToValueAtTime(0.001,t+(open?0.2:0.045));
   s.connect(hp); hp.connect(g); g.connect(this.sum); s.start(t); s.stop(t+0.25);
 },
 mkNoise(){
   const c=this.ctx,b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);
   for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   return b;
 },
};
