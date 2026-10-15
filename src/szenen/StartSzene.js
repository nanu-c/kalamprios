// Der allererste Bildschirm: der Titel, wer das Spiel gemacht hat, und ein
// Knopf zum Losgehen. Erst nach dem Tippen darf der Browser vorlesen.

import Phaser from 'phaser';
import { textKnopf, titel } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, HOEHE, schrift } from './stil.js';

export class StartSzene extends Phaser.Scene {
  constructor() {
    super('Start');
  }

  create() {
    hintergrundMalen(this);
    this.add.rectangle(0, 0, BREITE, HOEHE, 0x170b2c, 0.35).setOrigin(0);
    this.cameras.main.fadeIn(600, 23, 11, 44);

    titel(this, BREITE / 2, 230, 1000);
    this.add.text(BREITE / 2, 400, 'Ein Spiel von Ida Neva', schrift(34, '#f6f0ff')).setOrigin(0.5).setStroke('#2a1650', 8);

    const [flaeche, beschriftung] = textKnopf(this, BREITE / 2 - 160, 500, 320, 80, 'Los geht’s!', () => {
      if (this.los) return;
      this.los = true;
      this.cameras.main.fadeOut(400, 23, 11, 44);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Geschichte'));
    });
    beschriftung.setFontSize(36);
    // Der Knopf pulsiert ein bisschen, damit man ihn sieht.
    this.tweens.add({ targets: [flaeche, beschriftung], scale: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
