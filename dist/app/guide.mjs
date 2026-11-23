// Geführte Nutzerführung: Fahrplan für Fahrschüler:innen, Wegweiser für Fahrschulinhaber:innen
// und „Passt dazu“ unter den Werkzeugen. Speicherung nur auf diesem Gerät (localStorage).
import {icon} from '/app/shell.js?v=7-fragen';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};

// Stylesheet einmalig nachladen (App-Ansicht und Unterseiten)
if(!document.querySelector('link[data-guide-css]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/app/guide.css?v=2';l.dataset.guideCss='';document.head.append(l);}

/* ---------- Fahrschüler:innen ---------- */
export const STEPS={
  netzwerk:{t:'Partnerfahrschulen kennenlernen',d:'Fahrschulen, die dich mit LANE SWITCH über die Prüfung hinaus begleiten.',why:'So startest du mit einer Fahrschule, die dir mehr mitgibt als nur die Prüfung.',href:'/#netzwerk',icon:'network'},
  'fs-kosten':{t:'Führerschein-Kosten',d:'Mit den Preisen deiner Fahrschule durchrechnen, was dein Führerschein kostet.',why:'Wer die Kosten kennt, kann die Fahrstunden besser planen.',href:'/konzept/fuehrerschein-kosten/',icon:'check'},
  lernen:{t:'Lernwelt Klasse B',d:'Theorie verstehen und mit wechselnden Fragen üben.',why:'Wer versteht, statt nur auswendig zu lernen, geht entspannter in die Prüfung.',href:'/konzept/lernwelt/',icon:'book'},
  radar:{t:'Gefahrenradar',d:'Gefahren im Straßenverkehr früh erkennen.',why:'Hilft in der Prüfung und später jeden Tag im echten Verkehr.',whyAfter:'Ohne Fahrlehrer:in daneben zählt dein eigener Blick für Gefahren umso mehr.',href:'/konzept/lernwelt/gefahrenradar/',icon:'radar'},
  startklar:{t:'Startklar-Check',d:'Sechs kurze Fragen, danach deine persönliche Checkliste fürs erste Fahren.',why:'Damit vor der ersten Fahrt allein nichts Wichtiges offen bleibt.',href:'/#startklar',icon:'check'},
  start:{t:'Nach dem Führerschein',d:'Orientierung zu Absicherung und dem Start in die eigene Mobilität.',why:'Ein guter Überblick, was sich mit dem Führerschein für dich ändert.',href:'/konzept/fahrschueler-informationen/',icon:'car'},
  unfall:{t:'Unfallhelfer',d:'Nach einem Unfall die nächsten Schritte im Blick behalten.',why:'Einmal in Ruhe durchgehen, damit du im Ernstfall weißt, was zu tun ist.',href:'/konzept/unfallhelfer/',icon:'shield'},
  kosten:{t:'Fahrzeugkosten',d:'Was kostet dein Auto im Monat? Rechne die laufenden Kosten zusammen.',why:'So planst du dein erstes Auto ohne böse Überraschungen.',href:'/konzept/fahrzeugkosten/',icon:'car'},
  easi:{t:'EaSI Drive',d:'Eine Vertragslösung für junge Fahrer:innen, die mit dem Auto der Eltern fahren.',why:'Wenn du das Auto deiner Eltern nutzt, lohnt sich ein Blick auf den Fahrerkreis.',href:'/konzept/easi-drive/',icon:'shield'}
};
export const STAGES=[
  {id:'start',t:'Ich überlege, den Führerschein zu machen',d:'Noch nicht angemeldet',base:['netzwerk','fs-kosten','lernen'],
   goals:[['netzwerk','Eine passende Fahrschule finden'],['fs-kosten','Wissen, was der Führerschein kostet'],['lernen','Schon mal in die Theorie reinschnuppern']]},
  {id:'theorie',t:'Ich lerne für die Theorie',d:'Angemeldet, die Theorie läuft',base:['lernen','radar','fs-kosten'],
   goals:[['lernen','Theorie verstehen statt nur auswendig lernen'],['radar','Gefahren sicher erkennen'],['fs-kosten','Die Kosten im Blick behalten']]},
  {id:'pruefung',t:'Meine Prüfung steht bald an',d:'Theorie oder Praxis',base:['lernen','radar','unfall'],
   goals:[['lernen','Sicher in die Theorieprüfung gehen'],['radar','Gefahrensituationen sicher einschätzen'],['unfall','Wissen, was bei einem Unfall zu tun ist']]},
  {id:'frisch',t:'Ich habe gerade den Führerschein bestanden',d:'Herzlichen Glückwunsch!',base:['startklar','unfall','start'],after:true,
   goals:[['startklar','Gut vorbereitet losfahren'],['unfall','Wissen, was bei einem Unfall zu tun ist'],['easi','Mit dem Auto meiner Eltern fahren'],['radar','Auch ohne Fahrlehrer:in Gefahren früh erkennen']]},
  {id:'auto',t:'Ich plane mein erstes eigenes Auto',d:'Kauf, Kosten und Absicherung',base:['kosten','startklar','unfall'],after:true,
   goals:[['kosten','Laufende Kosten realistisch einschätzen'],['startklar','Vor der ersten Fahrt alles klären'],['unfall','Wissen, was bei einem Unfall zu tun ist']]}
];
// Nächste Etappe: Der Fahrplan wächst mit (z. B. erst während der Ausbildung, später nach der Prüfung)
const NEXT={start:['theorie','Ich habe mich bei einer Fahrschule angemeldet'],theorie:['pruefung','Meine Prüfung steht jetzt bald an'],pruefung:['frisch','Ich habe die Prüfung bestanden'],frisch:['auto','Ich plane jetzt ein eigenes Auto']};
const STALE=42*24*3600*1000; // nach sechs Wochen nachfragen, ob die Etappe noch stimmt
// Was nach einem Werkzeug sinnvoll weiterführt
const RELATED={netzwerk:['fs-kosten','lernen'],'fs-kosten':['netzwerk','lernen'],lernen:['radar','fs-kosten'],radar:['lernen','unfall'],startklar:['unfall','kosten'],start:['startklar','unfall'],unfall:['startklar','radar'],kosten:['startklar','easi'],easi:['startklar','unfall']};
const BEFORE_ONLY=['netzwerk','fs-kosten','lernen'];

const PKEY='ls-fahrplan-v1';
let plan=Object.assign({stage:null,goals:[],done:[]},read(PKEY)||{});
let wiz=plan.stage?3:1; // 1 Lebenslage, 2 Ziele, 3 Fahrplan
const savePlan=()=>write(PKEY,{stage:plan.stage,goals:plan.goals,done:plan.done,at:plan.at||Date.now()});
function setStage(v){if(!STAGES.some(x=>x.id===v)||v===plan.stage)return;plan.stage=v;const ok=STAGES.find(x=>x.id===v).goals.map(g=>g[0]);plan.goals=plan.goals.filter(x=>ok.includes(x));plan.at=Date.now();savePlan();}
const nextStage=()=>NEXT[plan.stage]||null;
const isStale=()=>!!plan.at&&Date.now()-plan.at>STALE;
const stageOf=()=>STAGES.find(s=>s.id===plan.stage);
const isAfter=()=>!!stageOf()?.after;
export function planSteps(){const s=stageOf();if(!s)return[];return[...new Set([...plan.goals,...s.base])].filter(id=>STEPS[id]).slice(0,5);}
export function planState(){const p=planSteps();const done=p.filter(x=>plan.done.includes(x)).length;return{steps:p,done,next:p.find(x=>!plan.done.includes(x))||null,has:!!plan.stage};}
export function markDone(id,val=true){if(!STEPS[id])return;const has=plan.done.includes(id);if(val&&!has)plan.done=[...plan.done,id];if(!val&&has)plan.done=plan.done.filter(x=>x!==id);savePlan();}
export function related(id){const ex=isAfter()?BEFORE_ONLY:[];const s=stageOf();const c=[...(RELATED[id]||[]),...(s?s.base:[]),...Object.keys(STEPS)];const ok=[...new Set(c)].filter(x=>x!==id&&!ex.includes(x));return[...ok.filter(x=>!plan.done.includes(x)),...ok.filter(x=>plan.done.includes(x))].slice(0,2);}
const why=id=>isAfter()&&STEPS[id].whyAfter?STEPS[id].whyAfter:STEPS[id].why;
const bar=(d,n)=>`<div class="gd-progress"><span>${d} von ${n} erledigt</span><span class="gd-bar" role="progressbar" aria-label="Fortschritt im Fahrplan" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${d}"><i style="width:${n?Math.round(d/n*100):0}%"></i></span></div>`;

// Startseite (Fahrschüler:innen): Einstieg oder Fortschritt
export function planHome(){
  const {steps,done,next,has}=planState();
  if(!has)return `<section class="home-section" aria-labelledby="gd-home-title"><div class="home-head"><h2 id="gd-home-title">Dein Fahrplan</h2></div><div class="home-paths"><a class="home-path" href="#fahrplan"><span class="update-icon">${icon('compass')}</span><span class="path-text"><strong>Was ist für dich als Nächstes dran?</strong><small>Zwei kurze Fragen, dann bekommst du deinen persönlichen Fahrplan.</small></span>${icon('arrow')}</a></div></section>`;
  return `<section class="home-section" aria-labelledby="gd-home-title"><div class="home-head"><h2 id="gd-home-title">Dein Fahrplan</h2><a class="small-link" href="#fahrplan">Ansehen ${icon('arrow')}</a></div><div class="home-panel gd-home">${bar(done,steps.length)}${next?`<p class="gd-kicker">Als Nächstes</p><a class="home-path" href="${STEPS[next].href}"><span class="update-icon">${icon(STEPS[next].icon)}</span><span class="path-text"><strong>${STEPS[next].t}</strong><small>${why(next)}</small></span>${icon('arrow')}</a>`:`<p class="gd-done-note">Alles erledigt für diese Etappe.</p>`}${(!next||isStale())&&nextStage()?`<div class="gd-stage-ask"><p><strong>${next?'Stimmt deine Etappe noch?':'Bereit für die nächste Etappe?'}</strong></p><button class="${next?'secondary':'primary'}" type="button" data-gd-stage="${nextStage()[0]}"><span class="action-label">${nextStage()[1]}</span>${icon('arrow')}</button></div>`:''}<p class="gd-stage-line">Etappe: ${esc(stageOf().t)} · <a href="#fahrplan" data-gd="replan-go">Ändern</a></p></div></section>`;
}
export function heroAction(){const {next,has}=planState();if(!has)return['#fahrplan','Fahrplan erstellen'];if(next)return[STEPS[next].href,'Weiter: '+STEPS[next].t];return['#fahrplan','Fahrplan ansehen'];}

// App-Ansicht #fahrplan
export function renderPlan(el,{pageHead}){
  const back=`<a class="small-link back-link" href="#entdecken">← Zur Übersicht</a>`;
  if(wiz===1||!plan.stage){
    el.innerHTML=pageHead('Dein Fahrplan','Zwei kurze Fragen, dann zeigen wir dir, was für dich als Nächstes dran ist.',back)+`<form class="sk-form gd-form" data-gd-form="stage" novalidate><div class="gd-steps" aria-hidden="true"><span class="on"></span><span></span></div><fieldset class="sk-q"><legend><span class="sk-num">Frage 1 von 2</span>Wo stehst du gerade?</legend><div class="sk-options">${STAGES.map(s=>`<label class="sk-option"><input type="radio" name="stage" value="${s.id}" ${plan.stage===s.id?'checked':''}><span><strong class="gd-opt-title">${s.t}</strong><small class="gd-opt-sub">${s.d}</small></span></label>`).join('')}</div></fieldset><p class="form-caption" role="status" data-gd-hint></p><button class="primary" type="submit"><span class="action-label">Weiter</span>${icon('arrow')}</button></form>`;return;}
  const s=stageOf();
  if(wiz===2){
    el.innerHTML=pageHead('Dein Fahrplan',esc(s.t)+'. Was ist dir jetzt wichtig? Mehrfachauswahl möglich, du kannst das auch überspringen.',back)+`<form class="sk-form gd-form" data-gd-form="goals" novalidate><div class="gd-steps" aria-hidden="true"><span class="on"></span><span class="on"></span></div><fieldset class="sk-q"><legend><span class="sk-num">Frage 2 von 2</span>Was ist dir gerade wichtig?</legend><div class="sk-options">${s.goals.map(([id,t])=>`<label class="sk-option"><input type="checkbox" name="goal" value="${id}" ${plan.goals.includes(id)?'checked':''}><span>${t}</span></label>`).join('')}</div></fieldset><div class="gd-actions"><button class="secondary" type="button" data-gd="back">Zurück</button><button class="primary" type="submit"><span class="action-label">Fahrplan anzeigen</span>${icon('arrow')}</button></div></form>`;return;}
  const {steps,done,next}=planState();
  el.innerHTML=pageHead('Dein Fahrplan',esc(s.t)+'. Schritt für Schritt, in deinem Tempo.',back)+
  `<section class="home-section"><div class="home-panel">${bar(done,steps.length)}</div></section>`+
  (next?`<section class="home-section" aria-labelledby="gd-next-title"><div class="gd-next"><p class="gd-kicker">Als Nächstes · Schritt ${steps.indexOf(next)+1} von ${steps.length}</p><h2 id="gd-next-title" tabindex="-1">${STEPS[next].t}</h2><p>${STEPS[next].d}</p><p class="gd-why"><strong>Warum jetzt?</strong> ${why(next)}</p><div class="gd-actions"><a class="primary" href="${STEPS[next].href}"><span class="action-label">Jetzt starten</span>${icon('arrow')}</a><button class="secondary" type="button" data-gd-done="${next}">Schon erledigt</button></div></div></section>`
   :`<section class="home-section"><div class="gd-next"><h2 id="gd-next-title" tabindex="-1">Alles erledigt. Stark!</h2><p>${nextStage()?'Wenn du weiter bist, wechsle in die nächste Etappe. Erledigte Schritte bleiben abgehakt.':'Wenn sich bei dir etwas ändert, passe deine Etappe an. Dann bekommst du neue Schritte.'}</p></div></section>`)+
  `<section class="home-section" aria-labelledby="gd-stage-title"><div class="home-panel gd-stage"><p class="gd-kicker" id="gd-stage-title">Deine Etappe</p><p class="gd-stage-now">${esc(s.t)}</p>${nextStage()?`<p class="gd-stage-hint">Schon weiter? Dein Fahrplan wächst mit, erledigte Schritte bleiben abgehakt.</p>`:''}<div class="gd-actions">${nextStage()?`<button class="${next?'secondary':'primary'}" type="button" data-gd-stage="${nextStage()[0]}"><span class="action-label">${nextStage()[1]}</span>${icon('arrow')}</button>`:''}<button class="secondary" type="button" data-gd="replan">Andere Etappe wählen</button></div></div></section>`+
  `<section class="home-section" aria-labelledby="gd-all-title"><div class="home-head"><h2 id="gd-all-title">Alle Schritte</h2></div><ol class="gd-list">${steps.map((id,i)=>{const d=plan.done.includes(id);return `<li class="gd-item${d?' is-done':''}"><button type="button" class="gd-tick" data-gd-done="${id}" aria-pressed="${d}" aria-label="${STEPS[id].t}: ${d?'als offen markieren':'als erledigt markieren'}">${icon('check')}</button><a class="gd-item-link" href="${STEPS[id].href}"><span class="gd-item-text"><small>Schritt ${i+1}</small><strong>${STEPS[id].t}</strong><span>${STEPS[id].d}</span></span>${icon('arrow')}</a></li>`}).join('')}</ol><div class="gd-actions gd-foot"><button class="secondary" type="button" data-gd="goals">Ziele anpassen</button><a class="small-link" href="#werkzeuge">Alle Werkzeuge ${icon('arrow')}</a></div><p class="form-caption">Dein Fahrplan wird nur auf diesem Gerät gespeichert.</p></section>`;
}

/* ---------- Fahrschulinhaber:innen ---------- */
export const BLOCKS={
  navigator:{t:'Fahrschul-Navigator',d:'Anmeldung, Ausbildung und Preise Ihrer Fahrschule als Online-Ausgabe und PDF für Ihre Fahrschüler:innen.',href:'/navigator/demo',cta:'Demo ansehen',icon:'compass'},
  aistudio:{t:'LANESWITCH AI Studio',d:'Geführt zu eigenen Social-Media-Beiträgen, die zu Ihrer Fahrschule passen. Die Entscheidung bleibt bei Ihnen.',href:'/ai-studio/demo/',cta:'Demo ansehen',icon:'tools'},
  unterricht:{t:'Gastbeitrag im Theorieunterricht',d:'Rund 45 Minuten mit einem Versicherungsexperten, mit Wissensquiz, etwa zu Kfz-Haftpflicht und Verhalten nach einem Unfall.',href:'/konzept/fahrschulen-informationen/',cta:'Mehr erfahren',icon:'book'},
  qr:{t:'Eigener QR-Code für Ihre Fahrschüler:innen',d:'Interessierte Fahrschüler:innen melden sich über Ihren QR-Code direkt, wenn sie Fragen zur Absicherung haben.',href:'/konzept/fahrschulen-informationen/',cta:'Mehr erfahren',icon:'network'},
  check:{t:'5-Minuten-Check',d:'Mit zwölf Fragen den Schutz Ihres Betriebs strukturiert einordnen.',href:'/konzept/fahrschul-check/',cta:'Check starten',icon:'check'},
  cockpit:{t:'Fahrschul-Cockpit',d:'Betrieb, Team, Fuhrpark und Absicherung an einem Ort.',href:'/konzept/cockpit/',cta:'Cockpit öffnen',icon:'tools'},
  notfall:{t:'Notfallcenter',d:'Strukturierte Erstschritte für betriebliche Notfälle.',href:'/konzept/notfallcenter/',cta:'Notfallcenter öffnen',icon:'shield'},
  vorlagen:{t:'Vorlagen',d:'Checks, Notfallkarten und Protokolle für Ihren Fahrschulalltag.',href:'/konzept/vorlagen/',cta:'Vorlagen ansehen',icon:'file'},
  netzwerk:{t:'Netzwerk',d:'Ergänzende Kontakte und Lösungen für Ihren Betrieb.',href:'/konzept/fahrschulen-informationen/',cta:'Mehr erfahren',icon:'network'}
};
export const NEEDS=[
  {id:'begleiten',t:'Fahrschüler:innen über die Prüfung hinaus begleiten',blocks:['unterricht','qr','navigator']},
  {id:'fragen',t:'Fragen vor der Anmeldung gebündelt beantworten',blocks:['navigator']},
  {id:'social',t:'Social Media mit weniger Aufwand',blocks:['aistudio']},
  {id:'betrieb',t:'Den eigenen Betrieb gut abgesichert wissen',blocks:['check','cockpit']},
  {id:'ernstfall',t:'Im Ernstfall vorbereitet sein',blocks:['notfall','vorlagen']},
  {id:'netz',t:'Kontakte und Netzwerk für den Betrieb',blocks:['netzwerk']}
];
const WKEY='ls-wegweiser-v1';
let way=Object.assign({needs:[]},read(WKEY)||{});
let wayStep=way.needs.length?2:1;
const saveWay=()=>write(WKEY,{needs:way.needs});
export function wayBlocks(){return[...new Set(way.needs.flatMap(n=>NEEDS.find(x=>x.id===n)?.blocks||[]))];}

export function wayHome(){
  const b=wayBlocks();
  return `<section class="home-section" aria-labelledby="gd-way-title"><div class="home-head"><h2 id="gd-way-title">Was passt zu Ihrer Fahrschule?</h2></div><div class="home-paths"><a class="home-path" href="#wegweiser"><span class="update-icon">${icon('compass')}</span><span class="path-text"><strong>${b.length?`Ihre ${b.length} passenden Bausteine`:'Passende Bausteine in einer Minute finden'}</strong><small>${b.length?'Weiter, wo Sie aufgehört haben.':'Sie wählen, was Ihnen wichtig ist. Wir zeigen, welche Bausteine dazu passen.'}</small></span>${icon('arrow')}</a></div></section>`;
}
export function renderWay(el,{pageHead}){
  const back=`<a class="small-link back-link" href="#entdecken">← Zur Übersicht</a>`;
  if(wayStep===1||!way.needs.length){
    el.innerHTML=pageHead('Passende Bausteine finden','Wählen Sie, was Ihnen wichtig ist. Es gibt kein festes Paket, Sie entscheiden frei.',back)+`<form class="sk-form gd-form" data-gd-form="needs" novalidate><div class="gd-steps" aria-hidden="true"><span class="on"></span><span></span></div><fieldset class="sk-q"><legend><span class="sk-num">Schritt 1 von 2</span>Was wünschen Sie sich für Ihre Fahrschule?</legend><div class="sk-options">${NEEDS.map(n=>`<label class="sk-option"><input type="checkbox" name="need" value="${n.id}" ${way.needs.includes(n.id)?'checked':''}><span>${n.t}</span></label>`).join('')}</div></fieldset><p class="form-caption" role="status" data-gd-hint></p><button class="primary" type="submit"><span class="action-label">Passende Bausteine zeigen</span>${icon('arrow')}</button><p class="form-caption">Bereits Partnerfahrschule? <a href="/navigator/zugang">Zum Partnerbereich</a></p></form>`;return;}
  const b=wayBlocks();
  el.innerHTML=pageHead('Ihre passenden Bausteine',`${b.length} ${b.length===1?'Baustein':'Bausteine'} auf Basis Ihrer Auswahl. Kostenfrei für Partnerfahrschulen.`,back)+
  `<section class="home-section"><div class="home-paths">${b.map(k=>{const x=BLOCKS[k];return `<a class="home-path tool-row" href="${x.href}"><span class="update-icon">${icon(x.icon)}</span><span class="path-text"><strong>${x.t}</strong><small>${x.d}</small></span><span class="tool-action">${x.cta}</span>${icon('arrow')}</a>`}).join('')}</div></section>`+
  `<section class="home-section" aria-labelledby="gd-way-next"><div class="gd-next"><p class="gd-kicker">Ihr nächster Schritt</p><h2 id="gd-way-next">Kurz kennenlernen</h2><p>Ein etwa 20-minütiges Gespräch, online oder vor Ort. Ihre Auswahl geben wir direkt mit, danach entscheiden Sie in Ruhe.</p><div class="gd-actions"><button class="primary" type="button" data-gd="way-contact"><span class="action-label">Kennenlernen anfragen</span>${icon('arrow')}</button><a class="secondary" href="/konzept/kooperation-ablauf/">So läuft eine Kooperation</a></div></div></section>`+
  `<div class="gd-actions gd-foot"><button class="secondary" type="button" data-gd="way-edit">Auswahl ändern</button></div><p class="form-caption">Ihre Auswahl wird nur auf diesem Gerät gespeichert.</p>`;
}

/* ---------- Ereignisse (App-Ansichten) ---------- */
let rerender=()=>{},onContact=()=>{};
export function bindApp(opts){rerender=opts.rerender;onContact=opts.onContact;}
const top=()=>window.scrollTo({top:0,behavior:'instant'});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-gd-form]');if(!f)return;e.preventDefault();const kind=f.dataset.gdForm;const hint=f.querySelector('[data-gd-hint]');
  if(kind==='stage'){const v=f.querySelector('input[name=stage]:checked')?.value;if(!v){if(hint)hint.textContent='Bitte wähle aus, wo du gerade stehst.';f.querySelector('input')?.focus();return;}setStage(v);wiz=2;rerender();top();}
  if(kind==='goals'){plan.goals=[...f.querySelectorAll('input[name=goal]:checked')].map(i=>i.value);savePlan();wiz=3;rerender();top();}
  if(kind==='needs'){const v=[...f.querySelectorAll('input[name=need]:checked')].map(i=>i.value);if(!v.length){if(hint)hint.textContent='Bitte wählen Sie mindestens einen Punkt aus.';f.querySelector('input')?.focus();return;}way.needs=v;saveWay();wayStep=2;rerender();top();}
});
document.addEventListener('click',e=>{
  const d=e.target.closest('[data-gd-done]');
  if(d&&d.closest('#view')){const id=d.dataset.gdDone;const inList=!!d.closest('.gd-list');markDone(id,!plan.done.includes(id));rerender();(inList?document.querySelector(`.gd-list [data-gd-done="${id}"]`):document.getElementById('gd-next-title')||document.querySelector('.gd-next h2'))?.focus({preventScroll:true});return;}
  const st=e.target.closest('[data-gd-stage]');if(st&&st.closest('#view')){setStage(st.dataset.gdStage);wiz=2;if(location.hash!=='#fahrplan')location.hash='#fahrplan';else{rerender();top();}return;}
  const a=e.target.closest('[data-gd]');if(!a||!a.closest('#view'))return;
  const x=a.dataset.gd;
  if(x==='back'){wiz=1;rerender();top();}
  if(x==='replan'){wiz=1;rerender();top();}
  if(x==='replan-go'){wiz=1;}
  if(x==='goals'){wiz=2;rerender();top();}
  if(x==='way-edit'){wayStep=1;rerender();top();}
  if(x==='way-contact'){const list=wayBlocks().map(k=>'- '+BLOCKS[k].t).join('\n');onContact({topic:'20-Minuten-Kennenlernen',message:'Ich interessiere mich für ein Kennenlernen. Diese Bausteine passen laut Wegweiser zu uns:\n'+list});}
});

