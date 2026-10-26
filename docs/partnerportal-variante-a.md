# LANE SWITCH – Partnerportal (Variante A)

Status: Technische Testkonzeption. Die Live-Seite auf `laneswitch.de` bleibt bis zur ausdrücklichen Freigabe unverändert.

## Zielbild

LANE SWITCH wird in einen öffentlichen Informationsbereich und zwei getrennt geschützte Servicebereiche gegliedert.

### Öffentlicher Bereich

- Startseite: Konzept, Mehrwerte, Funktionsweise des Partnerzugangs und Hauptaktion „20-Minuten-Kennenlernen“
- Für Fahrschulen: Kooperation, Unterricht, Netzwerk, Versicherungscheck und individuell vereinbarte Tippgebervergütung
- Für Fahrschüler:innen: Überblick zu Unfallabsicherung, erstem Auto und den freigeschalteten digitalen Services
- Partnerzugang: Auswahl zwischen Fahrschüler:innen-Code und persönlichem Fahrschulzugang
- Kontakt, Impressum und Datenschutz

### Geschützter Bereich für Fahrschüler:innen

Zugang mit einem wiederverwendbaren, einer Partnerfahrschule zugeordneten Code.

Vorgesehene Module:

- Fahrzeugkostenrechner
- LANE SWITCH Lernwelt
- Quiz und weitere Orientierungshilfen
- später ergänzbare Rechner und Wissensmodule

Der Code darf von der jeweiligen Fahrschule an ihre Fahrschüler:innen weitergegeben werden. Er schaltet ausschließlich den Fahrschüler:innen-Bereich frei.

### Geschützter Bereich für Fahrschulen

Persönlicher Zugang über eine zuvor freigegebene E-Mail-Adresse und einen zeitlich begrenzten Einmalcode.

Vorgesehene Module:

- Fahrschul-Cockpit
- Fahrschul-Check
- Notfallcenter
- Vorlagen und Partnerunterlagen
- interne Informationen zur Kooperation

Ein Fahrschüler:innen-Code darf niemals Zugang zu internen Fahrschulinhalten gewähren.

## Kostenfreie technische Architektur

- Öffentliche Website: weiterhin GitHub Pages
- Geschütztes Portal: Cloudflare Workers mit statischen Assets
- Partnercodes und Zuordnung: Cloudflare D1
- Persönlicher Fahrschulzugang: Cloudflare Access mit E-Mail-Einmalcode
- Testadresse zuerst über eine kostenlose Cloudflare-Vorschauadresse
- Eigene Subdomain `portal.laneswitch.de` erst nach erfolgreichem Test und ausdrücklicher Freigabe

Die Architektur ist für die erwartete Nutzung innerhalb der kostenlosen Cloudflare-Kontingente ausgelegt. Bei Erreichen eines kostenlosen Limits soll der Dienst kontrolliert stoppen; es wird kein kostenpflichtiger Tarif automatisch vorausgesetzt.

## Sicherheitsregeln

- Partnercodes werden nicht im öffentlichen HTML oder JavaScript hinterlegt.
- In der Datenbank werden Codes nur als kryptografische Hashwerte gespeichert.
- Codes werden nicht über URL-Parameter übertragen.
- Nach erfolgreicher Prüfung wird eine kurzlebige, sichere Sitzung per Cookie angelegt.
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax`.
- Rate-Limit und zeitweilige Sperre nach mehreren Fehlversuchen.
- Jeder Code kann einzeln aktiviert, deaktiviert oder ersetzt werden.
- Interne Fahrschulrouten prüfen zusätzlich die von Cloudflare Access bestätigte E-Mail-Adresse.
- Geschützte Dateien werden nicht parallel unter einer frei erreichbaren GitHub-Pages-URL veröffentlicht.
- Keine Erfassung von Lernantworten, Klarnamen oder Fahrzeugdaten auf dem Server, sofern für die Funktion nicht erforderlich.

## Minimales Datenmodell

### partner_schools

- id
- name
- slug
- status
- created_at

### access_codes

- id
- school_id
- code_hash
- label
- status
- expires_at (optional)
- created_at
- last_used_at (optional, ohne Personenbezug)

### staff_allowlist

- id
- school_id
- email
- status
- created_at

## Geplante Nutzerführung

1. Nutzer:in öffnet „Partnerzugang“.
2. Auswahl:
   - „Ich bin Fahrschüler:in“
   - „Ich arbeite in einer Fahrschule“
3. Fahrschüler:innen geben den Partnercode ihrer Fahrschule ein.
4. Inhaber:innen und Mitarbeitende melden sich mit ihrer freigegebenen E-Mail-Adresse an und erhalten einen Einmalcode.
5. Nach erfolgreicher Prüfung wird nur der passende Portalbereich angezeigt.

## Datenschutz – erforderliche Anpassungen vor Veröffentlichung

Vor der Live-Schaltung werden die Datenschutzhinweise ergänzt um:

- Cloudflare als Hosting-, Sicherheits- und Authentifizierungsdienstleister
- technisch erforderliche Sitzungs-Cookies
- Verarbeitung von IP-Adresse, Geräte-/Browserdaten und Anmeldezeitpunkten zur sicheren Bereitstellung
- Verarbeitung der freigegebenen geschäftlichen E-Mail-Adressen für den Fahrschulzugang
- Zweck, Rechtsgrundlagen, Speicherdauer und Empfänger
- Hinweis, dass Partnercodes keine personenbezogenen Konten für Fahrschüler:innen darstellen
- Auftragsverarbeitung und mögliche Drittlandübermittlungen anhand der tatsächlich aktivierten Cloudflare-Dienste

Ein Cookie-Banner ist für ausschließlich technisch erforderliche Sitzungs-Cookies regelmäßig nicht die passende Lösung; die Cookies müssen transparent in den Datenschutzhinweisen erläutert werden. Diese Einschätzung ersetzt keine individuelle Rechtsberatung.

## Abnahmekriterien

- Öffentliche Seiten erklären Nutzen und Codesystem verständlich.
- Detaillierte Inhalte existieren nur an einer kanonischen Stelle; Teaser verlinken dorthin.
- Inklusive Sprache wird auf allen Seiten konsistent verwendet.
- Lange Überschriften und Fragen bleiben auf Mobilgeräten innerhalb ihrer Karten.
- Ein Fahrschüler:innen-Code öffnet keine Fahrschulmodule.
- Nicht freigegebene E-Mail-Adressen erhalten keinen internen Zugang.
- Direkte URL-Aufrufe geschützter Seiten ohne gültige Sitzung werden abgefangen.
- Abmeldung und Sitzungsablauf funktionieren.
- Keine Codes oder Geheimnisse stehen im Repository.
- Impressum, Datenschutz, Navigation, Video und Kontakt bleiben erreichbar.
