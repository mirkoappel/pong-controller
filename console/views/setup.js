// Setup-Screen: QR-Codes + Player-Status + Mensch/KI-Modus.
import { conns, localPlayers, addLocalPlayer, removeLocalPlayer } from '../services/connection.js';

function setMode(player, mode) {
  const toggle = document.getElementById(`mode-${player}`);
  if (toggle) {
    toggle.querySelectorAll('.mode-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.mode === mode)
    );
  }
  if (mode === 'human') addLocalPlayer(player);
  else                  removeLocalPlayer(player);
  refreshHint();
}

function refreshHint() {
  const hint = document.getElementById('setup-hint');
  if (!hint) return;
  const hasAny = conns.size > 0 || localPlayers.size > 0;
  hint.classList.toggle('ready', hasAny);
  hint.textContent = hasAny ? 'DRÜCKE A ZUM STARTEN' : '';
}

// Default: P1 = Mensch (Tastatur aktiv), P2 = KI
setMode(1, 'human');
setMode(2, 'ai');

// Klick auf Mode-Buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const player = parseInt(btn.closest('[id^="mode-"]').id.replace('mode-', ''));
    setMode(player, btn.dataset.mode);
  });
});

// Tastaturkürzel im Setup-Screen: "1" und "2" wechseln Modus
window.addEventListener('keydown', e => {
  if (!document.getElementById('setup').classList.contains('active')) return;
  if (e.key === '1') setMode(1, localPlayers.has(1) ? 'ai' : 'human');
  if (e.key === '2') setMode(2, localPlayers.has(2) ? 'ai' : 'human');
});

export function renderQRs({ url1, url2 }) {
  const qrOpts = { width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M };
  new QRCode(document.getElementById('qr-1'), { ...qrOpts, text: url1 });
  new QRCode(document.getElementById('qr-2'), { ...qrOpts, text: url2 });
}

export function setPlayerConnected(player, on) {
  const wrap = document.getElementById(`qr-wrap-${player}`);
  const dot  = document.getElementById(`dot-${player}`);
  if (wrap) wrap.classList.toggle('connected', on);
  if (dot)  {
    dot.classList.toggle('connected', on);
    dot.textContent = on ? 'VERBUNDEN' : 'WARTE AUF VERBINDUNG';
  }
  refreshHint();
}
