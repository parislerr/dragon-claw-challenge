import {sceneNarration} from './narration-scenes.mjs?v=26';
import {clawArtwork,clearClaws,pauseClaws} from './claw-motion.mjs?v=7';
import {pauseWeather} from './weather-effects.mjs?v=26';
const NS='http://www.w3.org/2000/svg';let data=null,ready,active=-1,enabled=!matchMedia('(prefers-reduced-motion: reduce)').matches,lastWeatherProgress=0,lightningAnimations=[];
const root=document.createElementNS(NS,'svg');root.id='motionScene';root.setAttribute('viewBox','0 0 1440 810');root.setAttribute('aria-hidden','true');document.getElementById('scene').after(root);
function el(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e}
export function motionEnabled(){return enabled}
function clearLightning(){lightningAnimations.forEach(a=>a.cancel());lightningAnimations=[]}
export function setMotion(value){enabled=value;if(!value)clearLightning();pauseWeather(!value);pauseClaws(!value);root.classList.toggle('paused',!value);document.getElementById('gameHUD').classList.toggle('motion-paused',!value);document.getElementById('motionToggle').textContent=value?'Pause motion':'Resume motion'}
export async function loadMotion(){ready=fetch('assets/refresh-oct28/scenes.json?v=26').then(r=>{if(!r.ok)throw Error('Animation artwork unavailable');return r.json()}).then(async d=>{data=d;const sources=[...new Set(d.flatMap(s=>[s.text,...s.layers.map(l=>l.src)]))];await Promise.all(sources.map(src=>new Promise(resolve=>{const im=new Image();im.onload=im.onerror=resolve;im.src=src+'?v=7'})));return d});await ready;return data}
export function showMotion(index,game=false){if(active===index&&root.childElementCount&&data)return true;active=index;lastWeatherProgress=0;clearLightning();clearClaws();root.replaceChildren();root.style.display=data&&index>=0?'block':'none';if(!data||index<0||!data[index])return false;
 const page=data[index],narration=sceneNarration(index),content=el('g',{'class':'scene-content'});root.append(content);root.dataset.scene=index;root.classList.toggle('game-scene',game);root.classList.toggle('paused',!enabled);root.classList.toggle('narration-pending',!!narration);
 page.layers.forEach((l,i)=>{if(l.kind==='ui-score'||(l.kind==='ui-card'&&index!==11))return;const g=el('g',{'class':'motion-layer '+l.kind,'data-kind':l.kind});if(narration?.cueLayers.includes(l.src.split('/').pop()))g.classList.add('narration-cue');g.dataset.center=l.matrix[4]+l.matrix[0]/2;g.style.setProperty('--delay',`${-(i%5)*1.3}s`);const im=l.kind==='claw'?clawArtwork(l):el('image',{href:l.src+'?v=7',width:1,height:1,transform:`matrix(${l.matrix.join(' ')})`,preserveAspectRatio:'none'});if(index===0&&l.src.endsWith('1-5.png'))g.classList.add('title-ornament');if(index===2&&l.src.endsWith('3-0.png'))g.classList.add('story-plate');if(index===2&&l.src.endsWith('3-1.png'))g.classList.add('story-panel');if(l.clip&&l.kind!=='dragon'&&l.kind!=='cloud'){const id=`clip-${index}-${i}`,clip=el('clipPath',{id,clipPathUnits:'userSpaceOnUse'});const [x,y,width,height]=l.clip;clip.append(el('rect',{x,y,width,height}));root.append(clip);const inner=el('g',{'clip-path':`url(#${id})`});inner.append(im);g.append(inner)}else g.append(im);content.append(g)});
 const textLayer=el('image',{href:page.text+'?v=7',x:0,y:0,width:1440,height:810,'class':'motion-text'});
 let textContent=content;
 if(narration){
  // The cue's lettering is baked into the text image; reveal it with the hand and medallion.
  const bodyClip=el('clipPath',{id:'narration-body-clip',clipPathUnits:'userSpaceOnUse'});
  bodyClip.append(el('rect',{x:0,y:0,width:1440,height:730}),el('rect',{x:0,y:730,width:1180,height:80}));
  const cueClip=el('clipPath',{id:'narration-cue-clip',clipPathUnits:'userSpaceOnUse'});
  cueClip.append(el('rect',{x:1180,y:730,width:260,height:80}));root.append(bodyClip,cueClip);
  textContent=el('g',{'clip-path':'url(#narration-body-clip)'});content.append(textContent);
  content.append(el('image',{href:page.text+'?v=7',x:0,y:0,width:1440,height:810,'class':'narration-cue','clip-path':'url(#narration-cue-clip)'}));
 }
 if(index===1){
  const clip=el('clipPath',{id:'symbolism-text-clip',clipPathUnits:'userSpaceOnUse'});
  clip.append(el('rect',{x:0,y:0,width:1440,height:500}),el('rect',{x:0,y:660,width:1440,height:150}));root.append(clip);textLayer.setAttribute('clip-path','url(#symbolism-text-clip)');
  textContent.append(textLayer);
  const paragraph=el('text',{x:576,y:531,fill:'#39369A','font-family':'Times New Roman, serif','font-size':23,'class':'symbolism-description'});
  ['In Chinese art, dragons can symbolise imperial authority, protection',
   'and good fortune. They are also believed to bring auspicious rain',
   'that nourishes the land and sustains life. Look closely at their',
   'imagery to explore these meanings, which vary across objects',
   'and historical contexts.'].forEach((line,i)=>{const span=el('tspan',{x:576,dy:i?30:0});span.textContent=line;paragraph.append(span)});
  content.append(paragraph);
 }else textContent.append(textLayer);return true;
}
export function weatherLevel(level,progress=0){root.dataset.weather=level;root.style.setProperty('--gather',progress);if(active===10&&enabled&&progress>lastWeatherProgress+.08){clearLightning();if(!root.classList.contains('rumbling')){const strength=3+progress*6;root.querySelectorAll('.lightning').forEach((bolt,i)=>{const direction=i%2?-1:1;lightningAnimations.push(bolt.animate([
 {opacity:.35+progress*.35,transform:'translate(0,0)'},
 {opacity:1,transform:`translate(${direction*strength}px,-2px)`,offset:.22},
 {opacity:.6,transform:`translate(${-direction*strength}px,3px)`,offset:.42},
 {opacity:1,transform:`translate(${direction*strength*.6}px,-2px)`,offset:.64},
 {opacity:.3+progress*.7,transform:'translate(0,0)'}
 ],{duration:620,easing:'ease-in-out'}));});}lastWeatherProgress=progress;}if(active===8)root.querySelectorAll('.cloud').forEach(g=>{g.style.translate=`${(720-Number(g.dataset.center))*progress*.65}px 0`;g.style.opacity=.4+progress*.6});}
export function rumble(){if(!enabled)return;clearLightning();root.classList.remove('rumbling');void root.getBoundingClientRect();root.classList.add('rumbling');setTimeout(()=>root.classList.remove('rumbling'),2700)}
export function motionContainer(){return root}

export function setNarrationCue(ready){if(sceneNarration(active))root.classList.toggle('narration-pending',!ready)}
