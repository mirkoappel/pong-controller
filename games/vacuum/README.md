# DUST RUSH

**Spieler:** 1–2 · **Siegbedingung:** meiste Punkte nach 90 s oder wenn alle Partikel gesammelt sind

Zwei runde Staubsauger-Roboter (Vogelperspektive) räumen einen Gitterboden ab. Das Spielfeld ist in quadratische **Sektoren** unterteilt — jeder Sektor ist genau einen Roboterdurchmesser groß. Wer den **letzten Krümel** in einem Sektor einsammelt, bekommt **+1 Punkt**. Gereinigte Sektoren färben sich in der Spielerfarbe (Cyan = P1, Pink = P2).

## Steuerung

| Eingabe | Aktion |
|---|---|
| Joystick Y oben (−1) | Vorwärts |
| Joystick Y unten (+1) | Rückwärts |
| Joystick X | Rotation (links/rechts drehen) |
| A / START (Game Over) | Neustart |
| SELECT | Zurück zum Menü |

## Ressourcen & Ladestation

Der Roboter hat zwei Ressourcen, die im HUD (oberer Streifen) angezeigt werden:

| Ressource | Farbe | Kritisch bei | Wirkung wenn leer/voll |
|---|---|---|---|
| **Akku** | Spielerfarbe | < 20 % (blinkt rot) | Roboter stoppt komplett |
| **Behälter** | Amber | > 80 % (blinkt rot) | Kein Einsammeln mehr möglich |

Die **Ladestation** (goldener Blitz-Icon, Mitte unten) lädt Akku und leert Behälter **gleichzeitig** solange der Roboter sich im Dockbereich befindet. Andocken erfolgt automatisch per Nähe — keine Taste nötig.

## HUD-Layout

```
[Akku P1][Bin P1]   P1-Score   0:47   P2-Score   [Bin P2][Akku P2]
```

Bars blinken rot wenn kritisch. Timer blinkt rot in den letzten 10 Sekunden.

## KI-Gegner

Die KI läuft für jeden nicht verbundenen Spieler. Zustandsautomat:

- **SEEK**: Fährt zum nächsten ungesäuberten Sektor (mit leichtem Zufalls-Offset für Impräzision)
- **DOCK**: Fährt zur Ladestation wenn Akku < 22 % oder Behälter > 78 %
- Übergang DOCK→SEEK wenn Akku > 88 % **und** Behälter < 15 %
- **Stuck-Recovery**: Wenn Roboter sich in 1,5 s weniger als 25 % eines Sektors bewegt hat → kurzer Dreh + Rückwärtsfahrt

## Sounds

| Ereignis | Beschreibung |
|---|---|
| Krümel eingesammelt | Kurzer Blip (1200 Hz, 40 ms) |
| Sektor abgeschlossen | 3-Ton-Chime (523→659→784 Hz) |
| Andocken | Aufsteigender Sweep (160→240 Hz) |
| Akku-Warnung | Zweiton-Alarm (alle 2,5 s bei < 20 %) |
| Behälter-Warnung | Zweiton-Alarm (alle 3 s bei > 80 %) |
| Sieg | 5-Ton-Fanfare |
| Unentschieden | Zweistimmiger Akkord |
