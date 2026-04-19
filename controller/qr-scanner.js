// QR-Scanner für den Controller
// Tap-to-Scan: Kamera läuft live, aber dekodiert wird erst bei Druck auf
// den SCAN-Button (wie Auslöser). Pro Tap werden bis zu 10 Frames probiert,
// bevorzugt mit nativem BarcodeDetector, sonst Fallback auf jsQR. Kein Crop,
// kein Größen-Filter — User zielt selbst.
//
// API:
//   QRScanner.show()   Kamera starten + Overlay zeigen
//   QRScanner.hide()   Overlay schließen + Kamera freigeben

(function () {
  let stream = null;
  let overlay, video, canvas, ctx, hint, scanBtn;
  let detector = null;
  let scanning = false;

  if ('BarcodeDetector' in window) {
    try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); }
    catch { detector = null; }
  }

  function ensureDom() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'rc-scan-overlay';
    overlay.innerHTML = `
      <video id="rc-scan-video" playsinline muted></video>
      <canvas id="rc-scan-canvas"></canvas>
      <div id="rc-scan-frame"></div>
      <div id="rc-scan-hint">QR-CODE IM RAHMEN — DANN SCAN DRÜCKEN</div>
      <button id="rc-scan-btn">SCAN</button>
      <button id="rc-scan-close">SCHLIESSEN</button>
    `;
    document.body.appendChild(overlay);

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
        color: rgba(255,255,255,0.6); font-family: 'Courier New', monospace;
        text-align: center; padding: 0 20px;
      }
      #rc-scan-btn {
        position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
        z-index: 3;
        width: 84px; height: 84px; border-radius: 50%;
        background: #fff; border: 4px solid rgba(255,255,255,0.4);
        box-shadow: 0 0 0 3px #000;
        font-family: 'Courier New', monospace;
        font-size: 0.75rem; letter-spacing: 0.1rem; font-weight: bold;
        color: #000; cursor: pointer; touch-action: none;
      }
      #rc-scan-btn:active { transform: translateX(-50%) scale(0.94); }
      #rc-scan-btn.busy { background: #888; color: #222; }
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

    video   = document.getElementById('rc-scan-video');
    canvas  = document.getElementById('rc-scan-canvas');
    ctx     = canvas.getContext('2d', { willReadFrequently: true });
    hint    = document.getElementById('rc-scan-hint');
    scanBtn = document.getElementById('rc-scan-btn');

    document.getElementById('rc-scan-close').addEventListener('pointerdown', e => {
      e.preventDefault(); hide();
    });
    scanBtn.addEventListener('pointerdown', e => {
      e.preventDefault(); runScan();
    });
  }

  function show() {
    ensureDom();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => { stream = s; video.srcObject = s; return video.play(); })
      .then(() => {
        overlay.classList.add('active');
        hint.textContent = 'QR-CODE IM RAHMEN — DANN SCAN DRÜCKEN';
      })
      .catch(err => alert('Kamera nicht verfügbar: ' + err.message));
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove('active');
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    scanning = false;
    scanBtn?.classList.remove('busy');
  }

  async function tryDecode() {
    if (video.readyState !== 4) return null;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    if (detector) {
      try {
        const codes = await detector.detect(canvas);
        if (codes.length) return codes[0].rawValue;
      } catch {}
    }
    try {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
      if (qr?.data) return qr.data;
    } catch {}
    return null;
  }

  function isRoomUrl(data) {
    try {
      const url = new URL(data);
      return url.searchParams.has('code') || url.searchParams.has('peer');
    } catch { return false; }
  }

  async function runScan() {
    if (scanning || !stream) return;
    scanning = true;
    scanBtn.classList.add('busy');
    hint.textContent = 'SCANNE...';
    for (let i = 0; i < 10; i++) {
      const data = await tryDecode();
      if (data && isRoomUrl(data)) {
        hint.textContent = 'ERKANNT ✓';
        hide();
        location.href = data;
        return;
      }
      await new Promise(r => setTimeout(r, 40));
    }
    scanning = false;
    scanBtn.classList.remove('busy');
    hint.textContent = 'NICHT ERKANNT — ZIELEN, NOCHMAL TIPPEN';
  }

  window.QRScanner = { show, hide };
})();
