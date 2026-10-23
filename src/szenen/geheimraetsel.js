// Die Rätsel im Geheimgang. Jedes Rätsel ist ein kleines Spiel, das der
// Rätselstein erklärt (raetsel.js). Was man in den Kammern einstellen kann,
// steht oben in daten/orte/geheimgang.js. Die Regeln, die nur rechnen
// (Farben mischen, Lichtstrahl, ...), stehen in welt/raetsellogik.js.
//
// Jedes Spiel hat diese Teile:
//   constructor  baut alles auf, was man in der Kammer sieht
//   anfangen     wird aufgerufen, wenn der Rätselstein die Aufgabe erklärt hat
//   nochmal      wird aufgerufen, wenn man ihn danach noch einmal fragt
//   pruefen      wird bei jedem Schritt aufgerufen, solange das Rätsel läuft
//   geloestZeigen zeigt, dass das Rätsel gelöst ist

import Phaser from 'phaser';
import { GESCHICHTE } from '../daten/geschichte.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { KLAENGE } from '../daten/klaenge.js';
import { klangstein, pling, plopp, rumpeln, ruf, sternchen, wackeln, zerspringen } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { vorlesen } from '../vorlesen.js';
import {
  farbenMischen,
  lichterTreten,
  lichterWuerfeln,
  paareLegen,
  RICHTUNGEN,
  spiegelDrehen,
  stimmenRunde,
  strahlVerfolgen,
  wegWuerfeln,
} from '../welt/raetsellogik.js';
import { abstand } from '../welt/weltlogik.js';
import { lichtschein } from './landschaft.js';
import { farbeAlsCss, klecksPfad, STRICH, wackelstrich, wuerfel } from './raetsel.js';
import { schrift } from './stil.js';

const SAETZE = GESCHICHTE.raetsel;
const VORNE = 100000;

// Die Farben beim Farben mischen
const FARBEN = {
  rot: { name: 'Rot', farbe: 0xff4d6d },
  gelb: { name: 'Gelb', farbe: 0xffd93d },
  blau: { name: 'Blau', farbe: 0x4d8bff },
  orange: { name: 'Orange', farbe: 0xff9a3d },
  gruen: { name: 'Grün', farbe: 0x5fd068 },
  lila: { name: 'Lila', farbe: 0xb06bff },
  braun: { name: 'Braun', farbe: 0x8a5a3a },
};

const STEINFARBE = 0x8a7cb8; // so sehen die Steinplatten aus
const LICHTFARBE = 0xffe9a8; // das warme Licht der Pilzlampe

// ------------------------------------------------------------ Malen

// Eine flache, gemalte Steinplatte in einer Farbe, mit wackeligem dunklem
// Umriss wie die Klangsteine. Jede Größe und Farbe wird nur einmal gemalt.
function platteMalen(szene, farbe, breite, hoehe) {
  const name = `platte-${farbe.toString(16)}-${breite}x${hoehe}`;
  if (szene.textures.exists(name)) return name;
  const leinwand = szene.textures.createCanvas(name, breite + 8, hoehe + 8);
  const stift = leinwand.context;
  const mitte = { x: breite / 2 + 4, y: hoehe / 2 + 4 };
  const licht = stift.createRadialGradient(mitte.x - breite * 0.2, mitte.y - hoehe * 0.25, 2, mitte.x, mitte.y, breite * 0.6);
  licht.addColorStop(0, farbeAlsCss(farbe, 0.45));
  licht.addColorStop(0.55, farbeAlsCss(farbe));
  licht.addColorStop(1, farbeAlsCss(farbe, -0.35));
  // Eckiger als ein Klangstein: ein Rechteck mit runden, wackeligen Ecken
  const zufall = wuerfel(breite * 7 + hoehe);
  const rand = () => (zufall() - 0.5) * 4;
  const ecke = Math.min(breite, hoehe) * 0.22;
  const pfad = () => {
    const l = 4 + rand();
    const o = 4 + rand();
    const r = breite + 4 + rand();
    const u = hoehe + 4 + rand();
    stift.beginPath();
    stift.moveTo(l + ecke, o);
    stift.lineTo(r - ecke, o + rand() * 0.5);
    stift.quadraticCurveTo(r, o, r, o + ecke);
    stift.lineTo(r + rand() * 0.5, u - ecke);
    stift.quadraticCurveTo(r, u, r - ecke, u);
    stift.lineTo(l + ecke, u + rand() * 0.5);
    stift.quadraticCurveTo(l, u, l, u - ecke);
    stift.lineTo(l + rand() * 0.5, o + ecke);
    stift.quadraticCurveTo(l, o, l + ecke, o);
    stift.closePath();
  };
  pfad();
  stift.fillStyle = licht;
  stift.fill();
  stift.strokeStyle = STRICH;
  stift.lineWidth = 4;
  stift.lineJoin = 'round';
  pfad();
  stift.stroke();
  // Ein paar Buntstift-Striche und ein Glanz oben links
  stift.strokeStyle = 'rgba(30, 16, 60, 0.18)';
  stift.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const x = 10 + zufall() * (breite - 20);
    wackelstrich(stift, [[x, hoehe * 0.6], [x + 10, hoehe * 0.95]], zufall, 2);
  }
  stift.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  stift.lineWidth = 3;
  stift.lineCap = 'round';
  wackelstrich(stift, [[ecke + 4, 12], [ecke + 14, 9], [ecke + 26, 8]], zufall);
  leinwand.refresh();
  return name;
}

// Ein Farbklecks (für die Farbtöpfe beim Farben mischen)
function klecksMalen(szene, farbe) {
  const name = `farbklecks-${farbe.toString(16)}`;
  if (szene.textures.exists(name)) return name;
  const leinwand = szene.textures.createCanvas(name, 130, 70);
  const stift = leinwand.context;
  const licht = stift.createRadialGradient(50, 26, 3, 65, 35, 60);
  licht.addColorStop(0, farbeAlsCss(farbe, 0.5));
  licht.addColorStop(0.5, farbeAlsCss(farbe));
  licht.addColorStop(1, farbeAlsCss(farbe, -0.3));
  klecksPfad(stift, 65, 35, 58, 28, wuerfel(farbe % 991));
  stift.fillStyle = licht;
  stift.fill();
  stift.strokeStyle = STRICH;
  stift.lineWidth = 4;
  klecksPfad(stift, 65, 35, 58, 28, wuerfel(farbe % 991));
  stift.stroke();
  leinwand.refresh();
  return name;
}

