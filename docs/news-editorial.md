# LANE SWITCH news operations

## Production targets (keep separate)

- Repository: `Laneswitch26/laneswitch-website`.
- `main`: laneswitch.de; data `news/learner.json`, `news/school.json`; UI `assets/news/news.mjs` and `news.css`; audience entrypoints `/fahrschueler/`, `/fahrschulen/`.
- `cloudflare-online`: laneswitch.online; data `dist/news/learner.json`, `dist/news/school.json`; UI `dist/app/news.mjs` and `news.css`; app entrypoints `/konzept/fahrschueler/`, `/konzept/fahrschulen/` and root selected audience. The ticker is a dedicated #news view under Werkzeuge, not on the start feed. Pages deploy output is `dist`.
- Never merge the two production branches into each other. Maintain existing typography, color tokens, light/dark themes, navigation, footers and PWA behavior. Routine editorial updates change the four JSON feeds; on main also run `node scripts/render-news.mjs` and include the two generated audience HTML sections. Preserve every byte outside the marked news regions.
- No paid news API, external widget, runtime AI API, tracking, image license or new hosting product. Scheduled research uses the user's existing ChatGPT automation and GitHub connection. No guarantee of unlimited free third-party services or unattended success.

## Editorial procedure

1. Read the latest feeds from BOTH production branches and this policy. Search current news in German for both audiences; examine the previous 48 hours, backfill missed days up to seven days. Prioritize Germany/NRW, Herne, Bochum, Castrop-Rauxel and Recklinghausen.
2. Topics: driver training/exams/licences, confirmed legal changes and deadlines, costs/tax/fuel relief, relevant subsidies, material road safety/vehicle issues and regional traffic affecting instruction. Learners need concrete personal effects; schools need operational/training/fleet implications. Avoid product advertising and unrelated filler.
3. Search results and RSS snippets are discovery only. OPEN and READ the source pages. Prefer responsible authorities, legislation/official gazettes, BMV, BMF, Bundestag/Bundesrat, KBA, Autobahn GmbH, NRW/local authorities, TÜV/DEKRA. ADAC is suitable for its own studies/prognoses; label forecasts. For legal/financial effects verify with the responsible primary source. Find newer developments before retaining old status. Do not turn an announced proposal, cabinet decision or parliamentary vote into enacted law. Distinguish `proposal`, `decided`, `in_force`, `report`, `forecast`.
4. Publish only supported facts. Write original short headlines and summaries; no copied article text, close paraphrase of distinctive phrasing, screenshots, publisher images, quotes or copied RSS descriptions. Link to the exact source and name the institution. Respect copyright/database rights and access terms; do not bypass paywalls or reproduce collections. A source link alone does not license copying.
5. Separate factual `summary`, audience-specific `impact`, and practical `action` (displayed as our interpretation). For relief explain eligibility, dates, mechanism and steps only when verified. Never promise a saving, payout or entitlement that the source does not establish. Use German `du` for learners and `Sie` for schools.
6. Deduplicate by subject/event, preserving stable IDs. Update corrections visibly in the title/summary and checkedAt; keep original publishedAt unless a new substantive development warrants a new item. Do not relabel old material as new. Aim for 0–3 genuinely relevant new items per audience, maximum 10 active items. Quiet days require no invented stories.
7. JSON schema: version=1; audience=`learner`/`school`; checkedAt=actual successful review ISO timestamp with timezone; items array. Each item: id, category, status, title, summary, impact, action, publishedAt, checkedAt, expiresAt, sources=[{name,url}]. Plain text only; absolute https source URLs. Dates reflect evidence: publishedAt is the source publication/update date, not today's check. expiresAt is an explicit display deadline, not a legal guarantee. Hide time-sensitive traffic immediately after its period, general news normally after 14 days, ongoing measures at their end. Recheck retained items before advancing their checkedAt.
8. Advance feed checkedAt only after a successful meaningful search for that audience. If sources fail or conflict, retain the previous successful timestamp and omit unverified additions; explain the limitation to the owner. New successful searches without new relevant news may update feed checkedAt. The UI warns after 36 hours without a review and hides expired stories, even if the automation fails.
9. Validate feeds with the committed validator and inspect the diff. Commit both feeds atomically per target branch against its current head (no force updates); retry from the new head if concurrent changes occur. Do not overwrite unrelated content. For data-only daily publication, the user authorized publication on both production branches. If branch protection requires PRs, follow it; never bypass controls.
10. On main, after updating JSON run `node scripts/render-news.mjs`. Commit the generated sections in `fahrschueler/index.html` and `fahrschulen/index.html` together with the JSON. These provide same-origin, pre-rendered content and embedded validated fallback data when a browser blocks JSON. Never change unrelated page sections. If a local runtime is unavailable, reproduce the renderer output exactly between `<!-- ls-news:start -->` and `<!-- ls-news:end -->`, including escaped JSON seed, or report the blocked step. The online branch does not use the renderer.
11. Verify deployment/live JSON on each domain independently. A successful commit is not proof of a successful deployment. If only one domain succeeds, report partial success precisely. Never report live without evidence. Notify the owner about publication failures, factual corrections and noteworthy changes; keep empty daily runs quiet where supported.

