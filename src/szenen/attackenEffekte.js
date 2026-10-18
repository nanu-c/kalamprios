// Die Animationen der Attacken. Jede Attacke läuft in drei Schritten ab:
//
//   1. Aufladen: Das Kalamprio leuchtet in seiner Farbe, Glitzer fliegt zu ihm hin.
//   2. Flug:     Die Attacke fliegt mit einem leuchtenden Schweif zum Gegner.
//                Jedes Element sieht dabei anders aus (siehe EFFEKTE unten).
//   3. Treffer:  Lichtblitz, Glitzer-Explosion, der Gegner wird zurückgestoßen.
//
// Starke Attacken (mit Pause) laden länger auf, sind größer und knallen mehr.
// Zu jedem Schritt gibt es ein Geräusch (siehe klang/geraeusche.js).
//
// Manche Attacken sehen nicht wie ein Element aus, sondern haben ein eigenes
// Aussehen, zum Beispiel einen Biss oder eine Nussbombe. Welche es gibt,
// steht oben in daten/attacken.js.

import Phaser from 'phaser';
import { ELEMENTE } from '../daten/elemente.js';
import * as geraeusch from '../klang/geraeusche.js';

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
// beimAbschuss und beimTreffer werden für jedes Geschoss aufgerufen (für Geräusche).
async function salve(szene, von, nach, { anzahl, machen, farben, abstand = 110, hoehe = 0, streuung = 40, schweifGroesse = 0.7, beimAbschuss, beimTreffer }) {
  const treffer = [];
  for (let i = 0; i < anzahl; i += 1) {
    if (beimAbschuss) szene.time.delayedCall(i * abstand, () => beimAbschuss(i));
    const ding = machen(i).setDepth(VORNE);
    const spur = schweif(szene, ding, farben, schweifGroesse);
    const ziel = { x: nach.x + zufall(-streuung, streuung), y: nach.y + zufall(-streuung, streuung) };
    const bogen = hoehe === 0 ? 0 : hoehe * (i % 2 === 0 ? 1 : -0.6);
    treffer.push(
      fliegen(szene, ding, von, ziel, { verzoegerung: i * abstand, hoehe: bogen }).then(() => {
        beimTreffer?.(i);
        schweifBeenden(szene, spur);
        platzen(szene, ziel, farben, 6, 140);
        ausblenden(szene, ding, 150, { scale: ding.scale * 1.8 });
      }),
    );
  }
  await treffer[0];
}

