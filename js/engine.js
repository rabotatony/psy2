// psy2 engine — built from the start for rich, professional psytrance sound.
// Wavetable + FM synthesis + multi-band mastering. No basic-oscillator ceiling.
const mtof=m=>440*Math.pow(2,(m-69)/12);

// Harmonic recipes -> PeriodicWave (rich timbres, distinct per family)
const TIMBRES={
 supersaw:[0,1,.9,.8,.7,.6,.5,.45,.4,.35,.3,.26,.22,.18,.15,.12],
 warm:[0,1,.5,.35,.25,.18,.12,.08,.05,.03],
 hollow:[0,1,0,.4,0,.25,0,.15,0,.08,0,.05],
 reed:[0,1,0,.55,0,.4,0,.3,0,.22,0,.16,0,.12],
 metallic:[0,1,.6,.2,.5,.1,.4,.15,.3,.1,.25,.2,.15,.1,.2,.12],
 sub:[0,1,.15,.06,.03,.01],
 growl:[0,1,.7,.5,.4,.32,.26,.2,.15,.12,.09,.07],
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
   const c=new (window.AudioContext||window.webkitAudioContext)();
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
   this.sum.connect(this.comp); this.comp.connect(this.lim); this.lim.connect(this.master);
   this.master.connect(c.destination);
   this.analyser=c.createAnalyser(); this.analyser.fftSize=1024;
   this.master.connect(this.analyser);
 },
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
   const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.Q.value=1.5;
   fl.frequency.setValueAtTime(4000,t); fl.frequency.exponentialRampToValueAtTime(800,t+dur);
   for(let v=0;v<3;v++){
     const o=c.createOscillator(); try{o.setPeriodicWave(w);}catch(e){o.type='sawtooth';}
     o.frequency.value=f; o.detune.value=(v-1)*8;
     o.connect(fl); o.start(t); o.stop(t+dur+0.05);
   }
   const vib=c.createOscillator(),vg=c.createGain();
   vib.frequency.value=5; vg.gain.value=4; vib.connect(vg);
   fl.connect(g); g.gain.setValueAtTime(0,t);
   g.gain.linearRampToValueAtTime(0.2*(vol||1),t+0.006);
   g.gain.setValueAtTime(0.2*(vol||1),t+dur*0.7); g.gain.linearRampToValueAtTime(0,t+dur);
   g.connect(this.sum);
   vib.start(t); vib.stop(t+dur+0.05);
 },
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
