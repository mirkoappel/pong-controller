// PeerJS-Verbindung, Raum-Code, Controller-Pool.
// Zustand wird als live-Binding exportiert (conns.size, code-Wert aktuell halten).

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export const conns = new Map();
export const lastInput = new Map();
export const prevInput = new Map();
export let code = '';

export const localPlayers = new Set();
export const addLocalPlayer    = p => localPlayers.add(p);
export const removeLocalPlayer = p => localPlayers.delete(p);

let peer = null;
const cb = { ready: () => {}, connect: () => {}, disconnect: () => {}, data: () => {} };

export const onReady      = fn => { cb.ready      = fn; };
export const onConnect    = fn => { cb.connect    = fn; };
export const onDisconnect = fn => { cb.disconnect = fn; };
export const onData       = fn => { cb.data       = fn; };

export function setupPeer(attempt = 0) {
  code = genCode();
  peer = new Peer('console-' + code);

  peer.on('open', () => {
    const base = location.href.replace(/console\/(index\.html)?.*$/, '');
    cb.ready({
      code,
      url1: `${base}controller/?code=${code}&player=1`,
      url2: `${base}controller/?code=${code}&player=2`
    });
  });

  peer.on('error', err => {
    if (err.type === 'unavailable-id' && attempt < 5) { peer.destroy(); setupPeer(attempt + 1); }
  });

  peer.on('connection', conn => {
    const player = conn.metadata?.player || 1;
    if (conns.has(player)) { try { conns.get(player).close(); } catch {} }
    conns.set(player, conn);

    conn.on('open',  () => cb.connect(player));
    conn.on('close', () => {
      if (conns.get(player) === conn) {
        conns.delete(player); lastInput.delete(player);
        cb.disconnect(player);
      }
    });
    conn.on('data', data => {
      if (data?.type !== 'gamepad') return;
      prevInput.set(player, lastInput.get(player) ?? null);
      lastInput.set(player, data);
      cb.data(player, data, prevInput.get(player));
    });
  });
}
