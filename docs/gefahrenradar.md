# Gefahrenradar

Eigenständiges Browser-Minispiel in der bestehenden statischen Website unter `/lernwelt/gefahrenradar/`. Einstieg bei den Lernmodi in `/lernwelt/`. Keine Build-Schritte und keine neuen Laufzeitabhängigkeiten. Gemeinsamer Header und Hell-/Dunkelmodus aus `assets/theme.js` und `assets/theme.css`.

## Dateien

- `lernwelt/gefahrenradar/index.html`: Einstieg, Bedienung, Quellenhinweis und Screen-Struktur.
- `lernwelt/gefahrenradar/game.css`: ausschließlich auf das Spiel begrenztes responsives Styling.
- `lernwelt/gefahrenradar/scenes.mjs`: Szeneninhalte, Antwort-IDs, Zeiten, Zielbereiche, Quellen, Regeln und Abzeichen.
- `lernwelt/gefahrenradar/illustrations.mjs`: eigene SVG-Zeichnungen und positionsabhängige Animationen.
- `lernwelt/gefahrenradar/core.mjs`: unabhängige Funktionen für Trefferprüfung, Punkte, Zufall und Auswertung.
- `lernwelt/gefahrenradar/game.mjs`: Zustände Start → Beobachten ↔ Pause → Frage → Feedback → nächste Szene/Ergebnis.
- `lernwelt/index.html`: zusätzlicher Spiel-Einstieg; bestehende Quizlogik unverändert.
- `datenschutz/index.html`: Abschnitt `#gefahrenradar` ergänzt.
- `sitemap.xml`: neue Route ergänzt.
- `tests/gefahrenradar-core.test.mjs`: ausführbare Node-Tests ohne Dependencies.
- `tests/gefahrenradar-browser.cjs`: vorbereitete Playwright-End-to-End-Prüfung; Playwright ist nur ein Testwerkzeug.
- `tests/gefahrenradar-responsive.html`: nicht indexierte Testansicht für definierte Browserfenstergrößen.

## Ursprüngliche fünf Szenen und fachliche Grundlagen

| ID | Gefahr | Lernziel | Grundlage |
| --- | --- | --- | --- |
| ball | Ball zwischen parkenden Autos | Mit einem nachlaufenden Kind rechnen, langsamer und bremsbereit | StVO § 3 Abs. 1, 2a |
| door | Fahrbahnseitige Tür öffnet sich | Seitlichen Raum einplanen, bei Bedarf anhalten, nicht blind ausweichen | StVO § 3; § 14 Abs. 1 betrifft die aussteigende Person |
| cycle | Gleichgerichteter Radverkehr beim Rechtsabbiegen | Radverkehr durchfahren lassen, Spiegel und Schulterblick | StVO § 9 Abs. 1, 3 |
| junction | Von rechts kommendes Auto hinter einer Hecke | An gleichrangigen Straßen rechts vor links und vorsichtig Sicht gewinnen | StVO § 8 Abs. 1, 2 |
| crossing | Erkennbarer Querungswunsch am Zebrastreifen | Mäßige Geschwindigkeit, Überqueren ermöglichen, erforderlichenfalls warten | StVO § 26 Abs. 1 |

Quellen am 08.09.2026 über Gesetze im Internet geprüft:
- https://www.gesetze-im-internet.de/stvo_2013/__3.html
- https://www.gesetze-im-internet.de/stvo_2013/__8.html
- https://www.gesetze-im-internet.de/stvo_2013/__9.html
- https://www.gesetze-im-internet.de/stvo_2013/__14.html
- https://www.gesetze-im-internet.de/stvo_2013/__26.html

Eigene Lernsituationen und Illustrationen; keine Übernahme amtlicher oder kommerzieller Prüfungsaufgaben. Keine Behauptung, dass die Punktzahl reale Fahrkompetenz oder Prüfungsreife misst. Eine zusätzliche didaktische Durchsicht durch eine Fahrlehrkraft ist sinnvoll; sie wurde nicht als erfolgt ausgegeben.

