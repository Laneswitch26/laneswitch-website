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

  const removeLegacyExportArtifacts = () => {
    document.querySelectorAll('iframe[srcdoc][sandbox]').forEach((frame) => {
      const tiny = Number(frame.getAttribute('width')) <= 1 || Number(frame.getAttribute('height')) <= 1;
      const hidden = (frame.getAttribute('style') || '').includes('visibility:hidden');
      if (tiny || hidden) frame.remove();
    });

    const comments = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
    const obsolete = [];
    while (comments.nextNode()) {
      if (/Page saved with SingleFile|saved date:/i.test(comments.currentNode.nodeValue || '')) obsolete.push(comments.currentNode);
    }
    obsolete.forEach((node) => node.remove());

    const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const malformed = [];
    while (textNodes.nextNode()) {
      const value = (textNodes.currentNode.nodeValue || '').trim();
      if (value === '\\n' || value === '/n') malformed.push(textNodes.currentNode);
    }
    malformed.forEach((node) => node.remove());
  };

  const createMobileNavigation = () => {
    const header = document.querySelector('.site-header');
    const inner = header && header.querySelector('.header-inner');
    if (!inner || inner.querySelector('.unified-mobile-nav')) return;

    const script = document.currentScript || [...document.scripts].find((item) => /\/assets\/theme\.js/.test(item.src));
    const siteRoot = script && script.src ? new URL('../', script.src) : new URL('/', window.location.href);
    const items = [
      ['fahrschulen/', 'Für Fahrschulen'],
      ['fahrschueler/', 'Für Fahrschüler:innen'],
      ['cockpit/', 'Cockpit'],
      ['kontakt/', 'Kontakt']
    ];
    const nav = document.createElement('nav');
    nav.className = 'unified-mobile-nav';
    nav.setAttribute('aria-label', 'Bereichsnavigation');
    const currentPath = window.location.pathname.replace(/\/+$/, '/') || '/';

    items.forEach(([path, label]) => {
      const link = document.createElement('a');
      const url = new URL(path, siteRoot);
      link.href = url.href;
      link.textContent = label;
      if (currentPath === url.pathname.replace(/\/+$/, '/')) link.setAttribute('aria-current', 'page');
      nav.append(link);
    });
    inner.append(nav);
  };

  const initializeToggle = () => {
    const header = document.querySelector('.site-header');
    const headerInner = header && header.querySelector('.header-inner');
    if (!headerInner) return;

    const cta = headerInner.querySelector('.header-cta');
    let actions = cta ? cta.closest('.global-header-actions') : headerInner.querySelector('.global-header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'global-header-actions';
      if (cta) {
        cta.before(actions);
        actions.append(cta);
      } else {
        headerInner.append(actions);
      }
    }
    if (actions.querySelector('.theme-toggle')) return;

    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';
    button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span>';
    actions.append(button);

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

  const initialize = () => {
    removeLegacyExportArtifacts();
    createMobileNavigation();
    initializeToggle();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
