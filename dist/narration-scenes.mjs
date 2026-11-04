// Match the original artwork identity so scene removal/reordering keeps its audio.
const cueLayers={
 1:['2-4.png','2-5.png'],
 2:['3-2.png','3-3.png'],
 3:['4-1.png','4-2.png'],
 4:['5-1.png','5-2.png'],
 5:['6-1.png','6-2.png'],
 6:['7-6.png','7-7.png'],
};
export function sceneNarration(index){
 const layers=cueLayers[index];
 return layers?{audio:`assets/audio/slide-${String(index+1).padStart(2,'0')}.mp3`,cueLayers:layers}:null;
}
export function navigationHint(scene){
 return scene.gesture==='swipe'?'Small swipe left · or press →':scene.gesture==='manual'?'Press → to continue':`Hold ${scene.gesture} fingers · or press →`;
}
