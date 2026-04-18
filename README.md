# RETROCON

Retro-Spielkonsole im Browser. Smartphone als Controller – kein App-Download, kein Login. QR-Code scannen, losspielen.

**Live:** https://mirkoappel.github.io/retrocon/  
**Repo:** https://github.com/mirkoappel/retrocon

---

## Konzept

RETROCON ist eine **Plattform** für mehrere klassische Retro-Spiele. Die Steuerung erfolgt über Smartphones, die sich als Controller verbinden. Verbindung läuft über WebRTC (P2P, kein eigener Server). Jede Spielsitzung bekommt einen 4-stelligen **Raum-Code** – so können viele Gruppen gleichzeitig spielen, ohne sich gegenseitig zu stören.

### User Flow

```
index.html             console.html              controller/
────────────           ──────────────────        ───────────────
Boot-Screen       →    Setup-Screen         ←    QR-Code scannen
Terminal-Style         (QR P1 + QR P2)
"PRESS ANY KEY"        ↓ A drücken
RETROCON-Intro         Hauptmenü
                       ├─ PONG starten
                       └─ SPIELER VERBINDEN → QR-Screen
```

### Boot-Sequenz (index.html)

1. **Terminal-Bootloader** läuft automatisch durch (grüne Phosphor-Schrift, klassische BIOS-Zeilen)
2. **„PRESS ANY KEY TO START"** blinkt auf – wartet auf Interaktion
3. **RETROCON-Intro:** Buchstaben poppen einzeln auf (blau, fett, mit Sound) → Weiterleitung zu `console.html`

Die Interaktion in Schritt 2 löst den AudioContext-Unlock, sodass Sounds danach zuverlässig spielen.

### Szenarien

- **Lokal (Standard):** Alle sitzen vor einem Bildschirm. Laptopscreen = Spielfeld. 1–2 Smartphones als Controller.

---

## Architektur

### Warum WebRTC?

GitHub Pages liefert HTTPS → notwendig für Kamera/Sensoren auf iOS/Android. Kein eigener Server nötig. PeerJS übernimmt den Verbindungsaufbau (Signaling), danach läuft alles P2P.

### Raum-System

Jede Console bekommt beim Start einen zufälligen 4-stelligen Code aus dem Alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (keine verwechselbaren Zeichen: 0/O, 1/I/L). Der Code wird als PeerJS Custom ID registriert: `console-XXXX`.

Controller verbinden sich zu `console-XXXX`. Bei Code-Kollision (seltenst) wird automatisch ein neuer Code generiert (bis zu 5 Versuche).

### Datenfluss

```
[Handy/Controller]  ──WebRTC P2P──►  [Laptop/Console]
     controller/                        console.html
         ↑
    QR scannen
```

Controller sendet alle 33ms:
```js
{
  type: 'gamepad',
  player: 1,                          // 1 oder 2
  joystick: { x, y, active },         // -1..+1, active=true wenn berührt
  dpad: { up, down, left, right },    // boolean, aus Joystick-Schwellwert
  a, b, select, start,                // Standard-Buttons
  x, y, l, r                          // Reserve für größere Varianten
}
```

Alle Controller-Varianten senden dasselbe Schema — das Protokoll ist stabil, auch wenn eine Variante einzelne Tasten nicht belegt.

---

## Dateien

```
index.html              Boot-Screen (Terminal-Bootloader → RETROCON-Intro → console.html)
console.html            Host: Setup-Screen, Hauptmenü, Game-Loader
controller/
  index.html            Redirect-Stub → aktuelle Variante (Code aus URL durchgereicht)
  core.js               Shared: Verbindung, Gamepad-Protokoll, Scan-/Picker-Overlays
  variants/
    classic/            Default-Variante: Joystick + A/B + Menü/Gear/Wifi
      index.html
      style.css
      app.js
games/
  pong.js               Pong als Spielmodul
README.md
```

### Screen-System (console.html)

| Screen | Beschreibung |
|---|---|
| `setup` | Initaler Screen. Zeigt QR-Codes für P1 und P2. Hint: „SCANNE DEN QR-CODE MIT DEINEM HANDY" → nach Connect: „DRÜCKE A ZUM STARTEN" |
| `main-menu` | Spielauswahl. Navigation per Joystick/D-Pad, Bestätigung per A. |
| `game-view` | Laufendes Spiel im Canvas. SELECT → zurück zum Menü. |

Menünavigation: Jeder verbundene Controller kann das Menü steuern.

### Game-Modul Interface

Jedes Spiel in `games/` registriert sich als `window.RetroGames.name`:

