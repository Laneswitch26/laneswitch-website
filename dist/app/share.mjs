// Inhalte teilen: ein „Teilen“-Knopf je Seite/Ansicht, Dialog mit WhatsApp, E-Mail, Link kopieren und Systemteilen.
// Der Text richtet sich nach Inhalt und Bereich: Inhalte nur für Fahrschüler:innen → „du“, nur für Fahrschulen → „Sie“,
// Inhalte für beide → je nach gewähltem Bereich. Unbekannte Seiten nutzen Überschrift und Seitenbeschreibung.
const BASE='https://laneswitch.online';
const svg=p=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
export const shareIcon=svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>');
const icons={
 whatsapp:svg('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5 5 16.1a8.4 8.4 0 1 1 15.5-4.5Z"/><path d="M9 8.6c.2 2.9 2.6 5.6 5.7 6.3l1.2-1.4-1.8-1-1 .8a5.2 5.2 0 0 1-2.3-2.3l.8-1-1-1.8Z"/>'),
 mail:svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>'),
 link:svg('<path d="M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12 6.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7l1.6-1.6"/>'),
 more:shareIcon
};

// only: Zielgruppe des Inhalts. Fehlt sie, gilt der aktuell gewählte Bereich.
const CONTENT={
 gefahrenradar:{only:'learner',path:'/konzept/lernwelt/gefahrenradar/',name:'Gefahrenradar',learner:'25 Verkehrssituationen aus Fahrerperspektive: Gefahren erkennen und richtig reagieren. Kostenlos und ohne Anmeldung.'},
 lernwelt:{only:'learner',path:'/konzept/lernwelt/',name:'Lernwelt Klasse B',learner:'Wechselnde Übungsfragen rund um den Straßenverkehr, ideal zum Wissen-Festigen neben der Fahrschule.'},
 fahrzeugkosten:{only:'learner',path:'/konzept/fahrzeugkosten/',name:'Fahrzeugkosten-Rechner',learner:'Was kostet ein eigenes Auto im Monat wirklich? In wenigen Schritten die laufenden Kosten zusammenrechnen.'},
 unfallhelfer:{only:'learner',path:'/konzept/unfallhelfer/',name:'Unfallhelfer',learner:'Nach einem Unfall Schritt für Schritt wissen, was zu tun ist, mit Notrufnummern und Checkliste.'},
 'easi-drive':{only:'learner',path:'/konzept/easi-drive/',name:'EaSI Drive',learner:'Eine Vertragslösung für junge Fahrer:innen, verständlich erklärt.'},
 'fahrschueler-informationen':{only:'learner',path:'/konzept/fahrschueler-informationen/',name:'Nach dem Führerschein',learner:'Orientierung zu Absicherung und dem Start in die eigene Mobilität.'},
 startklar:{only:'learner',path:'/#startklar',name:'Startklar-Check',learner:'Sechs kurze Fragen nach der Prüfung, danach gibt es eine persönliche Checkliste fürs erste Fahren.'},
 'fahrschul-check':{only:'school',path:'/konzept/fahrschul-check/',name:'5-Minuten-Check für Fahrschulen',school:'Mit zwölf Fragen den Schutz des eigenen Betriebs strukturiert einordnen.'},
 cockpit:{only:'school',path:'/konzept/cockpit/',name:'Fahrschul-Cockpit',school:'Betrieb, Team, Fuhrpark und Absicherung an einem Ort im Blick.'},
 vorlagen:{only:'school',path:'/konzept/vorlagen/',name:'Vorlagen für Fahrschulen',school:'Checks, Notfallkarten und Protokolle für den Fahrschulalltag, direkt zum Ausdrucken.'},
 notfallcenter:{only:'school',path:'/konzept/notfallcenter/',name:'Notfallcenter für Fahrschulen',school:'Strukturierte Erstschritte für betriebliche Notfälle.'},
 'fahrschulen-informationen':{only:'school',path:'/konzept/fahrschulen-informationen/',name:'Kooperationskonzept für Fahrschulen',school:'Versicherungscheck, Theoriebeitrag, Kooperation und Netzwerk im Überblick.'},
 altersvorsorge:{path:'/konzept/altersvorsorge/',name:'Förderrechner Altersvorsorge',learner:'Was kommt zum eigenen Sparbeitrag dazu? Die staatlichen Zulagen ab 2027 verständlich berechnet.',school:'Beitrag und Fördervoraussetzungen der privaten Altersvorsorge 2027 für Selbstständige prüfen.',query:{learner:'?zielgruppe=fahrschueler',school:'?zielgruppe=fahrschulen'}},
 werkzeuge:{path:'/#werkzeuge',app:true,name:'Werkzeuge',learnerName:'Werkzeuge für deinen Führerschein',schoolName:'Werkzeuge für Fahrschulen',learner:'Gefahrenradar, Lernwelt, Fahrzeugkosten-Rechner und mehr, kostenlos auf LANE SWITCH.',school:'5-Minuten-Check, Cockpit, Vorlagen und Notfallcenter für den Fahrschulalltag.'},
 netzwerk:{path:'/#netzwerk',app:true,name:'Netzwerk',learnerName:'Partnerfahrschulen',schoolName:'Das LANE SWITCH Netzwerk',learner:'Fahrschulen im LANE SWITCH Netzwerk mit Standorten, Führerscheinklassen und Kontakt.',school:'Ein Fahrschulnetzwerk und die Möglichkeiten einer Kooperation.'},
 'fahrschule-emre':{path:'/konzept/kooperationen/fahrschulen/fahrschule-emre/',name:'Fahrschule Emre',learner:'Partnerfahrschule in Herne und Recklinghausen: Pkw, Anhänger, Motorrad und begleitetes Fahren ab 17. Standorte und Kontakt im Überblick.',school:'Partnerfahrschule im LANE SWITCH Netzwerk mit drei Standorten in Herne und Recklinghausen.'},
 'fahrschule-a1':{path:'/konzept/kooperationen/fahrschulen/fahrschule-a1/',name:'A1 Fahrschule',learner:'Partnerfahrschule in Herne-Wanne-Eickel: Pkw, Anhänger, Motorrad und Mofa. Ansprechpartner und Kontakt im Überblick.',school:'Partnerfahrschule im LANE SWITCH Netzwerk in Herne-Wanne-Eickel.'},
 'ai-studio-demo':{only:'school',path:'/ai-studio/demo/',name:'LANESWITCH AI Studio · Beispieldemo',school:'Ohne Anmeldung ansehen, wie Fahrschulen mit ChatGPT, Gemini oder Claude ein Markenprofil, eigene KI-Prompts und Social-Media-Beiträge entwickeln.'},
 'navigator-demo':{only:'school',path:'/navigator/demo',name:'Fahrschul-Navigator · Demo',school:'Den Fahrschul-Navigator ohne Anmeldung mit einer Musterfahrschule ausprobieren. Nichts wird gespeichert.'},
 news:{path:'/#news',app:true,name:'Newsticker',learner:'Geprüfte Meldungen zu Führerschein, Mobilität und Kosten, mit Quellen und Einordnung.',school:'Geprüfte Meldungen für Ausbildung, Betrieb und Fuhrpark, mit Quellen und Einordnung.'}
};

