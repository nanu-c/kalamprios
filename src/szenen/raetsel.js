// Das Rätsel an einem Ort: Ein Rätselstein mit einem goldenen Fragezeichen
// erklärt die Aufgabe. Was für Rätsel es gibt, steht oben in
// daten/orte/kristallwald.js bei raetsel.
//
// suchen:      Dinge finden, die irgendwo versteckt liegen
// reihenfolge: Die Klangsteine leuchten nacheinander auf, dann läuft man
//              in derselben Reihenfolge über sie. Jede Runde leuchten mehr.
// frage:       Rätselfragen beantworten, jedes Mal andere
//
// Die Rätsel im Geheimgang (farben, stimmen, paare, weg, spiegel, lichter)
// stehen in geheimraetsel.js, die Rätsel hinter dem Freundschaftstor
// (zuZweit, fluestern, tor) in zweierraetsel.js. Der Rätselstein erklärt auch sie.
//
// Der Rätselstein ist gemalt (Gegenstände/Rätselstein_….jpg), einmal für
// ungelöst und einmal für gelöst. Er leuchtet und schimmert in seinen Farben.
// Die Klangsteine sind gemalt wie die Bäume und der Mondsee: mit einem
// dunklen, etwas wackeligen Strich außen herum. Auch das Fragezeichen über
// dem Stein ist mit der Hand gezeichnet und keine Schrift.

import Phaser from 'phaser';
import { GESCHICHTE } from '../daten/geschichte.js';
import { klangstein } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { verstummen, vorlesen } from '../vorlesen.js';
import { abstand, durcheinander, reihenfolgeTreten, reihenfolgeWuerfeln } from '../welt/weltlogik.js';
import { belohnungZeigen } from './animationen.js';
import { GEHEIMGANG_RAETSEL } from './geheimraetsel.js';
import { ZWEIER_RAETSEL } from './zweierraetsel.js';
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
const STEIN_BREITE = 140; // so breit ist der gemalte Rätselstein
// Die Farben, in denen der Rätselstein schimmert (wie seine Buntstiftfarben)
const STEIN_SCHIMMER = [0x6fe8e0, 0xff6fa8, 0x5bb0ff];
const SPRECH_ABSTAND = 18 + STEIN_RADIUS + 22;
const FINDEN_ABSTAND = 50;
const AUF_DEM_STEIN = 40; // so nah muss man an der Mitte eines Klangsteins sein
const VORNE = 100000;
const SAETZE = GESCHICHTE.raetsel; // was der Rätselstein zwischendurch sagt

// Die Farben der gemalten Sachen (wie die Steine am Mondsee)
export const STRICH = '#1a1035';
const GOLD = '#ffd166';
const GOLD_HELL = '#fff3c4';

// ------------------------------------------------------------ Malen

// Ein Würfel, der immer dieselben Zahlen würfelt. So wackelt der Strich
// jedes Mal gleich.
export function wuerfel(startwert) {
  let zustand = startwert;
  return () => {
    zustand = (zustand * 16807) % 2147483647;
    return zustand / 2147483647;
  };
}

export function farbeAlsCss(farbe, hell = 0) {
  const kanal = (verschiebung) => {
    const wert = (farbe >> verschiebung) & 0xff;
    return Math.round(hell >= 0 ? wert + (255 - wert) * hell : wert * (1 + hell));
  };
  return `rgb(${kanal(16)}, ${kanal(8)}, ${kanal(0)})`;
}

// Ein wackeliger, runder Umriss wie mit der Hand gezeichnet.
export function klecksPfad(stift, mitteX, mitteY, breite, hoehe, zufall, unten = 1) {
  const punkte = 28;
  stift.beginPath();
  for (let i = 0; i <= punkte; i += 1) {
    const winkel = (i / punkte) * Math.PI * 2;
    const wackeln = 1 + (zufall() - 0.5) * 0.06;
    // Unten ist der Stein etwas flacher, damit er fest auf dem Boden steht.
    const y = Math.sin(winkel) * hoehe * wackeln * (Math.sin(winkel) > 0 ? unten : 1);
    const x = Math.cos(winkel) * breite * wackeln;
    if (i === 0) stift.moveTo(mitteX + x, mitteY + y);
    else stift.lineTo(mitteX + x, mitteY + y);
  }
  stift.closePath();
}

