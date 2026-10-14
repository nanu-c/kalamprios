// Die Animationen der Attacken. Jede Attacke läuft in drei Schritten ab:
//
//   1. Aufladen: Das Kalamprio leuchtet in seiner Farbe, Glitzer fliegt zu ihm hin.
//   2. Flug:     Die Attacke fliegt mit einem leuchtenden Schweif zum Gegner.
//                Jedes Element sieht dabei anders aus (siehe EFFEKTE unten).
//   3. Treffer:  Lichtblitz, Glitzer-Explosion, der Gegner wird zurückgestoßen.
//
// Starke Attacken (mit Pause) laden länger auf, sind größer und knallen mehr.

import Phaser from 'phaser';
import { ELEMENTE } from '../daten/elemente.js';

const VORNE = 1000; // Effekte liegen über den Kalamprios
const FLUGZEIT = 650; // Millisekunden, die eine Attacke zum Gegner braucht

// ----------------------------------------------------------------- Helfer

function tween(szene, einstellungen) {
  return new Promise((fertig) => szene.tweens.add({ ...einstellungen, onComplete: fertig }));
}

function warten(szene, millisekunden) {
  return new Promise((fertig) => szene.time.delayedCall(millisekunden, fertig));
}

function zufall(min, max) {
  return min + Math.random() * (max - min);
}

function mischen(farbeA, farbeB, anteil) {
  const kanal = (verschiebung) => {
    const a = (farbeA >> verschiebung) & 0xff;
    const b = (farbeB >> verschiebung) & 0xff;
    return Math.round(a + (b - a) * anteil) << verschiebung;
  };
  return kanal(16) | kanal(8) | kanal(0);
}

// Die Mitte eines Kalamprio-Bildes (die Bilder stehen mit den Füßen auf dem Boden).
function mitte(bild) {
  return { x: bild.x, y: bild.y - bild.displayHeight / 2 };
}

// Lässt etwas verblassen und danach verschwinden.
function ausblenden(szene, ziele, dauer = 300, extras = {}) {
  szene.tweens.add({
    targets: ziele,
    alpha: 0,
    duration: dauer,
    ...extras,
    onComplete: () => [].concat(ziele).forEach((ziel) => ziel.destroy()),
  });
}

// --------------------------------------------------------- Leuchtbilder

// Zwei kleine weiße Bilder, die man in jeder Farbe leuchten lassen kann:
// ein weicher Lichtpunkt und ein Glitzerstern mit vier Zacken.
function bilderErzeugen(szene) {
  if (szene.textures.exists('leuchten')) return;

  const licht = szene.textures.createCanvas('leuchten', 64, 64);
  const verlauf = licht.context.createRadialGradient(32, 32, 0, 32, 32, 32);
  verlauf.addColorStop(0, 'rgba(255,255,255,1)');
  verlauf.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  verlauf.addColorStop(1, 'rgba(255,255,255,0)');
  licht.context.fillStyle = verlauf;
  licht.context.fillRect(0, 0, 64, 64);
  licht.refresh();

  const glitzer = szene.textures.createCanvas('glitzer', 48, 48);
  const stift = glitzer.context;
  const schein = stift.createRadialGradient(24, 24, 0, 24, 24, 24);
  schein.addColorStop(0, 'rgba(255,255,255,0.9)');
  schein.addColorStop(0.4, 'rgba(255,255,255,0.15)');
  schein.addColorStop(1, 'rgba(255,255,255,0)');
  stift.fillStyle = schein;
  stift.fillRect(0, 0, 48, 48);
  stift.fillStyle = '#ffffff';
  stift.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const winkel = (i * Math.PI) / 4 - Math.PI / 2;
    const weit = i % 2 === 0 ? 23 : 4;
    stift.lineTo(24 + Math.cos(winkel) * weit, 24 + Math.sin(winkel) * weit);
  }
  stift.closePath();
  stift.fill();
  glitzer.refresh();

  // Ein Herz (für Qalutu)
  const herz = szene.textures.createCanvas('herz', 64, 60);
  const h = herz.context;
  h.fillStyle = '#ffffff';
  h.beginPath();
  h.moveTo(32, 56);
  h.bezierCurveTo(4, 36, 0, 18, 10, 9);
  h.bezierCurveTo(20, 0, 30, 6, 32, 16);
  h.bezierCurveTo(34, 6, 44, 0, 54, 9);
  h.bezierCurveTo(64, 18, 60, 36, 32, 56);
  h.fill();
  herz.refresh();
}

