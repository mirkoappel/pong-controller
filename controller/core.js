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
      conn.on('close', () => { setStatus('error'); setTimeout(() => location.reload(), 2000); });
    });
    peer.on('error', () => { setStatus('error'); setTimeout(() => location.reload(), 3000); });
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

  // ── QR-Scan (injiziert Overlay-DOM bei Bedarf) ───────────
  let scanStream = null, scanRaf = null, scanOverlay, scanVideo, scanCanvas, scanCtx;

  function ensureScanDom() {
    if (scanOverlay) return;
    scanOverlay = document.createElement('div');
    scanOverlay.id = 'rc-scan-overlay';
    scanOverlay.innerHTML = `
      <video id="rc-scan-video" playsinline muted></video>
      <canvas id="rc-scan-canvas"></canvas>
      <div id="rc-scan-frame"></div>
      <div id="rc-scan-hint">QR-Code des Raums scannen</div>
      <button id="rc-scan-close">SCHLIESSEN</button>
    `;
    document.body.appendChild(scanOverlay);

    const style = document.createElement('style');
    style.textContent = `
      #rc-scan-overlay {
        display: none; position: fixed; inset: 0; z-index: 200;
        background: #000;
        flex-direction: column; align-items: center; justify-content: center;
      }
      #rc-scan-overlay.active { display: flex; }
      #rc-scan-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #rc-scan-frame {
        position: relative; z-index: 2;
        width: min(60vw, 60vh); height: min(60vw, 60vh);
        border: 2px solid rgba(255,255,255,0.3); border-radius: 12px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);
      }
      #rc-scan-hint {
        position: relative; z-index: 2; margin-top: 20px;
        font-size: 0.7rem; letter-spacing: 0.1rem;
        color: rgba(255,255,255,0.5); font-family: 'Courier New', monospace;
      }
      #rc-scan-close {
        position: absolute; top: 16px; right: 16px; z-index: 3;
        background: rgba(0,0,0,0.6); border: 1px solid #333; color: #aaa;
        font-family: 'Courier New', monospace;
        font-size: 0.6rem; letter-spacing: 0.1rem;
        padding: 6px 14px; border-radius: 20px;
        cursor: pointer; touch-action: none;
      }
      #rc-scan-canvas { display: none; }
    `;
    document.head.appendChild(style);

    scanVideo  = document.getElementById('rc-scan-video');
    scanCanvas = document.getElementById('rc-scan-canvas');
    scanCtx    = scanCanvas.getContext('2d', { willReadFrequently: true });

    document.getElementById('rc-scan-close').addEventListener('pointerdown', e => {
      e.preventDefault(); hideScan();
    });
  }

  function showScan() {
    ensureScanDom();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => { scanStream = stream; scanVideo.srcObject = stream; return scanVideo.play(); })
      .then(() => { scanOverlay.classList.add('active'); scanLoop(); })
      .catch(err => alert('Kamera nicht verfügbar: ' + err.message));
  }

  function hideScan() {
    if (!scanOverlay) return;
    scanOverlay.classList.remove('active');
    cancelAnimationFrame(scanRaf);
    scanStream?.getTracks().forEach(t => t.stop());
    scanStream = null;
  }

  function scanLoop() {
    if (!scanStream) return;
    if (scanVideo.readyState === 4) {
      scanCanvas.width  = scanVideo.videoWidth;
      scanCanvas.height = scanVideo.videoHeight;
      scanCtx.drawImage(scanVideo, 0, 0);
      const img = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
      const qr  = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (qr?.data) {
        try {
          const url = new URL(qr.data);
          if (url.searchParams.has('code') || url.searchParams.has('peer')) {
            hideScan(); location.href = qr.data; return;
          }
        } catch {}
      }
    }
    scanRaf = requestAnimationFrame(scanLoop);
  }

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
