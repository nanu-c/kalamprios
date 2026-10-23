// Das alte Bootshaus am Mondsee: Hier hat ein alter Fischer früher Boote
// repariert und an Maschinen für den See getüftelt. Auf seiner Werkbank
// liegen noch die Baupläne für verrückte Maschinen. Jede Maschine
// ist halbfertig. Man setzt die fehlenden Teile ein und drückt auf „Los!“.
// Dann rollt eine Kugel los, und ein Teil stößt das nächste an, bis am Ende
// etwas Schönes passiert. Fehlt ein Teil oder ist es das falsche, plumpst
// die Kugel herunter. Was man einstellen kann, steht bei werkbank in
// daten/orte/mondsee.js.

import { einpacken } from '../beutel.js';
import { aufprallen, klick, landen, plopp, sternchen, wusch } from '../klang/geraeusche.js';
import { melodieSpielen } from '../klang/musik.js';
import { spielstand } from '../spielstand.js';
import { abstand } from '../welt/weltlogik.js';
import { belohnungZeigen } from './animationen.js';
import { feld, textKnopf } from './bausteine.js';
import { BREITE, FARBEN, HOEHE, schrift } from './stil.js';

const VORNE = 100000; // wie in WeltSzene.js
const TIEFE = VORNE + 100;
const NAH = 110;
const HOLZ = 0xb07a4a;
const STRICH = 0x1a1035;
const BODEN_Y = 560; // so tief fällt eine Kugel, die herunterplumpst

// Die Bauteile: wie sie heißen und was passiert, wenn eins an der falschen Stelle ist.
export const BAUTEILE = {
  rampe: { name: 'Rampe' },
  wippe: { name: 'Wippe' },
  domino: { name: 'Dominosteine' },
  feder: { name: 'Sprungfeder' },
  trichter: { name: 'Trichter' },
  kissen: { name: 'Kissen', falsch: 'Plumps! Die Kugel landet weich im Kissen und bleibt einfach liegen.' },
  loeffel: { name: 'Löffel', falsch: 'Der Löffel wackelt nur ein bisschen. Das reicht nicht!' },
};

// Wo bei jedem Bauteil die Kugel hineinkommt und wo sie wieder herauskommt
// (von der Mitte des Teils aus gezählt).
const WEGE = {
  rampe: { rein: { x: -110, y: -45 }, raus: { x: 110, y: 45 } },
  wippe: { rein: { x: -88, y: -22 }, raus: { x: 88, y: -30 } },
  domino: { rein: { x: -85, y: -14 }, raus: { x: 90, y: -14 } },
  feder: { rein: { x: 0, y: -40 }, raus: { x: 0, y: -40 } },
  trichter: { rein: { x: 0, y: -48 }, raus: { x: 0, y: 52 } },
};

// ------------------------------------------------------------ Malen

