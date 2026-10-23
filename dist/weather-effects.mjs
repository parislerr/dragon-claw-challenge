// Weather stays in the presentation's coordinate space, including full-screen letterboxing.
const canvas=document.createElement('canvas');canvas.id='weatherFX';canvas.width=1440;canvas.height=810;canvas.setAttribute('aria-hidden','true');document.getElementById('scene').after(canvas);
const ctx=canvas.getContext('2d');
const clouds=['1-1','1-2','1-3'].map(name=>{const im=new Image();im.src=`assets/motion/${name}.png`;return im});
let phase=-1,target=0,strength=0,celebrating=false,running=false,clock=0,last=0,frame=0,motion=true;
const seed=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export function weatherEffects(next,p=0,complete=false){if(next!==phase){strength=0;clock=0}phase=next;target=Math.max(0,Math.min(1,p));celebrating=complete;canvas.style.display=next>=0&&next<3?'block':'none';if(next<0||next>2){cancelAnimationFrame(frame);running=false;ctx.clearRect(0,0,1440,810);return}if(!running){running=true;last=performance.now();frame=requestAnimationFrame(paint)}}
export function pauseWeather(value){motion=!value}
function cloud(im,x,y,w,a){if(!im.complete||!im.naturalWidth)return;ctx.globalAlpha=a;ctx.drawImage(im,x-w/2,y,w,w*im.naturalHeight/im.naturalWidth);ctx.globalAlpha=1}
function paint(now){if(!running)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(motion){clock+=dt;strength+=(target-strength)*Math.min(1,dt*5)}else strength=target;
 const p=strength,t=clock;ctx.clearRect(0,0,1440,810);
 // Deepening cobalt sky makes every stage visibly build with the gesture.
 const shade=ctx.createLinearGradient(0,0,0,810);shade.addColorStop(0,`rgba(12,39,92,${phase===2?.02+p*.08:.03+p*.12})`);shade.addColorStop(.7,'rgba(30,72,137,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,1440,810);
 for(let i=0;i<(phase===2?0:8);i++){const side=i%2?1:-1,row=Math.floor(i/2);const reach=phase===0?p:.82;const x=720+side*(900-reach*(410+row*35))+Math.sin(t*.7+i)*22;const y=25+row*124+Math.sin(t+i)*13;const w=370+reach*115;cloud(clouds[i%3],x,y,w,.28+reach*.62)}
 if(phase===0&&p>.15){for(let i=0;i<16;i++){const a=i*.393-t*.4;ctx.strokeStyle=`rgba(93,145,209,${p*.24})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(720,400,510-i*8,220-i*3,a*.025,a,a+.16+p*.3);ctx.stroke()}}
 if(phase===1){const amount=phase===1?p:.35+p*.5,count=Math.floor(25+amount*230);ctx.lineCap='round';for(let i=0;i<count;i++){const speed=440+seed(i+4)*500+amount*400;const y=(seed(i+200)*1100+t*speed)%1100-150;const x=(seed(i+100)*1700-t*speed*.2%1700+1700)%1700-80;ctx.strokeStyle=`rgba(42,98,172,${.20+amount*.42})`;ctx.lineWidth=1.2+seed(i)*2.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-9-amount*9,y+25+amount*44);ctx.stroke()}
 for(let i=0;i<27;i++){const a=(t*1.7+seed(i+300))%1;ctx.strokeStyle=`rgba(49,109,185,${(1-a)*amount*.65})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(seed(i+400)*1440,620+seed(i+500)*190,5+a*32,2+a*7,0,0,Math.PI*2);ctx.stroke()}}

 if(celebrating&&phase!==2){ctx.strokeStyle=`rgba(88,142,211,${.22+.1*Math.sin(t*2)})`;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(720,390,535+Math.sin(t*2)*12,290,0,0,Math.PI*2);ctx.stroke()}
 frame=requestAnimationFrame(paint)
}