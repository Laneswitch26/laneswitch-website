(() => {
  const THEME_KEY = 'laneswitch-theme-v1';
  const INSTAGRAM_URL = 'https://www.instagram.com/laneswitch.de?igsi=MW53eTZrdzY0cmY2YQ==';
  const root = document.documentElement;
  const storage = {
    read(key) { try { return window.localStorage.getItem(key); } catch (_) { return null; } },
    write(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
  };

  const saved = storage.read(THEME_KEY);
  root.dataset.theme = saved === 'dark' || saved === 'light' ? saved : 'light';

  let openRecommendation = () => {};

  const getSiteRoot = () => {
    const script = document.currentScript || [...document.scripts].find((item) => /\/assets\/theme\.js/.test(item.src));
    return script && script.src ? new URL('../', script.src) : new URL('/', window.location.href);
  };

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

  const initializeRecommendation = () => {
    const existingDialog = document.querySelector('#recommend-dialog');
    const existingSource = document.querySelector('.header-recommend[data-recommend-open], .recommend-entry-button[data-recommend-open], [data-recommend-open]');

    if (existingDialog && existingSource) {
      openRecommendation = () => existingSource.click();
      return;
    }

    const siteRoot = getSiteRoot();
    const dialog = document.createElement('dialog');
    dialog.className = 'recommend-dialog global-recommend-dialog';
    dialog.id = 'global-recommend-dialog';
    dialog.setAttribute('aria-labelledby', 'global-recommend-title');
    dialog.innerHTML =
      '<div class="recommend-dialog-inner">' +
        '<button class="recommend-close" type="button" data-global-recommend-close aria-label="Fenster schließen">×</button>' +
        '<p class="eyebrow">Mehrwert weitergeben</p>' +
        '<h2 id="global-recommend-title">Wem möchten Sie LANE SWITCH empfehlen?</h2>' +
        '<p class="dialog-lead">Wählen Sie die Zielgruppe. Der passende Link und ein fertiger Text werden automatisch vorbereitet.</p>' +
        '<div class="recommend-targets" role="group" aria-label="Zielgruppe auswählen">' +
          '<button class="recommend-target" type="button" data-global-recommend-target="learner" aria-pressed="true">Fahrschüler:in<small>Lernwelt, Fahrzeugkosten und Orientierung</small></button>' +
          '<button class="recommend-target" type="button" data-global-recommend-target="school" aria-pressed="false">Fahrschule<small>Kooperationskonzept und betriebliche Mehrwerte</small></button>' +
        '</div>' +
        '<p class="recommend-preview" data-global-recommend-preview aria-live="polite"></p>' +
        '<div class="recommend-actions">' +
          '<button class="recommend-action recommend-action-primary" type="button" data-global-recommend-share>Teilen</button>' +
          '<a class="recommend-action" data-global-recommend-whatsapp target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="recommend-action" data-global-recommend-email>E-Mail</a>' +
          '<button class="recommend-action" type="button" data-global-recommend-copy>Link kopieren</button>' +
        '</div>' +
        '<p class="recommend-note">Es werden keine Kontaktdaten gespeichert und keine Cookies gesetzt. Erst die gewählte App übernimmt den Versand.</p>' +
      '</div>';
    document.body.append(dialog);

    const recommendations = {
      learner: {
        title: 'LANE SWITCH für Fahrschüler:innen',
        url: new URL('fahrschueler/', siteRoot).href,
        text: 'Hi, ich möchte dir LANE SWITCH empfehlen. Dort findest du verständliche Informationen und kostenlose Hilfen rund um den Führerschein, das erste Auto und den sicheren Start in die eigene Mobilität.'
      },
      school: {
        title: 'LANE SWITCH für Fahrschulen',
        url: new URL('fahrschulen/', siteRoot).href,
        text: 'Hallo, ich möchte Ihnen LANE SWITCH empfehlen. Es ist ein modulares Kooperationskonzept für Fahrschulen mit Versicherungscheck, Theoriebeitrag, Arbeitshilfen und Mehrwerten für Fahrschüler:innen.'
      }
    };

    let type = 'learner';
    const preview = dialog.querySelector('[data-global-recommend-preview]');
    const targets = [...dialog.querySelectorAll('[data-global-recommend-target]')];
    const whatsapp = dialog.querySelector('[data-global-recommend-whatsapp]');
    const email = dialog.querySelector('[data-global-recommend-email]');
    const share = dialog.querySelector('[data-global-recommend-share]');
    const copy = dialog.querySelector('[data-global-recommend-copy]');

    const update = () => {
      const item = recommendations[type];
      preview.textContent = item.text + ' ' + item.url;
      whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(item.text + '\n\n' + item.url);
      email.href = 'mailto:?subject=' + encodeURIComponent(item.title) + '&body=' + encodeURIComponent(item.text + '\n\n' + item.url);
      targets.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.globalRecommendTarget === type)));
    };

    openRecommendation = () => {
      update();
      if (typeof dialog.showModal === 'function') dialog.showModal();
    };

    dialog.querySelector('[data-global-recommend-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    targets.forEach((button) => button.addEventListener('click', () => {
      type = button.dataset.globalRecommendTarget;
      update();
    }));
    share.addEventListener('click', async () => {
      const item = recommendations[type];
      if (navigator.share) {
        try {
          await navigator.share({ title: item.title, text: item.text, url: item.url });
        } catch (error) {
          if (error.name !== 'AbortError') console.warn(error);
        }
      } else {
        try {
          await navigator.clipboard.writeText(item.text + '\n\n' + item.url);
          share.textContent = 'Kopiert';
          window.setTimeout(() => { share.textContent = 'Teilen'; }, 1800);
        } catch (_) {
          share.textContent = 'Nicht verfügbar';
        }
      }
    });
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(recommendations[type].url);
        copy.textContent = 'Kopiert';
        window.setTimeout(() => { copy.textContent = 'Link kopieren'; }, 1800);
      } catch (_) {
        copy.textContent = 'Nicht verfügbar';
      }
    });
    update();
  };

  const getOrCreateHeader = () => {
    let header = document.querySelector('.site-header');
    if (!header) {
      header = document.createElement('header');
      document.body.insertBefore(header, document.body.firstChild);
    }
    header.className = 'site-header canonical-site-header';

    let inner = header.querySelector('.header-inner');
    if (!inner) {
      inner = document.createElement('div');
      header.append(inner);
    }
    inner.className = 'container header-inner canonical-header-inner';
    inner.replaceChildren();
    return { header, inner };
  };

  const buildCanonicalHeader = () => {
    const siteRoot = getSiteRoot();
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    document.body.classList.toggle('page-cockpit', /\/cockpit\/?$/.test(window.location.pathname));

    const { header, inner } = getOrCreateHeader();

    const brand = document.createElement('a');
    brand.className = 'brand canonical-brand';
    brand.href = siteRoot.href;
    brand.setAttribute('aria-label', 'LANE SWITCH Startseite');
    brand.innerHTML = '<img src="' + new URL('assets/logo-primary-dark.svg', siteRoot).href + '" alt="LANE SWITCH: Fahrschul-Partnerkonzept" width="1400" height="360">';

    const nav = document.createElement('nav');
    nav.className = 'unified-primary-nav';
    nav.setAttribute('aria-label', 'Hauptnavigation');

    const navItems = [
      ['fahrschulen/', 'Für Fahrschulen'],
      ['fahrschueler/', 'Für Fahrschüler:innen'],
      ['cockpit/', 'Cockpit']
    ];
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

    const mobileRecommend = document.createElement('button');
    mobileRecommend.className = 'unified-mobile-recommend';
    mobileRecommend.type = 'button';
    mobileRecommend.textContent = 'Empfehlen';
    mobileRecommend.setAttribute('aria-haspopup', 'dialog');
    mobileRecommend.addEventListener('click', openRecommendation);
    nav.append(mobileRecommend);
    nav.append(createInstagramLink('unified-mobile-instagram', 'Instagram'));

    const actions = document.createElement('div');
    actions.className = 'global-header-actions canonical-header-actions';

    const recommend = document.createElement('button');
    recommend.className = 'header-recommend canonical-recommend';
    recommend.type = 'button';
    recommend.textContent = 'Empfehlen';
    recommend.setAttribute('aria-haspopup', 'dialog');
    recommend.addEventListener('click', openRecommendation);

    const instagram = createInstagramLink('instagram-header-link', 'Instagram');

    const cta = document.createElement('a');
    cta.className = 'header-cta canonical-header-cta';
    cta.href = new URL('kontakt/', siteRoot).href;
    cta.textContent = '20 Minuten kennenlernen';

    actions.append(recommend, instagram, cta);

    const panel = document.createElement('div');
    panel.className = 'global-services-panel';
    panel.id = 'global-services-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Services');

    const groups = [
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

    groups.forEach((group) => {
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

    const setServicesOpen = (open) => {
      panel.hidden = !open;
      servicesButton.setAttribute('aria-expanded', String(open));
      header.classList.toggle('services-open', open);
    };
    servicesButton.addEventListener('click', (event) => {
      event.stopPropagation();
      setServicesOpen(panel.hidden);
    });
    panel.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', () => setServicesOpen(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        setServicesOpen(false);
        servicesButton.focus();
      }
    });

    inner.append(brand, nav, actions, panel);
  };

  const addPlainInstagramFooterLinks = () => {
    document.querySelectorAll('.footer-links').forEach((footer) => {
      const links = [...footer.querySelectorAll('.footer-instagram-link')];
      const link = links.shift() || document.createElement('a');
      links.forEach((duplicate) => duplicate.remove());
      link.className = 'footer-instagram-link';
      link.href = INSTAGRAM_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Instagram';
      link.setAttribute('aria-label', 'LANE SWITCH auf Instagram öffnen');
      if (!link.parentElement) footer.append(link);
    });
  };

  const initializeToggle = () => {
    const actions = document.querySelector('.canonical-header-actions');
    if (!actions) return;

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

      if (header.classList.contains('services-open') || currentY <= threshold) {
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
    initializeRecommendation();
    buildCanonicalHeader();
    addPlainInstagramFooterLinks();
    initializeToggle();
    initializeScrollHeader();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
