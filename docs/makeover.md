# Makeover laneswitch.online (Stand 29.10.2026)

Auftrag des Eigentümers: komplettes gestalterisches Makeover von laneswitch.online.
Ziel: intuitiv bedienbar, am Handy und am Desktop gut, wirkt wie eine professionell
gestaltete Seite. Farben aus dem Corporate Design (Navy, Türkis) bleiben.
laneswitch.de bleibt die „klassische Rohfassung“ und wird nicht verändert.

Der Eigentümer hat erlaubt, Pull Requests nach erfolgreicher Prüfung und
Cloudflare-Vorschau selbst zu mergen. Danach immer den Live-Stand prüfen und
kurz berichten, was sich geändert hat.

## Erledigt

| PR | Inhalt |
| --- | --- |
| #47 | Werkzeuge nach Themen gruppiert, Cookie-Hinweis im Datenschutz präzisiert, CLAUDE.md |
| (dieser PR) | Abzeichen „LANE SWITCH Partnerfahrschule“ auf Netzwerk-Ansicht, Fahrschul-Übersicht und Partnerprofilen (passend zum Schaufenster-Sticker; bewusst nicht „zertifiziert/geprüft“) |
| #48 (main) | Navigator: Testkonto-Passwort nur noch als Secret `NAV_TEST_PASSWORD` |
| #49 | Neue Startseite (Hero, drei Einstiege, Aktuell, Fokus, Ansprechpartner, Beiträge) |
| #50, #52 | Porträt von Steven (`dist/konzept/assets/steven-portrait.jpg`, quadratisch, abgerundet) |
| #51 | Rebranding: neues Logo (Spurwechsel-Signet), Favicon, PWA-Icons |
| #59 | Startklar-Check (`#startklar`, Kurzadresse `/startklar/` für den QR-Code auf dem Fahrschul-Aushang) |
| #53 | Einheitlicher Kopfbereich für Werkzeuge, Netzwerk, Kontakt, Newsticker; Lernwelt-Lernstand im hellen Modus sichtbar |
| #55 | Lernwelt im neuen Design; gemeinsame Bausteine für Unterseiten in `konzept/assets/subpage.css` |
| #56 | Fahrzeugkosten im neuen Design (Schrittanzeige mit Beschriftung, Auswahlkacheln, Ergebnis, Anfrage-Dialog) |
| #57 | Unfallhelfer im neuen Design (Notrufnummern als Tipp-Kacheln, Checkliste mit großen Tippflächen) |
| #58 | EaSI Drive und Nach dem Führerschein im neuen Design; weitere Bausteine in `subpage.css` (v2) |
| #60 | Förderrechner Altersvorsorge im neuen Design (beide Zielgruppen; `calculator.css` neu, Rechenlogik unverändert) |
| #62 | Fahrschul-Seiten: Fahrschul-Check, Cockpit, Notfallcenter, Vorlagen (inkl. Druckansicht), Informationen für Fahrschulen; `subpage.css` v3 (FAQ, Kartenlabels, Kopf-Links) |
| #63 | Kooperationsseiten (Übersicht, Fahrschulen, A1, Emre) im neuen Design; `cooperations.css` und `a1.css` nur noch mit Theme-Variablen |
| #64 | Seitenleisten-Links (Instagram, Unfallhelfer, Impressum, Datenschutz) auf Unterseiten in Theme-Farben statt Browser-Blau (`shell.css` v7); Ortsschilder Fahrschul-Übersicht bündig |
| #65 | Gefahrenradar im neuen Design (`radar.css` ersetzt `game.css`/`immersive.css`; Textmodus ohne leere Spalte) |
| #66 | Impressum und Datenschutz optisch angeglichen (`legal.css`; nur `<head>` geändert, `<body>` byte-identisch; vom Eigentümer freigegeben) |

## Gestaltungssystem der App-Ansichten (`dist/app/app.css`, `app.js`)

- **Kopfbereich:** `pageHead(title, lead)` in `app.js` → `.page-head` (Navy-Fläche,
  dezentes Spurwechsel-Motiv `.hero-lanes`, weißer Titel, heller Lead).
  Startseite: größere Variante `.home-hero` mit Haupt- und Zweitaktion.
