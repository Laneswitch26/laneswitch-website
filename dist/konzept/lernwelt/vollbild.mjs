// Lernwelt · Fokus- und Vollbildmodus für den Fragentrainer.
// Sobald eine Lernrunde startet, füllt der Trainer den ganzen Bildschirm (ohne Kopfzeile, Menü und Seitentext).
// Wo der Browser es erlaubt, wird zusätzlich echtes Vollbild angefordert. Zurück-Taste und "Beenden" verlassen den Modus.
const root = document.documentElement;
const trainer = document.getElementById('trainer');
const leaveButton = document.getElementById('leave');
if (trainer && leaveButton) {
  const fullscreenSupported = Boolean(root.requestFullscreen && document.fullscreenEnabled);
  const icon = d => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  const EXPAND = icon('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'), SHRINK = icon('M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5'), CLOSE = icon('M6 6l12 12M18 6 6 18');

  const bar = document.createElement('div');
  bar.className = 'lw-focusbar';
  bar.innerHTML = `<button type="button" class="lw-focus-btn" data-focus-exit>${CLOSE}<span>Beenden</span></button><button type="button" class="lw-focus-btn" data-focus-full aria-pressed="false" ${fullscreenSupported ? '' : 'hidden'}>${EXPAND}<span>Vollbild</span></button>`;
  trainer.prepend(bar);
  const fullButton = bar.querySelector('[data-focus-full]');

  let focused = false, ownHistory = false, closing = false;

  const examRunning = () => document.getElementById('modeEyebrow')?.textContent === 'Prüfungssimulation'
    && document.getElementById('questionArea')?.style.display !== 'none'
    && !document.getElementById('result')?.classList.contains('active')
    && !/^Frage 1 von/.test(document.getElementById('questionCounter')?.textContent || '');
  const confirmLeave = () => !examRunning() || window.confirm('Prüfungssimulation wirklich beenden? Die Antworten dieser Runde werden nicht ausgewertet.');

  function updateFull() {
    const active = Boolean(document.fullscreenElement);
    fullButton.innerHTML = `${active ? SHRINK : EXPAND}<span>${active ? 'Vollbild beenden' : 'Vollbild'}</span>`;
    fullButton.setAttribute('aria-pressed', String(active));
  }
  async function enterFull() { if (fullscreenSupported && !document.fullscreenElement) { try { await root.requestFullscreen({ navigationUI: 'hide' }); } catch {} } }
  async function exitFull() { if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} } }

  function enter() {
    if (focused) return;
    focused = true;
    root.classList.add('lw-focus');
    trainer.setAttribute('role', 'dialog');
    trainer.setAttribute('aria-modal', 'true');
    trainer.scrollTop = 0;
    try { history.pushState({ lwFocus: true }, ''); ownHistory = true; } catch { ownHistory = false; }
    bar.querySelector('[data-focus-exit]').focus({ preventScroll: true });
  }
  function exit() {
    if (!focused) return;
    focused = false;
    root.classList.remove('lw-focus');
    trainer.removeAttribute('role');
    trainer.removeAttribute('aria-modal');
    exitFull();
    if (ownHistory && !closing) { ownHistory = false; try { history.back(); } catch {} }
    ownHistory = false;
  }

  // Trainer öffnet oder schließt sich über die Klasse "active" (bestehende Lernlogik bleibt unverändert).
  new MutationObserver(() => { trainer.classList.contains('active') ? enter() : exit(); }).observe(trainer, { attributes: true, attributeFilter: ['class'] });
  // Neue Frage oder Auswertung: wieder oben beginnen.
  const toTop = () => { if (focused) trainer.scrollTo({ top: 0 }); };
  for (const id of ['questionCounter', 'result', 'topicPicker']) {
    const el = document.getElementById(id);
    if (el) new MutationObserver(toTop).observe(el, { childList: true, characterData: true, subtree: true, attributes: id !== 'questionCounter', attributeFilter: id !== 'questionCounter' ? ['class'] : undefined });
  }

  // Start einer Runde ist eine Nutzeraktion: Dort darf echtes Vollbild angefordert werden.
  document.addEventListener('click', event => { if (event.target.closest('[data-mode],[data-topic]')) enterFull(); }, true);

  bar.querySelector('[data-focus-exit]').addEventListener('click', () => { if (confirmLeave()) leaveButton.click(); });
  // Der bisherige Knopf "Zur Übersicht" fragt bei laufender Prüfung ebenfalls nach.
  leaveButton.addEventListener('click', event => { if (!event.isTrusted) return; if (!confirmLeave()) { event.stopImmediatePropagation(); event.preventDefault(); } }, true);
  fullButton.addEventListener('click', () => (document.fullscreenElement ? exitFull() : enterFull()));
  document.addEventListener('fullscreenchange', updateFull);

  // Zurück-Taste (Android, Browser) beendet den Fokusmodus statt die Seite zu verlassen.
  window.addEventListener('popstate', () => {
    if (!focused || !ownHistory) return;
    ownHistory = false;
    if (!confirmLeave()) { try { history.pushState({ lwFocus: true }, ''); ownHistory = true; } catch {} return; }
    closing = true; leaveButton.click(); closing = false;
  });
  updateFull();
}