// Ein leuchtender Fleck in einer Farbe.
function licht(szene, ort, farbe, groesse = 1) {
  return szene.add
    .image(ort.x, ort.y, 'leuchten')
    .setTint(farbe)
    .setScale(groesse)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(VORNE);
}

// Ein leuchtender Schweif, der hinter etwas herzieht.
function schweif(szene, ziel, farben, groesse = 0.7, leuchtend = true) {
  const teilchen = szene.add.particles(0, 0, 'leuchten', {
    lifespan: 420,
    speed: { min: 4, max: 30 },
    scale: { start: groesse, end: 0 },
    alpha: { start: 0.75, end: 0 },
    // Die Farbe wandert über die Lebenszeit durch die Liste.
    color: farben.length > 1 ? farben : [farben[0], farben[0]],
    // Leuchtende Schweife glühen nur ein bisschen, sonst wird alles weiß.
    blendMode: leuchtend ? Phaser.BlendModes.SCREEN : Phaser.BlendModes.NORMAL,
    frequency: 14,
    quantity: 2,
  });
  teilchen.setDepth(VORNE - 1).startFollow(ziel);
  return teilchen;
}

function schweifBeenden(szene, teilchen) {
  teilchen.stopFollow();
  teilchen.stop();
  szene.time.delayedCall(500, () => teilchen.destroy());
}

// Viele Glitzersterne platzen in alle Richtungen auseinander.
function platzen(szene, ort, farben, anzahl, weite = 260, bild = 'glitzer') {
  const teilchen = szene.add.particles(ort.x, ort.y, bild, {
    lifespan: { min: 450, max: 900 },
    speed: { min: weite * 0.3, max: weite },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    color: farben.length > 1 ? farben : [farben[0], farben[0]],
    blendMode: Phaser.BlendModes.NORMAL,
    emitting: false,
  });
  teilchen.setDepth(VORNE).explode(anzahl);
  szene.time.delayedCall(1000, () => teilchen.destroy());
}

// Ein Ring, der sich wie eine Druckwelle ausbreitet.
function druckwelle(szene, ort, farbe, groesse = 160, dicke = 8) {
  const kreis = szene.add.circle(ort.x, ort.y, 20).setStrokeStyle(dicke, farbe).setDepth(VORNE);
  kreis.setBlendMode(Phaser.BlendModes.ADD);
  ausblenden(szene, kreis, 500, { scale: groesse / 20, ease: 'Cubic.easeOut' });
}

// Lässt ein Ding auf einem Bogen vom Start zum Ziel fliegen.
// hoehe > 0 fliegt nach oben ausgebeult, 0 geradeaus.
function fliegen(szene, ding, von, nach, { dauer = FLUGZEIT, hoehe = 0, verzoegerung = 0, ease = 'Sine.easeIn' } = {}) {
  ding.setPosition(von.x, von.y);
  const weg = { t: 0 };
  return tween(szene, {
    targets: weg,
    t: 1,
    delay: verzoegerung,
    duration: dauer,
    ease,
    onUpdate: () => {
      const t = weg.t;
      ding.setPosition(
        von.x + (nach.x - von.x) * t,
        von.y + (nach.y - von.y) * t - Math.sin(t * Math.PI) * hoehe,
      );
    },
  });
}

// Schickt mehrere Geschosse nacheinander los, jedes mit Schweif.
// Fertig, sobald das erste trifft; die anderen fliegen noch nach.
async function salve(szene, von, nach, { anzahl, machen, farben, abstand = 110, hoehe = 0, streuung = 40, schweifGroesse = 0.7 }) {
  const treffer = [];
  for (let i = 0; i < anzahl; i += 1) {
    const ding = machen(i).setDepth(VORNE);
    const spur = schweif(szene, ding, farben, schweifGroesse);
    const ziel = { x: nach.x + zufall(-streuung, streuung), y: nach.y + zufall(-streuung, streuung) };
    const bogen = hoehe === 0 ? 0 : hoehe * (i % 2 === 0 ? 1 : -0.6);
    treffer.push(
      fliegen(szene, ding, von, ziel, { verzoegerung: i * abstand, hoehe: bogen }).then(() => {
        schweifBeenden(szene, spur);
        platzen(szene, ziel, farben, 6, 140);
        ausblenden(szene, ding, 150, { scale: ding.scale * 1.8 });
      }),
    );
  }
  await treffer[0];
}

// --------------------------------------------------------------- Aufladen

