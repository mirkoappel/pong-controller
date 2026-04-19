// SPA-Orchestrator: Screen-Routing + Verdrahtung von Services und Views.
import { setupPeer, onReady, onConnect, onDisconnect, onData } from './services/connection.js';
import { initBoot } from './views/boot.js';
import { renderQRs, setPlayerConnected } from './views/setup.js';
import { initMenu, handleMenuInput, resetMenu, goToRow } from './views/menu.js';
import { initGame, startGame, exitGame, getCurrentGame, isIngameMenuOpen, handleIngameMenuInput, openIgMenu } from './views/game.js';

let activeScreen = 'boot';

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name)?.classList.add('active');
  activeScreen = name;
}

export function notifyScreenChange(name) {
  activeScreen = name;
}

initBoot(
  () => { showScreen('main-menu'); resetMenu(); },
  () => {}
);
initGame();
initMenu();

onReady(urls => renderQRs(urls));
onConnect(player => setPlayerConnected(player, true));
onDisconnect(player => {
  setPlayerConnected(player, false);
  getCurrentGame()?.onDisconnect?.(player);
});
onData((player, gp, prev) => {
  const cg = getCurrentGame();
  if (cg) {
    if (isIngameMenuOpen()) { handleIngameMenuInput(gp, prev); return; }
    if (gp.select && !prev?.select) { openIgMenu(); return; }
    cg.input?.(player, gp, prev);
  } else {
    const active = document.querySelector('.screen.active')?.id || activeScreen;
    handleMenuInput(active, gp, prev);
  }
});

setupPeer();
