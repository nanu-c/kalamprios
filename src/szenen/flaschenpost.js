// Die Flaschenpost am Mondsee: Der letzte Mondfisch bittet um Hilfe, weil
// sein See krank ist. Drei verschiedene Aufgaben machen ihn wieder gesund:
// den Müll unter Wasser einsammeln (muellQuest.js), die verirrten Frösche
// zur Froschbucht bringen und das quietschende Wasserrad ölen. Dann zeigt
// sich der Mondfisch. Was man einstellen kann und was gesagt wird, steht bei
// flaschenpost in daten/orte/mondsee.js.

import Phaser from 'phaser';
import { quaken, quietschen, sternchen, wusch } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { abstand } from '../welt/weltlogik.js';
import { belohnungZeigen } from './animationen.js';
import { lichtschein } from './landschaft.js';
import { seeBilderMalen } from './seeBilder.js';

const NAH = 90; // so nah muss man an die Flasche, das Rad oder einen Frosch
const BUCHT_WEITE = 140; // so nah an der Froschbucht ist ein Frosch zu Hause
const FROSCH_ABSTAND = 55; // so weit hüpfen Frösche hinter einem her
const QUIETSCH_WEITE = 900; // so weit hört man das Wasserrad

export class Flaschenpost {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.flaschenpost;
    this.name = szene.ortName;
    seeBilderMalen(szene);
    this.warBeiFlasche = false;
    this.warBeimRad = false;
    this.flascheBauen();
    this.buchtBauen();
    this.froescheBauen();
    this.radBauen();
    if (this.geschafft) this.mondfischSchwimmt();
  }

  // ------------------------------------------------------------ Merken

  get angefangen() {
    return spielstand.questAngefangen.flaschenpost === true;
  }

  get geschafft() {
    return spielstand.questFertig.flaschenpost === true;
  }

  // Welche der drei Aufgaben schon erledigt sind
  get erledigt() {
    return {
      muell: spielstand.questFertig[this.daten.muellOrt] === true,
      froesche: this.daten.froesche.every((_, nummer) => this.froschDaheim(nummer)),
      wasserrad: spielstand.questFertig.wasserrad === true,
    };
  }

  froschDaheim(nummer) {
    return spielstand.questFertig[`frosch-${nummer}`] === true;
  }

  // ------------------------------------------------------------ Aufbauen

  flascheBauen() {
    const { flasche } = this.daten;
    const szene = this.szene;
    this.flascheSchein = lichtschein(szene, flasche.x, flasche.y - 30, 150, 110, 0xbff0d8).setAlpha(0.5).setDepth(flasche.y - 1);
    this.flasche = szene.add.image(flasche.x, flasche.y, 'flaschenpost').setOrigin(0.5, 0.9).setDepth(flasche.y);
    this.flasche.setScale(80 / this.flasche.width).setAngle(-6);
    szene.tweens.add({ targets: this.flasche, angle: 6, y: flasche.y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    szene.tweens.add({ targets: this.flascheSchein, alpha: 0.2, duration: 1200, yoyo: true, repeat: -1 });
    // Ist alles geschafft, liegt die Flasche nicht mehr da.
    this.flasche.setVisible(!this.geschafft);
    this.flascheSchein.setVisible(!this.geschafft);
  }

  // Die Froschbucht: Seerosenblätter am Ufer, auf denen die Frösche wohnen.
  buchtBauen() {
    const { bucht } = this.daten;
    const szene = this.szene;
    this.blaetter = this.daten.froesche.map((_, nummer) => {
      const winkel = (nummer / this.daten.froesche.length) * Math.PI * 2;
      const punkt = { x: bucht.x + Math.cos(winkel) * 70, y: bucht.y + Math.sin(winkel) * 34 };
      const blatt = szene.add.image(punkt.x, punkt.y, 'seerosenblatt').setDepth(-3).setFlipX(nummer % 2 === 0);
      blatt.setScale(90 / blatt.width);
      return punkt;
    });
    const gross = szene.add.image(bucht.x, bucht.y, 'seerosenblatt').setDepth(-3);
    gross.setScale(120 / gross.width);
    szene.add
      .text(bucht.x, bucht.y - 110, 'Froschbucht', { fontFamily: 'Fredoka, sans-serif', fontSize: '19px', color: '#ffffff', fontStyle: '600' })
      .setOrigin(0.5)
      .setPadding(10, 6)
      .setBackgroundColor('#2f6a4a')
      .setDepth(bucht.y);
  }

  froescheBauen() {
    const szene = this.szene;
    this.froesche = this.daten.froesche.map((platz, nummer) => {
      const daheim = this.froschDaheim(nummer);
      const ort = daheim ? { ...this.blaetter[nummer] } : { x: platz.x, y: platz.y };
      const bild = szene.add.image(ort.x, ort.y, 'frosch').setOrigin(0.5, 0.85).setDepth(ort.y + 1);
      bild.setScale(42 / bild.height);
      return { nummer, bild, ort, folgt: false, daheim, naechstesQuaken: szene.time.now + 2000 + Math.random() * 4000 };
    });
  }

  radBauen() {
    const { wasserrad } = this.daten;
    const szene = this.szene;
    // Das Rad steht am Ufer und taucht unten ins Wasser, ein Pfosten hält es.
    szene.add.rectangle(wasserrad.x, wasserrad.y, 26, 90, 0x5a3a2a).setStrokeStyle(3, 0x1a1035).setDepth(wasserrad.y - 2);
    this.rad = szene.add.image(wasserrad.x, wasserrad.y + 45, 'wasserrad').setDepth(wasserrad.y - 1);
    this.rad.setScale(150 / this.rad.width);
    szene.hindernisse.push({ x: wasserrad.x, y: wasserrad.y - 10, radius: 40 });
    this.radDrehen();
    this.naechstesQuietschen = 0;
  }

  // Ein geöltes Rad dreht sich ruhig, ein rostiges ruckelt.
  radDrehen() {
    const szene = this.szene;
    szene.tweens.killTweensOf(this.rad);
    if (spielstand.questFertig.wasserrad) {
      szene.tweens.add({ targets: this.rad, angle: 360, duration: 9000, repeat: -1 });
      return;
    }
    const ruck = () => szene.tweens.add({ targets: this.rad, angle: this.rad.angle + 25, duration: 380, delay: 500 + Math.random() * 600, ease: 'Back.easeOut', onComplete: ruck });
    ruck();
  }

  // ------------------------------------------------------------ Jeden Augenblick

  pruefen(sekunden) {
    const szene = this.szene;
    const spieler = szene.spieler.ort;

    // An der Flasche
    const beiFlasche = abstand(spieler, this.daten.flasche) < NAH;
    if (beiFlasche && !this.warBeiFlasche && !szene.gespraech) this.flascheLesen();
    this.warBeiFlasche = beiFlasche;

    // Am Wasserrad
    const beimRad = abstand(spieler, this.daten.wasserrad) < NAH + 30;
    if (beimRad && !this.warBeimRad && !szene.gespraech) this.radAnfassen();
    this.warBeimRad = beimRad;

    // Das rostige Rad quietscht. Je näher man ist, desto lauter.
    if (!spielstand.questFertig.wasserrad && szene.time.now > this.naechstesQuietschen) {
      this.naechstesQuietschen = szene.time.now + 1500 + Math.random() * 1500;
      const weit = abstand(spieler, this.daten.wasserrad);
      if (weit < QUIETSCH_WEITE) {
        quietschen({ pan: Phaser.Math.Clamp((this.daten.wasserrad.x - spieler.x) / 800, -0.8, 0.8), lautstaerke: 1 - weit / QUIETSCH_WEITE });
      }
    }

    this.froescheBewegen(spieler, sekunden);
  }

  // Frösche, die man gefunden hat, hüpfen in einer Reihe hinter einem her.
  froescheBewegen(spieler, sekunden) {
    const szene = this.szene;
    let vorne = spieler;
    for (const frosch of this.froesche) {
      if (frosch.daheim) continue;
      if (!frosch.folgt) {
        if (this.angefangen && abstand(spieler, frosch.ort) < NAH && !szene.gespraech) {
          frosch.folgt = true;
          quaken();
          szene.saetzeNacheinander([this.daten.froschGefunden], null, 'Komm mit!');
        } else if (szene.time.now > frosch.naechstesQuaken) {
          // Verirrte Frösche quaken ab und zu, so findet man sie.
          frosch.naechstesQuaken = szene.time.now + 3000 + Math.random() * 4000;
          const ort = szene.hoerOrt(frosch.ort);
          if (ort) quaken(ort);
        }
        continue;
      }
      const weit = abstand(vorne, frosch.ort);
      if (weit > FROSCH_ABSTAND) {
        const anteil = Math.min(1, (sekunden * 6 * (weit - FROSCH_ABSTAND)) / weit);
        frosch.ort = { x: frosch.ort.x + (vorne.x - frosch.ort.x) * anteil, y: frosch.ort.y + (vorne.y - frosch.ort.y) * anteil };
        // hüpfen: ein kleiner Bogen nach oben
        frosch.bild.setPosition(frosch.ort.x, frosch.ort.y - Math.abs(Math.sin(szene.time.now / 90)) * 14);
      } else {
        frosch.bild.setPosition(frosch.ort.x, frosch.ort.y);
      }
      frosch.bild.setDepth(frosch.ort.y + 1).setFlipX(vorne.x < frosch.ort.x);
      vorne = frosch.ort;

      if (abstand(frosch.ort, this.daten.bucht) < BUCHT_WEITE) this.froschHeim(frosch);
    }
  }

  froschHeim(frosch) {
    const szene = this.szene;
    frosch.folgt = false;
    frosch.daheim = true;
    spielstand.questFertig[`frosch-${frosch.nummer}`] = true;
    const blatt = this.blaetter[frosch.nummer];
    quaken();
    szene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 500,
      onUpdate: (tween, { t }) => {
        const x = frosch.ort.x + (blatt.x - frosch.ort.x) * t;
        const y = frosch.ort.y + (blatt.y - frosch.ort.y) * t - Math.sin(t * Math.PI) * 50;
        frosch.bild.setPosition(x, y);
      },
      onComplete: () => {
        frosch.ort = { ...blatt };
        frosch.bild.setPosition(blatt.x, blatt.y).setDepth(blatt.y + 1);
      },
    });
    const alle = this.erledigt.froesche;
    if (!szene.gespraech) szene.saetzeNacheinander([alle ? this.daten.froescheTipp : this.daten.froschDaheim], null, alle ? 'Toll!' : 'Okay');
  }

  radAnfassen() {
    const szene = this.szene;
    if (spielstand.questFertig.wasserrad) return;
    if (!spielstand.gefunden[this.daten.braucht]) {
      szene.saetzeNacheinander([this.daten.wasserradLaut], null, 'Okay');
      return;
    }
    spielstand.questFertig.wasserrad = true;
    sternchen();
    this.radDrehen();
    szene.saetzeNacheinander([this.daten.wasserradTipp], null, 'Toll!');
  }

  // Die Flasche: beim ersten Mal der Brief, dann was noch zu tun ist, und
  // wenn alles geschafft ist, kommt der Mondfisch.
  flascheLesen() {
    const szene = this.szene;
    if (this.geschafft) return;
    if (!this.angefangen) {
      szene.saetzeNacheinander(this.daten.brief, () => {
        spielstand.questAngefangen.flaschenpost = true;
      }, 'Ich helfe!');
      return;
    }
    const erledigt = this.erledigt;
    const fehlt = Object.entries(this.daten.aufgaben).filter(([aufgabe]) => !erledigt[aufgabe]);
    if (fehlt.length > 0) {
      const liste = fehlt.map(([, text]) => `• ${text}`).join('\n');
      const muellTipp = erledigt.muell ? [this.daten.muellTipp] : [];
      szene.saetzeNacheinander([`${this.daten.nochZuTun}\n${liste}`, ...muellTipp], null, 'Okay');
      return;
    }
    this.mondfischKommt();
  }

  // Alles geschafft: Der Mondfisch springt aus dem Wasser und bedankt sich.
  mondfischKommt() {
    const szene = this.szene;
    spielstand.questFertig.flaschenpost = true;
    const { flasche } = this.daten;
    this.flasche.setVisible(false);
    this.flascheSchein.setVisible(false);
    // Er springt zweimal, damit man ihn auch sieht, während er spricht.
    this.springen({ x: flasche.x + 60, y: flasche.y - 120 });
    szene.time.delayedCall(1600, () => this.springen({ x: flasche.x + 220, y: flasche.y - 150 }));
    szene.time.delayedCall(500, () => {
      szene.saetzeNacheinander(this.daten.mondfisch, () => {
        const kristalle = this.daten.belohnung?.fangkristalle ?? 0;
        spielstand.fangkristalle += kristalle;
        if (kristalle > 0) belohnungZeigen(szene, flasche, { bild: 'fangkristall', anzahl: kristalle, text: `+${kristalle} Fangkristalle` });
        this.mondfischSchwimmt();
      }, 'Danke!');
    });
  }

  // Der Mondfisch springt in einem Bogen aus dem Wasser, mit Glitzer.
  springen(von) {
    const szene = this.szene;
    const fisch = szene.add.image(von.x, von.y, 'mondfisch').setDepth(von.y + 300);
    fisch.setScale(120 / fisch.width);
    const schein = lichtschein(szene, von.x, von.y, 200, 160, 0xbfd8ff).setDepth(von.y + 299);
    wusch(0.3, true);
    sternchen();
    szene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 1100,
      onUpdate: (tween, { t }) => {
        const x = von.x - 140 * t;
        const y = von.y - Math.sin(t * Math.PI) * 170;
        fisch.setPosition(x, y).setAngle(-40 + t * 80);
        schein.setPosition(x, y);
        if (Math.random() < 0.3) {
          const funke = szene.add.image(x, y, 'funkel').setTint(0xe8f4ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(von.y + 301).setScale(0.5);
          szene.tweens.add({ targets: funke, y: funke.y + 40, alpha: 0, duration: 600, onComplete: () => funke.destroy() });
        }
      },
      onComplete: () => {
        fisch.destroy();
        schein.destroy();
      },
    });
  }

  // Danach schwimmt der Mondfisch leuchtend im See herum und springt ab und
  // zu heraus. Wer zur Flasche kommt, dem winkt er.
  mondfischSchwimmt() {
    const szene = this.szene;
    const see = (szene.ort.seen ?? [])[0];
    if (!see) return;
    const schein = lichtschein(szene, see.x, see.y, 160, 90, 0xbfd8ff).setAlpha(0.7).setDepth(see.y + 200);
    szene.tweens.add({
      targets: { t: 0 },
      t: Math.PI * 2,
      duration: 26000,
      repeat: -1,
      onUpdate: (tween, { t }) => schein.setPosition(see.x + Math.cos(t) * see.breite * 0.3, see.y + Math.sin(t) * see.hoehe * 0.28),
    });
    szene.time.addEvent({ delay: 9000, loop: true, callback: () => this.springen({ x: schein.x + 70, y: schein.y }) });
  }
}
