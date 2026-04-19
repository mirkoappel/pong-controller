// Game-View: Canvas, Loop, Start/Exit.
import { conns, lastInput, code, localPlayers } from '../services/connection.js';
import { getAudioContext } from '../services/audio.js';
import { showScreen } from '../app.js';
import { resetMenu } from './menu.js';

let currentGame = null;
let rafId = null;
let canvas, ctx, gameView;

// Keyboard-P1-Input: Pfeiltasten = Joystick, A/Space = A, D = B
const keys = new Set();
let prevKbGp = null;

function makeKbGamepad() {
  const up    = keys.has('ArrowUp');
  const down  = keys.has('ArrowDown');
  const left  = keys.has('ArrowLeft');
  const right = keys.has('ArrowRight');
  const x = right ? 1 : left ? -1 : 0;
  const y = down  ? 1 : up   ? -1 : 0;
  return {
    joystick: { x, y, active: up || down || left || right },
    dpad:     { up, down, left, right },
    a:      keys.has('KeyA') || keys.has('Space'),
    b:      keys.has('KeyD'),
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
  window.addEventListener('keydown', e => { if (currentGame) keys.add(e.code); });
  window.addEventListener('keyup',   e => keys.delete(e.code));
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
  prevKbGp = null;
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
    if (localPlayers.has(1)) {
      const kbGp = makeKbGamepad();
      currentGame.input?.(1, kbGp, prevKbGp);
      prevKbGp = kbGp;
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
