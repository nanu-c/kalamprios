// Erzählt am Anfang die Geschichte: Die Kristalle werden dunkel.
// Die Sätze stehen in daten/geschichte.js.
//
// Dazu läuft eine kleine Szene: Erst leuchten alle Kristalle. Bei jedem neuen
// Satz huscht der Schatten herbei und trinkt ein paar von ihnen aus, bis zum
// Schluss nur noch ein einziger leuchtet.

import Phaser from 'phaser';
import { GESCHICHTE } from '../daten/geschichte.js';
import { verstummen, vorlesen } from '../vorlesen.js';
import { feld, textKnopf } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { bilderErzeugen } from './landschaft.js';
import { BREITE, HOEHE, schrift } from './stil.js';

// Wo die Kristalle stehen: x, y ist der Fuß, groesse 1 ist normal groß.
// Der mit letzterBleibt: true wird nie dunkel, er ist die Hoffnung.
const KRISTALLE = [
  { x: 120, y: 430, groesse: 1.1, farbe: 'lila' },
  { x: 300, y: 415, groesse: 0.8, farbe: 'blau' },
  { x: 465, y: 435, groesse: 1.0, farbe: 'lila' },
  { x: 640, y: 425, groesse: 0.85, farbe: 'blau', letzterBleibt: true },
  { x: 815, y: 435, groesse: 1.0, farbe: 'lila' },
  { x: 985, y: 415, groesse: 0.8, farbe: 'blau' },
  { x: 1160, y: 430, groesse: 1.1, farbe: 'lila' },
];

// In dieser Reihenfolge werden sie dunkel (Nummern aus der Liste oben).
const REIHENFOLGE = [0, 6, 2, 4, 1, 5];

const LEUCHTFARBE = { lila: 0xb99cf0, blau: 0x9cc0f2 };

export class GeschichteSzene extends Phaser.Scene {
  constructor() {
    super('Geschichte');
  }

  create() {
    bilderErzeugen(this);
    hintergrundMalen(this, 'geschichte');
    // Mit jedem Satz wird es ein bisschen dunkler, wie die Kristalle.
    this.dunkel = this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518).setOrigin(0).setAlpha(0);
    this.cameras.main.fadeIn(600, 23, 11, 44);

    this.kristalle = KRISTALLE.map((stelle) => this.kristallAufstellen(stelle));
    this.schatten = this.schattenMalen();
    this.lauf = 0;
    this.time.addEvent({ delay: 160, loop: true, callback: () => this.funkeln() });

    this.add
      .text(BREITE / 2, 90, 'Kalamprios', schrift(80, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 10);

    feld(this, 90, 440, BREITE - 180, 240);
    this.text = this.add.text(130, 470, '', schrift(32, '#ffffff', { wordWrap: { width: BREITE - 260 }, lineSpacing: 8 }));

    textKnopf(this, BREITE - 90 - 30 - 240, 600, 240, 60, 'Weiter', () => this.weiter());
    textKnopf(this, 120, 600, 240, 60, 'Überspringen', () => this.fertig());
    textKnopf(this, BREITE / 2 - 120, 600, 240, 60, 'Nochmal hören', () => vorlesen(this.text.text));

    this.nummer = -1;
    this.weiter();
  }

  // Ein Kristall besteht aus einem Lichthof, dem dunklen Bild und darüber dem
  // leuchtenden Bild. Wird er dunkel, verschwinden Lichthof und Leuchtbild.
  kristallAufstellen({ x, y, groesse, farbe, letzterBleibt = false }) {
    const licht = this.add
      .ellipse(x, y - 70 * groesse, 170 * groesse, 210 * groesse, LEUCHTFARBE[farbe])
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: licht,
      scale: 1.12,
      alpha: 0.32,
      duration: 900 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add.image(x, y, 'kristall-dunkel').setOrigin(0.5, 160 / 170).setScale(groesse);
    const hell = this.add.image(x, y, `kristall-${farbe}`).setOrigin(0.5, 160 / 170).setScale(groesse);
    return { x, y, groesse, farbe, licht, hell, letzterBleibt, istDunkel: false };
  }

  // Der Schatten: ein dunkler Klecks mit leuchtenden Augen.
  schattenMalen() {
    const stift = this.add.graphics();
    stift.fillStyle(0x07020f, 0.9);
    stift.fillEllipse(0, 0, 90, 70);
    stift.fillTriangle(-40, 10, -95, -5, -40, -15);
    stift.fillTriangle(-30, 25, -80, 30, -25, 10);
    stift.fillStyle(0xffe066);
    stift.fillEllipse(14, -8, 14, 9);
    stift.fillEllipse(32, -8, 14, 9);
    return this.add.container(-200, 380, [stift]).setAlpha(0);
  }

