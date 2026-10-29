const root=document.documentElement,button=document.getElementById('radar-fullscreen');
try{root.dataset.theme=localStorage.getItem('laneswitch-theme-v1')==='dark'?'dark':'light';}catch{root.dataset.theme='light';}
const supported=Boolean(root.requestFullscreen&&document.fullscreenEnabled);
const icon=d=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const EXPAND=icon('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'),SHRINK=icon('M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5');
function update(){const active=Boolean(document.fullscreenElement);button.innerHTML=`${active?SHRINK:EXPAND}<span>${active?'Vollbild beenden':'Vollbild'}</span>`;button.setAttribute('aria-pressed',String(active));}
async function enter(){if(!supported||document.fullscreenElement)return;try{await root.requestFullscreen();}catch{button.innerHTML=`${EXPAND}<span>Vollbild versuchen</span>`;}}
button.hidden=!supported;
button.addEventListener('click',async()=>{if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}else await enter()});
document.addEventListener('fullscreenchange',update);
document.addEventListener('click',e=>{if(window.top===window&&e.target.closest('#gr-play,#gr-again'))enter();},true);
const dialog=document.getElementById('radar-info');document.getElementById('radar-info-open').onclick=()=>dialog.showModal();document.getElementById('radar-info-close').onclick=()=>dialog.close();
update();
