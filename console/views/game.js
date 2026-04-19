// Game-View: Canvas, Loop, Start/Exit, In-Game-Overlay (Slide-Menü).
import { conns, lastInput, code, localPlayers } from '../services/connection.js';
import { getAudioContext } from '../services/audio.js';
import { resetMenu, goToGame } from './menu.js';

// Kein Import von app.js — DOM direkt manipulieren bricht die zirkuläre Abhängigkeit
function showMainMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-menu').classList.add('active');
}

let currentGame = null;
let currentGameId = null;
let rafId = null;
let paused = false;
let canvas, ctx, gameView, toast, igOverlay, igSlidesEl, igTrack, igSlides, igNavTop, igNavArrow, igNavLabel, igItems;
let toastTimer = null;
let igSlideIdx = 0;   // 0 = Pause-Menü, 1 = Hilfe
let igMenuIdx  = 0;   // ausgewählter Eintrag im Pause-Menü

// P1: Pfeiltasten + Enter, P2: WASD + Leertaste
const keys = new Set();
const prevKbGp = {};

const KB = {
  1: { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight',
       a:['Enter','NumpadEnter'], b:['ShiftRight','ShiftLeft'] },
  2: { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD', a:['Space'], b:['KeyQ'] },
};

const IG_ITEMS = ['WEITER', 'SPIEL BEENDEN', 'HILFE'];

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
  canvas      = document.getElementById('game-canvas');
  ctx         = canvas.getContext('2d');
  gameView    = document.getElementById('game-view');
  toast       = document.getElementById('game-toast');
  igOverlay   = document.getElementById('ingame-overlay');
  igSlidesEl  = document.getElementById('ig-slides');
  igTrack     = document.getElementById('ig-slides-track');
  igSlides    = igOverlay.querySelectorAll('.ig-slide');
  igNavTop    = document.getElementById('ig-nav-top');
  igNavArrow  = document.getElementById('ig-nav-arrow');
  igNavLabel  = document.getElementById('ig-nav-label');
  igItems     = igOverlay.querySelectorAll('.ig-item');

  igItems.forEach((el, i) => el.addEventListener('click', () => {
    if (igSlideIdx !== 0) return;
    igMenuIdx = i;
    selectIgMenuItem();
  }));

  igNavTop.addEventListener('click', () => {
    if (igSlideIdx > 0) { igSlideIdx--; refreshIg(); }
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    refreshIg();
    currentGame?.resize?.(canvas.width, canvas.height);
  });

  window.addEventListener('keydown', e => {
    if (!currentGame) return;
    if (e.code === 'Escape') { e.preventDefault(); handleEsc(); return; }
    if (paused) { handleIgKey(e); return; }
    keys.add(e.code);
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
      e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
}

function handleEsc() {
  if (!paused) { openIgOverlay(); return; }
  if (igSlideIdx > 0) { igSlideIdx = 0; refreshIg(); return; }
  resumeGame();
}

function handleIgKey(e) {
  if (igSlideIdx === 1) {
    if (e.code === 'Escape' || e.code === 'KeyB' || e.code === 'Backspace' ||
        e.code === 'ArrowUp' || e.code === 'KeyW') {
      igSlideIdx = 0; refreshIg(); e.preventDefault();
    }
    return;
  }
  // Slide 0: Menü-Navigation
  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    igMenuIdx = (igMenuIdx - 1 + IG_ITEMS.length) % IG_ITEMS.length;
    refreshIgItems(); e.preventDefault();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    igMenuIdx = (igMenuIdx + 1) % IG_ITEMS.length;
    refreshIgItems(); e.preventDefault();
  } else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
    selectIgMenuItem(); e.preventDefault();
  }
}

function selectIgMenuItem() {
  if (igMenuIdx === 0) { resumeGame(); }
  else if (igMenuIdx === 1) { closeIgOverlay(); exitGame(); }
  else if (igMenuIdx === 2) { igSlideIdx = 1; refreshIg(); }
}

function refreshIg() {
  const h = igSlidesEl.clientHeight;
  igSlides.forEach(s => s.style.height = h + 'px');
  igTrack.style.transform = `translateY(${-igSlideIdx * h}px)`;

  const canBack = igSlideIdx > 0;
  igNavArrow.classList.toggle('visible', canBack);
  igNavLabel.classList.toggle('visible', canBack);
  igNavLabel.textContent = canBack ? 'ZURÜCK' : '';
}

function refreshIgItems() {
  igItems.forEach((el, i) => el.classList.toggle('selected', i === igMenuIdx));
}

export function openIgMenu() { openIgOverlay(); }

function openIgOverlay() {
  paused = true;
  igSlideIdx = 0;
  igMenuIdx  = 0;
  keys.clear();
  igOverlay.classList.add('visible');
  refreshIgItems();
  refreshIg();
}

function closeIgOverlay() {
  igOverlay.classList.remove('visible');
}

function resumeGame() {
  closeIgOverlay();
  paused = false;
}

export const getCurrentGame    = () => currentGame;
export const isIngameMenuOpen  = () => paused;

export function handleIngameMenuInput(gp, prev) {
  if (igSlideIdx === 1) {
    if ((gp.b && !prev?.b) || (gp.select && !prev?.select) ||
        (gp.dpad?.up && !prev?.dpad?.up)) {
      igSlideIdx = 0; refreshIg();
    }
    return;
  }
  if (gp.dpad?.up   && !prev?.dpad?.up)   { igMenuIdx = (igMenuIdx - 1 + IG_ITEMS.length) % IG_ITEMS.length; refreshIgItems(); }
  if (gp.dpad?.down && !prev?.dpad?.down) { igMenuIdx = (igMenuIdx + 1) % IG_ITEMS.length; refreshIgItems(); }
  if (gp.a     && !prev?.a)               selectIgMenuItem();
  if (gp.b     && !prev?.b)               resumeGame();
  if (gp.start && !prev?.start)           resumeGame();
}

function resizeCanvas() {
  canvas.width  = canvas.clientWidth  * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}

export function startGame(name) {
  const mod = window.RetroGames?.[name];
  if (!mod) return;
  currentGameId = name;
  paused = false;
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
  showToast('ESC · MENÜ', 3000);
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(50, now - last) / 1000; last = now;
    if (!paused) {
      for (const p of localPlayers) {
        if (!conns.has(p)) {
          const kbGp = makeKbGamepad(p);
          currentGame.input?.(p, kbGp, prevKbGp[p] || null);
          prevKbGp[p] = kbGp;
        }
      }
      currentGame.update?.(dt);
    }
    currentGame.draw?.();
    rafId = requestAnimationFrame(loop);
  })(performance.now());
}

function showToast(text, duration) {
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
  toast.textContent = text;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => { toast.classList.remove('visible'); toastTimer = null; }, duration);
}

export function exitGame() {
  cancelAnimationFrame(rafId);
  currentGame?.destroy?.();
  const lastId = currentGameId;
  currentGame = null;
  currentGameId = null;
  paused = false;
  closeIgOverlay();
  gameView.style.display = 'none';
  showMainMenu();
  goToGame(lastId);
}
