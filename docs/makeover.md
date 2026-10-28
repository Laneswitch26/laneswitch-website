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
| #48 (main) | Navigator: Testkonto-Passwort nur noch als Secret `NAV_TEST_PASSWORD` |
| #49 | Neue Startseite (Hero, drei Einstiege, Aktuell, Fokus, Ansprechpartner, Beiträge) |
| #50, #52 | Porträt von Steven (`dist/konzept/assets/steven-portrait.jpg`, quadratisch, abgerundet) |
| #51 | Rebranding: neues Logo (Spurwechsel-Signet), Favicon, PWA-Icons |
| #53 | Einheitlicher Kopfbereich für Werkzeuge, Netzwerk, Kontakt, Newsticker; Lernwelt-Lernstand im hellen Modus sichtbar |
| #55 | Lernwelt im neuen Design; gemeinsame Bausteine für Unterseiten in `konzept/assets/subpage.css` |
| #56 | Fahrzeugkosten im neuen Design (Schrittanzeige mit Beschriftung, Auswahlkacheln, Ergebnis, Anfrage-Dialog) |
| #57 | Unfallhelfer im neuen Design (Notrufnummern als Tipp-Kacheln, Checkliste mit großen Tippflächen) |
| #58 | EaSI Drive und Nach dem Führerschein im neuen Design; weitere Bausteine in `subpage.css` (v2) |
| PR_AV | Förderrechner Altersvorsorge im neuen Design (beide Zielgruppen; `calculator.css` neu, Rechenlogik unverändert) |

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
6. Fahrschul-Seiten: `fahrschul-check/`, `cockpit/`, `notfallcenter/`, `vorlagen/`, `fahrschulen-informationen/`
7. Kooperationsprofile `kooperationen/fahrschulen/fahrschule-a1/`, `fahrschule-emre/`
8. **Gefahrenradar** `konzept/lernwelt/gefahrenradar/` (eigenes Spiel-Layout; im Textmodus bleibt links eine leere Fläche)
9. Rechtliches (Impressum, Datenschutz) nur optisch angleichen, Inhalte nicht ändern.

## Prüfen (zusätzlich zu CLAUDE.md)

- Nicht nur Textkontrast prüfen, sondern auch **Flächen, Balken, Rahmen, Checkboxen**:
  Der Lernstand-Fehler (#53) war weiß auf weiß, ohne dass ein Text betroffen war.
- Jede Unterseite in allen Zuständen durchklicken (Start, Eingabe, Ergebnis, Dialoge)
  in hell und dunkel, 390 px und 1280 px, mit Bildschirmfotos ansehen.
- Der Eigentümer prüft am Android-Handy; Bildschirmfotos von ihm haben Vorrang.

## Offene Punkte außerhalb des Makeovers

- Markenrecherche zum neuen Logo (z. B. DPMA) vor Druck/Fahrzeugbeschriftung.
- laneswitch.de: Datenschutz enthält vermutlich noch „setzt keine eigenen Cookies“.
- Cloudflare-Pages-Projekt `laneswitch-partnerportal-test` schlägt bei jedem Push fehl
  (nicht von uns verursacht); Eigentümer entscheidet, ob es gelöscht wird.
