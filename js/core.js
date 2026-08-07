// psy2 core — each style is a complete, distinct musical identity.
export const SCALES={
 PHRY:[0,1,3,5,7,8,10], MIN:[0,2,3,5,7,8,10], HARM:[0,2,3,5,7,8,11],
 DORIAN:[0,2,3,5,7,9,10], MAJOR:[0,2,4,5,7,9,11], LYDIAN:[0,2,4,6,7,9,11],
 PHRYDOM:[0,1,4,5,7,8,10], DHARM:[0,1,4,5,7,8,11],
};
// chord progressions per scale (semitone roots), varied & musical
export const PROG={
 PHRY:[[0,0,-2,-1],[0,-1,-2,0],[0,-2,-1,-2]],
 MIN:[[0,8,10,0],[0,5,8,10],[0,10,8,0]],
 HARM:[[0,8,11,0],[0,5,7,0]],
 DORIAN:[[0,5,0,10],[0,5,10,0]],
 MAJOR:[[0,7,9,5],[0,5,9,7]],
 LYDIAN:[[0,2,0,7],[0,2,4,0]],
 PHRYDOM:[[0,1,0,10],[0,1,10,0]],
 DHARM:[[0,1,0,11],[0,1,11,0]],
};
// Each style: bpm, scale, bass timbre, lead timbre, pad timbre, energy, progression
export const STYLES=[
 {name:'FULL-ON',bpm:142,scale:'PHRY',bass:'growl',lead:'supersaw',pad:'warm',energy:0.9},
 {name:'DARK',bpm:145,scale:'PHRY',bass:'growl',lead:'reed',pad:'hollow',energy:0.85},
 {name:'PROG',bpm:132,scale:'DORIAN',bass:'sub',lead:'warm',pad:'warm',energy:0.6},
 {name:'ACID',bpm:144,scale:'HARM',bass:'growl',lead:'reed',pad:'hollow',energy:0.8},
 {name:'GOA',bpm:138,scale:'PHRYDOM',bass:'growl',lead:'supersaw',pad:'warm',energy:0.75},
 {name:'NIGHT',bpm:150,scale:'HARM',bass:'growl',lead:'metallic',pad:'hollow',energy:0.85},
 {name:'CHILL',bpm:92,scale:'MAJOR',bass:'sub',lead:'warm',pad:'warm',energy:0.3},
 {name:'AMBIENT',bpm:70,scale:'LYDIAN',bass:'sub',lead:'hollow',pad:'warm',energy:0.15},
 {name:'PSYCHILL',bpm:96,scale:'DHARM',bass:'sub',lead:'hollow',pad:'warm',energy:0.35},
 {name:'DUB',bpm:76,scale:'MIN',bass:'sub',lead:'reed',pad:'hollow',energy:0.3},
 {name:'HI-TECH',bpm:170,scale:'HARM',bass:'growl',lead:'metallic',pad:'hollow',root:41},
 {name:'FOREST',bpm:150,scale:'PHRY',bass:'growl',lead:'reed',pad:'hollow',root:38},
 {name:'SUOMI',bpm:145,scale:'MIN',bass:'growl',lead:'pluck',pad:'warm',root:43},
];
export function progFor(style){ return PROG[style.scale]||PROG.MIN; }
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

// Per-style sound character — makes each style genuinely distinct
export const SOUND={
 'FULL-ON':{drive:.45,cut:.85,space:.3,pump:.55,acid:0,gate:1,arp:0},
 'DARK':{drive:.8,cut:.45,space:.2,pump:.65,acid:0,gate:0,arp:0},
 'PROG':{drive:.25,cut:.7,space:.5,pump:.35,acid:0,gate:0,arp:1},
 'ACID':{drive:.6,cut:.9,space:.25,pump:.5,acid:1,gate:0,arp:0,fm:1},
 'GOA':{drive:.4,cut:.8,space:.45,pump:.45,acid:0,gate:1,arp:1},
 'NIGHT':{drive:.7,cut:.55,space:.3,pump:.6,acid:1,gate:0,arp:0,fm:1},
 'CHILL':{drive:.15,cut:.5,space:.6,pump:.2,acid:0,gate:0,arp:1},
 'AMBIENT':{drive:.1,cut:.35,space:.8,pump:.1,acid:0,gate:0,arp:0},
 'PSYCHILL':{drive:.3,cut:.5,space:.65,pump:.25,acid:0,gate:0,arp:1},
 'DUB':{drive:.35,cut:.4,space:.75,pump:.3,acid:0,gate:0,arp:0},
 'HI-TECH':{drive:.85,cut:.9,space:.25,pump:.7,acid:1,gate:0,arp:1,fm:1},
 'FOREST':{drive:.75,cut:.5,space:.35,pump:.6,acid:0,gate:1,arp:0,fm:0},
 'SUOMI':{drive:.5,cut:.75,space:.35,pump:.55,acid:0,gate:1,arp:1,fm:0},
};

// Per-style rhythm identity — each style its own groove, its own thing
export const RHYTHM={
 'FULL-ON':{kick:[0,8,16,24],bass:'roll',hat:2,open:[4,12,20,28]},
 'DARK':{kick:[0,8,16,24],bass:'roll',hat:2,open:[]},
 'PROG':{kick:[0,8,16,24],bass:'offbeat',hat:4,open:[8,24]},
 'ACID':{kick:[0,8,16,24],bass:'roll',hat:2,open:[4,12,20,28]},
 'GOA':{kick:[0,8,16,24],bass:'roll',hat:4,open:[8,24]},
 'NIGHT':{kick:[0,8,16,24],bass:'roll',hat:2,open:[4,20]},
 'CHILL':{kick:[0,16],bass:'half',hat:8,open:[]},
 'AMBIENT':{kick:[],bass:'none',hat:0,open:[]},
 'PSYCHILL':{kick:[0,16],bass:'half',hat:8,open:[]},
 'DUB':{kick:[0,16],bass:'wobble',hat:4,open:[]},
 'HI-TECH':{kick:[0,8,16,24],bass:'roll',hat:2,open:[4,12,20,28]},
 'FOREST':{kick:[0,8,16,24],bass:'roll',hat:2,open:[]},
 'SUOMI':{kick:[0,8,16,24],bass:'offbeat',hat:2,open:[8,24]},
};