- **Abschnitte:** `.home-section` + `.home-head h2` (22 px, Satzschreibung, keine Versal-Labels).
- **Einstiegs-/Werkzeugliste:** `.home-paths` mit `.home-path` (Icon in Tint-Quadrat,
  Titel, Kurztext, Pfeil; bei Werkzeugen zusätzlich `.tool-action`).
- **Panels:** `.home-panel` (Karte, 14 px Radius). Hinweis-/Ansprechpartner-Fläche: `.home-person` (Tint).
- **Buttons:** `.primary` (Navy; auf Navy-Flächen `.primary.accent` mit Türkis), Textlink `.hero-secondary`.
- Labels in Satzschreibung (`.eyebrow` ist nicht mehr versal), keine dekorativen Nummern.
- Radien: Karten 14–16 px, Kopfbereiche 20 px (mobil 16 px). Keine Schatten auf Karten.
- Hell/Dunkel ausschließlich über die Variablen aus `dist/app/shell.css`.

## Bausteine für Unterseiten (`dist/konzept/assets/subpage.css`)

Seit der Lernwelt. Umgestaltete Unterseiten laden `concept.css` (Rahmen, Seitenleiste),
`shell.css`, `subpage.css`, dann ihre eigenen Seitenstile und zuletzt `contrast.css`.
`theme.css` (altes Design) wird auf umgestalteten Seiten nicht mehr geladen.

- Inhalt in `<div class="sp-page">` legen. Eigene Seitenklassen mit Präfix (z. B. `lw-`),
  damit alte Regeln aus `concept.css`/`contrast.css` (`.primary`, `.mode-card`, `.section` …) nicht greifen.
- `.sp-head` Kopfbereich (wie `.page-head`), `.sp-facts` Kennzahlen-Chips darin.
- `.sp-section` + `.sp-section-head h2/p`, `.sp-panel` Karte, `.sp-label` kleines Label.
- `.sp-rows` / `.sp-row` Einstiegsliste (Icon `.sp-row-icon`, `.sp-row-text`, `.sp-row-action`, Pfeil).
- Buttons `.sp-btn.sp-btn-primary` / `.sp-btn-secondary`, Textlink `.sp-link`, `.sp-pill`, Hinweisfläche `.sp-note`.
- Zustände richtig/falsch: `--sp-good(-bg)`, `--sp-bad(-bg)` (einzige Farbwerte außerhalb von shell.css, für hell und dunkel definiert).
- Breitenabhängiges Layout per `@container detail-content (...)` (der Inhaltsbereich ist der Container),
  diese Regeln nach den Grundregeln notieren.
- Vollbild-Dialoge außerhalb von `<main>` platzieren: `.detail-main` ist ein Container und würde `position:fixed` einfangen.
- Native `<dialog>` liegt in der obersten Ebene und kann innerhalb von `<main>` bleiben.
- Rechtstexte (Erstinformation, Vermittlerangaben, Datenschutzhinweise) wörtlich übernehmen, nur neu einbetten.
- Raster `.sp-grid.sp-grid-2/3` mit Karten `.sp-cards`, Hakenliste `.sp-checks`, Aktionen im Kopf `.sp-head-actions`, Kleingedrucktes `.sp-fine`, Abschlussfläche `.sp-cta`.
- FAQ `.sp-faq`, Kartenlabel `.sp-card-tag`, Textlink im Kopf `.sp-head-link`, Knopfreihe `.sp-actions`.
- Icons als Inline-SVG `class="icon"` im Strichstil von `app/shell.js`.

## Nächster Schritt: Unterseiten unter `dist/konzept/`

Diese Seiten haben noch ihr älteres eigenes Design (`konzept/assets/theme.css`,
`concept.css`, teils Inline-Styles, ursprünglich für dunkle Flächen gebaut).
Sie laden zusätzlich `/app/shell.css` und `/app/contrast.css`.

Reihenfolge (Seite für Seite, je ein PR mit Vorschau):

