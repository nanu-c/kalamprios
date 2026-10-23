// Animationen, die an mehreren Stellen vorkommen:
//   streifenZu / streifenAuf  der Übergang in den Kampf: Streifen schieben
//                             sich über den Bildschirm und wieder weg
//   belohnungZeigen           eine Belohnung wächst groß heran, schimmert
//                             und fliegt dann in den Beutel

import Phaser from 'phaser';
import { belohnung } from '../klang/geraeusche.js';
import { lichtschein } from './landschaft.js';
import { BREITE, HOEHE, schrift } from './stil.js';

const GANZ_VORNE = 200000; // über allem, auch über der Dunkelheit in der Mine
const STREIFEN = 8;
const STREIFEN_FARBE = 0x1a0d33;
const STREIFEN_RAND = 0xb99cf0;

// Malt die Streifen. Jeder kommt abwechselnd von links oder von rechts.
function streifenBauen(szene) {
  const hoehe = HOEHE / STREIFEN;
  return Array.from({ length: STREIFEN }, (_, nummer) => {
    const y = nummer * hoehe;
    const streifen = szene.add.container(0, y, [
      szene.add.rectangle(0, 0, BREITE, hoehe + 1, STREIFEN_FARBE).setOrigin(0),
      szene.add.rectangle(0, hoehe - 3, BREITE, 3, STREIFEN_RAND, 0.8).setOrigin(0),
    ]);
    streifen.setScrollFactor(0).setDepth(GANZ_VORNE);
    streifen.seite = nummer % 2 === 0 ? -1 : 1;
    return streifen;
  });
}

// Die Streifen schieben sich über den Bildschirm. Fertig, wenn alles bedeckt ist.
export function streifenZu(szene, dauer = 420) {
  const streifen = streifenBauen(szene);
  return new Promise((fertig) => {
    streifen.forEach((teil, nummer) => {
      teil.x = teil.seite * BREITE;
      szene.tweens.add({
        targets: teil,
        x: 0,
        delay: nummer * 35,
        duration: dauer,
        ease: 'Cubic.easeIn',
        onComplete: nummer === streifen.length - 1 ? fertig : undefined,
      });
    });
  });
}

