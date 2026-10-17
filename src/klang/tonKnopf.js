// Der Knopf unten links neben dem Vollbild-Knopf schaltet Musik und
// Geräusche an und aus. Der Browser merkt sich, wie man es eingestellt hat.

import { istStumm, stummSchalten } from './klang.js';

export function tonKnopfEinrichten() {
  const knopf = document.getElementById('ton');
  if (!knopf) return;
  // Gibt es keinen Vollbild-Knopf, rückt der Ton-Knopf nach links.
  if (document.getElementById('vollbild')?.hidden) knopf.style.left = '6px';

  const anzeigen = () => {
    const aus = istStumm();
    knopf.classList.toggle('aus', aus);
    knopf.title = aus ? 'Ton an' : 'Ton aus';
    knopf.setAttribute('aria-label', knopf.title);
  };
  knopf.addEventListener('click', () => {
    stummSchalten(!istStumm());
    anzeigen();
  });
  anzeigen();
}
