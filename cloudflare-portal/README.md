# LANE SWITCH Partnerportal – Testumgebung

Dieses Verzeichnis enthält die kostenfreie Cloudflare-Pages-Testumgebung für das zweistufige Zugangssystem.

## Zugriffstrennung

- Fahrschüler:innen: wiederverwendbarer Partnercode der Fahrschule, serverseitig über D1 geprüft.
- Fahrschulen: persönliche, freigegebene E-Mail-Adresse und Cloudflare-Access-Einmalcode.
- Ein Fahrschüler:innen-Code kann technisch keine Route unter `/fahrschule/` öffnen.

## Sicherheitsmerkmale

- Keine Klartext-Codes oder Geheimnisse im Repository.
- Codes werden mit einem geheimen Pepper als SHA-256-Hash gespeichert.
- Sitzungen werden mit HMAC-SHA-256 signiert.
- Sitzungs-Cookie: `Secure`, `HttpOnly`, `SameSite=Lax`.
- Maximal zwölf Codeprüfungen pro pseudonymisiertem Anschluss und Zehn-Minuten-Fenster.
- Keine Roh-IP-Adressen in D1.
- Cloudflare-Access-JWTs werden durch das offizielle Pages-Plugin validiert.
- Sicherheitsheader werden global gesetzt.

## Lokaler Test

1. `npm install`
2. `.dev.vars.example` nach `.dev.vars` kopieren und drei unterschiedliche lange Zufallswerte setzen.
3. Lokale Datenbank initialisieren:
   `npx wrangler d1 execute DB --local --file migrations/0001_init.sql`
4. `npm run dev`
5. `npm test`

## Cloudflare Pages – einmalige Einrichtung

1. In Cloudflare unter **Workers & Pages** ein Pages-Projekt aus `Laneswitch26/laneswitch-website` erstellen.
2. Testzweig: `feature/partnerportal-access-v1`.
3. Root-Verzeichnis: `cloudflare-portal`.
4. Build-Ausgabeverzeichnis: `public`.
5. Keine kostenpflichtigen Zusatzprodukte aktivieren.
6. D1-Datenbank `laneswitch-partnerportal` anlegen, Migration anwenden und als `DB` binden.
7. `CODE_PEPPER`, `SESSION_SECRET` und `RATE_LIMIT_SECRET` als verschlüsselte Secrets setzen.
8. Cloudflare Access für `/fahrschule/*` mit freigegebenen E-Mail-Adressen und One-Time PIN konfigurieren.
9. Access-Team-Domain als `ACCESS_DOMAIN` und Application Audience als `ACCESS_AUD` setzen.

Die Testadresse bleibt zunächst eine `*.pages.dev`-Adresse. `laneswitch.de`, `laneswitch.online` und STRATO-DNS werden dabei nicht verändert.

## Partnerfahrschule und Code anlegen

1. Drei Secrets lokal oder in einem sicheren Passwortmanager erzeugen und niemals im Repository speichern.
2. Code und Hash erzeugen: `CODE_PEPPER="..." npm run generate-code`.
3. Nur den ausgegebenen Hash in D1 speichern; den Klartext-Code getrennt an die Fahrschule geben.
4. Beispiel-SQL mit eigenen UUIDs, Namen, Slug und Hash ausführen:

```sql
INSERT INTO partner_schools (id, name, slug, status, created_at)
VALUES ('<UUID>', '<FAHRSCHULE>', '<SLUG>', 'active', unixepoch() * 1000);

INSERT INTO access_codes (id, school_id, code_hash, label, status, created_at)
VALUES ('<UUID>', '<SCHOOL_UUID>', '<CODE_HASH>', 'Fahrschüler:innen-Code', 'active', unixepoch() * 1000);
```

## Noch nicht Bestandteil dieser ersten Teststufe

Die vorhandenen Rechner, Lernmodule und Fahrschulwerkzeuge werden in der ersten Stufe nur verlinkt. Nach erfolgreichem Zugangstest werden ihre aktuellen Dateien in den geschützten Build verschoben und die frei erreichbaren Originalrouten durch Erläuterungs- beziehungsweise Zugangsseiten ersetzt. Erst dann ist die Zugriffsbeschränkung vollständig.