// Zieht einen Strich durch die Punkte, mit kleinen Wacklern dazwischen.
export function wackelstrich(stift, punkte, zufall, wackeln = 1.2) {
  stift.beginPath();
  punkte.forEach(([x, y], nummer) => {
    const dx = nummer === 0 ? 0 : (zufall() - 0.5) * wackeln;
    const dy = nummer === 0 ? 0 : (zufall() - 0.5) * wackeln;
    if (nummer === 0) stift.moveTo(x, y);
    else stift.lineTo(x + dx, y + dy);
  });
  stift.stroke();
}

// Die Punkte eines Fragezeichens: ein Bogen oben, dann ein Strich nach unten.
// groesse 1 ist 60 Pixel hoch. Der Punkt darunter kommt extra.
function fragezeichenPunkte(x, y, groesse) {
  const punkte = [];
  for (let i = 0; i <= 24; i += 1) {
    const winkel = Math.PI * 1.1 - (i / 24) * Math.PI * 1.55;
    punkte.push([x + Math.cos(winkel) * 15 * groesse, y - 30 * groesse - Math.sin(winkel) * 15 * groesse]);
  }
  const [endeX, endeY] = punkte.at(-1);
  for (let i = 1; i <= 8; i += 1) {
    const anteil = i / 8;
    punkte.push([endeX + (x - endeX) * anteil, endeY + (y + 4 * groesse - endeY) * anteil]);
  }
  return punkte;
}

// Die Punkte eines Sterns mit fünf Zacken.
function sternPunkte(x, y, groesse) {
  const punkte = [];
  for (let i = 0; i <= 10; i += 1) {
    const winkel = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const weit = (i % 2 === 0 ? 30 : 13) * groesse;
    punkte.push([x + Math.cos(winkel) * weit, y + Math.sin(winkel) * weit]);
  }
  return punkte;
}

// Malt das Zeichen (Fragezeichen oder Stern) als goldenen, leuchtenden Strich.
function zeichenMalen(stift, art, x, y, groesse, zufall, leuchten) {
  stift.save();
  stift.lineCap = 'round';
  stift.lineJoin = 'round';
  const punkte = art === 'stern' ? sternPunkte(x, y - 14 * groesse, groesse) : fragezeichenPunkte(x, y, groesse);
  const punktUnten = [x, y + 20 * groesse];

  // Erst ein dunkler Rand, dann Gold mit Schein, dann eine helle Mitte.
  for (const [farbe, breite, schein] of [[STRICH, 13, 0], [GOLD, 8, leuchten ? 18 : 0], [GOLD_HELL, 3, 0]]) {
    stift.strokeStyle = farbe;
    stift.fillStyle = farbe;
    stift.lineWidth = breite * groesse;
    stift.shadowColor = GOLD;
    stift.shadowBlur = schein;
    wackelstrich(stift, punkte, zufall, 1.4 * groesse);
    if (art === 'frage') {
      stift.beginPath();
      stift.arc(punktUnten[0], punktUnten[1], (breite / 2 + 2) * groesse, 0, Math.PI * 2);
      stift.fill();
    }
  }
  stift.restore();
}

// Das schwebende Zeichen über dem Stein, damit man ihn von weitem sieht.
export function zeichenBildMalen(szene, name, art) {
  if (szene.textures.exists(name)) return;
  const leinwand = szene.textures.createCanvas(name, 110, 130);
  zeichenMalen(leinwand.context, art, 55, 78, 1.3, wuerfel(5), true);
  leinwand.refresh();
}

// Ein flacher Klangstein in seiner Farbe, mit dunklem Umriss.
function klangsteinMalen(szene, name, farbe) {
  if (szene.textures.exists(name)) return;
  const leinwand = szene.textures.createCanvas(name, 100, 52);
  const stift = leinwand.context;
  const zufall = wuerfel((farbe % 997) + 1);
  const licht = stift.createRadialGradient(36, 18, 3, 50, 26, 46);
  licht.addColorStop(0, farbeAlsCss(farbe, 0.55));
  licht.addColorStop(0.5, farbeAlsCss(farbe));
  licht.addColorStop(1, farbeAlsCss(farbe, -0.35));
  klecksPfad(stift, 50, 26, 44, 20, zufall);
  stift.fillStyle = licht;
  stift.fill();
  stift.strokeStyle = STRICH;
  stift.lineWidth = 4;
  stift.lineJoin = 'round';
  klecksPfad(stift, 50, 26, 44, 20, wuerfel((farbe % 997) + 1));
  stift.stroke();
  // Ein kleiner Glanz oben links
  stift.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  stift.lineWidth = 3;
  stift.lineCap = 'round';
  wackelstrich(stift, [[26, 18], [34, 13], [44, 11]], zufall);
  leinwand.refresh();
}

