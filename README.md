# RETROCON

Retro-Spielkonsole im Browser. Smartphone als Controller – kein App-Download, kein Login. QR-Code scannen, losspielen.

**Live:** https://mirkoappel.github.io/retrocon/  
**Repo:** https://github.com/mirkoappel/retrocon

---

## Konzept

RETROCON ist eine **Plattform** für mehrere klassische Retro-Spiele. Die Steuerung erfolgt über Smartphones, die sich als Controller verbinden. Verbindung läuft über WebRTC (P2P, kein eigener Server). Jede Spielsitzung bekommt einen 4-stelligen **Raum-Code** – so können viele Gruppen gleichzeitig spielen, ohne sich gegenseitig zu stören.

### User Flow

```
index.html          console.html              controller.html
────────────        ──────────────────        ───────────────
Boot-Screen    →    Setup-Screen         ←    QR scannen
(CSS-Konsole)       (QR P1 + QR P2)          oder Code tippen
Klicken             ↓ A drücken
                    Hauptmenü
                    ├─ PONG starten
                    └─ SPIELER VERBINDEN → QR-Screen
```

### Szenarien

- **Lokal (Standard):** Alle sitzen vor einem Bildschirm. Laptopscreen = Spielfeld. 1–2 Smartphones als Controller.
- **Remote (geplant):** Jeder Spieler hat eigenen Bildschirm. Beide Bildschirme zeigen denselben Spielstand (noch nicht implementiert).

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
     controller.html                     console.html
         ↑
    QR scannen oder
    Code eintippen
```

Controller sendet alle 33ms:
```js
{
  type: 'gamepad',
  player: 1,                          // 1 oder 2
  joystick: { x, y, active },         // -1..+1, active=true wenn berührt
  dpad: { up, down, left, right },    // boolean, aus Joystick-Schwellwert
  a: false, b: false,
  select: false, start: false
}
```

---

## Dateien

```
index.html          Boot-Screen (CSS-Konsole, Klick → Boot-Animation → console.html)
console.html        Host: Raum-Erstellung, Setup-Screen, Hauptmenü, Game-Loader
controller.html     Gamepad: Analoger Joystick + A/B/SELECT/START, QR-Scanner
games/
  pong.js           Pong als Spielmodul
README.md
```

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

SELECT auf P1 → `api.exit()` aufrufen = zurück zum Menü.

---

## Controller-UI

`controller.html` öffnet je nach URL-Parameter in zwei Modi:

| URL | Verhalten |
|---|---|
| `controller.html?code=AB23&player=1` | Direkt verbinden (via QR-Scan) |
| `controller.html` (ohne Params) | Code-Eingabe-Screen mit QR-Scanner |

Layout (Querformat):
- **Links:** Analoger Joystick (fixer Mittelpunkt, Rücksprung)
- **Mitte:** SELECT · START · QR (Reconnect-Scan)
- **Rechts:** A- und B-Button (diagonal versetzt)
- **LED oben rechts:** Grün = verbunden, Rot = getrennt

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
- **Spieler-Status im Hauptmenü:** Kleine Indikatoren P1/P2 online/offline sichtbar ohne QR-Screen
- **Sound-Verfeinerung:** Lautstärkeregler, Mute-Option
- **Remote-Modus:** Zweiter Browser-Tab/Laptop empfängt Spielzustand (WebRTC Broadcast vom Host)
- **Controller-Anpassung:** Tastenbelegung je Spiel konfigurierbar
