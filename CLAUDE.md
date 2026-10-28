# LANE SWITCH · Arbeitsregeln für KI-Assistenten (laneswitch.online)

Ausführliches Handbuch: Notion „13 · Website-Guide · Design, Logos & KI-Übergabe“.
Diese Datei ist die Kurzfassung. Bei Widerspruch gilt die neuere ausdrückliche Entscheidung des Eigentümers.

## Geltungsbereich
- Dieser Branch `cloudflare-online` ist laneswitch.online (Cloudflare Pages, Ausgabeordner `dist/`, kein Build).
- `main` ist laneswitch.de (GitHub Pages). **Nicht anfassen, nicht mergen, keine Dateien von dort übernehmen**, außer der Eigentümer verlangt es ausdrücklich.
- Die beiden Branches niemals ineinander mergen.

## Ablauf bei Änderungen
1. Neuen Branch von aktuellem `origin/cloudflare-online` erstellen (z. B. `claude/<thema>`).
2. Ändern, lokal prüfen (siehe unten), committen, Branch pushen.
3. Pull Request gegen `cloudflare-online` öffnen. Cloudflare erzeugt eine Vorschau-Adresse.
4. **Nie direkt auf `cloudflare-online` pushen.** Live geht nur über einen PR. Der Eigentümer hat erlaubt, dass Claude PRs für laneswitch.online nach bestandener Prüfung und erfolgreicher Cloudflare-Vorschau selbst mergt; danach den Live-Stand prüfen und berichten. Änderungen an Navigator, Secrets, `main` oder Rechtstexten weiterhin nur nach ausdrücklicher Freigabe.
5. Rückweg: PR in GitHub per „Revert“ zurücknehmen oder in Cloudflare Pages → Deployments die vorherige Version wiederherstellen.

## Nicht ohne ausdrückliche Freigabe ändern
- Fahrschul-Navigator: `/navigator/*`, `/api/navigator*`, Worker `laneswitch-navigator`, D1-Datenbank, Zugänge, Secrets, Workflow „Navigator · Cloudflare“. Keine Daten aus der Datenbank abfragen.
- Tägliche News-Automation: `dist/news/*.json`, `docs/news-editorial.md`, Metricool/Instagram. Diese Automation committet direkt auf `cloudflare-online`; ihre Arbeit nicht überschreiben, vor dem Push immer frisch fetchen und rebasen.
- DNS, Domains, Cloudflare-Einstellungen, `dist/_headers`, `dist/sw.js`, `dist/manifest.webmanifest`, Indexierung (`noindex`).
- Impressum, Vermittlerangaben und Erstinformation; Datenschutz nur punktuell und mit Hinweis „bitte rechtlich prüfen“.
- Keine Passwörter, Tokens oder Zugangsdaten in Dateien, Commits, PRs oder Chat (das Repository ist öffentlich).

## Design
- Hell/Dunkel über `html[data-theme]`, gespeichert als `laneswitch-theme-v1`, Standard hell. Keine automatische Übernahme des Systemmodus.
- Nur die Farbvariablen aus `dist/app/shell.css` verwenden (`--bg --card --ink --muted --line --teal --tint --accent --navy`); `contrast.css` wird zuletzt geladen. Keine festen Farbwerte in neuen Bausteinen.
- Türkis nicht als kleinen Text auf Weiß; dafür `--teal` (Kontrastwert).
- Logo (seit 28.10.2026 eigenes Rebranding für .online, vom Eigentümer freigegeben): Signet = Navy-Quadrat mit Mittelmarkierung und Spurwechsel-Linie von rechts nach links, Wortmarke „LANE SWITCH“ in Inter Bold. Nur die SVGs aus `dist/konzept/assets/` verwenden (`logo-primary.svg` für helle, `logo-primary-dark.svg` für dunkle Flächen, `logo-ls.svg` kompakt, `logo-symbol.svg` Signet), nicht nachzeichnen oder umfärben. laneswitch.de behält das alte Logo.
- Schrift Inter mit Systemfallback; keine externen Fonts, CDNs, Tracker, Analytics, Embeds oder Backends.
- Layout: Desktop Sidebar + Inhalt + Rail; unter ~1220 px ohne Rail, unter 760 px mobile Unternavigation.

- Laufendes Makeover: Stand, Gestaltungssystem und nächste Schritte stehen in `docs/makeover.md`. Vor Gestaltungsarbeit lesen und nach jedem gemergten Schritt aktualisieren.

## Inhalt und Ton
- Fahrschulen „Sie“, Fahrschüler:innen „du“; Zielgruppe innerhalb einer Ansicht nicht wechseln.
- Ruhig, konkret, ohne Verkaufsdruck oder Angst. Keine erfundenen Zahlen, Partner, Referenzen, Vergütungen oder Garantien.
- Kontaktadresse: kontakt@laneswitch.de.

## Prüfen vor dem PR
- `node qa/check-handoff.cjs`, `node qa/pwa.cjs`, `node qa/news.test.mjs`
- Beide Zielgruppen × hell/dunkel × 390 px und 1280 px, kein horizontales Überlaufen, keine Konsolenfehler.
- Bei geänderten JS/CSS-Dateien die `?v=`-Versionen in allen einbindenden HTML-Dateien erhöhen.
- Im PR ehrlich angeben, was geprüft wurde und was nicht.
