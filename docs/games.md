# Spiele

Jedes Spiel lebt in einem eigenen Ordner unter `games/<name>/` und registriert sich beim Laden an `window.RetroGames`. Der eigene Ordner erlaubt pro Spiel beliebig viele Module, Assets und Stylesheets.

## Game-Modul-Interface

```js
window.RetroGames.pong = {
  name: 'PONG',
  tagline: '1–2 SPIELER · CLASSIC ARCADE', // Untertitel auf der Menü-Karte
  artSvg: `<svg ...>...</svg>`,            // Preview-Grafik für die Game-Card
  minPlayers: 1,
  maxPlayers: 2,
  create(ctx, W, H, numPlayers, api) {
    // api.exit()        → zurück zum Hauptmenü
    // api.getConns()    → Map(player → conn), verbundene Controller
    // api.audioCtx      → globaler AudioContext (im Boot-Gesture erzeugt, darf nicht geschlossen werden)
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

## PONG

**Datei:** `games/pong/pong.js` · **Spieler:** 1–2 · **Siegbedingung:** 10 Punkte

Joystick Y steuert das Paddle direkt (absolute Positionierung). Der Ball beschleunigt mit jedem Treffer um 5 %; der Treffpunkt auf dem Paddle gibt dem Ball Drall. KI für nicht verbundene Spieler. Sounds: Paddle, Wand, Tor, Sieg-Arpeggio.

---

## VOLLEYBALL

**Datei:** `games/volleyball/volleyball.js` · **Spieler:** 1–2 · **Siegbedingung:** 7 Punkte

Zwei Slimes (P1 blau, P2 pink) getrennt durch ein Netz. Joystick X bewegt den Slime mit kritisch-gedämpfter Interpolation, A springt. Slime kann nur mit der oberen Halbkugel Bälle treffen; Impuls des Slimes wird auf den Ball übertragen. Squash-&-Stretch-Animation volume-erhaltend. KI trackt Ball, springt wenn Ball nähert. Sounds: Hit, Netz, Wand, Punkt, Sieg.

---

## DUST RUSH

**Datei:** `games/vacuum/vacuum.js` · **Spieler:** 1–2 · **Siegbedingung:** meiste Punkte nach 90 s oder wenn alle Partikel gesammelt sind

### Spielprinzip

Zwei runde Staubsauger-Roboter (Vogelperspektive) räumen einen Gitterboden ab. Das Spielfeld ist in quadratische **Sektoren** unterteilt — jeder Sektor ist genau einen Roboterdurchmesser groß. Wer den **letzten Krümel** in einem Sektor einsammelt, bekommt **+1 Punkt**. Gereinigte Sektoren färben sich in der Spielerfarbe (Cyan = P1, Pink = P2).

### Steuerung (Panzersteuerung)

| Joystick | Aktion |
|---|---|
| Y-Achse oben (−1) | Vorwärts |
| Y-Achse unten (+1) | Rückwärts |
| X-Achse | Rotation (links/rechts drehen) |
| SELECT | Zurück zum Menü |
| A / START (Game Over) | Neustart |

### Ressourcen & Ladestation

Der Roboter hat zwei Ressourcen, die über das HUD (oberer Streifen) angezeigt werden:

| Ressource | Farbe | Kritisch bei | Wirkung wenn leer/voll |
|---|---|---|---|
| **Akku** | Spielerfarbe | < 20 % (blinkt rot) | Roboter stoppt komplett |
| **Behälter** | Amber | > 80 % (blinkt rot) | Kein Einsammeln mehr möglich |

Die **Ladestation** (goldener Blitz-Icon, Mitte unten) lädt Akku und leert Behälter **gleichzeitig** solange der Roboter sich im Dockbereich befindet. Es gibt keine Taste zum Andocken — der Roboter dockt automatisch sobald er nah genug ist.

### HUD-Layout

```
[Akku P1][Bin P1]   P1-Score   0:47   P2-Score   [Bin P2][Akku P2]
```

Bars blinken rot wenn kritisch. Timer blinkt rot in den letzten 10 Sekunden.

### KI-Gegner

Die KI läuft für jeden nicht verbundenen Spieler. Zustandsautomat:

- **SEEK**: Fährt zum nächsten ungesäuberten Sektor (mit leichtem Zufalls-Offset für Impräzision)
- **DOCK**: Fährt zur Ladestation wenn Akku < 22 % oder Behälter > 78 %
- Übergang DOCK→SEEK wenn Akku > 88 % **und** Behälter < 15 %
- **Stuck-Recovery**: Wenn Roboter sich in 1,5 s weniger als 25 % eines Sektors bewegt hat → kurzer Dreh + Rückwärtsfahrt

### Implementierungsdetails

- **`dims()`** wird jeden Frame aufgerufen und berechnet alle Maße proportional zu Canvas-Größe (`cellSize ≈ min(W, playH) / 12`)
- **Sektorindex**: `row * gridCols + col`, flaches Array, bei Partikel-Einsammeln aus Partikelposition berechnet
- **Resize**: Roboter- und Partikelpositionen werden mit `sx = newW/oldW`, `sy = newH/oldH` skaliert; `cellSize` und `playTop` werden aus aktuellen `dims()` neu gesetzt
- **Audio**: Alle Sounds via Web Audio API (OscillatorNode + GainNode mit exponentialRamp), kein Audiodatei-Overhead

---

## Neues Spiel hinzufügen

1. Ordner `games/<name>/` anlegen mit Entry-File (z.B. `<name>.js`), darin `window.RetroGames.<name> = { ... }` zuweisen
2. Script-Tag in `console/index.html` ergänzen
3. `artSvg` (inline SVG, viewBox 320×200) und `tagline` für die Menü-Karte setzen — das Karussell baut sich automatisch aus `window.RetroGames`

Spiele bekommen Controller-Eingaben als neutrales [Gamepad-Protokoll](protocol.md) — die konkrete Controller-Variante ist für das Spiel unsichtbar.