/* ---------- Unterseiten: „Passt dazu“ unter dem Werkzeug ---------- */
const PAGE_STEP={'lernwelt':'lernen','fahrzeugkosten':'kosten','fuehrerschein-kosten':'fs-kosten','unfallhelfer':'unfall','easi-drive':'easi','fahrschueler-informationen':'start'};
const PAGE_BLOCK={'fahrschul-check':'check','cockpit':'cockpit','notfallcenter':'notfall','vorlagen':'vorlagen','fahrschulen-informationen':'netzwerk'};
const SCHOOL_RELATED={check:['cockpit','notfall'],cockpit:['check','vorlagen'],notfall:['vorlagen','cockpit'],vorlagen:['notfall','check'],netzwerk:['navigator','check']};
const row=(x,cta)=>`<a class="sp-row" href="${x.href}"><span class="sp-row-icon">${icon(x.icon)}</span><span class="sp-row-text"><strong>${x.t}</strong><small>${x.d}</small></span>${cta?`<span class="sp-row-action">${cta}</span>`:''}${icon('arrow')}</a>`;
export function mountNext(){
  const m=location.pathname.match(/^\/konzept\/([a-z-]+)\/$/);if(!m)return;
  const page=document.querySelector('.sp-page');if(!page)return;
  let box=document.getElementById('gd-next');if(!box){box=document.createElement('section');box.id='gd-next';box.className='sp-section gd-sub';page.append(box);}
  const sid=PAGE_STEP[m[1]],bid=PAGE_BLOCK[m[1]];
  if(sid){
    const {steps,next,has}=planState();const inPlan=steps.includes(sid),done=plan.done.includes(sid);
    const nxt=next&&next!==sid?next:null;
    box.setAttribute('aria-labelledby',inPlan||!has?'gd-sub-title':'gd-sub-related');
    box.innerHTML=(inPlan?`<div class="sp-cta gd-sub-plan"><div><p class="sp-label">Schritt ${steps.indexOf(sid)+1} von ${steps.length} in deinem Fahrplan</p><h2 id="gd-sub-title" tabindex="-1">${done?'Erledigt. Gut gemacht!':'Fertig mit diesem Schritt?'}</h2><p>${done&&nxt?'Als Nächstes: '+STEPS[nxt].t+'.':done?'Damit ist dein Fahrplan komplett.':'Hake ihn ab, dann zeigt dir dein Fahrplan den nächsten Schritt.'}</p></div><div class="sp-actions">${done?(nxt?`<a class="sp-btn sp-btn-primary" href="${STEPS[nxt].href}">Weiter: ${STEPS[nxt].t} ${icon('arrow')}</a>`:`<a class="sp-btn sp-btn-primary" href="/#fahrplan">Fahrplan ansehen</a>`):`<button type="button" class="sp-btn sp-btn-primary" data-gd-sub-done="${sid}">${icon('check')} Als erledigt markieren</button>`}</div></div>`
      :!has?`<div class="sp-cta"><div><h2 id="gd-sub-title">Was ist für dich als Nächstes dran?</h2><p>Zwei kurze Fragen, dann bekommst du deinen persönlichen Fahrplan.</p></div><div class="sp-actions"><a class="sp-btn sp-btn-primary" href="/#fahrplan">Fahrplan erstellen ${icon('arrow')}</a></div></div>`:'')+
      `<div class="sp-section-head gd-sub-head"><h2 id="gd-sub-related">Passt dazu</h2></div><div class="sp-rows">${related(sid).map(r=>row(STEPS[r])).join('')}</div>`;
  }else if(bid){
    box.setAttribute('aria-labelledby','gd-sub-title');
    const b=wayBlocks();
    box.innerHTML=`<div class="sp-section-head"><h2 id="gd-sub-title">Passt dazu</h2></div><div class="sp-rows">${(SCHOOL_RELATED[bid]||[]).map(k=>row(BLOCKS[k],BLOCKS[k].cta)).join('')}</div><div class="sp-cta gd-sub-way"><div><h2>${b.length?'Ihre passenden Bausteine':'Was passt zu Ihrer Fahrschule?'}</h2><p>${b.length?'Ihre Auswahl im Überblick, mit dem nächsten Schritt.':'Wählen Sie, was Ihnen wichtig ist. Wir zeigen, welche Bausteine dazu passen.'}</p></div><div class="sp-actions"><a class="sp-btn sp-btn-primary" href="/#wegweiser">${b.length?'Auswahl ansehen':'Bausteine finden'} ${icon('arrow')}</a></div></div>`;
  }else box.remove();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-gd-sub-done]');if(!b)return;markDone(b.dataset.gdSubDone);mountNext();document.getElementById('gd-sub-title')?.focus?.();});
