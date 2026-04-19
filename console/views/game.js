// Game-View: Canvas, Loop, Start/Exit.
import { conns, lastInput, code, localPlayers } from '../services/connection.js';
import { getAudioContext } from '../services/audio.js';
import { showScreen } from '../app.js';
import { resetMenu } from './menu.js';

let currentGame = null;
let rafId = null;
let canvas, ctx, gameView;

// Tastatur-Input: P1 = WASD + Space(A) + Q(B), P2 = Pfeiltasten + Enter(A) + Shift(B)
const keys = new Set();
const prevKbGp = {};

const KB = {
  1: { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD', a:['Space'],            b:['KeyQ'] },
  2: { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight',
       a:['Enter','Numpad0'], b:['ShiftLeft','ShiftRight'] },
};

function makeKbGamepad(player) {
  const m = KB[player] || KB[1];
  const up    = keys.has(m.up);
  const down  = keys.has(m.down);
  const left  = keys.has(m.left);
  const right = keys.has(m.right);
  const x = right ? 1 : left ? -1 : 0;
  const y = down  ? 1 : up   ? -1 : 0;
  return {
    type: 'keyboard',
    joystick: { x, y, active: up || down || left || right },
    dpad:     { up, down, left, right },
    a:      m.a.some(k => keys.has(k)),
    b:      m.b.some(k => keys.has(k)),
    select: false,
    start:  false,
  };
}

export function initGame() {
  canvas   = document.getElementById('game-canvas');
  ctx      = canvas.getContext('2d');
  gameView = document.getElementById('game-view');
  window.addEventListener('resize', () => {
    resizeCanvas();
    currentGame?.resize?.(canvas.width, canvas.height);
  });
  window.addEventListener('keydown', e => {
    if (!currentGame) return;
    keys.add(e.code);
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
      e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
}

export const getCurrentGame = () => currentGame;

function resizeCanvas() {
  canvas.width  = canvas.clientWidth  * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}

export function startGame(name) {
  const mod = window.RetroGames?.[name];
  if (!mod) return;
  gameView.style.display = 'block';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  resizeCanvas();
  keys.clear();
  for (const k in prevKbGp) delete prevKbGp[k];
  const totalPlayers = new Set([...conns.keys(), ...localPlayers]).size;
  currentGame = mod.create(ctx, canvas.width, canvas.height, Math.max(1, totalPlayers), {
    exit: exitGame,
    getConns: () => {
      const m = new Map(conns);
      for (const p of localPlayers) if (!m.has(p)) m.set(p, 'keyboard');
      return m;
    },
    audioCtx: getAudioContext(),
    code
  });
  for (const [p, gp] of lastInput) currentGame.input?.(p, gp, null);
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(50, now - last) / 1000; last = now;
    for (const p of localPlayers) {
      if (!conns.has(p)) {
        const kbGp = makeKbGamepad(p);
        currentGame.input?.(p, kbGp, prevKbGp[p] || null);
        prevKbGp[p] = kbGp;
      }
    }
    currentGame.update?.(dt);
    currentGame.draw?.();
    rafId = requestAnimationFrame(loop);
  })(performance.now());
}

export function exitGame() {
  cancelAnimationFrame(rafId);
  currentGame?.destroy?.();
  currentGame = null;
  gameView.style.display = 'none';
  showScreen('main-menu');
  resetMenu();
}
