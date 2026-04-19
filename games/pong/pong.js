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
      <text x="90"  y="40" font-family="Courier New, monospace" font-size="28" font-weight="bold" fill="#4fc3f7" text-anchor="middle" opacity="0.9">3</text>
      <text x="230" y="40" font-family="Courier New, monospace" font-size="28" font-weight="bold" fill="#4fc3f7" text-anchor="middle" opacity="0.9">1</text>
    </svg>
  `,

  create(ctx, W, H, numPlayers, api) {
    const PADDLE_W = 14, PADDLE_H = 110, BALL_R = 9;
    const AI_SPEED = 5.5, WIN_SCORE = 10;

    let w = W, h = H;
    const state = {
      p1: { y: h / 2 - PADDLE_H / 2, score: 0, joyActive: false },
      p2: { y: h / 2 - PADDLE_H / 2, score: 0, joyActive: false },
      ball: { x: w / 2, y: h / 2, vx: 0, vy: 0 },
      countdown: 3,
      countdownTimer: 0,
      running: false,
      winner: 0
    };

    // ── Audio ────────────────────────────────────────────
    // AudioContext sofort im User-Gesture-Kontext des Spielstarts erstellen
    let audioCtx = null;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
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

    function startRound() {
      state.countdown = 3;
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
        if (gp.joystick.active) {
          p.joyActive = true;
          p.y = ((gp.joystick.y + 1) / 2) * (h - PADDLE_H);
        } else {
          p.joyActive = false;
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

        // Countdown
        if (!state.running) {
          state.countdownTimer += dt;
          if (state.countdownTimer >= 1) {
            state.countdownTimer = 0;
            state.countdown--;
            if (state.countdown <= 0) state.running = true;
          }
          return;
        }

        // KI für P2 wenn niemand verbunden
        const conns = api.getConns();
        if (!conns.has(2)) {
          const target = state.ball.y - PADDLE_H / 2;
          const dy = target - state.p2.y;
          state.p2.y += Math.max(-AI_SPEED * dt * 60, Math.min(AI_SPEED * dt * 60, dy * 0.08));
        }

        // Ball
        const b = state.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wand oben/unten
        if (b.y - BALL_R < 0)     { b.y = BALL_R;     b.vy = -b.vy; sndWall(); }
        if (b.y + BALL_R > h)     { b.y = h - BALL_R; b.vy = -b.vy; sndWall(); }

        // Paddle P1 (links)
        if (b.x - BALL_R < PADDLE_W + 20 && b.x > 20 &&
            b.y > state.p1.y && b.y < state.p1.y + PADDLE_H && b.vx < 0) {
          b.vx = -b.vx * 1.05;
          const hit = (b.y - (state.p1.y + PADDLE_H / 2)) / (PADDLE_H / 2);
          b.vy += hit * 200;
          sndPaddle();
        }
        // Paddle P2 (rechts)
        if (b.x + BALL_R > w - PADDLE_W - 20 && b.x < w - 20 &&
            b.y > state.p2.y && b.y < state.p2.y + PADDLE_H && b.vx > 0) {
          b.vx = -b.vx * 1.05;
          const hit = (b.y - (state.p2.y + PADDLE_H / 2)) / (PADDLE_H / 2);
          b.vy += hit * 200;
          sndPaddle();
        }

        // Tore
        if (b.x < 0)     { state.p2.score++; sndScore(); checkWin(2) || (startRound(), state.ball.vx = Math.abs(state.ball.vx)); }
        if (b.x > w)     { state.p1.score++; sndScore(); checkWin(1) || (startRound(), state.ball.vx = -Math.abs(state.ball.vx)); }

        // Paddle-Begrenzung
        state.p1.y = Math.max(0, Math.min(h - PADDLE_H, state.p1.y));
        state.p2.y = Math.max(0, Math.min(h - PADDLE_H, state.p2.y));
      },

      draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Mittellinie
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3;
        ctx.setLineDash([14, 14]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Score
        ctx.fillStyle = '#333';
        ctx.font = `bold ${Math.floor(h * 0.18)}px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillText(state.p1.score, w * 0.25, h * 0.22);
        ctx.fillText(state.p2.score, w * 0.75, h * 0.22);

        // Paddles
        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(20, state.p1.y, PADDLE_W, PADDLE_H);
        ctx.fillStyle = '#ef9a9a';
        ctx.fillRect(w - 20 - PADDLE_W, state.p2.y, PADDLE_W, PADDLE_H);

        // Ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();

        // Countdown
        if (!state.running && !state.winner) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.floor(h * 0.3)}px Courier New`;
          ctx.fillText(state.countdown, w / 2, h / 2 + h * 0.08);
        }

        // Sieg
        if (state.winner) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#ffd54f';
          ctx.font = `${Math.floor(h * 0.3)}px serif`;
          ctx.fillText('🏆', w / 2, h / 2);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.floor(h * 0.08)}px Courier New`;
          ctx.fillText(`SPIELER ${state.winner} GEWINNT`, w / 2, h / 2 + h * 0.15);
          ctx.fillStyle = '#888';
          ctx.font = `${Math.floor(h * 0.04)}px Courier New`;
          ctx.fillText('A / START = NEUSTART · SELECT = MENÜ', w / 2, h / 2 + h * 0.25);
        }
      },

      destroy() {
        try { audioCtx?.close(); } catch {}
      }
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