1. ~~**Lernwelt**~~ erledigt. Ursprünglicher Auftrag: Beispiel vom Eigentümer: Die Modus-Karten zeigen
   große Zahlen/Symbole („30“, „9“, „↺“) als Icons; die „9“ wirkt zufällig.
   Durch echte Icons oder klare Beschriftung ersetzen. Lernstand, Fragen,
   Antwortauswahl, Feedback, Auswertung, Speicherdialog im neuen Stil.
   Lernlogik, Fragenkatalog (`fragen-erweiterung.js`) und Speicherentscheidung
   (`laneswitch-lernwelt-v1`, Einwilligung) nicht verändern.
2. ~~**Fahrzeugkosten**~~ erledigt.
3. ~~**Unfallhelfer**~~ erledigt.
4. ~~**EaSI Drive** und **Nach dem Führerschein**~~ erledigt (dort „75 Lernfragen“ auf die tatsächlichen 225 korrigiert).
5. ~~**Förderrechner**~~ erledigt (nur Markup-Hülle und `calculator.css`; `engine.mjs`, `rules.mjs`, `ui.mjs`, `share.mjs` unverändert).
6. ~~Fahrschul-Seiten~~ erledigt. Fahrschul-Check: `qa/check-handoff.cjs` liest Skript und `<fieldset class="question" data-lane=…><legend>` per Regex – diese Struktur beibehalten. Vorlagen: Druckregeln setzen die Farbvariablen im Druck auf hell.
7. ~~Kooperationsprofile~~ erledigt (Markup unverändert, nur Stylesheets; `partner-navigator.js` fügt bei Freigabe einen Block `.partner-section.partner-card` an – Stil berücksichtigt).
8. ~~**Gefahrenradar**~~ erledigt. Bleibt ein Vollbild-Spiel mit eigener Kopfleiste (Signet, Zurück, Vollbild), ohne Seitenleiste.
   `radar.css` nutzt nur Variablen aus `shell.css` (plus `--sp-good/-bad`); Szenenillustrationen behalten ihre Farben.
   In `game.mjs`/`immersive.mjs` nur Darstellung geändert (Zeichen-Icons → SVG, Zustandsklassen `is-good/is-bad/is-miss/is-info`);
   Szenen, Punkte, Abläufe, IDs unverändert. Bühnengröße hängt an `calc(100dvh - …)` – bei Änderungen an Kopf/Meta-Zeilen mitprüfen, auch Handy quer.
9. ~~Rechtliches (Impressum, Datenschutz)~~ erledigt. Nur optisch, Inhalte unverändert. Künftige Textänderungen weiterhin nur mit Freigabe.

Alle Unterseiten der Liste sind damit umgestaltet. Weitere Gestaltungsarbeit nur nach neuem Auftrag.

## Prüfen (zusätzlich zu CLAUDE.md)

- Die Cloudflare-Vorschau ist aus der Cloud-Arbeitsumgebung nicht erreichbar. Geprüft wird deshalb lokal
  (`dist/` per `python3 -m http.server`, Playwright-Bildschirmfotos) – Pages baut nicht, der Inhalt ist identisch –
  plus der Status „Deploy successful“ der Vorschau.

