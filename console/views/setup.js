// Setup-Screen: QR-Codes + Player-Status.
import { conns, localPlayers, addLocalPlayer, removeLocalPlayer } from '../services/connection.js';

export function renderQRs({ url1, url2 }) {
  const qrOpts = { width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M };
  new QRCode(document.getElementById('qr-1'), { ...qrOpts, text: url1 });
  new QRCode(document.getElementById('qr-2'), { ...qrOpts, text: url2 });
}

// TASTATUR-Buttons
[1, 2].forEach(p => {
  document.getElementById(`kb-btn-${p}`)?.addEventListener('click', () => toggleLocal(p));
});

// Tastaturkürzel: "1" / "2" wenn Setup-Screen aktiv
window.addEventListener('keydown', e => {
  if (!document.getElementById('setup').classList.contains('active')) return;
  if (e.key === '1') toggleLocal(1);
  if (e.key === '2') toggleLocal(2);
});

function toggleLocal(player) {
  if (conns.has(player)) return; // echter Controller hat Vorrang
  if (localPlayers.has(player)) {
    removeLocalPlayer(player);
  } else {
    addLocalPlayer(player);
  }
  refreshCard(player);
  refreshHint();
}

function refreshCard(player) {
  const isLocal = localPlayers.has(player);
  const isConn  = conns.has(player);
  const wrap = document.getElementById(`qr-wrap-${player}`);
  const dot  = document.getElementById(`dot-${player}`);
  const btn  = document.getElementById(`kb-btn-${player}`);
  if (wrap) {
    wrap.classList.toggle('connected', isConn);
    wrap.classList.toggle('local', isLocal && !isConn);
  }
  if (dot) {
    dot.classList.toggle('connected', isConn);
    dot.classList.toggle('local', isLocal && !isConn);
    dot.textContent = isConn ? 'VERBUNDEN' : isLocal ? 'TASTATUR' : 'WARTE AUF VERBINDUNG';
  }
  if (btn) btn.classList.toggle('active', isLocal);
}

function refreshHint() {
  const hint = document.getElementById('setup-hint');
  if (!hint) return;
  const hasAny = conns.size > 0 || localPlayers.size > 0;
  hint.classList.toggle('ready', hasAny);
  hint.textContent = hasAny ? 'DRÜCKE A ZUM STARTEN' : '';
}

export function setPlayerConnected(player, on) {
  if (on && localPlayers.has(player)) {
    removeLocalPlayer(player); // echter Controller übernimmt
  }
  const wrap = document.getElementById(`qr-wrap-${player}`);
  const dot  = document.getElementById(`dot-${player}`);
  const btn  = document.getElementById(`kb-btn-${player}`);
  if (wrap) { wrap.classList.toggle('connected', on); wrap.classList.remove('local'); }
  if (dot)  {
    dot.classList.toggle('connected', on);
    dot.classList.remove('local');
    dot.textContent = on ? 'VERBUNDEN' : 'WARTE AUF VERBINDUNG';
  }
  if (btn) btn.classList.remove('active');
  refreshHint();
}
