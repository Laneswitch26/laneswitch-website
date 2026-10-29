# LANE SWITCH Assistent — Aktivierungsstand

## Veröffentlicht: lokale FAQ

Die Navigation bietet `/#assistent`. Texte und Quellen stehen zentral in
`dist/app/assistant-knowledge.mjs`. Kostenfreiheit der Fahrschulkooperation:
ausdrückliche Betreiberbestätigung im Auftrag vom 29.10.2026. Weitere Quellen:
öffentliche Kooperationsseite, Navigator-Demo, Navigator-README auf main,
Kontaktseite und Vermittlerhinweise. Keine Zusagen zu individuellen Produkten.

Nur exakt hinterlegte, normalisierte Fragen erhalten sofort eine Antwort.
Andere Formulierungen können passende Themen zur ausdrücklichen Auswahl anbieten.
Unbekannte oder individuelle Anliegen führen zum Kontaktformular. Preisfragen ohne
Bezug werden geklärt. Keine Modelltexte werden als Antworten ausgegeben. Auch eine
falsche Themenzuordnung erzeugt damit keine neue Preis- oder Leistungsbehauptung.
Das ersetzt keine redaktionelle Pflege: geänderte Leistungen müssen hier nachgeführt
und mit `qa/assistant.test.mjs` geprüft werden.

Verlauf: maximal zwölf Frage-Antwort-Paare je Zielgruppe im Arbeitsspeicher.
Keine Cookies, kein Local-/SessionStorage, kein automatischer Kontakttransfer.
„Verlauf löschen“ und Neuladen entfernen den Verlauf. Die vorhandenen unabhängigen
Website-Einstellungen (Theme/Zielgruppe) bleiben unberührt.

## Cloudflare-KI: vorbereitet, nicht aktiviert oder deployed

Das verbundene Cloudflare-OAuth-Konto kann Account- und User-Abonnements nicht lesen
(403: Billing Read erfordert API-Token; OAuth deckt den Endpunkt nicht ab).
Ein Modellkatalogzugriff oder `usage_model: standard` beweist keinen Free-Tarif.
Es wurde weder ein Tarif geändert noch eine kostenpflichtige Inferenz ausgelöst.

Die drei Sperren bleiben gesetzt: `AI_AVAILABLE=false`, `AI_ENABLED=false`,
`FREE_PLAN_CONFIRMED=false`. Keine automatische Aktivierung durch normale Deployments.

Vor Freigabe erforderlich:

1. Aktuellen **Workers Free**-Tarif des Kontos nachweisen (nicht den DNS-Zonentarif).
   Bei Workers Paid keine kostenlose Überlaufgarantie; dann Sperre beibehalten.
2. Aktuelle Workers-AI-Preise, Modellverfügbarkeit und Datenschutz prüfen.
   Quellen: https://developers.cloudflare.com/workers-ai/platform/pricing/
   und https://developers.cloudflare.com/workers-ai/platform/data-usage/
   Free hat derzeit 10.000 Neurons pro Tag kontoweit; danach Fehler statt Paid-Upgrade.
3. Neue, getrennte Worker-Route `/api/assistent` prüfen. Bestehende Navigator-Routen,
   D1-Daten und Secrets nicht ändern. `wrangler.json` ist nur Vorbereitung.
4. Datenschutz vor Aktivierung um Cloudflare-Inferenz, Verbindungsdaten,
   Übermittlungsgrundlage, Drittlandverarbeitung und Anbieterbedingungen ergänzen;
   bitte rechtlich prüfen. Aktuelle öffentliche Hinweise beschreiben nur lokale FAQ.
5. Erst nach diesen Prüfungen Worker und Rate-Limit-Binding deployen und per
   erlaubten Testfragen prüfen. 5 Aufrufe/Minute je täglich gehashter IP ist ein
   Missbrauchsschutz, KEIN kontoweites Tagesbudget. Die Kostensperre beruht auf dem
   bestätigten Free-Tarif, dessen spätere Änderung erneute Prüfung verlangt.
6. Anschließend Frontend freigeben. Jede KI-Frage verlangt die optionale Zustimmung
   innerhalb der geöffneten Ansicht. Nur die einzelne Frage wird gesendet, keine
   Historie oder Accountdaten. Das Modell liefert ausschließlich Themen-IDs;
   ungültige Antworten/Timeouts/Quota-Fehler führen zum Kontakt-/FAQ-Fallback.

Keine Logging-Aufrufe, kein AI Gateway, keine eigene persistente Datenhaltung.
Worker-Code und Sicherheitstests sind mit KI-Stubs geprüft; echte Inferenz ist noch
nicht getestet. Die Anbindung ist daher nicht als produktiv funktionsfähig behauptet.

Rücknahme: Website-PR revertieren. Aktuell wurde kein Worker angelegt.
