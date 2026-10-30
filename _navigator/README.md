# LANE SWITCH Navigator: Veröffentlichung ohne Browser-Login

## Status

Der eigenständige Worker `laneswitch-navigator` ist über `https://laneswitch.online/navigator/zugang` erreichbar. Nur `/navigator/*` und `/api/navigator*` werden dem Worker zugeordnet. Die Hauptwebsite bleibt Cloudflare Pages auf dem Branch `cloudflare-online`. `laneswitch.de` wird über GitHub Pages auf `main` bereitgestellt; dessen separater Zugang leitet auf die eigene Domain `laneswitch.online` weiter. Eine direkte Worker-Route für `.de` ist nicht eingerichtet, da die Zone im zugänglichen Cloudflare-Konto nicht sichtbar ist.

Die öffentliche Profilerkennung darf ausschließlich für `GET action=public` von `https://laneswitch.de` gelesen werden. Anmelde-Cookies werden dabei nicht übertragen; private API-Abfragen und Schreibaktionen erhalten keine domainübergreifende Freigabe. Beide Fahrschulprofile verwenden denselben Navigator-Datenbestand. Der Editor ist in keiner Hauptnavigation verlinkt.

## Einmalig: drei GitHub-Secrets hinterlegen

Repository → Settings → Secrets and variables → Actions → New repository secret:

1. `CLOUDFLARE_API_TOKEN`: Cloudflare-API-Token, beschränkt auf das bestehende Konto. Konto-Berechtigungen: **Workers Scripts: Edit**, **D1: Edit**, **Account Settings: Read**. Für die Domain-Zuordnung zusätzlich Zone Read, DNS Read und Workers Routes Edit, auf die betreffende Domain beschränkt. Keine DNS-Schreib- oder Abrechnungsrechte erforderlich. Die Konto-ID ist bereits aus den bestehenden Cloudflare-GitHub-Prüfergebnissen übernommen. Ein Token ist ein geheimer technischer Zugang, kein Cloudflare-Passwort.
2. `NAV_A1_PASSWORD`: eigenes Passwort für A1, 16–200 Zeichen.
3. `NAV_EMRE_PASSWORD`: anderes Passwort für Emre, 16–200 Zeichen.
4. `NAV_TEST_PASSWORD` (optional): eigenes Passwort für das Testkonto `test`, 16–200 Zeichen. Ohne dieses Secret wird kein Testkonto angelegt.

Für die bestehenden Fahrschulkonten können dieselben zuvor vergebenen Passwörter verwendet werden, sofern sie die Länge erfüllen. Passwörter und Token niemals in Issues, Pull Requests, Chat oder Dateien eintragen. Das Testkonto mit Benutzername `test` wird nur angelegt, wenn `NAV_TEST_PASSWORD` gesetzt ist. Es darf keine Inhalte veröffentlichen.

API-Token im eigenen Cloudflare-Browser anlegen. Diese lokale Anmeldung überträgt keine Sitzung an ChatGPT. Der Token wird direkt bei GitHub hinterlegt; ChatGPT braucht seinen Wert nicht.

## Starten

GitHub → Actions → **Navigator · Cloudflare** → Run workflow → Branch `main` → `deploy` aktivieren.

Der Workflow prüft und baut zunächst ohne Secrets. Nur nach erfolgreichen Tests werden die Secrets an den separaten Deployment-Job übergeben. Pull Requests können keinen Deployment-Job starten. Das Skript prüft das Konto, erstellt bzw. verwendet ausschließlich `laneswitch-navigator-eu` mit Jurisdiktion `eu`, wendet versionierte Migrationen an und veröffentlicht Code plus gehashte Konten in einem Schritt. Die Hash-Registry wird kurzzeitig in einer Datei mit Modus 0600 außerhalb des Repositorys auf dem temporären GitHub-Runner abgelegt und auch bei Fehlern gelöscht. Klartextpasswörter werden nicht in diese Datei geschrieben. Abschließend werden die Anmeldung, die richtige Kontozuordnung und die Abmeldung aller eingerichteten Zugänge am echten Server geprüft. Die technische Testadresse erscheint im Workflow-Ergebnis.

Der Vorgang aktiviert keinen kostenpflichtigen Tarif. Bereits vorhandene Konto-/Tarifbedingungen müssen vor dem ersten Lauf geprüft werden; das Skript kann den Abrechnungsstatus mit dem eingeschränkten Token nicht bestätigen. Free-Tarife haben Nutzungsgrenzen und sind kein unbegrenztes Verfügbarkeitsversprechen.

Ein gezielt autorisierter Commit mit `[deploy navigator]` in der Commit-Nachricht kann ebenfalls einmalig veröffentlichen. Normale Commits veröffentlichen standardmäßig nicht.

Nach erfolgreicher Einrichtung optional Repository-Variable `NAVIGATOR_DEPLOY_ENABLED=true` setzen, um Änderungen auf `main` automatisch zu veröffentlichen. Bei jeder Veröffentlichung werden neue Salts erzeugt; bestehende Anmeldesitzungen werden dadurch ungültig. Inhalte und Uploads bleiben in D1 erhalten. Die alten Daten aus der ChatGPT-gehosteten Version werden nicht automatisch übertragen.

