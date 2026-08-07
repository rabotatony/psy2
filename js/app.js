// psy2 app — one-tap for beginners, full control for pros.
import {STYLES,clamp} from './core.js';
import {eng} from './engine.js';
import {seq} from './music.js';
import {measureStyle} from './validate.js';
const $=s=>document.querySelector(s);
const state={bpm:142,styleIdx:0};
function applyStyle(i){
  state.styleIdx=i;
  const st=STYLES[i];
  state.bpm=st.bpm;
  const b=$('#bpmVal'); if(b)b.textContent=st.bpm;
  const sl=$('#bpmSlider'); if(sl)sl.value=st.bpm;
  seq.setStyle(st,7+i*13);
  document.querySelectorAll('.stylebtn').forEach((el,k)=>el.classList.toggle('on',k===i));
}
function toggle(){
  if(seq.playing){seq.stop(); const p=$('#play'); if(p)p.textContent='▶ PLAY';}
  else{
    try{
      eng.bind(state); seq.bind(state,eng);
      if(!seq.style)applyStyle(state.styleIdx);
      seq.start();
      if(eng.ctx&&eng.ctx.state==='suspended'){ eng.ctx.resume().then(()=>{const p=$('#play');if(p)p.textContent='■ STOP';}); }
      else { const p=$('#play'); if(p)p.textContent='■ STOP'; }
    }catch(e){
      const b=document.getElementById('errbox'); if(b){b.style.display='block';b.textContent='PLAY ERR: '+e.message;}
    }
  }
}
function buildStyles(){
  const w=$('#styles'); if(!w)return; w.innerHTML='';
  STYLES.forEach((s,i)=>{
    const b=document.createElement('button'); b.className='stylebtn'; b.type='button';
    b.innerHTML=s.name+'<small>'+s.bpm+'</small>';
    b.addEventListener('click',()=>applyStyle(i));
    w.appendChild(b);
  });
}
function init(){
  buildStyles();
  $('#play').addEventListener('click',toggle);
  $('#bpmSlider').addEventListener('input',e=>{state.bpm=+e.target.value; $('#bpmVal').textContent=state.bpm;});
  applyStyle(0);
  const mb=$('#measure'); if(mb)mb.addEventListener('click',async()=>{
    const st=STYLES[state.styleIdx];
    const r=await measureStyle(st,2);
    const out=$('#mout'); if(out)out.textContent='LUFS '+r.lufs+' · Crest '+r.crest+'dB · L'+r.low+'/M'+r.mid+'/H'+r.high+'%';
  });
  ['drive','cutoff','space','pump'].forEach(n=>{
    const el=$('#m_'+n); if(!el)return;
    el.addEventListener('input',e=>{ eng.bind(state); eng.setMacro(n, +e.target.value/100); });
  });
  const dj=$('#djBtn'); if(dj)dj.addEventListener('click',()=>{
    state.dj=!state.dj;
    seq.setDJ(state.dj,STYLES);
    seq.styleIdx=state.styleIdx;
    dj.classList.toggle('on',state.dj);
    dj.textContent=state.dj?'🎧 DJ ON':'🎧 DJ';
  });
  seq.onStyleChange=(i)=>{ applyStyle(i); };
}
document.addEventListener('DOMContentLoaded',init);
