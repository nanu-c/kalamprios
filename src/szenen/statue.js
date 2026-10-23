// Eine verschollene Statue (statue beim Ort, zum Beispiel im verschollenen
// Stollen). Sie ist ein Kalamprio aus Stein auf einem Sockel mit einer
// Inschrift. Sie taucht erst auf, wenn das Rätsel des Ortes gelöst ist: Es
// rumpelt, Staub fliegt, und sie steigt aus dem Boden.

import { rumpeln, sternchen } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { abstand } from '../welt/weltlogik.js';
import { LICHT_TIEFE, lichtschein } from './landschaft.js';
import { STRICH, wackelstrich, wuerfel } from './raetsel.js';

const SOCKEL = { breite: 200, hoehe: 110 };
const FIGUR_HOEHE = 190; // so hoch ist das Kalamprio aus Stein
const NAH = 130; // so nah muss man herangehen, damit man die Inschrift liest

// Der Sockel: ein grauer Steinblock mit Rissen und der Inschrift.
function sockelMalen(szene, inschrift) {
  const name = `sockel-${inschrift}`;
  if (szene.textures.exists(name)) return name;
  const { breite, hoehe } = SOCKEL;
  // Der gemalte Sockel (werkzeuge/sachen_malen.py) bekommt die Inschrift.
  if (szene.textures.exists('sockel')) {
    const stein = szene.textures.get('sockel').getSourceImage();
    const hoch = Math.round((breite * stein.height) / stein.width);
    const leinwand = szene.textures.createCanvas(name, breite, hoch);
    const stift = leinwand.context;
    stift.drawImage(stein, 0, 0, breite, hoch);
    inschriftMalen(stift, inschrift, breite / 2, hoch * 0.58, breite * 0.75);
    leinwand.refresh();
    return name;
  }
  const leinwand = szene.textures.createCanvas(name, breite + 10, hoehe + 10);
  const stift = leinwand.context;
  const zufall = wuerfel(inschrift.length * 37 + 3);
  stift.beginPath();
  stift.roundRect(5, 5, breite, hoehe, 10);
  const stein = stift.createLinearGradient(0, 0, 0, hoehe);
  stein.addColorStop(0, '#b8b4c8');
  stein.addColorStop(1, '#7a7690');
  stift.fillStyle = stein;
  stift.fill();
  stift.lineWidth = 4;
  stift.strokeStyle = STRICH;
  stift.stroke();
  // Die Platte oben
  stift.beginPath();
  stift.roundRect(0, 0, breite + 10, 18, 6);
  stift.fillStyle = '#c8c4d8';
  stift.fill();
  stift.stroke();
  // Risse im Stein
  stift.strokeStyle = 'rgba(30, 20, 50, 0.45)';
  stift.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const x = 15 + zufall() * (breite - 30);
    wackelstrich(stift, [[x, 22], [x + 8, 40], [x + 2, 55]], zufall, 3);
  }
  inschriftMalen(stift, inschrift, breite / 2 + 5, hoehe / 2 + 14, breite - 20);
  leinwand.refresh();
  return name;
}

// Die Inschrift, eingemeißelt: erst ein dunkler Schatten, dann hell.
function inschriftMalen(stift, inschrift, x, y, platz) {
  stift.textAlign = 'center';
  stift.textBaseline = 'middle';
  let groesse = 24;
  do {
    stift.font = `600 ${groesse}px Fredoka, "Trebuchet MS", sans-serif`;
    groesse -= 1;
  } while (stift.measureText(inschrift).width > platz && groesse > 10);
  stift.fillStyle = 'rgba(30, 20, 50, 0.75)';
  stift.fillText(inschrift, x + 1, y + 2);
  stift.fillStyle = '#f2eeff';
  stift.fillText(inschrift, x, y);
}

export class Statue {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.statue;
    this.warDa = false;
    const { x, y, kalamprio, inschrift } = this.daten;
    this.schein = lichtschein(szene, x, y - 140, 420, 420, 0xd9c9ff).setDepth(LICHT_TIEFE).setAlpha(0.55);
    this.sockel = szene.add.image(x, y, sockelMalen(szene, inschrift)).setOrigin(0.5, 1).setDepth(LICHT_TIEFE + 1);
    // Das Kalamprio aus Stein: sein Bild, ganz grau eingefärbt
    this.figur = szene.add.image(x, y - this.sockel.displayHeight * 0.92, `${kalamprio}-klein`).setOrigin(0.5, 1).setDepth(LICHT_TIEFE + 2);
    this.figur.setScale(FIGUR_HOEHE / this.figur.height).setTint(0xa8a4bc);
    this.teile = [this.schein, this.sockel, this.figur];
    this.da = spielstand.raetselGeloest[szene.ortName] === true;
    for (const teil of this.teile) teil.setVisible(this.da);
    if (this.da) this.aufstellen();
  }

  // Die Statue steht im Weg, und sie schimmert leise.
  aufstellen() {
    const { x, y } = this.daten;
    this.szene.hindernisse.push({ x, y: y - 30, radius: 80 });
    this.szene.tweens.add({ targets: this.schein, alpha: 0.85, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Das Rätsel ist gerade gelöst: Die Statue steigt aus dem Boden.
  auftauchen() {
    if (this.da) return;
    this.da = true;
    const szene = this.szene;
    const { x, y } = this.daten;
    const kamera = szene.cameras.main;
    szene.time.delayedCall(2500, () => {
      kamera.stopFollow();
      kamera.pan(x, y - 120, 1200, 'Sine.easeInOut');
    });
    szene.time.delayedCall(3700, () => {
      rumpeln();
      kamera.shake(1400, 0.005);
      for (const teil of this.teile) {
        teil.setVisible(true);
        szene.tweens.add({ targets: teil, y: { from: teil.y + 160, to: teil.y }, alpha: { from: 0, to: teil.alpha }, duration: 1600, ease: 'Sine.easeOut' });
      }
      for (let i = 0; i < 14; i += 1) {
        const staub = szene.add.circle(x + (Math.random() - 0.5) * 260, y - 10, 14 + Math.random() * 12, 0xb8b4c8, 0.6).setDepth(LICHT_TIEFE + 3);
        szene.tweens.add({ targets: staub, y: staub.y - 60 - Math.random() * 60, scale: 2.2, alpha: 0, duration: 1400, delay: Math.random() * 600, onComplete: () => staub.destroy() });
      }
    });
    szene.time.delayedCall(5600, () => {
      sternchen();
      this.aufstellen();
      kamera.pan(szene.spieler.ort.x, szene.spieler.ort.y, 1000, 'Sine.easeInOut', false, (_, fertig) => {
        if (fertig === 1) kamera.startFollow(szene.spieler.schatten, true, 0.12, 0.12);
      });
    });
  }

  // Wer zur Statue geht, liest die Inschrift.
  pruefen() {
    if (!this.da) return;
    const da = abstand(this.szene.spieler.ort, this.daten) < NAH;
    if (da && !this.warDa && !this.szene.gespraech) {
      this.szene.saetzeNacheinander([this.daten.satz], null, 'Schön!');
    }
    this.warDa = da;
  }
}
