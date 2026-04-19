# Spiele

Jedes Spiel lebt in einem eigenen Ordner unter `games/<name>/` und registriert sich beim Laden an `window.RetroGames`. Der eigene Ordner erlaubt pro Spiel beliebig viele Module, Assets und Stylesheets.

## Game-Modul-Interface

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

## Neues Spiel hinzufügen

1. Ordner `games/<name>/` anlegen mit Entry-File (z.B. `<name>.js`), darin `window.RetroGames.<name> = { ... }` zuweisen
2. Script-Tag in `console/index.html` ergänzen
3. Im Hauptmenü auftauchende Liste aktualisieren (falls nicht automatisch)

Spiele bekommen Controller-Eingaben als neutrales [Gamepad-Protokoll](protocol.md) — die konkrete Controller-Variante ist für das Spiel unsichtbar.
