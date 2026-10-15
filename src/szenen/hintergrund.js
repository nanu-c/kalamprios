// Malt eine einfache lila Landschaft als Hintergrund, passend zum Ort:
// 'wald', 'dorf', 'mine' oder 'see'. 'geschichte' ist der Wald ohne Kristalle,
// die stellt die Geschichte selbst hin, damit sie dunkel werden können.
// Das ist nur ein Platzhalter, bis es gemalte Landschaftsbilder gibt.
// Kristalle und Gold glitzern, am See bewegt sich das Wasser.

import Phaser from 'phaser';
import { bilderErzeugen } from './landschaft.js';
import { BREITE, HOEHE } from './stil.js';

const HORIZONT = 470;

// Mischt zwei Farben. anteil 0 ergibt die erste, anteil 1 die zweite.
function mischen(farbeA, farbeB, anteil) {
  const kanal = (verschiebung) => {
    const a = (farbeA >> verschiebung) & 0xff;
    const b = (farbeB >> verschiebung) & 0xff;
    return Math.round(a + (b - a) * anteil) << verschiebung;
  };
  return kanal(16) | kanal(8) | kanal(0);
}

function kristall(stift, x, breite, hoehe, farbe) {
  stift.fillStyle(mischen(farbe, 0xffffff, 0.35));
  stift.fillTriangle(x - breite / 2, HORIZONT, x, HORIZONT - hoehe, x, HORIZONT);
  stift.fillStyle(farbe);
  stift.fillTriangle(x, HORIZONT, x, HORIZONT - hoehe, x + breite / 2, HORIZONT);
}

function baum(stift, x, hoehe) {
  stift.fillStyle(0x24103f);
  stift.fillRect(x - 9, HORIZONT - hoehe * 0.55, 18, hoehe * 0.55);
  stift.fillStyle(0x7a3cc0);
  stift.fillCircle(x, HORIZONT - hoehe * 0.7, hoehe * 0.3);
  stift.fillStyle(0x9456dc);
  stift.fillCircle(x - hoehe * 0.14, HORIZONT - hoehe * 0.8, hoehe * 0.2);
}

function haus(stift, x, breite) {
  stift.fillStyle(0xbfa9e3);
  stift.fillRect(x - breite / 2, HORIZONT - breite * 0.6, breite, breite * 0.6);
  stift.fillStyle(0x5a2c9a);
  stift.fillTriangle(x - breite * 0.62, HORIZONT - breite * 0.55, x, HORIZONT - breite * 1.15, x + breite * 0.62, HORIZONT - breite * 0.55);
  stift.fillStyle(0xffe9a8);
  stift.fillCircle(x - breite * 0.25, HORIZONT - breite * 0.32, breite * 0.09);
  stift.fillCircle(x + breite * 0.25, HORIZONT - breite * 0.32, breite * 0.09);
}

function himmel(stift, oben, unten) {
  const streifen = 40;
  const streifenHoehe = HORIZONT / streifen;
  for (let i = 0; i < streifen; i += 1) {
    stift.fillStyle(mischen(oben, unten, i / (streifen - 1)));
    stift.fillRect(0, i * streifenHoehe, BREITE, streifenHoehe + 1);
  }
}

function mond(stift, x, y) {
  stift.fillStyle(0xf3e9ff, 0.12);
  stift.fillCircle(x, y, 120);
  stift.fillStyle(0xf3e9ff, 0.95);
  stift.fillCircle(x, y, 62);
}

// Goldklumpen am Boden der Höhle
function gold(stift, x, y) {
  for (const [dx, dy, r] of [[0, 0, 12], [18, 6, 9], [-14, 8, 8]]) {
    stift.fillStyle(0xb07a12);
    stift.fillCircle(x + dx, y + dy, r);
    stift.fillStyle(0xffd166);
    stift.fillCircle(x + dx - r * 0.15, y + dy - r * 0.2, r * 0.75);
    stift.fillStyle(0xfff3c4);
    stift.fillCircle(x + dx - r * 0.35, y + dy - r * 0.4, r * 0.28);
  }
}

// Immer wieder blitzt an einer der Stellen ein kleiner Stern auf.
// Jede Stelle ist ein Rechteck { x, y, breite, hoehe } mit farben.
function funkeln(szene, stellen) {
  szene.time.addEvent({
    delay: 110,
    loop: true,
    callback: () => {
      const stelle = Phaser.Utils.Array.GetRandom(stellen);
      const stern = szene.add
        .image(stelle.x + Math.random() * stelle.breite, stelle.y + Math.random() * stelle.hoehe, 'funkel')
        .setTint(Phaser.Utils.Array.GetRandom(stelle.farben))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0);
      szene.tweens.add({
        targets: stern,
        scale: 0.4 + Math.random() * 0.5,
        angle: 90,
        duration: 300,
        yoyo: true,
        onComplete: () => stern.destroy(),
      });
    },
  });
}

// Für einen Kristall, der bei x steht: wo er glitzern kann.
function kristallStelle(x, breite, hoehe) {
  return { x: x - breite / 2, y: HORIZONT - hoehe, breite, hoehe, farben: [0xffffff, 0xd9c9ff, 0x9cc0f2] };
}

