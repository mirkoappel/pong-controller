// Boot-View: Terminal-Intro → RETROCON-Animation → onFinish().
// Der User-Klick hier ist die einzige Gesture — hier wird der globale
// AudioContext erzeugt, damit Audio im Rest der App funktioniert.
import { createAudioContext } from '../services/audio.js';

const WORD = 'RETROCON';
const LETTER_DELAY = 110;

const LINES = [
  { text: 'RETROCON OS  v0.4.0',              delay: 0 },
  { text: 'COPYRIGHT (C) 2026 RETROCON',      delay: 300 },
  { text: '',                                 delay: 550 },
  { text: 'BIOS v2.1  CHECKING MEMORY... OK', delay: 650 },
  { text: 'WEBRTC ENGINE........... LOADED',  delay: 950 },
  { text: 'P2P BROKER.............. READY',   delay: 1200 },
  { text: 'GAME MODULES............ 2 FOUND', delay: 1450 },
  { text: 'CONTROLLER DRIVER....... ACTIVE',  delay: 1700 },
  { text: '',                                 delay: 1950 },
  { text: 'SYSTEM OK.',                       delay: 2050 },
];
const PRESS_DELAY = 2500;

export function initBoot(onFinish) {
  const terminal = document.getElementById('boot-terminal');
  const cursor   = document.getElementById('boot-cursor');
  const pressKey = document.getElementById('boot-press-key');
  const logoScreen = document.getElementById('boot-logo-screen');
  const logoEl     = document.getElementById('boot-logo');

  LINES.forEach(({ text, delay }) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 't-line';
      el.textContent = text;
      terminal.insertBefore(el, pressKey);
      requestAnimationFrame(() => el.classList.add('show'));
    }, delay);
  });

  setTimeout(() => cursor.classList.add('show'), PRESS_DELAY - 200);
  setTimeout(() => {
    pressKey.classList.add('show');
    enableStart();
  }, PRESS_DELAY);

  WORD.split('').forEach(ch => {
    const s = document.createElement('span');
    s.className = 'letter';
    s.textContent = ch;
    logoEl.appendChild(s);
  });

  let started = false;
  function startIntro() {
    if (started) return;
    started = true;

    const ctx = createAudioContext();
    if (ctx) playBoot(ctx);

    logoScreen.classList.add('active');
    terminal.style.display = 'none';

    logoEl.querySelectorAll('.letter').forEach((el, i) =>
      setTimeout(() => el.classList.add('pop'), i * LETTER_DELAY)
    );

    const total = WORD.length * LETTER_DELAY + 1300;
    setTimeout(() => {
      document.getElementById('boot').classList.remove('active');
      onFinish();
    }, total);
  }

  function enableStart() {
    document.addEventListener('keydown',    startIntro, { once: true });
    document.addEventListener('click',      startIntro, { once: true });
    document.addEventListener('touchstart', e => { e.preventDefault(); startIntro(); }, { once: true, passive: false });
  }
}

function playBoot(ctx) {
  function tone(freq, start, dur, vol = 0.1, type = 'square') {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    const t = ctx.currentTime + start;
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  [262,294,330,370,392,440,494,523].forEach((f, i) =>
    tone(f, i * (LETTER_DELAY / 1000), 0.16, 0.1)
  );
  const end = WORD.length * (LETTER_DELAY / 1000);
  [523,659,784].forEach((f, i) => tone(f, end + i * 0.03, 0.9, 0.07));
}
