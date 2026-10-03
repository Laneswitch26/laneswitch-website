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
function card(n,school,now) {
  const stale=now-Date.parse(n.checkedAt)>36*3600000;
  return `<article class="ls-news-card"><div class="ls-news-meta"><span>${esc(n.category)}</span><span class="ls-news-badge">${esc(labels[n.status])}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><details><summary>${school?'Bedeutung für Ihren Betrieb':'Was bedeutet das für dich?'}</summary><div class="ls-news-detail"><h4>${school?'Für Ihre Fahrschule':'Für dich'}</h4><p>${esc(n.impact)}</p><h4>${school?'Nächster Schritt · unsere Einordnung':'Dein nächster Schritt · unsere Einordnung'}</h4><p>${esc(n.action)}</p><p class="ls-news-dates">Meldung: ${date(n.publishedAt)} · Geprüft: ${date(n.checkedAt)}${stale?' · Erneute Prüfung ausstehend':''}</p><ul class="ls-news-sources" aria-label="Quellen">${n.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul></div></details></article>`;
}
export async function mountNews(host,audience,feedBase='/news/') {
  if(!host) return;
  const token={};host._newsRequest=token;
  const school=audience==='school';
  host.classList.add('ls-news');
  host.setAttribute('aria-label',school?'News für Fahrschulen':'News für Fahrschülerinnen und Fahrschüler');
  host.innerHTML='<p role="status">News werden geladen …</p>';
  try {
    const response=await fetch(feedBase+audience+'.json',{cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok) throw Error('News unavailable');
    const data=validateFeed(await response.json());
    if(data.audience!==audience) throw Error('Audience mismatch');
    if(!host.isConnected || host._newsRequest!==token) return;
    const now=Date.now(),items=activeItems(data,now);
    host.innerHTML=`<div class="ls-news-heading"><div><p class="ls-news-kicker">LANE SWITCH · Newsticker</p><h2>${school?'Wichtig für Ihren Fahrschulalltag.':'Wissen, was dich weiterbringt.'}</h2></div><span class="ls-news-frequency">Täglich geprüft</span></div><p class="ls-news-status" role="status">${esc(freshness(data.checkedAt,now))}${now-Date.parse(data.checkedAt)>36*3600000?' Letzter erfolgreicher Stand: '+date(data.checkedAt)+'.':''}</p><div class="ls-news-list">${items.length?items.slice(0,3).map(n=>card(n,school,now)).join(''):'<p>Derzeit liegen hier keine aktuellen, bestätigten Meldungen vor.</p>'}</div>${items.length>3?`<details class="ls-news-more"><summary>Weitere Meldungen (${items.length-3})</summary><div class="ls-news-list">${items.slice(3,10).map(n=>card(n,school,now)).join('')}</div></details>`:''}<p class="ls-news-note">Eigene Kurzfassungen mit Quellen. Vorschläge und Prognosen sind gekennzeichnet. Neue Meldungen nur bei relevanten Entwicklungen.</p>`;
    if(now-Date.parse(data.checkedAt)>36*3600000 || now<Date.parse(data.checkedAt)) host.querySelector('.ls-news-frequency').textContent='Prüfstand beachten';
  } catch {
    if(host.isConnected&&host._newsRequest===token) host.innerHTML='<h2>LANE SWITCH News</h2><p role="status">Die News sind gerade nicht erreichbar. Bitte später erneut laden.</p>';
  }
}
if(typeof document!=='undefined') document.querySelectorAll('[data-ls-news]').forEach(host=>mountNews(host,host.dataset.lsNews));
