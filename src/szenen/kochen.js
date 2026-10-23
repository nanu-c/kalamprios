// Kochen in der Küche: Am Herd sucht man im Kochbuch ein Rezept aus, dann
// sammelt man die Zutaten ein, und am Herd kommt alles in den Topf. Manche
// Zutaten liegen in der Küche, andere wachsen draußen, und manche sind Essen,
// das man vorher gekocht hat. Was nicht in der Küche liegt, kommt aus dem
// Beutel. Manche Rezepte muss man erst finden (fundort). Umrühren, und das
// Essen ist fertig. Es kommt in den Beutel (beutel.js), im Kampf kann man es
// benutzen. Was es gibt und was jedes Essen bewirkt, steht in
// daten/orte/haus.js bei kueche.

import Phaser from 'phaser';
import { aufsammeln, plopp, sternchen, wackeln } from '../klang/geraeusche.js';
import { melodieSpielen } from '../klang/musik.js';
import { ORTE } from '../daten/orte.js';
import { anzahl, einpacken, herausnehmen, rezeptBekannt, zutatInfo } from '../beutel.js';
import { spielstand } from '../spielstand.js';
import { vorlesen } from '../vorlesen.js';
import { abstand } from '../welt/weltlogik.js';
import { lichtschein } from './landschaft.js';
import { feld, textKnopf } from './bausteine.js';
import { BREITE, FARBEN, HOEHE, schrift } from './stil.js';

const VORNE = 100000;
const ZUTAT_HOEHE = 74;
const HERD_ABSTAND = 80;
const ZUTAT_ABSTAND = 55;
const UMRUEHREN = 4; // so oft muss man umrühren

export class Kochen {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.kueche;
    this.rezept = null; // das Rezept, das gerade gekocht wird
    this.gesammelt = new Set(); // die Zutaten, die man schon hat
    this.warAmHerd = false;
    this.beiZutat = null;
    this.kocht = false;

