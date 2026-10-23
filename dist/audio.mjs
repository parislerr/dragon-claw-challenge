// Original pentatonic music: synthesized plucked strings and a soft bamboo-flute tone.
// Audio starts only after the visitor presses Sound; no recordings or camera audio are used.
let ctx,master,music,wind,rain,windFilter,enabled=false,scheduler=0,note=0,nextNote=0,phase=-1,progress=0,lastRumble=0,lastProgress=0;
const melody=[74,null,71,69,66,null,64,62,66,null,69,71,69,null,66,null,74,null,78,76,74,null,71,69,66,64,62,null,64,null,69,null];
const hz=midi=>440*2**((midi-69)/12);
function noise(seconds){const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return buffer}
function ambience(buffer,type,frequency){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type=type;filter.frequency.value=frequency;gain.gain.value=0;source.connect(filter).connect(gain).connect(master);source.start();return {gain,filter}}
function init(){
 ctx=new AudioContext();master=ctx.createGain();master.gain.value=.65;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-15;limiter.ratio.value=5;master.connect(limiter).connect(ctx.destination);
 music=ctx.createGain();music.gain.value=.28;music.connect(master);
 const buffer=noise(4),w=ambience(buffer,'lowpass',600),r=ambience(buffer,'highpass',2600);wind=w.gain;windFilter=w.filter;rain=r.gain;
}
function pluck(midi,start,volume=.34){
 const length=Math.round(ctx.sampleRate/hz(midi)),buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0),ring=new Float32Array(length);
 for(let i=0;i<length;i++)ring[i]=Math.random()*2-1;
 for(let i=0;i<data.length;i++){const j=i%length;data[i]=ring[j];ring[j]=.496*(ring[j]+ring[(j+1)%length])}
 const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.001,start+2.9);source.connect(gain).connect(music);source.start(start);source.onended=()=>{source.disconnect();gain.disconnect()};
}
function flute(midi,start){const osc=ctx.createOscillator(),gain=ctx.createGain(),vibrato=ctx.createOscillator(),depth=ctx.createGain();osc.type='sine';osc.frequency.value=hz(midi);vibrato.frequency.value=4.7;depth.gain.value=2.2;vibrato.connect(depth).connect(osc.frequency);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045,start+.25);gain.gain.exponentialRampToValueAtTime(.0001,start+2.6);osc.connect(gain).connect(music);osc.start(start);vibrato.start(start);osc.stop(start+2.7);vibrato.stop(start+2.7);osc.onended=()=>{osc.disconnect();gain.disconnect();vibrato.disconnect();depth.disconnect()}}
function scheduleMusic(){if(!enabled||ctx.state!=='running')return;while(nextNote<ctx.currentTime+.3){const m=melody[note%melody.length];if(m!==null)pluck(m,nextNote);if(note%8===0)pluck(note%16===0?50:57,nextNote,.24);if(note%16===8)flute(note%32===8?81:78,nextNote);note++;nextNote+=.55}}
function setLevel(node,value){node.gain.setTargetAtTime(value,ctx.currentTime,.45)}
function applyWeather(){if(!ctx||!enabled)return;setLevel(wind,phase===0?.05+progress*.13:phase===1?.035:phase===2?.065+progress*.08:0);setLevel(rain,phase===1?.035+progress*.12:phase===2?.06:0);windFilter.frequency.setTargetAtTime(450+progress*850,ctx.currentTime,.4)}
export async function toggleSound(){
 if(enabled){enabled=false;clearInterval(scheduler);scheduler=0;await ctx.suspend();return false}
 if(!ctx)init();await ctx.resume();enabled=true;note=0;nextNote=ctx.currentTime+.08;applyWeather();scheduleMusic();scheduler=setInterval(scheduleMusic,100);return true;
}
export function weatherSound(nextPhase,nextProgress=0){if(nextPhase!==phase){lastProgress=0;lastRumble=0}phase=nextPhase;progress=nextProgress;applyWeather();if(enabled&&phase===2&&progress-lastProgress>.23&&ctx.currentTime-lastRumble>1.5){thunderSound(.35);lastProgress=progress;lastRumble=ctx.currentTime}}
export function thunderSound(intensity=1){if(!enabled||!ctx)return;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),start=ctx.currentTime;source.buffer=noise(3.2);filter.type='lowpass';filter.frequency.value=220;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.7*intensity,start+.12);gain.gain.exponentialRampToValueAtTime(.12*intensity,start+.7);gain.gain.exponentialRampToValueAtTime(.0001,start+3.1);source.connect(filter).connect(gain).connect(master);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}}
document.addEventListener('visibilitychange',()=>{if(!enabled||!ctx)return;if(document.hidden)ctx.suspend();else ctx.resume().then(()=>{nextNote=ctx.currentTime+.08})});
window.addEventListener('pagehide',()=>{clearInterval(scheduler);ctx?.suspend()});