## Eigene Domains aktivieren

`routes.json` enthält die beiden geprüften Pfade für `laneswitch.online`. Vor Änderungen an den Domains müssen die aktiven Cloudflare-Zonen, der Proxy-Status, bestehende Worker-Routen und die bestehende Website-Zustellung geprüft werden. Eine Route funktioniert nur mit einer passenden aktiven Cloudflare-Zone und vorgeschaltetem Cloudflare-Proxy. Keine vorhandenen DNS-Ziele blind ersetzen.

Nach bestätigter Konfiguration nur diese Pfade dem Navigator zuweisen (jeweils mit `zone_name` der entsprechenden Domain in `routes.json`):

- `laneswitch.de/navigator/*`
- `laneswitch.de/api/navigator*`
- `laneswitch.online/navigator/*`
- `laneswitch.online/api/navigator*`

Hierfür benötigt der Token gezielt **Zone: Zone Read**, **Zone: DNS Read** und **Zone: Workers Routes Edit** für genau diese beiden Zonen benötigen. DNS-Bearbeitung ist kein Bestandteil dieses Workflows. Routen im Repository pflegen, nicht ausschließlich im Dashboard, da der nächste Deploy die Konfiguration aus `routes.json` verwendet.

Anschließend `assets/partner-navigator.js` auf gleichursprüngliche `/api/navigator`- und `/navigator/…`-Pfade umstellen. Die alte Weiterleitung in `navigator/zugang/index.html` kann entfernt werden, sobald beide Worker-Routen nachweislich antworten. Im Hauptmenü und in der Sitemap wird kein Editorlink ergänzt.

Die beiden gewünschten Links sind erst nach dieser Prüfung produktiv:

- `https://laneswitch.de/navigator/zugang`
- `https://laneswitch.online/navigator/zugang`

Vor Abschluss: beide URLs ohne Weiterleitung auf Fremdhosts, drei Anmeldungen, A1/Emre-Kontentrennung, Uploads, unveröffentlichte Entwürfe, Test-Publikationssperre, Profilzuordnung, PDF/QR sowie Mobil-/Desktopansicht prüfen. Bei Service-Workern dürfen `/navigator/` und `/api/navigator` nicht offline zwischengespeichert werden.

## Editor: Zwischenspeichern und Datenübernahme

- Der Entwurf wird 2,5 Sekunden nach der letzten Änderung automatisch über die bestehende Aktion `save` gespeichert (kein neuer Server-Endpunkt, keine Speicherung im Browser). Status oben rechts; bei ungültigen Angaben (z. B. Website ohne `https://`) erscheint ein Hinweis, ohne dass Eingaben verloren gehen. Ungespeicherte Änderungen lösen beim Verlassen der Seite eine Browser-Warnung aus.
- Läuft die Anmeldung (8 Stunden) ab, bleiben die Eingaben im Editor; nach erneuter Anmeldung im selben Fahrschulzugang wird gespeichert. Ein anderer Zugang wird abgewiesen.
- Beim Öffnen springt der Editor zum ersten noch offenen Schritt.
- „Bekannte Angaben übernehmen“ (Schritt Profil) nutzt `app/navigator/known.ts`: öffentliche Grunddaten aus den Partnerprofilen auf laneswitch.online. Leere Felder werden gefüllt; bei abweichenden eigenen Einträgen wird gefragt. Alles bleibt editierbar. **Bei Änderungen an den Partnerprofilen `known.ts` mitpflegen.** Der Testzugang erhält erkennbar fiktive Beispielwerte.
- `/navigator/<schule>?download=pdf` startet den PDF-Download der veröffentlichten Ausgabe direkt (Link auf den Partnerprofilen). Dateiname: `Fahrschul-Navigator-<Name>.pdf`.

## Admin, Einladungen, Registrierung und Partner-Vorteile

**Einrichtung (einmalig):** GitHub → Settings → Secrets → Actions:
- `NAV_ADMIN_PASSWORD`: eigenes Admin-Passwort, 16–200 Zeichen, anders als alle Fahrschul-Passwörter.
- `NAV_ADMIN_USER` (optional): Admin-Benutzername, Standard `admin`.
Danach „Navigator · Cloudflare“ mit `deploy` ausführen. Ohne `NAV_ADMIN_PASSWORD` gibt es keinen Admin-Zugang; alles andere läuft wie bisher.

