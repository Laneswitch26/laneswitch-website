import { SCENES, RULES, BADGES } from './scenes.mjs?v=5';
import { shuffle, createSceneDeck, isHit, scoreScene, summarize } from './core.mjs?v=5';
import { illustration, paint } from './illustrations.mjs?v=5';

const $ = id => document.getElementById(id);
const stage = $('gr-stage');
const panel = $('gr-panel');
const deck = createSceneDeck(SCENES);
$('gr-pool-size').textContent = `${SCENES.length} Szenen · 5 pro Runde`;
let phase = 'start', scenes = [], index = 0, records = [], record, scene;
let frame = 0, lastTick = 0, elapsed = 0, lastAttempt = -Infinity;
let calm = false, textMode = false, cursor = { x: 400, y: 280 };
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const stopClock = () => { cancelAnimationFrame(frame); frame = 0; lastTick = 0; };
function focus(id) { $(id)?.focus({ preventScroll: true }); }
function announce(message) { $('gr-status').textContent = message; }
function updatePoints() { $('gr-total').textContent = `${records.reduce((sum, item) => sum + scoreScene(item), 0) + (record ? scoreScene(record) : 0)} Punkte`; }
function clearCursor() { stage.querySelector('[data-cursor]')?.setAttribute('visibility','hidden'); }
function drawCursor() {
  const marker = stage.querySelector('[data-cursor]');
  if (!marker) return;
  marker.setAttribute('visibility','visible');
  marker.setAttribute('transform',`translate(${cursor.x} ${cursor.y})`);
}
function start() {
  stopClock(); calm = $('gr-calm').checked; textMode = $('gr-text').checked;
  scenes = Array(5);
  index = 0; records = []; record = null;
  $('gr-start').hidden = true; $('gr-result').hidden = true; $('gr-round').hidden = false;
  nextScene();
  $('game').scrollIntoView({block:'start',behavior:'instant'});
}
function nextScene() {
  stopClock();
  const item = deck.next();
  scene = {...item, cueMs: item.cueMs === 0 ? 0 : item.cueMs + Math.round(Math.random()*700)-350, options:shuffle(item.options)};
  scenes[index] = scene;
  record = { id:scene.id, detected:false, early:false, correct:false, misclicks:0, selected:null };
  elapsed = calm || textMode ? scene.cueMs + scene.motionMs*.5 : 0;
  lastAttempt = -Infinity; phase = 'observing'; cursor = {x:400,y:280};
  $('gr-count').textContent = `Szene ${index+1} von ${scenes.length}`;
  $('gr-scene-title').textContent = scene.title;
  $('gr-context').textContent = scene.intro;
  $('gr-mode').textContent = textMode ? 'Textalternative · ohne Zeitdruck' : calm ? 'Radar · ohne Zeitdruck' : 'Radar · beobachten und entscheiden';
  $('gr-progress').value = index;
  $('gr-instruction').textContent = 'Tippe auf die Stelle, die gefährlich werden könnte.';
  stage.dataset.paused = 'false'; stage.dataset.locked = 'false'; stage.tabIndex = 0;
  stage.innerHTML = illustration(scene); stage.hidden = textMode;
  $('gr-pause').hidden = calm || textMode; $('gr-pause').disabled = false; $('gr-pause').textContent = 'Pause';
  $('gr-time').hidden = calm || textMode; $('gr-time').value = 1;
  $('gr-instruction').hidden = textMode;
  panel.className = 'gr-panel gr-wait-panel';
  panel.innerHTML = '<div class="gr-wait-icon" aria-hidden="true">◎</div><h2>Was könnte passieren?</h2><p>Beobachte die ganze Szene. Tippe auf einen möglichen Gefahrenbereich, sobald du ihn erkennst.</p><p class="gr-small">Die Szene pausiert nach einem Treffer. Dann zählt deine Entscheidung.</p>';
  if (calm && !textMode) panel.innerHTML += '<button type="button" class="gr-button" id="gr-show">Gefahr zeigen</button>';
  $('gr-show')?.addEventListener('click',() => ask(false));
  // The untimed reveal option must remain reachable on small screens as well.
  if (calm) panel.classList.remove('gr-wait-panel');
  paint(stage,scene,elapsed); announce(calm ? 'Ohne Zeitdruck: Suche in Ruhe nach einer möglichen Gefahr.' : 'Beobachte die Szene.');
  updatePoints(); focus('gr-scene-title'); $('game').scrollIntoView({block:'start',behavior:'instant'});
  if (textMode) ask(false);
  else if (!calm) frame = requestAnimationFrame(tick);
}
function tick(now) {
  if (phase !== 'observing' || calm || textMode) return;
  if (lastTick) elapsed += now-lastTick;
  lastTick = now;
  if (elapsed >= scene.durationMs) { elapsed = scene.durationMs-1; ask(false); return; }
  paint(stage,scene,elapsed);
  $('gr-time').value = Math.max(0,1-elapsed/scene.durationMs);
  frame = requestAnimationFrame(tick);
}
function attempt(x,y) {
  if (phase !== 'observing' || textMode) return;
  const now = performance.now();
  // Count accepted taps only; all attempts during the cooldown are ignored.
  if (now-lastAttempt < RULES.cooldownMs) return;
  lastAttempt = now;
  if (isHit(scene,elapsed,x,y,stage.getBoundingClientRect().width)) {
    record.detected = true;
    record.early = !calm && elapsed-scene.cueMs <= RULES.earlyMs;
    ask(true);
  } else {
    record.misclicks++;
    announce(record.misclicks <= RULES.maxPenalty ? `Hier ist gerade kein relevanter Hinweis. −1 Punkt (${Math.min(record.misclicks,RULES.maxPenalty)}/${RULES.maxPenalty} Abzüge). Schau weiter.` : 'Schau in Ruhe weiter. Das Abzugslimit dieser Szene ist erreicht.');
    updatePoints();
  }
}
function ask(detected) {
  if (phase !== 'observing') return;
  phase = 'question'; stopClock(); clearCursor();
  stage.dataset.locked = 'true'; stage.tabIndex = -1;
  $('gr-pause').disabled = true; $('gr-time').hidden = true;
  paint(stage,scene,elapsed,true);
  panel.className = 'gr-panel';
  const heading = textMode ? 'Situation lesen, Entscheidung treffen' : detected ? (record.early ? 'Früh erkannt · +8 Erkennungspunkte' : 'Gefahr erkannt · +6 Erkennungspunkte') : 'Gefahr übersehen · jetzt dazulernen';
  $('gr-instruction').textContent = detected ? 'Gefahr erkannt. Die Szene ist angehalten.' : 'Die Markierung zeigt dir den Gefahrenbereich.';
  panel.innerHTML = `<span class="gr-feedback-heading">${heading}</span>${textMode?`<p class="gr-text-scene">${escape(scene.description)}</p>`:''}<h2 id="gr-question" tabindex="-1">${escape(scene.question)}</h2><div class="gr-answer-list">${scene.options.map(option=>`<button type="button" class="gr-button gr-answer" data-answer="${option.id}">${escape(option.text)}</button>`).join('')}</div><p class="gr-small">Eine Antwort passt. Nimm dir Zeit.</p>`;
  panel.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>answer(button.dataset.answer)));
  updatePoints(); announce(textMode ? 'Lies die beschriebene Situation und wähle eine Antwort.' : `${detected?'Gefahr erkannt.':'Gefahr übersehen.'} Wähle jetzt deine Reaktion.`);
  focus('gr-question'); panel.scrollIntoView({block:'nearest',behavior:'instant'});
}
function answer(id) {
  if (phase !== 'question') return;
  const choice = scene.options.find(item=>item.id===id);
  if (!choice) return;
  phase = 'feedback'; record.selected=id; record.correct=choice.correct;
  const correct = scene.options.find(item=>item.correct);
  panel.innerHTML = `<span class="gr-feedback-heading">${choice.correct?'✓ Passend entschieden · +12 Punkte':'↗ Diese Entscheidung wäre riskant'}</span><h2 id="gr-feedback-title" tabindex="-1">${choice.correct?'Vorausschauend gehandelt.':'Das nimmst du mit.'}</h2>${!choice.correct?`<p><strong>Passende Reaktion:</strong> ${escape(correct.text)}</p>`:''}<p>${escape(scene.feedback)}</p><p class="gr-principle">${escape(scene.principle)}</p><div class="gr-feedback-points">${scoreScene(record)} / ${textMode?12:calm?18:20} Punkte</div><p class="gr-small">${textMode?'Entscheidung':`${record.detected?6:0} Erkennung + ${record.early?2:0} Frühbonus + ${record.correct?12:0} Entscheidung − ${Math.min(record.misclicks,RULES.maxPenalty)} Fehlklicks (mindestens 0 Punkte)`}</p><a class="gr-source" href="${scene.source.url}" target="_blank" rel="noopener noreferrer">Grundlage: ${escape(scene.source.label)} ↗</a><button type="button" class="gr-button gr-primary" id="gr-next">${index===scenes.length-1?'Auswertung ansehen':'Nächste Szene →'}</button>`;
  $('gr-next').addEventListener('click',()=>{
    if(phase!=='feedback') return;
    records.push({...record}); record=null; index++;
    if(index===scenes.length) finish(); else nextScene();
  });
  updatePoints(); focus('gr-feedback-title');
}
function finish() {
  stopClock(); phase='result'; $('gr-round').hidden=true; $('gr-result').hidden=false;
  const result=summarize(records);
  const badge=textMode ? (result.correct>=5?BADGES[0]:result.correct>=4?BADGES[1]:result.correct>=3?BADGES[2]:null) : result.badge;
  const max=textMode?60:calm?90:100;
  $('gr-result').innerHTML=`<p class="gr-kicker">Deine Runde · ${textMode?'Textalternative':calm?'Radar ohne Zeitdruck':'Gefahrenradar'}</p><h1 id="gr-result-title" tabindex="-1">${badge?'Gut hingeschaut. Weitergedacht.':'Jede Runde schärft deinen Blick.'}</h1><div class="gr-result-score">${result.points}<span> / ${max} Punkte</span></div>${badge?`<div class="gr-badge">◎ ${badge.name}${textMode?' · Textmodus':''}</div>`:'<p>Das nächste Abzeichen wartet. Schau dir die Erklärungen an und probiere es erneut.</p>'}<div class="gr-result-grid"><div><strong>${textMode?'—':result.detected+'/5'}</strong><span>Gefahren erkannt</span></div><div><strong>${result.correct}/5</strong><span>passend entschieden</span></div><div><strong>${textMode?'—':result.missed}</strong><span>Gefahren verpasst</span></div><div><strong>${result.penalty}</strong><span>Fehlklick-Abzüge</span></div></div><p class="gr-small">${textMode?'Die visuelle Gefahrensuche wurde nicht bewertet.':`Früh erkannt: ${result.early} von 5. ${calm?'In diesem Modus gibt es keinen Frühbonus.':''}`} Die nächste Runde bringt andere Situationen. Die Auswahl merkt sich gespielte Szenen bis zum Neuladen dieser Seite.</p><div class="gr-result-actions"><button type="button" class="gr-button gr-primary" id="gr-again">Erneut spielen</button><button type="button" class="gr-button" id="gr-settings-back">Modus ändern</button><a class="gr-button" href="/lernwelt/">Zur Lernwelt</a></div><div class="gr-review"><h2>Deine fünf Situationen</h2>${records.map(item=>{const original=SCENES.find(s=>s.id===item.id);return `<details class="gr-review-item"><summary>${escape(original.title)} · ${scoreScene(item)} Punkte · ${item.correct?'✓ passend entschieden':'↗ noch einmal ansehen'}</summary><small>${textMode?'Textalternative':item.detected?'Gefahr erkannt':'Gefahr übersehen'}</small><p><strong>Passende Reaktion:</strong> ${escape(original.options.find(o=>o.correct).text)}</p><p>${escape(original.feedback)}</p><a class="gr-source" href="${original.source.url}" target="_blank" rel="noopener noreferrer">${escape(original.source.label)} ↗</a></details>`;}).join('')}</div>`;
  $('gr-again').addEventListener('click',start); $('gr-settings-back').addEventListener('click',home);
  focus('gr-result-title'); $('game').scrollIntoView({block:'start',behavior:'instant'});
}
function home() {
  stopClock(); phase='start'; records=[]; record=null;
  $('gr-round').hidden=true; $('gr-result').hidden=true; $('gr-start').hidden=false;
  focus('gr-play'); $('game').scrollIntoView({block:'start',behavior:'instant'});
}
function pause() {
  if (phase!=='observing' || calm || textMode) return;
  phase='paused'; stopClock(); clearCursor(); stage.dataset.paused='true';
  $('gr-pause').textContent='Fortsetzen'; announce('Pausiert. Mit „Fortsetzen“ geht es weiter.');
}
$('gr-pause').addEventListener('click',()=>{
  if(phase==='paused') { phase='observing';stage.dataset.paused='false';$('gr-pause').textContent='Pause';announce('Beobachte die Szene.'); frame=requestAnimationFrame(tick); }
  else pause();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden) pause();});
