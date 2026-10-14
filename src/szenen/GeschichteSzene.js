// Erzählt am Anfang die Geschichte: Die Kristalle werden dunkel.
// Die Sätze stehen in daten/geschichte.js.

import Phaser from 'phaser';
import { GESCHICHTE } from '../daten/geschichte.js';
import { feld, textKnopf } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, HOEHE, schrift } from './stil.js';

export class GeschichteSzene extends Phaser.Scene {
  constructor() {
    super('Geschichte');
  }

  create() {
    hintergrundMalen(this);
    // Mit jedem Satz wird es ein bisschen dunkler, wie die Kristalle.
    this.dunkel = this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.15).setOrigin(0);
    this.cameras.main.fadeIn(600, 23, 11, 44);

    this.add
      .text(BREITE / 2, 90, 'Kalamprios', schrift(80, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 10);

    feld(this, 90, 440, BREITE - 180, 240);
    this.text = this.add.text(130, 470, '', schrift(32, '#ffffff', { wordWrap: { width: BREITE - 260 }, lineSpacing: 8 }));

    textKnopf(this, BREITE - 90 - 30 - 240, 600, 240, 60, 'Weiter', () => this.weiter());
    textKnopf(this, 120, 600, 240, 60, 'Überspringen', () => this.fertig());

    this.nummer = -1;
    this.weiter();
  }

  weiter() {
    this.nummer += 1;
    const saetze = GESCHICHTE.anfang;
    if (this.nummer >= saetze.length) {
      this.fertig();
      return;
    }
    this.text.setText(saetze[this.nummer]).setAlpha(0);
    this.tweens.add({ targets: this.text, alpha: 1, duration: 350 });
    this.tweens.add({ targets: this.dunkel, alpha: 0.15 + (0.45 * this.nummer) / saetze.length, duration: 800 });
  }

  fertig() {
    if (this.vorbei) return;
    this.vorbei = true;
    this.cameras.main.fadeOut(400, 23, 11, 44);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Charakter'));
  }
}
