const titles=['Dragon Claw Challenge','More Than a Mythical Creature','The Story Behind the Claws','Three Claws','Four Claws','Five Claws','Bringer of Rain','Learn the Weather Gestures','Gather Clouds','Make It Rain','Rumble the Sky','The Dragon Awakens'];
const originalScenes=()=>titles.map((name,i)=>({name,image:`assets/scene-v2-${String(i+1).padStart(2,'0')}.png`,gesture:i===2?'3':i===3?'4':i===4?'5':'swipe',clip:null}));
export function artworkIndex(scene){const match=typeof scene?.image==='string'&&scene.image.match(/^assets\/scene-v2-(0[1-9]|1[0-2])\.png$/);return match?Number(match[1])-1:-1}
export function weatherPhase(scene){const i=artworkIndex(scene);return i>=8&&i<=11?i-8:-1}
const isRemoved=scene=>artworkIndex(scene)===7||scene.name==='Learn the Weather Gestures';
export const defaultScenes=()=>originalScenes().filter(scene=>!isRemoved(scene));
export function restoreScenes(saved){
 if(!Array.isArray(saved)||!saved.length)return defaultScenes();
 const originals=originalScenes(),legacy=saved.some(s=>typeof s.image==='string'&&s.image.startsWith('assets/verified-'));
 const scenes=saved.map((scene,i)=>typeof scene.image==='string'&&scene.image.startsWith('assets/verified-')&&originals[i]?{...originals[i],clip:scene.clip}:scene);
 if(legacy&&saved.length===8)scenes.push(...originals.slice(8));
 return scenes.filter(scene=>!isRemoved(scene)).map(scene=>artworkIndex(scene)===11&&scene.name==='Dragon Keeper'?{...scene,name:'The Dragon Awakens'}:scene);
}
export const weatherSceneIndex=(scenes,phase)=>scenes.findIndex(scene=>weatherPhase(scene)===phase);
