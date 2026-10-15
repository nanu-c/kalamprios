// Die Party am Ende: Das geheime Kalamprio ist besiegt, die Kristalle leuchten
// wieder, und das ganze Team tanzt. Dazu wird das Ende erzählt (die Sätze
// stehen in daten/geschichte.js bei ende). Zum Schluss steht groß "Ende" da.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { GESCHICHTE } from '../daten/geschichte.js';
import { spielstand } from '../spielstand.js';
import { verstummen, vorlesen } from '../vorlesen.js';
import { feld, textKnopf, titel } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { bilderErzeugen, lichtschein } from './landschaft.js';
import { BREITE, HOEHE, schrift } from './stil.js';

const KONFETTI = [0xff9ad5, 0xffd166, 0x8ef0ff, 0xb99cf0, 0x7be08a, 0xffffff];
const TANZBODEN = 520; // hier stehen die Tänzer mit den Füßen
const TAENZER_HOEHE = 170;

export class EndeSzene extends Phaser.Scene {
  constructor() {
    super('Ende');
  }

  create() {
    bilderErzeugen(this);
    hintergrundMalen(this, 'geschichte');
    this.cameras.main.fadeIn(800, 23, 11, 44);

    this.kristalleLeuchten();
    this.tanzen();
    this.time.addEvent({ delay: 70, loop: true, callback: () => this.konfetti() });
    this.time.addEvent({ delay: 900, loop: true, callback: () => this.feuerwerk() });

    this.ueberschrift = this.add
      .text(BREITE / 2, 70, 'Geschafft!', schrift(84, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 12)
      .setDepth(10);
    this.tweens.add({ targets: this.ueberschrift, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.textfeld = [feld(this, 40, 556, BREITE - 80, 144).setDepth(20)];
    this.text = this.add
      .text(70, 574, '', schrift(28, '#ffffff', { wordWrap: { width: BREITE - 420 }, lineSpacing: 6 }))
      .setDepth(21);
    this.textfeld.push(this.text, ...textKnopf(this, BREITE - 300, 600, 230, 60, 'Weiter', () => this.weiter()));
    for (const teil of this.textfeld) teil.setDepth(Math.max(teil.depth, 21));

    this.nummer = -1;
    this.weiter();
  }

  // Erst sind alle Kristalle dunkel, dann leuchten sie einer nach dem anderen auf.
  kristalleLeuchten() {
    [120, 300, 465, 640, 815, 985, 1160].forEach((x, nummer) => {
      const farbe = nummer % 2 === 0 ? 'lila' : 'blau';
      const y = 330;
      this.add.image(x, y, 'kristall-dunkel').setOrigin(0.5, 160 / 170).setScale(0.9);
      const hell = this.add.image(x, y, `kristall-${farbe}`).setOrigin(0.5, 160 / 170).setScale(0.9).setAlpha(0);
      const schein = lichtschein(this, x, y - 70, 260, 300, farbe === 'lila' ? 0xb99cf0 : 0x9cc0f2).setAlpha(0);
      this.time.delayedCall(900 + nummer * 450, () => {
        this.tweens.add({ targets: hell, alpha: 1, duration: 500 });
        this.tweens.add({ targets: schein, alpha: { from: 0.9, to: 0.45 }, duration: 900 });
        this.tweens.add({ targets: schein, alpha: 0.7, delay: 900, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.funkenRegen(x, y - 80, [0xffffff, 0xd9c9ff, 0x9cc0f2], 10);
      });
    });
  }

  // Die eigene Figur in der Mitte, das Team rundherum. Alle hüpfen und wackeln.
  tanzen() {
    const team = spielstand.team.length > 0 ? spielstand.team : [spielstand.kalamprio].filter(Boolean);
    const namen = [...team];
    if (spielstand.charakter) namen.splice(Math.floor(namen.length / 2), 0, `charakter-${spielstand.charakter}`);
    const abstand = Math.min(200, (BREITE - 160) / Math.max(namen.length, 1));

    namen.forEach((name, nummer) => {
      const x = BREITE / 2 + (nummer - (namen.length - 1) / 2) * abstand;
      this.add.ellipse(x, TANZBODEN, TAENZER_HOEHE * 0.6, 26, 0x170b2c, 0.45);
      const bild = this.add.image(x, TANZBODEN + 6, name).setOrigin(0.5, 1);
      bild.setScale(Math.min(TAENZER_HOEHE / bild.height, (abstand - 20) / bild.width));
      const verzoegerung = nummer * 120;
      this.tweens.add({ targets: bild, y: bild.y - 46, duration: 320, delay: verzoegerung, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
      this.tweens.add({
        targets: bild,
        angle: { from: -8, to: 8 },
        duration: 640,
        delay: verzoegerung,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  konfetti() {
    const stueck = this.add
      .rectangle(Math.random() * BREITE, -20, 10 + Math.random() * 8, 6 + Math.random() * 6, Phaser.Utils.Array.GetRandom(KONFETTI))
      .setDepth(15)
      .setAngle(Math.random() * 360);
    this.tweens.add({
      targets: stueck,
      y: HOEHE + 30,
      x: stueck.x + (Math.random() - 0.5) * 200,
      angle: stueck.angle + 360 + Math.random() * 360,
      duration: 2600 + Math.random() * 2000,
      onComplete: () => stueck.destroy(),
    });
  }

  feuerwerk() {
    const x = 120 + Math.random() * (BREITE - 240);
    const y = 60 + Math.random() * 180;
    const farben = Phaser.Utils.Array.Shuffle([...KONFETTI]).slice(0, 2);
    this.funkenRegen(x, y, farben, 18);
    const licht = lichtschein(this, x, y, 240, 240, farben[0]).setAlpha(0.8).setDepth(14);
    this.tweens.add({ targets: licht, alpha: 0, scale: licht.scale * 1.6, duration: 700, onComplete: () => licht.destroy() });
  }

  // Sterne fliegen von einem Punkt in alle Richtungen.
  funkenRegen(x, y, farben, anzahl) {
    for (let i = 0; i < anzahl; i += 1) {
      const winkel = (i / anzahl) * Math.PI * 2 + Math.random() * 0.3;
      const weite = 90 + Math.random() * 90;
      const stern = this.add
        .image(x, y, 'funkel')
        .setTint(farben[i % farben.length])
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(16)
        .setScale(0.8);
      this.tweens.add({
        targets: stern,
        x: x + Math.cos(winkel) * weite,
        y: y + Math.sin(winkel) * weite + 40,
        angle: 180,
        scale: 0.2,
        alpha: 0,
        duration: 1000 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => stern.destroy(),
      });
    }
  }

  weiter() {
    this.nummer += 1;
    const saetze = GESCHICHTE.ende;
    if (this.nummer >= saetze.length) {
      this.endeZeigen();
      return;
    }
    this.text.setText(saetze[this.nummer]).setAlpha(0);
    vorlesen(saetze[this.nummer]);
    this.tweens.add({ targets: this.text, alpha: 1, duration: 350 });
  }

  // Zum Schluss: der Titel, groß "Ende", wer das Spiel gemacht hat, und ein
  // Knopf, um noch einmal von vorn zu spielen.
  endeZeigen() {
    verstummen();
    for (const teil of this.textfeld) teil.destroy();
    this.tweens.killTweensOf(this.ueberschrift);
    this.ueberschrift.destroy();

    titel(this, BREITE / 2, 100, 640).setDepth(20);
    const ende = this.add
      .text(BREITE / 2, 600, 'Ende', schrift(96, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 14)
      .setDepth(20)
      .setAlpha(0);
    this.tweens.add({ targets: ende, alpha: 1, scale: { from: 0.5, to: 1 }, duration: 900, ease: 'Back.easeOut' });
    this.add
      .text(BREITE / 2, 672, 'Ein Spiel von Ida Neva', schrift(28, '#d9c9ff'))
      .setOrigin(0.5)
      .setStroke('#2a1650', 6)
      .setDepth(20);
    const knopf = textKnopf(this, BREITE - 290, 620, 250, 60, 'Nochmal spielen', () => window.location.reload());
    for (const teil of knopf) teil.setDepth(21);
    const name = CHARAKTERE[spielstand.charakter]?.name;
    if (name) {
      this.add
        .text(BREITE / 2, 190, `Danke, ${name}!`, schrift(34, '#ffd166', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 8)
        .setDepth(20);
    }
  }
}
