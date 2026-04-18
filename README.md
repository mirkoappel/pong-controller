# Pong – Handy als Controller

Browser-Spiel, das per Smartphone-Neigung gesteuert wird. Kein App-Download, kein Login – einfach QR-Code scannen und spielen.

**Live:** https://mirkoappel.github.io/pong-controller/

---

## Idee & Ziel

Evaluation: **Smartphone als Browser-Gamepad** – wie gut funktioniert das in der Praxis?

Pong ist der erste Testfall. Das Ziel ist nicht das Spiel selbst, sondern die Frage: Wie zuverlässig, wie intuitiv und wie reibungslos lässt sich ein Handy als Controller einsetzen – ohne App-Installation, ohne Konfiguration, einfach QR-Code scannen und losspielen?

Konkret wird evaluiert:
- Verbindungsaufbau (QR → WebRTC → spielbereit, wie lange, wie stabil?)
- Latenz (Neigung → Paddle-Reaktion, spürbare Verzögerung?)
- Gyro-Steuerung (intuitiv? ermüdend? kalibrierungsbedarf?)
- Gerätekompatibilität (iOS vs. Android, verschiedene Browser)

Wenn das Konzept funktioniert, können weitere klassische Retro-Spiele (Breakout, Snake, Tetris, ...) mit derselben Controller-Infrastruktur umgesetzt werden.

---

## So funktioniert es

1. Spielfeld auf Laptop/Desktop öffnen: https://mirkoappel.github.io/pong-controller/
2. Spielmodus wählen: **1 Spieler** (gegen KI) oder **2 Spieler**
3. QR-Code mit dem Handy scannen (gleiches WLAN oder Mobilfunk)
4. Handy links/rechts neigen → Paddle bewegt sich hoch/runter
5. Sobald alle Spieler verbunden: Countdown, Spiel startet

---

## Architektur

### Warum WebRTC statt lokalem Server?

**Problem:** iOS erlaubt den Gyrosensor (`DeviceOrientationEvent`) nur über HTTPS. Ein lokaler Node.js-Server liefert aber nur HTTP. Außerdem müsste die macOS-Firewall konfiguriert werden.

**Lösung:** Statische Dateien auf GitHub Pages (automatisch HTTPS) + WebRTC für die Gerät-zu-Gerät-Kommunikation.

### Datenfluss

```
[Handy] ──WebRTC──> [Laptop/Browser]
         PeerJS-Broker
         (nur Verbindungsaufbau,
          Daten fließen direkt P2P)
```

1. Spielfeld öffnet eine PeerJS-Verbindung → bekommt eine zufällige Peer-ID
2. QR-Code enthält Controller-URL mit dieser ID: `controller.html?peer=ID&player=1`
3. Handy scannt → öffnet Controller-Seite → verbindet direkt zum Spielfeld via WebRTC
4. Handy sendet alle 33ms Tilt-Daten: `{ type: 'tilt', player: 1, gamma: 23.4 }`
5. Spielfeld empfängt und bewegt das Paddle

### Verwendete Technologien

| Technologie | Zweck |
|---|---|
| HTML5 Canvas | Spielfeld-Rendering |
| PeerJS 1.5.4 | WebRTC-Abstraktion, P2P-Verbindung |
| `0.peerjs.com` | Öffentlicher Signaling-Broker (kostenlos, kein Account) |
| `DeviceOrientationEvent` | Gyrosensor auf dem Handy |
| GitHub Pages | Hosting (kostenlos, HTTPS, statisch) |
| QRCode.js 1.0.0 | QR-Code-Generierung im Browser |

### Gyrosensor-Mapping

```
Handy-Neigung (gamma)     Paddle
-45° (links kippen)  →   ganz oben
  0° (gerade)        →   Mitte
+45° (rechts kippen) →   ganz unten
```

`gamma` = links/rechts-Achse des Geräts, Wertebereich -90 bis +90 Grad.  
iOS erfordert `DeviceOrientationEvent.requestPermission()` → Button auf der Controller-Seite.

---

## Dateien

```
deploy/
├── index.html        # Spielfeld (Pong, Canvas, PeerJS-Host)
└── controller.html   # Handy-Seite (Gyro, PeerJS-Client, Paddle-Vorschau)
```

**Kein Server notwendig.** Beide Dateien sind rein statisch.

### Lokale Version (veraltet, nur zur Referenz)

Im übergeordneten Ordner liegt noch eine WebSocket-basierte Version:
```
public/
├── game.html
└── controller.html
server.js             # Node.js + ws
package.json
```
Diese läuft lokal mit `node server.js`, funktioniert aber nicht auf iOS (kein HTTPS).

---

## Deployment

Das Repo ist auf GitHub Pages konfiguriert (Branch: `main`, Pfad: `/`).

```bash
# Änderungen deployen:
cd deploy/
git add .
git commit -m "Beschreibung"
git push
# GitHub Pages aktualisiert automatisch nach ~30 Sekunden
```

GitHub Repo: https://github.com/mirkoappel/pong-controller

---

## Bekannte Einschränkungen

- **PeerJS Public Broker** (`0.peerjs.com`): kostenloser Community-Dienst, kein SLA. Läuft seit 2014 stabil, aber keine Garantie. Bei Ausfall: eigenen Broker hosten (20-Zeilen Node.js-Script) oder auf anderen wechseln.
- **iOS Permission-Button**: iPhone/iPad zeigt beim ersten Mal einen "Bewegung erlauben"-Button, bevor der Gyro funktioniert. Einmaliger Klick, danach direkt.
- **Peer-ID wechselt** bei jedem Seitenneuladen des Spielfelds → QR-Code wird neu generiert → Handy muss neu scannen.

---

## Nächste Schritte

- Evaluation abschließen: Latenz messen, Geräte testen, Gyro-Mapping verfeinern
- Weitere Retro-Spiele mit derselben Controller-Infrastruktur: Breakout, Snake, etc.
- `controller.html` bleibt bei allen Spielen identisch – nur `index.html` wechselt
