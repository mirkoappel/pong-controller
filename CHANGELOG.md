# Changelog

Alle nennenswerten Änderungen an RETROCON. Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [0.6.0]

### Hinzugefügt
- Neues Spiel: **DUST RUSH** (1–2 Spieler) — Staubsauger-Roboter-Wettbewerb in der Vogelperspektive
  - **Panzersteuerung**: Joystick Y = vorwärts/rückwärts, X = Rotation
  - **Gitterboden**: Spielfeld aus quadratischen Sektoren (Sektorgröße = Roboterdurchmesser); wer den letzten Krümel eines Sektors einsammelt bekommt +1 Punkt; gereinigte Sektoren färben sich in Spielerfarbe
  - **175 Partikel** zufällig verteilt; Behälter füllt sich pro Partikel, Akku entlädt sich kontinuierlich
  - **Ladestation** (Mitte unten): lädt Akku und leert Behälter gleichzeitig, automatisches Andocken per Nähe
  - **HUD**: Akku-Bar (Spielerfarbe) + Behälter-Bar (Amber) + Score + Timer; beide Bars blinken rot bei kritischem Stand
  - **KI-Gegner** mit SEEK/DOCK-Zustandsautomat und Stuck-Recovery für Solo-Modus
  - **Sounds**: Collect-Blip, 3-Ton-Sektor-Chime, Dock-Sound, Warnpiepser (Akku/Behälter), Win-Fanfare, Unentschieden-Akkord
  - Spielende: Timer (90 s) oder alle Partikel gesammelt; Siegerscreen mit zwei Zeilen + Score-Anzeige
- Boot-Terminal: Game-Module-Counter von 2 auf 3 aktualisiert

## [0.5.0]

### Hinzugefügt
- Controller als **PWA installierbar**: Web-Manifest + iOS/Android-Meta-Tags + generierte Icons (192, 512, maskable). „Zum Home-Screen" → Fullscreen-Start, Scanner öffnet automatisch wenn kein Code in der URL
- Manifest `display: fullscreen` (Android blendet System-Bars aus; iOS bleibt bei black-translucent da Apple keinen PWA-Statusleisten-Hide erlaubt)
- QR-Scanner: **antippbare Rahmen** um erkannte Codes — Tap auf den Rahmen verbindet direkt als Spieler 1/2, Label zeigt welcher
- QR-Scanner nutzt nativen `BarcodeDetector` (Chromium Android, Safari iOS 17+), jsQR bleibt als Fallback
- ABBRECHEN-Button im Scanner prominent rot unten mittig (vorher unscheinbarer „SCHLIESSEN"-Pill oben rechts)
- Hauptmenü: B öffnet den Setup-Screen zum Hinzufügen/Wechseln eines Spielers (gleiches Layout wie beim Start, kein separater Settings-Screen mehr)
- Keyboard-Steuerung in der Console: `B` öffnet Setup, `A`/`Enter`/`Esc` zurück ins Menü, `Esc` im Spiel kehrt ins Hauptmenü

### Geändert
- Controller-Layout respektiert `safe-area-inset-left/right` (Landscape-relevant), Joystick bleibt vertikal exakt zentriert via ResizeObserver
- `connect()` im Controller reloadet bei Peer-Fehler nicht mehr automatisch — LED wird rot, User scannt bei Bedarf neu
- Setup-Screen Typografie: H1 `clamp(1.6rem, 3.5vw, 2.6rem)`, Hinweistext 1.4rem — lesbar aus Sofa-Distanz
- Controller-Skripte via `?v=` Cache-Bust versioniert, damit Produktions-Handys neue JS-Versionen ohne manuellen Clear bekommen

### Entfernt
- Viewfinder-Crop + 40%-Mindestgrößen-Filter im Scanner (durch kontinuierliche Multi-Code-Erkennung mit Frame-Tap ersetzt)
- Auto-Reload im Controller bei Peer-Disconnect
- Separater Settings-Screen im Console-UI (ungenutzter Duplikat)

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
