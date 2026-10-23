export class SwipeGate {
 constructor(){this.reset()}
 reset(){this.points=[];this.armed=false;this.stable=null;this.missing=null}
 update(x,y,t,locked=false){
  if(locked){this.reset();return false}
  if(!Number.isFinite(x)||!Number.isFinite(y)){
   if(this.missing===null)this.missing=t;
   if(t-this.missing>180){this.reset();this.missing=t}
   return false;
  }
  if(this.missing!==null&&t-this.missing>180)this.reset();
  this.missing=null;
  if(!this.armed){
   if(!this.stable||Math.abs(x-this.stable.x)>.07||Math.abs(y-this.stable.y)>.10)this.stable={x,y,t};
   if(t-this.stable.t>=180){this.armed=true;this.points=[{x,y,t}]}
   return false;
  }
  this.points.push({x,y,t});this.points=this.points.filter(p=>t-p.t<=1100);
  for(let i=0;i<this.points.length-2;i++){
   const a=this.points[i],dx=a.x-x,dy=Math.abs(y-a.y),dt=t-a.t;
   if(dt>=80&&dx>=.11&&dy<=.24&&dx>dy*.85){this.reset();return true}
  }
  return false;
 }
}
export class SceneState {
 constructor(count){this.index=0;this.count=count;this.busy=false}
 begin(){if(this.busy||this.index>=this.count-1)return false;this.busy=true;return true}
 complete(){if(this.busy){this.index++;this.busy=false}}
 cancel(){this.busy=false}
}

// Repeated renders keep the original deadline; leaving the ending cancels it.
export class SceneReturnTimer {
 constructor(duration=15000){this.duration=duration;this.deadline=null}
 start(now){if(this.deadline===null)this.deadline=now+this.duration}
 cancel(){this.deadline=null}
 remaining(now){return this.deadline===null?null:Math.max(0,Math.ceil((this.deadline-now)/1000))}
 due(now){return this.deadline!==null&&now>=this.deadline}
}
