import {toggleSound,weatherSound,thunderSound} from './audio.mjs?v=7';
import {SceneReturnTimer} from './engine.mjs?v=7';
import {WeatherGame,weatherScore} from './game.mjs?v=7';
import {weatherLevel,rumble,motionEnabled} from './motion.mjs?v=7';
import {weatherEffects} from './weather-effects.mjs?v=7';
const $=id=>document.getElementById(id),game=new WeatherGame();
let lastWearableMode='S';
function wearableMode(mode){if(mode===lastWearableMode)return;lastWearableMode=mode;window.dispatchEvent(new CustomEvent('wearable-weather',{detail:{mode}}))}
let active=false,navigate=()=>{},celebration=null,demo=null,timer=0,demoFrame=0,returnInterval=0,goHome=()=>{};const endingTimer=new SceneReturnTimer();
export function setGameNavigation(fn,home){navigate=fn;goHome=home}
const instructions=[['Gather the clouds','Close your hand into a fist and hold it. Watch the clouds gather.'],['Make it rain','Open your palm and sweep left and right to strengthen the rain.'],['Rumble the sky','Make a fist and move your wrist left and right to awaken the storm.'],['The sky answers your call.','You gathered clouds, summoned rain and awakened the thunder.']];
const wins=['Clouds gathered! +300','Rain summoned! +350','Sky awakened! +350'];
export function inGame(){return active}
function cancelPlayback(){clearTimeout(timer);cancelAnimationFrame(demoFrame);celebration=null;demo=null}
function cancelReturn(){clearInterval(returnInterval);returnInterval=0;endingTimer.cancel();$('returnCountdown').hidden=true}
function beginReturn(){
 if(endingTimer.deadline!==null)return;endingTimer.start(performance.now());$('returnCountdown').hidden=false;
 const tick=()=>{if(!active||!game.complete||celebration){cancelReturn();return}const now=performance.now();if(endingTimer.due(now)){cancelReturn();game.reset();goHome();return}$('returnCountdown').textContent=`Returning to the beginning in ${endingTimer.remaining(now)} ${endingTimer.remaining(now)===1?'second':'seconds'}.`};
 tick();returnInterval=setInterval(tick,250)
}
export function gameView(value,phase=0){
 if(!value||phase!==3)cancelReturn();
 const hud=$('gameHUD');if(value&&hud.dataset.phase!==String(phase)){hud.style.animation='none';void hud.offsetWidth;hud.style.animation='';hud.dataset.phase=phase}hud.classList.toggle('motion-paused',!motionEnabled());
 const displayed=celebration?.phase??demo?.phase??game.phase;
 if(!value||phase!==displayed)cancelPlayback();
 if(value&&!celebration&&phase!==game.phase){game.reset();game.phase=phase;game.complete=phase===3;}
 active=value;if(!value||phase===3)wearableMode('S');$('gameHUD').classList.toggle('visible',value);$('gamePanel').classList.toggle('visible',value);$('stage').classList.toggle('game-active',value);
 if(value){draw();if(phase===3)beginReturn()}else {weatherEffects(-1);weatherSound(-1)}
}
function draw(){
 const phase=celebration?.phase??game.phase,progress=celebration?1:demo?.progress??game.progress,complete=game.complete&&!celebration;
 wearableMode(complete?'S':(progress>0||celebration||demo)?['W','R','T'][phase]||'S':'S');weatherLevel(phase+1,progress);weatherEffects(complete?-1:phase,progress,!!celebration);weatherSound(complete?-1:phase,progress);
 $('gameProgress').setAttribute('aria-valuenow',Math.round(complete?100:progress*100));
 $('gameTitle').textContent=complete?'The Dragon Awakens':'Awaken the Dragon';
 $('gameHeading').textContent=celebration?wins[phase]:instructions[phase][0];
 $('gameInstruction').textContent=celebration?'Enjoy your power — the next challenge is coming.':game.waitRelease&&!complete&&!demo?'Relax or lower your hand briefly before the next challenge.':instructions[phase][1];
 $('gameFill').style.width=`${complete?100:progress*100}%`;
 const score=weatherScore(phase,complete?1:progress).toLocaleString('en');
 $('gameScore').textContent=`${score} / 1,000 points`;$('stageScore').textContent=`${score} / 1,000`;
 $('gameHUD').classList.toggle('victory',complete);$('gameHUD').classList.toggle('celebrating',!!celebration);
 document.querySelectorAll('.badge').forEach((b,i)=>{b.classList.toggle('done',i<phase||(!!celebration&&i===phase));b.classList.toggle('current',i===phase&&!celebration)});
 document.querySelectorAll('[data-weather-action]').forEach((b,i)=>{b.classList.toggle('current',i===phase);b.disabled=!!celebration||!!demo||i!==game.phase||complete});
}
function thunder(){rumble();thunderSound()}
function celebrate(phase){celebration={phase};if(phase===2)thunder();draw();timer=setTimeout(()=>{if(!active||celebration?.phase!==phase)return;celebration=null;navigate(game.phase)},2800)}
export function gameInput(pose,x,t){if(!active||celebration||demo)return;const old=game.phase;if(game.feed(pose,x,t))celebrate(old);else draw()}
$('restartGame').onclick=()=>{cancelReturn();cancelPlayback();game.reset();navigate(0);draw()};
$('sound').onclick=async()=>{try{const on=await toggleSound();$('sound').textContent=on?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',on)}catch{$('status').textContent='Audio could not start. Press Sound again to retry.'}};
document.querySelectorAll('[data-weather-action]').forEach((b,i)=>b.onclick=()=>{
 if(!active||celebration||demo||i!==game.phase||game.complete)return;
 demo={phase:i,progress:game.progress};const start=performance.now(),from=game.progress;
 function animate(now){if(!demo||!active)return;demo.progress=Math.min(1,from+(1-from)*(now-start)/2400);draw();if(demo.progress<1)demoFrame=requestAnimationFrame(animate);else{demo=null;game.advance();celebrate(i)}}
 demoFrame=requestAnimationFrame(animate)
});

window.addEventListener('pagehide',cancelReturn);