function boden(stift, farbe, kante) {
  stift.fillStyle(farbe);
  stift.fillRect(0, HORIZONT, BREITE, HOEHE - HORIZONT);
  stift.fillStyle(kante);
  stift.fillRect(0, HORIZONT, BREITE, 10);
}

export function hintergrundMalen(szene, stil = 'wald') {
  bilderErzeugen(szene); // für den Glitzerstern
  const stift = szene.add.graphics();

  if (stil === 'mine') {
    // Eine Höhle: dunkle Decke mit glänzenden Adern, Prismastahl am Boden.
    himmel(stift, 0x0f0a1a, 0x3a2f55);
    stift.fillStyle(0x1a1328);
    for (let x = 0; x < BREITE; x += 80) stift.fillTriangle(x, 0, x + 40, 70 + (x % 160) * 0.5, x + 80, 0);
    const adern = [0xb8c4d9, 0x8ef0ff, 0xff9ad5, 0xffd166];
    for (let i = 0; i < 12; i += 1) {
      stift.lineStyle(3, adern[i % 4], 0.6);
      stift.lineBetween(i * 110 + 20, 40 + (i % 4) * 60, i * 110 + 80, 70 + (i % 4) * 60);
    }
    kristall(stift, 90, 80, 200, 0x8f9bb8);
    kristall(stift, 600, 60, 140, 0x8a5be0);
    kristall(stift, 700, 90, 230, 0x8f9bb8);
    kristall(stift, 1190, 80, 180, 0x5b8fe0);
    boden(stift, 0x2b2340, 0x4a4063);
    for (const x of [200, 470, 1010, 1130]) gold(stift, x, HORIZONT + 30 + (x % 3) * 12);
    funkeln(szene, [
      kristallStelle(90, 80, 200),
      kristallStelle(700, 90, 230),
      kristallStelle(1190, 80, 180),
      ...[200, 470, 1010, 1130].map((x) => ({
        x: x - 25,
        y: HORIZONT + 15,
        breite: 50,
        hoehe: 40,
        farben: [0xffe9a8, 0xffd166, 0xffffff],
      })),
      { x: 0, y: 20, breite: BREITE, hoehe: 260, farben: [0xffd166, 0x8ef0ff, 0xff9ad5] },
    ]);
    return;
  }

  if (stil === 'see') {
    // Der Mondsee: Der Mond spiegelt sich im Wasser.
    himmel(stift, 0x0f0b33, 0x4a4aa8);
    mond(stift, 640, 180);
    baum(stift, 140, 240);
    baum(stift, 1150, 260);
    kristall(stift, 1240, 60, 160, 0x5b8fe0);
    boden(stift, 0x2f2a6a, 0x8a76b8);
    stift.fillStyle(0x1d2f6e);
    stift.fillRect(0, HORIZONT + 10, BREITE, 70);
    stift.fillStyle(0xf3e9ff, 0.7);
    for (let i = 0; i < 4; i += 1) stift.fillEllipse(640, HORIZONT + 22 + i * 15, 130 - i * 25, 6);
    // Das Wasser glitzert und bewegt sich.
    szene.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const glanz = szene.add
          .ellipse(Math.random() * BREITE, HORIZONT + 16 + Math.random() * 58, 20 + Math.random() * 40, 4, 0xe8f2ff)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        szene.tweens.add({
          targets: glanz,
          alpha: 0.6,
          x: glanz.x + 24,
          duration: 700 + Math.random() * 500,
          yoyo: true,
          onComplete: () => glanz.destroy(),
        });
      },
    });
    funkeln(szene, [kristallStelle(1240, 60, 160)]);
    return;
  }

  himmel(stift, 0x170b2c, 0x7a48b8);
  mond(stift, 640, 210);

  if (stil === 'dorf') {
    haus(stift, 170, 150);
    haus(stift, 1100, 170);
    kristall(stift, 560, 60, 150, 0x8ef0ff);
    kristall(stift, 725, 80, 210, 0x8a5be0);
    baum(stift, 400, 200);
    baum(stift, 880, 220);
    boden(stift, 0x4a2a80, 0x9a84c8);
    funkeln(szene, [kristallStelle(560, 60, 150), kristallStelle(725, 80, 210)]);
    return;
  }

  if (stil !== 'geschichte') {
    kristall(stift, 70, 70, 190, 0x6b4fd8);
    kristall(stift, 560, 60, 150, 0x5b8fe0);
    kristall(stift, 725, 80, 210, 0x8a5be0);
    kristall(stift, 1215, 70, 170, 0x5b8fe0);
    funkeln(szene, [
      kristallStelle(70, 70, 190),
      kristallStelle(560, 60, 150),
      kristallStelle(725, 80, 210),
      kristallStelle(1215, 70, 170),
    ]);
  }
  baum(stift, 150, 250);
  baum(stift, 480, 200);
  baum(stift, 810, 230);
  baum(stift, 1140, 260);
  boden(stift, 0x3b2170, 0x4e2e8f);
}
