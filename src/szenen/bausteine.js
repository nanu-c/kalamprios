// Bausteine, aus denen die Bildschirme zusammengesetzt sind:
// Textfelder, Knöpfe und Auswahlkarten.

import { klick } from '../klang/geraeusche.js';
import { FARBEN, schrift } from './stil.js';

// Der gemalte Schriftzug "Kalamprios", der sanft leuchtet und schwebt.
// x, y ist die Mitte, breite die Breite auf dem Bildschirm.
export function titel(szene, x, y, breite) {
  const bild = szene.add.image(x, y, 'titel');
  bild.setScale(breite / bild.width);
  szene.tweens.add({
    targets: bild,
    y: y - 6,
    scale: bild.scale * 1.02,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return bild;
}

// Ein dunkles Feld mit Rahmen. x und y sind die linke obere Ecke.
export function feld(szene, x, y, breite, hoehe) {
  return szene.add
    .rectangle(x, y, breite, hoehe, FARBEN.feld, 0.92)
    .setOrigin(0)
    .setRounded(18)
    .setStrokeStyle(3, FARBEN.rand);
}

// Ein Knopf mit einer Zeile Text. Gibt seine Teile zurück: [Fläche, Schrift].
export function textKnopf(szene, x, y, breite, hoehe, text, beimKlick) {
  const flaeche = szene.add
    .rectangle(x, y, breite, hoehe, FARBEN.knopf)
    .setOrigin(0)
    .setRounded(14)
    .setStrokeStyle(3, FARBEN.rand)
    .setInteractive({ useHandCursor: true });
  const beschriftung = szene.add
    .text(x + breite / 2, y + hoehe / 2, text, schrift(26))
    .setOrigin(0.5);
  flaeche.on('pointerdown', () => {
    klick();
    beimKlick();
  });
  return [flaeche, beschriftung];
}
