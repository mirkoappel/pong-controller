// DUST RUSH — Staubsauger-Roboter Wettbewerb, 1–2 Spieler.
// Panzersteuerung (Joystick Y = vorwärts/rückwärts, X = Rotation).
// Sektoren werden vergeben, wenn ein Roboter den letzten Krümel einsammelt.
// Bei leerem Akku oder vollem Behälter muss die Ladestation angefahren werden.
window.RetroGames = window.RetroGames || {};

window.RetroGames.vacuum = {
  name: 'DUST RUSH',
  tagline: '1–2 SPIELER · STAUBSAUGER',
  minPlayers: 1,
  maxPlayers: 2,

  artSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="200" fill="#111"/>
      <rect width="320" height="24" fill="#0a0a0a"/>
      <line x1="40"  y1="24" x2="40"  y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="80"  y1="24" x2="80"  y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="120" y1="24" x2="120" y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="160" y1="24" x2="160" y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="200" y1="24" x2="200" y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="240" y1="24" x2="240" y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="280" y1="24" x2="280" y2="200" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="0" y1="68"  x2="320" y2="68"  stroke="#1e1e1e" stroke-width="1"/>
      <line x1="0" y1="112" x2="320" y2="112" stroke="#1e1e1e" stroke-width="1"/>
      <line x1="0" y1="156" x2="320" y2="156" stroke="#1e1e1e" stroke-width="1"/>
      <rect x="40"  y="24"  width="40" height="44" fill="#4fc3f7" opacity="0.12"/>
      <rect x="80"  y="68"  width="40" height="44" fill="#4fc3f7" opacity="0.12"/>
      <rect x="0"   y="112" width="40" height="44" fill="#4fc3f7" opacity="0.12"/>
      <rect x="240" y="68"  width="40" height="44" fill="#f48fb1" opacity="0.12"/>
      <circle cx="55"  cy="38"  r="2" fill="#fffde7"/>
      <circle cx="105" cy="48"  r="2" fill="#fffde7"/>
      <circle cx="145" cy="35"  r="2" fill="#fffde7"/>
      <circle cx="185" cy="50"  r="2" fill="#fffde7"/>
      <circle cx="215" cy="42"  r="2" fill="#fffde7"/>
      <circle cx="258" cy="40"  r="2" fill="#fffde7"/>
      <circle cx="295" cy="50"  r="2" fill="#fffde7"/>
      <circle cx="20"  cy="90"  r="2" fill="#fffde7"/>
      <circle cx="145" cy="95"  r="2" fill="#fffde7"/>
      <circle cx="295" cy="130" r="2" fill="#fffde7"/>
      <circle cx="50"  cy="170" r="2" fill="#fffde7"/>
      <circle cx="185" cy="140" r="2" fill="#fffde7"/>
      <circle cx="160" cy="178" r="13" fill="#ffb300" fill-opacity="0.18" stroke="#888" stroke-width="2"/>
      <polyline points="163,170 157,178 162,178 156,186" stroke="#ffb300" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="82"  cy="108" r="10" fill="#4fc3f7" opacity="0.92"/>
      <circle cx="91"  cy="108" r="2"  fill="#fff"/>
      <circle cx="238" cy="78"  r="10" fill="#f48fb1" opacity="0.92"/>
      <circle cx="247" cy="78"  r="2"  fill="#fff"/>
      <rect x="4"  y="7" width="38" height="6" fill="#222"/>
      <rect x="4"  y="7" width="26" height="6" fill="#4fc3f7"/>
      <rect x="46" y="7" width="38" height="6" fill="#222"/>
      <rect x="46" y="7" width="10" height="6" fill="#ffb300"/>
      <text x="108" y="18" font-family="'Press Start 2P','Courier New',monospace" font-size="10" fill="#4fc3f7">3</text>
      <text x="145" y="18" font-family="'Press Start 2P','Courier New',monospace" font-size="10" fill="#fff">0:47</text>
      <text x="200" y="18" font-family="'Press Start 2P','Courier New',monospace" font-size="10" fill="#f48fb1">2</text>
      <rect x="232" y="7" width="38" height="6" fill="#222"/>
      <rect x="232" y="7" width="16" height="6" fill="#ffb300"/>
      <rect x="274" y="7" width="38" height="6" fill="#222"/>
      <rect x="274" y="7" width="34" height="6" fill="#f48fb1"/>
    </svg>
  `,

  create(ctx, W, H, numPlayers, api) {
    // ── Spielkonstanten ──────────────────────────────────
    const GAME_DURATION    = 90;
    const BATTERY_DRAIN    = 0.011;    // pro Sekunde (leer nach ~91s ohne Dock)
    const BATTERY_CHARGE   = 0.45;     // pro Sekunde im Dock
    const BIN_EMPTY_RATE   = 0.60;     // pro Sekunde im Dock
    const BIN_PER_PARTICLE = 1 / 35;   // Behälter voll nach 35 Partikeln
    const PARTICLE_COUNT   = 175;
    const LOW_BATTERY      = 0.20;
    const HIGH_BIN         = 0.80;
    const TURN_RATE        = Math.PI * 2.2;   // rad/s bei vollem Stick
    const P1_COLOR         = '#4fc3f7';
    const P2_COLOR         = '#f48fb1';

    let w = W, h = H;

    // ── Proportionale Maße (Rendering) ──────────────────
    function dims() {
      const hudH      = Math.round(h * 0.12);
      const playTop   = hudH;
      const playH     = h - hudH;
      const targetCell = Math.round(Math.min(w, playH) / 12);
      const cols      = Math.max(4, Math.floor(w / targetCell));
      const rows      = Math.max(4, Math.floor(playH / targetCell));
      const cellSize  = Math.min(Math.floor(w / cols), Math.floor(playH / rows));
      const robotR    = Math.round(cellSize * 0.42);
      const particleR = Math.max(2, Math.round(cellSize * 0.07));
      const robotSpeed = cellSize * 5.5;
      return { hudH, playTop, playH, cols, rows, cellSize, robotR, particleR, robotSpeed };
    }

    // ── State ────────────────────────────────────────────
    const state = {
      phase: 'playing',
      timeLeft: GAME_DURATION,
      winner: 0,           // 0=keine, 1=P1, 2=P2, -1=Unentschieden
      robots: [makeRobot(), makeRobot()],
      particles: [],
      sectors: [],
      gridCols: 0,
      gridRows: 0,
      cellSize: 0,         // Gameplay-Zellgröße (fest nach init, nach resize aktualisiert)
      playTop: 0,          // Spielfeldstart Y (fest nach init, nach resize aktualisiert)
      station: { x: 0, y: 0, dockR: 0, col: 0, row: 0 }
    };

    function makeRobot() {
      return {
        x: 0, y: 0, angle: Math.PI / 2,
        battery: 1, bin: 0, score: 0,
        stickX: 0, stickY: 0,
        docked: false, wasDockedLastFrame: false,
        lowBatteryBeepTimer: 0, fullBinBeepTimer: 0
      };
    }

    // ── AI-Zustand ───────────────────────────────────────
    const aiState = [makeAI(), makeAI()];

    function makeAI() {
      return {
        st: 'SEEK',
        targetSector: null, targetOffset: null,
        stuckTimer: 1.5,
        stuckX: 0, stuckY: 0,
        stuckEscapeTimer: 0, stuckEscapeDir: 1
      };
    }

    // ── Audio ────────────────────────────────────────────
    const audioCtx = api.audioCtx;
    let lastCollectSnd = 0;

    function blip(freq, dur, type = 'square', vol = 0.12) {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
    }

    function sndCollect() {
      const now = performance.now();
      if (now - lastCollectSnd < 70) return;
      lastCollectSnd = now;
      blip(1100, 0.04, 'square', 0.07);
    }

    function sndSector() {
      [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.14, 'triangle', 0.13), i * 80));
    }

    function sndDock() {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.linearRampToValueAtTime(240, t + 0.18);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    function sndLowBattery() {
      blip(330, 0.08);
      setTimeout(() => blip(220, 0.08), 110);
    }

    function sndFullBin() {
      blip(880, 0.06);
      setTimeout(() => blip(660, 0.06), 95);
    }

    function sndWin() {
      [262, 330, 392, 523, 784].forEach((f, i) =>
        setTimeout(() => blip(f, 0.16, 'triangle', 0.15), i * 110)
      );
    }

    function sndTie() {
      blip(262, 0.30, 'triangle', 0.12);
      setTimeout(() => blip(268, 0.30, 'sine', 0.09), 40);
    }

    // ── Init ─────────────────────────────────────────────
    function init() {
      const d = dims();

      state.phase    = 'playing';
      state.timeLeft = GAME_DURATION;
      state.winner   = 0;

      state.gridCols  = d.cols;
      state.gridRows  = d.rows;
      state.cellSize  = d.cellSize;
      state.playTop   = d.playTop;

      // Sektoren
      state.sectors = [];
      for (let row = 0; row < d.rows; row++) {
        for (let col = 0; col < d.cols; col++) {
          state.sectors.push({ col, row, owner: 0, particleCount: 0, collectedCount: 0 });
        }
      }

      // Station — Mitte der letzten Zeile
      const stCol = Math.floor(d.cols / 2);
      const stRow = d.rows - 1;
      const dockR = Math.round(d.cellSize * 1.1);
      state.station = {
        col: stCol, row: stRow,
        x: stCol * d.cellSize + d.cellSize / 2,
        y: d.playTop + stRow * d.cellSize + d.cellSize / 2,
        dockR
      };

      // Partikel — zufällig verteilt, Stations-Nachbarschaft ausschließen
      state.particles = [];
      const margin = Math.round(d.cellSize * 0.18);
      let placed = 0, attempts = 0;
      while (placed < PARTICLE_COUNT && attempts < PARTICLE_COUNT * 40) {
        attempts++;
        const col = Math.floor(Math.random() * d.cols);
        const row = Math.floor(Math.random() * d.rows);
        if (Math.abs(col - stCol) <= 1 && Math.abs(row - stRow) <= 1) continue;
        const cellX = col * d.cellSize;
        const cellY = d.playTop + row * d.cellSize;
        const px = cellX + margin + Math.random() * (d.cellSize - margin * 2);
        const py = cellY + margin + Math.random() * (d.cellSize - margin * 2);
        state.particles.push({ x: px, y: py, collected: false });
        state.sectors[row * d.cols + col].particleCount++;
        placed++;
      }

      // Roboter-Startpositionen
      const midRow = Math.floor(d.rows / 4);

      function resetRobot(r, colFrac) {
        r.x = Math.floor(d.cols * colFrac) * d.cellSize + d.cellSize / 2;
        r.y = d.playTop + midRow * d.cellSize + d.cellSize / 2;
        r.angle = Math.PI / 2;
        r.battery = 1; r.bin = 0; r.score = 0;
        r.stickX = 0; r.stickY = 0;
        r.docked = false; r.wasDockedLastFrame = false;
        r.lowBatteryBeepTimer = 0; r.fullBinBeepTimer = 0;
      }
      resetRobot(state.robots[0], 0.25);
      resetRobot(state.robots[1], 0.75);

      // AI zurücksetzen
      for (let i = 0; i < 2; i++) {
        const ai = aiState[i];
        ai.st = 'SEEK';
        ai.targetSector = null; ai.targetOffset = null;
        ai.stuckTimer = 1.5;
        ai.stuckX = state.robots[i].x; ai.stuckY = state.robots[i].y;
        ai.stuckEscapeTimer = 0; ai.stuckEscapeDir = 1;
      }
    }

    init();

    // ── AI ───────────────────────────────────────────────
    function findNearestSector(rx, ry) {
      const cs = state.cellSize, pt = state.playTop;
      let best = null, bestDist = Infinity;
      for (const sec of state.sectors) {
        if (sec.owner !== 0) continue;
        if (sec.particleCount === 0 || sec.collectedCount >= sec.particleCount) continue;
        const cx = sec.col * cs + cs / 2;
        const cy = pt + sec.row * cs + cs / 2;
        const d = Math.hypot(rx - cx, ry - cy);
        if (d < bestDist) { bestDist = d; best = sec; }
      }
      return best;
    }

    function runAI(r, idx, dt) {
      const ai = aiState[idx];
      const cs = state.cellSize, pt = state.playTop;

      // Zustandsübergänge
      if (ai.st === 'SEEK' && (r.battery < 0.22 || r.bin > 0.78)) {
        ai.st = 'DOCK';
      }
      if (ai.st === 'DOCK' && r.battery > 0.88 && r.bin < 0.15) {
        ai.st = 'SEEK';
        ai.targetSector = null;
        ai.targetOffset = null;
      }

      let targetX, targetY;

      if (ai.st === 'DOCK') {
        targetX = state.station.x;
        targetY = state.station.y;
      } else {
        if (!ai.targetSector ||
            ai.targetSector.owner !== 0 ||
            ai.targetSector.collectedCount >= ai.targetSector.particleCount) {
          ai.targetSector = findNearestSector(r.x, r.y);
          ai.targetOffset = null;
        }
        if (!ai.targetSector) {
          // Alle Sektoren fertig: warte neben Station
          targetX = state.station.x + cs * 2.5;
          targetY = state.station.y - cs;
        } else {
          if (!ai.targetOffset) {
            ai.targetOffset = {
              dx: (Math.random() - 0.5) * cs * 0.45,
              dy: (Math.random() - 0.5) * cs * 0.45
            };
          }
          targetX = ai.targetSector.col * cs + cs / 2 + ai.targetOffset.dx;
          targetY = pt + ai.targetSector.row * cs + cs / 2 + ai.targetOffset.dy;
        }
      }

      // Stuck-Escape-Override
      if (ai.stuckEscapeTimer > 0) {
        ai.stuckEscapeTimer -= dt;
        r.stickX = ai.stuckEscapeDir;
        r.stickY = 0.7;
        return;
      }

      const dx = targetX - r.x;
      const dy = targetY - r.y;
      const dist = Math.hypot(dx, dy);
      const angleToTarget = Math.atan2(dy, dx);

      let angleDiff = angleToTarget - r.angle;
      while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const TURN_THR = 0.30;
      if (Math.abs(angleDiff) > TURN_THR) {
        r.stickX = Math.sign(angleDiff) * Math.min(1, Math.abs(angleDiff) / 0.8);
        r.stickY = 0;
      } else {
        r.stickY = dist > cs * 0.6 ? -1 : 0;
        r.stickX = angleDiff / TURN_THR * 0.4;
      }

      // Stuck-Erkennung
      ai.stuckTimer -= dt;
      if (ai.stuckTimer <= 0) {
        const moved = Math.hypot(r.x - ai.stuckX, r.y - ai.stuckY);
        if (moved < cs * 0.25) {
          ai.stuckEscapeTimer = 0.7;
          ai.stuckEscapeDir = Math.random() > 0.5 ? 1 : -1;
        }
        ai.stuckTimer = 1.5;
        ai.stuckX = r.x;
        ai.stuckY = r.y;
      }
    }

    // ── Spielende ────────────────────────────────────────
    function endGame() {
      state.phase = 'gameover';
      const s1 = state.robots[0].score, s2 = state.robots[1].score;
      if (s1 > s2) { state.winner = 1; sndWin(); }
      else if (s2 > s1) { state.winner = 2; sndWin(); }
      else { state.winner = -1; sndTie(); }
    }

    // ── Zeichenhilfen ────────────────────────────────────
    function drawBar(x, y, bw, bh, value, color) {
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(x, y, bw, bh);
      if (value > 0) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.max(0, Math.round(bw * Math.min(1, value))), bh);
      }
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, bw, bh);
    }

    function drawRobot(r, color) {
      const { robotR } = dims();
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);

      // Glow-Körper
      ctx.shadowColor = color;
      ctx.shadowBlur = robotR * 0.8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, robotR, 0, Math.PI * 2);
      ctx.fill();

      // Richtungs-Sensor (weißer Punkt vorne)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(robotR * 0.58, 0, Math.max(2, robotR * 0.20), 0, Math.PI * 2);
      ctx.fill();

      // Akku-tot X-Markierung
      if (r.battery <= 0) {
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = Math.max(2, robotR * 0.14);
        ctx.beginPath();
        ctx.moveTo(-robotR * 0.38, -robotR * 0.38);
        ctx.lineTo( robotR * 0.38,  robotR * 0.38);
        ctx.moveTo( robotR * 0.38, -robotR * 0.38);
        ctx.lineTo(-robotR * 0.38,  robotR * 0.38);
        ctx.stroke();
      }

      // Dock-Indikator (pulsierender Ring)
      if (r.docked) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 110);
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = Math.max(1, robotR * 0.1);
        ctx.globalAlpha = 0.4 + 0.5 * pulse;
        ctx.beginPath();
        ctx.arc(0, 0, robotR * 1.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    // ── Öffentliche Spielschnittstelle ───────────────────
    return {

      input(player, gp, prev) {
        if (gp.select && !prev?.select) { api.exit(); return; }

        if (state.phase === 'gameover') {
          if ((gp.a && !prev?.a) || (gp.start && !prev?.start)) init();
          return;
        }

        const r = state.robots[player - 1];
        if (gp.joystick?.active) {
          r.stickX = gp.joystick.x;
          r.stickY = gp.joystick.y;
        } else {
          r.stickX = gp.dpad?.right ? 1 : gp.dpad?.left ? -1 : 0;
          r.stickY = gp.dpad?.down  ? 1 : gp.dpad?.up   ? -1 : 0;
        }
      },

      update(dt) {
        if (state.phase === 'gameover') return;

        const d = dims();
        const cs = state.cellSize;
        const pt = state.playTop;
        const conns = api.getConns();

        for (let i = 0; i < 2; i++) {
          const r = state.robots[i];

          // KI für nicht verbundene Spieler
          if (!conns.has(i + 1)) runAI(r, i, dt);

          // Akku leer → kein Antrieb
          if (r.battery <= 0) { r.stickX = 0; r.stickY = 0; }

          // Panzersteuerung: Rotation + Vorwärtsbewegung
          r.angle += r.stickX * TURN_RATE * dt;
          const fwd = -r.stickY * d.robotSpeed;   // Joystick hoch (-1) = vorwärts
          r.x += Math.cos(r.angle) * fwd * dt;
          r.y += Math.sin(r.angle) * fwd * dt;

          // Spielfeld-Begrenzung
          r.x = Math.max(d.robotR, Math.min(w - d.robotR, r.x));
          r.y = Math.max(pt + d.robotR, Math.min(pt + d.playH - d.robotR, r.y));

          // Akku-Entladung (nur außerhalb Dock)
          if (!r.docked) {
            r.battery = Math.max(0, r.battery - BATTERY_DRAIN * dt);
          }

          // Dock-Erkennung (Kreis-Kreis-Abstand)
          const prevDocked = r.wasDockedLastFrame;
          const dist = Math.hypot(r.x - state.station.x, r.y - state.station.y);
          r.docked = dist <= (state.station.dockR + d.robotR * 0.5);
          r.wasDockedLastFrame = r.docked;

          if (r.docked) {
            if (!prevDocked) sndDock();
            r.battery = Math.min(1, r.battery + BATTERY_CHARGE * dt);
            r.bin     = Math.max(0, r.bin - BIN_EMPTY_RATE * dt);
          }

          // Warnpiepser
          if (r.battery < LOW_BATTERY && !r.docked && r.battery > 0) {
            r.lowBatteryBeepTimer -= dt;
            if (r.lowBatteryBeepTimer <= 0) {
              sndLowBattery();
              r.lowBatteryBeepTimer = 2.5;
            }
          } else {
            r.lowBatteryBeepTimer = 0;
          }

          if (r.bin > HIGH_BIN) {
            r.fullBinBeepTimer -= dt;
            if (r.fullBinBeepTimer <= 0) {
              sndFullBin();
              r.fullBinBeepTimer = 3.0;
            }
          } else {
            r.fullBinBeepTimer = 0;
          }
        }

        // Partikel einsammeln
        for (const p of state.particles) {
          if (p.collected) continue;
          for (let i = 0; i < 2; i++) {
            const r = state.robots[i];
            if (r.bin >= 1.0) continue;
            if (Math.hypot(r.x - p.x, r.y - p.y) <= d.robotR) {
              p.collected = true;
              r.bin = Math.min(1, r.bin + BIN_PER_PARTICLE);
              sndCollect();

              // Sektor-Abschluss prüfen
              const col = Math.floor(p.x / cs);
              const row = Math.floor((p.y - pt) / cs);
              if (col >= 0 && col < state.gridCols && row >= 0 && row < state.gridRows) {
                const sec = state.sectors[row * state.gridCols + col];
                if (sec) {
                  sec.collectedCount++;
                  if (sec.particleCount > 0 && sec.collectedCount >= sec.particleCount) {
                    sec.owner = i + 1;
                    state.robots[i].score++;
                    sndSector();
                  }
                }
              }
              break;   // nur ein Roboter pro Partikel pro Frame
            }
          }
        }

        // Timer & Gewinnbedingung
        state.timeLeft -= dt;
        const allDone = state.particles.every(p => p.collected);
        if (state.timeLeft <= 0 || allDone) {
          state.timeLeft = Math.max(0, state.timeLeft);
          endGame();
        }
      },

      draw() {
        const d = dims();
        const flash = Math.sin(performance.now() / 150) > 0;

        // ── Hintergrund ─────────────────────────────────
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        // ── Sektor-Tints ────────────────────────────────
        ctx.save();
        for (const sec of state.sectors) {
          if (sec.owner === 0) continue;
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = sec.owner === 1 ? P1_COLOR : P2_COLOR;
          ctx.fillRect(
            sec.col * d.cellSize,
            d.playTop + sec.row * d.cellSize,
            d.cellSize, d.cellSize
          );
        }
        ctx.restore();

        // ── Gitterlinien ────────────────────────────────
        ctx.save();
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 0; c <= d.cols; c++) {
          ctx.moveTo(c * d.cellSize, d.playTop);
          ctx.lineTo(c * d.cellSize, d.playTop + d.rows * d.cellSize);
        }
        for (let r = 0; r <= d.rows; r++) {
          ctx.moveTo(0, d.playTop + r * d.cellSize);
          ctx.lineTo(d.cols * d.cellSize, d.playTop + r * d.cellSize);
        }
        ctx.stroke();
        ctx.restore();

        // ── Ladestation ─────────────────────────────────
        {
          const { x, y } = state.station;
          const sr = d.cellSize * 0.40;
          ctx.save();
          ctx.shadowColor = '#ffb300';
          ctx.shadowBlur = sr * 1.4;
          ctx.strokeStyle = '#888';
          ctx.lineWidth = Math.max(2, sr * 0.13);
          ctx.beginPath();
          ctx.arc(x, y, sr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffb300';
          ctx.globalAlpha = 0.18;
          ctx.beginPath();
          ctx.arc(x, y, sr * 0.72, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          // Blitz-Symbol
          ctx.strokeStyle = '#ffb300';
          ctx.lineWidth = Math.max(1.5, sr * 0.13);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(x + sr * 0.20, y - sr * 0.50);
          ctx.lineTo(x - sr * 0.12, y + sr * 0.06);
          ctx.lineTo(x + sr * 0.12, y + sr * 0.06);
          ctx.lineTo(x - sr * 0.20, y + sr * 0.50);
          ctx.stroke();
          ctx.restore();
        }

        // ── Partikel ────────────────────────────────────
        ctx.save();
        ctx.fillStyle = '#fffde7';
        ctx.shadowColor = '#fff8c0';
        ctx.shadowBlur = d.particleR * 1.8;
        for (const p of state.particles) {
          if (p.collected) continue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, d.particleR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // ── Roboter ─────────────────────────────────────
        drawRobot(state.robots[0], P1_COLOR);
        drawRobot(state.robots[1], P2_COLOR);

        // ── HUD-Streifen ────────────────────────────────
        {
          const hud = d.hudH;
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, w, hud);
          ctx.strokeStyle = '#242424';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, hud);
          ctx.lineTo(w, hud);
          ctx.stroke();

          const barW   = Math.round(w * 0.095);
          const barH   = Math.round(hud * 0.26);
          const barY   = Math.round((hud - barH) / 2);
          const gap    = Math.round(w * 0.012);
          const p1Off  = Math.round(w * 0.022);

          // P1 Akku-Bar (Cyan)
          const bat1 = (state.robots[0].battery < LOW_BATTERY && flash) ? '#f44336' : P1_COLOR;
          drawBar(p1Off, barY, barW, barH, state.robots[0].battery, bat1);
          // P1 Behälter-Bar (Amber)
          const bin1 = (state.robots[0].bin > HIGH_BIN && flash) ? '#f44336' : '#ffb300';
          drawBar(p1Off + barW + gap, barY, barW, barH, state.robots[0].bin, bin1);

          // P1 Score
          const scoreFont = Math.floor(hud * 0.42);
          ctx.font = `${scoreFont}px "Press Start 2P", Courier New`;
          ctx.textAlign = 'center';
          ctx.fillStyle = P1_COLOR;
          ctx.fillText(state.robots[0].score, w * 0.30, hud * 0.75);

          // Timer Mitte
          const secs = Math.ceil(Math.max(0, state.timeLeft));
          const mm = Math.floor(secs / 60);
          const ss = String(secs % 60).padStart(2, '0');
          const timerColor = (secs <= 10 && flash) ? '#f44336' : '#ffffff';
          ctx.fillStyle = timerColor;
          ctx.font = `${Math.floor(hud * 0.38)}px "Press Start 2P", Courier New`;
          ctx.textAlign = 'center';
          ctx.fillText(`${mm}:${ss}`, w / 2, hud * 0.75);

          // P2 Score
          ctx.fillStyle = P2_COLOR;
          ctx.font = `${scoreFont}px "Press Start 2P", Courier New`;
          ctx.textAlign = 'center';
          ctx.fillText(state.robots[1].score, w * 0.70, hud * 0.75);

          // P2 Bars (von rechts, gespiegelt zu P1)
          const p2Off = w - p1Off;
          const bat2 = (state.robots[1].battery < LOW_BATTERY && flash) ? '#f44336' : P2_COLOR;
          drawBar(p2Off - barW, barY, barW, barH, state.robots[1].battery, bat2);
          const bin2 = (state.robots[1].bin > HIGH_BIN && flash) ? '#f44336' : '#ffb300';
          drawBar(p2Off - barW * 2 - gap, barY, barW, barH, state.robots[1].bin, bin2);
        }

        // ── Spielende-Overlay ────────────────────────────
        if (state.phase === 'gameover') {
          ctx.fillStyle = 'rgba(0,0,0,0.84)';
          ctx.fillRect(0, 0, w, h);

          const color = state.winner === 1 ? P1_COLOR : state.winner === 2 ? P2_COLOR : '#ffffff';
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = Math.round(w * 0.03);
          ctx.textAlign = 'center';

          if (state.winner === -1) {
            ctx.font = `${Math.floor(h * 0.072)}px "Press Start 2P", Courier New`;
            ctx.fillText('UNENTSCHIEDEN', w / 2, h * 0.42);
          } else {
            // Zwei Zeilen wie Pong: "SPIELER X" + "GEWINNT"
            ctx.font = `${Math.floor(h * 0.09)}px "Press Start 2P", Courier New`;
            ctx.fillText(`SPIELER ${state.winner}`, w / 2, h * 0.38);
            ctx.font = `${Math.floor(h * 0.055)}px "Press Start 2P", Courier New`;
            ctx.fillText('GEWINNT', w / 2, h * 0.51);
          }
          ctx.shadowBlur = 0;

          ctx.font = `${Math.floor(h * 0.042)}px "Press Start 2P", Courier New`;
          ctx.fillStyle = P1_COLOR;
          ctx.fillText(`P1: ${state.robots[0].score}`, w * 0.30, h * 0.64);
          ctx.fillStyle = P2_COLOR;
          ctx.fillText(`P2: ${state.robots[1].score}`, w * 0.70, h * 0.64);

          ctx.fillStyle = '#555';
          ctx.font = `${Math.floor(h * 0.027)}px "Press Start 2P", Courier New`;
          ctx.fillText('A · NEUSTART', w / 2, h * 0.78);
        }
      },

      resize(nw, nh) {
        const sx = nw / w, sy = nh / h;
        w = nw; h = nh;
        for (const r of state.robots) { r.x *= sx; r.y *= sy; }
        for (const p of state.particles) { p.x *= sx; p.y *= sy; }
        // Gameplay-Parameter neu berechnen
        const d = dims();
        state.cellSize = d.cellSize;
        state.playTop  = d.playTop;
        state.station.x = state.station.col * d.cellSize + d.cellSize / 2;
        state.station.y = d.playTop + state.station.row * d.cellSize + d.cellSize / 2;
        state.station.dockR = Math.round(d.cellSize * 1.1);
      },

      destroy() { /* AudioContext gehört der Console */ },

      onDisconnect(player) {
        const r = state.robots[player - 1];
        r.stickX = 0;
        r.stickY = 0;
      }
    };
  }
};
