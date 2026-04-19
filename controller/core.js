// Retrocon Controller Core
// Geteilte Logik für alle Varianten: Verbindung, Gamepad-Protokoll,
// Scan-Overlay, Variant-Picker, Wake-Lock.
//
// Varianten nutzen es so:
//   RC.init();                          // Verbindung + Wake-Lock + Send-Loop
//   RC.bindBtn('btn-a', 'a');           // Button an Gamepad-Key binden
//   RC.gp.jx = 0.5; RC.send();          // Joystick-State setzen + senden
//   RC.showScan();                      // Reconnect-Scan öffnen
//   RC.showPicker();                    // Variant-Picker öffnen

(function () {
  const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
  const VARIANT_KEY = 'retrocon_variant';

  const params = new URLSearchParams(location.search);
  const player = parseInt(params.get('player')) || 1;
  let code    = (params.get('code') || '').toUpperCase();
  let peerId  = params.get('peer');
  if (code && !CODE_RE.test(code)) code = '';
  if (code) peerId = 'console-' + code;

  const gp = {
    jx: 0, jy: 0, jactive: false,
    up: false, down: false, left: false, right: false,
    a: false, b: false, select: false, start: false,
    x: false, y: false, l: false, r: false   // Reserve für größere Varianten
  };

  let conn = null;
  const statusListeners = [];
  function setStatus(s) { statusListeners.forEach(fn => fn(s)); }
  function onStatus(fn)  { statusListeners.push(fn); }

  function send() {
    if (!conn?.open) return;
    conn.send({
      type: 'gamepad', player,
      joystick: { x: gp.jx, y: gp.jy, active: gp.jactive },
      dpad: { up: gp.up, down: gp.down, left: gp.left, right: gp.right },
      a: gp.a, b: gp.b, select: gp.select, start: gp.start,
      x: gp.x, y: gp.y, l: gp.l, r: gp.r
    });
  }

  function bindBtn(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      gp[key] = true; el.classList.add('active'); send();
    });
    el.addEventListener('pointerup', e => {
      e.preventDefault();
      gp[key] = false; el.classList.remove('active'); send();
    });
    el.addEventListener('pointercancel', e => {
      e.preventDefault();
      gp[key] = false; el.classList.remove('active'); send();
    });
  }

  function connect() {
    if (!peerId) return false;
    const peer = new Peer();
    peer.on('open', () => {
      conn = peer.connect(peerId, { metadata: { player } });
      conn.on('open',  () => setStatus('connected'));
      conn.on('close', () => setStatus('error'));
    });
    peer.on('error', () => setStatus('error'));
    return true;
  }

  // ── Wake Lock ────────────────────────────────────────────
  let wakeLock = null;
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch {}
  }

  // QR-Scanner lebt in qr-scanner.js (globales QRScanner).
  function showScan() { window.QRScanner?.show(); }
  function hideScan() { window.QRScanner?.hide(); }

  // ── Variant-Picker (injiziert Overlay-DOM bei Bedarf) ────
  const VARIANTS = [
    { id: 'classic', name: 'Classic', hint: 'D-Pad + A/B' }
    // weitere Varianten hier eintragen
  ];

  function getVariant() {
    return localStorage.getItem(VARIANT_KEY) || 'classic';
  }

  function setVariant(id) {
    localStorage.setItem(VARIANT_KEY, id);
  }

  let pickerOverlay;
  function ensurePickerDom() {
    if (pickerOverlay) return;
    pickerOverlay = document.createElement('div');
    pickerOverlay.id = 'rc-picker-overlay';
    const current = getVariant();
    pickerOverlay.innerHTML = `
      <div id="rc-picker-box">
        <h2>CONTROLLER WÄHLEN</h2>
        <div id="rc-picker-list">
          ${VARIANTS.map(v => `
            <button class="rc-picker-item${v.id === current ? ' current' : ''}" data-id="${v.id}">
              <div class="rc-picker-name">${v.name}</div>
              <div class="rc-picker-hint">${v.hint}</div>
            </button>
          `).join('')}
        </div>
        <button id="rc-picker-close">SCHLIESSEN</button>
      </div>
    `;
    document.body.appendChild(pickerOverlay);

    const style = document.createElement('style');
    style.textContent = `
      #rc-picker-overlay {
        display: none; position: fixed; inset: 0; z-index: 150;
        background: rgba(0,0,0,0.85);
        align-items: center; justify-content: center;
        font-family: 'Courier New', monospace;
      }
      #rc-picker-overlay.active { display: flex; }
      #rc-picker-box {
        background: #1a1a1a;
        border: 1px solid #333; border-radius: 8px;
        padding: 24px; min-width: min(80vw, 340px); max-width: 90vw;
        display: flex; flex-direction: column; gap: 14px;
      }
      #rc-picker-box h2 {
        color: #aaa; font-size: 0.8rem; letter-spacing: 0.25rem;
        font-weight: normal; text-align: center;
      }
      #rc-picker-list { display: flex; flex-direction: column; gap: 8px; }
      .rc-picker-item {
        background: transparent; border: 1px solid #333; border-radius: 4px;
        padding: 12px 16px; color: #aaa; cursor: pointer;
        font-family: inherit; text-align: left;
        transition: border-color 0.1s, color 0.1s;
      }
      .rc-picker-item:hover,
      .rc-picker-item.current { border-color: #4fc3f7; color: #4fc3f7; }
      .rc-picker-name { font-size: 0.9rem; letter-spacing: 0.15rem; }
      .rc-picker-hint { font-size: 0.6rem; letter-spacing: 0.1rem; color: #555; margin-top: 4px; }
      #rc-picker-close {
        background: transparent; border: 1px solid #333; color: #666;
        font-family: inherit; font-size: 0.7rem; letter-spacing: 0.15rem;
        padding: 10px; border-radius: 4px; cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    pickerOverlay.querySelectorAll('.rc-picker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id === getVariant()) { hidePicker(); return; }
        setVariant(id);
        // Zu neuer Variante navigieren, Code + Player erhalten
        const p = new URLSearchParams();
        if (code) p.set('code', code);
        if (player) p.set('player', player);
        location.href = `../${id}/?${p.toString()}`;
      });
    });
    document.getElementById('rc-picker-close').addEventListener('click', hidePicker);
  }

  function showPicker() { ensurePickerDom(); pickerOverlay.classList.add('active'); }
  function hidePicker() { pickerOverlay?.classList.remove('active'); }

  // ── Init: startet Verbindung + Wake-Lock + Send-Loop ─────
  function init() {
    connect();
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    });
    setInterval(send, 33);
  }

  window.RC = {
    CODE_RE, CODE_ALPHABET, VARIANTS, VARIANT_KEY,
    params: { code, player, peerId },
    gp, send, bindBtn, onStatus, init,
    showScan, hideScan,
    showPicker, hidePicker,
    getVariant, setVariant
  };
})();
