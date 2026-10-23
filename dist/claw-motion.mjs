// Keep claws in native SVG image layers. A detached canvas prepares subtle flex frames;
// the original PNG stays visible while loading or if frame preparation is unavailable.
const NS='http://www.w3.org/2000/svg';let rigs=[],frame=0,last=0,time=0,enabled=true;
export function pauseClaws(value){enabled=!value}
export function clearClaws(){rigs=[];cancelAnimationFrame(frame);frame=0;last=0;time=0}
export function clawArtwork(layer){
 const artwork=document.createElementNS(NS,'image'),src=layer.src+'?v=7';
 for(const [name,value]of Object.entries({width:1,height:1,transform:`matrix(${layer.matrix.join(' ')})`,preserveAspectRatio:'none',href:src}))artwork.setAttribute(name,value);
 const canvas=document.createElement('canvas');canvas.width=800;canvas.height=667;
 const im=new Image(),rig={canvas,ctx:canvas.getContext('2d'),im,artwork,frames:new Map([[0,src]]),shown:0};rigs.push(rig);
 im.onload=()=>{if(rigs.includes(rig)&&rig.ctx&&!frame)frame=requestAnimationFrame(tick)};im.src=src;return artwork;
}
function tick(now){const dt=last?(now-last)/1000:0;if(dt>=1/30||!last){if(enabled)time+=Math.min(dt,.05);last=now;const phase=time%9,grip=enabled&&phase>=4?.16*Math.sin(Math.PI*(phase-4)/5)**2:0;for(const rig of rigs)if(rig.ctx&&rig.im.complete&&rig.im.naturalWidth)showFrame(rig,grip)}frame=requestAnimationFrame(tick)}
function showFrame(rig,grip){const step=Math.round(grip/.16*12);if(step===rig.shown)return;
 try{if(!rig.frames.has(step)){renderRig(rig,step/12*.16);rig.frames.set(step,rig.canvas.toDataURL('image/png'))}rig.artwork.setAttribute('href',rig.frames.get(step));rig.shown=step}
 catch{rig.artwork.setAttribute('href',rig.frames.get(0));rig.shown=0;rig.ctx=null}
}
function bend(x,y,p){
 const digits=[[.94,.30,-.14,.19],[.94,.46,-.15,.10],[.94,.65,-.15,-.02],[.83,.88,-.10,-.16],[.34,.82,.19,-.11]];
 let dx=0,dy=0,total=0;for(const [cx,cy,mx,my]of digits){const d=((x-cx)/.19)**2+((y-cy)/.17)**2,w=Math.exp(-d*1.6);dx+=mx*w;dy+=my*w;total+=w}
 const pin=Math.max(0,Math.min(1,(x+y-.85)/.45));return [x+dx/Math.max(1,total)*p*pin,y+dy/Math.max(1,total)*p*pin]
}
function renderRig({ctx,canvas,im},p){const w=canvas.width,h=canvas.height,nx=18,ny=15;ctx.clearRect(0,0,w,h);
 if(p<.005){ctx.drawImage(im,0,0,w,h);return}
 const points=[];for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const u=x/nx,v=y/ny,[a,b]=bend(u,v,p);points.push({s:[u*im.naturalWidth,v*im.naturalHeight],d:[a*w,b*h]})}
 function tri(a,b,c){const [x0,y0]=a.s,[x1,y1]=b.s,[x2,y2]=c.s,[u0,v0]=a.d,[u1,v1]=b.d,[u2,v2]=c.d;const den=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);const A=(u0*(y1-y2)+u1*(y2-y0)+u2*(y0-y1))/den,B=(v0*(y1-y2)+v1*(y2-y0)+v2*(y0-y1))/den,C=(u0*(x2-x1)+u1*(x0-x2)+u2*(x1-x0))/den,D=(v0*(x2-x1)+v1*(x0-x2)+v2*(x1-x0))/den,E=u0-A*x0-C*y0,F=v0-B*x0-D*y0;
 ctx.save();ctx.beginPath();const mx=(u0+u1+u2)/3,my=(v0+v1+v2)/3;for(const [i,[u,v]]of [a.d,b.d,c.d].entries()){const dx=u-mx,dy=v-my,len=Math.hypot(dx,dy),xx=u+dx/len*.55,yy=v+dy/len*.55;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.closePath();ctx.clip();ctx.setTransform(A,B,C,D,E,F);ctx.drawImage(im,0,0);ctx.restore()}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=points[y*(nx+1)+x],b=points[y*(nx+1)+x+1],c=points[(y+1)*(nx+1)+x],d=points[(y+1)*(nx+1)+x+1];tri(a,b,c);tri(b,d,c)}
}