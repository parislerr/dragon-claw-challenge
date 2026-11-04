// A new player for each visit prevents late playback events from affecting another scene.
export function createNarration({createAudio=src=>new Audio(src),onChange=()=>{}}={}){
 let source=null,player=null,status='idle',attempt=0;
 const snapshot=()=>({active:!!source,status,pending:!!source&&status!=='complete'});
 const notify=()=>onChange(snapshot());
 async function play(){
  if(!player||status==='complete')return;
  const current=player,request=++attempt;
  if(status==='error')current.load();
  status='loading';notify();
  try{await current.play();}
  catch(error){
   if(current!==player||request!==attempt)return;
   status=error.name==='NotAllowedError'?'blocked':'error';notify();
  }
 }
 function enter(nextSource){
  if(source===nextSource)return;
  const previous=player;player=null;attempt++;
  if(previous){previous.pause();previous.removeAttribute('src');previous.load();}
  source=nextSource;status=source?'loading':'idle';
  if(source){
   const current=createAudio(source);player=current;current.preload='auto';
   for(const [event,nextStatus] of [['playing','playing'],['waiting','loading'],['pause','paused'],['ended','complete'],['error','error']]){
    current.addEventListener(event,()=>{
     if(current!==player||status==='complete')return;
     if(event==='pause'&&current.ended)return;
     status=nextStatus;notify();
    });
   }
  }
  notify();if(player)void play();
 }
 function pause(){if(player&&status!=='complete'){attempt++;player.pause();status='paused';notify();}}
 return {enter,play,pause,snapshot};
}