// Malt ein Bauteil in einen Container (Mitte bei 0, 0). Zurück kommen die
// Teile, die sich bewegen können.
function teilMalen(szene, art, behaelter) {
  const g = szene.add.graphics();
  behaelter.add(g);
  const brett = (x1, y1, x2, y2, dicke = 14) => {
    g.lineStyle(dicke + 6, STRICH);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(dicke, HOLZ);
    g.lineBetween(x1, y1, x2, y2);
  };
  switch (art) {
    case 'rampe':
      brett(-110, -30, 110, 60);
      g.fillStyle(0x8a5a2a).fillRect(-100, -22, 10, 90).fillRect(90, 66, 10, 20);
      return {};
    case 'wippe': {
      g.fillStyle(0x8f9bb8).fillTriangle(-22, 34, 22, 34, 0, 0);
      g.lineStyle(3, STRICH).strokeTriangle(-22, 34, 22, 34, 0, 0);
      const brettTeil = szene.add.graphics();
      brettTeil.lineStyle(18, STRICH).lineBetween(-100, 0, 100, 0);
      brettTeil.lineStyle(12, HOLZ).lineBetween(-100, 0, 100, 0);
      const wippBrett = szene.add.container(0, 0, [brettTeil]);
      behaelter.add(wippBrett);
      return { brett: wippBrett };
    }
    case 'domino': {
      const steine = [];
      for (let i = 0; i < 4; i += 1) {
        const stein = szene.add.graphics();
        stein.fillStyle(0xf6f0ff).fillRoundedRect(-7, -48, 14, 48, 3);
        stein.lineStyle(3, STRICH).strokeRoundedRect(-7, -48, 14, 48, 3);
        stein.fillStyle(STRICH).fillCircle(0, -36, 2.5).fillCircle(0, -14, 2.5);
        const halter = szene.add.container(-55 + i * 38, 10, [stein]);
        behaelter.add(halter);
        steine.push(halter);
      }
      g.lineStyle(4, 0x8a5a2a).lineBetween(-80, 12, 90, 12);
      return { steine };
    }
    case 'feder': {
      const feder = szene.add.graphics();
      feder.lineStyle(5, 0x8f9bb8);
      feder.beginPath();
      feder.moveTo(0, 30);
      for (let i = 1; i <= 8; i += 1) feder.lineTo(i % 2 ? -18 : 18, 30 - i * 7);
      feder.lineTo(0, -28);
      feder.strokePath();
      feder.fillStyle(0xc84a3a).fillRoundedRect(-26, -34, 52, 10, 4);
      feder.lineStyle(3, STRICH).strokeRoundedRect(-26, -34, 52, 10, 4);
      const halter = szene.add.container(0, 30, [feder]);
      feder.setY(-30);
      behaelter.add(halter);
      g.fillStyle(0x5a3a2a).fillRect(-30, 30, 60, 10);
      return { feder: halter };
    }
    case 'trichter':
      g.fillStyle(0xd8a040).fillPoints([{ x: -40, y: -45 }, { x: 40, y: -45 }, { x: 10, y: 20 }, { x: 10, y: 45 }, { x: -10, y: 45 }, { x: -10, y: 20 }], true);
      g.lineStyle(4, STRICH).strokePoints([{ x: -40, y: -45 }, { x: 40, y: -45 }, { x: 10, y: 20 }, { x: 10, y: 45 }, { x: -10, y: 45 }, { x: -10, y: 20 }], true);
      return {};
    case 'kissen':
      g.fillStyle(0xff9ad5).fillRoundedRect(-50, -20, 100, 40, 18);
      g.lineStyle(4, STRICH).strokeRoundedRect(-50, -20, 100, 40, 18);
      return {};
    case 'loeffel':
      g.fillStyle(0xc8c8d8).fillEllipse(-36, 0, 40, 24).fillRect(-16, -4, 70, 8);
      g.lineStyle(3, STRICH).strokeEllipse(-36, 0, 40, 24);
      return {};
    default:
      return {};
  }
}

// ------------------------------------------------------------ Werkbank

export class Werkbank {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.werkbank;
    this.warDa = false;
    const { x, y } = this.daten;
    // Das Bootshaus (gemalt mit werkzeuge/sachen_malen.py). Man steht davor,
    // dort ist die Werkbank.
    this.bild = szene.add.image(x, y, 'bootshaus').setOrigin(0.5, 0.95).setDepth(y);
    this.bild.setScale(300 / this.bild.height);
    szene.hindernisse.push(...[-90, 0, 90].map((dx) => ({ x: x + dx, y: y - 40, radius: 55 })));
    this.vorne = { x, y: y + 40 };
    szene.add
      .text(x, y - 320, 'Altes Bootshaus', schrift(19, '#ffffff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setPadding(10, 6)
      .setBackgroundColor('#5a3a2a')
      .setDepth(y);
  }

  fertig(nummer) {
    return spielstand.questFertig[`erfindung-${nummer}`] === true;
  }

  pruefen() {
    const da = abstand(this.szene.spieler.ort, this.vorne) < NAH;
    if (da && !this.warDa && !this.szene.gespraech) this.sprechen();
    this.warDa = da;
  }

  // Welche Baupläne es gibt: die geschafften und der nächste.
  sprechen() {
    const szene = this.szene;
    const erfindungen = this.daten.erfindungen;
    const naechste = erfindungen.findIndex((_, nummer) => !this.fertig(nummer));
    const knoepfe = [];
    if (naechste >= 0) knoepfe.push(['Bauen!', () => this.bauen(naechste)]);
    else knoepfe.push(['Nochmal', () => this.bauen(0)]);
    knoepfe.push(['Tschüss', () => szene.gespraechSchliessen()]);
    const geschafft = erfindungen.filter((_, nummer) => this.fertig(nummer)).length;
    const satz =
      naechste < 0
        ? this.daten.alleFertig
        : `${geschafft === 0 ? this.daten.satz : ''}${geschafft === 0 ? '\n' : ''}Bauplan ${naechste + 1} von ${erfindungen.length}: ${erfindungen[naechste].name}`;
    szene.gespraechZeigen(satz, knoepfe);
  }

  bauen(nummer) {
    this.szene.gespraechSchliessen();
    new Erfindung(this, nummer);
  }
}

// ------------------------------------------------------------ Eine Erfindung bauen

class Erfindung {
  constructor(werkbank, nummer) {
    this.werkbank = werkbank;
    this.szene = werkbank.szene;
    this.nummer = nummer;
    this.daten = werkbank.daten.erfindungen[nummer];
    this.slots = this.daten.schritte.map((schritt, index) => ({ schritt, index })).filter(({ schritt }) => schritt.slot);
    this.belegt = new Map(); // Nummer des Schritts -> Nummer des Bauteils in der Kiste
    this.gewaehlt = null; // welches Bauteil aus der Kiste gerade angetippt ist
    this.laeuft = false;
    this.fensterBauen();
  }

