import assert from 'node:assert/strict';import {SwipeGate,SceneState} from './dist/engine.mjs';
const g=new SwipeGate();for(let t=0;t<600;t+=50)assert.equal(g.update(.8,.5,t),false);assert.equal(g.update(.79,.5,600),false);assert.equal(g.update(.7,.5,700),false);assert.equal(g.update(.53,.5,800),true);assert.equal(g.update(.3,.5,900),false);assert.equal(g.update(.2,.5,1000,true),false);
const r=new SwipeGate();for(let t=0;t<600;t+=50)r.update(.2,.5,t);for(let t=600;t<1000;t+=50)assert.equal(r.update(.2+(t-600)/1000,.5,t),false);
const s=new SceneState(3);assert(s.begin());assert(!s.begin());s.complete();assert.equal(s.index,1);assert(s.begin());s.cancel();assert.equal(s.index,1);assert(s.begin());s.complete();assert.equal(s.index,2);assert(!s.begin());console.log('Passed: swipe direction, reset, playback lock, cancelled playback, final scene.');
import {WeatherGame} from './dist/game.mjs';
const game=new WeatherGame();let t=0;for(;t<8200;t+=50)game.feed('fist',.5,t);assert.equal(game.phase,1);for(let k=0;k<20;k++,t+=50)game.feed('fist',k%2?.3:.7,t);assert.equal(game.phase,1);for(let k=0;k<12;k++,t+=50)game.feed('none',null,t);for(let k=0;k<85;k++,t+=100)game.feed('open',k%2?.3:.7,t);assert.equal(game.phase,2);for(let k=0;k<12;k++,t+=50)game.feed('none',null,t);for(let k=0;k<85;k++,t+=100)game.feed('point',.5,t);assert.equal(game.phase,3);assert(game.complete);game.feed('fist',.5,t+1000);assert.equal(game.phase,3);game.reset();assert.equal(game.phase,0);assert(!game.complete);
const still=new WeatherGame();still.phase=1;for(let k=0;k<50;k++)still.feed('open',.5,k*70);assert.equal(still.phase,1);assert.equal(still.progress,0);console.log('Passed: all weather gestures, release between challenges, stationary-hand rejection, victory and replay.');
import {weatherScore} from './dist/game.mjs';
assert.equal(weatherScore(0,0),0);assert.equal(weatherScore(0,.5),500);assert.equal(weatherScore(1,0),1000);assert.equal(weatherScore(2,0),2000);assert.equal(weatherScore(3,1),3000);assert.equal(weatherScore(2,2),3000);
const scoring=new WeatherGame();scoring.advance();assert.equal(scoring.score,1000);scoring.advance();assert.equal(scoring.score,2000);scoring.advance();assert.equal(scoring.score,3000);assert.equal(scoring.advance(),false);scoring.reset();assert.equal(scoring.score,0);
const {readFile}=await import('node:fs/promises');const artwork=JSON.parse(await readFile('dist/assets/refresh-oct28/scenes.json','utf8'));
assert(artwork[8].layers.some(l=>l.src.endsWith('/cloud-hands-single-arrow.png')));
for(const s of artwork)for(const source of [...s.layers.map(l=>l.src),s.text])assert((await readFile('dist/'+source)).length>0);
console.log('Passed: 3,000-point boundaries, score reset, removed examples, preserved main instruction, all scene assets.');
import {SceneReturnTimer} from './dist/engine.mjs';
const ending=new SceneReturnTimer();ending.start(1000);assert.equal(ending.remaining(1000),15);ending.start(6000);assert.equal(ending.remaining(6000),10);assert(!ending.due(15999));assert(ending.due(16000));ending.cancel();assert(!ending.due(99999));assert.equal(ending.remaining(99999),null);ending.start(20000);assert.equal(ending.remaining(20000),15);
console.log('Passed: exact 15-second return, repeated-render deadline preservation, cancellation on departure, fresh replay countdown.');
import {defaultScenes,restoreScenes,weatherPhase,weatherSceneIndex} from './dist/scenes.mjs';
const scenes=defaultScenes();assert.equal(scenes.length,11);assert.equal(scenes[6].name,'Bringer of Rain');assert.equal(scenes[7].name,'Gather Clouds');
for(let phase=0;phase<4;phase++){assert.equal(weatherSceneIndex(scenes,phase),phase+7);assert.equal(weatherPhase(scenes[phase+7]),phase)}
const oldScenes=[...scenes.slice(0,7),{name:'Learn the Weather Gestures',image:'assets/scene-v2-08.png'},...scenes.slice(7)];oldScenes[3]={...oldScenes[3],clip:'keep-my-transition'};
const migrated=restoreScenes(oldScenes);assert.equal(migrated.length,11);assert.equal(migrated[3].clip,'keep-my-transition');assert.deepEqual(restoreScenes(migrated),migrated);
assert(artwork[10].layers.some(l=>l.kind==='point-gesture'));
console.log('Passed: removed tutorial, saved-scene migration, correct weather/ending navigation, new index-finger artwork.');
// Regression: claws must exist before their animation image loads, even without canvas support.
const savedGlobals={document:globalThis.document,Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
let scheduled=0;
globalThis.document={createElementNS:(_,name)=>({localName:name,attributes:{},setAttribute(key,value){this.attributes[key]=value}}),createElement:()=>({getContext:()=>null})};
globalThis.Image=class{set src(v){this.source=v}};globalThis.requestAnimationFrame=()=>{scheduled++;return 1};globalThis.cancelAnimationFrame=()=>{};
const {clawArtwork,clearClaws}=await import('./dist/claw-motion.mjs');
for(const scene of artwork)for(const layer of scene.layers.filter(l=>l.kind==='claw')){const image=clawArtwork(layer);assert.equal(image.localName,'image');assert.equal(image.attributes.href,layer.src+'?v=7');assert.equal(image.attributes.transform,`matrix(${layer.matrix.join(' ')})`)}
assert.equal(scheduled,0);clearClaws();Object.assign(globalThis,savedGlobals);
console.log('Passed: every claw has a visible original image without waiting for canvas or animation.');
// Short swipes, variable speeds and tracking gaps must work without false advances.
function readySwipe(){const g=new SwipeGate();for(const t of [0,60,120,180])assert.equal(g.update(.7,.5,t),false);assert(g.armed);return g}
const short=readySwipe();assert(!short.update(.65,.53,220));assert(short.update(.58,.58,280));assert(!short.update(.4,.5,320));
const slow=readySwipe();assert(!slow.update(.67,.5,480));assert(!slow.update(.63,.5,780));assert(slow.update(.58,.5,1180));
const dropout=readySwipe();dropout.update(.66,.5,240);dropout.update(null,null,280);assert(dropout.update(.58,.5,360));
const lost=readySwipe();lost.update(null,null,240);assert(!lost.update(.4,.5,600));assert(!lost.armed);
const noise=readySwipe();for(let t=220;t<2000;t+=40)assert(!noise.update(.7+Math.sin(t)*.025,.5+Math.cos(t)*.02,t));
const vertical=readySwipe();assert(!vertical.update(.66,.65,240));assert(!vertical.update(.58,.8,320));
const right=readySwipe();assert(!right.update(.77,.5,240));assert(!right.update(.85,.5,320));
const locked=readySwipe();assert(!locked.update(.55,.5,280,true));assert(!locked.armed);
console.log('Passed: short/slow/diagonal swipes, brief dropout, long loss, jitter, vertical/right rejection and transition lock.');
for(let phase=0;phase<3;phase++){
 const longer=new WeatherGame();longer.phase=phase;const pose=phase===2?'point':phase===1?'open':'fist';
 for(let t=0;t<=4000;t+=50)assert(!longer.feed(pose,(t/50)%2?.25:.75,t));
 assert.equal(longer.phase,phase);const savedProgress=longer.progress;
 longer.feed('none',null,4050);assert.equal(longer.progress,savedProgress);
 for(let t=4100;t<=8200&&longer.phase===phase;t+=50)longer.feed(pose,(t/50)%2?.25:.75,t);
 assert.equal(longer.phase,phase+1);
}
console.log('Passed: each weather requires eight seconds, quick gestures cannot skip it, pauses preserve progress.');
import {weatherPose} from './dist/game.mjs';
assert.equal(weatherPose(3),'open');assert.equal(weatherPose(4),'open');assert.equal(weatherPose(5),'open');assert.equal(weatherPose(1),'fist');assert.equal(weatherPose(2),'other');assert.equal(weatherPose(-1),'none');
const gentleRain=new WeatherGame();gentleRain.phase=1;
for(let t=0;t<=4000;t+=50)assert(!gentleRain.feed('open',(t/50)%2?.475:.525,t));
assert(gentleRain.progress>0);assert.equal(gentleRain.phase,1);
const turnsBefore=gentleRain.turns;gentleRain.feed('none',null,4050);gentleRain.feed('open',.475,4100);assert(gentleRain.turns>turnsBefore);
for(let t=4150;t<=8300&&gentleRain.phase===1;t+=50)gentleRain.feed('open',(t/50)%2?.475:.525,t);
assert.equal(gentleRain.phase,2);
const rainJitter=new WeatherGame();rainJitter.phase=1;for(let t=0;t<10000;t+=50)rainJitter.feed('open',.5+Math.sin(t)*.009,t);assert.equal(rainJitter.progress,0);
const rainLost=new WeatherGame();rainLost.phase=1;rainLost.feed('open',.6,0);rainLost.feed('open',.5,100);rainLost.feed('none',null,150);rainLost.feed('open',.7,500);assert.equal(rainLost.turns,0);
console.log('Passed: relaxed palm, small rain sweeps, brief dropout continuity, jitter rejection, long loss reset and eight-second minimum.');
import {relaxedFive} from './dist/hand-pose.mjs';
const palm=Array.from({length:21},()=>({x:.5,y:.65}));palm[0]={x:.5,y:.9};palm[5]={x:.42,y:.65};palm[17]={x:.66,y:.67};palm[3]={x:.37,y:.68};palm[4]={x:.31,y:.62};
for(const [i,x] of [[8,.42],[12,.5],[16,.58],[20,.66]]){palm[i-2]={x,y:.5};palm[i]={x,y:.45};}
assert(relaxedFive(palm),'relaxed fingers and modest thumb spread accepted');
for(const i of [8,12,16,20]){const folded=structuredClone(palm);folded[i]={x:palm[i].x,y:.72};assert(!relaxedFive(folded),'each folded finger rejected');}
const tucked=structuredClone(palm);tucked[4]={x:.48,y:.68};assert(!relaxedFive(tucked),'four fingers with tucked thumb rejected');
for(const angle of [0,.5,1.5,3]){const rotated=palm.map(({x,y})=>({x:.5+(x-.5)*Math.cos(angle)-(y-.5)*Math.sin(angle),y:.5+(x-.5)*Math.sin(angle)+(y-.5)*Math.cos(angle)}));assert(relaxedFive(rotated));assert(relaxedFive(rotated.map(p=>({x:1-p.x,y:p.y}))));}
assert(!relaxedFive(null));assert(!relaxedFive([]));
console.log('Passed: relaxed five fingers, folded-finger and tucked-thumb rejection, rotated and mirrored hands.');
import {pointingUp} from './dist/hand-pose.mjs';
const one=structuredClone(palm);for(const i of [12,16,20])one[i]={x:one[i].x,y:.76};one[4]={x:.48,y:.68};assert(pointingUp(one));assert(pointingUp(one.map(p=>({x:1-p.x,y:p.y}))));assert(!pointingUp(palm));const fist=structuredClone(one);fist[8]={x:.42,y:.76};assert(!pointingUp(fist));assert(!pointingUp(one.map(p=>({x:p.x,y:1-p.y}))));assert(!pointingUp(null));
const thunderHold=new WeatherGame();thunderHold.phase=2;for(let t=0;t<10000;t+=50)thunderHold.feed('fist',.5,t);assert.equal(thunderHold.progress,0);for(let t=10000;t<14000;t+=50)thunderHold.feed('point',.5,t);assert.equal(thunderHold.phase,2);const partial=thunderHold.progress;for(let t=14000;t<15000;t+=50)thunderHold.feed('none',null,t);assert.equal(thunderHold.progress,partial);for(let t=15000;t<19500;t+=50)thunderHold.feed('point',.5,t);assert(thunderHold.complete);
console.log('Passed: upright index gesture, mirrored hand, open-palm/fist/downward rejection, held thunder progress and tracking-loss pause.');