// Am Anfang ist alles bedeckt, dann ziehen sich die Streifen zur Seite zurück.
// Dazu erscheint groß ein Wort, zum Beispiel „Kampf!“.
export function streifenAuf(szene, wort = '', dauer = 480) {
  const streifen = streifenBauen(szene);
  streifen.forEach((teil, nummer) => {
    szene.tweens.add({
      targets: teil,
      x: -teil.seite * BREITE,
      delay: 120 + nummer * 35,
      duration: dauer,
      ease: 'Cubic.easeOut',
      onComplete: () => teil.destroy(),
    });
  });
  if (!wort) return;
  const text = szene.add
    .text(BREITE / 2, HOEHE / 2 - 40, wort, schrift(110, '#ffd166', { fontStyle: 'bold' }))
    .setOrigin(0.5)
    .setStroke('#2a1650', 14)
    .setScrollFactor(0)
    .setDepth(GANZ_VORNE + 1)
    .setScale(3)
    .setAlpha(0);
  szene.tweens.add({ targets: text, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
  szene.tweens.add({ targets: text, scale: 1.3, alpha: 0, delay: 900, duration: 400, ease: 'Cubic.easeIn', onComplete: () => text.destroy() });
}

// Eine Belohnung: Über dem Punkt (in der Welt) wächst das Bild groß heran, ein
// goldener Schein pulsiert, Funken kreisen, und darunter steht, was es ist.
// Dann fliegen so viele kleine Bilder, wie es sind (anzahl, höchstens 8), in
// den Beutel oben links, oder zu ziel (ein Punkt auf dem Bildschirm). Gibt ein
// Promise zurück, das fertig ist, wenn alle angekommen sind.
export function belohnungZeigen(szene, punkt, { bild = 'fangkristall', anzahl = 1, text = '', ziel: wohin = null }) {
  const kamera = szene.cameras.main;
  const mitte = { x: punkt.x - kamera.scrollX, y: punkt.y - 170 - kamera.scrollY };
  belohnung();

  const schein = lichtschein(szene, mitte.x, mitte.y, 320, 320, 0xffd166).setScrollFactor(0).setDepth(GANZ_VORNE).setAlpha(0);
  const gross = szene.add.image(mitte.x, mitte.y, bild).setScrollFactor(0).setDepth(GANZ_VORNE + 1);
  const zielGroesse = 120 / Math.max(gross.height, gross.width);
  gross.setScale(0);
  const beschriftung = szene.add
    .text(mitte.x, mitte.y + 95, text, schrift(30, '#fff3c4', { fontStyle: '600' }))
    .setOrigin(0.5)
    .setStroke('#2a1650', 7)
    .setScrollFactor(0)
    .setDepth(GANZ_VORNE + 2)
    .setAlpha(0);

  szene.tweens.add({ targets: gross, scale: zielGroesse, angle: 360, duration: 700, ease: 'Back.easeOut' });
  szene.tweens.add({ targets: schein, alpha: 0.9, duration: 500 });
  szene.tweens.add({ targets: schein, scale: schein.scale * 1.25, alpha: 0.5, delay: 500, duration: 500, yoyo: true, repeat: 1 });
  szene.tweens.add({ targets: beschriftung, alpha: 1, y: mitte.y + 85, delay: 300, duration: 400 });
  // Das Bild schimmert: Es wird immer wieder kurz hell.
  szene.tweens.add({ targets: gross, alpha: 0.7, delay: 700, duration: 180, yoyo: true, repeat: 3 });

  // Funken kreisen um die Belohnung.
  const funken = Array.from({ length: 10 }, (_, nummer) =>
    szene.add
      .image(mitte.x, mitte.y, 'funkel')
      .setTint([0xffffff, 0xffd166, 0x8ef0ff, 0xff9ad5][nummer % 4])
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScrollFactor(0)
      .setDepth(GANZ_VORNE + 2)
      .setScale(0.6),
  );
  const drehung = { winkel: 0, weit: 0 };
  szene.tweens.add({
    targets: drehung,
    winkel: Math.PI * 4,
    weit: 95,
    duration: 1700,
    onUpdate: () => {
      funken.forEach((funke, nummer) => {
        const w = drehung.winkel + (nummer / funken.length) * Math.PI * 2;
        funke.setPosition(mitte.x + Math.cos(w) * drehung.weit, mitte.y + Math.sin(w) * drehung.weit * 0.7);
      });
    },
  });

  return new Promise((fertig) => {
    szene.time.delayedCall(1800, () => {
      funken.forEach((funke) => funke.destroy());
      szene.tweens.add({ targets: [schein, beschriftung], alpha: 0, duration: 300, onComplete: () => [schein, beschriftung].forEach((t) => t.destroy()) });
      szene.tweens.add({ targets: gross, scale: 0, duration: 250, onComplete: () => gross.destroy() });
      // Kleine Bilder fliegen im Bogen in den Beutel.
      const ziel = wohin ?? (szene.beutelBild ? { x: szene.beutelBild.x, y: szene.beutelBild.y } : { x: 60, y: 50 });
      const wieViele = Math.max(1, Math.min(8, anzahl));
      for (let nummer = 0; nummer < wieViele; nummer += 1) {
        const klein = szene.add.image(mitte.x, mitte.y, bild).setScrollFactor(0).setDepth(GANZ_VORNE + 1);
        klein.setScale(56 / Math.max(klein.height, klein.width));
        const start = { x: mitte.x + (Math.random() - 0.5) * 80, y: mitte.y + (Math.random() - 0.5) * 50 };
        const flug = { t: 0 };
        szene.tweens.add({
          targets: flug,
          t: 1,
          delay: 150 + nummer * 140,
          duration: 700,
          ease: 'Sine.easeIn',
          onUpdate: () => {
            const { t } = flug;
            klein.setPosition(start.x + (ziel.x - start.x) * t, start.y + (ziel.y - start.y) * t - Math.sin(t * Math.PI) * 120);
            klein.setScale((56 - t * 34) / Math.max(klein.height, klein.width));
            klein.setAngle(t * 360);
          },
          onComplete: () => {
            klein.destroy();
            if (!wohin) szene.beutelHuepfen?.();
            if (nummer === wieViele - 1) fertig();
          },
        });
      }
    });
  });
}
