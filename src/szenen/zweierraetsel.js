// Die Rätsel hinter dem Freundschaftstor. Man kann sie wirklich nur zu zweit
// lösen. Was man einstellen kann, steht in der Datei des Ortes bei raetsel.
//
//   zuZweit (Sternenwolke): In jeder Runde leuchten zwei Sternplatten auf,
//     weit auseinander. Erst wenn auf beiden gleichzeitig jemand steht, ist
//     die Runde geschafft.
//   fluestern (Mondblütental): Nur eine sieht, in welcher Reihenfolge die
//     Mondblüten leuchten. Die andere muss darüberlaufen. Ihr müsst also
//     miteinander reden! Jede Runde wird getauscht.
//   tor (Garten der Mondrosen): Das Rosentor ist nur offen, solange jemand
//     auf dem Mondstein steht. Eine hält es offen, die andere holt den Mondtau.
//
// Beide Geräte sehen, wo die andere steht (zuZweit.js). Merkt eines, dass
// eine Runde geschafft ist, sagt es das dem anderen.

import Phaser from 'phaser';
import { klangstein, pling, rumpeln, sternchen } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { abstand, reihenfolgeTreten, reihenfolgeWuerfeln } from '../welt/weltlogik.js';
import { hoeren, senden, zuZweit } from '../zusammen/verbindung.js';
import { GrundRaetsel, platteMalen } from './geheimraetsel.js';
import { lichtschein } from './landschaft.js';
import { NACHTBLUMEN, nachtblumeMalen, rosenbuschMalen } from './nachtblumen.js';
import { wuerfel } from './raetsel.js';
import { schrift } from './stil.js';
import { partnerDa } from './zuZweit.js';

const AUF_DER_PLATTE = 50; // so nah muss man an der Mitte einer Platte stehen
const PLATTE = { breite: 120, hoehe: 76 };
const GOLD = 0xffd166;
const VORNE = 100000;

// Was alle Rätsel zu zweit gemeinsam haben: Fängt eine das Rätsel an (beim
// Rätselstein), fängt es auf dem anderen Gerät auch an. Und Nachrichten an
// das andere Gerät gelten nur für dasselbe Rätsel am selben Ort.
class RaetselZuZweit extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    this.aufhoeren = [];
    this.hoeren('zweierAnfang', () => {
      if (this.raetsel.angefangen) return;
      spielstand.raetselAngefangen[this.ortName] = true;
      this.anfangen(false);
    });
    this.szene.events.once('shutdown', () => this.aufhoeren.forEach((ab) => ab()));
  }

  // Hört auf eine Nachricht des anderen Geräts, die zu diesem Ort gehört.
  hoeren(typ, wasTun) {
    this.aufhoeren.push(hoeren(typ, (nachricht) => nachricht.ort === this.ortName && wasTun(nachricht)));
  }

  senden(typ, daten = {}) {
    senden(typ, { ...daten, ort: this.ortName });
  }

  anfangen(weitersagen = true) {
    if (weitersagen) this.senden('zweierAnfang');
  }

  // Wo die andere steht, wenn sie am selben Ort ist (sonst null).
  get partner() {
    const partner = partnerDa();
    return partner && partner.ort === this.ortName ? partner : null;
  }

  // Eine flache, gemalte Platte mit einem Schein darunter.
  platteBauen(punkt, farbe) {
    return {
      punkt,
      schein: lichtschein(this.szene, punkt.x, punkt.y, 230, 150, farbe).setDepth(-3).setAlpha(0.3),
      bild: this.szene.add.image(punkt.x, punkt.y, platteMalen(this.szene, farbe, PLATTE.breite, PLATTE.hoehe)).setDepth(-2),
    };
  }
}

// ------------------------------------------------------------ Sternplatten

