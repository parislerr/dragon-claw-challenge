// Relaxed open palm, only used for the five-finger scene gesture.
// Ratios make the check independent of hand size and in-plane rotation.
export function relaxedFive(l){
 if(!l||l.length<21)return false;
 const d=(a,b)=>Math.hypot(l[a].x-l[b].x,l[a].y-l[b].y);
 const palm=d(5,17);if(palm<.015)return false;
 const fingers=[8,12,16,20].every(t=>d(t,0)>d(t-2,0)*1.08);
 const thumb=d(4,17)>d(3,17)*1.04&&d(4,5)>palm*.45;
 return fingers&&thumb;
}

// Index extended above the knuckles, other long fingers folded. Thumb may rest naturally.
export function pointingUp(l){
 if(!l||l.length<21)return false;
 const d=(a,b)=>Math.hypot(l[a].x-l[b].x,l[a].y-l[b].y),palm=d(0,9);
 if(palm<.03)return false;
 return d(8,0)>d(6,0)*1.12&&l[8].y<l[5].y-palm*.35&&[12,16,20].every(t=>d(t,0)<d(t-2,0)*1.03);
}
