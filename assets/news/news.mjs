const SHARE_ORIGIN='https://laneswitch.de',SHARE_PREFIX='/';
const labels = {in_force:'Gilt bereits', decided:'Beschlossen', proposal:'Vorschlag / Entwurf', report:'Bestätigte Meldung', forecast:'Prognose'};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date(value));
const time = value => new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'}).format(new Date(value));
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const https = value => {try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validateFeed(data) {
  if(data?.version!==1 || !['learner','school'].includes(data.audience) || !validDate(data.checkedAt) || !Array.isArray(data.items)) throw Error('Invalid news feed');
  const ids=new Set();
  for(const n of data.items) {
    if(!n.id || ids.has(n.id) || !labels[n.status] || !['title','summary','impact','action','category'].every(k=>typeof n[k]==='string'&&n[k].trim()) || !['publishedAt','checkedAt','expiresAt'].every(k=>validDate(n[k])) || Date.parse(n.expiresAt)<=Date.parse(n.publishedAt) || !Array.isArray(n.sources) || !n.sources.length || !n.sources.every(s=>typeof s.name==='string'&&https(s.url))) throw Error('Invalid news item');
    ids.add(n.id);
  }
  return data;
}
export function activeItems(data,now=Date.now()) {
  return data.items.filter(n=>Date.parse(n.publishedAt)<=now&&Date.parse(n.expiresAt)>now).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}
export function freshness(checkedAt,now=Date.now()) {
  const age=now-Date.parse(checkedAt);
  if(age<0 || age>36*3600000) return 'Prüfung ausstehend – Stand unten beachten.';
  return 'Zuletzt geprüft: '+date(checkedAt)+' · '+time(checkedAt)+' Uhr';
}

export function newsShareUrl(audience,id) {
  const url=new URL(SHARE_ORIGIN+SHARE_PREFIX+(audience==='school'?'fahrschulen/':'fahrschueler/'));
  url.searchParams.set('news',id);
  url.hash='news';
  return url.href;
}
export async function shareNews(link,status,nav=navigator) {
  const payload={title:link.dataset.title,text:link.dataset.title,url:link.href};
  if(typeof nav.share==='function') {
    try {await nav.share(payload);return;} catch(error) {if(error.name==='AbortError')return;}
  }
  try {
    await nav.clipboard.writeText(link.href);
    status.textContent='Link kopiert.';
  } catch {
    status.textContent='Link zum Kopieren:';
    const input=document.createElement('input');
    input.type='text';input.readOnly=true;input.value=link.href;
    input.setAttribute('aria-label','Link zur Meldung');status.append(input);input.focus();input.select();
  }
}
function bindNews(host) {
  host.onclick=event=>{
    const link=event.target.closest('[data-news-share]');
    if(!link || !host.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();
    shareNews(link,link.nextElementSibling);
  };
  const id=new URLSearchParams(location.search).get('news');
  if(!id)return;
  const target=Array.from(host.querySelectorAll('[data-news-id]')).find(card=>card.dataset.newsId===id);
  if(!target){
    const note=document.createElement('p');note.className='ls-news-status';note.setAttribute('role','status');
    note.textContent='Die geteilte Meldung ist nicht mehr im aktuellen Ticker verfügbar. Hier findest du die aktuellen News.';
    host.prepend(note);return;
  }
  for(let parent=target.parentElement;parent&&parent!==host;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  target.querySelector('details').open=true;
  target.classList.add('ls-news-shared');target.tabIndex=-1;
  requestAnimationFrame(()=>{if(target.isConnected){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}});
}

function card(n,school,now) {
  const stale=now-Date.parse(n.checkedAt)>36*3600000;
  return `<article class="ls-news-card" data-news-id="${esc(n.id)}"><div class="ls-news-meta"><span>${esc(n.category)}</span><span class="ls-news-badge">${esc(labels[n.status])}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><details><summary>${school?'Bedeutung für Ihren Betrieb':'Was bedeutet das für dich?'}</summary><div class="ls-news-detail"><h4>${school?'Für Ihre Fahrschule':'Für dich'}</h4><p>${esc(n.impact)}</p><h4>${school?'Nächster Schritt · unsere Einordnung':'Dein nächster Schritt · unsere Einordnung'}</h4><p>${esc(n.action)}</p><p class="ls-news-dates">Meldung: ${date(n.publishedAt)} · Geprüft: ${date(n.checkedAt)}${stale?' · Erneute Prüfung ausstehend':''}</p><ul class="ls-news-sources" aria-label="Quellen">${n.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul></div></details><div class="ls-news-actions"><a class="ls-news-share" data-news-share data-title="${esc(n.title)}" aria-label="${esc('News teilen: '+n.title)}" href="${esc(newsShareUrl(school?'school':'learner',n.id))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>Teilen</a><span class="ls-news-share-status" role="status" aria-live="polite"></span></div></article>`;
}
export function renderNews(data,now=Date.now()) {
  const school=data.audience==='school',items=activeItems(data,now);
  const stale=now-Date.parse(data.checkedAt)>36*3600000 || now<Date.parse(data.checkedAt);
  return `<div class="ls-news-heading"><div><p class="ls-news-kicker">LANE SWITCH · Newsticker</p><h2>${school?'Wichtig für Ihren Fahrschulalltag.':'Wissen, was dich weiterbringt.'}</h2></div><span class="ls-news-frequency">${stale?'Prüfstand beachten':'Täglich geprüft'}</span></div><p class="ls-news-status" role="status">${esc(freshness(data.checkedAt,now))}${now-Date.parse(data.checkedAt)>36*3600000?' Letzter erfolgreicher Stand: '+date(data.checkedAt)+'.':''}</p><div class="ls-news-list">${items.length?items.slice(0,3).map(n=>card(n,school,now)).join(''):'<p>Derzeit liegen hier keine aktuellen, bestätigten Meldungen vor.</p>'}</div>${items.length>3?`<details class="ls-news-more"><summary>Weitere Meldungen (${items.length-3})</summary><div class="ls-news-list">${items.slice(3).map(n=>card(n,school,now)).join('')}</div></details>`:''}<p class="ls-news-note">Eigene Kurzfassungen mit Quellen. Vorschläge und Prognosen sind gekennzeichnet. Neue Meldungen nur bei relevanten Entwicklungen.</p>`;
}
export async function mountNews(host,audience,feedBase='/news/') {
  if(!host) return;
  const token={};host._newsRequest=token;
  const school=audience==='school';
  host.classList.add('ls-news');
  host.setAttribute('aria-label',school?'News für Fahrschulen':'News für Fahrschülerinnen und Fahrschüler');
  let seed=null;
  try { const seedNode=host.querySelector('.ls-news-seed'); if(seedNode) seed=validateFeed(JSON.parse(seedNode.textContent)); } catch {}
  if(seed?.audience===audience) {host.innerHTML=renderNews(seed);bindNews(host);}
  else host.innerHTML='<p role="status">News werden geladen …</p>';
  try {
    const response=await fetch(feedBase+audience+'.json',{cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok) throw Error('News unavailable');
    const data=validateFeed(await response.json());
    if(data.audience!==audience) throw Error('Audience mismatch');
    if(!host.isConnected || host._newsRequest!==token) return;
    host.innerHTML=renderNews(data);
    bindNews(host);
  } catch {
    if(seed?.audience===audience) return;
    if(host.isConnected&&host._newsRequest===token) host.innerHTML='<h2>LANE SWITCH News</h2><p role="status">Die News sind gerade nicht erreichbar. Bitte später erneut laden.</p>';
  }
}
if(typeof document!=='undefined') document.querySelectorAll('[data-ls-news]').forEach(host=>mountNews(host,host.dataset.lsNews));
