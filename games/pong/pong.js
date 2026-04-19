// Pong als Retro-Console-Spielmodul
window.RetroGames = window.RetroGames || {};

window.RetroGames.pong = {
  name: 'PONG',
  tagline: '1–2 SPIELER · CLASSIC ARCADE',
  minPlayers: 1,
  maxPlayers: 2,

  // Preview-Grafik für die Menü-Karte (inline SVG)
  artSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="200" fill="#000"/>
      <line x1="160" y1="10" x2="160" y2="190" stroke="#4fc3f7" stroke-width="2" stroke-dasharray="6 6" opacity="0.5"/>
      <rect x="18"  y="60"  width="8" height="50" fill="#4fc3f7"/>
      <rect x="294" y="95"  width="8" height="50" fill="#4fc3f7"/>
      <circle cx="170" cy="90" r="6" fill="#4fc3f7"/>
      <text x="90"  y="40" font-family="'Press Start 2P', 'Courier New', monospace" font-size="22" fill="#4fc3f7" text-anchor="middle" opacity="0.9">3</text>
      <text x="230" y="40" font-family="'Press Start 2P', 'Courier New', monospace" font-size="22" fill="#4fc3f7" text-anchor="middle" opacity="0.9">1</text>
    </svg>
  `,

  create(ctx, W, H, numPlayers, api) {
    const AI_SPEED = 5.5, WIN_SCORE = 10;
    const ACCENT = '#4fc3f7';

    let w = W, h = H;

    // Maße proportional zur Canvas-Größe
    function dims() {
      const paddleW = Math.max(12, Math.round(w * 0.02));
      const paddleH = Math.round(h * 0.22);
      const margin  = Math.round(w * 0.06);
      const ballR   = Math.max(6, Math.round(h * 0.018));
      return { paddleW, paddleH, margin, ballR };
    }

    const { paddleH } = dims();
    const state = {
      p1: { y: h / 2 - paddleH / 2, vy: 0, score: 0, joyActive: false },
      p2: { y: h / 2 - paddleH / 2, vy: 0, score: 0, joyActive: false },
      ball: { x: w / 2, y: h / 2, vx: 0, vy: 0 },
      countdownTimer: 0,
      running: false,
      winner: 0
    };

    // ── Audio ────────────────────────────────────────────
    // Globaler AudioContext aus der Console (im Boot-Gesture erstellt).
    const audioCtx = api.audioCtx;
    function ensureAudio() {
      if (!audioCtx) return false;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return true;
    }
    function blip(freq, dur, type = 'square', vol = 0.15) {
      if (!ensureAudio()) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur);
    }
    const sndPaddle = () => blip(440, 0.05);
    const sndWall   = () => blip(220, 0.04);
    const sndScore  = () => blip(110, 0.25, 'square', 0.2);
    const sndWin    = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'square', 0.18), i * 140)); };

    function resetBall(dir = Math.random() < 0.5 ? 1 : -1) {
      state.ball.x = w / 2;
      state.ball.y = h / 2;
      const angle = (Math.random() - 0.5) * 0.6;
      const speed = Math.min(w, h) * 0.6;
      state.ball.vx = Math.cos(angle) * speed * dir;
      state.ball.vy = Math.sin(angle) * speed;
    }

    const START_DELAY = 0.8;
    function startRound() {
      state.countdownTimer = 0;
      state.running = false;
      state.winner = 0;
      resetBall();
    }
    startRound();

    return {
      resize(nw, nh) {
        const sx = nw / w, sy = nh / h;
        w = nw; h = nh;
        state.p1.y *= sy; state.p2.y *= sy;
        state.ball.x *= sx; state.ball.y *= sy;
      },

      input(player, gp, prev) {
        const p = player === 1 ? state.p1 : state.p2;
        const { paddleH } = dims();
        if (gp.type === 'keyboard') {
          // Tastatur: kraftbasierte Bewegung (Geschwindigkeit statt absoluter Position)
          const KSPEED = h * 0.75;
          p.vy = gp.dpad.up ? -KSPEED : gp.dpad.down ? KSPEED : 0;
        } else {
          p.vy = 0;
          if (gp.joystick.active) {
            p.joyActive = true;
            p.y = ((gp.joystick.y + 1) / 2) * (h - paddleH);
          } else {
            p.joyActive = false;
          }
        }
        // SELECT = zurück zum Home
        if (gp.select && !(prev?.select)) api.exit();
        // START / A = nach Sieg neu starten
        if (state.winner && ((gp.start && !(prev?.start)) || (gp.a && !(prev?.a)))) {
          state.p1.score = 0; state.p2.score = 0;
          startRound();
        }
      },

      onDisconnect(player) { /* einfach pausieren? aktuell: weiterlaufen */ },

      update(dt) {
        if (state.winner) return;

        // Kurze Verzögerung vor Rundenstart
        if (!state.running) {
          state.countdownTimer += dt;
          if (state.countdownTimer >= START_DELAY) state.running = true;
          return;
        }

        const { paddleW, paddleH, margin, ballR } = dims();

        // Tastatur-Paddle-Bewegung (vy wird in input() gesetzt)
        state.p1.y += state.p1.vy * dt;
        state.p2.y += state.p2.vy * dt;

        // KI für jeden nicht verbundenen Spieler
        const conns = api.getConns();
        const aiStep = AI_SPEED * dt * 60;
        if (!conns.has(1)) {
          const dy = (state.ball.y - paddleH / 2) - state.p1.y;
          state.p1.y += Math.max(-aiStep, Math.min(aiStep, dy * 0.08));
        }
        if (!conns.has(2)) {
          const dy = (state.ball.y - paddleH / 2) - state.p2.y;
          state.p2.y += Math.max(-aiStep, Math.min(aiStep, dy * 0.08));
        }

        // Ball
        const b = state.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wand oben/unten
        if (b.y - ballR < 0)     { b.y = ballR;     b.vy = -b.vy; sndWall(); }
        if (b.y + ballR > h)     { b.y = h - ballR; b.vy = -b.vy; sndWall(); }

        // Paddle P1 (links)
        const p1X = margin;
        if (b.x - ballR < p1X + paddleW && b.x > p1X &&
            b.y > state.p1.y && b.y < state.p1.y + paddleH && b.vx < 0) {
          b.vx = -b.vx * 1.05;
          const hit = (b.y - (state.p1.y + paddleH / 2)) / (paddleH / 2);
          b.vy += hit * 200;
          sndPaddle();
        }
        // Paddle P2 (rechts)
        const p2X = w - margin - paddleW;
        if (b.x + ballR > p2X && b.x < p2X + paddleW &&
            b.y > state.p2.y && b.y < state.p2.y + paddleH && b.vx > 0) {
          b.vx = -b.vx * 1.05;
          const hit = (b.y - (state.p2.y + paddleH / 2)) / (paddleH / 2);
          b.vy += hit * 200;
          sndPaddle();
        }

        // Tore
        if (b.x < 0)     { state.p2.score++; sndScore(); checkWin(2) || (startRound(), state.ball.vx = Math.abs(state.ball.vx)); }
        if (b.x > w)     { state.p1.score++; sndScore(); checkWin(1) || (startRound(), state.ball.vx = -Math.abs(state.ball.vx)); }

        // Paddle-Begrenzung
        state.p1.y = Math.max(0, Math.min(h - paddleH, state.p1.y));
        state.p2.y = Math.max(0, Math.min(h - paddleH, state.p2.y));
      },

      draw() {
        const { paddleW, paddleH, margin, ballR } = dims();

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Mittellinie (gestrichelt, Akzent-Blau mit Glow-Transparenz)
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = Math.max(2, Math.round(w * 0.003));
        ctx.setLineDash([Math.round(h * 0.03), Math.round(h * 0.03)]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.restore();

        // Score
        ctx.fillStyle = ACCENT;
        ctx.globalAlpha = 0.9;
        ctx.font = `${Math.floor(h * 0.14)}px "Press Start 2P", Courier New`;
        ctx.textAlign = 'center';
        ctx.fillText(state.p1.score, w * 0.28, h * 0.24);
        ctx.fillText(state.p2.score, w * 0.72, h * 0.24);
        ctx.globalAlpha = 1;

        // Paddles (beide Akzent-Blau, mit leichtem Glow)
        ctx.fillStyle = ACCENT;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = Math.round(w * 0.02);
        ctx.fillRect(margin, state.p1.y, paddleW, paddleH);
        ctx.fillRect(w - margin - paddleW, state.p2.y, paddleW, paddleH);

        // Ball
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sieg-Overlay
        if (state.winner) {
          ctx.fillStyle = 'rgba(0,0,0,0.82)';
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = ACCENT;
          ctx.shadowColor = ACCENT;
          ctx.shadowBlur = Math.round(w * 0.03);
          ctx.textAlign = 'center';
          ctx.font = `${Math.floor(h * 0.09)}px "Press Start 2P", Courier New`;
          ctx.fillText(`SPIELER ${state.winner}`, w / 2, h * 0.42);

          ctx.font = `${Math.floor(h * 0.055)}px "Press Start 2P", Courier New`;
          ctx.fillText('GEWINNT', w / 2, h * 0.54);
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#555';
          ctx.font = `${Math.floor(h * 0.028)}px "Press Start 2P", Courier New`;
          ctx.fillText('A · NEUSTART', w / 2, h * 0.72);
        }
      },

      destroy() { /* AudioContext gehört der Console, nicht schließen */ }
    };

    function checkWin(player) {
      const score = player === 1 ? state.p1.score : state.p2.score;
      if (score >= WIN_SCORE) {
        state.winner = player;
        state.running = false;
        sndWin();
        return true;
      }
      return false;
    }
  }
};
