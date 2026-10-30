# Fahrzeugdaten für den Fahrzeugkosten-Check

Erzeugt `dist/konzept/fahrzeugkosten/daten/` aus den amtlichen EEA-Daten
„Monitoring of CO₂ emissions from passenger cars“ (nur Erstzulassungen in Deutschland, ab Baujahr 2013).

- `build.mjs`: fragt die EEA-Schnittstelle `discodata.eea.europa.eu/sql` ab (POST, gruppiert je Hersteller, Modell, Antrieb, Hubraum und Leistung).
  Ab 2022 sucht das Skript die neueste Tabelle je Jahr selbst; endgültige Daten haben Vorrang vor vorläufigen.
- `normalize.mjs`: vereinheitlicht Schreibweisen von Herstellern und Modellen und erkennt Hybride ohne Stecker.
- `../../dist/konzept/fahrzeugkosten/empfehlungen.json`: redaktionelle Einsteigerautos je Budget. Das Skript ergänzt die Beispielvariante und bricht ab, wenn ein Modell nicht in den Daten steht.

```
node tools/fahrzeugdaten/build.mjs                 # live (nur in GitHub Actions erreichbar)
node tools/fahrzeugdaten/build.mjs --raw <ordner>  # aus zwischengespeicherten <jahr>.json.gz
node --test qa/fahrzeugkosten.test.mjs
```

Automatisch: Workflow `.github/workflows/fahrzeugdaten.yml`. Er erzeugt die Daten bei Pull Requests zum Rechner
und prüft wöchentlich, ob die EEA neue Daten veröffentlicht hat. Nur bei Änderungen entsteht ein Pull Request,
der nach Prüfung und Cloudflare-Vorschau automatisch zusammengeführt wird. `[fahrzeugdaten]` in einer
Commit-Nachricht auf `cloudflare-online` startet die Prüfung sofort.

Nicht enthalten: Typ- und Regionalklassen (keine frei nutzbare Gesamtliste), Elektroautos, Plug-in-Hybride, Gasfahrzeuge.
