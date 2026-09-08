# Kooperationsprofile pflegen

Öffentliche Struktur: `/kooperationen/` → `/kooperationen/fahrschulen/` → eigenes Fahrschulprofil.

## Weitere Fahrschule ergänzen

1. `kooperationen/fahrschulen/fahrschule-emre/index.html` als Vorlage in einen neuen Ordner mit sprechendem Namen kopieren.
2. Titel, Beschreibung, kanonische URL, Open-Graph-Angaben und Breadcrumb-JSON-LD anpassen. Alle Emre-spezifischen Inhalte, Links und Medien ersetzen.
3. Ausschließlich bestätigte Angaben zu Kooperation, Team, Angeboten und Standorten verwenden. Quelle und Abrufdatum aktualisieren. Keine unbestätigten Vergünstigungen oder Leistungen zusagen.
4. Karte in `kooperationen/fahrschulen/index.html` ergänzen und Profil in `sitemap.xml` aufnehmen.
5. Medien unter `assets/kooperationen/` speichern. Videos mit `controls`, `playsinline` und `preload="none"` ohne Autoplay einsetzen. Seitenverhältnis an das jeweilige Video anpassen.
6. Maps und Instagram nur verlinken, keine automatisch geladenen Drittanbieter-Embeds hinzufügen.
7. Gemeinsames Layout: `assets/cooperations.css`. Navigation und manuelle Hell-/Dunkelumschaltung: `assets/theme.js`. Beide Modi, schmale Displays und Tastaturbedienung prüfen.

Weitere Kooperationskategorien können später unter `/kooperationen/` ergänzt werden. Derzeit ist nur die Kategorie Fahrschulen öffentlich angelegt.