window.addEventListener('pagehide',stopClock);
window.addEventListener('pageshow',event=>{if(event.persisted && phase==='observing' && !calm && !textMode) pause();});
stage.addEventListener('click',event=>{
  if (event.detail===0 || phase!=='observing') return;
  clearCursor(); const rect=stage.getBoundingClientRect();
  attempt((event.clientX-rect.left)/rect.width*800,(event.clientY-rect.top)/rect.height*560);
});
stage.addEventListener('keydown',event=>{
  if(phase!=='observing') return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
    event.preventDefault(); const distance=event.shiftKey?50:25;
    cursor.x=Math.max(25,Math.min(775,cursor.x+(event.key==='ArrowRight'?distance:event.key==='ArrowLeft'?-distance:0)));
    cursor.y=Math.max(25,Math.min(480,cursor.y+(event.key==='ArrowDown'?distance:event.key==='ArrowUp'?-distance:0)));
    drawCursor();
  } else if(event.key==='Enter'||event.key===' ') {event.preventDefault();drawCursor();attempt(cursor.x,cursor.y);}
});
stage.addEventListener('focus',()=>{if(phase==='observing' && stage.matches(':focus-visible')) drawCursor();});
stage.addEventListener('blur',clearCursor);
$('gr-play').addEventListener('click',start); $('gr-exit').addEventListener('click',home);
$('gr-calm').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
$('gr-preview').innerHTML=illustration(SCENES[0],'preview');
paint($('gr-preview'),SCENES[0],SCENES[0].cueMs+3200);
$('gr-play').disabled=false; $('gr-play').textContent='Gefahrenradar starten →';