async function aufladen(szene, bild, farbe, hell, stark) {
  const ort = mitte(bild);
  const dauer = stark ? 750 : 500;

  // Das Kalamprio färbt sich in seiner Farbe ein.
  bild.setTint(hell);

  // Ein Licht hinter ihm wächst.
  const schein = licht(szene, ort, farbe, 0.2).setDepth(bild.depth - 1).setAlpha(0.9);
  szene.tweens.add({ targets: schein, scale: stark ? 5 : 3.5, duration: dauer, ease: 'Sine.easeOut' });

  // Glitzer fliegt von außen zu ihm hin.
  const anzahl = stark ? 16 : 10;
  for (let i = 0; i < anzahl; i += 1) {
    const winkel = (i / anzahl) * Math.PI * 2;
    const weit = zufall(130, 190);
    const funke = szene.add
      .image(ort.x + Math.cos(winkel) * weit, ort.y + Math.sin(winkel) * weit, 'glitzer')
      .setTint(i % 2 ? hell : farbe)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(zufall(0.5, 0.9))
      .setDepth(VORNE);
    ausblenden(szene, funke, dauer * 0.8, {
      x: ort.x,
      y: ort.y,
      delay: zufall(0, dauer * 0.2),
      rotation: Math.PI,
      ease: 'Cubic.easeIn',
    });
  }
  await warten(szene, dauer);

  ausblenden(szene, schein, 300, { scale: (stark ? 5 : 3.5) * 1.3 });
  bild.clearTint();
}

// ---------------------------------------------------------------- Treffer

async function treffen(szene, bild, farbe, hell, stark, richtung) {
  const ort = mitte(bild);
  if (stark) szene.cameras.main.flash(220, 255, 255, 255);
  szene.cameras.main.shake(stark ? 320 : 200, stark ? 0.012 : 0.006);

  // Ein heller Lichtblitz und eine Druckwelle
  const blitz = licht(szene, ort, hell, 0.5);
  ausblenden(szene, blitz, 380, { scale: stark ? 7 : 5, ease: 'Cubic.easeOut' });
  druckwelle(szene, ort, farbe, stark ? 260 : 180);
  if (stark) szene.time.delayedCall(110, () => druckwelle(szene, ort, hell, 200, 5));
  platzen(szene, ort, [farbe, hell, 0xffffff], stark ? 40 : 24, stark ? 340 : 260);

  // Der Gegner leuchtet weiß auf, dann in der Farbe der Attacke, und wird
  // zurückgestoßen.
  bild.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
  szene.time.delayedCall(90, () => bild.setTint(farbe).setTintMode(Phaser.TintModes.MULTIPLY));
  szene.time.delayedCall(450, () => bild.clearTint());
  const stoss = stark ? 70 : 40;
  await tween(szene, { targets: bild, x: bild.x + richtung * stoss, duration: 110, ease: 'Quad.easeOut' });
  await tween(szene, { targets: bild, x: bild.x - richtung * stoss, duration: 320, ease: 'Back.easeOut' });
}

// ------------------------------------------------------------------- Flug

