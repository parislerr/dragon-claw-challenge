const status=document.getElementById('wearableStatus');
async function api(path,options={}){const response=await fetch('/api/wearable/'+path,{...options,cache:'no-store'});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'XLOT unavailable');return data}
async function send(mode){try{await api('command?mode='+encodeURIComponent(mode),{method:'POST'});status.textContent='XLOT: '+({W:'Wind',R:'Rain',T:'Thunder',S:'Stopped'}[mode]||mode)}catch(e){status.textContent='Wearable error: '+e.message}}
document.querySelectorAll('[data-wearable]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.wearable)));
document.getElementById('wearableCheck').addEventListener('click',async()=>{try{const x=await api('status');status.textContent='Connected: '+x.mode}catch(e){status.textContent='Not connected: '+e.message}});
window.addEventListener('wearable-weather',e=>send(e.detail.mode));
window.addEventListener('pagehide',()=>{navigator.sendBeacon?.('/api/wearable/stop')});