## Spielregeln

Je Szene: Erkennen 6, früh erkennen zusätzlich 2, passende Entscheidung 12 Punkte. Früh bedeutet innerhalb von drei Sekunden nach Beginn des sichtbaren Hinweises. Fehlklicks kosten je einen Punkt, maximal vier pro Szene; Mindestwert null. Nach einem akzeptierten Tipp werden weitere Versuche 650 ms lang ignoriert. Erkennen und Antworten sind pro Szene nur einmal bewertbar. Eine verpasste Gefahr wird markiert und anschließend dennoch abgefragt.

Abzeichen benötigen zugleich Punkte, erkannte Gefahren und passende Entscheidungen:
- Gefahrenentdecker:in: mindestens 45 Punkte, 3 erkannt, 3 passend entschieden.
- Aufmerksam unterwegs: mindestens 65 Punkte, 4 erkannt, 4 passend entschieden.
- Gefahrenprofi: mindestens 85 Punkte, 5 erkannt, 5 passend entschieden.

Fünf Szenen, maximal 100 Punkte. Die Beobachtungsfenster dauern höchstens elf Sekunden. Lesen und Antworten sind nicht zeitlich begrenzt; ungefähr 60 bis 90 Sekunden sind eine Orientierung, keine erzwungene Rundendauer. Die Reihenfolge der Szenen und Antworten sowie der Beginn der Bewegung variieren.

Ohne Zeitdruck: statischer Gefahrenhinweis, keine Ablaufzeit, kein Frühbonus, maximal 90 Punkte. Bei `prefers-reduced-motion: reduce` ist dieser Modus vorausgewählt. Textalternative: beschriebene Situationen, ausschließlich Entscheidungspunkte, maximal 60; Abzeichen ab 3/4/5 richtigen Entscheidungen ausdrücklich als Textmodus ausgewiesen. Die visuelle Suche ist damit nicht vollständig screenreadertauglich; die Textalternative ermöglicht inhaltliches Üben ohne visuelle Suche.

Pause hält Zeit und Animation an und verdeckt die Szene. Wechsel in einen Hintergrundtab pausiert eine zeitgesteuerte Szene; Fortsetzen ist eine aktive Entscheidung. Animationen werden nur während der Beobachtung mit requestAnimationFrame aktualisiert. Die Trefferradien folgen den Objekten und haben einen Mindestdurchmesser von 56 CSS-Pixeln. Tastatur: Tab zur Szene, Pfeiltasten bewegen den Blickpunkt, Shift beschleunigt, Eingabe oder Leertaste markiert.

## Daten und Datenschutz

Keine Spiel-Cookies, kein localStorage, kein sessionStorage, keine externen Fonts, Bilder oder API-Aufrufe. Alle Ergebnisse verbleiben im Arbeitsspeicher und verschwinden bei Neuladen/Schließen. Der bereits vorhandene Darstellungsmodus wird weiterhin vom gemeinsamen Theme-Skript verwaltet; Hosting verarbeitet weiterhin die allgemeinen Verbindungsdaten.

Für die zur Ausführung des ausdrücklich gestarteten Spiels erforderliche Verarbeitung wird kein zusätzlicher Consent-Banner eingeführt. Dies beruht auf der auf diese Umsetzung begrenzten Einordnung gemäß § 25 Abs. 2 Nr. 2 TDDDG, nicht auf der pauschalen Annahme, dass lokale Speicherung einwilligungsfrei sei. Optionale dauerhafte Speicherung wird bewusst nicht ergänzt. Falls später Bestleistungen lokal gespeichert werden, ist die Speicherentscheidung einschließlich Datenschutzhinweisen erneut zu prüfen.

Quelle: https://www.gesetze-im-internet.de/ttdsg/__25.html

## Neue Szenen hinzufügen

