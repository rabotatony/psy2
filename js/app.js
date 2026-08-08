// psy2 app — REVOLUTION: clean UI matching the vision (neon, visualizer, cards, macros, LUFS)
import {eng} from './engine.js';
import {seq,PRESETS} from './music.js';
const $=s=>document.querySelector(s);
const state={bpm:142,style:'FULL-ON',root:42};
let freqArr=null; let vizRot=0;
function applyStyle(name){
  state.style=name; const p=PRESETS[name]; state.bpm=p.bpm;
  const bv=$('#bpmVal'); if(bv)bv.textContent=p.bpm;
  const sl=$('#bpmSlider'); if(sl)sl.value=p.bpm;
  seq.setStyle(name,7+name.length*13);
  document.querySelectorAll('.stylecard').forEach(el=>el.classList.toggle('on',el.dataset.style===name));
  if(eng.ctx){ eng.setAutomation(0.8); }
}
function toggle(){
  if(seq.playing){ seq.stop(); const p=$('#play'); if(p)p.textContent='PLAY ▶'; }
  else{
    try{
      eng.bind(state); seq.bind(state,eng);
      if(!seq.preset)seq.setStyle(state.style,7);
      seq.start();
      const p=$('#play'); if(p)p.textContent='■ STOP';
    }catch(e){ const b=$('#errbox'); if(b){b.style.display='block';b.textContent='PLAY ERR: '+e.message;} }
  }
}
function buildStyles(){
  const w=$('#styles'); if(!w)return; w.innerHTML='';
  Object.keys(PRESETS).forEach(name=>{
    const c=document.createElement('button'); c.type='button'; c.className='stylecard'; c.dataset.style=name;
    c.innerHTML='<b>'+name+'</b><small>'+PRESETS[name].bpm+' BPM</small><canvas width="70" height="22"></canvas>';
    const cv=c.querySelector('canvas'),ctx=cv.getContext('2d');
    ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--'+(name.toLowerCase())+'-c')||'#7ef';
    ctx.beginPath(); for(let x=0;x<70;x++){ ctx.lineTo(x,11+Math.sin(x*0.4+name.length)*6*Math.sin(x*0.07)); } ctx.stroke();
    c.addEventListener('click',()=>applyStyle(name));
    w.appendChild(c);
  });
}
function buildMacros(){
  const host=$('#macros'); if(!host||host.dataset.built)return; host.dataset.built='1';
  [['DRIVE',50,'drive'],['CUTOFF',80,'cutoff'],['SPACE',40,'space'],['PUMP',50,'pump']].forEach(([lab,val,key])=>{
    const l=document.createElement('label'); l.className='macro';
    l.innerHTML='<span>'+lab+'</span><input type="range" min="0" max="100" value="'+val+'"><em>'+val+'%</em>';
    const r=l.querySelector('input'),em=l.querySelector('em');
    r.addEventListener('input',()=>{ em.textContent=r.value+'%'; if(eng.ctx)eng.setMacro(key,+r.value/100); });
    host.appendChild(l);
  });
}
function viz(){
  const cv=$('#viz'); if(!cv)return; const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,cx=W/2,cy=H/2;
  function draw(){
    requestAnimationFrame(draw);
    ctx.fillStyle='rgba(5,8,12,0.3)'; ctx.fillRect(0,0,W,H);
    if(eng.analyser&&seq.playing){
      if(!freqArr)freqArr=new Uint8Array(eng.analyser.frequencyBinCount);
      eng.analyser.getByteFrequencyData(freqArr);
    }
    const N=90; vizRot=(vizRot||0)+0.004; const rot=vizRot;
    for(let i=0;i<N;i++){
      const v=(freqArr&&seq.playing)?freqArr[i*3]/255:0.04+0.03*Math.sin(Date.now()/700+i*0.35);
      const a=i/N*Math.PI*2+rot, R0=Math.min(W,H)*0.2, len=v*Math.min(W,H)*0.28+2;
      ctx.strokeStyle='hsla('+(160+i*2)+',95%,'+(52+v*25)+'%,'+(0.3+v*0.7)+')';
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*R0,cy+Math.sin(a)*R0); ctx.lineTo(cx+Math.cos(a)*(R0+len),cy+Math.sin(a)*(R0+len)); ctx.stroke();
    }
    // LUFS meter
    const lm=$('#lufs'); if(lm&&eng.getLUFS)lm.textContent=eng.getLUFS()+' LUFS';
  }
  draw();
}
function init(){
  buildStyles(); buildMacros();
  $('#play').addEventListener('click',toggle);
  $('#dj').addEventListener('click',e=>{ seq.setDJ(!seq.dj); e.target.classList.toggle('on',seq.dj); });
  $('#measure').addEventListener('click',()=>{ const m=$('#lufs'); if(m&&eng.getLUFS)m.textContent=eng.getLUFS()+' LUFS'; });
  $('#bpmSlider').addEventListener('input',e=>{ state.bpm=+e.target.value; $('#bpmVal').textContent=state.bpm; });
  applyStyle('FULL-ON');
  viz();
}
document.addEventListener('DOMContentLoaded',init);