class SternplattenRaetsel extends RaetselZuZweit {
  constructor(raetsel) {
    super(raetsel);
    const szene = this.szene;
    this.zusammen = 0; // wie lange beide schon gleichzeitig draufstehen
    this.runden = this.daten.runden;
    this.farbe = 0xffc8e8;
    this.platten = this.runden.map((paar) =>
      paar.map((punkt) => {
        const platte = this.platteBauen(punkt, this.farbe);
        platte.stern = szene.add.star(punkt.x, punkt.y - 4, 5, 9, 20, 0xffffff).setStrokeStyle(3, 0x2a1650).setDepth(-1);
        szene.tweens.add({ targets: platte.stern, angle: 360, duration: 6000, repeat: -1 });
        return platte;
      }),
    );
    // Hat die andere die Runde geschafft, ist sie auch hier geschafft.
    this.hoeren('zweierRunde', ({ runde }) => {
      if (runde <= this.runde || this.raetsel.geloest) return;
      spielstand.raetselAngefangen[this.ortName] = true;
      this.geschafft();
    });
    if (raetsel.geloest) this.geloestZeigen();
    else this.zeigen();
  }

  // Nur die Platten der Runde, die gerade dran ist, sind zu sehen.
  zeigen(an = []) {
    this.platten.forEach((paar, runde) => {
      paar.forEach((platte, nummer) => {
        const dran = runde === this.runde && this.raetsel.angefangen;
        for (const teil of [platte.bild, platte.stern]) teil.setVisible(dran);
        platte.schein.setVisible(dran).setAlpha(an.includes(nummer) ? 0.9 : 0.35);
        platte.stern.setFillStyle(an.includes(nummer) ? GOLD : 0xffffff);
      });
    });
  }

  anfangen(weitersagen = true) {
    super.anfangen(weitersagen);
    this.zeigen();
  }

  nochmal() {
    this.zeigen();
  }

  pruefen() {
    if (this.wartet) return;
    const paar = this.runden[this.runde];
    if (!paar) return;
    const ich = paar.findIndex((punkt) => abstand(this.spieler, punkt) < AUF_DER_PLATTE);
    const partner = this.partner;
    const sie = partner ? paar.findIndex((punkt) => abstand(partner, punkt) < AUF_DER_PLATTE) : -1;
    if (ich >= 0 && ich !== this.aufPlatz) klangstein(this.runde * 2 + ich);
    this.aufPlatz = ich;
    this.zeigen([ich, sie].filter((nummer) => nummer >= 0));

    if (ich >= 0 && sie >= 0 && ich !== sie) this.zusammen += 0.02;
    else this.zusammen = 0;
    if (this.zusammen < 0.4) return;
    this.zusammen = 0;
    this.senden('zweierRunde', { runde: this.runde + 1 });
    this.geschafft();
  }

  // Die Runde ist geschafft: Funken an beiden Platten, dann kommt die nächste.
  geschafft() {
    sternchen();
    for (const platte of this.platten[this.runde] ?? []) this.funken(platte.punkt.x, platte.punkt.y - 20, [GOLD, this.farbe, 0xffffff]);
    this.rundeGeschafft(this.runden.length, () => this.zeigen());
    if (!this.raetsel.geloest) this.zeigen();
  }

  // Gelöst: Alle Platten liegen golden da.
  geloestZeigen() {
    this.wartet = true;
    for (const platte of this.platten.flat()) {
      for (const teil of [platte.bild, platte.stern]) teil.setVisible(true);
      platte.stern.setFillStyle(GOLD);
      platte.schein.setVisible(true).setAlpha(0.5).setTint(GOLD);
    }
  }
}

// ------------------------------------------------------------ Blumenflüstern

