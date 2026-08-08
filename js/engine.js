// psy2 engine — REVOLUTION: clean knowledge-driven synthesis.
// Every voice implements the proven psytrance recipe precisely (create-before-connect).
const mtof=m=>440*Math.pow(2,(m-69)/12);
export const eng={
 ctx:null,st:null,ss:{},pumpAmt:.5,
 bind(st){this.st=st;},
 _sat(k){const n=257,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(k*x)/Math.tanh(k);}return c;},
 _noise(){const c=this.ctx,b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;},
 _impulse(sec,dec){const c=this.ctx,len=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,dec);}return b;},
 init(){
  if(this.ctx)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  const c=new AC({latencyHint:'interactive'}); this.ctx=c;
  // --- master chain (all created, THEN connected) ---
  this.sum=c.createGain();
  this.duck=c.createGain(); this.duck.gain.value=1;
  this.comp=c.createDynamicsCompressor(); this.comp.threshold.value=-14; this.comp.ratio.value=2.5; this.comp.knee.value=20; this.comp.attack.value=0.015; this.comp.release.value=0.2;
  this.lim=c.createDynamicsCompressor(); this.lim.threshold.value=-1.5; this.lim.ratio.value=20; this.lim.knee.value=0; this.lim.attack.value=0.001; this.lim.release.value=0.1;
  this.driveSh=c.createWaveShaper(); this.driveSh.oversample='4x'; this.driveSh.curve=this._sat(1.4);
  this.eqLow=c.createBiquadFilter(); this.eqLow.type='lowshelf'; this.eqLow.frequency.value=100; this.eqLow.gain.value=2.5;
  this.eqMud=c.createBiquadFilter(); this.eqMud.type='peaking'; this.eqMud.frequency.value=300; this.eqMud.Q.value=1; this.eqMud.gain.value=-2;
  this.eqPres=c.createBiquadFilter(); this.eqPres.type='peaking'; this.eqPres.frequency.value=2800; this.eqPres.Q.value=0.8; this.eqPres.gain.value=1.5;
  this.eqAir=c.createBiquadFilter(); this.eqAir.type='highshelf'; this.eqAir.frequency.value=9500; this.eqAir.gain.value=2;
  this.master=c.createGain(); this.master.gain.value=0.9;
  this.sum.connect(this.duck); this.duck.connect(this.comp); this.comp.connect(this.lim);
  this.lim.connect(this.driveSh); this.driveSh.connect(this.eqLow); this.eqLow.connect(this.eqMud);
  this.eqMud.connect(this.eqPres); this.eqPres.connect(this.eqAir); this.eqAir.connect(this.master);
  this.master.connect(c.destination);
  this.analyser=c.createAnalyser(); this.analyser.fftSize=2048; this.analyser.smoothingTimeConstant=0.8;
  this.master.connect(this.analyser);
  // --- space: ping-pong delay + reverb ---
  this.delaySend=c.createGain();
  this.dL=c.createDelay(2); this.dR=c.createDelay(2); this.dL.delayTime.value=0.23; this.dR.delayTime.value=0.31;
  this.dF=c.createBiquadFilter(); this.dF.type='lowpass'; this.dF.frequency.value=3500;
  this.dFb=c.createGain(); this.dFb.gain.value=0.35;
  this.dOut=c.createGain(); this.dOut.gain.value=0.5;
  this.delaySend.connect(this.dL); this.dL.connect(this.dF); this.dF.connect(this.dR); this.dR.connect(this.dFb); this.dFb.connect(this.dL);
  this.dL.connect(this.dOut); this.dR.connect(this.dOut); this.dOut.connect(this.sum);
  this.revSend=c.createGain(); this.conv=c.createConvolver(); this.conv.buffer=this._impulse(1.8,3);
  this.revSend.connect(this.conv); this.conv.connect(this.sum);
  this.noise=this._noise();
 },
 sendD(n,a){ if(this.delaySend)n.connect(this.delaySend); },
 sendR(n,a){ if(this.revSend)n.connect(this.revSend); },
 setMacro(name,v){ if(!this.ctx)return; const t=this.ctx.currentTime;
  if(name==='drive'){ this.driveSh.curve=this._sat(1+v*8); }
  if(name==='cutoff'){ if(!this.mF)this.mF=this._ensureCut(); if(this.mF)this.mF.frequency.setTargetAtTime(300+Math.pow(v,2)*17700,t,0.05); }
  if(name==='space'){ this.dOut.gain.setTargetAtTime(v*0.8,t,0.1); this.revSend.gain.setTargetAtTime(v,t,0.1); }
  if(name==='pump'){ this.pumpAmt=v; }
 },
 _ensureCut(){ const c=this.ctx; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=18000; f.Q.value=1;
  // insert between sum and duck
  try{ this.sum.disconnect(); }catch(e){}
  this.sum.connect(f); f.connect(this.duck); return f; },
 setAutomation(e){ if(!this.ctx)return; if(!this.mF)this.mF=this._ensureCut();
  const t=this.ctx.currentTime; this.mF.frequency.setTargetAtTime(400+Math.pow(e,1.5)*17600,t,0.4); },
 autoLoudness(){ if(!this.analyser)return; const n=this.analyser.fftSize;
  if(!this._td||this._td.length!==n)this._td=new Float32Array(n);
  this.analyser.getFloatTimeDomainData(this._td);
  let s=0; for(let i=0;i<n;i+=4){const v=this._td[i];s+=v*v;}
  const rms=Math.sqrt(s/(n/4)); if(rms>1e-4){ const g=this.master.gain.value*Math.pow(0.22/rms,0.15);
   this.master.gain.setTargetAtTime(Math.min(1.4,Math.max(0.3,g)),this.ctx.currentTime,0.5);} },
 getLUFS(){ if(!this.analyser)return -60; const n=this.analyser.fftSize;
  if(!this._td2||this._td2.length!==n)this._td2=new Float32Array(n);
  this.analyser.getFloatTimeDomainData(this._td2);
  let s=0;for(let i=0;i<n;i++){const v=this._td2[i];s+=v*v;} const rms=Math.sqrt(s/n);
  return +(20*Math.log10(rms+1e-8)-0.691).toFixed(1); },
 // ============ VOICES (proven recipes) ============
 kick(t,a){ const c=this.ctx,aq=a||1;
  const o=c.createOscillator(),g=c.createGain(); o.type='sine';
  o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(48,t+0.008); o.frequency.exponentialRampToValueAtTime(45,t+0.09);
  g.gain.setValueAtTime(1.0*aq,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
  o.connect(g); g.connect(this.sum); o.start(t); o.stop(t+0.22);
  const cl=c.createOscillator(),cg=c.createGain(); cl.type='square';
  cl.frequency.setValueAtTime(900,t); cl.frequency.exponentialRampToValueAtTime(200,t+0.012);
  cg.gain.setValueAtTime(0.35*aq,t); cg.gain.exponentialRampToValueAtTime(0.001,t+0.02);
  cl.connect(cg); cg.connect(this.sum); cl.start(t); cl.stop(t+0.03);
  if(this.duck){ const d=this.duck.gain,amt=0.3+this.pumpAmt*0.5; d.cancelScheduledValues(t); d.setValueAtTime(1-amt,t); d.setTargetAtTime(1,t+0.02,0.09);} },
 bass(t,midi,mode,dur){ const c=this.ctx,f=mtof(midi);
  const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=f;
  const sub=c.createOscillator(); sub.type='sine'; sub.frequency.value=f/2;
  const sg=c.createGain(); sg.gain.value=0.55;
  const fl=c.createBiquadFilter(); fl.type='lowpass';
  const acid=(mode==='acid'); fl.Q.value=acid?14:3;
  if(mode==='wob'){ const wl=c.createOscillator(),wg=c.createGain(); wl.type='sine'; wl.frequency.value=2; wg.gain.value=900; wl.connect(wg); wg.connect(fl.frequency); wl.start(t); wl.stop(t+dur+0.05); }
  const open=acid?2500:1800, close=150;
  fl.frequency.setValueAtTime(open,t); fl.frequency.exponentialRampToValueAtTime(close,t+Math.min(dur,0.12));
  const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.42,t+0.003);
  g.gain.setValueAtTime(0.42,t+dur*0.6); g.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(fl); fl.connect(g); sub.connect(sg); sg.connect(g); g.connect(this.sum);
  o.start(t); sub.start(t); const e=t+dur+0.03; o.stop(e); sub.stop(e); },
 lead(t,midi,timbre,dur,vol){ const c=this.ctx,f=mtof(midi),v=vol||1;
  const n=(timbre==='supersaw'||timbre==='goa')?5:3;
  const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=150;
  const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.Q.value=1.2;
  fl.frequency.setValueAtTime(6000,t); fl.frequency.exponentialRampToValueAtTime(1200,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.16*v,t+0.006);
  g.gain.setValueAtTime(0.16*v,t+dur*0.7); g.gain.linearRampToValueAtTime(0,t+dur);
  for(let i=0;i<n;i++){ const o=c.createOscillator(); o.type=(timbre==='acid'?'square':'sawtooth');
   o.frequency.value=f; o.detune.value=(i-(n-1)/2)*14; o.connect(fl); o.start(t); o.stop(t+dur+0.05); }
  fl.connect(hp); hp.connect(g); g.connect(this.sum); this.sendD(g,0.4); this.sendR(g,0.25); },
 pad(t,root,chord,dur){ const c=this.ctx; const notes=(chord||[0,7]).map(x=>root+12+x);
  notes.forEach(mid=>{ const f=mtof(mid);
   const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1100;
   const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.05,t+0.4);
   g.gain.setValueAtTime(0.05,t+Math.max(0.5,dur-0.5)); g.gain.linearRampToValueAtTime(0,t+dur);
   for(let i=0;i<2;i++){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=i?6:-6; o.connect(lp); o.start(t); o.stop(t+dur+0.1);}
   lp.connect(g); g.connect(this.sum); this.sendR(g,0.6); }); },
 hat(t,open,vol){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise;
  const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=open?7000:8500;
  const g=c.createGain(); g.gain.setValueAtTime(vol||0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+(open?0.25:0.045));
  s.connect(hp); hp.connect(g); g.connect(this.sum); s.start(t); s.stop(t+0.3); },
 clap(t){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise;
  const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=1.2;
  const g=c.createGain(); g.gain.setValueAtTime(0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
  s.connect(bp); bp.connect(g); g.connect(this.sum); this.sendR(g,0.3); s.start(t); s.stop(t+0.2); },
 shaker(t){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise;
  const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7500;
  const g=c.createGain(); g.gain.setValueAtTime(0.1,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.06);
  s.connect(hp); hp.connect(g); g.connect(this.sum); s.start(t); s.stop(t+0.08); },
 crash(t){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise;
  const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=5000;
  const g=c.createGain(); g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+1.2);
  s.connect(hp); hp.connect(g); g.connect(this.sum); this.sendR(g,0.5); s.start(t); s.stop(t+1.3); },
 riser(t,dur){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise;
  const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=2;
  bp.frequency.setValueAtTime(300,t); bp.frequency.exponentialRampToValueAtTime(8000,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.001,t); g.gain.exponentialRampToValueAtTime(0.3,t+dur); g.gain.exponentialRampToValueAtTime(0.001,t+dur+0.05);
  s.connect(bp); bp.connect(g); g.connect(this.sum); this.sendR(g,0.4); s.start(t); s.stop(t+dur+0.1); },
 impact(t){ const c=this.ctx,o=c.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(35,t+0.4);
  const g=c.createGain(); g.gain.setValueAtTime(0.8,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  o.connect(g); g.connect(this.sum); o.start(t); o.stop(t+0.55); this.crash(t); },
 zap(t){ const c=this.ctx,o=c.createOscillator(); o.type='square';
  o.frequency.setValueAtTime(1800,t); o.frequency.exponentialRampToValueAtTime(120,t+0.09);
  const g=c.createGain(); g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
  o.connect(g); g.connect(this.sum); this.sendD(g,0.4); o.start(t); o.stop(t+0.12); },
};