  // Kleine Lichtpunkte steigen von den Kristallen auf, die noch leuchten.
  funkeln() {
    const leuchtende = this.kristalle.filter((kristall) => !kristall.istDunkel);
    if (leuchtende.length === 0) return;
    const kristall = Phaser.Utils.Array.GetRandom(leuchtende);
    const x = kristall.x + (Math.random() - 0.5) * 70 * kristall.groesse;
    const y = kristall.y - Math.random() * 120 * kristall.groesse;
    const punkt = this.add
      .circle(x, y, 3 + Math.random() * 3, 0xffffff, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: punkt,
      y: punkt.y - 60 - Math.random() * 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => punkt.destroy(),
    });
  }

  weiter() {
    this.nummer += 1;
    const saetze = GESCHICHTE.anfang;
    if (this.nummer >= saetze.length) {
      this.fertig();
      return;
    }
    this.text.setText(saetze[this.nummer]).setAlpha(0);
    vorlesen(saetze[this.nummer]);
    this.tweens.add({ targets: this.text, alpha: 1, duration: 350 });

    // Beim letzten Satz sind alle dunkel bis auf einen.
    const anteil = saetze.length > 1 ? this.nummer / (saetze.length - 1) : 0;
    this.tweens.add({ targets: this.dunkel, alpha: 0.6 * anteil, duration: 1500 });
    this.dunkelWerden(Math.round(REIHENFOLGE.length * anteil));
  }

  // Der Schatten läuft zu den Kristallen, bis insgesamt wieviele dunkel sind.
  async dunkelWerden(wieviele) {
    // Tippt man schnell weiter, wird der alte Lauf abgebrochen und
    // seine Kristalle sind sofort dunkel.
    this.lauf += 1;
    const lauf = this.lauf;
    this.tweens.killTweensOf(this.schatten);
    for (const kristall of this.kristalle) if (kristall.wirdDunkel) this.ausloeschen(kristall, 0);

    const ziele = REIHENFOLGE.slice(0, wieviele)
      .map((nummer) => this.kristalle[nummer])
      .filter((kristall) => !kristall.istDunkel && !kristall.letzterBleibt);
    if (ziele.length === 0) {
      this.tweens.add({ targets: this.schatten, alpha: 0, duration: 300 });
      return;
    }
    for (const kristall of ziele) kristall.wirdDunkel = true;

    // Der Schatten kommt von der Seite, auf der der erste Kristall steht.
    const vonLinks = ziele[0].x < BREITE / 2;
    const rand = vonLinks ? -150 : BREITE + 150;
    this.schatten.setPosition(rand, 400).setAlpha(1).setScale(vonLinks ? 1 : -1, 1);

    for (const kristall of ziele) {
      this.schatten.scaleX = kristall.x > this.schatten.x ? 1 : -1;
      await this.bewegen({ x: kristall.x - 55 * this.schatten.scaleX, y: kristall.y - 30 }, 650);
      if (lauf !== this.lauf) return;
      this.lichtTrinken(kristall);
      await this.bewegen({ y: kristall.y - 45 }, 350, true);
      if (lauf !== this.lauf) return;
    }

    // Und schnell davon, auf der anderen Seite hinaus.
    const ausgang = vonLinks ? BREITE + 150 : -150;
    this.schatten.scaleX = vonLinks ? 1 : -1;
    await this.bewegen({ x: ausgang, y: 360 }, 700);
  }

  bewegen(wohin, dauer, hinUndHer = false) {
    return new Promise((fertig) => {
      this.tweens.add({
        targets: this.schatten,
        ...wohin,
        duration: dauer,
        yoyo: hinUndHer,
        ease: 'Sine.easeInOut',
        onComplete: fertig,
      });
    });
  }

  // Das Licht fliegt in kleinen Punkten aus dem Kristall in den Schatten.
  lichtTrinken(kristall) {
    for (let i = 0; i < 8; i += 1) {
      const x = kristall.x + (Math.random() - 0.5) * 50;
      const y = kristall.y - 40 - Math.random() * 90 * kristall.groesse;
      const punkt = this.add
        .circle(x, y, 5, LEUCHTFARBE[kristall.farbe])
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: punkt,
        x: this.schatten.x,
        y: this.schatten.y,
        scale: 0.3,
        delay: i * 40,
        duration: 380,
        ease: 'Cubic.easeIn',
        onComplete: () => punkt.destroy(),
      });
    }
    this.ausloeschen(kristall, 600);
  }

  ausloeschen(kristall, dauer) {
    kristall.wirdDunkel = false;
    kristall.istDunkel = true;
    this.tweens.killTweensOf(kristall.licht);
    if (dauer === 0) {
      kristall.hell.setAlpha(0);
      kristall.licht.setAlpha(0);
      return;
    }
    this.tweens.add({ targets: [kristall.hell, kristall.licht], alpha: 0, duration: dauer });
  }

  fertig() {
    if (this.vorbei) return;
    this.vorbei = true;
    verstummen();
    this.cameras.main.fadeOut(400, 23, 11, 44);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Charakter'));
  }
}
