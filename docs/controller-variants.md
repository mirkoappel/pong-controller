# Controller-Varianten

`controller/` ist ein Plugin-System für austauschbare Gamepad-Layouts. `core.js` kapselt Verbindung, Senden, Variant-Picker, Wake-Lock. `qr-scanner.js` übernimmt den QR-Scan (globales `window.QRScanner`, `core.js` delegiert dorthin). Jede Variante liefert ihr eigenes Layout + ihre eigene Input-Logik.

## Routing

| URL | Verhalten |
|---|---|
| `controller/?code=AB23&player=1` | Redirect zur aktuell gewählten Variante (LocalStorage) mit Code durchgereicht |
| `controller/variants/classic/?code=AB23&player=1` | Variante direkt, verbindet automatisch |
| `controller/variants/classic/` (ohne Code) | Variante öffnet, LED rot — Wifi-Button öffnet QR-Scan zum Verbinden |

## Variant „Classic" (Default)

Layout (Querformat):
- **Links:** Analoger Joystick (fixer Mittelpunkt, Rücksprung)
- **Mitte:** Home (= SELECT, zurück ins Menü), Gear (Variant-Picker), Wifi (QR-Scan) — vertikal gestapelt
- **Rechts:** A- und B-Button in Mulden, diagonal versetzt; leicht nach links gerückt für bequeme Daumen-Reichweite
- **LED oben rechts:** Grün = verbunden, Rot = getrennt

Wifi-Icon leuchtet zusätzlich grün wenn verbunden — doppelte Status-Anzeige ohne Platz zu kosten.

Im Hochformat wird ein Hinweis-Overlay im RETROCON-Stil angezeigt (Gehäusefarbe, Akzent-Glow, animiertes Phone-Icon), das zum Drehen auffordert — der Controller ist für Querformat ausgelegt.

## Neue Variante hinzufügen

1. Ordner `controller/variants/<id>/` anlegen mit `index.html`, `style.css`, `app.js`
2. In `index.html` PeerJS, jsQR, `qr-scanner.js`, `core.js` + `app.js` laden (in der Reihenfolge), gewünschte Button-IDs ins DOM
3. In `app.js`: `RC.bindBtn('id', 'key')` + eigene Joystick-/Touch-Logik, dann `RC.init()`
4. Eintrag in `VARIANTS`-Array in `core.js` ergänzen

Alle Varianten sprechen dasselbe [Gamepad-Protokoll](protocol.md), sind also mit jedem Spiel kompatibel. Der Nutzer wechselt Varianten über den Gear-Button im Controller selbst — die Wahl steckt in `localStorage` und gilt für alle Räume.

## Skins

Innerhalb einer Variante steuern CSS-Custom-Properties die Farben (Gehäuse, Akzent, Mulden). Classic liefert `crimson` (Default), `emerald`, `cobalt`, `mono` — per `<body class="skin-xyz">` umschaltbar.
