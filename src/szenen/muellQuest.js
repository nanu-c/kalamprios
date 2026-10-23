// Die Müll-Aufgabe unter Wasser: Die alte Muschel bittet einen, den ganzen
// Müll im See einzusammeln. Solange Müll da ist, ist das Wasser trüb. Wer
// alles eingesammelt hat und zur Muschel zurückkommt, bekommt die Belohnung,
// und das Wasser wird klar. Was die Muschel sagt und wo der Müll liegt, steht
// in daten/orte/unterwasser.js bei muellQuest.

import Phaser from 'phaser';
import { aufsammeln, plopp } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { abstand } from '../welt/weltlogik.js';
import { belohnungZeigen } from './animationen.js';
import { lichtschein } from './landschaft.js';
import { schrift } from './stil.js';

const VORNE = 100000;
const MUSCHEL_ABSTAND = 120;
const MUELL_ABSTAND = 55;

export class MuellQuest {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.muellQuest;
    this.name = szene.ortName;
    const { muschel } = this.daten;

    // Die Muschel liegt im Sand und schimmert ein bisschen.
    this.schein = lichtschein(szene, muschel.x, muschel.y - 40, 240, 160, 0xffd6f0).setAlpha(0.35).setDepth(muschel.y - 1);
    szene.tweens.add({ targets: this.schein, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.muschel = szene.add.image(muschel.x, muschel.y, 'muschel').setOrigin(0.5, 0.9).setDepth(muschel.y);
    this.muschel.setScale(130 / this.muschel.width);
    szene.hindernisse.push({ x: muschel.x, y: muschel.y - 20, radius: 50 });

    // Der Müll: Er schaukelt im Wasser und dreht sich langsam.
    this.muell = this.daten.muell.map((teil, nummer) => {
      const merkname = `${this.name}-${nummer}`;
      const bild = szene.add.image(teil.x, teil.y, teil.art).setDepth(teil.y);
      bild.setScale(64 / Math.max(bild.width, bild.height));
      szene.tweens.add({ targets: bild, y: teil.y - 12, angle: { from: -12, to: 12 }, duration: 1600 + nummer * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const weg = Boolean(spielstand.muell[merkname]);
      bild.setVisible(!weg);
      return { ...teil, merkname, bild, weg };
    });

    // Trübes Wasser: ein grünlicher Schleier über allem, bis der Müll weg ist.
    this.trueb = szene.add
      .rectangle(0, 0, szene.ort.breite, szene.ort.hoehe, 0x4a6a3a, 0.28)
      .setOrigin(0)
      .setDepth(VORNE - 20)
      .setVisible(!this.fertig);

    // Oben links unter den Knöpfen: wie viel Müll man schon hat.
    this.zaehler = szene.add
      .text(18, 92, '', schrift(22, '#f6f0ff', { fontStyle: '600' }))
      .setStroke('#170b2c', 6)
      .setScrollFactor(0)
      .setDepth(VORNE + 5);
    this.zaehlerZeigen();
    this.warDa = this.istDa();
    if (this.fertig) this.klarZeigen(false);
  }

  get gesammelt() {
    return this.muell.filter((teil) => teil.weg).length;
  }

  get fertig() {
    return spielstand.questFertig[this.name] === true;
  }

  get angefangen() {
    return spielstand.questAngefangen[this.name] === true;
  }

  zaehlerZeigen() {
    const sichtbar = this.angefangen && !this.fertig;
    this.zaehler.setVisible(sichtbar).setText(`Müll: ${this.gesammelt} von ${this.muell.length}`);
  }

  istDa() {
    return abstand(this.szene.spieler.ort, this.daten.muschel) < MUSCHEL_ABSTAND;
  }

  pruefen() {
    const da = this.istDa();
    if (da && !this.warDa && !this.szene.gespraech) this.sprechen();
    this.warDa = da;

    // Müll einsammeln (auch schon, bevor die Muschel darum gebeten hat)
    for (const teil of this.muell) {
      if (teil.weg || abstand(this.szene.spieler.ort, { x: teil.bild.x, y: teil.bild.y }) > MUELL_ABSTAND) continue;
      teil.weg = true;
      spielstand.muell[teil.merkname] = true;
      this.einsammeln(teil);
    }
  }

  // Das Teil schrumpft und fliegt oben links zum Zähler.
  einsammeln(teil) {
    const { szene } = this;
    aufsammeln();
    plopp(0.8);
    szene.tweens.killTweensOf(teil.bild);
    const kamera = szene.cameras.main;
    teil.bild.setScrollFactor(0).setPosition(teil.bild.x - kamera.scrollX, teil.bild.y - kamera.scrollY).setDepth(VORNE + 4);
    szene.tweens.add({
      targets: teil.bild,
      x: 60,
      y: 104,
      scale: teil.bild.scale * 0.3,
      angle: 360,
      duration: 650,
      ease: 'Cubic.easeIn',
      onComplete: () => teil.bild.setVisible(false),
    });
    const alle = this.muell.length;
    const text = this.gesammelt === alle ? 'Alles eingesammelt! Zurück zur Muschel!' : `Müll: ${this.gesammelt} von ${alle}`;
    const schild = szene.add
      .text(teil.x, teil.y - 60, text, schrift(24, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#170b2c', 6)
      .setDepth(VORNE - 1);
    szene.tweens.add({ targets: schild, y: schild.y - 50, alpha: 0, delay: 500, duration: 1300, onComplete: () => schild.destroy() });
    if (!this.angefangen) spielstand.questAngefangen[this.name] = true;
    this.zaehlerZeigen();
  }

  sprechen() {
    const { szene, daten } = this;
    if (this.fertig) {
      szene.saetzeNacheinander([daten.danke]);
      return;
    }
    if (!this.angefangen) {
      szene.saetzeNacheinander(daten.auftrag, () => {
        spielstand.questAngefangen[this.name] = true;
        this.zaehlerZeigen();
      }, 'Mach ich!');
      return;
    }
    if (this.gesammelt < this.muell.length) {
      szene.saetzeNacheinander([daten.weiter.replace('{anzahl}', this.gesammelt).replace('{alle}', this.muell.length)], null, 'Okay');
      return;
    }
    // Geschafft: Belohnung, und das Wasser wird klar.
    spielstand.questFertig[this.name] = true;
    const kristalle = daten.belohnung?.fangkristalle ?? 0;
    spielstand.fangkristalle += kristalle;
    this.zaehlerZeigen();
    this.klarZeigen(true);
    if (kristalle > 0) belohnungZeigen(szene, daten.muschel, { anzahl: kristalle, text: `+${kristalle} Fangkristalle` });
    szene.saetzeNacheinander([daten.geschafft], null, 'Gern geschehen!');
  }

  // Das Wasser wird klar: Der trübe Schleier verschwindet, und es glitzert.
  klarZeigen(langsam) {
    const { szene } = this;
    if (!langsam) {
      this.trueb.setVisible(false);
    } else {
      szene.tweens.add({ targets: this.trueb, alpha: 0, duration: 2500, onComplete: () => this.trueb.setVisible(false) });
    }
    szene.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const x = Math.random() * szene.ort.breite;
        const y = 120 + Math.random() * (szene.ort.hoehe - 300);
        const funke = szene.add.image(x, y, 'funkel').setTint(0xcfeeff).setBlendMode(Phaser.BlendModes.ADD).setDepth(VORNE - 19).setScale(0);
        szene.tweens.add({ targets: funke, scale: 0.4 + Math.random() * 0.3, angle: 90, duration: 400, yoyo: true, onComplete: () => funke.destroy() });
      },
    });
  }
}
