# Changelog

Alle nennenswerten Änderungen an RETROCON. Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [0.4.0]

### Hinzugefügt
- Neues Spiel: **Slime Volleyball** (1–2 Spieler, Joystick + A zum Springen, KI pro fehlendem Spieler)
- Volleyball: Joystick steuert Slime-Position direkt (statt kraft-basiert), kritisch gedämpfte Interpolation
- QR-Scanner: nur das sichtbare Viewfinder-Rechteck wird an jsQR übergeben (object-fit:cover korrekt zurückgerechnet) + Mindest-Größen-Check (40% der Framefläche), damit bei zwei sichtbaren QR-Codes nicht zufällig der falsche gewinnt
- Controller: QR-Scanner in eigene Datei `controller/qr-scanner.js` (`window.QRScanner`)
- SPA-Architektur: Boot + Setup + Menü + Game in einem Dokument — Audio-Gesture bleibt gültig
- `services/audio.js`: globaler AudioContext, im Boot-Klick erzeugt, an Spiele via `api.audioCtx`
- Console als ES-Module aufgeteilt (`services/` + `views/` + `app.js` + `style.css`)
- Hauptmenü: horizontales Spiele-Karussell mit Game-Cards (`artSvg` + `tagline` aus dem Spielmodul)
- Menü-Legende „(A) SPIEL AUSWÄHLEN / (B) EINSTELLUNGEN" — B öffnet den Setup-Screen
- Press Start 2P als Arcade-Schrift für Logo, Titel, Scores und Sieger-Screen (inkl. Canvas-Preload)
- Pong: KI für jeden nicht verbundenen Spieler (auch P1, wenn nur P2 verbunden ist)

### Geändert
- Root-`index.html` ist nur noch Redirect zu `console/` (SPA lebt komplett dort)
- `console.html` → `console/index.html` (eigener Ordner)
- Spiele in eigene Ordner: `games/pong.js` → `games/pong/pong.js`
- Setup-Screen: neuer Titel „VERBINDE DEIN SMARTPHONE ALS GAME-CONTROLLER", einheitlicher Status „WARTE AUF VERBINDUNG" für beide Spieler, lesbarere SPIELER-Labels
- Boot-Terminal: grüner Phosphor → RETROCON-Blau
- Pong: größere Schläger mit mehr Rand-Abstand, Stil wie Menü-Vorschau, Countdown entfernt, neuer Sieger-Screen, SELECT-Hint weg
- Controller Classic: A/B-Buttons nach links gerückt für bequemere Daumen-Reichweite
- Controller Classic: Icon-Buttons (Home, Gear, Wifi) vertikal gestapelt statt horizontal
- Controller Classic: Größen via `vmax`/`vmin` statt `vw`/`vh` für orientierungsunabhängige Skalierung
- Portrait-Overlay im RETROCON-Stil (Gehäuse-Hintergrund, Crimson-Akzent, 3D-Phone-Icon, zweizeiliger zentrierter Text „SMARTPHONE DREHEN")

### Entfernt
- „SPIELER VERBINDEN"-Button im Hauptmenü (ersetzt durch B-Hint)
- User-Flow-Diagramm aus README (volatil)

## [0.3.3]

### Hinzugefügt
- Controller: Plugin-System mit austauschbaren Varianten unter `controller/variants/`
- Shared `core.js` für Verbindung, Gamepad-Protokoll, Scan-/Picker-Overlays
- Classic-Variante als Default (Joystick + A/B + Menü/Gear/Wifi, Skins crimson/emerald/cobalt/mono)
- Boot-Screen: Terminal-Bootloader → „PRESS ANY KEY" → RETROCON-Animation

### Geändert
- `controller.html` → `controller/` Plugin-Struktur mit Redirect-Stub
- Menü-Navigation: jeder verbundene Controller kann steuern (kein Player-Tracking)

## [0.3.2]

### Geändert
- Flow: Boot → Setup → Hauptmenü (Setup-Screen als initialer Screen)
- Setup-Screen: Hinweistext + A zum Starten statt START-Button

## [0.3.1]

### Geändert
- Flow: Boot → Hauptmenü, Setup via „Spieler verbinden"

## [0.3.0]

### Hinzugefügt
- Setup-Screen mit 2 QR-Codes (P1 + P2)
- Hauptmenü-Flow für Spielauswahl
- Einheitliches Branding: RETROCON blau mit Glow

## [0.2.0]

### Hinzugefügt
- Retro-Konsole-Plattform mit 4-stelligem Raum-Code
- Rebrand: pong-controller → RETROCON
- Wording: „Console" → „Raum" durchgängig

## [0.1.x]

### Hinzugefügt
- Joystick mit fixem Mittelpunkt und Rücksprung
- QR-Code bei Controller-Disconnect
- Direkte Paddle-Steuerung via Joystick
- Sound + Gewinner-Screen (bei 10 Punkten)

## [0.0.x] — frühe Prototypen

- Pong mit WebRTC-Handy-Steuerung (initial)
- NES-Gamepad Controller (D-Pad + A/B/SELECT/START)
- Fullscreen-Controller (ganzer Screen als Gamepad)
- Analoger Joystick + LED-Status
- QR-Scanner zum Neuverbinden
- Wake Lock API (Display bleibt wach)
- Portrait/Landscape-Support mit Dreh-Hinweis
