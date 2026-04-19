// QR-Scanner für den Controller
// Vollbild-Overlay mit Kamera-Stream, jsQR-Decode im zentrierten Viewfinder.
// Bei Treffer auf gültige Raum-URL → Navigation zu dieser URL.
//
// API:
//   QRScanner.show()   Kamera starten + Overlay zeigen
//   QRScanner.hide()   Overlay schließen + Kamera freigeben

(function () {
  let stream = null, raf = null;
  let overlay, video, canvas, ctx;

  function ensureDom() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'rc-scan-overlay';
    overlay.innerHTML = `
      <video id="rc-scan-video" playsinline muted></video>
      <canvas id="rc-scan-canvas"></canvas>
      <div id="rc-scan-frame"></div>
      <div id="rc-scan-hint">QR-Code des Raums scannen</div>
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

    video  = document.getElementById('rc-scan-video');
    canvas = document.getElementById('rc-scan-canvas');
    ctx    = canvas.getContext('2d', { willReadFrequently: true });

    document.getElementById('rc-scan-close').addEventListener('pointerdown', e => {
      e.preventDefault(); hide();
    });
  }

  function show() {
    ensureDom();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => { stream = s; video.srcObject = s; return video.play(); })
      .then(() => { overlay.classList.add('active'); loop(); })
      .catch(err => alert('Kamera nicht verfügbar: ' + err.message));
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove('active');
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
  }

  function loop() {
    if (!stream) return;
    if (video.readyState === 4) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      // Nur zentrierten Viewfinder-Bereich an jsQR übergeben, sonst kann ein
      // QR am Bildrand (zweiter Spieler) statt des gezielten Codes gewinnen.
      // 60% entspricht dem CSS-Frame (min(60vw, 60vh)).
      const side = Math.floor(Math.min(canvas.width, canvas.height) * 0.6);
      const x0   = Math.floor((canvas.width  - side) / 2);
      const y0   = Math.floor((canvas.height - side) / 2);
      const img  = ctx.getImageData(x0, y0, side, side);
      const qr   = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (qr?.data) {
        try {
          const url = new URL(qr.data);
          if (url.searchParams.has('code') || url.searchParams.has('peer')) {
            hide(); location.href = qr.data; return;
          }
        } catch {}
      }
    }
    raf = requestAnimationFrame(loop);
  }

  window.QRScanner = { show, hide };
})();
