(() => {
  const THEME_KEY = 'laneswitch-theme-v1';
  const INSTAGRAM_URL = 'https://www.instagram.com/laneswitch.de?igsi=MW53eTZrdzY0cmY2YQ==';
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

  const getSiteRoot = () => {
    const script = document.currentScript || [...document.scripts].find((item) => /\/assets\/theme\.js/.test(item.src));
    return script && script.src ? new URL('../', script.src) : new URL('/', window.location.href);
  };

  const ensureHeaderActions = () => {
    const header = document.querySelector('.site-header');
    const inner = header && header.querySelector('.header-inner');
    if (!inner) return null;

    const cta = inner.querySelector('.header-cta');
    let actions = cta ? cta.closest('.global-header-actions') : inner.querySelector('.global-header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'global-header-actions';
      if (cta) {
        cta.before(actions);
        actions.append(cta);
      } else {
        inner.append(actions);
      }
    }
    return { header, inner, actions };
  };

  const createInstagramLink = (className, label = 'Instagram') => {
    const link = document.createElement('a');
    link.className = className;
    link.href = INSTAGRAM_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'LANE SWITCH auf Instagram öffnen');
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none"></circle></svg><span>' + label + '</span>';
    return link;
  };

  const normalizePrimaryNavigation = () => {
    const parts = ensureHeaderActions();
    if (!parts) return;

    const siteRoot = getSiteRoot();
    const currentPath = (window.location.pathname.replace(/\/+$/, '') || '/');
    const navItems = [
      ['fahrschulen/', 'Für Fahrschulen'],
      ['fahrschueler/', 'Für Fahrschüler:innen'],
      ['cockpit/', 'Cockpit']
    ];
    const serviceGroups = [
      {
        title: 'Für Fahrschulen',
        links: [
          ['fahrschul-check/', '5-Minuten-Check', 'Betrieb kompakt einordnen'],
          ['notfallcenter/', 'Notfallcenter', 'Im Ernstfall strukturiert handeln'],
          ['vorlagen/', 'Vorlagen', 'Praktische Arbeitsmaterialien']
        ]
      },
      {
        title: 'Für Fahrschüler:innen',
        links: [
          ['fahrzeugkosten/', 'Fahrzeugkosten-Rechner', 'Monatliche Autokosten einschätzen'],
          ['lernwelt/', 'Lernwelt Klasse B', 'Wissen üben und festigen']
        ]
      }
    ];

    parts.inner.querySelectorAll('nav.desktop-nav, nav.main-nav, nav.nav, nav.unified-mobile-nav, nav.unified-primary-nav').forEach((nav) => nav.remove());
    parts.inner.querySelectorAll('.global-services-panel').forEach((panel) => panel.remove());

    const nav = document.createElement('nav');
    nav.className = 'unified-primary-nav';
    nav.setAttribute('aria-label', 'Hauptnavigation');

    navItems.forEach(([path, label]) => {
      const link = document.createElement('a');
      const url = new URL(path, siteRoot);
      const targetPath = url.pathname.replace(/\/+$/, '') || '/';
      link.className = 'unified-primary-link';
      link.href = url.href;
      link.textContent = label;
      if (currentPath === targetPath) link.setAttribute('aria-current', 'page');
      nav.append(link);
    });

    const servicesButton = document.createElement('button');
    servicesButton.className = 'unified-services-trigger';
    servicesButton.type = 'button';
    servicesButton.setAttribute('aria-haspopup', 'true');
    servicesButton.setAttribute('aria-expanded', 'false');
    servicesButton.setAttribute('aria-controls', 'global-services-panel');
    servicesButton.innerHTML = '<span>Services</span><svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1.5 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    nav.append(servicesButton);

    const recommendSource = document.querySelector('.header-recommend[data-recommend-open], [data-recommend-open]');
    if (recommendSource) {
      const recommend = document.createElement('button');
      recommend.className = 'unified-mobile-recommend';
      recommend.type = 'button';
      recommend.textContent = 'Empfehlen';
      recommend.setAttribute('aria-haspopup', 'dialog');
      recommend.addEventListener('click', () => recommendSource.click());
      nav.append(recommend);
    }
    nav.append(createInstagramLink('unified-mobile-instagram', 'Instagram ↗'));

    const panel = document.createElement('div');
    panel.className = 'global-services-panel';
    panel.id = 'global-services-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Services');

    serviceGroups.forEach((group) => {
      const section = document.createElement('section');
      const heading = document.createElement('h2');
      heading.textContent = group.title;
      section.append(heading);

      group.links.forEach(([path, label, description]) => {
        const link = document.createElement('a');
        const url = new URL(path, siteRoot);
        const targetPath = url.pathname.replace(/\/+$/, '') || '/';
        link.href = url.href;
        link.innerHTML = '<strong>' + label + '</strong><span>' + description + '</span>';
        if (currentPath === targetPath) {
          link.setAttribute('aria-current', 'page');
          servicesButton.classList.add('is-current');
        }
        section.append(link);
      });
      panel.append(section);
    });

    const setOpen = (open) => {
      panel.hidden = !open;
      servicesButton.setAttribute('aria-expanded', String(open));
      parts.header.classList.toggle('services-open', open);
    };

    servicesButton.addEventListener('click', (event) => {
      event.stopPropagation();
      setOpen(panel.hidden);
    });
    panel.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        servicesButton.focus();
      }
    });

    parts.inner.insertBefore(nav, parts.actions);
    parts.inner.append(panel);

    const cta = parts.actions.querySelector('.header-cta');
    if (cta) {
      cta.href = new URL('kontakt/', siteRoot).href;
      cta.textContent = '20 Minuten kennenlernen';
    }

    if (/\/cockpit\/?$/.test(window.location.pathname)) document.body.classList.add('page-cockpit');
  };

  const addInstagramLinks = () => {
    const parts = ensureHeaderActions();
    if (parts && !parts.actions.querySelector('.instagram-header-link')) {
      const link = createInstagramLink('instagram-header-link');
      parts.actions.insertBefore(link, parts.actions.firstChild);
    }

    document.querySelectorAll('.footer-links').forEach((footer) => {
      if (!footer.querySelector('.footer-instagram-link')) footer.append(createInstagramLink('footer-instagram-link', 'Instagram ↗'));
    });
  };

  const initializeToggle = () => {
    const parts = ensureHeaderActions();
    if (!parts || parts.actions.querySelector('.theme-toggle')) return;

    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';
    button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span>';
    parts.actions.append(button);

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

  const initializeScrollHeader = () => {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastY = Math.max(window.scrollY, 0);
    let direction = 'none';
    let directionStartY = lastY;
    let ticking = false;
    const show = () => header.classList.remove('is-scroll-hidden');
    const update = () => {
      const currentY = Math.max(window.scrollY, 0);
      const threshold = header.offsetHeight;

      if (currentY <= threshold) {
        show();
        direction = 'none';
        directionStartY = currentY;
      } else if (currentY > lastY) {
        if (direction !== 'down') {
          direction = 'down';
          directionStartY = lastY;
        }
        if (currentY - directionStartY >= 8) header.classList.add('is-scroll-hidden');
      } else if (currentY < lastY) {
        if (direction !== 'up') {
          direction = 'up';
          directionStartY = lastY;
        }
        if (directionStartY - currentY >= 6) show();
      }

      lastY = currentY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', show, { passive: true });
    header.addEventListener('focusin', show);
  };

  const initialize = () => {
    removeLegacyExportArtifacts();
    normalizePrimaryNavigation();
    addInstagramLinks();
    initializeToggle();
    initializeScrollHeader();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
