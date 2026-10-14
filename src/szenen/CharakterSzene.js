// Der Startbildschirm: Hier sucht man sich seine Figur aus.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { spielstand } from '../spielstand.js';
import { karte, kartenreihe } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, HOEHE, schrift } from './stil.js';

export class CharakterSzene extends Phaser.Scene {
  constructor() {
    super('Charakter');
  }

  create() {
    hintergrundMalen(this);
    this.add.rectangle(0, 0, BREITE, HOEHE, 0x170b2c, 0.45).setOrigin(0);

    this.add.text(BREITE / 2, 80, 'Kalamprios', schrift(76, '#f6f0ff')).setOrigin(0.5);
    this.add.text(BREITE / 2, 152, 'Wer möchtest du sein?', schrift(30, '#d9c9ff')).setOrigin(0.5);

    kartenreihe(BREITE, Object.keys(CHARAKTERE), (kurzname, x, breite) => {
      karte(this, {
        x,
        y: 440,
        breite,
        bild: `charakter-${kurzname}`,
        name: CHARAKTERE[kurzname].name,
        beimKlick: () => this.waehlen(kurzname),
      });
    });
  }

  waehlen(kurzname) {
    spielstand.charakter = kurzname;
    // Die erste andere Figur in der Liste wird zur Rivalin.
    spielstand.rivalin = Object.keys(CHARAKTERE).find((andere) => andere !== kurzname);
    this.scene.start('Auswahl');
  }
}