// ------------------------------------------------------------ Das Rätsel

export class Raetsel {
  constructor(szene) {
    this.szene = szene;
    this.ortName = szene.ortName;
    this.daten = szene.ort.raetsel;
    this.licht = szene.ort.dunkel ? LICHT_TIEFE : null;
    this.warDa = false;
    this.geschafft = 0; // bei reihenfolge: so viele Steine waren schon richtig
    this.folge = null; // bei reihenfolge: die Nummern der Steine, die dran sind
    this.aufStein = -1; // auf welchem Klangstein man gerade steht
    this.zeigtVor = false; // true, solange die Klangsteine vorleuchten
    this.fragenReihe = []; // bei frage: in dieser Reihenfolge kommen die Fragen
    this.richtige = 0; // bei frage: so viele waren schon richtig

    this.steinBauen();
    szene.hindernisse.push({ x: this.daten.x, y: this.daten.y - 8, radius: STEIN_RADIUS });
    // Ein Rätsel aus dem Geheimgang (oder das Rätsel zu zweit) bringt sein eigenes Spiel mit.
    const GeheimgangRaetsel = GEHEIMGANG_RAETSEL[this.daten.art] ?? ZWEIER_RAETSEL[this.daten.art];
    this.spiel = GeheimgangRaetsel ? new GeheimgangRaetsel(this) : null;
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

  // Bei reihenfolge: wie viele Steine in jeder Runde aufleuchten.
  get runden() {
    return this.daten.runden ?? [this.daten.steine.length];
  }

  get runde() {
    return Math.min(spielstand.raetselRunde[this.ortName] ?? 0, this.runden.length - 1);
  }

  // ------------------------------------------------------------ Aufbauen

  // Der gemalte Rätselstein. Über ihm schwebt ein Fragezeichen, solange das
  // Rätsel nicht gelöst ist, danach ein Stern. Das Fragezeichen leuchtet.
  steinBauen() {
    const { szene, daten } = this;
    zeichenBildMalen(szene, 'raetselzeichen-frage', 'frage');
    zeichenBildMalen(szene, 'raetselzeichen-stern', 'stern');

    const art = this.geloest ? 'stern' : 'frage';
    this.stein = szene.add
      .image(daten.x, daten.y, this.geloest ? 'raetselstein-geloest' : 'raetselstein')
      .setOrigin(0.5, 0.95)
      .setDepth(daten.y);
    this.stein.setScale(STEIN_BREITE / this.stein.width);
    this.steinLeuchten();
    // Das Zeichen steht auch vor der Figur, wenn sie direkt davor steht,
    // damit man es immer sieht.
    const oben = daten.y - 165;
    const vorDerFigur = daten.y + 200;
    this.schein = lichtschein(szene, daten.x, oben, 170, 150, 0xffd166)
      .setAlpha(0.6)
      .setDepth(this.licht ?? vorDerFigur);
    this.zeichen = szene.add
      .image(daten.x, oben, `raetselzeichen-${art}`)
      .setScale(0.8)
      .setDepth(this.licht ?? vorDerFigur);
    szene.tweens.add({ targets: this.schein, alpha: 0.15, duration: 1000, yoyo: true, repeat: -1 });
    szene.tweens.add({ targets: this.zeichen, y: oben - 10, angle: { from: -4, to: 4 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.schein.setVisible(!this.geloest);
  }

  // Der Stein leuchtet und schimmert: Ein Lichtschein hinter ihm wechselt
  // langsam die Farbe, ein heller Glanz geht über ihn, und ab und zu blitzt
  // ein Funkeln auf. Im Dunkeln scheint das Leuchten durch, damit man ihn findet.
  steinLeuchten() {
    const { szene, stein } = this;
    const mitte = { x: stein.x, y: stein.y - stein.displayHeight * 0.45 };
    const schein = lichtschein(szene, mitte.x, mitte.y, stein.displayWidth * 2.2, stein.displayHeight * 2.4, STEIN_SCHIMMER[0])
      .setAlpha(0.45)
      .setDepth(this.licht ?? stein.depth - 1);
    szene.tweens.add({ targets: schein, alpha: 0.8, scale: schein.scale * 1.1, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Die Farbe wandert reihum durch die Schimmerfarben.
    const farbe = { wert: 0 };
    szene.tweens.add({
      targets: farbe,
      wert: STEIN_SCHIMMER.length,
      duration: 2400 * STEIN_SCHIMMER.length,
      repeat: -1,
      onUpdate: () => {
        const von = Math.floor(farbe.wert) % STEIN_SCHIMMER.length;
        const nach = (von + 1) % STEIN_SCHIMMER.length;
        const a = Phaser.Display.Color.ValueToColor(STEIN_SCHIMMER[von]);
        const b = Phaser.Display.Color.ValueToColor(STEIN_SCHIMMER[nach]);
        const misch = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, (farbe.wert % 1) * 100);
        schein.setTint(Phaser.Display.Color.GetColor(misch.r, misch.g, misch.b));
      },
    });

    // Der Glanz: dasselbe Bild noch einmal, hell aufaddiert, wird mal stärker, mal schwächer.
    this.glanz = szene.add
      .image(stein.x, stein.y, stein.texture.key)
      .setOrigin(stein.originX, stein.originY)
      .setScale(stein.scale)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setDepth(stein.depth + 0.5);
    szene.tweens.add({ targets: this.glanz, alpha: 0.45, duration: 1100, yoyo: true, repeat: -1, repeatDelay: 600, ease: 'Sine.easeInOut' });

    // Funkeln auf dem Stein
    szene.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const x = stein.x + (Math.random() - 0.5) * stein.displayWidth * 0.75;
        const y = stein.y - stein.displayHeight * (0.15 + Math.random() * 0.7);
        const stern = szene.add
          .image(x, y, 'funkel')
          .setTint(Phaser.Utils.Array.GetRandom([0xffffff, ...STEIN_SCHIMMER]))
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(this.licht ?? stein.depth + 1)
          .setScale(0);
        szene.tweens.add({ targets: stern, scale: 0.35 + Math.random() * 0.4, angle: 90, duration: 300, yoyo: true, onComplete: () => stern.destroy() });
      },
    });
  }

  // Aus dem Fragezeichen wird ein Stern, und der Stein wird zum gelösten Stein.
  sternZeigen() {
    this.stein.setTexture('raetselstein-geloest');
    this.stein.setScale(STEIN_BREITE / this.stein.width);
    this.glanz.setTexture('raetselstein-geloest').setScale(this.stein.scale);
    this.zeichen.setTexture('raetselzeichen-stern');
    this.schein.setVisible(false);
    this.szene.tweens.add({ targets: this.zeichen, scale: { from: 1.4, to: 0.8 }, duration: 600, ease: 'Back.easeOut' });
  }

  // Die gesuchten Dinge: kleine funkelnde Sterne. Sie sind erst da, wenn der
  // Rätselstein die Aufgabe erklärt hat. In der Höhle sieht man sie nur im
  // Licht, von weitem nur ein ganz kleines Schimmern.
  dingeVerstecken() {
    const { szene } = this;
    const farbe = RAETSEL_FARBEN[this.daten.farbe] ?? RAETSEL_FARBEN.gelb;
    this.dinge = this.daten.dinge.map((punkt, nummer) => {
      const schein = lichtschein(szene, punkt.x, punkt.y - 14, 70, 60, farbe).setAlpha(0.5).setDepth(punkt.y);
      const bild = szene.add.image(punkt.x, punkt.y - 14, 'funkel').setTint(farbe).setScale(0.8).setDepth(punkt.y);
      const dauer = 700 + nummer * 90;
      szene.tweens.add({ targets: bild, angle: 90, scale: 0.45, duration: dauer, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      szene.tweens.add({ targets: schein, alpha: 0.15, duration: dauer, yoyo: true, repeat: -1 });
      const teile = [bild, schein];
      if (this.licht) {
        const schimmer = lichtschein(szene, punkt.x, punkt.y - 14, 36, 30, farbe).setAlpha(0).setDepth(this.licht);
        szene.tweens.add({ targets: schimmer, alpha: 0.35, duration: 1400 + nummer * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        teile.push(schimmer);
      }
      return { punkt, nummer, teile };
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
    this.steine = this.daten.steine.map((punkt, nummer) => {
      const farbe = RAETSEL_FARBEN[punkt.farbe] ?? RAETSEL_FARBEN.weiss;
      klangsteinMalen(szene, `klangstein-${punkt.farbe}`, farbe);
      const schatten = szene.add.ellipse(punkt.x, punkt.y + 6, 92, 30, 0x170b2c, 0.45).setDepth(2);
      const flaeche = szene.add.image(punkt.x, punkt.y, `klangstein-${punkt.farbe}`).setDepth(3);
      const schein = lichtschein(szene, punkt.x, punkt.y - 30, 170, 140, farbe).setAlpha(0.7).setDepth(4);
      const stein = { punkt, nummer, schatten, flaeche, schein };
      this.leuchten(stein, this.geloest);
      return stein;
    });
  }

  leuchten(stein, an) {
    stein.flaeche.setAlpha(an ? 1 : 0.5);
    stein.schein.setVisible(an);
  }

  // Ein Stein leuchtet kurz auf und singt seinen Ton.
  aufblitzen(stein, dauer = 650) {
    this.leuchten(stein, true);
    klangstein(stein.nummer);
    this.szene.tweens.add({ targets: stein.flaeche, y: stein.punkt.y - 6, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    this.szene.time.delayedCall(dauer, () => {
      if (!this.geloest) this.leuchten(stein, false);
    });
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

    if (this.spiel && !this.angefangen && !this.geloest) this.spiel.vorDemAnfang();
    if (!this.angefangen || this.geloest) return;
    if (this.spiel) this.spiel.pruefen();
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
    if (this.zeigtVor || !this.folge) return;
    const nummer = this.steinUnterDerFigur();
    const neu = nummer >= 0 && nummer !== this.aufStein;
    this.aufStein = nummer;
    if (!neu) return;

    const { geschafft, ergebnis } = reihenfolgeTreten(this.geschafft, nummer, this.folge);
    this.geschafft = geschafft;
    if (ergebnis === 'richtig' || ergebnis === 'fertig') this.aufblitzen(this.steine[nummer], 450);
    if (ergebnis === 'fertig') this.rundeGeschafft();
    if (ergebnis === 'falsch') {
      this.zeigtVor = true; // bis zum nochmal Zeigen zählt kein Stein
      this.steine.forEach((stein) => this.leuchten(stein, false));
      this.szene.cameras.main.shake(250, 0.004);
      this.schweben(this.steine[nummer].punkt, SAETZE.falscherStein);
      vorlesen(SAETZE.falscherStein);
      this.szene.time.delayedCall(1600, () => this.vorzeigen());
    }
  }

  // Eine Runde ist geschafft. War es die letzte, ist das Rätsel gelöst.
  rundeGeschafft() {
    const naechste = this.runde + 1;
    this.zeigtVor = true;
    if (naechste >= this.runden.length) {
      this.szene.time.delayedCall(500, () => {
        this.zeigtVor = false;
        this.loesen();
      });
      return;
    }
    spielstand.raetselRunde[this.ortName] = naechste;
    this.folge = null;
    this.szene.time.delayedCall(500, () => {
      this.steine.forEach((stein) => this.aufblitzen(stein, 500));
      this.schweben(this.daten, SAETZE.rundeGeschafft);
      vorlesen(SAETZE.rundeGeschafft);
    });
    this.szene.time.delayedCall(2300, () => this.vorzeigen());
  }

  // ------------------------------------------------------------ Gespräche

  // Der Rätselstein spricht. Was er sagt, hängt davon ab, wie weit man ist.
  sprechen() {
    const { daten } = this;
    if (this.geloest && daten.art === 'frage') {
      // Rätselfragen gibt es immer wieder, auch wenn es keine Belohnung mehr gibt.
      vorlesen(SAETZE.nochEinRaetsel);
      this.szene.gespraechZeigen(SAETZE.nochEinRaetsel, [
        ['Ja, gern!', () => this.fragenAnfangen(true)],
        ['Tschüss!', () => this.szene.gespraechSchliessen()],
      ]);
      return;
    }
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
    // Ein Rätsel im Geheimgang, das schon läuft: Der Stein erklärt es noch einmal.
    if (this.angefangen && this.spiel) {
      this.saetzeZeigen(daten.aufgabe.slice(1), 'Okay', () => this.spiel.nochmal());
      return;
    }
    const weiter = { suchen: 'Mach ich!', reihenfolge: 'Zeig es mir!', frage: 'Frag mich!' }[daten.art] ?? 'Los geht’s!';
    this.saetzeZeigen(daten.aufgabe, weiter, () => {
      spielstand.raetselAngefangen[this.ortName] = true;
      this.spiel?.anfangen();
      if (daten.art === 'suchen') this.dingeZeigen();
      if (daten.art === 'reihenfolge') this.vorzeigen();
      if (daten.art === 'frage') this.fragenAnfangen(false);
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

  // Die Klangsteine leuchten einer nach dem anderen auf und singen dabei.
  // Wer sich vertan hat, sieht dieselbe Reihenfolge noch einmal.
  vorzeigen() {
    this.zeigtVor = true;
    this.geschafft = 0;
    const laenge = this.runden[this.runde];
    if (!this.folge || this.folge.length !== laenge) this.folge = reihenfolgeWuerfeln(this.steine.length, laenge);
    this.steine.forEach((stein) => this.leuchten(stein, false));

    const { time } = this.szene;
    const takt = 850;
    if (this.runden.length > 1) this.schweben(this.daten, `Runde ${this.runde + 1} von ${this.runden.length}`);
    this.folge.forEach((nummer, stelle) => {
      time.delayedCall(900 + stelle * takt, () => this.aufblitzen(this.steine[nummer], 600));
    });
    time.delayedCall(900 + this.folge.length * takt, () => {
      this.zeigtVor = false;
      // Wer schon auf einem Stein steht, muss erst herunter und wieder drauf.
      this.aufStein = this.steinUnterDerFigur();
      this.schweben(this.daten, SAETZE.jetztDu);
      vorlesen(SAETZE.jetztDu);
    });
  }

  // Die Fragen kommen durcheinander dran. ohneBelohnung: Das Rätsel ist
  // schon gelöst, man rät nur noch zum Spaß.
  fragenAnfangen(ohneBelohnung) {
    this.szene.gespraechSchliessen();
    this.ohneBelohnung = ohneBelohnung;
    this.richtige = 0;
    this.fragenReihe = durcheinander(this.daten.fragen.length);
    this.frageStellen();
  }

  frageStellen() {
    const { szene } = this;
    if (this.fragenReihe.length === 0) this.fragenReihe = durcheinander(this.daten.fragen.length);
    const frage = this.daten.fragen[this.fragenReihe[0]];
    const wieViele = this.ohneBelohnung ? 1 : this.daten.wieViele ?? this.daten.fragen.length;
    vorlesen(frage.frage);
    szene.gespraechZeigen(
      frage.frage,
      frage.antworten.map((antwort) => [
        antwort,
        () => {
          szene.gespraechSchliessen();
          if (antwort !== frage.richtig) {
            this.saetzeZeigen([SAETZE.falscheAntwort], 'Nochmal', () => this.frageStellen());
            return;
          }
          this.fragenReihe.shift();
          this.richtige += 1;
          if (this.ohneBelohnung) this.saetzeZeigen([SAETZE.richtig], 'Danke!', () => {});
          else if (this.richtige < wieViele) this.saetzeZeigen([SAETZE.naechsteFrage], 'Weiter', () => this.frageStellen());
          else this.loesen();
        },
      ]),
    );
  }

  // Geschafft! Es gibt die Belohnung, und der Stein bedankt sich.
  loesen() {
    const { szene, daten } = this;
    spielstand.raetselGeloest[this.ortName] = true;
    this.sternZeigen();
    if (daten.art === 'suchen') this.dingeZeigen();
    if (daten.art === 'reihenfolge') this.steine.forEach((stein) => this.leuchten(stein, true));
    this.spiel?.geloestZeigen();

    // Die Belohnung erscheint groß über dem Stein und fliegt in den Beutel.
    // Danach wird es heller oder der Weg wird frei, damit man beides sieht.
    const kristalle = daten.belohnung?.fangkristalle ?? 0;
    spielstand.fangkristalle += kristalle;
    const danach = () => {
      if (daten.belohnung?.mehrLicht) szene.lichtVergroessern?.();
      szene.raetselGeloest?.();
    };
    if (kristalle > 0) {
      belohnungZeigen(szene, daten, { bild: 'fangkristall', anzahl: kristalle, text: `+${kristalle} Fangkristall${kristalle === 1 ? '' : 'e'}` }).then(danach);
    } else {
      danach();
    }

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
