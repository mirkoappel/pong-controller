// Classic-Variant: Joystick + A/B + Select + Picker/Scan-Buttons.
// Nutzt window.RC aus ../../core.js für Verbindung, Senden, Overlays.

const gp = RC.gp;

// ── Status-LED + Wifi-Icon ───────────────────────────────
const led     = document.getElementById('led');
const btnScan = document.getElementById('btn-scan');
RC.onStatus(s => {
  const ok = s === 'connected';
  led.classList.toggle('connected', ok);
  btnScan.classList.toggle('connected', ok);
});

// ── Joystick (fixer Mittelpunkt) ─────────────────────────
const joystickArea  = document.getElementById('joystick-area');
const joystickBase  = document.getElementById('joystick-base');
const joystickThumb = document.getElementById('joystick-thumb');

let joystickTouchId = null;
let jCx = 0, jCy = 0, jMaxR = 0;

function layoutJoystick() {
  const r = joystickArea.getBoundingClientRect();
  jCx   = r.width  / 2;
  jCy   = r.height / 2;
  jMaxR = Math.min(r.width, r.height) * 0.42;
  const baseSize = jMaxR * 2;
  joystickBase.style.cssText  = `width:${baseSize}px;height:${baseSize}px;left:${jCx}px;top:${jCy}px`;
  joystickThumb.style.left = jCx + 'px';
  joystickThumb.style.top  = jCy + 'px';
}
layoutJoystick();
window.addEventListener('resize', layoutJoystick);

function joystickMove(e) {
  const r  = joystickArea.getBoundingClientRect();
  const dx = (e.clientX - r.left) - jCx;
  const dy = (e.clientY - r.top)  - jCy;
  const dist  = Math.sqrt(dx * dx + dy * dy);
  const ratio = Math.min(dist, jMaxR) / (dist || 1);

  joystickThumb.style.left = (jCx + dx * ratio) + 'px';
  joystickThumb.style.top  = (jCy + dy * ratio) + 'px';

  gp.jx = (dx * ratio) / jMaxR;
  gp.jy = (dy * ratio) / jMaxR;
  const t = 0.35;
  gp.up    = gp.jy < -t;
  gp.down  = gp.jy >  t;
  gp.left  = gp.jx < -t;
  gp.right = gp.jx >  t;
  RC.send();
}

function joystickRelease() {
  joystickTouchId = null;
  joystickArea.classList.remove('dragging');
  joystickThumb.style.left = jCx + 'px';
  joystickThumb.style.top  = jCy + 'px';
  gp.jx = gp.jy = 0;
  gp.jactive = false;
  gp.up = gp.down = gp.left = gp.right = false;
  RC.send();
}

joystickArea.addEventListener('pointerdown', e => {
  if (joystickTouchId !== null) return;
  e.preventDefault();
  joystickTouchId = e.pointerId;
  joystickArea.setPointerCapture(e.pointerId);
  joystickArea.classList.add('dragging');
  gp.jactive = true;
  joystickMove(e);
});

joystickArea.addEventListener('pointermove', e => {
  if (e.pointerId !== joystickTouchId) return;
  e.preventDefault();
  joystickMove(e);
});

['pointerup','pointercancel'].forEach(ev =>
  joystickArea.addEventListener(ev, e => {
    if (e.pointerId !== joystickTouchId) return;
    e.preventDefault();
    joystickRelease();
  })
);

// ── Gamepad-Buttons ──────────────────────────────────────
RC.bindBtn('btn-a',      'a');
RC.bindBtn('btn-b',      'b');
RC.bindBtn('btn-select', 'select');

// ── Overlay-Buttons ──────────────────────────────────────
document.getElementById('btn-scan').addEventListener('pointerdown', e => {
  e.preventDefault(); RC.showScan();
});
document.getElementById('btn-picker').addEventListener('pointerdown', e => {
  e.preventDefault(); RC.showPicker();
});

// ── Start: Verbindung + Wake-Lock + Send-Loop ────────────
// Ohne Code startet der Controller trotzdem — LED bleibt rot,
// Wifi-Button öffnet Scanner zum Verbinden.
RC.init();