- Nicht nur Textkontrast prüfen, sondern auch **Flächen, Balken, Rahmen, Checkboxen**:
  Der Lernstand-Fehler (#53) war weiß auf weiß, ohne dass ein Text betroffen war.
- Jede Unterseite in allen Zuständen durchklicken (Start, Eingabe, Ergebnis, Dialoge)
  in hell und dunkel, 390 px und 1280 px, mit Bildschirmfotos ansehen.
- Der Eigentümer prüft am Android-Handy; Bildschirmfotos von ihm haben Vorrang.

## Offene Punkte außerhalb des Makeovers

- Markenrecherche zum neuen Logo (z. B. DPMA) vor Druck/Fahrzeugbeschriftung.
- laneswitch.de: Datenschutz enthält vermutlich noch „setzt keine eigenen Cookies“.
- Cloudflare-Pages-Projekte `laneswitch-partnerportal-test` und `laneswitch-landing-test` schlagen bei jedem Push fehl.
  Eigene Experimente des Eigentümers: ignorieren, nicht anfassen, nicht als Fehler melden.

## FAQ-Assistent (29.10.2026)

Eigener Menüpunkt zwischen Werkzeuge und Netzwerk, mobil fünf gleich große Ziele,
Desktop-Seitenleiste ebenfalls ergänzt. Kein schwebender Button oder automatisches
Öffnen. Fest hinterlegte Antworten, Kostenklärung und Kontakt-Fallback.
Cloudflare-KI vorbereitet, bis zum Nachweis des Workers-Free-Tarifs gesperrt.
Details und Freigabeschritte: `worker-assistant/README.md`.

## Gefahrenradar in 3D (30.10.2026)

Alle 25 Szenen laufen als vorgerenderte 3D-Fahrt aus Fahrerperspektive (MP4, 960 × 672, 25 fps).
Fragen, Antworten, Punkte und Zeitregeln sind unverändert. Die Trefferprüfung nutzt eine Spur der
Gefahrenbereiche (alle 100 ms), weil sich die Kamera bewegt (`video-tracks.mjs`, `core.mjs`).
Fällt ein Video aus, ist der Datensparmodus an oder kann der Browser kein MP4, erscheint die bisherige Zeichnung.
Werkzeug, Baukasten und Ablauf: `tools/gefahrenradar-3d/README.md`. Prüfung: `node --test qa/gefahrenradar.test.mjs`.

## Fahrschul-Login und einheitliche Partnerdarstellung (30.10.2026)

- Kopfzeile: Textbutton „Fahrschul-Login“ (`.login-top` in `shell.css`) neben „Empfehlen“ auf allen Seiten,
  führt zu `/navigator/zugang`. Dort gibt es zusätzlich „Kooperation anfragen“ für Fahrschulen ohne Zugang
  (Navigator-Änderung in `main`, PR #89). Beschriftung „Login / Registrieren“ (mobil zweizeilig, unter 340 px nur „Login“; Wunsch des Eigentümers).
- Fahrschule Emre ohne Video: Netzwerk-Ansicht (`app.js`) und Profilseite zeigen wie A1 das Logo
  (`konzept/assets/kooperationen/emre-logo.png`, Originallogo vom Eigentümer, 300 × 100, transparent).
  Profil-Logo-Layout: festes, für alle gleiches Logofeld `.partner-hero--logo .partner-logo` in `app/a1.css` (200 × 140, mobil 150 × 96, `object-fit:contain`, transparent). Übersichten (Netzwerk-Ansicht, Fahrschul-Verzeichnis) zeigen bewusst nur Namen, keine Logos.
- Datenschutz: Abschnitt „Kooperationsanfrage für Fahrschulen“ ergänzt (bitte rechtlich prüfen).

## Inhalte teilen (30.10.2026)

- `app/share.mjs`: Knopf „Teilen“ und Dialog (WhatsApp, E-Mail, Link kopieren, „Mehr …“ = Systemteilen).
  Platz: Unterseiten in der Kontextzeile oben rechts (`detail.js`), App-Ansichten Werkzeuge/Netzwerk/News/Startklar
  oben rechts im Kopfbereich (`pageHead(…, share)`), Gefahrenradar in der Spielleiste. Rechtstexte ohne Teilen.
- Texte je Inhalt in `CONTENT` (Name, Kurzbeschreibung, Pfad). Ton: Inhalte nur für Fahrschüler:innen → „du“,
  nur für Fahrschulen → „Sie“, für beide → gewählter Bereich. Unbekannte Seiten: Überschrift + meta description.
  Neue Seite → Eintrag in `CONTENT` und Regex in `detail.js` ergänzen.
- Kontaktformular (Bereich Fahrschulen): Häkchen „Zusätzlich Kooperation anfragen“ sendet Name, Fahrschule, E-Mail,
  Telefon, Anliegen und Nachricht an `/api/navigator` (`requestCooperation`, erscheint im Navigator-Admin unter „Anfragen“).
  Funktioniert nur auf laneswitch.online (Same-Origin), nicht in Cloudflare-Vorschauen.
