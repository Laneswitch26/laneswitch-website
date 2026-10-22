# Testprotokoll Förderrechner 2027

Lokale Ausführung: 22.10.2026; Node 24.19.0. 45 Tests bestanden, 0 fehlgeschlagen.

Die monetären Erwartungswerte wurden vorab als feste Einzelwerte hinterlegt. Unrunde Centanteile bleiben intern exakt; die Oberfläche rundet nur die Anzeige.

| Fall | Eingaben (Abweichung von Basisfall) | Erwartet | Tatsächlich | Status |
|---|---|---|---|---|
| Null | `{"annualCents": 0, "children": 0}` | 0 | 0 | bestanden |
| Unter Minimum | `{"annualCents": 11999, "children": 0}` | 0 | 0 | bestanden |
| Minimum | `{"annualCents": 12000, "children": 0}` | 60 | 60 | bestanden |
| Erste Stufe | `{"annualCents": 24000, "children": 0}` | 120 | 120 | bestanden |
| Ende erste Stufe | `{"annualCents": 36000, "children": 0}` | 180 | 180 | bestanden |
| Ein Cent über Schwelle | `{"annualCents": 36001, "children": 0}` | 180.0025 | 180.0025 | bestanden |
| Zweite Stufe | `{"annualCents": 60000, "children": 0}` | 240 | 240 | bestanden |
| Fördermaximum | `{"annualCents": 180000, "children": 0}` | 540 | 540 | bestanden |
| Über Fördermaximum | `{"annualCents": 200000, "children": 0}` | 540 | 540 | bestanden |
| Vertragsmaximum | `{"annualCents": 684000, "children": 0}` | 540 | 540 | bestanden |
| Ein Kind Minimum | `{"annualCents": 12000, "children": 1}` | 180 | 180 | bestanden |
| Ein Kind unter Kindergrenze | `{"annualCents": 29999, "children": 1}` | 449.985 | 449.985 | bestanden |
| Ein Kind Grenze | `{"annualCents": 30000, "children": 1}` | 450 | 450 | bestanden |
| Ein Kind Maximum | `{"annualCents": 180000, "children": 1}` | 840 | 840 | bestanden |
| Drei Kinder | `{"annualCents": 180000, "children": 3}` | 1440 | 1440 | bestanden |
| Kinder unter Minimum | `{"annualCents": 11999, "children": 3}` | 0 | 0 | bestanden |
| Bonus 24 | `{"age": 24, "bonus": "unused"}` | calculated | calculated | bestanden |
| Bonus 25 | `{"age": 25, "bonus": "unused"}` | calculated | calculated | bestanden |
| Bonus verbraucht | `{"age": 24, "bonus": "used"}` | calculated | calculated | bestanden |
| Bonus unklar | `{"age": 24, "bonus": "unknown"}` | review | review | bestanden |
| Bonus unter Minimum | `{"age": 24, "bonus": "unused", "annualCents": 11999}` | calculated | calculated | bestanden |
| Selbstständig bestätigt | `{"status": "self-employed", "selfConditions": true, "age": 40}` | calculated | calculated | bestanden |
| Selbstständig 65 | `{"status": "self-employed", "selfConditions": true, "age": 65}` | calculated | calculated | bestanden |
| Selbstständig 66 Grenzjahr | `{"status": "self-employed", "selfConditions": true, "age": 66}` | review | review | bestanden |
| Selbstständig 67 | `{"status": "self-employed", "selfConditions": true, "age": 67}` | review | review | bestanden |
| Selbstständig Voraussetzungen unklar | `{"status": "self-employed", "selfConditions": false}` | review | review | bestanden |
| Mittelbar | `{"status": "indirect"}` | review | review | bestanden |
| Berufsständisch | `{"status": "professional"}` | review | review | bestanden |
| Beamter | `{"status": "civil"}` | review | review | bestanden |
| Unklar | `{"status": "other"}` | review | review | bestanden |
| Altvertrag | `{"scope": "old"}` | review | review | bestanden |
| Mehrere Verträge | `{"scope": "multiple"}` | review | review | bestanden |
| Ausland | `{"domestic": false}` | review | review | bestanden |
| Kinder unklar | `{"children": 1, "childrenAssigned": false}` | review | review | bestanden |
| Über Vertragsmaximum | `{"annualCents": 684001}` | review | review | bestanden |
| 2028 | `{"year": 2028}` | review | review | bestanden |
| Negativ | `{"annualCents": -1}` | invalid | invalid | bestanden |
| Kein Betrag | `{"annualCents": null}` | invalid | invalid | bestanden |
| Bruchteilcent | `{"annualCents": 1.1}` | invalid | invalid | bestanden |
| Kind nicht ganzzahlig | `{"children": 1.5}` | invalid | invalid | bestanden |
| Alter leer | `{"age": null}` | invalid | invalid | bestanden |

Basisfall: Jahr 2027, 1.800 Euro Jahresbeitrag, Alter 30, 0 Kinder, inländisch gesetzlich RV-pflichtig, ein Neuvertrag ohne weitere geförderte Verträge, deutsche Steuer-/Wohnsitzverhältnisse, Bonus verbraucht. Beträge in Eingaben sind Cent; Ergebniswerte in der Tabelle Euro.

Zusätzlich bestanden: deutsche Dezimaleingabe und Monats-/Jahresumrechnung, Einmalbonus gegenüber regulärem Vergleich, Förderquote bei Nullbeitrag, UTF-8-Mailto-Roundtrip mit Sonderzeichen und richtigen Beiträgen, Prüffall ohne erfundene Förderhöhe.

## Manuelle Vorschauprüfung
Cloudflare-Vorschau am 22.10.2026: 360 Euro Jahresbeitrag, Alter 24, Bonus noch nicht genutzt: 180 Euro Grundzulage + 200 Euro Bonus = 380 Euro. Mit zwei bestätigten Kinderzuordnungen: 600 Euro Kinderzulage, insgesamt 980 Euro, Summe 1.340 Euro. Erwartete und angezeigte Werte stimmen überein. Wechsel auf Selbstständigkeit mit ungeklärten Voraussetzungen entfernt die Förderhöhe einschließlich des Mailentwurfs korrekt. Entwurf übernimmt Beitrag, Status, Alter, Kinder, Zielgruppe und optionalen Namen; kein Versand. Desktopdarstellung der vorhandenen Online-App-Shell visuell geprüft.

## Noch separat zu bestätigen
Browsermatrix und visuelle Kontrolle in GitHub Actions; Live-Abrufe beider Domains nach Veröffentlichung. Lokaler Browserstart war wegen gesperrter Unix-Sockets nicht möglich. Ein Testversand wurde nicht vorgenommen und ist nicht Teil des Mailto-Workflows.