class FluesternRaetsel extends RaetselZuZweit {
  constructor(raetsel) {
    super(raetsel);
    const szene = this.szene;
    this.anzahlRunden = this.daten.runden.length;
    this.geschafftTritte = 0;
    this.zeigtVor = null; // der Zeitgeber, der die Reihenfolge immer wieder zeigt
    this.blumen = this.daten.blumen.map((daten, nummer) => {
      const art = NACHTBLUMEN[daten.art] ? daten.art : 'mondwinde';
      const licht = NACHTBLUMEN[art].licht;
      const platte = this.platteBauen(daten, 0x6a5fb0);
      platte.licht = licht;
      platte.nummer = nummer;
      platte.blume = szene.add.image(daten.x, daten.y + 6, nachtblumeMalen(szene, art)).setOrigin(0.5, 0.96).setDepth(daten.y);
      platte.blume.setScale(165 / platte.blume.height);
      platte.groesse = platte.blume.scale;
      platte.glanz = lichtschein(szene, daten.x, daten.y - 90, 170, 170, licht).setDepth(daten.y + 1).setAlpha(0);
      platte.zahl = szene.add
        .text(daten.x, daten.y - 175, '', schrift(46, '#ffffff', { fontStyle: 'bold' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 9)
        .setDepth(VORNE - 3);
      return platte;
    });
    this.hoeren('fluesternRunde', ({ runde }) => {
      if (runde <= this.runde || this.raetsel.geloest) return;
      this.geschafft();
    });
    // Die andere tritt auf eine Blume: Das sieht man hier auch.
    this.hoeren('fluesternTritt', ({ nummer, ergebnis }) => {
      if (this.blumen[nummer]) this.aufleuchten(this.blumen[nummer], 500);
      if (ergebnis === 'falsch') this.falsch();
    });
    if (raetsel.geloest) this.geloestZeigen();
    else if (raetsel.angefangen) szene.time.delayedCall(800, () => this.rundeAnfangen());
  }

  // Wer in dieser Runde die Reihenfolge sieht: in den geraden Runden das
  // Gerät, das den Code gezeigt hat, in den ungeraden das andere.
  get ichSehe() {
    return (this.runde % 2 === 0) === zuZweit.gastgeberin;
  }

  // Die Reihenfolge der Runde. Beide Geräte würfeln sie mit demselben Würfel
  // (er fängt beim Code an), so kennen beide dieselbe.
  get folge() {
    const start = Number((zuZweit.code ?? [1]).join('')) * 7 + this.runde * 101 + 13;
    return reihenfolgeWuerfeln(this.blumen.length, this.daten.runden[this.runde], wuerfel(start));
  }

  anfangen(weitersagen = true) {
    super.anfangen(weitersagen);
    this.rundeAnfangen();
  }

  nochmal() {
    this.rundeAnfangen();
  }

  aufleuchten(platte, dauer) {
    klangstein(platte.nummer);
    platte.glanz.setAlpha(0.95);
    platte.schein.setAlpha(0.9).setTint(platte.licht);
    this.szene.tweens.add({ targets: platte.blume, scale: platte.groesse * 1.15, duration: 160, yoyo: true });
    this.szene.time.delayedCall(dauer, () => {
      if (this.raetsel.geloest) return;
      platte.glanz.setAlpha(0);
      platte.schein.setAlpha(0.3).clearTint();
    });
  }

  rundeAnfangen() {
    this.zeigtVor?.remove();
    this.zeigtVor = null;
    this.geschafftTritte = 0;
    for (const platte of this.blumen) platte.zahl.setText('');
    if (this.raetsel.geloest) return;
    const name = partnerDa()?.name;
    if (this.ichSehe) {
      this.schweben(this.daten, name ? `Nur du siehst die Reihenfolge! Sag sie ${name}.` : 'Nur du siehst die Reihenfolge! Sag sie der anderen.');
      this.vorzeigen();
    } else {
      this.schweben(this.daten, `Hör gut zu! ${name ?? 'Die andere'} sagt dir, auf welche Blumen du gehst.`);
    }
  }

  // Die Blumen leuchten nacheinander auf, mit großen Zahlen darüber. Danach
  // eine Pause, und dann noch einmal, bis die Runde geschafft ist.
  vorzeigen() {
    const folge = this.folge;
    const takt = 900;
    folge.forEach((nummer, schritt) => {
      this.szene.time.delayedCall(schritt * takt, () => {
        if (!this.ichSehe || this.raetsel.geloest) return;
        const platte = this.blumen[nummer];
        this.aufleuchten(platte, takt - 150);
        platte.zahl.setText(platte.zahl.text ? `${platte.zahl.text} ${schritt + 1}` : `${schritt + 1}`).setAlpha(1);
      });
    });
    this.zeigtVor = this.szene.time.delayedCall(folge.length * takt + 2600, () => {
      for (const platte of this.blumen) platte.zahl.setText('');
      if (this.ichSehe && !this.raetsel.geloest) this.vorzeigen();
    });
  }

  pruefen() {
    if (this.wartet) return;
    const nummer = this.treten(this.blumen.map((platte) => platte.punkt), 55);
    if (nummer < 0 || this.ichSehe) return;
    const { geschafft, ergebnis } = reihenfolgeTreten(this.geschafftTritte, nummer, this.folge);
    if (ergebnis === 'schon') return;
    this.geschafftTritte = geschafft;
    this.aufleuchten(this.blumen[nummer], 500);
    this.senden('fluesternTritt', { nummer, ergebnis });
    if (ergebnis === 'falsch') this.falsch();
    if (ergebnis === 'fertig') {
      this.senden('fluesternRunde', { runde: this.runde + 1 });
      this.geschafft();
    }
  }

  falsch() {
    this.geschafftTritte = 0;
    this.schweben(this.daten, 'Oh, falsche Blume! Noch einmal von vorn.');
  }

  geschafft() {
    sternchen();
    for (const platte of this.blumen) this.funken(platte.punkt.x, platte.punkt.y - 60, [platte.licht, GOLD, 0xffffff], 8);
    this.zeigtVor?.remove();
    this.rundeGeschafft(this.anzahlRunden, () => this.rundeAnfangen());
  }

  // Gelöst: Alle Mondblüten leuchten.
  geloestZeigen() {
    this.wartet = true;
    this.zeigtVor?.remove();
    for (const platte of this.blumen) {
      platte.zahl.setText('');
      platte.schein.setAlpha(0.6).setTint(platte.licht);
      platte.glanz.setAlpha(0.6);
      this.szene.tweens.add({ targets: platte.glanz, alpha: 0.95, duration: 900 + platte.nummer * 150, yoyo: true, repeat: -1 });
    }
  }
}

// ------------------------------------------------------------ Rosentor

const ROSEN_ABSTAND = 66; // so weit stehen die Rosenbüsche im Ring auseinander
const ROSEN_RADIUS = 38; // so dick ist ein Busch im Weg
const TOR_BUESCHE = 3; // so viele Büsche gehen beim Tor auf

class TorRaetsel extends RaetselZuZweit {
  constructor(raetsel) {
    super(raetsel);
    const szene = this.szene;
    const { blume, ring, platte, tor } = this.daten;
    this.offen = false;

    // Der Ring aus Rosenbüschen. Die Büsche beim Tor gehen auf und zu.
    const torWinkel = { rechts: 0, unten: Math.PI / 2, links: Math.PI, oben: -Math.PI / 2 }[tor] ?? Math.PI;
    const anzahl = Math.round((2 * Math.PI * ring) / ROSEN_ABSTAND);
    this.ring = [];
    this.tor = [];
    for (let i = 0; i < anzahl; i += 1) {
      const winkel = torWinkel + (i / anzahl) * Math.PI * 2;
      const punkt = { x: blume.x + Math.cos(winkel) * ring, y: blume.y + Math.sin(winkel) * ring * 0.75 };
      const amTor = i < Math.ceil(TOR_BUESCHE / 2) || i > anzahl - 1 - Math.floor(TOR_BUESCHE / 2);
      const bild = szene.add.image(punkt.x, punkt.y, rosenbuschMalen(szene)).setOrigin(0.5, 0.85).setDepth(punkt.y).setFlipX(i % 2 === 0);
      bild.setScale(100 / bild.height);
      const sperre = { x: punkt.x, y: punkt.y - 6, radius: ROSEN_RADIUS };
      (amTor ? this.tor : this.ring).push({ bild, sperre, punkt });
    }
    szene.hindernisse.push(...this.ring.map((busch) => busch.sperre), ...this.tor.map((busch) => busch.sperre));

    // Der Mondtau in der Mitte: ein leuchtender Tropfen, der schwebt.
    this.tauSchein = lichtschein(szene, blume.x, blume.y - 40, 220, 220, 0xcfe8ff).setDepth(blume.y + 1);
    this.tau = szene.add.circle(blume.x, blume.y - 40, 16, 0xeaf6ff).setStrokeStyle(4, 0x2a1650).setDepth(blume.y + 2);
    szene.tweens.add({ targets: [this.tau, this.tauSchein], y: '-=14', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Der Mondstein: eine silberne Platte mit einem Mond darauf.
    this.stein = this.platteBauen(platte, 0xb8c4e8);
    this.mond = szene.add.circle(platte.x, platte.y - 4, 16, 0xfff6d8).setStrokeStyle(3, 0x2a1650).setDepth(-1);

    this.hoeren('torGeloest', () => {
      if (!this.raetsel.geloest) this.raetsel.loesen();
    });
    if (raetsel.geloest) this.geloestZeigen();
  }

  // Das Tor ist offen, solange jemand (man selbst oder die andere) auf dem Mondstein steht.
  vorDemAnfang() {
    this.torZeigen(false);
  }

  pruefen() {
    if (this.wartet) return;
    const { platte, blume } = this.daten;
    const partner = this.partner;
    const draufIch = abstand(this.spieler, platte) < AUF_DER_PLATTE;
    const draufSie = Boolean(partner) && abstand(partner, platte) < AUF_DER_PLATTE;
    if (draufIch && this.aufPlatz < 0) pling(0.8);
    this.aufPlatz = draufIch ? 0 : -1;
    this.stein.schein.setAlpha(draufIch || draufSie ? 0.9 : 0.3);
    this.torZeigen(draufIch || draufSie);

    if (abstand(this.spieler, blume) < 60) {
      this.senden('torGeloest');
      this.raetsel.loesen();
    }
  }

  torZeigen(offen) {
    if (offen === this.offen) return;
    this.offen = offen;
    const szene = this.szene;
    rumpeln();
    const sperren = this.tor.map((busch) => busch.sperre);
    if (offen) szene.hindernisse = szene.hindernisse.filter((hindernis) => !sperren.includes(hindernis));
    else szene.hindernisse.push(...sperren);
    // Die Büsche beim Tor ducken sich zur Seite weg.
    for (const busch of this.tor) {
      szene.tweens.killTweensOf(busch.bild);
      busch.groesse ??= busch.bild.scaleX;
      szene.tweens.add({ targets: busch.bild, scaleY: busch.groesse * (offen ? 0.25 : 1), alpha: offen ? 0.45 : 1, duration: 350, ease: 'Back.easeOut' });
    }
    if (offen) for (const busch of this.tor) this.funken(busch.punkt.x, busch.punkt.y - 30, [0xd8c8ff, 0xffffff], 5);
  }

  // Gelöst: Der Mondtau ist geholt, und das Tor bleibt offen.
  geloestZeigen() {
    this.wartet = true;
    this.torZeigen(true);
    this.tau.setVisible(false);
    this.tauSchein.setAlpha(0.3);
    this.stein.schein.setAlpha(0.6).setTint(GOLD);
    this.mond.setFillStyle(GOLD);
    this.szene.tweens.add({ targets: this.tauSchein, scale: 1.5, alpha: 0, duration: 1200, ease: Phaser.Math.Easing.Sine.Out });
  }
}

// Welche Rätsel-Art zu welchem Spiel gehört (wie GEHEIMGANG_RAETSEL).
export const ZWEIER_RAETSEL = {
  zuZweit: SternplattenRaetsel,
  fluestern: FluesternRaetsel,
  tor: TorRaetsel,
};