1. In `SCENES` einen Eintrag mit eindeutiger ID ergänzen. Eindeutige Antwort-IDs, genau eine richtige Antwort, Kontext, Erklärung und belastbare Quelle angeben.
2. Illustration in `illustrations.mjs` ergänzen. `hazard.from`/`to` im SVG-Koordinatensystem 800 × 560 auf die sichtbare Gefahr legen. Zielradius und Bewegungsdauer abstimmen.
3. `cueMs` muss vor `durationMs` liegen; Frühfenster und Touchflächen testen. Das Rendering und die Trefferprüfung nutzen beide `hazardAt`, damit Markierung und Bild zusammenpassen.
4. Pro Runde werden automatisch fünf zufällige Szenen aus dem Pool gewählt. Zusätzliche Szenen erfordern deshalb keine Änderungen an der Engine oder Punkteskala. Nur bei einer bewusst geänderten Rundengröße sind Nutzertexte, Nenner und Abzeichen anzupassen.
5. Quellen, Auswertung und Textalternative prüfen, Tests ergänzen.

## Prüfungen

`node --test tests/gefahrenradar-core.test.mjs`: fünf Testgruppen bestanden (Datenintegrität, zeitlich/räumlich korrekte mobile Treffer, Punktelogik einschließlich Fehlklicklimit, Gesamtwerte/Abzeichen, Zufallsreihenfolge).

Die fünf eigenen SVG-Szenen wurden vor Veröffentlichung gerendert und visuell geprüft. JavaScript-Syntax wurde geprüft. Die vorbereitete Playwright-Testdatei setzt einen lokal installierten Browser voraus; dessen Download war in der Arbeitsumgebung nicht verfügbar. Browserprüfungen werden separat dokumentiert und nicht aus der bloßen Existenz dieses Tests abgeleitet.

## Tatsächliche Browserprüfung am 08.09.2026

Die Website wurde über den bereits bestehenden GitHub-Pages-Workflow veröffentlicht und anschließend im Cloud-Chrome interaktiv geprüft. Der Cloud-Browser konnte die lokale Arbeitskopie nicht öffnen; die folgenden Prüfungen fanden deshalb auf der bereitgestellten Website statt.

- Alle fünf visuellen Szenen vollständig durchgespielt, jeweils Gefahr per Klick erkannt und passende Antwort gewählt: 90/90 Punkte im Modus ohne Zeitdruck, 5/5 erkannte Gefahren, 5/5 passende Entscheidungen, 0 verpasst und Abzeichen Gefahrenprofi.
- Vollständige Textalternative mit Tastaturantworten: 60/60 Punkte und gesondert ausgewiesenes Textmodus-Abzeichen.
- Zeitgesteuerter Modus: Pause/Fortsetzen, sichtbare Animation, Frühbonus (8 Erkennungspunkte), passende Entscheidung (20/20 Punkte), automatisches Übersehen nach Ablauf sowie weitere 12 Entscheidungspunkte nach einer verpassten Gefahr.
- Falsche Entscheidung nach nicht erkannter Gefahr: 0 Punkte, richtige Reaktion und Erklärung sichtbar.
- Wiederholte Fehlklicks: Limit-Meldung, keine negativen Punkte, anschließend richtige Erkennung und Antwort mit 14/18 Punkten nach genau vier Abzügen. Das 650-ms-Eingabefenster wurde im Code geprüft; eine zeitpräzise Touch-Automation stand nicht zur Verfügung.
- Visuelle Suche zusätzlich mit Pfeiltasten und Eingabe erfolgreich bedient.
- Neustart setzt Punkte und Szenenzähler zurück; Neuladen führt zum Startbildschirm. Unterschiedliche Reihenfolge der Szenen und Antworten beobachtet.
- Bestehende Lernwelt: Spiel-Einstieg vorhanden, gemeinsame Navigation geladen und Prüfungssimulation mit Frage und Antwortauswahl erfolgreich gestartet.
- Layoutgrößen 320×740, 390×844, 844×390, 768×1024 und 1280×900: kein horizontaler Dokumentüberlauf in der Antwortansicht. Helle und dunkle Oberflächen visuell geprüft. Der Rahmen prüft tatsächliche CSS-Media-Queries, simuliert jedoch weder echte Touch-Ereignisse noch Smartphone-Hardware.
- Zwei gefundene Layoutfehler behoben: doppelte SVG-Verlaufs-IDs und überlaufender Beenden-Button bei langen Szenentiteln auf schmalen Geräten. Zusätzlicher Scrollabstand hält Inhalte unterhalb der bestehenden festen Navigation.