## Checks

`node tests/news.test.mjs` checks input validity, dates, expiry, stale status and source URL safety. News loads same-origin with `cache: no-store`; no external network call is made by visitors until they choose a source link. Online SW caches only the offline page. UI failures do not erase other site content.

## Themenvielfalt und Bezug zum LANESWITCH-Konzept

Bei jeder Recherche mehrere Themenfelder abdecken und über die Woche eine ausgewogene Auswahl anstreben:
- Ausbildung & Prüfung: Führerscheinreform, Fahrsimulatoren, digitales Lernen, Prüfungsorganisation und Fahrlehrerqualifikation.
- Kosten & Mobilität: Kraftstoff, Förderung, Fahrzeugkosten, E-Mobilität und relevante Fristen.
- Sicherheit & Unfallprävention: Fahranfänger, Ablenkung, Wetter, Fahrzeugmängel, Arbeits- und Wegeunfälle.
- Cyber & Datenschutz: Phishing, Ransomware, Schülerdaten, Terminverwaltung, Lernsoftware und Zahlungsverkehr.
- Betrieb & Haftung: Unterricht, Räume, Schlüssel, Fuhrpark, Schäden gegenüber Dritten.
- Recht & Personal: relevante Entscheidungen zu Verkehr, Verträgen, Arbeitsrecht und Fahrschulbetrieb.
- Betriebsfortführung: Krankheit/Unfall zentraler Personen, Vertretung und organisatorischer Betriebsausfall.
- Regionale Entwicklungen mit konkretem Nutzen für die Zielgruppe.

Das veröffentlichte SIGNAL-IDUNA-Konzept für Fahrschulen umfasst Betriebshaftpflicht, Cyberversicherung, Gruppen-Unfall, Firmenrechtsschutz und Inhaber-Ausfall. Für Lernende kommen persönliche Unfallrisiken, Kfz-Haftpflicht/Kasko und die Nutzung des Elternautos in Betracht. Eine relevante Meldung darf diese Risiken erklären, ist aber kein Nachweis einer Versicherungsdeckung. Keine pauschalen Leistungszusagen, Tarifdetails, erfundenen Angebote oder Angstmache. Prävention und praktische Folgen zuerst; kommerzielle Servicehinweise klar getrennt als LANESWITCH-Service kennzeichnen und anhand aktueller Website-Angebote prüfen.

Für Cyberthemen beispielsweise BSI, für Arbeitssicherheit die zuständige Berufsgenossenschaft/DGUV und für Rechtsfragen amtliche Entscheidungen/Gesetzestexte nutzen. Hersteller- und Versichererbeiträge als solche kennzeichnen; Produktbehauptungen nicht als unabhängige Nachricht behandeln.