// Ein Spiegel, schräg auf seinem Sockel: eine lange Glasscheibe in einem
// goldenen Rahmen, von links unten nach rechts oben ('/'). '\\' ist derselbe
// Spiegel, nur umgedreht. Das Glas glänzt hellblau, mit weißen Lichtstreifen.
function spiegelMalen(szene, groesse) {
  const name = `spiegel-${groesse}`;
  if (szene.textures.exists(name)) return name;
  const leinwand = szene.textures.createCanvas(name, groesse, groesse);
  const stift = leinwand.context;
  const zufall = wuerfel(17);
  const laenge = groesse * 0.95;
  const dicke = groesse * 0.2;
  stift.translate(groesse / 2, groesse / 2);
  stift.rotate(-Math.PI / 4);

  // Der goldene Rahmen mit dunklem Umriss
  const rahmen = (rand) => {
    stift.beginPath();
    stift.roundRect(-laenge / 2 - rand, -dicke / 2 - rand, laenge + rand * 2, dicke + rand * 2, dicke / 2);
  };
  rahmen(4);
  stift.fillStyle = STRICH;
  stift.fill();
  rahmen(0);
  const gold = stift.createLinearGradient(0, -dicke / 2, 0, dicke / 2);
  gold.addColorStop(0, '#ffe9a8');
  gold.addColorStop(0.5, '#e0a93a');
  gold.addColorStop(1, '#9a6a1a');
  stift.fillStyle = gold;
  stift.fill();

  // Das Glas: hell und glänzend
  const rand = dicke * 0.22;
  stift.beginPath();
  stift.roundRect(-laenge / 2 + rand, -dicke / 2 + rand, laenge - rand * 2, dicke - rand * 2, dicke / 3);
  const glas = stift.createLinearGradient(-laenge / 2, 0, laenge / 2, 0);
  glas.addColorStop(0, '#9fd8ff');
  glas.addColorStop(0.35, '#f4fbff');
  glas.addColorStop(0.55, '#b8c8ff');
  glas.addColorStop(0.8, '#ffffff');
  glas.addColorStop(1, '#a8c0f0');
  stift.fillStyle = glas;
  stift.fill();

  // Weiße Lichtstreifen quer über das Glas, wie bei einem echten Spiegel
  stift.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  stift.lineCap = 'round';
  for (const [x, breite] of [[-laenge * 0.22, 3], [-laenge * 0.15, 2], [laenge * 0.2, 3]]) {
    stift.lineWidth = breite;
    wackelstrich(stift, [[x - dicke * 0.15, dicke * 0.22], [x + dicke * 0.15, -dicke * 0.22]], zufall, 0.8);
  }
  leinwand.refresh();
  return name;
}

// ------------------------------------------------------------ Gemeinsam

class GrundRaetsel {
  constructor(raetsel) {
    this.raetsel = raetsel;
    this.szene = raetsel.szene;
    this.daten = raetsel.daten;
    this.ortName = raetsel.ortName;
    this.wartet = false; // true, solange etwas vorgeführt wird und nichts zählt
    this.aufPlatz = -1; // auf welchem Platz die Figur gerade steht
  }

  get spieler() {
    return this.szene.spieler.ort;
  }

  // Bei Rätseln mit Runden: die wievielte gerade dran ist (0 ist die erste).
  get runde() {
    return spielstand.raetselRunde[this.ortName] ?? 0;
  }

  set runde(wert) {
    spielstand.raetselRunde[this.ortName] = wert;
  }

  anfangen() {}

  nochmal() {}

  // Wird bei jedem Schritt aufgerufen, solange der Rätselstein die Aufgabe
  // noch nicht erklärt hat.
  vorDemAnfang() {}

  pruefen() {}

  geloestZeigen() {}

  // Auf welchem der Plätze die Figur steht (-1: auf keinem). Zurück kommt
  // auch, ob sie gerade erst daraufgetreten ist. Wer stehen bleibt, tritt
  // nicht noch einmal drauf.
  treten(plaetze, weite) {
    const nummer = plaetze.findIndex((platz) => abstand(this.spieler, platz) < weite);
    const neu = nummer >= 0 && nummer !== this.aufPlatz;
    this.aufPlatz = nummer;
    return neu ? nummer : -1;
  }

  schweben(punkt, text) {
    this.raetsel.schweben(punkt, text);
  }

  // Ein Kranz aus Funken, der auseinanderfliegt.
  funken(x, y, farben, anzahl = 12) {
    for (let i = 0; i < anzahl; i += 1) {
      const winkel = (i / anzahl) * Math.PI * 2;
      const stern = this.szene.add
        .image(x, y, 'funkel')
        .setTint(farben[i % farben.length])
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(VORNE - 2)
        .setScale(0.7);
      this.szene.tweens.add({
        targets: stern,
        x: x + Math.cos(winkel) * 110,
        y: y + Math.sin(winkel) * 70,
        angle: 180,
        scale: 0.2,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => stern.destroy(),
      });
    }
  }

  // Eine Runde ist geschafft. War es die letzte, ist das Rätsel gelöst,
  // sonst fängt nach einer kleinen Pause die nächste an.
  rundeGeschafft(anzahlRunden, naechste) {
    this.runde += 1;
    if (this.runde >= anzahlRunden) {
      this.wartet = true;
      this.szene.time.delayedCall(700, () => this.raetsel.loesen());
      return;
    }
    this.wartet = true;
    this.schweben(this.daten, `${SAETZE.naechsteRunde} (${this.runde + 1} von ${anzahlRunden})`);
    vorlesen(SAETZE.naechsteRunde);
    this.szene.time.delayedCall(1500, () => {
      this.wartet = false;
      naechste();
    });
  }
}

