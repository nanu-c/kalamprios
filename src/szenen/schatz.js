// Die Schatztruhe in der Schatzkammer am Ende des Geheimgangs. Wer zu ihr
// geht, öffnet sie. Den Schatz gibt es nur einmal. Was drin ist, steht in
// daten/orte/geheimgang.js bei schatz.

import Phaser from 'phaser';
import { glitzern, rumpeln } from '../klang/geraeusche.js';
import { melodieSpielen } from '../klang/musik.js';
import { erfahrungGeben, spielstand } from '../spielstand.js';
import { vorlesen } from '../vorlesen.js';
import { abstand } from '../welt/weltlogik.js';
import { belohnungZeigen } from './animationen.js';
import { lichtschein } from './landschaft.js';

const TRUHE_BREITE = 220;
const OEFFNEN_ABSTAND = 110;

export class Schatz {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.schatz;
    const { x, y } = this.daten;
    this.schein = lichtschein(szene, x, y - 70, 420, 320, 0xffd166).setAlpha(0.35).setDepth(y - 1);
    szene.tweens.add({ targets: this.schein, alpha: 0.7, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.truhe = szene.add.image(x, y, spielstand.schatzGeoeffnet ? 'truhe-offen' : 'truhe-zu').setOrigin(0.5, 0.95).setDepth(y);
    this.truhe.setScale(TRUHE_BREITE / this.truhe.width);
    this.warDa = this.istDa();
  }

  istDa() {
    return abstand(this.szene.spieler.ort, this.daten) < OEFFNEN_ABSTAND;
  }

  pruefen() {
    const da = this.istDa();
    if (da && !this.warDa && !this.szene.gespraech) this.oeffnen();
    this.warDa = da;
  }

  oeffnen() {
    const { szene, daten } = this;
    if (spielstand.schatzGeoeffnet) {
      szene.gespraechZeigen(daten.leer, [['Okay', () => szene.gespraechSchliessen()]]);
      return;
    }
    spielstand.schatzGeoeffnet = true;
    rumpeln();
    szene.tweens.add({
      targets: this.truhe,
      angle: { from: -4, to: 4 },
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.truhe.setAngle(0).setTexture('truhe-offen');
        this.truhe.setScale(TRUHE_BREITE / this.truhe.width);
        glitzern(10, 1.2);
        melodieSpielen('sieg');
        this.funkenRegen();
        this.belohnen();
      },
    });
  }

  // Aus der Truhe fliegen Kristalle und Funken.
  funkenRegen() {
    const { szene } = this;
    const { x, y } = this.daten;
    for (let i = 0; i < 28; i += 1) {
      const stern = szene.add
        .image(x, y - 80, 'funkel')
        .setTint(Phaser.Utils.Array.GetRandom([0xffd166, 0x8ef0ff, 0xff9ad5, 0xffffff]))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(y + 10);
      szene.tweens.add({
        targets: stern,
        x: x + (Math.random() - 0.5) * 500,
        y: y - 120 - Math.random() * 260,
        angle: 360,
        alpha: 0,
        scale: { from: 1, to: 0.3 },
        delay: i * 25,
        duration: 1300,
        ease: 'Cubic.easeOut',
        onComplete: () => stern.destroy(),
      });
    }
  }

  belohnen() {
    const { szene, daten } = this;
    const { fangkristalle = 0, erfahrung = 0 } = daten.belohnung;
    spielstand.fangkristalle += fangkristalle;
    const aufgestiegen = erfahrungGeben(spielstand.kampfteam, erfahrung);
    belohnungZeigen(szene, daten, { bild: 'fangkristall', anzahl: fangkristalle, text: `+${fangkristalle} Fangkristalle` });
    const satz = [daten.satz, `+${fangkristalle} Fangkristalle.`, aufgestiegen].filter(Boolean).join(' ');
    vorlesen(daten.satz);
    szene.time.delayedCall(600, () => szene.gespraechZeigen(satz, [['Juhu!', () => szene.gespraechSchliessen()]]));
  }
}
