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
];
export function progFor(style){ return PROG[style.scale]||PROG.MIN; }
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