// ------------------------------------------------------- Farben mischen

class FarbenRaetsel extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    const { szene, daten } = this;
    this.gemischt = [];

    this.toepfe = daten.toepfe.map((topf) => {
      const farbe = FARBEN[topf.farbe].farbe;
      szene.add.image(topf.x, topf.y, klecksMalen(szene, farbe)).setDepth(-2);
      const schein = lichtschein(szene, topf.x, topf.y - 10, 170, 90, farbe).setAlpha(0.35).setDepth(-1);
      szene.tweens.add({ targets: schein, alpha: 0.6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      szene.add.text(topf.x, topf.y + 50, FARBEN[topf.farbe].name, schrift(22, '#f6f0ff')).setOrigin(0.5).setStroke('#2a1650', 5).setDepth(-1);
      return { ...topf, name: topf.farbe, farbe };
    });

    // Der Kessel. Oben in seiner Öffnung ist die gemischte Farbe zu sehen.
    const kessel = szene.add.image(daten.kessel.x, daten.kessel.y, 'kessel').setOrigin(0.5, 0.95).setDepth(daten.kessel.y);
    kessel.setScale(190 / kessel.width);
    this.kessel = kessel;
    szene.hindernisse.push({ x: daten.kessel.x, y: daten.kessel.y - 20, radius: 70 });
    const oeffnung = { x: kessel.x, y: kessel.y - kessel.displayHeight * 0.78 };
    this.oeffnung = oeffnung;
    this.fluessigkeit = szene.add
      .ellipse(oeffnung.x, oeffnung.y, kessel.displayWidth * 0.62, 26, FARBEN.braun.farbe)
      .setAlpha(0)
      .setDepth(daten.kessel.y + 1);
    this.dampf = lichtschein(szene, oeffnung.x, oeffnung.y - 30, 200, 160, 0xffffff).setAlpha(0).setDepth(daten.kessel.y + 2);

    // Neben dem Kessel: welche Farbe man mischen soll
    const ziel = { x: kessel.x + 230, y: kessel.y - kessel.displayHeight * 0.55 };
    this.zielSchein = lichtschein(szene, ziel.x, ziel.y, 180, 180, 0xffffff).setAlpha(0).setDepth(VORNE - 5);
    this.zielTropfen = szene.add.circle(ziel.x, ziel.y, 34, 0xffffff).setStrokeStyle(5, 0x1a1035).setVisible(false).setDepth(VORNE - 4);
    this.zielText = szene.add
      .text(ziel.x, ziel.y + 62, '', schrift(26, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 6)
      .setDepth(VORNE - 4);
    szene.tweens.add({ targets: this.zielTropfen, y: this.zielTropfen.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    if (raetsel.geloest) this.geloestZeigen();
    else if (raetsel.angefangen) this.zielZeigen();
  }

  get ziel() {
    return this.daten.runden[Math.min(this.runde, this.daten.runden.length - 1)];
  }

  zielZeigen() {
    const { farbe, name } = FARBEN[this.ziel];
    this.zielTropfen.setVisible(true).setFillStyle(farbe);
    this.zielSchein.setTint(farbe).setAlpha(0.6);
    this.zielText.setText(`Mische: ${name}`);
  }

  anfangen() {
    this.zielZeigen();
  }

  nochmal() {
    this.zielZeigen();
  }

  pruefen() {
    const nummer = this.treten(this.toepfe, 60);
    if (nummer < 0 || this.wartet) return;
    this.giessen(this.toepfe[nummer]);
  }

  // Ein Tropfen fliegt vom Farbtopf in den Kessel.
  giessen(topf) {
    const { szene } = this;
    this.wartet = true;
    const tropfen = szene.add.circle(topf.x, topf.y - 20, 16, topf.farbe).setStrokeStyle(3, 0x1a1035).setDepth(VORNE - 3);
    szene.tweens.add({ targets: tropfen, x: this.oeffnung.x, duration: 600, ease: 'Sine.easeInOut' });
    szene.tweens.add({
      targets: tropfen,
      y: { from: topf.y - 20, to: this.oeffnung.y },
      duration: 600,
      ease: (t) => t * t * 2 - t, // erst hoch, dann hinein
      onComplete: () => {
        tropfen.destroy();
        plopp(0.8);
        this.gemischt.push(topf.name);
        this.mischen();
      },
    });
  }

  mischen() {
    const { szene } = this;
    const [a, b] = this.gemischt;
    const jetzt = b ? farbenMischen(a, b) : a;
    this.fluessigkeit.setFillStyle(FARBEN[jetzt].farbe).setAlpha(1);
    szene.tweens.add({ targets: this.fluessigkeit, scaleY: { from: 1.6, to: 1 }, duration: 300 });
    if (!b) {
      this.wartet = false;
      return;
    }

    // Zwei Farben sind drin: Der Kessel blubbert und zeigt, was herauskommt.
    this.dampf.setTint(FARBEN[jetzt].farbe);
    szene.tweens.add({ targets: this.dampf, alpha: { from: 0.8, to: 0 }, duration: 1200 });
    szene.tweens.add({ targets: this.kessel, scaleX: this.kessel.scaleX * 1.06, duration: 120, yoyo: true, repeat: 2 });
    for (let i = 0; i < 3; i += 1) szene.time.delayedCall(i * 160, () => plopp(1 + i * 0.3));

    if (jetzt === this.ziel) {
      szene.time.delayedCall(500, () => {
        sternchen();
        this.funken(this.oeffnung.x, this.oeffnung.y - 20, [FARBEN[jetzt].farbe, 0xffffff]);
        this.schweben(this.oeffnung, `${FARBEN[jetzt].name}! Richtig!`);
        this.leeren(900, () => this.rundeGeschafft(this.daten.runden.length, () => this.zielZeigen()));
      });
      return;
    }
    szene.time.delayedCall(500, () => {
      wackeln();
      this.schweben(this.oeffnung, `Das ist ${FARBEN[jetzt].name}.`);
      vorlesen(SAETZE.farbeFalsch);
      this.leeren(1400, () => {
        this.wartet = false;
      });
    });
  }

  leeren(nach, danach) {
    this.szene.time.delayedCall(nach, () => {
      this.gemischt = [];
      this.szene.tweens.add({ targets: this.fluessigkeit, alpha: 0, duration: 400, onComplete: danach });
    });
  }

  geloestZeigen() {
    this.zielTropfen.setVisible(false);
    this.zielSchein.setAlpha(0);
    this.zielText.setText('');
    // Im Kessel schimmert es in allen Mischfarben.
    this.fluessigkeit.setAlpha(1);
    const farben = ['orange', 'gruen', 'lila'].map((name) => FARBEN[name].farbe);
    let nummer = 0;
    this.szene.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        nummer = (nummer + 1) % farben.length;
        this.fluessigkeit.setFillStyle(farben[nummer]);
      },
    });
  }
}

