const root=document.documentElement,button=document.getElementById('radar-fullscreen');
try{root.dataset.theme=localStorage.getItem('laneswitch-theme-v1')==='dark'?'dark':'light';}catch{root.dataset.theme='light';}
const supported=Boolean(root.requestFullscreen&&document.fullscreenEnabled);
function update(){const active=Boolean(document.fullscreenElement);button.textContent=active?'Vollbild beenden':'Vollbild ⛶';button.setAttribute('aria-pressed',String(active));}
async function enter(){if(!supported||document.fullscreenElement)return;try{await root.requestFullscreen();}catch{button.textContent='Vollbild versuchen ⛶';}}
button.hidden=!supported;
button.addEventListener('click',async()=>{if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}else await enter()});
document.addEventListener('fullscreenchange',update);
document.addEventListener('click',e=>{if(window.top===window&&e.target.closest('#gr-play,#gr-again'))enter();},true);
const dialog=document.getElementById('radar-info');document.getElementById('radar-info-open').onclick=()=>dialog.showModal();document.getElementById('radar-info-close').onclick=()=>dialog.close();
update();
