// Der allererste Bildschirm: der Titel, wer das Spiel gemacht hat, und ein
// Knopf zum Losgehen. Erst nach dem Tippen darf der Browser vorlesen.
// Gibt es einen gespeicherten Spielstand, kann man weiterspielen oder neu
// anfangen.

import Phaser from 'phaser';
import { musikSpielen } from '../klang/musik.js';
import { gespeichertesSpiel, laden, neuesSpiel } from '../spielstand.js';
import { textKnopf, titel } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, HOEHE, schrift } from './stil.js';

export class StartSzene extends Phaser.Scene {
  constructor() {
    super('Start');
  }

  create() {
    // Der Mond steht oben rechts, damit der Titel ihn nicht verdeckt.
    hintergrundMalen(this, 'wald', { mond: { x: 1185, y: 92 } });
    this.add.rectangle(0, 0, BREITE, HOEHE, 0x170b2c, 0.35).setOrigin(0);
    this.cameras.main.fadeIn(600, 23, 11, 44);
    // Die Musik fängt an, sobald man das erste Mal tippt.
    musikSpielen('dorf');

    titel(this, BREITE / 2, 230, 1000);
    this.add.text(BREITE / 2, 400, 'Ein Spiel von Ida Neva', schrift(34, '#f6f0ff')).setOrigin(0.5).setStroke('#2a1650', 8);

    this.los = false;
    if (gespeichertesSpiel()) this.weiterOderNeu();
    else this.pulsieren(textKnopf(this, BREITE / 2 - 160, 500, 320, 80, 'Los geht’s!', () => this.losgehen('Geschichte')));
  }

  // Zwei Knöpfe: mit dem gespeicherten Spiel weitermachen oder neu anfangen.
  weiterOderNeu() {
    const teile = [
      ...this.pulsieren(
        textKnopf(this, BREITE / 2 - 340, 500, 320, 80, 'Weiterspielen', () => {
          if (laden()) this.losgehen('Welt');
          else this.losgehen('Geschichte'); // passt der Spielstand nicht mehr, geht es von vorn los
        }),
      ),
      ...textKnopf(this, BREITE / 2 + 20, 500, 320, 80, 'Neues Spiel', () => {
        for (const teil of teile) teil.destroy();
        this.wirklichNeu();
      }),
    ];
    teile[teile.length - 1].setFontSize(32);
  }

  // Damit niemand aus Versehen seinen Spielstand löscht, wird nachgefragt.
  wirklichNeu() {
    const teile = [
      this.add
        .text(BREITE / 2, 470, 'Wirklich ganz von vorn? Dein Spielstand wird gelöscht.', schrift(26, '#ffd166'))
        .setOrigin(0.5)
        .setStroke('#2a1650', 6),
      ...textKnopf(this, BREITE / 2 - 340, 520, 320, 72, 'Ja, neu anfangen', () => {
        neuesSpiel();
        this.losgehen('Geschichte');
      }),
      ...textKnopf(this, BREITE / 2 + 20, 520, 320, 72, 'Nein, zurück', () => {
        for (const teil of teile) teil.destroy();
        this.weiterOderNeu();
      }),
    ];
  }

  // Ein großer Knopf, der ein bisschen pulsiert, damit man ihn sieht.
  pulsieren([flaeche, beschriftung]) {
    beschriftung.setFontSize(36);
    this.tweens.add({ targets: [flaeche, beschriftung], scale: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return [flaeche, beschriftung];
  }

  losgehen(szene) {
    if (this.los) return;
    this.los = true;
    this.cameras.main.fadeOut(400, 23, 11, 44);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(szene));
  }
}