// Für jedes Element: wie die Attacke zum Gegner fliegt.
// von und nach sind die Mitten von Angreifer und Gegner.
const EFFEKTE = {
  // Leuchtende Monde, die zum Gegner schweben
  async mond(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 3 : 1,
      farben: [farbe],
      hoehe: 60,
      schweifGroesse: 1,
      machen: () => licht(szene, von, 0xffffff, stark ? 2.2 : 1.6),
    });
  },

  // Zuckende Blitze mit Funken
  async elektro(szene, von, nach, stark, farbe) {
    const blitze = stark ? 4 : 2;
    for (let b = 0; b < blitze; b += 1) {
      const stift = szene.add.graphics().setDepth(VORNE).setBlendMode(Phaser.BlendModes.ADD);
      const punkte = [von];
      const teile = 9;
      for (let i = 1; i < teile; i += 1) {
        punkte.push({
          x: von.x + ((nach.x - von.x) * i) / teile + zufall(-25, 25),
          y: von.y + ((nach.y - von.y) * i) / teile + zufall(-60, 60),
        });
      }
      punkte.push(nach);
      for (const [breite, ton, deckkraft] of [[34, farbe, 0.25], [14, farbe, 0.8], [5, 0xffffff, 1]]) {
        stift.lineStyle(stark ? breite * 1.3 : breite, ton, deckkraft);
        stift.beginPath();
        stift.moveTo(punkte[0].x, punkte[0].y);
        for (const punkt of punkte.slice(1)) stift.lineTo(punkt.x, punkt.y);
        stift.strokePath();
      }
      for (const punkt of punkte.slice(1, -1)) {
        if (Math.random() < 0.5) platzen(szene, punkt, [farbe, 0xffffff], 3, 90);
      }
      await warten(szene, 140);
      ausblenden(szene, stift, 200);
      await warten(szene, 60);
    }
  },

  // Funkelnde Kristallsplitter
  async kristall(szene, von, nach, stark, farbe) {
    const winkel = Math.atan2(nach.y - von.y, nach.x - von.x) + Math.PI / 2;
    await salve(szene, von, nach, {
      anzahl: stark ? 8 : 4,
      abstand: 80,
      farben: [farbe, 0xc9b8ff],
      hoehe: 50,
      machen: (i) => {
        const g = stark ? 36 : 28;
        return szene.add
          .triangle(0, 0, 0, g * 2, g / 2, 0, g, g * 2, i % 2 ? farbe : 0xc9b8ff)
          .setStrokeStyle(3, 0xffffff)
          .setRotation(winkel);
      },
    });
  },

  // Glänzende Klingen, die sich drehen
  async prismastahl(szene, von, nach, stark) {
    const regenbogen = [0xff9ad5, 0xffe066, 0x8ef0ff, 0xc9b8ff];
    await salve(szene, von, nach, {
      anzahl: stark ? 5 : 3,
      farben: regenbogen,
      streuung: 30,
      machen: (i) => {
        const klinge = szene.add.rectangle(0, 0, 90, 14, 0xe6ecf8).setStrokeStyle(3, regenbogen[i % 4]);
        szene.tweens.add({ targets: klinge, rotation: Math.PI * 6, duration: 900 });
        return klinge;
      },
    });
    for (let i = 0; i < 2; i += 1) {
      const schnitt = szene.add
        .rectangle(nach.x, nach.y, 260, 8, 0xffffff)
        .setRotation(i ? 0.7 : -0.7)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(VORNE);
      ausblenden(szene, schnitt, 380, { scaleX: 1.6 });
    }
  },

  // Wirbelnde Blätter auf geschwungenen Bahnen
  async pflanze(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 9 : 5,
      abstand: 70,
      farben: [farbe, 0xd8ffb0],
      hoehe: 120,
      streuung: 60,
      schweifGroesse: 0.5,
      machen: (i) => {
        const blatt = szene.add.ellipse(0, 0, 44, 20, i % 2 ? 0x7be08a : 0x4fae6a).setStrokeStyle(2, 0xd8ffb0);
        szene.tweens.add({ targets: blatt, rotation: Math.PI * 5, duration: 900 });
        return blatt;
      },
    });
  },

  // Dunkle Kugeln, die den Gegner in Rauch hüllen
  async schatten(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 4 : 2,
      farben: [farbe, 0x3a2a5c],
      hoehe: 40,
      schweifGroesse: 1.1,
      machen: () => szene.add.circle(0, 0, stark ? 34 : 26, 0x1a1230).setStrokeStyle(4, farbe),
    });
    for (let i = 0; i < (stark ? 12 : 8); i += 1) {
      const rauch = szene.add
        .circle(nach.x + zufall(-80, 80), nach.y + zufall(-90, 70), zufall(30, 55), 0x1a1230, 0.75)
        .setDepth(VORNE);
      ausblenden(szene, rauch, zufall(600, 1000), { scale: 1.8, y: rauch.y - 50 });
    }
  },

  // Felsbrocken fallen von oben auf den Gegner
  async stein(szene, von, nach, stark, farbe) {
    const brocken = stark ? 5 : 3;
    const faelle = [];
    for (let i = 0; i < brocken; i += 1) {
      const ziel = { x: nach.x + zufall(-70, 70), y: nach.y + zufall(-30, 50) };
      const fels = szene.add
        .circle(0, 0, zufall(28, stark ? 48 : 36), 0x8a7a66)
        .setStrokeStyle(5, 0x5a4f44)
        .setDepth(VORNE);
      const staub = schweif(szene, fels, [farbe, 0x8a7a66], 0.6, false);
      faelle.push(
        fliegen(szene, fels, { x: ziel.x + zufall(-40, 40), y: -80 }, ziel, {
          dauer: 480,
          verzoegerung: i * 150,
          ease: 'Quad.easeIn',
        }).then(() => {
          schweifBeenden(szene, staub);
          szene.cameras.main.shake(100, 0.005);
          platzen(szene, ziel, [farbe, 0xffffff], 8, 160);
          ausblenden(szene, fels, 220, { scale: 1.3 });
        }),
      );
    }
    await faelle[0];
  },

  // Windwirbel, die sich drehen
  async luft(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 5 : 3,
      farben: [farbe, 0xc9b8ff],
      hoehe: 70,
      streuung: 50,
      schweifGroesse: 0.5,
      machen: () => {
        const wirbel = szene.add.arc(0, 0, stark ? 52 : 42, 20, 300).setStrokeStyle(7, 0xffffff, 0.95);
        wirbel.setBlendMode(Phaser.BlendModes.ADD);
        szene.tweens.add({ targets: wirbel, rotation: -Math.PI * 8, duration: 1000 });
        return wirbel;
      },
    });
    for (let i = 0; i < 6; i += 1) {
      const strich = szene.add
        .rectangle(nach.x - 160, nach.y + zufall(-90, 90), 110, 5, 0xffffff, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(VORNE);
      ausblenden(szene, strich, 420, { x: nach.x + 180, delay: i * 40 });
    }
  },

  // Ein Strom aus Blasen auf einer Welle
  async wasser(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 12 : 7,
      abstand: 55,
      farben: [farbe, 0xd8f4ff],
      hoehe: 45,
      streuung: 35,
      schweifGroesse: 0.45,
      machen: () => szene.add.circle(0, 0, zufall(14, stark ? 30 : 24), 0x5ec8ff, 0.55).setStrokeStyle(4, 0xe8faff),
    });
    druckwelle(szene, nach, 0xd8f4ff, 200, 6);
  },

  // Pochende Herzen (Qalutu)
  async herz(szene, von, nach, stark) {
    const rosa = [0xff6f9c, 0xff9ad5, 0xff4f7a];
    await salve(szene, von, nach, {
      anzahl: stark ? 8 : 4,
      abstand: 90,
      farben: rosa,
      hoehe: 100,
      streuung: 50,
      machen: (i) => {
        const herz = szene.add.image(0, 0, 'herz').setTint(rosa[i % 3]).setScale(stark ? 0.9 : 0.7);
        szene.tweens.add({ targets: herz, scale: herz.scale * 1.25, duration: 160, yoyo: true, repeat: 3 });
        return herz;
      },
    });
    platzen(szene, nach, rosa, stark ? 20 : 12, 220, 'herz');
  },

  // Das geheime Kalamprio: ein Sternenregen
  async geheim(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 9 : 5,
      abstand: 70,
      farben: [farbe, 0xffe066],
      hoehe: 90,
      streuung: 60,
      machen: (i) => {
        const stern = szene.add.star(0, 0, 5, 12, 30, i % 2 ? 0xff6fcf : 0xffe066).setStrokeStyle(3, 0xffffff);
        szene.tweens.add({ targets: stern, rotation: Math.PI * 4, duration: 900 });
        return stern;
      },
    });
  },
};

