// Das Rätsel an einem Ort: Ein Rätselstein mit einem goldenen Fragezeichen
// erklärt die Aufgabe. Was für Rätsel es gibt, steht oben in
// daten/orte/kristallwald.js bei raetsel.
//
// suchen:      Dinge finden, die irgendwo versteckt liegen
// reihenfolge: Die Klangsteine leuchten nacheinander auf, dann läuft man
//              in derselben Reihenfolge über sie
// frage:       Rätselfragen beantworten

import { GESCHICHTE } from '../daten/geschichte.js';
import { spielstand } from '../spielstand.js';
import { verstummen, vorlesen } from '../vorlesen.js';
import { abstand, reihenfolgeTreten } from '../welt/weltlogik.js';
import { LICHT_TIEFE, lichtschein } from './landschaft.js';
import { schrift } from './stil.js';

// Die Farben, die Klangsteine und gesuchte Dinge haben können.
export const RAETSEL_FARBEN = {
  rot: 0xff6b8b,
  gelb: 0xffd166,
  blau: 0x5bc0ff,
  gruen: 0x7be08a,
  lila: 0xb99cf0,
  weiss: 0xffffff,
};

const STEIN_RADIUS = 30; // so breit steht der Rätselstein im Weg
const SPRECH_ABSTAND = 18 + STEIN_RADIUS + 22;
const FINDEN_ABSTAND = 50;
const AUF_DEM_STEIN = 40; // so nah muss man an der Mitte eines Klangsteins sein
const VORNE = 100000;
const SAETZE = GESCHICHTE.raetsel; // was der Rätselstein zwischendurch sagt

export class Raetsel {
  constructor(szene) {
    this.szene = szene;
    this.ortName = szene.ortName;
    this.daten = szene.ort.raetsel;
    this.licht = szene.ort.dunkel ? LICHT_TIEFE : null;
    this.warDa = false;
    this.geschafft = 0; // bei reihenfolge: so viele Steine waren schon richtig
    this.aufStein = -1; // auf welchem Klangstein man gerade steht
    this.zeigtVor = false; // true, solange die Klangsteine vorleuchten

    this.steinBauen();
    szene.hindernisse.push({ x: this.daten.x, y: this.daten.y - 8, radius: STEIN_RADIUS });
    if (this.daten.art === 'suchen') this.dingeVerstecken();
    if (this.daten.art === 'reihenfolge') this.klangsteineLegen();
  }

  get angefangen() {
    return spielstand.raetselAngefangen[this.ortName] === true;
  }

  get geloest() {
    return spielstand.raetselGeloest[this.ortName] === true;
  }

  // Ist die Belohnung mehr Licht und das Rätsel schon gelöst?
  mehrLicht() {
    return this.geloest && this.daten.belohnung?.mehrLicht === true;
  }

  // ------------------------------------------------------------ Aufbauen

