// Lädt alle Bilder und prüft die Daten, bevor das Spiel beginnt.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { REGENWALD } from '../daten/orte/regenwald.js';
import { datenPruefen } from '../daten/pruefen.js';
import { BREITE, HOEHE, schrift } from './stil.js';

const KLEIN_HOEHE = 320;

const WEITERE_BILDER = {
  titel: 'bilder/titel.png',
  mondsee: 'bilder/landschaft/mondsee.png',
  mond: 'bilder/landschaft/mond.png',
  'baum-rund': 'bilder/landschaft/baum-rund.png',
  'baum-schief': 'bilder/landschaft/baum-schief.png',
  pilz: 'bilder/landschaft/pilz.png',
  'haus-1': 'bilder/landschaft/haus-1.png',
  'haus-2': 'bilder/landschaft/haus-2.png',
  'haus-3': 'bilder/landschaft/haus-3.png',
  stein: 'bilder/landschaft/stein.png',
  'stein-schale': 'bilder/landschaft/stein-schale.png',
  'stein-beine': 'bilder/landschaft/stein-beine.png',
  'kristall-bunt': 'bilder/landschaft/kristall-bunt.png',
  'kristall-ausgesaugt': 'bilder/landschaft/kristall-ausgesaugt.png',
  fangkristall: 'bilder/gegenstaende/fangkristall.png',
  raetselstein: 'bilder/gegenstaende/raetselstein.png',
  kueche: 'bilder/landschaft/kueche.jpg',
  kinderzimmer: 'bilder/landschaft/kinderzimmer.jpg',
  'raetselstein-geloest': 'bilder/gegenstaende/raetselstein-geloest.png',
};

// Die Pflanzen und alles andere, was im Regenwald wächst
const PFLANZEN = [...new Set(REGENWALD.pflanzen.map((pflanze) => pflanze.art)), 'ceiba', 'wurzeln', 'busch', 'farnbusch', 'liane', 'blaetter'];
// Später dazugekommen (gemalt mit werkzeuge/sachen_malen.py). Fehlt eins, malt
// das Spiel die Sache selbst (seeBilder.js, nachtblumen.js, beet.js, statue.js …).
const NEUE_SACHEN = [
  'bootshaus', 'wasserrad', 'flaschenpost', 'oelkanne', 'frosch', 'mondfisch', 'seerosenblatt', 'samentuete', 'keimling',
  'lagerfeuer-ki', 'sitzstamm-ki', 'sockel', 'rosenbusch',
  'nachtblume-mondwinde', 'nachtblume-nachtkerze', 'nachtblume-sternbluete', 'nachtblume-leuchtglocke', 'nachtblume-mondrose',
];
const SACHEN = ['apfel', 'ei', 'mehl', 'milch', 'zucker', 'mondbeeren', 'wasser', 'honig', 'suppe', 'kuchen', 'pfannkuchen', 'kessel', 'truhe-zu', 'truhe-offen', 'kochbuch', 'muschel', 'beutel', 'kamera', 'fotoalbum', 'kristalltorte', 'zauberpunsch', 'festmahl', 'lungenkraut', 'plastikflasche', 'plastiktuete', 'dose', 'joghurtbecher'];

// Macht von einem Bild eine kleine Fassung für den Wald, mit etwas kräftigeren
// Linien. Stark verkleinert wären die feinen Bleistiftstriche sonst kaum zu sehen.
function kleinesBildErzeugen(szene, name) {
  const gross = szene.textures.get(name).getSourceImage();
  const breite = Math.round((gross.width * KLEIN_HOEHE) / gross.height);
  const klein = szene.textures.createCanvas(`${name}-klein`, breite + 4, KLEIN_HOEHE + 4);
  const stift = klein.context;
  stift.imageSmoothingQuality = 'high';
  // Mehrmals leicht versetzt malen macht die Linien dicker.
  for (const [dx, dy] of [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) {
    stift.drawImage(gross, 2 + dx, 2 + dy, breite, KLEIN_HOEHE);
  }
  klein.refresh();
}

export class LadeSzene extends Phaser.Scene {
  constructor() {
    super('Laden');
  }

  preload() {
    // Ein Ladebalken, damit man bei langsamem Internet sieht, dass es weitergeht.
    const mitteX = BREITE / 2;
    const mitteY = HOEHE / 2;
    this.add.text(mitteX, mitteY - 50, 'Kalamprios werden geweckt …', schrift(34, '#f6f0ff')).setOrigin(0.5);
    this.add.rectangle(mitteX, mitteY + 10, 504, 34, 0x2a1650).setStrokeStyle(3, 0xa98bff);
    const balken = this.add.rectangle(mitteX - 246, mitteY + 10, 492, 22, 0xa98bff).setOrigin(0, 0.5);
    balken.scaleX = 0;
    this.load.on('progress', (anteil) => {
      balken.scaleX = anteil;
    });

    this.fehlendeBilder = [];
    this.bildNamen = [];
    // Die neuen Sachen sind freiwillig: Fehlt ein Bild, malt das Spiel sie selbst.
    const freiwillig = new Set(NEUE_SACHEN.map((name) => `bilder/gegenstaende/${name}.png`));
    this.load.on('loaderror', (datei) => {
      if (!freiwillig.has(datei.url)) this.fehlendeBilder.push(datei.url);
    });

    // Jedes Kalamprio und jede Figur bringt ihr Bild selbst mit.
    const laden = (name, bild) => {
      this.bildNamen.push(name);
      this.load.image(name, bild);
    };
    for (const [kurzname, tier] of Object.entries(KALAMPRIOS)) laden(kurzname, tier.bild);
    for (const [kurzname, charakter] of Object.entries(CHARAKTERE)) {
      laden(`charakter-${kurzname}`, charakter.bild);
    }

    // Gemalte Landschaft, der Fangkristall und der Titel
    for (const [name, bild] of Object.entries(WEITERE_BILDER)) this.load.image(name, bild);
    // Die Pflanzen im Regenwald (gemalt mit werkzeuge/pflanzen_malen.py)
    for (const art of PFLANZEN) this.load.image(`pflanze-${art}`, `bilder/pflanzen/${art}.png`);
    // Die Sachen für die Küche und den Geheimgang (gemalt mit werkzeuge/kueche_malen.py)
    for (const name of [...SACHEN, ...NEUE_SACHEN]) this.load.image(name, `bilder/gegenstaende/${name}.png`);
  }

  create() {
    const fehler = [
      ...datenPruefen(),
      ...this.fehlendeBilder.map((bild) => `Das Bild "public/${bild}" wurde nicht gefunden.`),
    ];
    if (fehler.length === 0) {
      for (const name of this.bildNamen) kleinesBildErzeugen(this, name);
      // Erst weiter, wenn die Schrift geladen ist, sonst steht der Text in einer
      // Ersatzschrift da.
      const schriften = ['400 32px Fredoka', '600 32px Fredoka'].map((art) => document.fonts.load(art));
      Promise.all(schriften)
        .catch(() => {})
        .then(() => this.scene.start('Start'));
      return;
    }

    this.add.text(60, 50, 'Da stimmt noch etwas nicht:', schrift(36, '#ffd166'));
    this.add.text(
      60,
      120,
      fehler.map((zeile) => `•  ${zeile}`).join('\n\n'),
      schrift(24, '#ffffff', { wordWrap: { width: BREITE - 120 }, lineSpacing: 4 }),
    );
  }
}
