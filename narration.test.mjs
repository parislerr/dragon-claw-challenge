import assert from 'node:assert/strict';
import {createNarration} from './dist/narration.mjs';

class Player extends EventTarget {
 constructor(src){super();this.src=src;this.ended=false;this.plays=0;this.pauses=0;}
 play(){this.plays++;if(this.rejection)return Promise.reject(this.rejection);this.dispatchEvent(new Event('playing'));return Promise.resolve();}
 pause(){this.pauses++;this.dispatchEvent(new Event('pause'));}
 removeAttribute(){this.src='';}
 load(){}
 end(){this.ended=true;this.dispatchEvent(new Event('pause'));this.dispatchEvent(new Event('ended'));}
}
const players=[];
const narration=createNarration({createAudio:src=>{const p=new Player(src);players.push(p);return p;}});
narration.enter('slide-02.mp3');const first=players[0];
assert.equal(narration.snapshot().status,'playing');assert(narration.snapshot().pending);
narration.enter('slide-02.mp3');assert.equal(first.plays,1,'Renders must not restart playback');
narration.pause();assert.equal(narration.snapshot().status,'paused');assert(narration.snapshot().pending);
await narration.play();first.end();assert.equal(narration.snapshot().status,'complete');assert(!narration.snapshot().pending);
narration.enter(null);assert(!narration.snapshot().active);assert(first.pauses>0);
narration.enter('slide-02.mp3');assert.equal(players.length,2);assert(narration.snapshot().pending,'Re-entry requires fresh playback');
first.end();assert(narration.snapshot().pending,'Stale completion must not unlock the new visit');
narration.enter(null);players[1].end();assert.equal(narration.snapshot().status,'idle');

const blockedPlayer=new Player('slide-02.mp3');blockedPlayer.rejection={name:'NotAllowedError'};
const blocked=createNarration({createAudio:()=>blockedPlayer});blocked.enter('slide-02.mp3');
await Promise.resolve();assert.equal(blocked.snapshot().status,'blocked');assert(blocked.snapshot().pending);
blockedPlayer.rejection=null;await blocked.play();assert.equal(blocked.snapshot().status,'playing');
blockedPlayer.dispatchEvent(new Event('error'));assert.equal(blocked.snapshot().status,'error');assert(blocked.snapshot().pending);
await blocked.play();blockedPlayer.end();assert(!blocked.snapshot().pending);

let rejectOld;
const pendingPlayer=new Player('slide-02.mp3');pendingPlayer.play=()=>new Promise((_,reject)=>{rejectOld=reject;});
const pending=createNarration({createAudio:()=>pendingPlayer});pending.enter('slide-02.mp3');pending.enter(null);
rejectOld({name:'NotAllowedError'});await Promise.resolve();assert.equal(pending.snapshot().status,'idle');
console.log('Passed: completion-only reveal, pause/resume, repeated render, restart on re-entry, stale events, autoplay fallback and retry.');

// Switching directly between narrated slides cancels the old player and locks the new cue.
narration.enter('slide-03.mp3');const third=players.at(-1);
narration.enter('slide-04.mp3');const fourth=players.at(-1);
assert(third.pauses>0);assert.equal(third.src,'');assert(narration.snapshot().pending);
third.end();assert(narration.snapshot().pending);
fourth.end();assert(!narration.snapshot().pending);
narration.enter('slide-05.mp3');assert(narration.snapshot().pending);

import {sceneNarration,navigationHint} from './dist/narration-scenes.mjs';
import {defaultScenes,artworkIndex} from './dist/scenes.mjs';
import {readFile} from 'node:fs/promises';
const artwork=JSON.parse(await readFile('dist/assets/refresh-oct28/scenes.json','utf8'));
const scenes=defaultScenes();
for(let index=1;index<=6;index++){
 const config=sceneNarration(artworkIndex(scenes[index]));
 assert.equal(config.audio,`assets/audio/slide-${String(index+1).padStart(2,'0')}.mp3`);
 assert((await readFile('dist/'+config.audio)).length>0);
 for(const layer of config.cueLayers)assert(artwork[index].layers.some(item=>item.src.endsWith('/'+layer)),`Missing cue artwork ${layer}`);
}
for(const index of [-1,0,7,8,9,10,11])assert.equal(sceneNarration(index),null);
for(let index=2;index<=4;index++){
 assert.equal(scenes[index].gesture,String(index+1));
 assert.equal(navigationHint(scenes[index]),`Hold ${index+1} fingers · or press →`);
}
assert.equal(navigationHint(scenes[5]),'Small swipe left · or press →');
assert.equal(navigationHint(scenes[6]),'Small swipe left · or press →');
console.log('Passed: consecutive narration, slide 02–07 audio mapping, exact gesture artwork and preserved finger-count instructions.');