  add(teil) {
    teil.setScrollFactor?.(0);
    teil.setDepth?.(TIEFE + 1);
    this.teile.push(teil);
    return teil;
  }

  fensterBauen() {
    const szene = this.szene;
    szene.laufziel = null;
    szene.zeigerFuehrt = false;
    this.teile = [];
    this.add(szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive());
    this.add(feld(szene, 60, 30, BREITE - 120, 660));
    // Papier wie ein Bauplan: hellblau mit Kästchen
    const papier = this.add(szene.add.graphics());
    papier.fillStyle(0x2a4a7a).fillRoundedRect(90, 90, BREITE - 180, 470, 14);
    papier.lineStyle(1, 0x5a7aaa, 0.5);
    for (let x = 110; x < BREITE - 90; x += 30) papier.lineBetween(x, 92, x, 558);
    for (let y = 110; y < 560; y += 30) papier.lineBetween(92, y, BREITE - 92, y);
    this.add(szene.add.text(BREITE / 2, 62, this.daten.name, schrift(30, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5));
    this.meldung = this.add(szene.add.text(BREITE / 2, 110, this.daten.aufgabe, schrift(19, '#d9e8ff', { align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5, 0));

    // Der Halter oben, in dem die Kugel wartet
    const { start } = this.daten;
    const halter = this.add(szene.add.graphics());
    halter.fillStyle(0x8a5a2a).fillRect(start.x - 30, start.y + 14, 60, 10).fillRect(start.x - 34, start.y - 10, 8, 30);
    this.kugel = this.add(szene.add.circle(start.x, start.y, 13, 0xffd166).setStrokeStyle(3, STRICH));
    this.kugel.setDepth(TIEFE + 5);

    // Die festen Teile und die leeren Plätze
    this.platzTeile = new Map();
    this.daten.schritte.forEach((schritt, index) => {
      if (schritt.ziel) {
        this.ziel = this.zielBauen(schritt);
        return;
      }
      if (!schritt.slot) {
        this.teilAufstellen(index, schritt.teil);
        return;
      }
      const rahmen = this.add(szene.add.rectangle(schritt.x, schritt.y + 10, 200, 120).setStrokeStyle(3, 0xd9e8ff, 0.8).setFillStyle(0xffffff, 0.06).setInteractive({ useHandCursor: true }));
      const fragezeichen = this.add(szene.add.text(schritt.x, schritt.y + 10, '?', schrift(46, '#d9e8ff')).setOrigin(0.5).setAlpha(0.6));
      rahmen.on('pointerdown', () => this.platzAngetippt(index));
      this.platzTeile.set(index, { rahmen, fragezeichen });
    });

    // Die Kiste mit den Bauteilen
    this.kiste = this.daten.teile.map((art, nummer) => {
      const x = BREITE / 2 + (nummer - (this.daten.teile.length - 1) / 2) * 150;
      const karte = this.add(szene.add.rectangle(x, 610, 136, 70, FARBEN.knopf).setRounded(12).setStrokeStyle(3, FARBEN.rand).setInteractive({ useHandCursor: true }));
      const bild = this.add(szene.add.container(x, 600));
      teilMalen(szene, art, bild);
      bild.setScale(0.32);
      const name = this.add(szene.add.text(x, 634, BAUTEILE[art].name, schrift(15)).setOrigin(0.5));
      karte.on('pointerdown', () => this.kisteAngetippt(nummer));
      return { art, karte, bild, name };
    });

    const los = textKnopf(szene, BREITE - 300, 645, 200, 38, 'Los!', () => this.laufen());
    const zurueck = textKnopf(szene, 100, 645, 200, 38, 'Zurück', () => this.schliessen());
    for (const teil of [...los, ...zurueck]) this.add(teil);
    los[1].setFontSize(22);
    zurueck[1].setFontSize(22);
    szene.gespraech = this.teile;
    this.kisteZeigen();
  }

  // Ein Bauteil, das an seinem Platz steht (fest oder eingesetzt).
  teilAufstellen(index, art) {
    const schritt = this.daten.schritte[index];
    const behaelter = this.add(this.szene.add.container(schritt.x, schritt.y));
    const bewegliche = teilMalen(this.szene, art, behaelter);
    if (art === 'rampe' && schritt.gespiegelt) behaelter.setScale(-1, 1);
    return { behaelter, bewegliche, art };
  }

  zielBauen(schritt) {
    const szene = this.szene;
    const ziel = { schritt, teile: [] };
    if (schritt.ziel === 'baum') {
      ziel.baum = this.add(szene.add.image(schritt.x, schritt.y, 'baum-rund').setOrigin(0.5, 1));
      ziel.baum.setScale(240 / ziel.baum.height);
      ziel.beeren = [0, 1, 2, 3, 4].map((i) => this.add(szene.add.circle(schritt.x - 50 + i * 25, schritt.y - 150 + (i % 2) * 30, 9, 0x8a5be0).setStrokeStyle(2, STRICH)));
      ziel.korb = this.add(szene.add.rectangle(schritt.x + 10, schritt.y + 4, 90, 30, 0xc8964a).setStrokeStyle(3, STRICH));
    } else if (schritt.ziel === 'eimer') {
      this.add(szene.add.rectangle(schritt.x, schritt.y + 20, 120, 12, 0x8a5a2a));
      ziel.eimer = this.add(szene.add.container(schritt.x, schritt.y));
      const g = szene.add.graphics();
      g.fillStyle(0x8f9bb8).fillPoints([{ x: -26, y: -40 }, { x: 26, y: -40 }, { x: 20, y: 14 }, { x: -20, y: 14 }], true);
      g.lineStyle(3, STRICH).strokePoints([{ x: -26, y: -40 }, { x: 26, y: -40 }, { x: 20, y: 14 }, { x: -20, y: 14 }], true);
      g.fillStyle(0x6ab0ff).fillRect(-22, -36, 44, 10);
      ziel.eimer.add(g);
      ziel.seerose = this.add(szene.add.image(schritt.x + 90, BODEN_Y - 10, 'seerosenblatt'));
      ziel.seerose.setScale(80 / ziel.seerose.width);
      ziel.bluete = this.add(szene.add.circle(schritt.x + 90, BODEN_Y - 22, 6, 0xff9ad5).setStrokeStyle(2, STRICH));
    } else {
      // futter: eine Klappe über dem Wasser, darin Fischfutter
      ziel.wasser = this.add(szene.add.rectangle(schritt.x + 40, BODEN_Y - 20, 260, 36, 0x2a6ab0, 0.8));
      ziel.klappe = this.add(szene.add.rectangle(schritt.x, schritt.y, 90, 14, HOLZ).setStrokeStyle(3, STRICH).setOrigin(0, 0.5));
      ziel.sack = this.add(szene.add.rectangle(schritt.x + 45, schritt.y - 26, 50, 40, 0xe8d4a8).setStrokeStyle(3, STRICH));
    }
    return ziel;
  }

  kisteZeigen() {
    const imPlatz = new Set(this.belegt.values());
    for (const [nummer, eintrag] of this.kiste.entries()) {
      const weg = imPlatz.has(nummer);
      eintrag.karte.setAlpha(weg ? 0.3 : 1).setStrokeStyle(this.gewaehlt === nummer ? 5 : 3, this.gewaehlt === nummer ? 0xffd166 : FARBEN.rand);
      eintrag.bild.setAlpha(weg ? 0.3 : 1);
      eintrag.name.setAlpha(weg ? 0.3 : 1);
    }
  }

  kisteAngetippt(nummer) {
    if (this.laeuft) return;
    klick();
    if ([...this.belegt.values()].includes(nummer)) return;
    this.gewaehlt = this.gewaehlt === nummer ? null : nummer;
    this.kisteZeigen();
  }

  // Ein Platz in der Maschine: Ist ein Bauteil gewählt, kommt es hinein.
  // Steht schon eins drin, kommt es zurück in die Kiste.
  platzAngetippt(index) {
    if (this.laeuft) return;
    const platz = this.platzTeile.get(index);
    if (platz.eingesetzt) {
      platz.eingesetzt.behaelter.destroy();
      platz.eingesetzt = null;
      this.belegt.delete(index);
    }
    if (this.gewaehlt !== null) {
      plopp();
      this.belegt.set(index, this.gewaehlt);
      platz.eingesetzt = this.teilAufstellen(index, this.kiste[this.gewaehlt].art);
      this.gewaehlt = null;
    }
    platz.fragezeichen.setVisible(!platz.eingesetzt);
    this.kisteZeigen();
  }

  // --------------------------------------------------------- Los!

  sagen(text) {
    this.meldung.setText(text);
  }

  bewegen(einstellungen) {
    return new Promise((fertig) => this.szene.tweens.add({ ...einstellungen, onComplete: fertig }));
  }

  warten(ms) {
    return new Promise((fertig) => this.szene.time.delayedCall(ms, fertig));
  }

  // Die Kugel fliegt oder rollt von einem Punkt zum nächsten. Geht es nach
  // oben, fliegt sie im Bogen.
  flug(von, nach, dauer = 450) {
    const hoch = nach.y < von.y ? von.y - nach.y + 70 : 25;
    return this.bewegen({
      targets: { t: 0 },
      t: 1,
      duration: dauer,
      onUpdate: (tween, { t }) => this.kugel.setPosition(von.x + (nach.x - von.x) * t, von.y + (nach.y - von.y) * t - Math.sin(t * Math.PI) * hoch),
    });
  }

  punkt(schritt, seite) {
    const weg = WEGE[schritt.teil][seite];
    const spiegeln = schritt.gespiegelt ? -1 : 1;
    return { x: schritt.x + weg.x * spiegeln, y: schritt.y + weg.y };
  }

  async laufen() {
    if (this.laeuft) return;
    this.laeuft = true;
    this.gewaehlt = null;
    this.kisteZeigen();
    this.sagen('Los geht’s!');
    wusch(0.2);
    let hier = { x: this.daten.start.x, y: this.daten.start.y };
    this.kugel.setPosition(hier.x, hier.y).setVisible(true);
    for (const [index, schritt] of this.daten.schritte.entries()) {
      if (schritt.ziel) {
        await this.flug(hier, { x: schritt.x - 40, y: schritt.y - 30 });
        await this.zielErreicht();
        return;
      }
      const rein = this.punkt(schritt, 'rein');
      await this.flug(hier, rein);
      const art = schritt.slot ? this.kiste[this.belegt.get(index)]?.art : schritt.teil;
      const stehtDa = schritt.slot ? this.platzTeile.get(index).eingesetzt : null;
      if (!art || art !== schritt.teil) {
        await this.plumps(art);
        return;
      }
      hier = await this.teilBewegt(schritt, stehtDa?.bewegliche ?? {});
    }
  }

  // Jedes Bauteil bewegt sich auf seine Art und gibt die Kugel weiter.
  async teilBewegt(schritt, bewegliche) {
    const raus = this.punkt(schritt, 'raus');
    switch (schritt.teil) {
      case 'rampe':
        await this.bewegen({ targets: this.kugel, x: raus.x, y: raus.y, duration: 520, ease: 'Quad.easeIn' });
        break;
      case 'wippe':
        landen();
        if (bewegliche.brett) await this.bewegen({ targets: bewegliche.brett, angle: -14, duration: 160, ease: 'Back.easeOut' });
        this.kugel.setPosition(raus.x, raus.y);
        break;
      case 'domino':
        for (const stein of bewegliche.steine ?? []) {
          aufprallen();
          await this.bewegen({ targets: stein, angle: 70, duration: 130, ease: 'Quad.easeIn' });
        }
        this.kugel.setPosition(raus.x, raus.y);
        break;
      case 'feder':
        if (bewegliche.feder) {
          await this.bewegen({ targets: bewegliche.feder, scaleY: 0.5, duration: 160 });
          wusch(0.3, true);
          this.bewegen({ targets: bewegliche.feder, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
        }
        break;
      case 'trichter':
        await this.bewegen({ targets: this.kugel, x: raus.x, y: raus.y, duration: 400, ease: 'Quad.easeIn' });
        break;
      default:
    }
    return raus;
  }

  // Das falsche Teil oder gar keins: Die Kugel plumpst herunter.
  async plumps(art) {
    aufprallen();
    await this.bewegen({ targets: this.kugel, y: BODEN_Y, duration: 500, ease: 'Bounce.easeOut' });
    let satz = 'Plumps! Hier fehlt noch etwas.';
    if (art && BAUTEILE[art].falsch) satz = BAUTEILE[art].falsch;
    else if (art) satz = `Hmm, ${BAUTEILE[art].name === 'Dominosteine' ? 'die Dominosteine passen' : `die ${BAUTEILE[art].name} passt`} hier nicht. Die Kugel fällt daneben.`;
    this.sagen(`${satz} Versuch es noch einmal!`);
    await this.warten(900);
    this.zuruecksetzen();
  }

  // Alles wieder an den Anfang: Kugel in den Halter, Wippen und Dominos zurück.
  zuruecksetzen() {
    this.kugel.setPosition(this.daten.start.x, this.daten.start.y);
    for (const platz of this.platzTeile.values()) {
      const beweglich = platz.eingesetzt?.bewegliche ?? {};
      beweglich.brett?.setAngle(0);
      for (const stein of beweglich.steine ?? []) stein.setAngle(0);
    }
    this.laeuft = false;
  }

  async zielErreicht() {
    const szene = this.szene;
    const ziel = this.ziel;
    const { schritt } = ziel;
    this.kugel.setVisible(false);
    if (schritt.ziel === 'baum') {
      await this.bewegen({ targets: ziel.baum, angle: 5, duration: 90, yoyo: true, repeat: 3 });
      for (const beere of ziel.beeren) this.bewegen({ targets: beere, x: ziel.korb.x - 30 + Math.random() * 60, y: ziel.korb.y - 10, duration: 500 + Math.random() * 300, ease: 'Bounce.easeOut' });
      plopp(1.3);
    } else if (schritt.ziel === 'eimer') {
      await this.bewegen({ targets: ziel.eimer, angle: 100, duration: 400, ease: 'Back.easeOut' });
      for (let i = 0; i < 12; i += 1) {
        const tropfen = this.add(szene.add.circle(schritt.x + 30, schritt.y - 10, 5, 0x8ec8ff));
        this.bewegen({ targets: tropfen, x: ziel.seerose.x + (Math.random() - 0.5) * 40, y: ziel.seerose.y, alpha: 0.2, duration: 500, delay: i * 50 });
      }
      await this.warten(700);
      await this.bewegen({ targets: ziel.bluete, scale: 4, duration: 500, ease: 'Back.easeOut' });
    } else {
      await this.bewegen({ targets: ziel.klappe, angle: 70, duration: 300 });
      for (let i = 0; i < 14; i += 1) {
        const krume = this.add(szene.add.circle(schritt.x + 45 + (Math.random() - 0.5) * 30, schritt.y, 4, 0xd8a040));
        this.bewegen({ targets: krume, y: BODEN_Y - 20, duration: 500 + Math.random() * 300, delay: i * 40 });
      }
      await this.warten(700);
      const fisch = this.add(szene.add.image(schritt.x - 20, BODEN_Y, 'mondfisch'));
      fisch.setScale(80 / fisch.width);
      await this.bewegen({
        targets: { t: 0 },
        t: 1,
        duration: 900,
        onUpdate: (tween, { t }) => fisch.setPosition(schritt.x - 20 + 140 * t, BODEN_Y - Math.sin(t * Math.PI) * 140).setAngle(-40 + 80 * t),
      });
    }
    sternchen();
    melodieSpielen('gefangen');
    this.sagen(this.daten.geschafft);
    await this.warten(1800);
    this.belohnen();
  }

  belohnen() {
    const szene = this.szene;
    const schonFertig = this.werkbank.fertig(this.nummer);
    spielstand.questFertig[`erfindung-${this.nummer}`] = true;
    this.schliessen();
    if (schonFertig) return;
    const { belohnung } = this.daten;
    if (belohnung.fangkristalle) spielstand.fangkristalle += belohnung.fangkristalle;
    if (belohnung.sache) einpacken(belohnung.sache, belohnung.anzahl ?? 1);
    belohnungZeigen(szene, this.werkbank.daten, { bild: belohnung.bild, anzahl: belohnung.anzahl ?? belohnung.fangkristalle ?? 1, text: belohnung.text });
    szene.beutelHuepfen?.();
  }

  schliessen() {
    for (const teil of this.teile) teil.destroy();
    this.teile = [];
    if (this.szene.gespraech) this.szene.gespraech = null;
  }
}