**Admin-Bereich:** `/navigator/admin` (Anmeldung mit dem Admin-Zugang; meldet sich der Admin unter `/navigator/zugang` an, wird er dorthin weitergeleitet).
- *Einladungen:* Name der Fahrschule und Kürzel für Rabattcodes eingeben → Einmal-Link (Standard 14 Tage). Der Schlüssel steht hinter `#` und erreicht so keine Server-Protokolle; gespeichert wird nur sein Hash. Je Fahrschule ist nur ein Link offen; widerrufbar.
- *Fahrschulen:* registrierte Fahrschulen freigeben (erst dann öffentlich unter `/navigator/<adresse>` und im Verzeichnis), Freigabe entziehen, sperren (beendet Sitzungen, nicht mehr öffentlich) oder einen neuen Zugangslink erzeugen (z. B. Passwort vergessen; Inhalte bleiben, alte Zugangsdaten und Sitzungen werden ungültig). A1, Emre und Test bleiben feste Konten über die bisherigen Secrets.
- *Partnerfirmen:* Name, Kürzel, Rabatt, Leistungen, Vorteile, Bedingungen, Kontakt, Logo, aktiv/inaktiv. Codes entstehen automatisch: `FIRMENKÜRZEL-FAHRSCHULKÜRZEL-RABATT`, z. B. `EINGEPRAEGT-A1-5`. Je Firma lässt sich die Codeliste kopieren und an die Firma weitergeben.

**Kooperationsanfragen:** Auf `/navigator/zugang` gibt es neben „Anmelden“ den Reiter „Kooperation anfragen“ (direkt verlinkbar mit `/navigator/zugang#anfrage`, auf laneswitch.online im Website-Header über „Fahrschul-Login“ erreichbar). Fahrschulen ohne Zugang senden Name, Ansprechperson, E-Mail und optional Telefon, Ort und Nachricht. Es entsteht **kein** Konto; die Anfrage erscheint im Admin-Bereich unter „Anfragen“ (erledigt markieren, löschen, „Einladung vorbereiten“ übernimmt den Namen in das Einladungsformular). Schutz: max. 5 Anfragen je IP in 15 Minuten, unsichtbares Bot-Feld, höchstens 300 offene Anfragen. Tabelle `nav_requests` (Migration `drizzle/0003_kooperationsanfragen.sql`).

**Registrierung:** `/navigator/registrierung#<schlüssel>` – Benutzername (3–40 Zeichen) und Passwort (mind. 12 Zeichen) wählt die Fahrschule selbst; Passwörter werden mit PBKDF2 gehasht in D1 gespeichert. Danach landet sie im Editor; der Name ist vorausgefüllt.

**Vorteile für Fahrschulen:** Menüpunkt „Deine Vorteile“ im Editor zeigt aktive Partnerfirmen mit dem eigenen Code.

**Öffentliches Verzeichnis:** `GET /api/navigator?action=directory` liefert freigegebene, veröffentlichte und im Profil verlinkte registrierte Fahrschulen (für die Fahrschul-Übersicht auf laneswitch.online).

**Daten:** Migration `drizzle/0002_registrierung.sql` (`nav_schools`, `nav_accounts`, `nav_invites`, `nav_partners`), wird beim Deploy automatisch angewendet. Tests: `tests/registration.test.mjs`.

## Sicherheit und Datenschutz

Kein Schülerdatenschema. Ausschließlich allgemeine Fahrschulinformationen; keine Schülerlisten oder Verträge mit personenbezogenen Schülerangaben hochladen. Uploadinhalte werden nicht automatisch auf personenbezogene Angaben oder Schadsoftware untersucht. Öffentliche Geschäftskontaktdaten können trotzdem personenbezogen sein. Eine EU-Datenbank allein bestätigt daher keine vollständige DSGVO-Konformität; Betreiberhinweise, Auftragsverarbeitung und Löschprozesse bleiben zu prüfen. EU-Jurisdiktion bindet die Datenbank, nicht die gesamte weltweite Request-Verarbeitung.

Die Anwendung schützt gespeicherte Inhalte serverseitig: PBKDF2-Hashes, achtstündige Secure-/HttpOnly-/SameSite-Strict-Sessions, CSRF-/Origin-Prüfung, Rate-Limits, feste serverseitige Fahrschulzuordnung, separate Entwürfe und Veröffentlichungen, begrenzte Dateien, `no-store`, `noindex`, CSP und Einbettungsschutz. Der sichtbare Loginbildschirm enthält keine vertraulichen Daten. Ein geheimer Link allein ist keine Zugriffssicherung.

Neue Schulen benötigen einen neuen eindeutigen Schulschlüssel in der serverseitigen Zulassung, einen separaten Registry-Eintrag und die feste Zuordnung ihres öffentlichen Profils. Niemals die Zuordnung aus einem Formularfeld übernehmen. Die Konfiguration ist bewusst für A1, Emre und Test vorbelegt.

## Lokal prüfen

```sh
cd _navigator
npm ci
npm run check
```

Die Tests prüfen den produktiven Worker mit Miniflare/D1 sowie Mandantentrennung, Dateizugriff, CSRF, Limits und Veröffentlichung. `wrangler deploy --dry-run` prüft das Paket ohne Veröffentlichung. Der Commit enthält keine Zugangsdaten.

Offizielle Grundlagen:
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://developers.cloudflare.com/d1/configuration/data-location/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/configuration/routing/routes/
