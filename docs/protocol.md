# Gamepad-Protokoll

Jeder Controller sendet alle ~33ms (30 Hz) ein Gamepad-JSON über den WebRTC-DataChannel an die Console:

```js
{
  type: 'gamepad',
  player: 1,                          // 1 oder 2
  joystick: { x, y, active },         // -1..+1, active=true wenn berührt
  dpad: { up, down, left, right },    // boolean, aus Joystick-Schwellwert
  a, b, select, start,                // Standard-Buttons
  x, y, l, r                          // Reserve für größere Varianten
}
```

Alle Controller-Varianten senden dasselbe Schema — das Protokoll ist stabil, auch wenn eine Variante einzelne Tasten nicht belegt. Spiele lesen das Schema über `input(player, gamepad, prevGamepad)` und entscheiden selbst, welche Felder sie auswerten.

## Konventionen

- **Koordinatensystem Joystick:** `x` positiv = rechts, `y` positiv = unten (Canvas-konform).
- **D-Pad aus Joystick:** Wird im Controller gemappt (Schwellwert ~0.3), damit Spiele ohne eigene Logik diskrete Richtungen lesen können.
- **`prevGamepad`:** Letzter Frame — zum Erkennen von Flanken (z.B. „A gerade gedrückt" statt „A gehalten").

## Spezial-Messages

Neben `type: 'gamepad'` können Controller andere Nachrichten schicken (z.B. Verbindungs-Metadaten). Spiele ignorieren diese — nur `core.js`/`console/` werten sie aus.
