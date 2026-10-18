// Lädt alle Bilder und prüft die Daten, bevor das Spiel beginnt.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { datenPruefen } from '../daten/pruefen.js';
import { BREITE, schrift } from './stil.js';

const KLEIN_HOEHE = 320;

const WEITERE_BILDER = {
  titel: 'bilder/titel.png',
  mondsee: 'bilder/landschaft/mondsee.png',
  mond: 'bilder/landschaft/mond.png',
  'baum-rund': 'bilder/landschaft/baum-rund.png',
  'baum-schief': 'bilder/landschaft/baum-schief.png',
  fangkristall: 'bilder/gegenstaende/fangkristall.png',
};

// Macht von einem Bild eine kleine Fassung für den Wald, mit etwas kräftigeren
// Linien. Stark verkleinert wären die feinen Bleistiftstriche sonst kaum zu sehen.
function kleinesBildErzeugen(szene, name) {
  const gross = szene.textures.get(name).getSourceImage();
  const breite = Math.round((gross.width * KLEIN_HOEHE) / gross.height);
  const klein = szene.textures.createCanvas(`${name}-klein`, breite + 4, KLEIN_HOEHE + 4);
  const stift = klein.context;
  stift.imageSmoothingQuality = 'high';
  // Mehrmals leicht versetzt malen macht die Linien dicker.
  for (const [dx, dy] of [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) {
    stift.drawImage(gross, 2 + dx, 2 + dy, breite, KLEIN_HOEHE);
  }
  klein.refresh();
}

export class LadeSzene extends Phaser.Scene {
  constructor() {
    super('Laden');
  }

  preload() {
    this.fehlendeBilder = [];
    this.bildNamen = [];
    this.load.on('loaderror', (datei) => this.fehlendeBilder.push(datei.url));

    // Jedes Kalamprio und jede Figur bringt ihr Bild selbst mit.
    const laden = (name, bild) => {
      this.bildNamen.push(name);
      this.load.image(name, bild);
    };
    for (const [kurzname, tier] of Object.entries(KALAMPRIOS)) laden(kurzname, tier.bild);
    for (const [kurzname, charakter] of Object.entries(CHARAKTERE)) {
      laden(`charakter-${kurzname}`, charakter.bild);
    }

    // Gemalte Landschaft, der Fangkristall und der Titel
    for (const [name, bild] of Object.entries(WEITERE_BILDER)) this.load.image(name, bild);
  }

  create() {
    const fehler = [
      ...datenPruefen(),
      ...this.fehlendeBilder.map((bild) => `Das Bild "public/${bild}" wurde nicht gefunden.`),
    ];
    if (fehler.length === 0) {
      for (const name of this.bildNamen) kleinesBildErzeugen(this, name);
      // Erst weiter, wenn die Schrift geladen ist, sonst steht der Text in einer
      // Ersatzschrift da.
      const schriften = ['400 32px Fredoka', '600 32px Fredoka'].map((art) => document.fonts.load(art));
      Promise.all(schriften)
        .catch(() => {})
        .then(() => this.scene.start('Start'));
      return;
    }

    this.add.text(60, 50, 'Da stimmt noch etwas nicht:', schrift(36, '#ffd166'));
    this.add.text(
      60,
      120,
      fehler.map((zeile) => `•  ${zeile}`).join('\n\n'),
      schrift(24, '#ffffff', { wordWrap: { width: BREITE - 120 }, lineSpacing: 4 }),
    );
  }
}
