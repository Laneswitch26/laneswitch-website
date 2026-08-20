# LANE SWITCH Website

Statische Testversion der LANE-SWITCH-Website für GitHub Pages.

## Struktur

- `index.html` – Startseite
- `fahrschulen/` – Bereich für Fahrschulen
- `fahrschueler/` – Bereich für Fahrschülerinnen und Fahrschüler
- `kontakt/` – Kontaktseite mit lokaler `mailto:`-Vorbereitung
- `impressum/` und `datenschutz/` – technisch vorbereitete Rechtstexte
- `assets/css/` – Schriften und seitenspezifische Gestaltung
- `assets/images/` – Logo, Favicon und Video-Vorschaubild
- `assets/js/contact.js` – Logik des Kontaktformulars
- `laneswitch-erklaervideo.mp4` – lokal eingebundenes Erklärvideo

## Bearbeitung

Texte stehen direkt in der jeweiligen `index.html`. Gestaltung wird in der
gleichnamigen Datei unter `assets/css/` angepasst. Gemeinsame eingebettete
Schriften liegen in `assets/css/fonts.css`.

Das Kontaktformular speichert und übermittelt selbst keine Daten. Nach der
Browser-Validierung öffnet es eine vorausgefüllte E-Mail an die hinterlegte
Kontaktadresse.

## Veröffentlichung

Die Testversion ist mit `noindex, nofollow` gegen Suchmaschinen-Indexierung
gekennzeichnet. Die Domain `laneswitch.de` und ihre STRATO-DNS-Einstellungen
gehören ausdrücklich nicht zu dieser Testveröffentlichung.

Impressum und Datenschutz wurden bei der technischen Migration inhaltlich
nicht neu verfasst. Vor einer endgültigen Veröffentlichung müssen die dort
bereits markierten offenen Angaben fachlich geprüft und ergänzt werden.
