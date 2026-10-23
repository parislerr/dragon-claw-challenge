import assert from 'node:assert/strict';import {SwipeGate,SceneState} from './dist/engine.mjs';
const g=new SwipeGate();for(let t=0;t<600;t+=50)assert.equal(g.update(.8,.5,t),false);assert.equal(g.update(.79,.5,600),false);assert.equal(g.update(.7,.5,700),false);assert.equal(g.update(.53,.5,800),true);assert.equal(g.update(.3,.5,900),false);assert.equal(g.update(.2,.5,1000,true),false);
const r=new SwipeGate();for(let t=0;t<600;t+=50)r.update(.2,.5,t);for(let t=600;t<1000;t+=50)assert.equal(r.update(.2+(t-600)/1000,.5,t),false);
const s=new SceneState(3);assert(s.begin());assert(!s.begin());s.complete();assert.equal(s.index,1);assert(s.begin());s.cancel();assert.equal(s.index,1);assert(s.begin());s.complete();assert.equal(s.index,2);assert(!s.begin());console.log('Passed: swipe direction, reset, playback lock, cancelled playback, final scene.');
import {WeatherGame} from './dist/game.mjs';
const game=new WeatherGame();let t=0;for(;t<1500;t+=50)game.feed('fist',.5,t);assert.equal(game.phase,1);for(let k=0;k<20;k++,t+=50)game.feed('fist',k%2?.3:.7,t);assert.equal(game.phase,1);for(let k=0;k<12;k++,t+=50)game.feed('none',null,t);for(let k=0;k<6;k++,t+=100)game.feed('open',k%2?.3:.7,t);assert.equal(game.phase,2);for(let k=0;k<12;k++,t+=50)game.feed('none',null,t);for(let k=0;k<8;k++,t+=100)game.feed('fist',k%2?.45:.55,t);assert.equal(game.phase,3);assert(game.complete);game.feed('fist',.5,t+1000);assert.equal(game.phase,3);game.reset();assert.equal(game.phase,0);assert(!game.complete);
const still=new WeatherGame();still.phase=1;for(let k=0;k<50;k++)still.feed('open',.5,k*70);assert.equal(still.phase,1);assert.equal(still.progress,0);console.log('Passed: all weather gestures, release between challenges, stationary-hand rejection, victory and replay.');
import {weatherScore} from './dist/game.mjs';
assert.equal(weatherScore(0,0),0);assert.equal(weatherScore(0,.5),150);assert.equal(weatherScore(1,0),300);assert.equal(weatherScore(2,0),650);assert.equal(weatherScore(3,1),1000);assert.equal(weatherScore(2,2),1000);
const scoring=new WeatherGame();scoring.advance();assert.equal(scoring.score,300);scoring.advance();assert.equal(scoring.score,650);scoring.advance();assert.equal(scoring.score,1000);assert.equal(scoring.advance(),false);scoring.reset();assert.equal(scoring.score,0);
const {readFile}=await import('node:fs/promises');const artwork=JSON.parse(await readFile('dist/assets/motion/scenes.json','utf8'));
assert(!artwork[8].layers.some(l=>['9-9.png','9-10.png','9-12.png','9-13.png'].some(n=>l.src.endsWith('/'+n))));assert(artwork[8].layers.some(l=>l.src.endsWith('/9-5.png')));
for(const s of artwork)for(const source of [...s.layers.map(l=>l.src),s.text])assert((await readFile('dist/'+source)).length>0);
console.log('Passed: 1,000-point boundaries, score reset, removed examples, preserved main instruction, all scene assets.');
import {SceneReturnTimer} from './dist/engine.mjs';
const ending=new SceneReturnTimer();ending.start(1000);assert.equal(ending.remaining(1000),15);ending.start(6000);assert.equal(ending.remaining(6000),10);assert(!ending.due(15999));assert(ending.due(16000));ending.cancel();assert(!ending.due(99999));assert.equal(ending.remaining(99999),null);ending.start(20000);assert.equal(ending.remaining(20000),15);
console.log('Passed: exact 15-second return, repeated-render deadline preservation, cancellation on departure, fresh replay countdown.');
import {defaultScenes,restoreScenes,weatherPhase,weatherSceneIndex} from './dist/scenes.mjs';
const scenes=defaultScenes();assert.equal(scenes.length,11);assert.equal(scenes[6].name,'Bringer of Rain');assert.equal(scenes[7].name,'Gather Clouds');
for(let phase=0;phase<4;phase++){assert.equal(weatherSceneIndex(scenes,phase),phase+7);assert.equal(weatherPhase(scenes[phase+7]),phase)}
const oldScenes=[...scenes.slice(0,7),{name:'Learn the Weather Gestures',image:'assets/scene-v2-08.png'},...scenes.slice(7)];oldScenes[3]={...oldScenes[3],clip:'keep-my-transition'};
const migrated=restoreScenes(oldScenes);assert.equal(migrated.length,11);assert.equal(migrated[3].clip,'keep-my-transition');assert.deepEqual(restoreScenes(migrated),migrated);
assert(artwork[10].layers.some(l=>l.src.endsWith('thunder-fist.png')));assert(!artwork[10].layers.some(l=>l.src.endsWith('11-2.png')));
console.log('Passed: removed tutorial, saved-scene migration, correct weather/ending navigation, new fist artwork.');
// Regression: claws must exist before their animation image loads, even without canvas support.
const savedGlobals={document:globalThis.document,Image:globalThis.Image,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
let scheduled=0;
globalThis.document={createElementNS:(_,name)=>({localName:name,attributes:{},setAttribute(key,value){this.attributes[key]=value}}),createElement:()=>({getContext:()=>null})};
globalThis.Image=class{set src(v){this.source=v}};globalThis.requestAnimationFrame=()=>{scheduled++;return 1};globalThis.cancelAnimationFrame=()=>{};
const {clawArtwork,clearClaws}=await import('./dist/claw-motion.mjs');
for(const scene of artwork)for(const layer of scene.layers.filter(l=>l.kind==='claw')){const image=clawArtwork(layer);assert.equal(image.localName,'image');assert.equal(image.attributes.href,layer.src+'?v=7');assert.equal(image.attributes.transform,`matrix(${layer.matrix.join(' ')})`)}
assert.equal(scheduled,0);clearClaws();Object.assign(globalThis,savedGlobals);
console.log('Passed: every claw has a visible original image without waiting for canvas or animation.');