// --------------------------------------------------------- Wer ruft da?

class StimmenRaetsel extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    const { szene, daten } = this;
    this.auswahl = [];
    this.gesucht = null;
    this.aufMuschel = false;

    const muschel = szene.add.image(daten.muschel.x, daten.muschel.y, 'muschel').setOrigin(0.5, 0.9).setDepth(daten.muschel.y);
    muschel.setScale(120 / muschel.width);
    this.muschel = muschel;
    const schein = lichtschein(szene, muschel.x, muschel.y - 40, 220, 160, 0xffd6f0).setAlpha(0.3).setDepth(daten.muschel.y - 1);
    szene.tweens.add({ targets: schein, alpha: 0.6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.platten = daten.platten.map((platz) => {
      szene.add.image(platz.x, platz.y, platteMalen(szene, STEINFARBE, 170, 90)).setDepth(-2);
      const bild = szene.add.image(platz.x, platz.y + 20, 'kalampria-klein').setOrigin(0.5, 1).setDepth(platz.y + 1).setVisible(false);
      const name = szene.add.text(platz.x, platz.y + 62, '', schrift(20, '#f6f0ff')).setOrigin(0.5).setStroke('#2a1650', 5).setDepth(platz.y + 1);
      return { ...platz, bild, name };
    });
    if (raetsel.angefangen && !raetsel.geloest) this.rundeLegen();
  }

  // Die Kalamprios, die rufen können: alle außer dem geheimen.
  get alle() {
    return Object.keys(KALAMPRIOS).filter((kurzname) => !KALAMPRIOS[kurzname].geheim);
  }

  rundeLegen() {
    const stimme = (kurzname) => KLAENGE.rufe[kurzname]?.stimme ?? 'piepsen';
    const { gesucht, auswahl } = stimmenRunde(this.alle, stimme, this.platten.length);
    this.gesucht = gesucht;
    this.auswahl = auswahl;
    this.platten.forEach((platte, nummer) => {
      const kurzname = auswahl[nummer];
      platte.bild.setTexture(`${kurzname}-klein`).setVisible(true);
      platte.bild.setScale(Math.min(100 / platte.bild.height, 130 / platte.bild.width));
      platte.name.setText(KALAMPRIOS[kurzname].name);
      this.szene.tweens.add({ targets: platte.bild, scaleY: { from: 0, to: platte.bild.scaleY }, duration: 300, delay: nummer * 90, ease: 'Back.easeOut' });
    });
    this.szene.time.delayedCall(900, () => this.rufen());
  }

  // Aus der Muschel kommt der Ruf, und kleine Noten steigen auf.
  rufen() {
    if (!this.gesucht) return;
    ruf(this.gesucht);
    this.szene.tweens.add({ targets: this.muschel, angle: { from: -8, to: 8 }, duration: 120, yoyo: true, repeat: 2, onComplete: () => this.muschel.setAngle(0) });
    for (let i = 0; i < 3; i += 1) {
      const note = this.szene.add
        .text(this.muschel.x - 20 + i * 20, this.muschel.y - 90, i % 2 ? '♫' : '♪', schrift(34, '#ffd6f0', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 5)
        .setDepth(VORNE - 3)
        .setAlpha(0);
      this.szene.tweens.add({ targets: note, y: note.y - 70, alpha: { from: 1, to: 0 }, delay: i * 200, duration: 1300, onComplete: () => note.destroy() });
    }
  }

  anfangen() {
    this.rundeLegen();
  }

  nochmal() {
    this.rufen();
  }

  pruefen() {
    // Über die Muschel laufen: Der Ruf kommt noch einmal.
    const beiMuschel = abstand(this.spieler, this.daten.muschel) < 70;
    if (beiMuschel && !this.aufMuschel && !this.wartet) this.rufen();
    this.aufMuschel = beiMuschel;

    const nummer = this.treten(this.platten, 60);
    if (nummer < 0 || !this.gesucht) return;
    const platte = this.platten[nummer];
    const kurzname = this.auswahl[nummer];
    this.szene.tweens.add({ targets: platte.bild, y: platte.y + 8, duration: 100, yoyo: true });
    // Während man wartet, hört man nur, wie dieses Kalamprio klingt.
    if (this.wartet) {
      ruf(kurzname);
      return;
    }

    if (kurzname === this.gesucht) {
      ruf(kurzname);
      pling(1.2);
      this.funken(platte.x, platte.y - 50, [0xffd166, 0xffffff, 0xff9ad5]);
      this.schweben(platte, `Richtig, ${KALAMPRIOS[kurzname].name}!`);
      this.gesucht = null;
      this.rundeGeschafft(this.daten.runden, () => {
        this.platten.forEach((p) => p.bild.setVisible(false));
        this.rundeLegen();
      });
      return;
    }
    // Falsch: Man hört, wie dieses Kalamprio klingt, und dann noch einmal das gesuchte.
    this.wartet = true;
    wackeln();
    this.szene.time.delayedCall(350, () => ruf(kurzname));
    this.schweben(platte, `So klingt ${KALAMPRIOS[kurzname].name}.`);
    this.szene.time.delayedCall(2300, () => vorlesen(SAETZE.falschesKalamprio));
    this.szene.time.delayedCall(4600, () => {
      this.wartet = false;
      this.rufen();
    });
  }

  geloestZeigen() {
    this.gesucht = null;
    this.platten.forEach((platte) => platte.bild.setVisible(false));
  }
}

// ----------------------------------------------------------- Bilderpaare

class PaareRaetsel extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    const { szene, daten } = this;
    this.offen = []; // die Platten, die gerade aufgedeckt sind, aber noch kein Paar
    this.gefunden = new Set();
    // Genug Platz zwischen den Platten, dass man zwischen ihnen durchlaufen kann.
    const abstandX = 280;
    const abstandY = 230;
    this.platten = [];
    for (let reihe = 0; reihe < daten.reihen; reihe += 1) {
      for (let spalte = 0; spalte < daten.spalten; spalte += 1) {
        const x = daten.mitte.x + (spalte - (daten.spalten - 1) / 2) * abstandX;
        const y = daten.mitte.y + (reihe - (daten.reihen - 1) / 2) * abstandY;
        const flaeche = szene.add.image(x, y, platteMalen(szene, STEINFARBE, 160, 110)).setDepth(-2);
        const zeichen = szene.add.image(x, y - 4, 'raetselzeichen-frage').setScale(0.38).setDepth(-1).setAlpha(0.75);
        const bild = szene.add.image(x, y + 30, 'kalampria-klein').setOrigin(0.5, 1).setDepth(y + 1).setVisible(false);
        const schein = lichtschein(szene, x, y, 200, 140, 0xffd166).setAlpha(0).setDepth(-1);
        this.platten.push({ x, y, flaeche, zeichen, bild, schein });
      }
    }
    this.bilderLegen();
    if (raetsel.geloest) this.geloestZeigen();
  }

  bilderLegen() {
    const alle = Object.keys(KALAMPRIOS).filter((kurzname) => !KALAMPRIOS[kurzname].geheim);
    this.bilder = paareLegen(alle, this.platten.length);
    this.offen = [];
    this.gefunden = new Set();
    this.platten.forEach((platte, nummer) => {
      platte.bild.setTexture(`${this.bilder[nummer]}-klein`).setVisible(false);
      platte.bild.setScale(Math.min(110 / platte.bild.height, 140 / platte.bild.width));
      platte.zeichen.setVisible(true);
      platte.schein.setAlpha(0);
    });
  }

  // Die Platte dreht sich um: Sie wird schmal, dann ist das Bild zu sehen.
  umdrehen(nummer, aufdecken) {
    const platte = this.platten[nummer];
    const bildScale = platte.bild.scaleX || 1;
    this.szene.tweens.add({
      targets: [platte.flaeche],
      scaleX: 0,
      duration: 120,
      yoyo: true,
      onYoyo: () => {
        platte.zeichen.setVisible(!aufdecken);
        platte.bild.setVisible(aufdecken);
      },
    });
    if (aufdecken) {
      this.szene.tweens.add({ targets: platte.bild, scaleX: { from: 0, to: bildScale }, delay: 120, duration: 160 });
      ruf(this.bilder[nummer]);
    }
  }

  nochmal() {}

  pruefen() {
    const nummer = this.treten(this.platten, 55);
    if (nummer < 0 || this.wartet || this.gefunden.has(nummer) || this.offen.includes(nummer)) return;
    this.umdrehen(nummer, true);
    this.offen.push(nummer);
    if (this.offen.length < 2) return;

    const [a, b] = this.offen;
    this.offen = [];
    if (this.bilder[a] === this.bilder[b]) {
      this.gefunden.add(a).add(b);
      this.szene.time.delayedCall(350, () => {
        sternchen();
        for (const n of [a, b]) {
          const platte = this.platten[n];
          platte.schein.setAlpha(0.5);
          this.funken(platte.x, platte.y - 40, [0xffd166, 0xffffff]);
        }
        this.schweben(this.platten[b], SAETZE.paarGefunden);
        if (this.gefunden.size === this.platten.length) this.raetsel.loesen();
      });
      return;
    }
    // Kein Paar: Nach einem Moment legen sich beide wieder schlafen.
    this.wartet = true;
    this.szene.time.delayedCall(1300, () => {
      this.umdrehen(a, false);
      this.umdrehen(b, false);
      this.wartet = false;
    });
  }

  geloestZeigen() {
    this.platten.forEach((platte) => {
      platte.zeichen.setVisible(false);
      platte.bild.setVisible(true);
      platte.schein.setAlpha(0.4);
    });
  }
}