// --------------------------------------------------------------- Ablauf

// Spielt die ganze Attacke: aufladen, fliegen, treffen.
//   aussehen:  ein Kurzname aus elemente.js oder 'herz' (bestimmt, was fliegt)
//   element:   das Element des Angreifers (bestimmt die Farbe beim Aufladen)
//   angreifer: das Bild des Angreifers, getroffener: das Bild des Gegners
//   richtung:  1, wenn der Angreifer nach rechts schießt, sonst -1
export async function attackeAnimieren(szene, aussehen, element, angreifer, getroffener, stark, richtung) {
  bilderErzeugen(szene);
  const farbe = aussehen === 'herz' ? 0xff6f9c : (ELEMENTE[aussehen] ?? ELEMENTE[element])?.farbe ?? 0xc9b8ff;
  const hell = mischen(farbe, 0xffffff, 0.55);
  const effekt = EFFEKTE[aussehen] ?? EFFEKTE.mond;

  await aufladen(szene, angreifer, farbe, hell, stark);

  // Kurzer Ruck nach vorn beim Abschießen
  szene.tweens.add({ targets: angreifer, x: angreifer.x + richtung * 45, duration: 110, yoyo: true, ease: 'Quad.easeOut' });

  await effekt(szene, mitte(angreifer), mitte(getroffener), stark, farbe);
  await treffen(szene, getroffener, farbe, hell, stark, richtung);
}