Bei Simulatoren immer unterscheiden: ergänzendes freiwilliges Üben, anrechenbare Ausbildung, Ersatz verpflichtender Fahrstunden und Prüfungsanforderungen. Zuständige Quelle, konkreten Regelungsstand und Inkrafttreten prüfen. Regierungsentwürfe, parlamentarische Anträge, Verbandsforderungen und geltendes Recht nicht vermischen. Keine angekündigten Kostenersparnisse garantieren.

Keine thematische Quote mit alten oder unbelegten Meldungen erfüllen. Bei vergleichbarer Aktualität und Relevanz unterschiedliche Themen bevorzugen; nicht mehrere Varianten desselben Ereignisses veröffentlichen.

## Tägliche Instagram-Story für den Eigentümer

Nach der Ticker-Recherche genau ein fertiges Story-Bild erstellen und im Aufgaben-Ergebnis bereitstellen; kein automatisches Posten bei Instagram.
- Wichtigste bestätigte, aktive Ticker-Meldung anhand konkreter Auswirkungen, betroffener Zielgruppe, Handlungsbedarf und Aktualität auswählen. Nicht nach Werbepotenzial auswählen.
- Keine neue Nachricht erfinden: an ruhigen Tagen die relevanteste weiterhin gültige Meldung erneut prüfen und mit ehrlichem Stand verwenden. Falls keine verifizierbare aktive Meldung vorliegt, eine schlichte Karte „Heute keine neuen bestätigten Meldungen“ statt einer erfundenen Tagesnews erstellen. Scheitert die Recherche, stattdessen „Aktualitätsprüfung derzeit nicht möglich“ melden.
- Bildgenerierungs-Skill und verfügbares eingebautes Bildwerkzeug verwenden; keine neue kostenpflichtige API, Abos oder lizenzierten Bilder. Bei Tool-/Kontingentfehler den Ausfall melden, nicht behaupten, ein Bild sei erstellt.
- Format 9:16, Ziel 1080 × 1920 Pixel, mobil gut lesbar. Oben/unten jeweils etwa 250 Pixel Sicherheitsabstand, seitlich mindestens 80 Pixel. Sehr schlicht, klare Sans-Serif, viel Freiraum, keine Stockfotos oder Zeitungsausschnitte.
- Bestehende LS-Farben anhand aktueller Gestaltungsdateien übernehmen. Aktuelle Basis: Dunkelblau #062d47, Türkis #65e5df bzw. #007c89, Weiß #ffffff. Keine erfundenen Logos oder SIGNAL-IDUNA-Logos.
- Fester Absender „LANESWITCH informiert:“; kurze eigene Überschrift und höchstens zwei knappe Sätze zur News. Vorschlag/Entwurf/Prognose sichtbar kennzeichnen, wenn zutreffend. Datum/Stand und Quelle als Institution klein, aber lesbar.
- CTA: „Mehr im Newsticker“ und „laneswitch.online · Werkzeuge → Newsticker“. Den passenden vollständigen Link separat zum Bild liefern: https://laneswitch.online/konzept/fahrschulen/#news oder https://laneswitch.online/konzept/fahrschueler/#news. Ein Bild enthält keinen anklickbaren Link: diese URL ist für den Instagram-Link-Sticker bestimmt; keine falschen „Link in Bio“-Behauptungen.
- Nur bei einem tatsächlich vorhandenen und inhaltlich passenden Angebot eine dezente getrennte Zeile „LANESWITCH-Service: …“ ergänzen. Zielseite vorher prüfen und deren Link neben dem Bild liefern. Sonst Servicezeile weglassen. Keine Verknüpfung konstruieren, keine Deckungszusage.
- Rechtschreibung, Fakten, Kontrast, Textumbruch und Ränder kontrollieren. Bild im Aufgaben-Ergebnis ausgeben; zusätzlich gewählte Meldung, Ticker-Link und ggf. Service-Link kurz nennen. Nicht nur einen Bildprompt liefern. Die tägliche Bildausgabe ersetzt die sonst stille Rückmeldung bei ereignisarmen Tagen.