const readAudience=()=>{try{return localStorage.getItem('ls-audience-v2')==='school'?'school':'learner'}catch{return 'learner'}};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const meta=n=>document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content')||'';

// Fällt auf Seitenüberschrift und Beschreibung zurück (z. B. Partnerprofile).
function fromPage(){
 const h1=clean(document.querySelector('main h1')?.textContent)||clean(document.title.split('|')[0]);
 const desc=clean(meta('description')||meta('og:description'));
 return {path:location.pathname,name:h1,learner:desc,school:desc};
}

export function shareData(id,audience=readAudience()){
 const c=CONTENT[id]||fromPage();
 const tone=c.only||audience;
 const name=(tone==='school'?c.schoolName:c.learnerName)||c.name;
 const desc=c[tone]||c.learner||c.school||'';
 let url=BASE+c.path;
 if(c.query)url=BASE+c.path+c.query[tone];
 else if(c.app)url=BASE+'/?zielgruppe='+tone+c.path.slice(1);
 const intro=tone==='school'?'Hallo, das könnte Sie interessieren, gefunden auf LANE SWITCH:':'Hey, schau dir das mal auf LANE SWITCH an:';
 const chat=`${intro}\n\n*${name}*\n${desc}\n\n👉 ${url}`;
 const plain=`${intro}\n\n${name}\n${desc}\n\n${url}`;
 const subject=`Tipp von LANE SWITCH: ${name}`;
 const mailBody=`${tone==='school'?'Hallo,\n\nauf LANE SWITCH habe ich etwas gefunden, das Sie interessieren könnte:':'Hey,\n\nschau dir das mal auf LANE SWITCH an:'}\n\n${name}\n${desc}\n\n${url}\n\nViele Grüße`;
 return {name,desc,url,tone,chat,plain,subject,whatsapp:'https://wa.me/?text='+encodeURIComponent(chat),email:'mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(mailBody)};
}

const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function openShare(id,audience){
 const data=shareData(id,audience);
 document.getElementById('ls-share')?.remove();
 const d=document.createElement('dialog');d.id='ls-share';d.className='ls-share';d.setAttribute('aria-labelledby','ls-share-title');
 const you=data.tone==='school';
 d.innerHTML=`<div class="ls-share-head"><div><p class="ls-share-kicker">${shareIcon}${you?'Inhalt teilen':'Teilen'}</p><h2 id="ls-share-title">${escapeHtml(data.name)}</h2></div><button type="button" class="ls-share-close" aria-label="Teilen schließen">×</button></div>
 <div class="ls-share-body"><p class="ls-share-label">Vorschau der Nachricht</p><div class="ls-share-preview"><p>${escapeHtml(data.chat.split('\n\n')[0])}</p><p><strong>${escapeHtml(data.name)}</strong><br>${escapeHtml(data.desc)}</p><p class="ls-share-url">${escapeHtml(data.url)}</p></div>
 <div class="ls-share-actions"><a class="ls-share-action is-whatsapp" href="${data.whatsapp}" target="_blank" rel="noopener noreferrer">${icons.whatsapp}<span>WhatsApp</span></a><a class="ls-share-action" href="${data.email}">${icons.mail}<span>E-Mail</span></a><button type="button" class="ls-share-action" data-copy>${icons.link}<span>Link kopieren</span></button>${navigator.share?`<button type="button" class="ls-share-action" data-native>${icons.more}<span>Mehr …</span></button>`:''}</div>
 <p class="ls-share-status" role="status" aria-live="polite">${you?'Sie senden die Nachricht selbst in der gewählten App.':'Du sendest die Nachricht selbst in der gewählten App.'}</p></div>`;
 const status=d.querySelector('.ls-share-status');
 d.querySelector('.ls-share-close').onclick=()=>d.close();
 d.addEventListener('click',e=>{if(e.target===d)d.close()});
 d.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(data.plain);status.textContent=you?'Text und Link kopiert. Sie können beides in jede Nachricht einfügen.':'Text und Link kopiert. Du kannst beides in jede Nachricht einfügen.'}catch{status.textContent='Kopieren war nicht möglich. Bitte den Link oben markieren und kopieren.'}};
 d.querySelector('[data-native]')?.addEventListener('click',async()=>{try{await navigator.share({title:data.name,text:data.plain})}catch(e){if(e.name!=='AbortError')status.textContent='Teilen war nicht möglich. Bitte WhatsApp, E-Mail oder „Link kopieren“ nutzen.'}});
 d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();
}

export const shareButton=(id,extra='')=>`<button type="button" class="ls-share-button${extra?' '+extra:''}" data-ls-share="${id}" aria-haspopup="dialog">${shareIcon}<span>Teilen</span></button>`;

// Ein Klick-Listener für alle Teilen-Knöpfe, auch für später gerenderte Ansichten.
if(!window.__lsShareBound){window.__lsShareBound=true;document.addEventListener('click',e=>{const b=e.target.closest('[data-ls-share]');if(!b)return;e.preventDefault();openShare(b.dataset.lsShare||'',b.dataset.lsAudience||undefined)});}
