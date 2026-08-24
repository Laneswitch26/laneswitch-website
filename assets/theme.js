(() => {
  const THEME_KEY = 'laneswitch-theme-v1';
  const root = document.documentElement;
  const storage = {
    read(key) { try { return window.localStorage.getItem(key); } catch (_) { return null; } },
    write(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
  };

  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const saved = storage.read(THEME_KEY);
  const initial = saved === 'dark' || saved === 'light' ? saved : (media && media.matches ? 'dark' : 'light');
  root.dataset.theme = initial;

  const initializeToggle = () => {
    const header = document.querySelector('.header-inner');
    if (!header || header.querySelector('.theme-toggle')) return;

    const cta = header.querySelector('.header-cta');
    let actions = cta ? cta.closest('.global-header-actions') : null;
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'global-header-actions';
      if (cta) {
        cta.before(actions);
        actions.append(cta);
      } else {
        const menuButton = header.querySelector('.menu-toggle');
        header.insertBefore(actions, menuButton || null);
      }
    }

    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';
    button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span>';
    actions.prepend(button);

    const render = () => {
      const dark = root.dataset.theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren');
      button.title = dark ? 'Heller Modus' : 'Dunkler Modus';
      button.querySelector('.theme-toggle-icon').textContent = dark ? '☀' : '☾';
    };

    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      storage.write(THEME_KEY, root.dataset.theme);
      render();
    });
    render();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeToggle, { once: true });
  else initializeToggle();
})();
