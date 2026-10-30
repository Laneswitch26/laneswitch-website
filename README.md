# laneswitch-website

- `main` → **laneswitch.de** (GitHub Pages). Seit 30.10.2026 nur noch eine Landingpage für Fahrschulen (`index.html`) mit Absprung zu laneswitch.online, dazu `impressum/` und `datenschutz/`. Frühere Unterseiten (z. B. `lernwelt/`) sind Weiterleitungen auf die passende Seite von laneswitch.online (wichtig für Google); alle unbekannten Adressen leiten über `404.html` auf die Startseite.
- `cloudflare-online` → **laneswitch.online** (Cloudflare Pages, Ordner `dist/`).
- Die frühere vollständige laneswitch.de-Seite ist im Branch `archiv/laneswitch-de-2026-10-30` gesichert (nicht veröffentlicht).
- Bewusst behalten: `_navigator/` und der Workflow „Navigator · Cloudflare“ (Worker für laneswitch.online), `navigator/zugang/` (Weiterleitung zum Navigator-Zugang auf laneswitch.online), `assets/og-*.png` und `assets/kooperationen/emre-poster.jpg` (Vorschaubilder, die laneswitch.online beim Teilen verwendet), `assets/theme.*` (Darstellung von Impressum und Datenschutz).
- News werden nur noch auf `cloudflare-online` gepflegt (siehe `docs/news-editorial.md`).