// ------------------------------------------------------ Der geheime Weg

class WegRaetsel extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    const { szene, daten } = this;
    const g = daten.groesse;
    this.weg = [];
    this.betreten = new Set();
    this.letzteZelle = null;
    this.faellt = false;

    // Der Abgrund: dunkel und tief, mit ein paar fernen Funkeln ganz unten.
    const breite = daten.spalten * g;
    const hoehe = daten.reihen * g;
    const abgrund = szene.add.graphics().setDepth(-3);
    abgrund.fillStyle(0x07030f, 1);
    abgrund.fillRoundedRect(daten.links - 14, daten.oben - 20, breite + 28, hoehe + 40, 30);
    abgrund.fillStyle(0x140a2a, 1);
    abgrund.fillRoundedRect(daten.links + 6, daten.oben, breite - 12, hoehe, 24);
    abgrund.fillStyle(0x07030f, 1);
    abgrund.fillRoundedRect(daten.links + 30, daten.oben + 20, breite - 60, hoehe - 40, 20);
    for (let i = 0; i < 40; i += 1) {
      abgrund.fillStyle(0x8ef0ff, 0.15 + Math.random() * 0.3);
      abgrund.fillCircle(daten.links + Math.random() * breite, daten.oben + Math.random() * hoehe, 1 + Math.random() * 1.5);
    }

    const zufall = wuerfel(31);
    this.zellen = [];
    for (let reihe = 0; reihe < daten.reihen; reihe += 1) {
      for (let spalte = 0; spalte < daten.spalten; spalte += 1) {
        const x = daten.links + (spalte + 0.5) * g;
        const y = daten.oben + (reihe + 0.5) * g;
        const farbe = [0x7d70a8, 0x8a7cb8, 0x7568a0][Math.floor(zufall() * 3)];
        const flaeche = szene.add.image(x, y, platteMalen(szene, farbe, g - 22, g - 22)).setDepth(-2);
        const schein = lichtschein(szene, x, y, g * 1.3, g * 1.3, 0x8ef0ff).setAlpha(0).setDepth(-1);
        this.zellen.push({ spalte, reihe, x, y, flaeche, schein });
      }
    }
    if (raetsel.geloest) this.geloestZeigen();
  }

  zelle(spalte, reihe) {
    return this.zellen[reihe * this.daten.spalten + spalte];
  }

  istWeg(zelle) {
    return this.weg.some((feld) => feld.spalte === zelle.spalte && feld.reihe === zelle.reihe);
  }

  // Auf welcher Platte die Figur steht. Wer nur knapp am Rand einer Platte
  // ist, steht noch auf der davor, damit man nicht aus Versehen fällt.
  zelleUnterDerFigur() {
    const { links, oben, groesse, spalten, reihen } = this.daten;
    const x = (this.spieler.x - links) / groesse;
    const y = (this.spieler.y - oben) / groesse;
    if (x < 0 || y < 0 || x >= spalten || y >= reihen) return null;
    const rand = 0.14;
    if (x % 1 < rand || x % 1 > 1 - rand || y % 1 < rand || y % 1 > 1 - rand) return this.letzteZelle;
    return this.zelle(Math.floor(x), Math.floor(y));
  }

  anfangen() {
    this.weg = wegWuerfeln(this.daten.spalten, this.daten.reihen);
    this.vorzeigen();
  }

  // Wer auf den Abgrund läuft, bevor der Rätselstein den Weg gezeigt hat, fällt.
  vorDemAnfang() {
    this.pruefen();
  }

  nochmal() {
    this.vorzeigen();
  }

  // Der sichere Weg leuchtet Platte für Platte auf und verlöscht wieder.
  vorzeigen() {
    this.wartet = true;
    this.betreten.clear();
    this.zellen.forEach((zelle) => zelle.schein.setAlpha(0));
    const takt = 380;
    this.weg.forEach((feld, nummer) => {
      this.szene.time.delayedCall(500 + nummer * takt, () => {
        const zelle = this.zelle(feld.spalte, feld.reihe);
        klangstein(nummer);
        this.szene.tweens.add({ targets: zelle.schein, alpha: { from: 0.9, to: 0.6 }, duration: 300 });
      });
    });
    const ende = 500 + this.weg.length * takt + 1400;
    this.szene.time.delayedCall(ende, () => {
      this.zellen.forEach((zelle) => this.szene.tweens.add({ targets: zelle.schein, alpha: 0, duration: 500 }));
      this.wartet = false;
      this.schweben({ x: this.daten.x, y: this.daten.y }, SAETZE.jetztDu);
      vorlesen(SAETZE.jetztDu);
    });
  }

  pruefen() {
    if (this.faellt) return;
    const zelle = this.zelleUnterDerFigur();
    if (!zelle || zelle === this.letzteZelle) {
      this.letzteZelle = zelle;
      return;
    }
    this.letzteZelle = zelle;
    if (this.wartet || !this.istWeg(zelle)) {
      this.fallen(zelle);
      return;
    }
    // Eine sichere Platte: Sie leuchtet und bleibt hell.
    this.betreten.add(zelle);
    klangstein(this.betreten.size);
    this.szene.tweens.add({ targets: zelle.schein, alpha: 0.55, duration: 250 });
    const letztes = this.weg.at(-1);
    if (zelle.spalte === letztes.spalte && zelle.reihe === letztes.reihe) this.raetsel.loesen();
  }

  // Die Platte bricht weg, und die Figur landet wieder am Anfang.
  fallen(zelle) {
    const { szene } = this;
    this.faellt = true;
    zerspringen();
    rumpeln();
    szene.cameras.main.shake(300, 0.006);
    szene.tweens.add({
      targets: zelle.flaeche,
      scale: 0.4,
      alpha: 0,
      y: zelle.y + 40,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => {
        zelle.flaeche.setPosition(zelle.x, zelle.y);
        szene.tweens.add({ targets: zelle.flaeche, scale: 1, alpha: 1, delay: 600, duration: 400 });
      },
    });
    this.schweben(zelle, 'Plumps!');
    szene.cameras.main.flash(250, 20, 10, 40);
    // Zurück an den Anfang, vor den Abgrund
    szene.spieler.ort = { x: this.daten.links - 100, y: this.daten.oben + (this.daten.reihen * this.daten.groesse) / 2 };
    szene.laufziel = null;
    this.letzteZelle = null;
    const angefangen = this.raetsel.angefangen && this.weg.length > 0;
    vorlesen(angefangen ? SAETZE.runtergefallen : SAETZE.erstFragen);
    szene.time.delayedCall(1200, () => {
      this.faellt = false;
      if (angefangen) this.vorzeigen();
    });
  }

  geloestZeigen() {
    // Gelöst: Alle Platten tragen jetzt, und der Weg leuchtet weiter. Kommt
    // man später wieder, schimmern alle Platten ein bisschen.
    this.wartet = false;
    if (this.weg.length === 0) this.zellen.forEach((zelle) => zelle.schein.setAlpha(0.2));
    this.weg.forEach((feld) => this.zelle(feld.spalte, feld.reihe).schein.setAlpha(0.45));
    this.pruefen = () => {};
    this.vorDemAnfang = () => {};
  }
}

