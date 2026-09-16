(() => {
  let installPrompt;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const refresh = () => {
    document.documentElement.classList.toggle('is-standalone', standalone());
    document.querySelectorAll('[data-app-entry]').forEach(el => el.hidden = standalone());
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