Kein Test auf einem physischen Smartphone oder in Safari/Firefox durchgeführt. Der vorbereitete komplette Playwright-Testlauf wurde nicht als bestanden ausgegeben. Die Quellenprüfung ersetzt keine didaktische Freigabe durch eine Fahrlehrkraft.


## Erweiterung: 25 Szenen (8. September 2026)

Der Pool enthält jetzt 25 eigenständige Situationen. Eine Runde bleibt bei fünf Szenen und maximal 100 Punkten. Die fünf ursprünglichen Szenen bleiben erhalten.

Neu: Bremslichter voraus, Engstelle mit Gegenverkehr, haltender Bus mit Warnblinklicht, abfahrender Linienbus, Bahnübergang mit rotem Licht, Linksabbiegen vor einem Motorrad, Fußverkehr beim Rechtsabbiegen, Grundstücksausfahrt, Stoppschild, rote Ampel, blockierter Kreuzungsausgang bei Grün, Straßenarbeiten, Wildwechsel, geführtes Pferd, Wasser auf der Fahrbahn, Nebelbank, Überholen eines Fahrrads mit Gegenverkehr, rückwärts ausparkender Lieferwagen, rechts abbiegender Lkw und Rettungswagen mit Blaulicht/Einsatzhorn.

Die Szenen decken weitere relevante Lernthemen ab, aber keinen vollständigen amtlichen Prüfungsfragenkatalog. Alle Texte und Illustrationen sind eigenständig. Das Einsatzhorn ist im Einführungstext beschrieben; es wird kein Ton abgespielt. Sichtbare permanente Gefahren (z. B. Stoppschild oder Wasserfläche) sind sofort anklickbar. Andere Hinweise entstehen wie bisher zeitversetzt.

### Auswahl ohne direkte Wiederholungen

`createSceneDeck` in `core.mjs` hält einen gemischten Vorrat ausschließlich im Arbeitsspeicher. Erst wenn alle 25 Einträge gezeigt wurden, wird neu gemischt. Die zuletzt gezeigten neun Einträge werden am Beginn des neuen Vorrats zurückgestellt. Dadurch überschneiden sich benachbarte Fünfer-Runden auch bei späteren Poolgrößen, die nicht durch fünf teilbar sind, nicht (bei ausreichend großem Pool). Innerhalb jedes vollständigen Vorrats erscheint jede Szene genau einmal.

Die Engine fordert erst beim tatsächlichen Szenenwechsel den nächsten Eintrag an. Ein Abbruch verbraucht daher keine noch ungesehenen Szenen. „Erneut spielen“ und „Modus ändern“ behalten den Vorrat. Ein Neuladen startet eine neue Auswahl. Kein Session Storage, Local Storage, Cookie, Tracking oder zusätzlicher Drittanbieter wird hierfür verwendet; die bestehende Datenschutzbeschreibung bleibt zutreffend.

### Dateien und Erweiterung