// ------------------------------------------------------- Der Lichtstrahl

class SpiegelRaetsel extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    const { szene, daten } = this;
    const g = daten.groesse;
    this.mitte = (spalte, reihe) => ({ x: daten.links + (spalte + 0.5) * g, y: daten.oben + (reihe + 0.5) * g });

    // Der Boden: ein Raster aus dunklen Platten
    for (let reihe = 0; reihe < daten.reihen; reihe += 1) {
      for (let spalte = 0; spalte < daten.spalten; spalte += 1) {
        const { x, y } = this.mitte(spalte, reihe);
        szene.add.image(x, y, platteMalen(szene, 0x4a4070, g - 14, g - 14)).setDepth(-2).setAlpha(0.8);
      }
    }

    // Gelöst gespeichert? Dann stehen die Spiegel so, wie sie beim Lösen standen.
    const gespeichert = spielstand.raetselGefunden[this.ortName];
    const stellungen = raetsel.geloest && gespeichert?.length === daten.spiegel.length ? gespeichert.map((s) => (s ? '\\' : '/')) : null;
    this.spiegel = daten.spiegel.map((eintrag, nummer) => {
      const { x, y } = this.mitte(eintrag.spalte, eintrag.reihe);
      szene.add.image(x, y, platteMalen(szene, 0x9aa6c8, g - 40, g - 40)).setDepth(-1);
      const bild = szene.add.image(x, y - 6, spiegelMalen(szene, g - 20)).setDepth(y);
      const stellung = stellungen?.[nummer] ?? eintrag.stellung;
      bild.setFlipX(stellung === '\\');
      // Hier blitzt es auf, wenn der Lichtstrahl den Spiegel trifft.
      const blitz = lichtschein(szene, x, y - 6, g * 1.2, g * 1.2, 0xffffff).setAlpha(0).setDepth(VORNE - 9);
      return { ...eintrag, x, y, bild, blitz, stellung };
    });
    // Wo der Strahl gerade einen Spiegel trifft, funkelt es immer wieder.
    szene.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        const getroffen = this.spiegel.filter((s) => s.getroffen);
        if (getroffen.length === 0) return;
        const s = Phaser.Utils.Array.GetRandom(getroffen);
        const stern = szene.add
          .image(s.x + (Math.random() - 0.5) * 30, s.y - 6 + (Math.random() - 0.5) * 30, 'funkel')
          .setTint(Phaser.Utils.Array.GetRandom([0xffffff, LICHTFARBE, 0x9fd8ff]))
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(VORNE - 8)
          .setScale(0);
        szene.tweens.add({ targets: stern, scale: 0.6 + Math.random() * 0.4, angle: 90, duration: 260, yoyo: true, onComplete: () => stern.destroy() });
      },
    });

    // Links die Pilzlampe, rechts der ausgesaugte Kristall
    const start = this.mitte(-1, daten.startReihe);
    this.lampe = szene.add.image(start.x, start.y + 40, 'pilz').setOrigin(0.5, 0.97).setScale(0.5).setDepth(start.y + 40);
    this.lampenSchein = lichtschein(szene, start.x, start.y - 20, 220, 200, LICHTFARBE).setAlpha(0.2).setDepth(start.y + 41);
    szene.hindernisse.push({ x: start.x, y: start.y + 36, radius: 30 });
    const ziel = this.mitte(daten.spalten, daten.zielReihe);
    this.ziel = ziel;
    this.kristall = szene.add.image(ziel.x, ziel.y + 50, 'kristall-ausgesaugt').setOrigin(0.5, 0.97).setScale(0.45).setDepth(ziel.y + 50);
    this.kristallBunt = szene.add.image(ziel.x, ziel.y + 50, 'kristall-bunt').setOrigin(0.5, 0.97).setScale(0.45).setDepth(ziel.y + 51).setAlpha(0);
    szene.hindernisse.push({ x: ziel.x, y: ziel.y + 42, radius: 34 });

    this.strahl = szene.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setDepth(VORNE - 10);
    szene.tweens.add({ targets: this.strahl, alpha: { from: 1, to: 0.7 }, duration: 500, yoyo: true, repeat: -1 });
    if (raetsel.geloest) this.geloestZeigen();
    else if (raetsel.angefangen) this.lampeAn();
  }

  lampeAn() {
    this.an = true;
    this.lampenSchein.setAlpha(0.7);
    this.strahlMalen();
  }

  anfangen() {
    this.lampeAn();
  }

  nochmal() {}

  // Wohin der Strahl läuft, und ob er den Kristall trifft.
  verfolgen() {
    const { spalten, reihen, startReihe, zielReihe } = this.daten;
    const weg = strahlVerfolgen(spalten, reihen, { spalte: 0, reihe: startReihe, richtung: 'rechts' }, this.spiegel);
    const trifft = weg.ende?.richtung === 'rechts' && weg.ende.spalte === spalten - 1 && weg.ende.reihe === zielReihe;
    return { ...weg, trifft };
  }

  strahlMalen() {
    const { felder, ende, trifft } = this.verfolgen();
    const punkte = [{ x: this.lampe.x + 10, y: this.lampe.y - this.lampe.displayHeight * 0.7 }, this.mitte(0, this.daten.startReihe)];
    for (const feld of felder) if (feld.rein !== feld.raus) punkte.push(this.mitte(feld.spalte, feld.reihe));
    if (trifft) punkte.push({ x: this.ziel.x, y: this.ziel.y });
    else if (ende) {
      const letzte = this.mitte(ende.spalte, ende.reihe);
      const r = RICHTUNGEN[ende.richtung];
      punkte.push({ x: letzte.x + (r.x * this.daten.groesse) / 2, y: letzte.y + (r.y * this.daten.groesse) / 2 });
    }
    // Die Spiegel, die den Strahl gerade umlenken, leuchten hell auf.
    for (const spiegel of this.spiegel) {
      const vorher = spiegel.getroffen;
      spiegel.getroffen = felder.some((f) => f.spalte === spiegel.spalte && f.reihe === spiegel.reihe && f.rein !== f.raus);
      if (spiegel.getroffen && !vorher) {
        this.szene.tweens.add({ targets: spiegel.blitz, alpha: { from: 1, to: 0.55 }, duration: 400 });
      } else if (!spiegel.getroffen) {
        spiegel.blitz.setAlpha(0);
      }
    }
    const stift = this.strahl;
    stift.clear();
    for (const [breite, alpha] of [[22, 0.18], [10, 0.4], [4, 0.95]]) {
      stift.lineStyle(breite, LICHTFARBE, alpha);
      stift.beginPath();
      stift.moveTo(punkte[0].x, punkte[0].y);
      for (const punkt of punkte.slice(1)) stift.lineTo(punkt.x, punkt.y);
      stift.strokePath();
    }
    return trifft;
  }

  pruefen() {
    const nummer = this.treten(this.spiegel, this.daten.groesse * 0.38);
    if (nummer < 0 || this.wartet) return;
    const spiegel = this.spiegel[nummer];
    spiegel.stellung = spiegelDrehen(spiegel.stellung);
    pling(0.8);
    // Der Spiegel dreht sich sichtbar um.
    this.szene.tweens.add({
      targets: spiegel.bild,
      scaleX: 0,
      duration: 110,
      yoyo: true,
      onYoyo: () => spiegel.bild.setFlipX(spiegel.stellung === '\\'),
    });
    if (this.strahlMalen()) this.getroffen();
  }

  // Der Strahl trifft den Kristall: Er bekommt seine Farben zurück.
  getroffen() {
    this.wartet = true;
    spielstand.raetselGefunden[this.ortName] = this.spiegel.map((s) => (s.stellung === '\\' ? 1 : 0));
    sternchen();
    this.szene.tweens.add({ targets: this.kristallBunt, alpha: 1, duration: 1200 });
    const schein = lichtschein(this.szene, this.ziel.x, this.ziel.y, 360, 360, 0xd9c9ff).setAlpha(0).setDepth(VORNE - 9);
    this.szene.tweens.add({ targets: schein, alpha: { from: 0.9, to: 0.4 }, duration: 1500 });
    this.funken(this.ziel.x, this.ziel.y - 40, [0x8ef0ff, 0xff9ad5, 0xffffff, 0xffd166], 16);
    this.szene.time.delayedCall(1300, () => this.raetsel.loesen());
  }

  geloestZeigen() {
    this.wartet = true;
    this.lampenSchein.setAlpha(0.7);
    this.kristallBunt.setAlpha(1);
    this.strahlMalen();
  }
}

