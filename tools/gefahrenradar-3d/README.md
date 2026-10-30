# Gefahrenradar · 3D-Videos

Werkzeug zum Erzeugen der Fahrszenen-Videos für `dist/konzept/lernwelt/gefahrenradar/`.
Es läuft nur lokal und ist nicht Teil der Website. Die Website lädt fertige MP4-Dateien
und braucht keine 3D-Bibliothek.

## Aufbau

- `kit.js`: wiederverwendbarer Baukasten. Er enthält Cockpit, Straßen (Stadt, Querstraße, Landstraße), Häuser, Bäume und Hecken. Dazu kommen Autos, Lieferwagen, Bus, Lkw, Rettungswagen, Rad, Motorrad, Personen, Reh und Pferd, Schilder, Ampel, Bahnübergang, Baustelle, Regen und Pfütze.
- `scenes.js`: die 25 Szenen, je mit Aufbau, Fahrprofil der Kamera und Gefahrenbereichen. Die Inhalte (Texte, Fragen, Antworten, Punkte) stehen unverändert in `dist/.../scenes.mjs`.
- `render.mjs`: rendert jede Szene mit 25 Bildern pro Sekunde zu `video/<id>.mp4` mit einem Standbild `video/<id>.jpg`. Dazu schreibt es eine Trefferspur alle 100 ms nach `video-tracks.mjs`.

Unbewegliche Umgebung wird beim Aufbau nach Material zusammengefasst (`bake`). Das hält das Rendern schlank.

## Benutzen

```
./tools/gefahrenradar-3d/setup.sh                              # three.js r160 lokal holen (einmalig)
node tools/gefahrenradar-3d/render.mjs ball --preview 0,3,6,9    # Standbilder nach out/preview/
node tools/gefahrenradar-3d/render.mjs                           # alle Szenen rendern
node tools/gefahrenradar-3d/render.mjs ball door                 # einzelne Szenen neu rendern
node tools/gefahrenradar-3d/check.mjs                            # Kollisionsprüfung aller Szenen (ohne Rendern)
node --test qa/gefahrenradar.test.mjs                            # Spuren und Dateien prüfen
```

Voraussetzungen sind Node, Playwright mit Chromium und ffmpeg. Gerendert wird per Software (SwiftShader).
Das dauert etwa 1,3 s pro Bild und gut 6 Minuten pro Szene.

## Regeln

- **Zeitpunkt der Gefahr:** Im Video liegt er bei `cueMs + 350` ms, das Video ist 700 ms länger als die Szene. So kann das Spiel den Zeitpunkt wie bisher um ±350 ms variieren. Es startet das Video dafür passend später (`trackOffset`).
- **Kamera:** Sie fährt ruhig und hält rechtzeitig an, damit sie nie durch die Gefahr hindurchfährt. Frei bewegen lässt sie sich nicht.
- **Kollisionen:** `check.mjs` meldet, wenn das eigene Auto oder ein bewegtes Objekt etwas anderes berührt. Die Prüfung arbeitet mit Quadern, deshalb kann ein Werkzeug über Leitkegeln fälschlich als Treffer erscheinen.
- **Ändern einer Szene:** Nach jeder Änderung `check.mjs` laufen lassen und die Szene neu rendern. Danach `node --test qa/gefahrenradar.test.mjs` ausführen und die `?v=`-Versionen erhöhen.
- **Lizenz:** three.js (MIT) liegt nur in `vendor/` und wird nicht eingecheckt.