// Ein zuckender Blitz von einem Punkt zum anderen. Verschwindet von selbst.
function blitzZeichnen(szene, von, nach, farbe, stark, { zacken = 9, ausschlag = 60, dauer = 140 } = {}) {
  const stift = szene.add.graphics().setDepth(VORNE).setBlendMode(Phaser.BlendModes.ADD);
  const quer = { x: -(nach.y - von.y), y: nach.x - von.x };
  const laenge = Math.hypot(quer.x, quer.y) || 1;
  const punkte = [von];
  for (let i = 1; i < zacken; i += 1) {
    const weit = zufall(-ausschlag, ausschlag);
    punkte.push({
      x: von.x + ((nach.x - von.x) * i) / zacken + (quer.x / laenge) * weit,
      y: von.y + ((nach.y - von.y) * i) / zacken + (quer.y / laenge) * weit,
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
  szene.time.delayedCall(dauer, () => ausblenden(szene, stift, 200));
  return stift;
}

// Eine Uhr mit zwei Zeigern (für Tak-Tik).
function uhr(szene, ort, radius, farbe) {
  const blatt = szene.add.graphics();
  blatt.fillStyle(0x2a1650, 0.85).fillCircle(0, 0, radius);
  blatt.lineStyle(radius * 0.1, farbe, 1).strokeCircle(0, 0, radius);
  blatt.lineStyle(radius * 0.06, 0xffffff, 0.9);
  for (let i = 0; i < 12; i += 1) {
    const winkel = (i * Math.PI) / 6;
    const innen = i % 3 === 0 ? 0.66 : 0.8; // bei 12, 3, 6 und 9 längere Striche
    blatt.lineBetween(Math.cos(winkel) * radius * innen, Math.sin(winkel) * radius * innen, Math.cos(winkel) * radius * 0.9, Math.sin(winkel) * radius * 0.9);
  }
  const klein = szene.add.rectangle(0, 0, radius * 0.13, radius * 0.5, farbe).setOrigin(0.5, 1);
  const gross = szene.add.rectangle(0, 0, radius * 0.08, radius * 0.8, 0xffffff).setOrigin(0.5, 1);
  const knopf = szene.add.circle(0, 0, radius * 0.1, farbe);
  const ganz = szene.add.container(ort.x, ort.y, [blatt, klein, gross, knopf]).setDepth(VORNE);
  return { ganz, gross, klein };
}

// Herzen fallen vom Himmel auf den Gegner.
function herzregen(szene, nach, rosa) {
  for (let i = 0; i < 12; i += 1) {
    const ziel = { x: nach.x + zufall(-110, 110), y: nach.y + zufall(-60, 80) };
    const herz = szene.add.image(0, 0, 'herz').setTint(rosa[i % 3]).setScale(zufall(0.4, 0.7)).setDepth(VORNE);
    fliegen(szene, herz, { x: ziel.x + zufall(-60, 60), y: -60 }, ziel, { dauer: 600, verzoegerung: i * 70, ease: 'Quad.easeIn' }).then(() => {
      if (i % 3 === 0) geraeusch.plopp(1.8);
      platzen(szene, ziel, rosa, 4, 110, 'herz');
      ausblenden(szene, herz, 160, { scale: herz.scale * 1.8 });
    });
  }
}

// Geht mit dem Angreifer nah an den Gegner heran (für Bisse und Hiebe).
// Gibt zurück, wie man wieder an seinen Platz kommt.
async function hinlaufen(szene, angreifer, nach, richtung, abstand = 180) {
  const platz = angreifer.x;
  geraeusch.wusch(0.2);
  await tween(szene, { targets: angreifer, x: nach.x - richtung * abstand, duration: 190, ease: 'Quad.easeIn' });
  return () => tween(szene, { targets: angreifer, x: platz, duration: 320, ease: 'Quad.easeOut' });
}

// --------------------------------------------------------------- Aufladen

async function aufladen(szene, bild, farbe, hell, stark) {
  const ort = mitte(bild);
  const dauer = stark ? 750 : 500;
  geraeusch.aufladen(dauer / 1000, stark);

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
  geraeusch.wumms(stark);
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
      beimAbschuss: () => geraeusch.mondKlang(stark),
      machen: () => licht(szene, von, 0xffffff, stark ? 2.2 : 1.6),
    });
  },

  // Zuckende Blitze mit Funken
  async elektro(szene, von, nach, stark, farbe) {
    const blitze = stark ? 4 : 2;
    for (let b = 0; b < blitze; b += 1) {
      geraeusch.zap(stark ? 0.9 : 0.7);
      blitzZeichnen(szene, von, nach, farbe, stark);
      await warten(szene, 200);
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
      beimAbschuss: () => geraeusch.pling(),
      beimTreffer: (i) => i % 2 === 0 && geraeusch.klirren(),
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
      beimAbschuss: () => geraeusch.wusch(0.15, true),
      machen: (i) => {
        const klinge = szene.add.rectangle(0, 0, 90, 14, 0xe6ecf8).setStrokeStyle(3, regenbogen[i % 4]);
        szene.tweens.add({ targets: klinge, rotation: Math.PI * 6, duration: 900 });
        return klinge;
      },
    });
    geraeusch.metall();
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
    geraeusch.rascheln(stark ? 1.2 : 0.8);
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
    geraeusch.schattenKlang(stark);
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
          geraeusch.rumpeln();
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
    geraeusch.wind(stark ? 1.2 : 0.9);
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
      beimAbschuss: () => geraeusch.plopp(zufall(0.8, 1.4)),
      machen: () => szene.add.circle(0, 0, zufall(14, stark ? 30 : 24), 0x5ec8ff, 0.55).setStrokeStyle(4, 0xe8faff),
    });
    druckwelle(szene, nach, 0xd8f4ff, 200, 6);
  },

  // Pochende Herzen (Qalutu)
  // Starke Herz-Attacken lassen außerdem Herzen vom Himmel regnen.
  async herz(szene, von, nach, stark) {
    const rosa = [0xff6f9c, 0xff9ad5, 0xff4f7a];
    if (stark) herzregen(szene, nach, rosa);
    await salve(szene, von, nach, {
      anzahl: stark ? 8 : 4,
      abstand: 90,
      farben: rosa,
      hoehe: 100,
      streuung: 50,
      beimAbschuss: (i) => i % 2 === 0 && geraeusch.herzPochen(),
      beimTreffer: () => geraeusch.plopp(1.6),
      machen: (i) => {
        const herz = szene.add.image(0, 0, 'herz').setTint(rosa[i % 3]).setScale(stark ? 0.9 : 0.7);
        szene.tweens.add({ targets: herz, scale: herz.scale * 1.25, duration: 160, yoyo: true, repeat: 3 });
        return herz;
      },
    });
    platzen(szene, nach, rosa, stark ? 20 : 12, 220, 'herz');
  },

  // Tak-Tik verbiegt die Zeit: Eine Uhr dreht ihre Zeiger rückwärts, alles
  // wird ganz langsam, der Gegner zerfällt in Echos aus der Vergangenheit.
  // Wenn die Uhr ankommt, springt die Zeit mit einem Ruck wieder an.
  async zeit(szene, von, nach, stark, farbe, { getroffener, richtung }) {
    const { ganz, gross, klein } = uhr(szene, von, stark ? 70 : 54, farbe);
    ganz.setScale(0);
    await tween(szene, { targets: ganz, scale: 1, duration: 220, ease: 'Back.easeOut' });
    szene.tweens.add({ targets: gross, rotation: -Math.PI * 2 * (stark ? 8 : 5), duration: 1600, ease: 'Cubic.easeIn' });
    szene.tweens.add({ targets: klein, rotation: -Math.PI * 2 * (stark ? 2 : 1), duration: 1600, ease: 'Cubic.easeIn' });

    const langsam = stark ? 0.25 : 0.35; // so schnell läuft die Zeit noch (1 ist normal)
    szene.tweens.timeScale = langsam;
    // Die Uhr tickt laut, und alles klingt langsamer.
    let tack = false;
    const ticken = szene.time.addEvent({ delay: 280, loop: true, callback: () => geraeusch.tick((tack = !tack)) });
    geraeusch.zeitLangsam(stark ? 1.6 : 1.1);
    try {
      // Alles färbt sich wie ein altes Foto.
      const schleier = szene.add
        .rectangle(0, 0, szene.scale.width, szene.scale.height, farbe, 0)
        .setOrigin(0)
        .setDepth(VORNE - 2);
      szene.tweens.add({ targets: schleier, fillAlpha: 0.2, duration: 80 });

      // Wellen breiten sich langsam von der Uhr aus.
      for (let i = 0; i < (stark ? 4 : 2); i += 1) {
        szene.time.delayedCall(i * 260, () => druckwelle(szene, von, farbe, 320, 4));
      }

      // Der Gegner hinterlässt durchsichtige Echos, die ihm hinterherhinken.
      const echos = [];
      for (let i = 1; i <= (stark ? 4 : 2); i += 1) {
        const echo = szene.add
          .image(getroffener.x, getroffener.y, getroffener.texture.key)
          .setOrigin(getroffener.originX, getroffener.originY)
          .setScale(getroffener.scaleX, getroffener.scaleY)
          .setFlipX(getroffener.flipX)
          .setTint(farbe)
          .setAlpha(0)
          .setDepth(getroffener.depth + 1);
        // abwechselnd vor und hinter dem Gegner, jedes etwas weiter weg
        const seite = i % 2 === 1 ? 1 : -1;
        szene.tweens.add({ targets: echo, alpha: 0.42 - i * 0.06, x: getroffener.x + seite * richtung * Math.ceil(i / 2) * 70, duration: 120 });
        echos.push(echo);
      }

      // Die Uhr schleicht zum Gegner.
      const spur = schweif(szene, ganz, [farbe, 0xffffff], 0.6);
      await fliegen(szene, ganz, von, nach, { dauer: 380, hoehe: 70, ease: 'Sine.easeInOut' });
      schweifBeenden(szene, spur);
      if (stark) {
        // Der Wecker klingelt!
        geraeusch.klingeln(0.7);
        await tween(szene, { targets: ganz, angle: 18, duration: 22, yoyo: true, repeat: 3 });
      }

      // Die Zeit springt wieder an: Die Echos schnappen in den Gegner zurück.
      szene.tweens.timeScale = 1;
      ticken.remove();
      geraeusch.zeitSprung();
      for (const echo of echos) ausblenden(szene, echo, 140, { x: getroffener.x, ease: 'Cubic.easeIn' });
      ausblenden(szene, schleier, 250);
      ausblenden(szene, ganz, 200, { scale: 2.2 });
    } finally {
      szene.tweens.timeScale = 1;
      ticken.remove();
    }
  },

  // Ein langer Mondstrahl, der flackert und Funken sprüht
  async strahl(szene, von, nach, stark, farbe) {
    const winkel = Math.atan2(nach.y - von.y, nach.x - von.x);
    const laenge = Math.hypot(nach.x - von.x, nach.y - von.y);
    const dicke = stark ? 1.6 : 1;
    const dauer = stark ? 620 : 420;
    geraeusch.strahl((dauer + 380) / 1000, stark);

    const kugel = licht(szene, von, 0xffffff, 1.4 * dicke);
    const schichten = [[64, farbe, 0.3], [28, farbe, 0.85], [10, 0xffffff, 1]].map(([breite, ton, deckkraft]) =>
      szene.add
        .rectangle(von.x, von.y, laenge, breite * dicke, ton, deckkraft)
        .setOrigin(0, 0.5)
        .setRotation(winkel)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(VORNE)
        .setScale(0, 1),
    );
    await tween(szene, { targets: schichten, scaleX: 1, duration: 160, ease: 'Cubic.easeOut' });

    // Der Strahl pocht, und Funken laufen an ihm entlang.
    szene.tweens.add({ targets: schichten, scaleY: 1.4, duration: 70, yoyo: true, repeat: Math.floor(dauer / 140) });
    const glut = licht(szene, nach, farbe, 1.5 * dicke);
    szene.tweens.add({ targets: glut, scale: 3 * dicke, duration: dauer, ease: 'Sine.easeOut' });
    const funken = szene.time.addEvent({
      delay: 35,
      repeat: Math.floor(dauer / 35),
      callback: () => {
        const t = Math.random();
        platzen(szene, { x: von.x + (nach.x - von.x) * t, y: von.y + (nach.y - von.y) * t }, [farbe, 0xffffff], 2, 90);
      },
    });
    await warten(szene, dauer);
    funken.remove();
    szene.tweens.killTweensOf(schichten);
    ausblenden(szene, [...schichten, kugel, glut], 220, { scaleY: 0 });
  },

  // Bunte Traumwellen schweben zum Gegner, die Welt wird wellig, und
  // Schlafsterne tanzen um ihn herum.
  async traum(szene, von, nach, stark, farbe) {
    const farben = [farbe, 0xff9ad5, 0x8ef0ff, 0xffe066];
    const anzahl = stark ? 7 : 4;
    geraeusch.traum(stark ? 1.8 : 1.3);
    const kamera = szene.cameras.main;
    kamera.zoomTo(1.04, 300, 'Sine.easeInOut');

    const wellen = [];
    for (let i = 0; i < anzahl; i += 1) {
      const welle = szene.add
        .ellipse(0, 0, 70, 150)
        .setStrokeStyle(7, farben[i % 4], 0.95)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(VORNE)
        .setScale(0.3);
      szene.tweens.add({ targets: welle, scale: 1.5, duration: FLUGZEIT + 150, delay: i * 120 });
      wellen.push(
        fliegen(szene, welle, von, nach, { verzoegerung: i * 120, hoehe: i % 2 ? 40 : -40, ease: 'Sine.easeInOut' }).then(() =>
          ausblenden(szene, welle, 260, { scale: 2.8 }),
        ),
      );
    }
    await wellen[0];
    kamera.zoomTo(1, 400, 'Sine.easeInOut');

    for (let i = 0; i < (stark ? 14 : 8); i += 1) {
      const winkel = (i / (stark ? 14 : 8)) * Math.PI * 2;
      const stern = szene.add
        .star(nach.x + Math.cos(winkel) * 120, nach.y + Math.sin(winkel) * 70, 5, 6, 15, farben[i % 4])
        .setDepth(VORNE)
        .setAlpha(0);
      ausblenden(szene, stern, 900, { alpha: { from: 1, to: 0 }, y: stern.y - 70, rotation: 2, delay: i * 40 });
    }
  },

  // Drei Kratzer mit Funken, wie von einer Pfote
  async krallen(szene, von, nach, stark, farbe, { angreifer, richtung }) {
    const zurueck = await hinlaufen(szene, angreifer, nach, richtung, 170);
    for (let runde = 0; runde < (stark ? 2 : 1); runde += 1) {
      const neigung = runde % 2 ? 0.7 : -0.7;
      for (let i = -1; i <= 1; i += 1) {
        geraeusch.kratzen();
        // die drei Kratzer liegen nebeneinander, quer zu ihrer Richtung versetzt
        const ort = { x: nach.x - Math.sin(neigung) * i * 46, y: nach.y + Math.cos(neigung) * i * 46 };
        const teile = [[30, farbe, 0.5], [9, 0xffffff, 1]].map(([breite, ton, deckkraft]) =>
          szene.add
            .rectangle(ort.x, ort.y, 220, breite, ton, deckkraft)
            .setRotation(neigung)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(VORNE)
            .setScale(0, 1),
        );
        szene.tweens.add({ targets: teile, scaleX: 1, duration: 80, ease: 'Cubic.easeOut' });
        ausblenden(szene, teile, 380, { delay: 160, scaleY: 0 });
        platzen(szene, ort, [farbe, 0xffffff], 6, 160);
        await warten(szene, 80);
      }
      geraeusch.zap(0.5);
      await warten(szene, 120);
    }
    zurueck();
  },

  // Eine Knospe fliegt hoch über den Gegner, blüht auf, und Blitze schlagen ein.
  async blitzschlag(szene, von, nach, stark, farbe) {
    const oben = { x: nach.x, y: 185 }; // unter dem Namensfeld des Gegners
    const knospe = szene.add.circle(0, 0, 18, 0x7be08a).setStrokeStyle(4, farbe).setDepth(VORNE);
    const spur = schweif(szene, knospe, [farbe, 0x7be08a], 0.5);
    geraeusch.wusch(0.2, false);
    await fliegen(szene, knospe, von, oben, { dauer: 480, hoehe: 80, ease: 'Sine.easeOut' });
    schweifBeenden(szene, spur);
    knospe.destroy();

    geraeusch.plopp(1.4);
    const bluete = szene.add.star(oben.x, oben.y, 6, 14, 46, farbe).setStrokeStyle(4, 0xffffff).setDepth(VORNE).setScale(0.2);
    const schein = licht(szene, oben, farbe, 1).setAlpha(0.8);
    await tween(szene, { targets: bluete, scale: stark ? 1.4 : 1, rotation: 1, duration: 220, ease: 'Back.easeOut' });

    for (let b = 0; b < (stark ? 3 : 2); b += 1) {
      geraeusch.donner(stark);
      blitzZeichnen(szene, oben, { x: nach.x + zufall(-40, 40), y: nach.y + 50 }, farbe, stark, { ausschlag: 40 });
      szene.cameras.main.flash(70, 255, 250, 200);
      await warten(szene, 190);
    }
    ausblenden(szene, [bluete, schein], 300, { scale: 0, rotation: 3 });
  },

  // Riesige Steinzähne schnappen um den Gegner zu.
  async biss(szene, von, nach, stark, farbe, { angreifer, richtung }) {
    const zurueck = await hinlaufen(szene, angreifer, nach, richtung, 200);
    const g = stark ? 1.25 : 1;
    const zahnreihe = (oben) => {
      const reihe = szene.add.graphics();
      const spitze = oben ? 62 : -62;
      reihe.fillStyle(0x8a7a66).fillRoundedRect(-125, oben ? -30 : 0, 250, 30, 10);
      for (let i = -2; i <= 2; i += 1) {
        reihe.fillStyle(0xfff8ea).fillTriangle(i * 46 - 21, 0, i * 46 + 21, 0, i * 46, spitze);
        reihe.lineStyle(4, 0x5a4f44).strokeTriangle(i * 46 - 21, 0, i * 46 + 21, 0, i * 46, spitze);
      }
      return reihe.setPosition(nach.x, nach.y + (oben ? -190 : 190) * g).setScale(g).setDepth(VORNE).setAlpha(0);
    };
    const oben = zahnreihe(true);
    const unten = zahnreihe(false);
    await tween(szene, { targets: [oben, unten], alpha: 1, duration: 110 });

    for (let biss = 0; biss < (stark ? 2 : 1); biss += 1) {
      if (biss > 0) {
        await Promise.all([
          tween(szene, { targets: oben, y: nach.y - 150 * g, duration: 120 }),
          tween(szene, { targets: unten, y: nach.y + 150 * g, duration: 120 }),
        ]);
      }
      await Promise.all([
        tween(szene, { targets: oben, y: nach.y - 58 * g, duration: 120, ease: 'Back.easeIn' }),
        tween(szene, { targets: unten, y: nach.y + 58 * g, duration: 120, ease: 'Back.easeIn' }),
      ]);
      geraeusch.schnapp();
      szene.cameras.main.shake(120, 0.008);
      platzen(szene, nach, [farbe, 0x8a7a66, 0xffffff], 14, 220);
      await warten(szene, 140);
    }
    ausblenden(szene, [oben, unten], 250, { scale: g * 1.3 });
    zurueck();
  },

  // Ein Wasserwirbel dreht sich um den Gegner und hebt ihn fast hoch.
  async wirbel(szene, von, nach, stark, farbe) {
    const dauer = stark ? 1100 : 800;
    geraeusch.wasserWirbel(dauer / 1000 + 0.3);
    await salve(szene, von, nach, {
      anzahl: 3,
      abstand: 50,
      farben: [farbe, 0xd8f4ff],
      hoehe: 30,
      streuung: 20,
      schweifGroesse: 0.4,
      machen: () => szene.add.circle(0, 0, 16, 0x5ec8ff, 0.6).setStrokeStyle(3, 0xe8faff),
    });

    const anzahl = stark ? 30 : 20;
    const blasen = [];
    for (let i = 0; i < anzahl; i += 1) {
      blasen.push({
        bild: szene.add.circle(nach.x, nach.y, zufall(8, 18), 0x5ec8ff, 0.6).setStrokeStyle(3, 0xe8faff).setDepth(VORNE),
        winkel: (i / anzahl) * Math.PI * 2 * 3,
        hoehe: i / anzahl,
      });
    }
    const ringe = [0, 1, 2].map((i) =>
      szene.add.ellipse(nach.x, nach.y + 100 - i * 90, 260 - i * 50, 50, 0xffffff, 0).setStrokeStyle(5, farbe, 0.7).setDepth(VORNE),
    );
    const lauf = { t: 0 };
    await tween(szene, {
      targets: lauf,
      t: 1,
      duration: dauer,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        for (const blase of blasen) {
          const w = blase.winkel + lauf.t * Math.PI * 8;
          const radius = (130 - blase.hoehe * 50) * (0.5 + 0.5 * lauf.t);
          const y = nach.y + 110 - blase.hoehe * 250 * Math.min(1, lauf.t * 1.6);
          blase.bild.setPosition(nach.x + Math.cos(w) * radius, y + Math.sin(w) * radius * 0.22);
          // hinten durchsichtiger als vorne, so sieht es rund aus
          blase.bild.setAlpha(Math.sin(w) > 0 ? 0.9 : 0.3);
        }
        ringe.forEach((ring, i) => ring.setRotation(Math.sin(lauf.t * 12 + i) * 0.15).setScale(1 + lauf.t * 0.2));
      },
    });
    for (const blase of blasen) ausblenden(szene, blase.bild, 260, { scale: 1.8, y: blase.bild.y - 30 });
    ausblenden(szene, ringe, 300, { scale: 1.6 });
    druckwelle(szene, nach, 0xd8f4ff, 220, 6);
  },

  // Silberne Fäden fliegen los und wickeln sich um den Gegner.
  async faden(szene, von, nach, stark, farbe, { getroffener }) {
    const faeden = [];
    for (let i = 0; i < (stark ? 3 : 2); i += 1) {
      geraeusch.faden(1 + i * 0.3);
      const stift = szene.add.graphics().setDepth(VORNE);
      const mitteY = nach.y - 60 + i * 60;
      const neigung = zufall(-0.25, 0.25);
      const punktAm = (u) => {
        // erst ein Bogen zum Gegner, dann einmal ganz um ihn herum
        const aufDemRing = (w) => ({ x: nach.x + Math.cos(w) * 120, y: mitteY + Math.sin(w) * 38 + Math.cos(w) * 120 * neigung });
        if (u >= 0.4) return aufDemRing(Math.PI + ((u - 0.4) / 0.6) * Math.PI * 2);
        const v = u / 0.4;
        const ziel = aufDemRing(Math.PI);
        return { x: von.x + (ziel.x - von.x) * v, y: von.y + (ziel.y - von.y) * v - Math.sin(v * Math.PI) * 90 };
      };
      const lauf = { t: 0 };
      await tween(szene, {
        targets: lauf,
        t: 1,
        duration: 340,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          stift.clear();
          const schritte = Math.max(2, Math.floor(60 * lauf.t));
          for (const [breite, ton, deckkraft] of [[11, farbe, 0.35], [4, 0xffffff, 0.95]]) {
            stift.lineStyle(breite, ton, deckkraft).beginPath();
            for (let n = 0; n <= schritte; n += 1) {
              const punkt = punktAm((n / schritte) * lauf.t);
              if (n === 0) stift.moveTo(punkt.x, punkt.y);
              else stift.lineTo(punkt.x, punkt.y);
            }
            stift.strokePath();
          }
        },
      });
      faeden.push(stift);
    }

    // Die Fäden ziehen sich zusammen und reißen dann.
    await tween(szene, { targets: getroffener, scaleX: getroffener.scaleX * 0.82, duration: 160, yoyo: true, ease: 'Sine.easeInOut' });
    geraeusch.fadenReissen();
    platzen(szene, nach, [farbe, 0xffffff], 14, 200);
    ausblenden(szene, faeden, 260);
  },

  // Eine Nuss fliegt hoch, landet beim Gegner, glüht ... und knallt!
  async bombe(szene, von, nach, stark) {
    const nuss = szene.add
      .container(0, 0, [
        szene.add.ellipse(0, 8, 56, 64, 0xa0703a).setStrokeStyle(4, 0x5a3a1a),
        szene.add.ellipse(0, -20, 64, 26, 0x6b4423).setStrokeStyle(4, 0x3a2410),
        szene.add.rectangle(0, -36, 8, 16, 0x3a2410),
      ])
      .setDepth(VORNE)
      .setScale(stark ? 1.3 : 1);
    szene.tweens.add({ targets: nuss, rotation: Math.PI * 3, duration: 820 });
    geraeusch.pfeifenFallen(0.8);
    const boden = { x: nach.x, y: nach.y + 70 };
    await fliegen(szene, nuss, von, boden, { dauer: 820, hoehe: 280, ease: 'Sine.easeIn' });
    nuss.setRotation(0);
    geraeusch.rumpeln();

    // Ein kleiner Hüpfer, dann blinkt sie rot.
    await tween(szene, { targets: nuss, y: boden.y - 40, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
    const schale = nuss.list[0];
    for (let i = 0; i < 3; i += 1) {
      schale.setFillStyle(0xff6040);
      geraeusch.tick();
      await warten(szene, 90);
      schale.setFillStyle(0xa0703a);
      await warten(szene, 70);
    }

    // Bumm!
    geraeusch.explosion(stark);
    nuss.destroy();
    szene.cameras.main.flash(160, 255, 200, 120);
    szene.cameras.main.shake(stark ? 420 : 300, stark ? 0.018 : 0.012);
    const feuer = licht(szene, boden, 0xffb347, 1);
    ausblenden(szene, feuer, 420, { scale: stark ? 9 : 7, ease: 'Cubic.easeOut' });
    druckwelle(szene, boden, 0xffb347, stark ? 320 : 240, 10);
    szene.time.delayedCall(100, () => druckwelle(szene, boden, 0xffe066, 200, 6));
    platzen(szene, boden, [0xffb347, 0xff6040, 0xffe066, 0xa0703a], stark ? 46 : 30, 360);
    for (let i = 0; i < (stark ? 10 : 6); i += 1) {
      const rauch = szene.add
        .circle(boden.x + zufall(-90, 90), boden.y + zufall(-60, 20), zufall(26, 48), 0x6b5a50, 0.7)
        .setDepth(VORNE);
      ausblenden(szene, rauch, zufall(700, 1100), { scale: 2, y: rauch.y - 90 });
    }
  },

  // Mit dem Schweif ausholen: ein großer, glitzernder Bogen
  async hieb(szene, von, nach, stark, farbe, { angreifer, richtung }) {
    const zurueck = await hinlaufen(szene, angreifer, nach, richtung, 220);
    for (let schlag = 0; schlag < (stark ? 2 : 1); schlag += 1) {
      geraeusch.wusch(0.4, true);
      szene.tweens.add({ targets: angreifer, angle: richtung * (schlag % 2 ? -18 : 18), duration: 90, yoyo: true });
      const stift = szene.add.graphics().setDepth(VORNE).setBlendMode(Phaser.BlendModes.ADD);
      const anfang = schlag % 2 ? Math.PI * 0.75 : -Math.PI * 0.75;
      const weite = (schlag % 2 ? -1 : 1) * Math.PI * 1.1 * richtung;
      const lauf = { t: 0 };
      await tween(szene, {
        targets: lauf,
        t: 1,
        duration: 170,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          stift.clear();
          for (const [breite, ton, deckkraft] of [[34, farbe, 0.35], [12, 0xffffff, 1]]) {
            stift.lineStyle(breite, ton, deckkraft).beginPath();
            stift.arc(nach.x, nach.y, 140, anfang, anfang + weite * lauf.t, weite < 0);
            stift.strokePath();
          }
        },
      });
      geraeusch.klirren();
      platzen(szene, nach, [farbe, 0xc9b8ff, 0xffffff], 16, 260);
      ausblenden(szene, stift, 260);
      await warten(szene, 120);
    }
    zurueck();
  },

  // Eine goldene Krone erscheint über dem Gegner und lässt Blitze regnen.
  async krone(szene, von, nach, stark, farbe) {
    const ort = { x: nach.x, y: nach.y - 200 };
    const zeichnung = szene.add.graphics();
    zeichnung.fillStyle(0xffe066).lineStyle(5, 0xb8860b);
    const zacken = [[-60, 30], [-60, -20], [-35, 5], [0, -40], [35, 5], [60, -20], [60, 30]];
    zeichnung.beginPath();
    zeichnung.moveTo(zacken[0][0], zacken[0][1]);
    for (const [x, y] of zacken.slice(1)) zeichnung.lineTo(x, y);
    zeichnung.closePath().fillPath().strokePath();
    for (const [x, y] of [[-60, -20], [0, -40], [60, -20]]) zeichnung.fillStyle(farbe).fillCircle(x, y, 9);
    const schein = licht(szene, { x: 0, y: 0 }, 0xffe066, 2.5).setAlpha(0.7);
    const krone = szene.add.container(ort.x, ort.y, [schein, zeichnung]).setDepth(VORNE).setScale(0);

    geraeusch.krone();
    await tween(szene, { targets: krone, scale: stark ? 1.3 : 1, duration: 300, ease: 'Back.easeOut' });
    szene.tweens.add({ targets: krone, angle: { from: -8, to: 8 }, duration: 160, yoyo: true, repeat: -1 });
    for (let b = 0; b < (stark ? 4 : 2); b += 1) {
      geraeusch.zap(0.8);
      blitzZeichnen(szene, { x: ort.x + zufall(-40, 40), y: ort.y + 30 }, { x: nach.x + zufall(-50, 50), y: nach.y + zufall(-20, 60) }, farbe, stark, { zacken: 6, ausschlag: 30, dauer: 110 });
      platzen(szene, nach, [farbe, 0xffe066], 6, 160);
      await warten(szene, 150);
    }
    szene.tweens.killTweensOf(krone);
    ausblenden(szene, krone, 260, { y: ort.y - 50, scale: 0.4 });
  },

  // Das geheime Kalamprio: ein Sternenregen
  async geheim(szene, von, nach, stark, farbe) {
    await salve(szene, von, nach, {
      anzahl: stark ? 9 : 5,
      abstand: 70,
      farben: [farbe, 0xffe066],
      hoehe: 90,
      streuung: 60,
      beimAbschuss: (i) => i % 2 === 0 && geraeusch.sternchen(),
      machen: (i) => {
        const stern = szene.add.star(0, 0, 5, 12, 30, i % 2 ? 0xff6fcf : 0xffe066).setStrokeStyle(3, 0xffffff);
        szene.tweens.add({ targets: stern, rotation: Math.PI * 4, duration: 900 });
        return stern;
      },
    });
  },
};