// --------------------------------------------------------- Alle Lichter an

class LichterRaetsel extends GrundRaetsel {
  constructor(raetsel) {
    super(raetsel);
    const { szene, daten } = this;
    this.spalten = 3;
    this.felder = Array(9).fill(false);
    this.anfang = this.felder;
    this.aufNeustart = false;
    // Genug Platz zwischen den Platten, dass man zwischen ihnen durchlaufen kann.
    const abstandX = 260;
    const abstandY = 220;
    this.platten = this.felder.map((_, nummer) => {
      const x = daten.mitte.x + ((nummer % 3) - 1) * abstandX;
      const y = daten.mitte.y + (Math.floor(nummer / 3) - 1) * abstandY;
      const flaeche = szene.add.image(x, y, platteMalen(szene, 0x5a4e86, 150, 110)).setDepth(-2);
      const an = szene.add.image(x, y, platteMalen(szene, 0xffd166, 150, 110)).setDepth(-2).setAlpha(0);
      const schein = lichtschein(szene, x, y - 10, 220, 170, 0xffd166).setAlpha(0).setDepth(-1);
      return { x, y, flaeche, an, schein };
    });

    // Der Neustart-Stein: ein runder Stein mit einem Pfeil im Kreis
    const neu = daten.neustart;
    szene.add.image(neu.x, neu.y, platteMalen(szene, 0x8ab8ff, 120, 80)).setDepth(-2);
    szene.add.text(neu.x, neu.y - 4, '↺', schrift(48, '#1a1035', { fontStyle: '600' })).setOrigin(0.5).setDepth(-1);
    szene.add.text(neu.x, neu.y + 52, 'Neustart', schrift(20, '#f6f0ff')).setOrigin(0.5).setStroke('#2a1650', 5).setDepth(-1);

    if (raetsel.geloest) this.geloestZeigen();
    else if (raetsel.angefangen) this.rundeLegen();
  }

