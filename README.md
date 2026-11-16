# SpeedType — Neon Multiplayer Typing Race

Eine responsive Typing-Race-Web-App für iPad, iPhone und Desktop. Hosting über GitHub Pages, Echtzeit-Multiplayer über Supabase Realtime. Bis zu 10 Personen pro Raum, ohne Benutzerkonto.

## Funktionen

- Räume erstellen und mit einem sechsstelligen Code teilen
- Bis zu 10 Spieler pro Lobby
- Live-Countdown, Tipptext und Fortschrittsanzeige
- Live-Rangliste mit WPM und Genauigkeit
- Drei Text-Schwierigkeitsstufen
- iPad-freundliche Oberfläche; externe Tastatur oder Bildschirmtastatur
- Keine Anmeldung: Spieler geben nur einen Anzeigenamen ein

## 1. Supabase einrichten (kostenloser Einstieg möglich)

1. Öffne [supabase.com](https://supabase.com/) und erstelle ein Projekt.
2. Öffne im Projekt **Project Settings → API**.
3. Kopiere die **Project URL** und den **anon / publishable key**.
4. Öffne `app.js` und ersetze:

```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

mit deinen echten Werten. Beispiel-Form (keine echten Zugangsdaten verwenden):

```js
const SUPABASE_URL = "https://deinprojekt.supabase.co";
const SUPABASE_ANON_KEY = "dein-public-anon-key";
```

Der anon/publishable Key ist für die Verwendung im Browser vorgesehen. **Niemals** einen `service_role`-Key in diese Website eintragen.

### Realtime aktivieren

Supabase Realtime ist für Channels standardmäßig verfügbar. Die App verwendet Presence zum Erkennen der Spieler und Broadcast für Start, Fortschritt und Zielankunft. Es ist keine Datenbanktabelle und keine SQL-Migration erforderlich.

> Hinweis: Räume sind temporär und leben, solange Spieler verbunden sind. Ein Raumcode ist keine Authentifizierung. Teile ihn nur mit Personen, die mitspielen sollen. Für eine öffentliche, missbrauchsresistente Version wären serverseitige Validierung, Rate-Limits und eine vertrauenswürdige Host-Rolle sinnvoll.

## 2. Auf GitHub veröffentlichen

1. Melde dich bei [github.com](https://github.com/) an.
2. Erstelle ein neues Repository, z. B. `speedtype`.
3. Lade alle Projektdateien (`index.html`, `styles.css`, `app.js`, `README.md`) in das Repository hoch. `index.html` muss im Hauptverzeichnis liegen.
4. Öffne im Repository **Settings → Pages**.
5. Unter **Build and deployment** wähle **Deploy from a branch**.
6. Wähle Branch `main`, Ordner `/ (root)` und speichere.
7. Warte kurz. GitHub zeigt dir deine Website-Adresse an, üblicherweise `https://DEIN-NAME.github.io/speedtype/`.

## 3. Auf dem iPad öffnen

1. Öffne die GitHub-Pages-Adresse in Safari.
2. Tippe auf **Teilen → Zum Home-Bildschirm**.
3. Starte SpeedType wie eine App vom Home-Bildschirm.
4. Für längere Rennen empfiehlt sich eine externe Bluetooth-Tastatur. Die iPad-Bildschirmtastatur funktioniert ebenfalls.

## So spielt ihr

- Host erstellt eine Lobby und teilt den Raumcode.
- Freunde öffnen die Website, tragen ihren Namen und den Code ein.
- Der Host wählt das Level und startet das Rennen.
- Alle verbundenen Spieler erhalten denselben Text und einen synchronisierten Startzeitpunkt.
- Die Rangliste aktualisiert sich während des Tippens.

## Grenzen / wichtige Hinweise

- Die App ist ein Frontend-Projekt mit Supabase Realtime. Eine aktive Internetverbindung ist für Multiplayer erforderlich.
- GitHub Pages hostet nur die statischen Dateien; Supabase übernimmt die Echtzeitkommunikation.
- Das aktuelle Grundgerüst vertraut auf die Browser-Clients. Ein technisch versierter Teilnehmer könnte Events manipulieren. Für ein öffentliches Turniersystem sollte ein Edge Function/Server die Rennen validieren.
- Wenn jemand die Seite schließt oder die Verbindung verliert, verschwindet der Spieler aus Presence.
- Das Projekt ist ein Starterprojekt: vor öffentlicher Nutzung bitte auf mehreren Geräten und Browsern testen.

## Dateien

- `index.html` — Oberfläche und Seitenstruktur
- `styles.css` — Neon-Design und responsive Layout
- `app.js` — Lobby, Presence, Broadcast, Tipp-Logik und Rangliste

## Lizenz

MIT — siehe `LICENSE`.