  // Ein runder Stein mit einem goldenen Fragezeichen. Solange das Rätsel
  // nicht gelöst ist, leuchtet das Fragezeichen.
  steinBauen() {
    const { szene, daten } = this;
    if (!szene.textures.exists('raetselstein')) {
      const stift = szene.add.graphics();
      stift.fillStyle(0x3a3150);
      stift.fillEllipse(70, 112, 136, 40);
      stift.fillStyle(0x5a4a7c);
      stift.fillEllipse(70, 70, 116, 110);
      stift.fillStyle(0x7a6aa0);
      stift.fillEllipse(58, 54, 72, 58);
      stift.fillStyle(0x9a8cc0);
      stift.fillEllipse(48, 42, 26, 18);
      stift.generateTexture('raetselstein', 140, 130);
      stift.destroy();
    }
    szene.add.image(daten.x, daten.y, 'raetselstein').setOrigin(0.5, 0.9).setDepth(daten.y);
    // Das Fragezeichen schwebt über dem Stein. Es steht auch vor der Figur,
    // wenn sie direkt davor steht, damit man es immer sieht.
    const oben = daten.y - 160;
    const vorDerFigur = daten.y + 200;
    this.schein = lichtschein(szene, daten.x, oben, 170, 150, 0xffd166)
      .setAlpha(0.6)
      .setDepth(this.licht ?? vorDerFigur);
    this.zeichen = szene.add
      .text(daten.x, oben, this.geloest ? '★' : '?', schrift(64, '#ffd166', { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 8)
      .setDepth(this.licht ?? vorDerFigur);
    szene.tweens.add({ targets: this.schein, alpha: 0.15, duration: 1000, yoyo: true, repeat: -1 });
    szene.tweens.add({ targets: this.zeichen, y: oben - 10, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.schein.setVisible(!this.geloest);
  }

  // Die gesuchten Dinge: kleine funkelnde Sterne. Sie sind erst da, wenn der
  // Rätselstein die Aufgabe erklärt hat. In der Höhle sieht man sie nur im Licht.
  dingeVerstecken() {
    const { szene } = this;
    const farbe = RAETSEL_FARBEN[this.daten.farbe] ?? RAETSEL_FARBEN.gelb;
    this.dinge = this.daten.dinge.map((punkt, nummer) => {
      const schein = lichtschein(szene, punkt.x, punkt.y - 14, 70, 60, farbe).setAlpha(0.5).setDepth(punkt.y);
      const bild = szene.add.image(punkt.x, punkt.y - 14, 'funkel').setTint(farbe).setScale(0.8).setDepth(punkt.y);
      szene.tweens.add({ targets: bild, angle: 90, scale: 0.45, duration: 700 + nummer * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      szene.tweens.add({ targets: schein, alpha: 0.15, duration: 700 + nummer * 90, yoyo: true, repeat: -1 });
      return { punkt, nummer, teile: [bild, schein] };
    });
    this.dingeZeigen();
  }

  gefunden() {
    return spielstand.raetselGefunden[this.ortName] ?? [];
  }

  dingeZeigen() {
    for (const ding of this.dinge) {
      const sichtbar = this.angefangen && !this.geloest && !this.gefunden().includes(ding.nummer);
      ding.teile.forEach((teil) => teil.setVisible(sichtbar));
    }
  }

  // Die Klangsteine: flache bunte Steine am Boden. Man kann über sie laufen.
  klangsteineLegen() {
    const { szene } = this;
    this.steine = this.daten.steine.map((punkt) => {
      const farbe = RAETSEL_FARBEN[punkt.farbe] ?? RAETSEL_FARBEN.weiss;
      const rand = szene.add.ellipse(punkt.x, punkt.y, 84, 34, 0x170b2c, 0.5).setDepth(2);
      const flaeche = szene.add.ellipse(punkt.x, punkt.y - 3, 72, 26, farbe).setStrokeStyle(3, 0xffffff, 0.6).setDepth(3);
      const schein = lichtschein(szene, punkt.x, punkt.y - 30, 160, 130, farbe).setDepth(4);
      const stein = { punkt, rand, flaeche, schein };
      this.leuchten(stein, this.geloest);
      return stein;
    });
  }

  leuchten(stein, an) {
    stein.flaeche.setAlpha(an ? 1 : 0.4);
    stein.schein.setVisible(an);
  }

  // ------------------------------------------------------- Jeden Augenblick

  istDa() {
    return abstand(this.szene.spieler.ort, this.daten) < SPRECH_ABSTAND;
  }

  // Wer nach einem Kampf neben dem Stein steht, wird nicht sofort angesprochen.
  merken() {
    this.warDa = this.istDa();
  }

  pruefen() {
    const da = this.istDa();
    if (da && !this.warDa && !this.szene.gespraech) this.sprechen();
    this.warDa = da;

    if (!this.angefangen || this.geloest) return;
    if (this.daten.art === 'suchen') this.dingeSuchen();
    if (this.daten.art === 'reihenfolge') this.steineTreten();
  }

  dingeSuchen() {
    for (const ding of this.dinge) {
      if (this.gefunden().includes(ding.nummer)) continue;
      if (abstand(this.szene.spieler.ort, ding.punkt) > FINDEN_ABSTAND) continue;

      spielstand.raetselGefunden[this.ortName] = [...this.gefunden(), ding.nummer];
      this.dingeZeigen();
      const anzahl = this.gefunden().length;
      this.schweben(ding.punkt, `${SAETZE.gefunden} ${anzahl} von ${this.dinge.length}`);
      if (anzahl === this.dinge.length) this.loesen();
      else vorlesen(SAETZE.gefunden);
    }
  }

  // Auf welchem Klangstein die Figur steht (-1: auf keinem).
  steinUnterDerFigur() {
    return this.steine.findIndex((stein) => abstand(this.szene.spieler.ort, stein.punkt) < AUF_DEM_STEIN);
  }

  steineTreten() {
    if (this.zeigtVor) return;
    const nummer = this.steinUnterDerFigur();
    const neu = nummer >= 0 && nummer !== this.aufStein;
    this.aufStein = nummer;
    if (!neu) return;

    const { geschafft, ergebnis } = reihenfolgeTreten(this.geschafft, nummer, this.steine.length);
    this.geschafft = geschafft;
    if (ergebnis === 'richtig' || ergebnis === 'fertig') this.leuchten(this.steine[nummer], true);
    if (ergebnis === 'fertig') this.loesen();
    if (ergebnis === 'falsch') {
      this.steine.forEach((stein) => this.leuchten(stein, false));
      this.szene.cameras.main.shake(250, 0.004);
      this.schweben(this.steine[nummer].punkt, SAETZE.falscherStein);
      vorlesen(SAETZE.falscherStein);
    }
  }

  // ------------------------------------------------------------ Gespräche

  // Der Rätselstein spricht. Was er sagt, hängt davon ab, wie weit man ist.
  sprechen() {
    const { daten } = this;
    if (this.geloest) {
      this.saetzeZeigen([daten.geschafft], 'Danke!', () => {});
      return;
    }
    if (this.angefangen && daten.art === 'suchen') {
      const fehlen = this.dinge.length - this.gefunden().length;
      const satz = fehlen === 1 ? SAETZE.nurNochEins : SAETZE.suchWeiter.replace('{fehlen}', fehlen);
      this.saetzeZeigen([satz], 'Okay', () => {});
      return;
    }
    if (this.angefangen && daten.art === 'reihenfolge') {
      this.saetzeZeigen([SAETZE.nochmalZeigen], 'Zeig es mir!', () => this.vorzeigen());
      return;
    }
    const weiter = { suchen: 'Mach ich!', reihenfolge: 'Zeig es mir!', frage: 'Frag mich!' }[daten.art];
    this.saetzeZeigen(daten.aufgabe, weiter, () => {
      spielstand.raetselAngefangen[this.ortName] = true;
      if (daten.art === 'suchen') this.dingeZeigen();
      if (daten.art === 'reihenfolge') this.vorzeigen();
      if (daten.art === 'frage') this.frageStellen(0);
    });
  }

  // Zeigt Sätze nacheinander. Beim letzten steht ende auf dem Knopf,
  // und danach passiert danach().
  saetzeZeigen(saetze, ende, danach) {
    const szene = this.szene;
    const zeigen = (nummer) => {
      szene.gespraechSchliessen();
      const letzter = nummer === saetze.length - 1;
      vorlesen(saetze[nummer]);
      szene.gespraechZeigen(saetze[nummer], [
        [
          letzter ? ende : 'Weiter',
          () => {
            if (!letzter) {
              zeigen(nummer + 1);
              return;
            }
            szene.gespraechSchliessen();
            danach();
          },
        ],
      ]);
    };
    zeigen(0);
  }

  // Die Klangsteine leuchten einer nach dem anderen auf, in der richtigen Reihenfolge.
  vorzeigen() {
    this.zeigtVor = true;
    this.geschafft = 0;
    this.steine.forEach((stein) => this.leuchten(stein, false));
    const { time } = this.szene;
    this.steine.forEach((stein, nummer) => {
      time.delayedCall(600 + nummer * 900, () => this.leuchten(stein, true));
      time.delayedCall(600 + nummer * 900 + 650, () => this.leuchten(stein, false));
    });
    time.delayedCall(600 + this.steine.length * 900, () => {
      this.zeigtVor = false;
      // Wer schon auf einem Stein steht, muss erst herunter und wieder drauf.
      this.aufStein = this.steinUnterDerFigur();
      this.schweben(this.daten, SAETZE.jetztDu);
      vorlesen(SAETZE.jetztDu);
    });
  }

  frageStellen(nummer) {
    const { szene } = this;
    const frage = this.daten.fragen[nummer];
    vorlesen(frage.frage);
    szene.gespraechZeigen(
      frage.frage,
      frage.antworten.map((antwort) => [
        antwort,
        () => {
          szene.gespraechSchliessen();
          if (antwort !== frage.richtig) {
            this.saetzeZeigen([SAETZE.falscheAntwort], 'Nochmal', () => this.frageStellen(nummer));
          } else if (nummer < this.daten.fragen.length - 1) {
            this.saetzeZeigen([SAETZE.naechsteFrage], 'Weiter', () => this.frageStellen(nummer + 1));
          } else {
            this.loesen();
          }
        },
      ]),
    );
  }

  // Geschafft! Es gibt die Belohnung, und der Stein bedankt sich.
  loesen() {
    const { szene, daten } = this;
    spielstand.raetselGeloest[this.ortName] = true;
    this.zeichen.setText('★');
    this.schein.setVisible(false);
    if (daten.art === 'suchen') this.dingeZeigen();

    const kristalle = daten.belohnung?.fangkristalle ?? 0;
    spielstand.fangkristalle += kristalle;
    if (kristalle > 0) this.schweben(daten, `+${kristalle} Fangkristall${kristalle === 1 ? '' : 'e'}`);
    if (daten.belohnung?.mehrLicht) szene.lichtVergroessern?.();

    szene.gespraechSchliessen();
    verstummen();
    this.saetzeZeigen([daten.geschafft], 'Danke!', () => {});
  }

  // Ein kleiner Text, der nach oben schwebt und verschwindet.
  schweben(punkt, text) {
    const schild = this.szene.add
      .text(punkt.x, punkt.y - 90, text, schrift(26, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 6)
      .setDepth(VORNE - 1);
    this.szene.tweens.add({
      targets: schild,
      y: schild.y - 60,
      alpha: 0,
      delay: 300,
      duration: 1500,
      ease: 'Sine.easeIn',
      onComplete: () => schild.destroy(),
    });
  }
}
