export const STAGE_POINTS = [300,350,350];
export function weatherScore(phase, progress=0){return STAGE_POINTS.slice(0,phase).reduce((a,b)=>a+b,0)+Math.floor((STAGE_POINTS[phase]||0)*Math.max(0,Math.min(1,progress)));}
export class WeatherGame {
 constructor(){this.reset()}
 get score(){return weatherScore(this.phase,this.progress)}
 reset(){this.phase=0;this.progress=0;this.complete=false;this.hold=0;this.lastT=null;this.anchor=null;this.direction=0;this.turns=0;this.waitRelease=false;this.release=0}
 advance(){if(this.complete)return false;this.phase++;this.progress=0;this.hold=0;this.anchor=null;this.direction=0;this.turns=0;this.waitRelease=true;this.release=0;if(this.phase===3)this.complete=true;return true}
 feed(pose,x,t){const dt=this.lastT==null?0:Math.min(100,t-this.lastT);this.lastT=t;if(this.complete)return false;
  if(this.waitRelease){const old=this.phase===1?'fist':'open';if(pose!==old)this.release+=dt;else this.release=0;if(this.release>=500){this.waitRelease=false;this.anchor=null}return false}
  const target=this.phase===1?'open':'fist';if(pose!==target||x==null){this.hold=0;this.anchor=null;this.direction=0;this.progress=this.phase===0?0:this.progress;return false}
  if(this.phase===0){this.hold+=dt;this.progress=Math.min(1,this.hold/1300)}
  else{if(this.anchor==null)this.anchor=x;const threshold=this.phase===1?.085:.04;const delta=x-this.anchor;if(Math.abs(delta)>threshold){const dir=Math.sign(delta);if(this.direction&&dir!==this.direction)this.turns++;this.direction=dir;this.anchor=x}this.progress=Math.min(1,this.turns/(this.phase===1?4:5))}
  if(this.progress>=1){this.advance();return true}return false;
 }
}
