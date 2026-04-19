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

## Spiele

Jedes Spiel hat eine eigene README im jeweiligen Ordner:

- [PONG](../games/pong/README.md) — `games/pong/pong.js`
- [VOLLEYBALL](../games/volleyball/README.md) — `games/volleyball/volleyball.js`
- [DUST RUSH](../games/vacuum/README.md) — `games/vacuum/vacuum.js`

---

## Neues Spiel hinzufügen

1. Ordner `games/<name>/` anlegen mit Entry-File (z.B. `<name>.js`), darin `window.RetroGames.<name> = { ... }` zuweisen
2. Script-Tag in `console/index.html` ergänzen
3. `artSvg` (inline SVG, viewBox 320×200) und `tagline` für die Menü-Karte setzen — das Karussell baut sich automatisch aus `window.RetroGames`

Spiele bekommen Controller-Eingaben als neutrales [Gamepad-Protokoll](protocol.md) — die konkrete Controller-Variante ist für das Spiel unsichtbar.
