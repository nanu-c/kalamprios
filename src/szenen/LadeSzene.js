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

// Diese Bilder braucht man schon am Anfang (Titel, Geschichte, Charakterwahl).
const ANFANG = new Set(['titel', 'mond', 'kristall-bunt', 'kristall-ausgesaugt']);

// Sagt, ob alles andere schon da ist (siehe NachladeSzene).
export function nachgeladen(spiel) {
  return spiel.registry.get('nachgeladen') === true;
}

// Geht zur nächsten Szene. Fehlen noch Bilder, wartet die LadeSzene mit einem
// Balken, bis sie da sind.
export function weiterGehen(szene, ziel) {
  if (nachgeladen(szene.game) || ziel === 'Geschichte' || ziel === 'Charakter') szene.scene.start(ziel);
  else szene.scene.start('Laden', { ziel });
}

function ladebalken(szene, text) {
  const mitteX = BREITE / 2;
  const mitteY = HOEHE / 2;
  szene.add.text(mitteX, mitteY - 50, text, schrift(34, '#f6f0ff')).setOrigin(0.5);
  szene.add.rectangle(mitteX, mitteY + 10, 504, 34, 0x2a1650).setStrokeStyle(3, 0xa98bff);
  const balken = szene.add.rectangle(mitteX - 246, mitteY + 10, 492, 22, 0xa98bff).setOrigin(0, 0.5);
  balken.scaleX = 0;
  return balken;
}

export class LadeSzene extends Phaser.Scene {
  constructor() {
    super('Laden');
  }

  init(daten) {
    // Wenn man mitten im Spiel hier landet, wartet die Szene nur aufs Nachladen.
    this.ziel = daten?.ziel;
  }

  preload() {
    if (this.ziel) return;
    const balken = ladebalken(this, 'Kalamprios werden geweckt …');
    this.load.on('progress', (anteil) => {
      balken.scaleX = anteil;
    });

    this.fehlendeBilder = [];
    this.bildNamen = [];
    this.load.on('loaderror', (datei) => this.fehlendeBilder.push(datei.url));

    // Jede Figur bringt ihr Bild selbst mit.
    for (const [kurzname, charakter] of Object.entries(CHARAKTERE)) {
      this.bildNamen.push(`charakter-${kurzname}`);
      this.load.image(`charakter-${kurzname}`, charakter.bild);
    }
    for (const [name, bild] of Object.entries(WEITERE_BILDER)) {
      if (ANFANG.has(name)) this.load.image(name, bild);
    }
  }

  create() {
    if (this.ziel) {
      this.wartenAufNachladen();
      return;
    }
    const fehler = [
      ...datenPruefen(),
      ...this.fehlendeBilder.map((bild) => `Das Bild "public/${bild}" wurde nicht gefunden.`),
    ];
    if (fehler.length === 0) {
      for (const name of this.bildNamen) kleinesBildErzeugen(this, name);
      // Alles andere lädt jetzt im Hintergrund, während man den Anfang spielt.
      this.scene.launch('Nachladen');
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

  wartenAufNachladen() {
    this.cameras.main.fadeIn(300, 23, 11, 44);
    this.add.rectangle(0, 0, BREITE, HOEHE, 0x170b2c).setOrigin(0).setDepth(-1);
    this.balken = ladebalken(this, 'Gleich geht es los …');
  }

  update() {
    if (!this.ziel) return;
    this.balken.scaleX = this.game.registry.get('ladeanteil') ?? 0;
    if (nachgeladen(this.game)) {
      const ziel = this.ziel;
      this.ziel = null;
      this.scene.start(ziel);
    }
  }
}

// Lädt im Hintergrund alles, was man erst später im Spiel braucht. Die Bilder
// sind für das ganze Spiel da, die Szene selbst zeigt nichts.
export class NachladeSzene extends Phaser.Scene {
  constructor() {
    super('Nachladen');
  }

  preload() {
    this.game.registry.set('nachgeladen', false);
    this.kalamprios = Object.keys(KALAMPRIOS);
    this.load.on('progress', (anteil) => this.game.registry.set('ladeanteil', anteil));
    // Die neuen Sachen sind freiwillig: Fehlt ein Bild, malt das Spiel sie selbst.
    const freiwillig = new Set(NEUE_SACHEN.map((name) => `bilder/gegenstaende/${name}.png`));
    this.load.on('loaderror', (datei) => {
      if (!freiwillig.has(datei.url)) console.error(`Das Bild "public/${datei.url}" wurde nicht gefunden.`);
    });

    for (const [kurzname, tier] of Object.entries(KALAMPRIOS)) this.load.image(kurzname, tier.bild);
    for (const [name, bild] of Object.entries(WEITERE_BILDER)) {
      if (!ANFANG.has(name)) this.load.image(name, bild);
    }
    // Die Pflanzen im Regenwald (gemalt mit werkzeuge/pflanzen_malen.py)
    for (const art of PFLANZEN) this.load.image(`pflanze-${art}`, `bilder/pflanzen/${art}.png`);
    // Die Sachen für die Küche und den Geheimgang (gemalt mit werkzeuge/kueche_malen.py)
    for (const name of [...SACHEN, ...NEUE_SACHEN]) this.load.image(name, `bilder/gegenstaende/${name}.png`);
  }

  create() {
    for (const name of this.kalamprios) {
      if (this.textures.exists(name)) kleinesBildErzeugen(this, name);
    }
    this.game.registry.set('ladeanteil', 1);
    this.game.registry.set('nachgeladen', true);
    this.scene.stop();
  }
}