    const { herd, zutaten } = this.daten;
    // Vor dem Herd leuchtet der Boden, damit man weiß, wo man kocht.
    const matte = lichtschein(szene, herd.x, herd.y, 200, 70, 0xffc861).setAlpha(0.35).setDepth(-2);
    szene.tweens.add({ targets: matte, alpha: 0.7, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Aus dem Topf steigt Dampf.
    szene.time.addEvent({ delay: 700, loop: true, callback: () => this.dampf(0xffffff, 0.35) });

    // Nur die Zutaten mit x und y liegen in der Küche. Die anderen wachsen draußen.
    this.zutaten = Object.entries(zutaten).filter(([, zutat]) => zutat.wo === undefined).map(([art, zutat]) => {
      const schein = lichtschein(szene, zutat.x, zutat.y - 30, 120, 90, 0xfff3c4).setAlpha(0.3).setDepth(zutat.y - 1);
      const bild = szene.add.image(zutat.x, zutat.y, zutat.bild).setOrigin(0.5, 0.95).setDepth(zutat.y);
      bild.setScale(ZUTAT_HOEHE / Math.max(bild.height, bild.width * 0.8));
      szene.tweens.add({ targets: bild, y: zutat.y - 6, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      szene.add.text(zutat.x, zutat.y + 14, zutat.name, schrift(18, '#fff3c4')).setOrigin(0.5, 0).setStroke('#3a2410', 5).setDepth(zutat.y);
      // bild ist hier das Bild auf dem Bildschirm, name bleibt der Name der Zutat.
      return { art, ...zutat, bild, schein };
    });

    this.zettelBauen();
  }

  // Oben rechts der Einkaufszettel: welches Rezept, und welche Zutaten man schon hat.
  zettelBauen() {
    this.zettel = this.szene.add.container(BREITE - 30 - 300, 96).setScrollFactor(0).setDepth(VORNE).setVisible(false);
    this.szene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.zettel.destroy());
  }

  zettelZeigen() {
    const { szene, zettel } = this;
    zettel.removeAll(true);
    if (!this.rezept) {
      zettel.setVisible(false);
      return;
    }
    const zutaten = this.rezept.zutaten;
    const hoehe = 64 + zutaten.length * 44;
    zettel.add(szene.add.rectangle(0, 0, 300, hoehe, 0xfff3d6, 0.95).setOrigin(0).setStrokeStyle(4, 0x6a4a2a).setRounded?.(14) ?? []);
    zettel.add(szene.add.text(150, 14, this.rezept.name, schrift(24, '#3a2410', { fontStyle: '600' })).setOrigin(0.5, 0));
    zutaten.forEach((art, nummer) => {
      const zutat = zutatInfo(art);
      const y = 70 + nummer * 44;
      const bild = szene.add.image(34, y, zutat.bild);
      bild.setScale(36 / Math.max(bild.height, bild.width));
      const da = this.hat(art);
      // Was nicht in der Küche liegt und noch fehlt, hat einen kleinen Hinweis.
      const hinweis = { draussen: ' (draußen)', kochen: ' (kochen)' }[zutat.woher] ?? '';
      const name = da ? zutat.name : `${zutat.name}${hinweis}`;
      zettel.add([
        bild.setAlpha(da ? 1 : 0.5),
        szene.add.text(64, y, name, schrift(20, da ? '#2f7a3a' : '#6a4a2a')).setOrigin(0, 0.5),
        szene.add.text(276, y, da ? '✓' : '·', schrift(26, '#2f7a3a', { fontStyle: '600' })).setOrigin(1, 0.5),
      ]);
    });
    zettel.setVisible(true);
  }

  // Dampf über dem Topf, in einer Farbe
  dampf(farbe, staerke) {
    const { topf } = this.daten.herd;
    const wolke = lichtschein(this.szene, topf.x + (Math.random() - 0.5) * 60, topf.y - 40, 70, 70, farbe).setAlpha(staerke).setDepth(-5);
    this.szene.tweens.add({ targets: wolke, y: wolke.y - 90, scale: wolke.scale * 2, alpha: 0, duration: 1800, onComplete: () => wolke.destroy() });
  }

  // ---------------------------------------------------------------- Laufen

  pruefen() {
    if (this.kocht) return;
    const spieler = this.szene.spieler.ort;
    const amHerd = abstand(spieler, this.daten.herd) < HERD_ABSTAND;
    if (amHerd && !this.warAmHerd && !this.szene.gespraech) this.amHerd();
    this.warAmHerd = amHerd;

    const zutat = this.zutaten.find((z) => abstand(spieler, z) < ZUTAT_ABSTAND) ?? null;
    if (zutat && zutat !== this.beiZutat) this.zutatNehmen(zutat);
    this.beiZutat = zutat;
  }

  zutatNehmen(zutat) {
    if (!this.rezept) {
      this.schweben(zutat, 'Such dir erst am Herd ein Rezept aus!');
      return;
    }
    if (this.gesammelt.has(zutat.art)) return;
    if (!this.rezept.zutaten.includes(zutat.art)) {
      wackeln();
      this.schweben(zutat, `${zutat.name} brauchst du für ${this.rezept.name} nicht.`);
      return;
    }
    this.gesammelt.add(zutat.art);
    aufsammeln();
    this.szene.tweens.add({ targets: zutat.bild, scale: zutat.bild.scale * 1.4, duration: 150, yoyo: true });
    this.schweben(zutat, `${zutat.name}!`);
    this.zettelZeigen();
    if (this.fehlende().length === 0) this.schweben(this.daten.herd, 'Alles da! Ab zum Herd!');
  }

  // Hat man diese Zutat? Was in der Küche liegt, muss man eingesammelt
  // haben. Was draußen wächst oder vorher gekocht wird, muss im Beutel sein.
  hat(art) {
    return zutatInfo(art).woher === 'kueche' ? this.gesammelt.has(art) : anzahl(art) > 0;
  }

  fehlende() {
    return this.rezept ? this.rezept.zutaten.filter((art) => !this.hat(art)) : [];
  }

  // ------------------------------------------------------------ Am Herd

  amHerd() {
    const { szene, daten } = this;
    if (!this.rezept) {
      this.kochbuchZeigen();
      return;
    }
    const fehlen = this.fehlende();
    if (fehlen.length > 0) {
      const namen = fehlen
        .map((art) => {
          const zutat = zutatInfo(art);
          if (zutat.woher === 'draussen') return `${zutat.name} (wächst ${zutat.wo})`;
          if (zutat.woher === 'kochen') return `${zutat.name} (koch es zuerst)`;
          return zutat.name;
        })
        .join(', ');
      this.sagen(daten.fehlt.replace('{rezept}', this.rezept.name).replace('{zutaten}', namen), [
        ['Okay', () => szene.gespraechSchliessen()],
        ['Anderes Rezept', () => this.aussuchen(null)],
      ]);
      return;
    }
    this.kochen();
  }

  // Das Kochbuch: alle Rezepte nebeneinander, mit ihren Zutaten und was sie
  // im Kampf bewirken. Rezepte, die man noch nicht gefunden hat, stehen als
  // „???“ da, mit einem Hinweis, wo man suchen muss.
  kochbuchZeigen() {
    const { szene, daten } = this;
    const rezepte = daten.rezepte;
    const proReihe = Math.min(3, rezepte.length);
    const reihen = Math.ceil(rezepte.length / proReihe);
    const breite = 340;
    const hoehe = 236;
    const teile = [
      szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(szene, 50, 20, BREITE - 100, 680),
      szene.add.text(BREITE / 2, 58, `Kochbuch · ${daten.frage}`, schrift(32, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
    ];
    rezepte.forEach((rezept, nummer) => {
      const reihe = Math.floor(nummer / proReihe);
      const x = BREITE / 2 + ((nummer % proReihe) - (proReihe - 1) / 2) * (breite + 20);
      const y = 210 + reihe * (hoehe + 14) - (reihen - 2) * 60;
      const oben = y - hoehe / 2;
      const bekannt = rezeptBekannt(rezept);
      const karte = szene.add.rectangle(x, y, breite, hoehe, FARBEN.knopf, bekannt ? 1 : 0.5).setRounded(18).setStrokeStyle(3, FARBEN.rand);
      const bild = szene.add.image(x - breite / 2 + 70, oben + 74, rezept.bild);
      bild.setScale(Math.min(100 / bild.height, 110 / bild.width));
      teile.push(karte, bild);
      if (!bekannt) {
        bild.setTint(0x120a24).setTintMode(Phaser.TintModes.FILL).setAlpha(0.8);
        teile.push(
          szene.add.text(x + 50, oben + 50, '???', schrift(34, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
          szene.add
            .text(x + 50, oben + 100, `Dieses Rezept liegt irgendwo: ${ORTE[rezept.fundort.ort].name}`, schrift(17, '#d9c9ff', { wordWrap: { width: 190 }, align: 'center' }))
            .setOrigin(0.5, 0),
        );
        return;
      }
      karte.setInteractive({ useHandCursor: true });
      karte.on('pointerover', () => karte.setStrokeStyle(5, 0xffffff));
      karte.on('pointerout', () => karte.setStrokeStyle(3, FARBEN.rand));
      karte.on('pointerdown', () => this.aussuchen(rezept));
      teile.push(szene.add.text(x + 50, oben + 30, rezept.name, schrift(22, '#f6f0ff', { fontStyle: '600', wordWrap: { width: 200 }, align: 'center' })).setOrigin(0.5, 0));
      // Die Zutaten als kleine Bilder. Was man schon hat, leuchtet, der Rest ist blass.
      rezept.zutaten.forEach((art, stelle) => {
        const zutat = zutatInfo(art);
        const klein = szene.add.image(x - 30 + stelle * 50, oben + 112, zutat.bild).setAlpha(zutat.woher === 'kueche' || anzahl(art) > 0 ? 1 : 0.4);
        klein.setScale(40 / Math.max(klein.height, klein.width));
        teile.push(klein);
      });
      teile.push(
        szene.add.text(x, oben + 150, rezept.info, schrift(16, '#d9c9ff', { wordWrap: { width: breite - 30 }, align: 'center' })).setOrigin(0.5, 0),
      );
    });
    teile.push(...textKnopf(szene, BREITE / 2 - 120, 630, 240, 54, 'Nichts kochen', () => szene.gespraechSchliessen()));
    szene.festkleben(teile, VORNE + 100);
    szene.gespraech = teile;
  }

  aussuchen(rezept) {
    this.szene.gespraechSchliessen();
    if (rezept && Date.now() - (spielstand.gekochtAm[rezept.name] ?? 0) < this.daten.wiederNachSekunden * 1000) {
      this.sagen(this.daten.nochZuFrueh, [['Okay', () => this.szene.gespraechSchliessen()]]);
      return;
    }
    this.rezept = rezept;
    this.gesammelt.clear();
    this.zettelZeigen();
    if (rezept) this.schweben(this.daten.herd, `${rezept.name}: Sammle die Zutaten ein!`);
  }

  // Die Zutaten fliegen in den Topf, dann wird umgerührt.
  kochen() {
    const { szene, daten } = this;
    this.kocht = true;
    const { topf } = daten.herd;
    // Was draußen gewachsen ist oder vorher gekocht wurde, kommt aus dem Beutel.
    for (const art of this.rezept.zutaten) if (zutatInfo(art).woher !== 'kueche') herausnehmen(art);
    this.rezept.zutaten.forEach((art, nummer) => {
      const zutat = zutatInfo(art);
      const bild = szene.add.image(szene.spieler.ort.x, szene.spieler.ort.y - 120, zutat.bild).setDepth(VORNE - 5);
      bild.setScale(60 / Math.max(bild.height, bild.width));
      szene.tweens.add({
        targets: bild,
        x: topf.x,
        y: topf.y - 30,
        angle: 360,
        scale: bild.scale * 0.5,
        delay: nummer * 350,
        duration: 600,
        ease: 'Sine.easeIn',
        onComplete: () => {
          bild.destroy();
          plopp(0.7 + nummer * 0.15);
          this.dampf(0xfff3c4, 0.8);
        },
      });
    });
    szene.time.delayedCall(this.rezept.zutaten.length * 350 + 700, () => this.umruehren(0));
  }

  umruehren(wieOft) {
    const { szene, daten } = this;
    szene.gespraechSchliessen();
    if (wieOft >= UMRUEHREN) {
      this.fertig();
      return;
    }
    const text = wieOft === 0 ? daten.umruehren : `Weiter rühren! (${wieOft} von ${UMRUEHREN})`;
    this.sagen(text, [
      [
        'Umrühren!',
        () => {
          this.wirbel();
          this.umruehren(wieOft + 1);
        },
      ],
    ]);
  }

  // Ein Wirbel im Topf, mit Blubberblasen
  wirbel() {
    const { szene } = this;
    const { topf } = this.daten.herd;
    const ring = szene.add.ellipse(topf.x, topf.y - 20, 110, 30).setStrokeStyle(5, 0xd9c9ff, 0.9).setDepth(VORNE - 5);
    szene.tweens.add({ targets: ring, scaleX: 0.3, angle: 180, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
    for (let i = 0; i < 4; i += 1) {
      szene.time.delayedCall(i * 90, () => {
        plopp(1 + Math.random());
        this.dampf([0xd9c9ff, 0xffd6f0, 0x8ef0ff][i % 3], 0.7);
      });
    }
  }

  // Das Essen ist fertig: Es springt aus dem Topf und kommt in den Beutel.
  fertig() {
    const { szene } = this;
    const rezept = this.rezept;
    const { topf } = this.daten.herd;
    spielstand.gekochtAm[rezept.name] = Date.now();
    melodieSpielen('gefangen');
    sternchen();
    const kamera = szene.cameras.main;
    const essen = szene.add.image(topf.x, topf.y - 40, rezept.bild).setDepth(VORNE - 4).setScale(0.2);
    const schein = lichtschein(szene, kamera.midPoint.x, kamera.midPoint.y - 80, 380, 380, 0xfff3c4).setAlpha(0).setDepth(VORNE - 5);
    szene.tweens.add({ targets: essen, x: kamera.midPoint.x, y: kamera.midPoint.y - 80, scale: 1.1, duration: 800, ease: 'Back.easeOut' });
    szene.tweens.add({ targets: schein, alpha: 0.8, duration: 800 });

    einpacken(rezept.kurzname);
    szene.time.delayedCall(900, () => {
      vorlesen(rezept.satz);
      this.sagen(rezept.satz, [
        [
          'Ab in den Beutel!',
          () => {
            szene.gespraechSchliessen();
            // Das Essen fliegt oben links in den Beutel.
            const beutel = szene.beutelOrt();
            szene.tweens.add({ targets: schein, alpha: 0, duration: 400, onComplete: () => schein.destroy() });
            szene.tweens.add({
              targets: essen,
              x: beutel.x,
              y: beutel.y,
              scale: 0.15,
              duration: 600,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                essen.destroy();
                szene.beutelHuepfen();
              },
            });
            this.rezept = null;
            this.gesammelt.clear();
            this.zettelZeigen();
            this.kocht = false;
          },
        ],
      ]);
    });
  }

  // ---------------------------------------------------------------- Helfer

  sagen(text, knoepfe) {
    this.szene.gespraechSchliessen();
    this.szene.gespraechZeigen(text, knoepfe);
  }

  schweben(punkt, text) {
    const schild = this.szene.add
      .text(punkt.x, punkt.y - 100, text, schrift(24, '#fff3c4', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#3a2410', 6)
      .setDepth(VORNE - 1);
    this.szene.tweens.add({ targets: schild, y: schild.y - 50, alpha: 0, delay: 600, duration: 1400, onComplete: () => schild.destroy() });
  }
}
