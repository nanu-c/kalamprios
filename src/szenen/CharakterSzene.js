// Hier sucht man sich seine Figur aus. Die Figuren stehen auf einer dunklen
// Bühne, jede in ihrem eigenen Scheinwerferlicht. Danach wacht man im
// Kinderzimmer auf. Ein Kalamprio hat man noch nicht: Das schenkt einem die
// Rivalin im Lila Dorf, wenn man ihr Pfannkuchen bringt.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { musikSpielen } from '../klang/musik.js';
import { spielstand } from '../spielstand.js';
import { hintergrundMalen } from './hintergrund.js';
import { scheinwerferAuswahl } from './scheinwerfer.js';
import { BREITE, HOEHE, schrift } from './stil.js';

export class CharakterSzene extends Phaser.Scene {
  constructor() {
    super('Charakter');
  }

  create() {
    // Die Bühne: Der Himmel ist fast dunkel, nur die Scheinwerfer leuchten.
    hintergrundMalen(this);
    this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.78).setOrigin(0);
    this.add.ellipse(BREITE / 2, 640, BREITE * 1.2, 160, 0x241240, 0.9);
    this.cameras.main.fadeIn(400, 11, 5, 24);
    musikSpielen('dorf');

    this.add.text(BREITE / 2, 60, 'Wer möchtest du sein?', schrift(40, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5).setDepth(50);

    const namen = Object.keys(CHARAKTERE);
    scheinwerferAuswahl(
      this,
      namen.map((kurzname) => ({ bild: `charakter-${kurzname}`, name: CHARAKTERE[kurzname].name })),
      (nummer) => this.waehlen(namen[nummer]),
      { boden: 560, groesse: 360 },
    );
  }

  waehlen(kurzname) {
    spielstand.charakter = kurzname;
    // Die erste andere Figur in der Liste wird zur Rivalin.
    spielstand.rivalin = Object.keys(CHARAKTERE).find((andere) => andere !== kurzname);
    this.cameras.main.fadeOut(400, 11, 5, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Welt'));
  }
}
