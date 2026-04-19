// Slime Volleyball — zwei Halbkreis-Slimes, ein Ball, ein Netz.
// Wer den Ball auf der eigenen Seite am Boden liegen lässt, verliert den Punkt.
window.RetroGames = window.RetroGames || {};

window.RetroGames.volleyball = {
  name: 'VOLLEYBALL',
  tagline: '1–2 SPIELER · SLIME KLASSIKER',
  minPlayers: 1,
  maxPlayers: 2,

  artSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="200" fill="#000"/>
      <line x1="0" y1="172" x2="320" y2="172" stroke="#222" stroke-width="2"/>
      <rect x="158" y="130" width="4" height="42" fill="#4fc3f7" opacity="0.7"/>
      <path d="M 60 172 A 26 26 0 0 1 112 172 Z" fill="#4fc3f7"/>
      <path d="M 208 172 A 26 26 0 0 1 260 172 Z" fill="#ff4fa3"/>
      <circle cx="140" cy="72" r="7" fill="#fff"/>
      <text x="90"  y="42" font-family="'Press Start 2P', 'Courier New', monospace" font-size="22" fill="#4fc3f7" text-anchor="middle" opacity="0.9">2</text>
      <text x="230" y="42" font-family="'Press Start 2P', 'Courier New', monospace" font-size="22" fill="#ff4fa3" text-anchor="middle" opacity="0.9">1</text>
    </svg>
  `,

  create(ctx, W, H, numPlayers, api) {
    const WIN_SCORE = 7;
    const BLUE = '#4fc3f7';
    const PINK = '#ff4fa3';

    let w = W, h = H;

    function dims() {
      const groundY = Math.round(h * 0.9);
      const slimeR  = Math.round(h * 0.13);
      const ballR   = Math.max(6, Math.round(h * 0.022));
      const netW    = Math.max(4, Math.round(w * 0.006));
      const netH    = Math.round(h * 0.24);
      const centerX = w / 2;
      return { groundY, slimeR, ballR, netW, netH, centerX };
    }

    const { groundY } = dims();
    const state = {
      p1: { x: w * 0.25, y: groundY, vx: 0, vy: 0, score: 0 },
      p2: { x: w * 0.75, y: groundY, vx: 0, vy: 0, score: 0 },
      ball: { x: w * 0.25, y: h * 0.35, vx: 0, vy: 0 },
      server: Math.random() < 0.5 ? 1 : 2,
      running: false,
      serveTimer: 0,
      winner: 0
    };

    // ── Audio ────────────────────────────────────────────
    const audioCtx = api.audioCtx;
    function blip(freq, dur, type = 'square', vol = 0.12) {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur);
    }
    const sndHit   = () => blip(540, 0.05);
    const sndNet   = () => blip(280, 0.06);
    const sndWall  = () => blip(200, 0.04);
    const sndPoint = () => blip(120, 0.25, 'square', 0.18);
    const sndWin   = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'square', 0.18), i * 140)); };

    function serve() {
      const { groundY } = dims();
      const sx = state.server === 1 ? w * 0.25 : w * 0.75;
      state.ball.x = sx;
      state.ball.y = h * 0.35;
      state.ball.vx = 0;
      state.ball.vy = 0;
      state.serveTimer = 0;
      state.running = false;
    }

    function resetPositions() {
      const { groundY } = dims();
      state.p1.x = w * 0.25; state.p1.y = groundY; state.p1.vx = 0; state.p1.vy = 0;
      state.p2.x = w * 0.75; state.p2.y = groundY; state.p2.vx = 0; state.p2.vy = 0;
    }

    function score(winner) {
      sndPoint();
      if (winner === 1) state.p1.score++; else state.p2.score++;
      if (state.p1.score >= WIN_SCORE) { state.winner = 1; sndWin(); return; }
      if (state.p2.score >= WIN_SCORE) { state.winner = 2; sndWin(); return; }
      state.server = winner;
      resetPositions();
      serve();
    }

    resetPositions();
    serve();

    return {
      resize(nw, nh) {
        const sx = nw / w, sy = nh / h;
        w = nw; h = nh;
        state.p1.x *= sx; state.p1.y *= sy;
        state.p2.x *= sx; state.p2.y *= sy;
        state.ball.x *= sx; state.ball.y *= sy;
      },

      input(player, gp, prev) {
        if (gp.select && !prev?.select) { api.exit(); return; }

        if (state.winner) {
          if ((gp.start && !prev?.start) || (gp.a && !prev?.a)) {
            state.p1.score = 0; state.p2.score = 0;
            state.winner = 0;
            state.server = Math.random() < 0.5 ? 1 : 2;
            resetPositions();
            serve();
          }
          return;
        }

        const p = player === 1 ? state.p1 : state.p2;
        const { groundY, slimeR, netW, centerX } = dims();

        // Joystick → direkte Position in eigener Spielfeldhälfte
        if (gp.joystick?.active) {
          const minX = player === 1 ? slimeR : centerX + slimeR + netW/2;
          const maxX = player === 1 ? centerX - slimeR - netW/2 : w - slimeR;
          const prevX = p.x;
          p.x = minX + ((gp.joystick.x + 1) / 2) * (maxX - minX);
          p.vx = (p.x - prevX) / Math.max(1/120, 1/60); // momentum-Schätzung für Ball-Kollision
        } else {
          const dx = gp.dpad?.right ? 1 : gp.dpad?.left ? -1 : 0;
          p.vx = dx * w * 0.55;
        }

        if (gp.a && !prev?.a && Math.abs(p.y - groundY) < 1) {
          p.vy = -h * 0.95;
        }
      },

      onDisconnect(player) { /* KI übernimmt automatisch */ },

      update(dt) {
        if (state.winner) return;

        const { groundY, slimeR, ballR, netW, netH, centerX } = dims();
        const gSlime = h * 2.4;
        const gBall  = h * 1.4;

        // KI für jeden nicht verbundenen Spieler
        const conns = api.getConns();
        if (!conns.has(1)) runAI(state.p1, 1);
        if (!conns.has(2)) runAI(state.p2, 2);

        // Slimes: Bewegung, Gravitation, Boden
        for (let i = 0; i < 2; i++) {
          const p = i === 0 ? state.p1 : state.p2;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += gSlime * dt;
          if (p.y > groundY) { p.y = groundY; p.vy = 0; }

          if (i === 0) {
            p.x = Math.max(slimeR, Math.min(centerX - slimeR - netW/2, p.x));
          } else {
            p.x = Math.max(centerX + slimeR + netW/2, Math.min(w - slimeR, p.x));
          }
        }

        // Serve-Countdown
        if (!state.running) {
          state.serveTimer += dt;
          if (state.serveTimer >= 0.8) state.running = true;
          return;
        }

        // Ball-Physik
        const b = state.ball;
        b.vy += gBall * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x - ballR < 0) { b.x = ballR;     b.vx = -b.vx; sndWall(); }
        if (b.x + ballR > w) { b.x = w - ballR; b.vx = -b.vx; sndWall(); }
        if (b.y - ballR < 0) { b.y = ballR;     b.vy = -b.vy; sndWall(); }

        // Netz-Kollision (Pfosten centerX, Höhe netH)
        const netLeft  = centerX - netW/2;
        const netRight = centerX + netW/2;
        const netTop   = groundY - netH;
        if (b.x + ballR > netLeft && b.x - ballR < netRight && b.y + ballR > netTop) {
          if (b.y < netTop) {
            b.y = netTop - ballR;
            b.vy = -Math.abs(b.vy) * 0.7;
          } else if (b.x < centerX) {
            b.x = netLeft - ballR;
            b.vx = -Math.abs(b.vx);
          } else {
            b.x = netRight + ballR;
            b.vx = Math.abs(b.vx);
          }
          sndNet();
        }

        // Slime-Kollisionen (nur obere Halbkugel)
        [state.p1, state.p2].forEach(p => {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const dist = Math.hypot(dx, dy);
          const R = slimeR + ballR;
          if (dist < R && dy < 0 && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            b.x = p.x + nx * R;
            b.y = p.y + ny * R;
            const v = b.vx * nx + b.vy * ny;
            b.vx -= 2 * v * nx;
            b.vy -= 2 * v * ny;
            // Momentum vom Slime übertragen
            b.vx += p.vx * 0.35;
            b.vy += p.vy * 0.5;
            if (b.vy > -h * 0.3) b.vy = -h * 0.5;
            // Speed-Limit
            const maxSpeed = w * 1.3;
            const speed = Math.hypot(b.vx, b.vy);
            if (speed > maxSpeed) { b.vx *= maxSpeed/speed; b.vy *= maxSpeed/speed; }
            sndHit();
          }
        });

        // Boden-Kontakt → Punkt
        if (b.y + ballR >= groundY) {
          b.y = groundY - ballR;
          score(b.x < centerX ? 2 : 1);
        }
      },

      draw() {
        const { groundY, slimeR, ballR, netW, netH, centerX } = dims();

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Boden-Linie
        ctx.save();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = Math.max(2, Math.round(h * 0.004));
        ctx.beginPath();
        ctx.moveTo(0, groundY); ctx.lineTo(w, groundY);
        ctx.stroke();
        ctx.restore();

        // Netz
        ctx.save();
        ctx.fillStyle = BLUE;
        ctx.shadowColor = BLUE;
        ctx.shadowBlur = Math.round(w * 0.015);
        ctx.globalAlpha = 0.75;
        ctx.fillRect(centerX - netW/2, groundY - netH, netW, netH);
        ctx.restore();

        // Scores
        ctx.save();
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.9;
        ctx.font = `${Math.floor(h * 0.14)}px "Press Start 2P", Courier New`;
        ctx.fillStyle = BLUE; ctx.fillText(state.p1.score, w * 0.28, h * 0.22);
        ctx.fillStyle = PINK; ctx.fillText(state.p2.score, w * 0.72, h * 0.22);
        ctx.restore();

        // Slimes
        drawSlime(state.p1.x, state.p1.y, slimeR, BLUE);
        drawSlime(state.p2.x, state.p2.y, slimeR, PINK);

        // Ball
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = Math.round(w * 0.015);
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Sieg-Overlay
        if (state.winner) {
          ctx.fillStyle = 'rgba(0,0,0,0.82)';
          ctx.fillRect(0, 0, w, h);
          const color = state.winner === 1 ? BLUE : PINK;
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
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
          ctx.restore();
        }
      },

      destroy() { /* AudioContext gehört der Console */ }
    };

    function drawSlime(x, y, r, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.round(w * 0.02);
      ctx.beginPath();
      ctx.arc(x, y, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function runAI(p, side) {
      const { groundY, slimeR, centerX, netW } = dims();
      const b = state.ball;
      const ownSide = side === 1 ? b.x < centerX : b.x > centerX;
      const dirToOpponent = side === 1 ? 1 : -1;
      const offset = slimeR * 0.6;
      const idle = side === 1 ? w * 0.25 : w * 0.75;

      // In der Luft nicht eingreifen — Trajektorie aus dem Sprung bewahren
      const onGround = Math.abs(p.y - groundY) < 1;
      if (!onGround) return;

      // Ziel: auf eigener Seite unter den Ball mit Offset, sonst Idle-Position
      const rawTarget = ownSide ? (b.x - dirToOpponent * offset) : idle;
      // Nicht näher ans Netz als 1.2 Slime-Radien (sonst klemmt der Ball)
      const netLimit = side === 1 ? centerX - slimeR * 1.2 - netW/2 : centerX + slimeR * 1.2 + netW/2;
      const targetX = side === 1 ? Math.min(rawTarget, netLimit) : Math.max(rawTarget, netLimit);
      const dx = targetX - p.x;
      p.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 4, w * 0.55);

      // Sprung, wenn Ball nahe genug und fällt
      if (ownSide && b.y < groundY - slimeR * 1.3 && Math.abs(b.x - p.x) < slimeR * 1.8 && b.vy > 0) {
        p.vy = -h * 0.92;
        // Vorwärts-Impuls beim Absprung → Ball bekommt horizontale Energie Richtung Gegner
        p.vx = dirToOpponent * w * 0.5;
      }
    }
  }
};