  rundeLegen() {
    const tritte = this.daten.runden[Math.min(this.runde, this.daten.runden.length - 1)];
    this.felder = lichterWuerfeln(3, 3, tritte);
    this.anfang = this.felder;
    this.zeigen();
  }

  zeigen() {
    this.platten.forEach((platte, nummer) => {
      const an = this.felder[nummer];
      this.szene.tweens.add({ targets: platte.an, alpha: an ? 1 : 0, duration: 220 });
      this.szene.tweens.add({ targets: platte.schein, alpha: an ? 0.55 : 0, duration: 220 });
    });
  }

  anfangen() {
    this.rundeLegen();
  }

  nochmal() {}

  pruefen() {
    const beimNeustart = abstand(this.spieler, this.daten.neustart) < 55;
    if (beimNeustart && !this.aufNeustart && !this.wartet) {
      this.felder = this.anfang;
      this.zeigen();
      wackeln();
      this.schweben(this.daten.neustart, SAETZE.allesNeu);
    }
    this.aufNeustart = beimNeustart;

    const nummer = this.treten(this.platten, 55);
    if (nummer < 0 || this.wartet) return;
    this.felder = lichterTreten(this.felder, this.spalten, nummer);
    klangstein(nummer);
    this.zeigen();
    if (!this.felder.every(Boolean)) return;

    sternchen();
    for (const platte of this.platten) this.funken(platte.x, platte.y - 20, [0xffd166, 0xffffff], 6);
    this.rundeGeschafft(this.daten.runden.length, () => this.rundeLegen());
  }

  geloestZeigen() {
    this.felder = Array(9).fill(true);
    this.zeigen();
    this.wartet = true;
  }
}

// Welche Rätsel-Art zu welchem Spiel gehört.
export const GEHEIMGANG_RAETSEL = {
  farben: FarbenRaetsel,
  stimmen: StimmenRaetsel,
  paare: PaareRaetsel,
  weg: WegRaetsel,
  spiegel: SpiegelRaetsel,
  lichter: LichterRaetsel,
};