// --------------------------------------------------------------- Ablauf

// Bei diesen Attacken läuft der Angreifer zum Gegner hin.
const NAHKAMPF = ['krallen', 'biss', 'hieb'];

// Der Angriff geht daneben: Ein bisschen Staub und Glitzer, wo er auftrifft.
function insLeere(szene, ort, farbe) {
  geraeusch.daneben();
  platzen(szene, ort, [farbe, 0xffffff], 8, 120);
  const wolke = szene.add.circle(ort.x, ort.y, 26, 0xd9c9ff, 0.35).setDepth(VORNE);
  ausblenden(szene, wolke, 500, { scale: 2.4 });
}

// Der Gegner springt hoch und zur Seite, die Attacke saust unter ihm durch.
// Das Atmen und Schweben hält so lange an.
function ausweichen(szene, bild, richtung) {
  const start = { x: bild.x, y: bild.y };
  const lebendig = szene.tweens.getTweensOf(bild);
  lebendig.forEach((laufend) => laufend.pause());
  bild.setData('angehalten', lebendig);
  szene.time.delayedCall(80, () => geraeusch.ausweichen());
  return tween(szene, {
    targets: bild,
    x: start.x + richtung * 90,
    y: start.y - 150,
    angle: richtung * 14,
    duration: 260,
    ease: 'Quad.easeOut',
  });
}