```js
window.RetroGames.pong = {
  name: 'Pong',
  minPlayers: 1,
  maxPlayers: 2,
  create(ctx, W, H, numPlayers, api) {
    // api.exit()        → zurück zum Hauptmenü
    // api.getConns()    → Map(player → conn), verbundene Controller
    // api.code          → Raum-Code
    return {
      input(player, gamepad, prevGamepad) {},   // Eingabe verarbeiten
      update(dt) {},                             // Spiellogik (dt in Sekunden)
      draw() {},                                 // Rendering auf ctx
      resize(w, h) {},                           // Canvas-Größe geändert
      destroy() {},                              // Aufräumen (Audio etc.)
      onDisconnect(player) {}                    // Controller getrennt
    };
  }
};
```

SELECT auf einem Controller → `api.exit()` = zurück zum Menü.

---

## Controller-UI

`controller/` ist ein Plugin-System für austauschbare Gamepad-Layouts. `core.js` kapselt alles Gemeinsame (Verbindung, Senden, Overlays), jede Variante liefert ihr eigenes Layout + ihre eigene Input-Logik.

### Routing

| URL | Verhalten |
|---|---|
| `controller/?code=AB23&player=1` | Redirect zur aktuell gewählten Variante (LocalStorage) mit Code durchgereicht |
| `controller/variants/classic/?code=AB23&player=1` | Variante direkt, verbindet automatisch |
| `controller/variants/classic/` (ohne Code) | Variante öffnet, LED rot — Wifi-Button öffnet QR-Scan zum Verbinden |

### Variant „Classic" (Default)

Layout (Querformat):
- **Links:** Analoger Joystick (fixer Mittelpunkt, Rücksprung)
- **Mitte unten:** Home (= SELECT, zurück ins Menü) · Gear (Variant-Picker) · Wifi (QR-Scan)
- **Rechts:** A- und B-Button in Mulden, diagonal versetzt
- **LED oben rechts:** Grün = verbunden, Rot = getrennt

Wifi-Icon leuchtet zusätzlich grün wenn verbunden — doppelte Status-Anzeige ohne Platz zu kosten.

### Neue Variante hinzufügen

1. Ordner `controller/variants/<id>/` anlegen mit `index.html`, `style.css`, `app.js`
2. In `index.html` `core.js` + `app.js` laden, gewünschte Button-IDs ins DOM
3. In `app.js`: `RC.bindBtn('id', 'key')` + eigene Joystick-/Touch-Logik, dann `RC.init()`
4. Eintrag in `VARIANTS`-Array in `core.js` ergänzen

Alle Varianten sprechen dasselbe Gamepad-Protokoll, sind also mit jedem Spiel kompatibel. Der Nutzer wechselt Varianten über den Gear-Button im Controller selbst — die Wahl steckt in `localStorage` und gilt für alle Räume.

### Skins

Innerhalb einer Variante steuern CSS-Custom-Properties die Farben (Gehäuse, Akzent, Mulden). Classic liefert `crimson` (Default), `emerald`, `cobalt`, `mono` — per `<body class="skin-xyz">` umschaltbar.

---

## Verwendete Technologien

| Technologie | Zweck |
|---|---|
| PeerJS 1.5.4 | WebRTC-Abstraktion, P2P-Verbindung |
| `0.peerjs.com` | Öffentlicher Signaling-Broker |
| jsQR 1.4.0 | QR-Code-Erkennung im Controller |
| QRCode.js | QR-Code-Generierung im Console-Screen |
| HTML5 Canvas | Spielfeld-Rendering |
| Web Audio API | Retro-Sounds (kein Audio-File nötig) |
| Wake Lock API | Verhindert Schlafmodus auf Smartphones |
| GitHub Pages | Hosting (HTTPS, statisch, kostenlos) |

---

## Deployment

```bash
git add .
git commit -m "Beschreibung"
git push
# GitHub Pages aktualisiert automatisch nach ~30 Sekunden
```

---

## Bekannte Einschränkungen

- **PeerJS Public Broker** (`0.peerjs.com`): kein SLA, Community-Dienst. Bei Ausfall: eigenen Broker hosten oder wechseln.
- **Audio-Autoplay:** Browser blockieren Audio ohne User-Gesture. Gelöst durch Boot-Screen-Klick (index.html) und AudioContext-Erstellung im Spielstart-Klick (games/).
- **iOS Querformat:** Controller erfordert Querformat. Portrait zeigt Dreh-Hinweis.
- **Raum-Code wechselt** bei Seiten-Reload → Controller müssen neu scannen.

---

## Nächste Schritte / Ideen

- **Weitere Spiele:** Breakout, Snake, Tetris – selbe Controller-Infrastruktur, neues `games/xxx.js`
- **Weitere Controller-Varianten:** D-Pad-only, SNES-Stil mit X/Y/L/R, Arcade-Stick, Minimalist (Touchfläche)
- **Spieler-Status im Hauptmenü:** Kleine Indikatoren P1/P2 online/offline sichtbar ohne QR-Screen
- **Sound-Verfeinerung:** Lautstärkeregler, Mute-Option
- **Controller-Anpassung:** Tastenbelegung je Spiel konfigurierbar
