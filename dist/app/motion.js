// Dezente Bewegung: Inhalte unterhalb des sichtbaren Bereichs blenden beim Scrollen sanft ein.
// Was beim Laden schon sichtbar ist, bleibt sofort sichtbar. „Bewegung reduzieren“ schaltet alles ab.
const SEL='.home-head,.home-path,.tool-wrap,.post,.tool-section-head,.rail-card,.sp-section-head,.sp-panel,.ls-footer';
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window&&!window.__lsMotion){
 window.__lsMotion=true;
 const done=el=>setTimeout(()=>el.classList.remove('mo','mo-in'),900);
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('mo-in');io.unobserve(e.target);done(e.target)}}),{rootMargin:'0px 0px -6% 0px'});
 let queued=false;
 const scan=()=>{queued=false;const h=innerHeight;let n=0;document.querySelectorAll(SEL).forEach(el=>{if(el.dataset.mo)return;el.dataset.mo='1';if(el.closest('dialog,.lw-focus,.tool-wrap .home-path'))return;if(el.getBoundingClientRect().top<h*.94)return;el.style.setProperty('--mo-d',(n++%4)*60+'ms');el.classList.add('mo');io.observe(el)})};
 document.documentElement.classList.add('mo-on');
 new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(scan)}}).observe(document.body,{childList:true,subtree:true});
 scan();
}
