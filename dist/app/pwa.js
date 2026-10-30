(() => {
  let installPrompt;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // Hinweis "LANE SWITCH als App" lässt sich im Browser ausblenden (nur auf diesem Gerät gespeichert).
  const DISMISS = 'ls-app-entry-v1';
  const dismissed = () => { try { return localStorage.getItem(DISMISS) === 'hidden'; } catch { return false; } };
  const decorate = () => document.querySelectorAll('[data-app-entry]').forEach(el => {
    if (el.parentElement?.classList.contains('app-entry-wrap')) return;
    const wrap = document.createElement('div'); wrap.className = 'app-entry-wrap';
    el.before(wrap); wrap.append(el);
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'app-entry-close'; close.setAttribute('aria-label', 'Hinweis zur App ausblenden');
    close.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    close.addEventListener('click', () => { try { localStorage.setItem(DISMISS, 'hidden'); } catch {} refresh(); });
    wrap.append(close);
  });
  const refresh = () => {
    document.documentElement.classList.toggle('is-standalone', standalone());
    document.querySelectorAll('[data-app-entry]').forEach(el => { const hide = standalone() || dismissed(); el.hidden = hide; const wrap = el.closest?.('.app-entry-wrap'); if (wrap) wrap.hidden = hide; });
    const button = document.querySelector('[data-install]');
    const status = document.querySelector('[data-install-status]');
    if (button) button.hidden = standalone() || !installPrompt;
    if (status && standalone()) status.textContent = 'Du nutzt LANE SWITCH bereits im App-Fenster.';
  };
  window.addEventListener('beforeinstallprompt', event => {
    if(location.hostname !== 'laneswitch.online' && location.hostname !== 'localhost') return;
    event.preventDefault(); installPrompt = event; refresh();
  });
  window.addEventListener('appinstalled', () => { installPrompt = null; refresh();
    const status = document.querySelector('[data-install-status]');
    if(status) status.textContent = 'Installiert. Du kannst LANE SWITCH jetzt über das App-Icon öffnen.';
  });
  const init = () => {
    try { decorate(); } catch {} // Schließen-Knopf ist Komfort; die Installationslogik läuft auch ohne
    refresh();
    const button = document.querySelector('[data-install]');
    if(button) button.addEventListener('click', async () => {
      const prompt = installPrompt; if(!prompt) return;
      installPrompt = null; button.disabled = true;
      try { await prompt.prompt(); await prompt.userChoice; }
      catch { document.querySelector('[data-install-status]').textContent = 'Bitte nutze die Anleitung für deinen Browser weiter unten.'; }
      finally { button.disabled = false; refresh(); }
    });
    if(location.hostname !== 'laneswitch.online' && location.hostname !== 'localhost') {
      const hint = document.querySelector('[data-canonical-install]');
      if(hint) hint.hidden = false;
    }
    if('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js', {scope:'/',updateViaCache:'none'}).catch(() => {});
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  matchMedia('(display-mode: standalone)').addEventListener?.('change', refresh);
})();
