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
Bezug werden geklärt. Mit Einwilligung formuliert die KI auf Grundlage der hinterlegten Texte Antworten und kombiniert passende Quellen. Eine zweite Inferenz prüft den Entwurf gegen die angegebenen Quellen. Beide Prüfungen sind probabilistisch: Fehler sind nicht vollständig ausgeschlossen.
Das ersetzt keine redaktionelle Pflege: geänderte Leistungen müssen hier nachgeführt
und mit `qa/assistant.test.mjs` geprüft werden.

Verlauf: maximal zwölf Frage-Antwort-Paare je Zielgruppe im Arbeitsspeicher.
Keine Cookies, kein Local-/SessionStorage, kein automatischer Kontakttransfer.
„Verlauf löschen“ und Neuladen entfernen den Verlauf. Die vorhandenen unabhängigen
Website-Einstellungen (Theme/Zielgruppe) bleiben unberührt.

## Cloudflare-KI: Aktivierung am 29.10.2026

Betreiber-Screenshot bestätigt „Workers Free – Aktiv“ für das Cloudflare-Konto.
Kein Tarifwechsel, keine Gateway-Credits und kein bezahltes Modell. Workers AI Free
gewährt laut am 29.10.2026 geprüfter Dokumentation 10.000 Neurons täglich kontoweit;
bei Ausschöpfung schlagen Aufrufe fehl. Ein späterer Wechsel zu Workers Paid erfordert
erneute Kostenprüfung; vor einem solchen Wechsel AI_ENABLED=false setzen.

Quellen:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/

Die drei Schalter AI_AVAILABLE, AI_ENABLED und FREE_PLAN_CONFIRMED sind aktiviert.
Getrennter Worker laneswitch-assistent, nur Route laneswitch.online/api/assistent.
AI-Binding direkt, kein AI Gateway, keine Inhaltslogs, keine Datenbank.
Rate-Limit: 5 Aufrufe/Minute pro täglich gehashter IP, kein globales Tagesbudget.
Die Kostenbegrenzung beruht auf Workers Free; Rate-Limiting dient Missbrauchsschutz.

Die KI wird ausschließlich nach freiwilliger Zustimmung pro Frage verwendet, für allgemeine Freitextfragen, auch bei lokalen FAQ-Treffern. Persönliche/spezielle Anliegen werden soweit
regelbasiert erkennbar direkt an Kontakt verwiesen. Erkennung ist nicht vollständig.
Nur einzelne Frage, kein Verlauf. Antworten müssen bekannte Quellen-IDs angeben und die zusätzliche Quellenprüfung bestehen. Ausgabe als Text, keine Modell-Links oder HTML. Zwei Modellaufrufe pro erfolgreicher KI-Antwort. Technische Fehler werden als solche bezeichnet. Browser-Timeout 25 Sekunden.
Die Datenschutzseite beschreibt die optionale Verarbeitung und internationale
Übermittlungen. Die rechtliche Prüfung der Betreiberhinweise bleibt erforderlich.

Rücknahme: AI_ENABLED=false im Worker und AI_AVAILABLE=false im Frontend; lokale
FAQ bleiben aktiv. Keine Navigator-Routen, D1-Daten oder Secrets ändern.