- `more-scenes.mjs`: 20 neue Szenendatensätze, über `scenes.mjs` in den gemeinsamen Pool aufgenommen.
- `more-illustrations.mjs`: neue lokale SVG-Bausteine und szenenspezifische Umgebung / Hinweise; `illustrations.mjs` zeichnet weiterhin die gemeinsame Fahrerperspektive und Animation.
- `core.mjs`: Vorratsauswahl als unabhängig testbare Funktion.
- `game.mjs` und `index.html`: Auswahl integriert, Poolgröße angezeigt, Sitzungshinweis ergänzt.
- `tests/gefahrenradar-core.test.mjs`: Poolintegrität, bestehende Wertung/Trefferflächen und neue Wiederholungsregeln.
- `tests/gefahrenradar-gallery.html`: nicht indexierte visuelle Prüfseite aller 25 Szenen, keine versteckte Szenenwahl in der Spiel-Engine.
- `tests/gefahrenradar-responsive.html`: aktualisierte Vorschauversion.

Weitere Szenen benötigen einen eindeutigen Datensatz mit genau einer richtigen Antwort und einen passenden visuellen Hinweis in der SVG-Darstellung. Statische Hinweise setzen `visual.static` und `cueMs: 0`; sie erhalten keine zufällige Startverzögerung. Landstraßenszenen können `visual.rural` verwenden. Runde, Wertung und Auswahl müssen nicht geändert werden.

### Fachliche Referenzen

Am 8. September 2026 anhand von Gesetze im Internet geprüft: StVO §§ 3 (Sicht/Tempo), 4 (Abstand), 5 (Überholen), 6 (Hindernisse), 9 (Abbiegen/Rückwärtsfahren), 10 (Einfahren), 11 (blockierte Kreuzungen), 19 (Bahnübergang), 20 (Busverkehr), 37 (Lichtzeichen), 38 (Einsatzfahrzeuge), Anlage 2 (Stoppschild/Haltlinie). Links stehen im jeweiligen Datensatz und werden im Feedback ausgegeben. Allgemeine Rücksichtnahme bei Pferden und ausschwenkenden Lkw ist mit § 1 verknüpft; dies begründet keine pauschale Vorfahrt dieser Beteiligten.

### Prüfung der Erweiterung

- Neun Node-Tests bestanden: `node --test tests/gefahrenradar-core.test.mjs`.
- Auswahltest mit 80 reproduzierbaren Zufallsfolgen für jede der Poolgrößen 25, 26, 27, 29, 30 und 51, jeweils über 20 komplette Vorräte: vollständige Abdeckung und keine Überschneidung benachbarter Runden.
- Trefferflächen für alle 25 Szenen vor, während und nach dem Hinweis geprüft, auch bei schmalen Darstellungen; Punkte/Fehlklickobergrenze/Abzeichen unverändert getestet.
- Android-Touchfunktion der bisherigen Version vom Nutzer bestätigt; kein eigener physischer Android-Gerätetest.

- Live-Browserprüfung: alle 25 Szenen über fünf vollständige Runden im Modus ohne Zeitdruck getroffen und richtig beantwortet; jede Runde 90/90 Punkte, insgesamt 25 unterschiedliche Titel. Erste Szene nach Poolwechsel gehörte nicht zur unmittelbar vorherigen Runde.
- Neue SVG-Szenen auf der Galerie geprüft. Rettungswagen fährt jetzt mit der Front in Bewegungsrichtung. Beim haltenden Warnblinkbus zählen sowohl der Bus als auch die hervortretende Person ab Szenenbeginn; die zusätzliche Trefferregion ist separat getestet.
- Mobile Ansicht: irrelevanter Klick ergibt einen Abzug; anschließender Treffer plus falsche Antwort ergibt korrekt 5/18 Punkte. Neue Warnkleidungs-Szene bei 390 px in Hell und 320 px in Dunkel visuell geprüft.
- Breitenprüfung bei 320, 390, 844 (Querformat), 768 und 1280 px; kein horizontaler Überlauf. Der gemeinsame Theme-Schalter lässt sich per Tastatur bedienen.
- Die vorbereitete Playwright-Datei wurde an statische Hinweise angepasst (Frühbonus beginnt dort sofort). Sie wurde nicht separat ausgeführt; die Live-Browserprüfung erfolgte über den verfügbaren Browserzugang.
