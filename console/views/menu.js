// Hauptmenü: Karussell + Navigation.
import { startGame, exitGame, getCurrentGame } from './game.js';
import { showScreen } from '../app.js';
import { showSetup, hideSetup, isSetupOpen } from './setup.js';

let track, carousel;
let gameIds = [];
let carouselIdx = 0;

export function initMenu() {
  gameIds = Object.keys(window.RetroGames || {});
  track = document.getElementById('carousel-track');
  carousel = document.getElementById('carousel');

  gameIds.forEach(id => {
    const g = window.RetroGames[id];
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.game = id;
    card.innerHTML = `
      <div class="art">${g.artSvg || ''}</div>
      <div class="meta">
        <div class="title">${g.name}</div>
        <div class="tagline">${g.tagline || ''}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      if (carouselIdx === gameIds.indexOf(id)) startGame(id);
      else { carouselIdx = gameIds.indexOf(id); highlight(); }
    });
    track.appendChild(card);
  });

  highlight();
  window.addEventListener('resize', highlight);

  window.addEventListener('keydown', e => {
    if (getCurrentGame()) {
      if (e.key === 'Escape') { exitGame(); e.preventDefault(); }
      return;
    }
    if (isSetupOpen()) {
      if (e.key === 'Escape') { hideSetup(); e.preventDefault(); }
      return;
    }
    const active = document.querySelector('.screen.active')?.id;
    if (active !== 'main-menu') return;

    switch (e.key) {
      case 'ArrowRight':
        if (carouselIdx < gameIds.length - 1) { carouselIdx++; highlight(); }
        e.preventDefault(); break;
      case 'ArrowLeft':
        if (carouselIdx > 0) { carouselIdx--; highlight(); }
        e.preventDefault(); break;
      case 'Enter': case ' ':
        startGame(gameIds[carouselIdx]);
        e.preventDefault(); break;
      case 'Escape': case 'b': case 'B':
        showSetup(); e.preventDefault(); break;
    }
  });
}

function highlight() {
  const cards = [...track.children];
  cards.forEach((el, i) => el.classList.toggle('selected', i === carouselIdx));
  const selected = cards[carouselIdx];
  if (selected) {
    const offset = selected.offsetLeft + selected.offsetWidth / 2 - carousel.clientWidth / 2;
    track.style.transform = `translateX(${-offset}px)`;
  }
  carousel.classList.toggle('has-prev', carouselIdx > 0);
  carousel.classList.toggle('has-next', carouselIdx < cards.length - 1);
}

export function resetMenu() {
  carouselIdx = 0;
  highlight();
}

export function handleMenuInput(activeScreen, gp, prev) {
  if (isSetupOpen()) {
    if (gp.a && !prev?.a) hideSetup();
    return;
  }
  if (activeScreen !== 'main-menu') return;

  if (gp.a && !prev?.a) { startGame(gameIds[carouselIdx]); return; }
  if ((gp.b && !prev?.b) || (gp.select && !prev?.select)) { showSetup(); return; }
  if (gp.dpad.right && !prev?.dpad?.right && carouselIdx < gameIds.length - 1) { carouselIdx++; highlight(); }
  if (gp.dpad.left  && !prev?.dpad?.left  && carouselIdx > 0)                  { carouselIdx--; highlight(); }
}
