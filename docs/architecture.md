# Architektur

## Warum WebRTC?

GitHub Pages liefert HTTPS → notwendig für Kamera/Sensoren auf iOS/Android. Kein eigener Server nötig. PeerJS übernimmt den Verbindungsaufbau (Signaling), danach läuft alles P2P zwischen Laptop und Smartphones.

## Raum-System

Jede Console bekommt beim Start einen zufälligen 4-stelligen Code aus dem Alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — ohne verwechselbare Zeichen (0/O, 1/I/L). Der Code wird als PeerJS Custom ID registriert: `console-XXXX`.

Controller verbinden sich zu `console-XXXX`. Bei Code-Kollision wird automatisch ein neuer Code generiert (bis zu 5 Versuche).

## Datenfluss

```
[Handy/Controller]  ──WebRTC P2P──►  [Laptop/Console]
     controller/                        console/
         ↑
    QR scannen
```

## Screen-System (console/)

| Screen | Beschreibung |
|---|---|
| `setup` | Initialer Screen. Titel „VERBINDE DEIN SMARTPHONE ALS GAME-CONTROLLER", zwei QR-Codes (P1/P2), einheitlicher Status „WARTE AUF VERBINDUNG" → nach Connect: „DRÜCKE A ZUM STARTEN". |
| `main-menu` | Horizontales Karussell mit Game-Cards + vertikale Legende. Joystick/D-Pad links/rechts wechselt Spiel, unten springt in die Legende, A aktiviert, B öffnet Setup. |
| `game-view` | Laufendes Spiel im Canvas. SELECT → zurück zum Menü. |

Menünavigation: jeder verbundene Controller kann das Menü steuern. Die Game-Card-Vorschau kommt pro Spiel als `artSvg` aus dem Spielmodul.

## Bekannte Einschränkungen

- **PeerJS Public Broker** (`0.peerjs.com`): kein SLA, Community-Dienst. Bei Ausfall eigenen Broker hosten oder wechseln.
- **Audio-Autoplay:** Browser blockieren Audio ohne User-Gesture. Gelöst durch Boot-Screen-Klick und AudioContext-Erstellung beim Spielstart.
- **iOS Querformat:** Controller erfordert Querformat. Portrait zeigt Dreh-Hinweis.
- **Raum-Code wechselt** bei Seiten-Reload → Controller müssen neu scannen.