async function zurueckLanden(szene, bild, start) {
  await tween(szene, { targets: bild, x: start.x, y: start.y, angle: 0, duration: 320, ease: 'Bounce.easeOut' });
  geraeusch.landen();
  for (const laufend of bild.getData('angehalten') ?? []) laufend.resume();
}

// Der Gegner wehrt ab: Vor ihm leuchtet kurz ein Schild auf, und er wird nur
// ein kleines Stück zurückgeschoben.
async function abwehren(szene, bild, farbe, richtung) {
  const ort = mitte(bild);
  geraeusch.abwehren();
  szene.cameras.main.shake(120, 0.003);
  const schild = szene.add
    .ellipse(ort.x - richtung * bild.displayWidth * 0.45, ort.y, 60, bild.displayHeight * 0.9, 0xd9c9ff, 0.35)
    .setStrokeStyle(6, 0xffffff, 0.9)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(VORNE)
    .setScale(0.4, 0.6);
  platzen(szene, { x: schild.x, y: ort.y }, [farbe, 0xffffff], 12, 200);
  szene.tweens.add({ targets: schild, scaleX: 1, scaleY: 1, duration: 140, ease: 'Back.easeOut' });
  ausblenden(szene, schild, 400, { delay: 250 });
  await tween(szene, { targets: bild, x: bild.x + richtung * 15, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
}

// Spielt die ganze Attacke: aufladen, fliegen, treffen.
//   aussehen:  ein Kurzname aus elemente.js oder 'herz' (bestimmt, was fliegt)
//   element:   das Element des Angreifers (bestimmt die Farbe beim Aufladen)
//   angreifer: das Bild des Angreifers, getroffener: das Bild des Gegners
//   richtung:  1, wenn der Angreifer nach rechts schießt, sonst -1
//   ausgang:   wie es ausgeht: 'treffer', 'daneben' (fliegt am Gegner
//              vorbei), 'ausgewichen' (der Gegner springt weg) oder
//              'abgewehrt' (der Gegner hält einen Schild davor)
export async function attackeAnimieren(szene, aussehen, element, angreifer, getroffener, stark, richtung, ausgang = 'treffer') {
  bilderErzeugen(szene);
  const farbe = aussehen === 'herz' ? 0xff6f9c : (ELEMENTE[aussehen] ?? ELEMENTE[element])?.farbe ?? 0xc9b8ff;
  const hell = mischen(farbe, 0xffffff, 0.55);
  const effekt = EFFEKTE[aussehen] ?? EFFEKTE.mond;

  await aufladen(szene, angreifer, farbe, hell, stark);

  // Kurzer Ruck nach vorn beim Abschießen. Wer zum Gegner hinläuft, braucht ihn nicht.
  if (!NAHKAMPF.includes(aussehen)) {
    szene.tweens.add({ targets: angreifer, x: angreifer.x + richtung * 45, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
  }

  // Wer danebenhaut, zielt über den Gegner hinweg.
  const ziel = mitte(getroffener);
  if (ausgang === 'daneben') {
    ziel.x += richtung * 160;
    ziel.y -= getroffener.displayHeight * 0.55;
  }
  const start = { x: getroffener.x, y: getroffener.y };
  if (ausgang === 'ausgewichen') ausweichen(szene, getroffener, richtung);

  await effekt(szene, mitte(angreifer), ziel, stark, farbe, { angreifer, getroffener, richtung });

  if (ausgang === 'treffer') await treffen(szene, getroffener, farbe, hell, stark, richtung);
  if (ausgang === 'abgewehrt') await abwehren(szene, getroffener, farbe, richtung);
  if (ausgang === 'daneben') insLeere(szene, ziel, farbe);
  if (ausgang === 'ausgewichen') await zurueckLanden(szene, getroffener, start);
}
