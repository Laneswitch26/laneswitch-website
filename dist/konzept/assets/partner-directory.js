/* Ergänzt die Fahrschul-Übersicht um registrierte, von LANE SWITCH freigegebene Partnerfahrschulen.
   Quelle: öffentliche Verzeichnis-API des Navigators. Keine Cookies, kein Tracking. */
(() => {
  const list = document.querySelector(".partner-directory");
  if (!list) return;
  const origin = location.hostname === "laneswitch.online" ? "" : "https://laneswitch.online";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  fetch(origin + "/api/navigator?action=directory", { credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: controller.signal })
    .then(r => (r.ok ? r.json() : null))
    .then(result => {
      if (!result || !Array.isArray(result.schools)) return;
      for (const s of result.schools) {
        if (!s || typeof s.school !== "string" || !/^[a-z0-9-]{2,40}$/.test(s.school) || typeof s.name !== "string" || !s.name.trim()) continue;
        const card = el("article", "partner-card partner-card-registered");
        const place = typeof s.address === "string" ? (s.address.match(/\d{5}\s+([^,·(]+)/) || [])[1] : "";
        card.append(el("p", "partner-kicker", "Partnerfahrschule" + (place ? " · " + place.trim() : "")));
        // Übersicht bewusst ohne Logos (einheitlich nur Namen); Logos erscheinen auf den Profilseiten.
        card.append(el("h2", "", s.name.trim().slice(0, 120)));
        if (typeof s.tagline === "string" && s.tagline.trim()) card.append(el("p", "", s.tagline.trim().slice(0, 180)));
        const classes = typeof s.classes === "string" ? s.classes.split(/[,;]/).map(x => x.trim()).filter(Boolean).slice(0, 8) : [];
        if (classes.length) { const tags = el("ul", "partner-tags"); tags.setAttribute("aria-label", "Führerscheinklassen"); for (const c of classes) tags.append(el("li", "", c.slice(0, 30))); card.append(tags); }
        const link = el("a", "partner-button primary", s.name.trim().slice(0, 80) + " kennenlernen");
        link.href = origin + "/navigator/" + s.school;
        card.append(link);
        list.append(card);
      }
    })
    .catch(() => {})
    .finally(() => clearTimeout(timeout));
})();
