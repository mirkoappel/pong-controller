# RETROCON

Retro-Spielkonsole im Browser. Smartphone als Controller – kein App-Download, kein Login. QR-Code scannen, losspielen.

**Live:** https://mirkoappel.github.io/retrocon/  
**Repo:** https://github.com/mirkoappel/retrocon

---

## Konzept

RETROCON ist eine **Plattform** für mehrere klassische Retro-Spiele. Die Steuerung erfolgt über Smartphones, die sich per WebRTC (P2P, kein eigener Server) verbinden. Jede Spielsitzung bekommt einen 4-stelligen **Raum-Code** — so können viele Gruppen gleichzeitig spielen, ohne sich gegenseitig zu stören.

Szenario: Alle sitzen vor einem Bildschirm. Laptopscreen = Spielfeld. 1–2 Smartphones als Controller.

---

## Struktur

```
index.html              Boot-Screen (Terminal → RETROCON-Intro → console/)
console/                Host: Setup, Hauptmenü, Game-Loader
controller/             Smartphone-Controller (Plugin-System)
  core.js               Shared: Verbindung, Gamepad-Protokoll, Overlays
  variants/classic/     Default-Variante
games/                  Spielmodule
  pong.js
docs/                   Ausführliche Dokumentation
CHANGELOG.md            Versions-Historie
```

---

## Dokumentation

- [Architektur](docs/architecture.md) — WebRTC, Raum-System, Screen-Flow
- [Spiele](docs/games.md) — Game-Modul-Interface, neues Spiel hinzufügen
- [Controller-Varianten](docs/controller-variants.md) — Plugin-System, Classic-Layout, eigene Variante bauen
- [Gamepad-Protokoll](docs/protocol.md) — JSON-Schema zwischen Controller und Console
- [Changelog](CHANGELOG.md)

---

## Tech-Stack

| Technologie | Zweck |
|---|---|
| PeerJS 1.5.4 | WebRTC-Abstraktion, P2P-Verbindung |
| `0.peerjs.com` | Öffentlicher Signaling-Broker |
| jsQR 1.4.0 | QR-Erkennung im Controller |
| QRCode.js | QR-Generierung in der Console |
| HTML5 Canvas | Spielfeld-Rendering |
| Web Audio API | Retro-Sounds (ohne Audio-Files) |
| Wake Lock API | Smartphone bleibt wach |
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

## Ideen

- Weitere Spiele: Breakout, Snake, Tetris
- Weitere Controller-Varianten: D-Pad-only, SNES-Stil, Arcade-Stick, Minimalist
- Spieler-Status im Hauptmenü (P1/P2 online/offline ohne QR-Screen)
- Lautstärkeregler / Mute
- Pro-Spiel konfigurierbare Tastenbelegung
