# PONG

**Spieler:** 1–2 · **Siegbedingung:** 10 Punkte

Klassisches Paddlespiel. P1 spielt links, P2 rechts. Erster auf 10 Punkte gewinnt.

## Steuerung

| Eingabe | Aktion |
|---|---|
| Joystick Y | Paddle hoch/runter (absolute Positionierung) |
| A / START (Game Over) | Neustart |
| SELECT | Zurück zum Menü |

## Mechaniken

- Ball beschleunigt mit jedem Paddle-Treffer um 5 %
- Treffpunkt auf dem Paddle gibt dem Ball Drall (Höhe des Treffers → vy-Anteil)
- KI für jeden nicht verbundenen Spieler (sanftes Tracking der Ball-Y-Position)

## Sounds

| Ereignis | Frequenz | Dauer |
|---|---|---|
| Paddle-Treffer | 440 Hz | 50 ms |
| Wand | 220 Hz | 40 ms |
| Tor | 110 Hz | 250 ms |
| Sieg | 523 → 659 → 784 → 1046 Hz | 180 ms je Ton |
