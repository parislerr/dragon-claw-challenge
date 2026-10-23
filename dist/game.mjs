export const STAGE_POINTS = [1000,1000,1000];
export const STAGE_DURATION = 8000;
export const STAGE_TURNS = [0,12,16];
export function weatherPose(fingers){return fingers<0?'none':fingers<=1?'fist':fingers>=3?'open':'other'}
export function weatherScore(phase, progress=0){return STAGE_POINTS.slice(0,phase).reduce((a,b)=>a+b,0)+Math.floor((STAGE_POINTS[phase]||0)*Math.max(0,Math.min(1,progress)));}
export class WeatherGame {
 constructor(){this.reset()}
 get score(){return weatherScore(this.phase,this.progress)}
 reset(){this.phase=0;this.progress=0;this.complete=false;this.hold=0;this.lastT=null;this.anchor=null;this.direction=0;this.turns=0;this.waitRelease=false;this.release=0;this.lostSince=null}
 advance(){if(this.complete)return false;this.phase++;this.progress=0;this.hold=0;this.anchor=null;this.direction=0;this.turns=0;this.waitRelease=true;this.release=0;this.lostSince=null;if(this.phase===3)this.complete=true;return true}
 feed(pose,x,t){const dt=this.lastT==null?0:Math.min(100,t-this.lastT);this.lastT=t;if(this.complete)return false;
  if(this.waitRelease){const old=this.phase===1?'fist':'open';if(pose!==old)this.release+=dt;else this.release=0;if(this.release>=500){this.waitRelease=false;this.anchor=null}return false}
  const target=this.phase===1?'open':'fist';
  if(pose!==target||!Number.isFinite(x)){
   if(this.lostSince===null)this.lostSince=t;
   if(this.phase!==1||t-this.lostSince>200){this.anchor=null;this.direction=0}
   return false;
  }
  if(this.lostSince!==null&&t-this.lostSince>200){this.anchor=null;this.direction=0}
  this.lostSince=null;
  this.hold+=dt;
  if(this.phase===0){this.progress=Math.min(1,this.hold/STAGE_DURATION)}
  else{if(this.anchor==null)this.anchor=x;const threshold=this.phase===1?.04:.04;const delta=x-this.anchor;if(Math.abs(delta)>threshold){const dir=Math.sign(delta);if(this.direction&&dir!==this.direction)this.turns++;this.direction=dir;this.anchor=x}this.progress=Math.min(1,this.turns/STAGE_TURNS[this.phase],this.hold/STAGE_DURATION)}
  if(this.progress>=1){this.advance();return true}return false;
 }
}