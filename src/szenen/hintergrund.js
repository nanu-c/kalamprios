// Malt eine einfache lila Landschaft mit Kristallen und Bäumen.
// Das ist nur ein Platzhalter, bis es ein gemaltes Landschaftsbild gibt.

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

export function hintergrundMalen(szene) {
  const stift = szene.add.graphics();

  // Himmel: viele Streifen, oben dunkel und unten heller.
  const streifen = 40;
  const streifenHoehe = HORIZONT / streifen;
  for (let i = 0; i < streifen; i += 1) {
    stift.fillStyle(mischen(0x170b2c, 0x7a48b8, i / (streifen - 1)));
    stift.fillRect(0, i * streifenHoehe, BREITE, streifenHoehe + 1);
  }

  // Mond mit Schein
  stift.fillStyle(0xf3e9ff, 0.12);
  stift.fillCircle(640, 210, 120);
  stift.fillStyle(0xf3e9ff, 0.95);
  stift.fillCircle(640, 210, 62);

  kristall(stift, 70, 70, 190, 0x6b4fd8);
  kristall(stift, 560, 60, 150, 0x5b8fe0);
  kristall(stift, 725, 80, 210, 0x8a5be0);
  kristall(stift, 1215, 70, 170, 0x5b8fe0);
  baum(stift, 150, 250);
  baum(stift, 480, 200);
  baum(stift, 810, 230);
  baum(stift, 1140, 260);

  // Boden
  stift.fillStyle(0x3b2170);
  stift.fillRect(0, HORIZONT, BREITE, HOEHE - HORIZONT);
  stift.fillStyle(0x4e2e8f);
  stift.fillRect(0, HORIZONT, BREITE, 10);
}
