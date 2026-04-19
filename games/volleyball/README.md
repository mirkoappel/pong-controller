# VOLLEYBALL

**Spieler:** 1–2 · **Siegbedingung:** 7 Punkte

Zwei Slimes getrennt durch ein Netz. P1 spielt links (blau), P2 rechts (pink). Erster auf 7 Punkte gewinnt.

## Steuerung

| Eingabe | Aktion |
|---|---|
| Joystick X | Slime links/rechts bewegen |
| A | Springen |
| A / START (Game Over) | Neustart |
| SELECT | Zurück zum Menü |

## Mechaniken

- Joystick X bewegt den Slime mit kritisch-gedämpfter Interpolation (kein direktes Setzen der Position)
- Slime trifft den Ball nur mit der oberen Halbkugel
- Impuls des Slimes wird auf den Ball übertragen — Bewegung beim Treffen gibt dem Ball Spin
- Squash-&-Stretch-Animation (volumenerhaltend): Slime flacht beim Landen ab, streckt sich beim Springen
- KI für jeden nicht verbundenen Spieler: trackt Ball-X-Position, springt wenn Ball sich nähert

## Sounds

| Ereignis | Beschreibung |
|---|---|
| Ball-Treffer | Kurzer Blip |
| Netz-Berührung | Tiefer Ton |
| Wand | Mittlerer Ton |
| Punkt | Absteigende Note |
| Sieg | Aufsteigendes Arpeggio |
