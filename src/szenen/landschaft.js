// Malt die Orte: Boden, hohes Gras, Bäume, Häuser, Felsen, Kristalle, Gold,
// Seen und Höhleneingänge. Der Mondsee, zwei der Bäume, die Häuser, die Pilze,
// der dunkle Kristall und die Steine am Rand der Mine sind gemalt (die Bilder
// liegen in public/bilder/landschaft), der Rest ist noch Platzhalter. Zwei der
// Häuser hat eine Bild-KI im Stil des gemalten Hauses gemalt.

import Phaser from 'phaser';
import { ORTE } from '../daten/orte.js';
import { AUSGANG_BREITE, hinterDemAusgang, pilzringPilze, weltGrenzen } from '../welt/weltlogik.js';
import { umgebung } from '../klang/geraeusche.js';
import { nachtblumenPflanzen } from './nachtblumen.js';
import { seeBilderMalen } from './seeBilder.js';
import { BREITE as BILDSCHIRM_BREITE, HOEHE as BILDSCHIRM_HOEHE, schrift } from './stil.js';

const BILDSCHIRM = { breite: BILDSCHIRM_BREITE, hoehe: BILDSCHIRM_HOEHE };

// Tiefe für Licht, das auch durch die Dunkelheit in der Höhle scheint.
// Die Dunkelheit selbst liegt bei DUNKEL_TIEFE, darunter.
export const DUNKEL_TIEFE = 90000;
export const LICHT_TIEFE = 91000;

// Die Bäume: einer ist mit dem Computer gemalt, zwei sind von Hand gemalt.
// groesse sagt, wie stark das Bild verkleinert wird.
const BAUM_ARTEN = [
  { name: 'baum', groesse: 1 },
  { name: 'baum-rund', groesse: 0.58 },
  { name: 'baum-schief', groesse: 0.58 },
];

// Die gemalten Steine mit Kristallen, die rund um die Mine am Rand liegen.
const RANDSTEINE = ['stein', 'stein-schale', 'stein-beine'];
const RANDSTEIN_BREITE = 190;
// Die Farben, in denen die Kristalle auf den Steinen leuchten
const RANDSTEIN_LICHT = [0x6fe8ff, 0xff6fb8, 0x8ab8ff];

// Die gemalten Häuser kommen reihum dran, alle gleich hoch.
const HAUS_BILDER = ['haus-1', 'haus-2', 'haus-3'];
const HAUS_HOEHE = 300;
// Was in jedem Haus leuchtet (Anteil von Breite und Höhe des Bildes, von oben
// links gezählt): Lampen leuchten warm und flackern ein bisschen, Fenster
// leuchten sanft. groesse ist der Anteil der Hausbreite.
const HAUS_LICHTER = {
  'haus-1': {
    lampen: [{ x: 0.755, y: 0.61, groesse: 0.5 }],
    fenster: [{ x: 0.53, y: 0.17, groesse: 0.35 }, { x: 0.68, y: 0.54, groesse: 0.4 }],
    // Die Lichterkette quer durchs Haus: von links nach rechts, in der Mitte hängt sie durch.
    kette: { von: { x: 0.25, y: 0.44 }, bis: { x: 0.87, y: 0.415 }, durchhaengen: 0.035, lichter: 7 },
  },
  'haus-2': {
    lampen: [],
    fenster: [{ x: 0.36, y: 0.505, groesse: 0.45 }, { x: 0.86, y: 0.58, groesse: 0.25 }],
  },
  'haus-3': {
    lampen: [{ x: 0.317, y: 0.6, groesse: 0.22 }],
    fenster: [{ x: 0.178, y: 0.64, groesse: 0.25 }, { x: 0.792, y: 0.64, groesse: 0.25 }],
  },
};
const LAMPEN_LICHT = 0xffc861;
const FENSTER_LICHT = 0xffe9a8;

// So groß stehen der gemalte dunkle Kristall und ein Pilz da (Anteil vom Bild).
const DUNKLER_KRISTALL_GROESSE = 0.55;
const PILZ_GROESSE = 0.5;

// Der Pilzkopf ist eine Lampe: Er strahlt nach unten, und aus den weißen
// Punkten steigt Licht nach oben. Wo die Punkte und der Rand des Kopfes im
// Bild liegen (Anteil von Breite und Höhe, von oben links gezählt):
const PILZ_PUNKTE = [
  [0.67, 0.09], [0.58, 0.1], [0.42, 0.11], [0.51, 0.16],
  [0.82, 0.18], [0.64, 0.2], [0.22, 0.2], [0.34, 0.21],
];
const PILZ_KOPF_UNTEN = 0.3;
const PILZ_LICHT = 0xffd6b8;

// Wo im gemalten Mondsee der Mond liegt (Anteil von Breite und Höhe des Bildes).
const MOND_IM_SEE = { x: 0.44, y: 0.49, breite: 0.14, hoehe: 0.22 };

// Jedes Bild: wie groß es ist und wo der Fuß sitzt (in Pixeln von oben).
// Gemalte Bilder fehlen hier, bei ihnen sitzt der Fuß ganz unten.
const BILDER = {
  baum: { breite: 220, hoehe: 270, fuss: 255 },
  'kristall-lila': { breite: 110, hoehe: 170, fuss: 160 },
  'kristall-blau': { breite: 110, hoehe: 170, fuss: 160 },
  prismastahl: { breite: 120, hoehe: 180, fuss: 168 },
  felsen: { breite: 170, hoehe: 140, fuss: 126 },
  schild: { breite: 40, hoehe: 90, fuss: 86 },
  gold: { breite: 120, hoehe: 96, fuss: 86 },
  'hoehle-hinein': { breite: 300, hoehe: 280, fuss: 272 },
  'hoehle-hinaus': { breite: 300, hoehe: 280, fuss: 272 },
  funkel: { breite: 32, hoehe: 32, fuss: 16 },
  wolke: { breite: 260, hoehe: 150, fuss: 140 },
  lagerfeuer: { breite: 170, hoehe: 90, fuss: 62 },
  sitzstamm: { breite: 130, hoehe: 50, fuss: 40 },
};

// Farben für Boden und Flecken, je nachdem wie der Ort aussieht.
const BODEN = {
  dorf: { grund: 0x4a2a80, hell: 0x5a36a0, dunkel: 0x3f2370, weg: 0x9a84c8 },
  wald: { grund: 0x3b2170, hell: 0x46288a, dunkel: 0x331b62, weg: 0x6c55a0 },
  mine: { grund: 0x2b2340, hell: 0x372d52, dunkel: 0x211a33, weg: 0x5a4f6e },
  see: { grund: 0x2f2a6a, hell: 0x3a3580, dunkel: 0x28235a, weg: 0x7a6cb0 },
  gang: { grund: 0x29234f, hell: 0x342d64, dunkel: 0x201b40, weg: 0x5d5490 },
  haus: { grund: 0x8a6a4a, hell: 0x9a7a58, dunkel: 0x7a5c3e, weg: 0xb09070 },
  wasser: { grund: 0x1d4a8a, hell: 0x2a62a8, dunkel: 0x123266, weg: 0x4a8ad0 },
  regenwald: { grund: 0x2b5a2e, hell: 0x387238, dunkel: 0x1f4423, weg: 0x6b5a3a },
  himmel: { grund: 0xb3a2e6, hell: 0xc9baf3, dunkel: 0x9d8bd8, weg: 0xf3e9ff },
  garten: { grund: 0x1f3550, hell: 0x27405e, dunkel: 0x182a42, weg: 0x4a6a8a },
};

// Unter Wasser: so hoch ist der Sandboden unten.
const SANDBODEN = 150;

// In der Mine und im Geheimgang ist man unter der Erde: oben eine Felswand,
// am Rand Steine mit Kristallen, und Ausgänge sind Höhlenöffnungen.
function unterDerErde(stil) {
  return stil === 'mine' || stil === 'gang';
}

// Ein Würfel, der bei jedem Spielstart dieselben Zahlen liefert.
// So sieht der Boden immer gleich aus.
function wuerfel(startwert) {
  let zustand = startwert;
  return () => {
    zustand = (zustand + 0x6d2b79f5) | 0;
    let wert = Math.imul(zustand ^ (zustand >>> 15), 1 | zustand);
    wert = (wert + Math.imul(wert ^ (wert >>> 7), 61 | wert)) ^ wert;
    return ((wert ^ (wert >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------ Einzelbilder

function baumMalen(stift) {
  stift.fillStyle(0x24103f);
  stift.fillRect(97, 150, 26, 105);
  stift.fillStyle(0x6f36b3);
  stift.fillCircle(110, 105, 88);
  stift.fillStyle(0x8546cc);
  stift.fillCircle(70, 85, 55);
  stift.fillCircle(145, 72, 48);
  stift.fillStyle(0x9c5fe0);
  stift.fillCircle(88, 62, 30);
}

function kristallMalen(stift, farbe, hell) {
  stift.fillStyle(hell);
  stift.fillTriangle(5, 160, 22, 92, 40, 160);
  stift.fillTriangle(20, 160, 55, 10, 55, 160);
  stift.fillStyle(farbe);
  stift.fillTriangle(55, 160, 55, 10, 90, 160);
  stift.fillTriangle(70, 160, 92, 100, 108, 160);
}

// Prismastahl glänzt silbern und schimmert an den Kanten in allen Farben.
function prismastahlMalen(stift) {
  stift.fillStyle(0xdfe6f5);
  stift.fillTriangle(10, 168, 30, 70, 50, 168);
  stift.fillTriangle(30, 168, 62, 8, 62, 168);
  stift.fillStyle(0x8f9bb8);
  stift.fillTriangle(62, 168, 62, 8, 96, 168);
  stift.fillTriangle(78, 168, 100, 96, 116, 168);
  stift.lineStyle(3, 0xff9ad5, 0.9);
  stift.lineBetween(62, 10, 32, 168);
  stift.lineStyle(3, 0x8ef0ff, 0.9);
  stift.lineBetween(62, 10, 94, 168);
  stift.lineStyle(2, 0xffe066, 0.8);
  stift.lineBetween(30, 72, 12, 168);
}

function felsenMalen(stift) {
  stift.fillStyle(0x4a4063);
  stift.fillEllipse(85, 90, 160, 80);
  stift.fillCircle(70, 66, 50);
  stift.fillCircle(110, 72, 42);
  stift.fillStyle(0x5f5480);
  stift.fillCircle(62, 54, 32);
  stift.fillCircle(108, 62, 24);
  stift.fillStyle(0x7a6e9c);
  stift.fillCircle(56, 44, 13);
}

function schildMalen(stift) {
  stift.fillStyle(0x5a3a2a);
  stift.fillRect(16, 30, 8, 56);
}

// Ein Stein mit glänzenden Goldklumpen.
function goldMalen(stift) {
  stift.fillStyle(0x3a3150);
  stift.fillEllipse(60, 70, 112, 40);
  stift.fillStyle(0x4a4063);
  stift.fillCircle(42, 58, 30);
  stift.fillCircle(78, 60, 26);
  for (const [x, y, r] of [[34, 52, 12], [62, 44, 14], [86, 62, 10], [50, 70, 10], [74, 76, 7]]) {
    stift.fillStyle(0xb07a12);
    stift.fillCircle(x, y, r);
    stift.fillStyle(0xffd166);
    stift.fillCircle(x - r * 0.15, y - r * 0.2, r * 0.75);
    stift.fillStyle(0xfff3c4);
    stift.fillCircle(x - r * 0.35, y - r * 0.4, r * 0.28);
  }
}

// Ein kleiner Stern mit vier Zacken, zum Glitzern.
// Das Lagerfeuer: ein Kreis aus Steinen und gekreuzte Holzscheite darin.
// Die Flammen kommen extra (lagerfeuerAnzuenden), damit sie flackern können.
function lagerfeuerMalen(stift) {
  stift.fillStyle(0x2a1a2a, 0.5);
  stift.fillEllipse(85, 62, 150, 40);
  stift.fillStyle(0x6b3a1e);
  stift.fillRoundedRect(30, 46, 110, 16, 7);
  stift.fillStyle(0x8a4f2a);
  stift.fillRoundedRect(45, 36, 80, 14, 6);
  stift.fillStyle(0xffb347, 0.9);
  stift.fillEllipse(85, 50, 60, 16);
  for (let i = 0; i < 11; i += 1) {
    const winkel = (i / 11) * Math.PI * 2;
    const x = 85 + Math.cos(winkel) * 66;
    const y = 58 + Math.sin(winkel) * 20;
    stift.fillStyle(i % 2 ? 0x8a8098 : 0xa69cb8);
    stift.fillEllipse(x, y, 26, 17);
    stift.fillStyle(0xd8d0e8, 0.6);
    stift.fillEllipse(x - 4, y - 4, 10, 5);
  }
}

// Ein Baumstamm zum Draufsetzen
function sitzstammMalen(stift) {
  stift.fillStyle(0x2a1a2a, 0.4);
  stift.fillEllipse(65, 40, 120, 16);
  stift.fillStyle(0x7a4524);
  stift.fillRoundedRect(8, 14, 114, 26, 12);
  stift.fillStyle(0x9a5f34);
  stift.fillRoundedRect(14, 16, 100, 8, 4);
  stift.fillStyle(0xd8a878);
  stift.fillEllipse(116, 27, 14, 24);
  stift.lineStyle(2, 0x8a5a34);
  stift.strokeEllipse(116, 27, 7, 13);
}

// Eine dicke, weiche Wolke (für den Rand der Sternenwolke)
function wolkeMalen(stift) {
  stift.fillStyle(0x9d8bd8, 0.5);
  stift.fillEllipse(130, 128, 230, 34);
  for (const [x, y, r, farbe] of [
    [70, 100, 46, 0xe8e0ff],
    [190, 100, 50, 0xe8e0ff],
    [130, 92, 56, 0xf3eeff],
    [95, 70, 44, 0xffffff],
    [165, 62, 48, 0xffffff],
    [130, 50, 40, 0xffffff],
  ]) {
    stift.fillStyle(farbe);
    stift.fillCircle(x, y, r);
  }
  stift.fillStyle(0xffffff, 0.8);
  stift.fillEllipse(115, 40, 40, 16);
}

function funkelMalen(stift) {
  stift.fillStyle(0xffffff);
  stift.fillTriangle(16, 0, 19, 16, 13, 16);
  stift.fillTriangle(16, 32, 19, 16, 13, 16);
  stift.fillTriangle(0, 16, 16, 13, 16, 19);
  stift.fillTriangle(32, 16, 16, 13, 16, 19);
  stift.fillCircle(16, 16, 4);
}

// Ein Höhleneingang: ein Felsenberg mit einer Öffnung und Holzbalken wie in
// einem Bergwerk. Von draußen ist die Öffnung schwarz, von drinnen leuchtet
// dort das Licht von draußen herein.
function hoehleMalen(stift, hinaus) {
  stift.fillStyle(0x3a3150);
  stift.fillEllipse(150, 190, 300, 170);
  stift.fillStyle(0x4a4063);
  stift.fillCircle(78, 150, 72);
  stift.fillCircle(222, 146, 76);
  stift.fillCircle(150, 110, 84);
  stift.fillStyle(0x5f5480);
  stift.fillCircle(66, 124, 38);
  stift.fillCircle(156, 74, 42);
  stift.fillCircle(236, 116, 34);
  stift.fillStyle(0x7a6e9c);
  stift.fillCircle(58, 110, 14);
  stift.fillCircle(146, 60, 15);
  stift.fillCircle(240, 104, 10);

  // Die Öffnung: unten gerade, oben rund. Von außen nach innen immer dunkler
  // (oder heller, wenn draußen das Licht ist).
  const schichten = hinaus
    ? [[0x8f7fc4, 0], [0xc2b4f0, 8], [0xe8e0ff, 18], [0xffffff, 30]]
    : [[0x1a1328, 0], [0x0d0818, 8], [0x050210, 18], [0x000000, 30]];
  for (const [farbe, rein] of schichten) {
    stift.fillStyle(farbe);
    stift.fillRect(92 + rein, 150, 116 - rein * 2, 122);
    stift.fillCircle(150, 150, 58 - rein);
  }

  // Holzbalken: zwei Pfosten und einer quer darüber
  stift.fillStyle(0x5a3a22);
  stift.fillRect(80, 128, 18, 144);
  stift.fillRect(202, 128, 18, 144);
  stift.fillRect(68, 112, 164, 22);
  stift.fillStyle(0x8a6240);
  stift.fillRect(84, 132, 5, 140);
  stift.fillRect(206, 132, 5, 140);
  stift.fillRect(72, 116, 156, 5);
}

// ------------------------------------------------------------------- Boden

// Mischt zwei Farben. anteil 0 ergibt die erste, anteil 1 die zweite.
function mischen(farbeA, farbeB, anteil) {
  const kanal = (verschiebung) => {
    const a = (farbeA >> verschiebung) & 0xff;
    const b = (farbeB >> verschiebung) & 0xff;
    return Math.round(a + (b - a) * anteil) << verschiebung;
  };
  return kanal(16) | kanal(8) | kanal(0);
}

function flecken(stift, ort, farben, zufall) {
  const anzahl = Math.round((ort.breite * ort.hoehe) / 9000);
  for (let i = 0; i < anzahl; i += 1) {
    stift.fillStyle(zufall() < 0.5 ? farben.hell : farben.dunkel, 0.55);
    stift.fillEllipse(zufall() * ort.breite, zufall() * ort.hoehe, 50 + zufall() * 130, 24 + zufall() * 50);
  }
}

function punkte(stift, ort, farben, anzahl, groesse, zufall) {
  for (let i = 0; i < anzahl; i += 1) {
    stift.fillStyle(farben[i % farben.length], 0.85);
    stift.fillCircle(zufall() * ort.breite, zufall() * ort.hoehe, groesse + zufall() * groesse);
  }
}

// Ein heller Weg vom Ausgang ein Stück in den Ort hinein.
function wegeMalen(stift, ort, farben) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    const lang = ort.stil === 'dorf' ? ort.breite * 0.75 : 380;
    const draussen = hinterDemAusgang(ausgang, grenzen, -200);
    const drinnen = hinterDemAusgang(ausgang, grenzen, lang);
    // Viele Kreise hintereinander: So wird der Weg rund. Erst ein breiter
    // Rand, dann die hellere Mitte.
    const laenge = Math.hypot(drinnen.x - draussen.x, drinnen.y - draussen.y);
    for (const [radius, anteil] of [[60, 0.35], [46, 0.55]]) {
      stift.fillStyle(mischen(farben.grund, farben.weg, anteil));
      for (let weit = 0; weit <= laenge; weit += 10) {
        stift.fillCircle(
          draussen.x + ((drinnen.x - draussen.x) * weit) / laenge,
          draussen.y + ((drinnen.y - draussen.y) * weit) / laenge,
          radius,
        );
      }
    }

    // In der Mine liegen Schienen auf dem Weg.
    if (ort.stil === 'mine') {
      const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
      stift.lineStyle(5, 0x8f9bb8, 0.9);
      for (const seite of [-22, 22]) {
        if (quer) stift.lineBetween(draussen.x, drinnen.y + seite, drinnen.x, drinnen.y + seite);
        else stift.lineBetween(drinnen.x + seite, draussen.y, drinnen.x + seite, drinnen.y);
      }
    }
  }
}

function grasMalen(stift, ort, zufall) {
  for (const gras of ort.hohesGras) {
    if (ort.stil === 'mine') {
      // Geröll: viele kleine Steine
      stift.fillStyle(0x3a3150);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 28);
      for (let y = gras.oben + 16; y < gras.oben + gras.hoehe - 10; y += 20) {
        for (let x = gras.links + 14; x < gras.links + gras.breite - 10; x += 22) {
          stift.fillStyle(zufall() < 0.5 ? 0x6e6488 : 0x857aa3);
          stift.fillEllipse(x + zufall() * 10, y + zufall() * 8, 12 + zufall() * 10, 8 + zufall() * 6);
        }
      }
    } else if (ort.stil === 'wasser') {
      // Seegras: lange, wellige Halme, die vom Boden nach oben wachsen
      for (let x = gras.links + 10; x < gras.links + gras.breite; x += 14) {
        const unten = gras.oben + gras.hoehe + 30;
        const lang = gras.hoehe * (0.6 + zufall() * 0.5);
        stift.lineStyle(5 + zufall() * 4, zufall() < 0.5 ? 0x2f9e78 : 0x4fc49a, 0.9);
        stift.beginPath();
        stift.moveTo(x, unten);
        for (let t = 1; t <= 8; t += 1) stift.lineTo(x + Math.sin(t * 0.9 + x) * 12, unten - (lang * t) / 8);
        stift.strokePath();
      }
    } else if (ort.stil === 'see') {
      // Schilf: dünne Halme mit braunen Kolben
      stift.fillStyle(0x24505a);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 28);
      for (let y = gras.oben + 34; y < gras.oben + gras.hoehe - 4; y += 22) {
        for (let x = gras.links + 14; x < gras.links + gras.breite - 10; x += 16) {
          const hx = x + zufall() * 8;
          const hy = y + zufall() * 6;
          stift.fillStyle(zufall() < 0.5 ? 0x4fae8a : 0x6cc79e);
          stift.fillRect(hx - 1.5, hy - 26, 3, 28);
          if (zufall() < 0.4) {
            stift.fillStyle(0x8a5a3a);
            stift.fillEllipse(hx, hy - 26, 7, 16);
          }
        }
      }
    } else if (ort.stil === 'himmel') {
      // Dicke Wolken: viele weiße, runde Wolkenbäusche übereinander
      stift.fillStyle(0xe2d8fb);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 60);
      for (let y = gras.oben + 30; y < gras.oben + gras.hoehe - 10; y += 34) {
        for (let x = gras.links + 30; x < gras.links + gras.breite - 20; x += 44) {
          stift.fillStyle(zufall() < 0.5 ? 0xffffff : 0xf3ecff, 0.95);
          stift.fillCircle(x + zufall() * 16, y + zufall() * 12, 22 + zufall() * 12);
        }
      }
    } else {
      // Hohes Gras: eine blaugrüne Fläche mit vielen Halmen
      stift.fillStyle(0x245f6b);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 28);
      for (let y = gras.oben + 20; y < gras.oben + gras.hoehe - 8; y += 24) {
        for (let x = gras.links + 16; x < gras.links + gras.breite - 12; x += 22) {
          const hx = x + zufall() * 10;
          const hy = y + zufall() * 8;
          stift.fillStyle(zufall() < 0.5 ? 0x3fa59a : 0x58c7b8);
          stift.fillTriangle(hx - 6, hy + 9, hx, hy - 11, hx + 6, hy + 9);
        }
      }
    }
  }
}

// Ein See mit Ufer, Wellen, Seerosen und dem Spiegelbild des Mondes.
function seenMalen(stift, ort, zufall) {
  for (const see of ort.seen ?? []) {
    if (see.bild) continue; // Gemalte Seen werden als Bild aufgestellt.
    stift.fillStyle(0x8a76b8);
    stift.fillEllipse(see.x, see.y, see.breite + 60, see.hoehe + 50);
    stift.fillStyle(0x1d2f6e);
    stift.fillEllipse(see.x, see.y, see.breite, see.hoehe);
    stift.fillStyle(0x26408a);
    stift.fillEllipse(see.x, see.y, see.breite * 0.8, see.hoehe * 0.78);
    stift.fillStyle(0x2c4c9c);
    stift.fillEllipse(see.x, see.y, see.breite * 0.55, see.hoehe * 0.5);

    // Das Mondlicht auf dem Wasser
    stift.fillStyle(0xf3e9ff, 0.18);
    stift.fillEllipse(see.x, see.y - see.hoehe * 0.12, 220, 120);
    stift.fillStyle(0xf3e9ff, 0.85);
    stift.fillEllipse(see.x, see.y - see.hoehe * 0.12, 110, 54);
    for (let i = 1; i <= 5; i += 1) {
      stift.fillStyle(0xf3e9ff, 0.5 - i * 0.07);
      stift.fillEllipse(see.x, see.y - see.hoehe * 0.12 + i * 34, 120 - i * 14, 8);
    }

    // Wellen
    stift.lineStyle(3, 0x8ec8ff, 0.35);
    for (let i = 0; i < 40; i += 1) {
      const winkel = zufall() * Math.PI * 2;
      const weit = Math.sqrt(zufall()) * 0.85;
      const x = see.x + Math.cos(winkel) * (see.breite / 2) * weit;
      const y = see.y + Math.sin(winkel) * (see.hoehe / 2) * weit;
      stift.lineBetween(x - 18, y, x + 18, y);
    }

    // Seerosen am Rand
    for (let i = 0; i < 14; i += 1) {
      const winkel = zufall() * Math.PI * 2;
      const x = see.x + Math.cos(winkel) * (see.breite / 2) * 0.82;
      const y = see.y + Math.sin(winkel) * (see.hoehe / 2) * 0.8;
      stift.fillStyle(0x3fa59a);
      stift.fillCircle(x, y, 16);
      stift.fillStyle(0xff9ad5);
      stift.fillCircle(x + 4, y - 3, 6);
    }
  }
}

// Die Mine hat oben eine dunkle Felswand mit glänzenden Adern.
function felswandMalen(stift, ort, zufall) {
  stift.fillStyle(0x1a1328);
  stift.fillRect(0, 0, ort.breite, 150);
  for (let x = 0; x < ort.breite; x += 60) {
    stift.fillTriangle(x, 148, x + 30, 175 + zufall() * 25, x + 60, 148);
  }
  const adern = [0xb8c4d9, 0x8ef0ff, 0xff9ad5, 0xffd166];
  for (let i = 0; i < 34; i += 1) {
    const x = zufall() * ort.breite;
    const y = 20 + zufall() * 110;
    stift.lineStyle(3, adern[i % adern.length], 0.7);
    stift.lineBetween(x, y, x + 30 + zufall() * 50, y + 10 + zufall() * 25);
  }
}

// Unter Wasser, von der Seite gesehen: oben hell, wo das Licht hereinkommt,
// nach unten immer dunkler. Lichtstrahlen fallen schräg herab, und unten ist
// der Sandboden mit Kieseln.
function wasserMalen(stift, ort, zufall) {
  const { breite, hoehe } = ort;
  // Viele schmale Streifen von hell nach dunkel (ein Farbverlauf geht beim
  // Malen in ein Bild nicht)
  const streifen = 48;
  for (let i = 0; i < streifen; i += 1) {
    stift.fillStyle(mischen(0x5aa8e0, 0x0b2350, i / (streifen - 1)));
    stift.fillRect(0, (i * hoehe) / streifen, breite, hoehe / streifen + 1);
  }
  // Die Wasseroberfläche oben mit kleinen Wellen
  stift.fillStyle(0x9ad8ff, 0.55);
  stift.fillRect(0, 0, breite, 70);
  for (let x = 0; x < breite; x += 46) stift.fillCircle(x + 23, 70, 24);
  // Lichtstrahlen
  for (let i = 0; i < 9; i += 1) {
    const x = (i + 0.3 + zufall() * 0.4) * (breite / 9);
    stift.fillStyle(0xcfeeff, 0.06 + zufall() * 0.05);
    stift.fillTriangle(x - 40, 0, x + 40, 0, x + 180 + zufall() * 120, hoehe - SANDBODEN);
  }
  // Der Sandboden mit welliger Kante und Kieseln
  const sand = hoehe - SANDBODEN;
  stift.fillStyle(0xb79a78);
  stift.fillRect(0, sand + 20, breite, SANDBODEN);
  for (let x = 0; x < breite; x += 60) stift.fillEllipse(x + 30, sand + 22, 90, 30 + zufall() * 16);
  stift.fillStyle(0xcdb391);
  for (let x = 0; x < breite; x += 80) stift.fillEllipse(x + zufall() * 60, sand + 30 + zufall() * 30, 70, 10);
  for (let i = 0; i < breite / 20; i += 1) {
    stift.fillStyle([0x8a6e98, 0x9c8acb, 0x6e5a80][i % 3], 0.9);
    stift.fillEllipse(zufall() * breite, sand + 40 + zufall() * (SANDBODEN - 50), 8 + zufall() * 10, 5 + zufall() * 5);
  }
}

function bodenMalen(stift, ort) {
  const zufall = wuerfel(ort.breite + ort.hoehe + ort.stil.length);
  const farben = BODEN[ort.stil];
  if (ort.stil === 'wasser') {
    wasserMalen(stift, ort, zufall);
    grasMalen(stift, ort, zufall);
    return;
  }
  stift.fillStyle(farben.grund);
  stift.fillRect(0, 0, ort.breite, ort.hoehe);
  flecken(stift, ort, farben, zufall);

  const flaeche = (ort.breite * ort.hoehe) / 15000;
  if (unterDerErde(ort.stil)) {
    // Glitzernder Kristallstaub
    punkte(stift, ort, [0x8ef0ff, 0xb8c4d9, 0xff9ad5], Math.round(flaeche * 0.8), 1.5, zufall);
  } else if (ort.stil === 'himmel') {
    // Weiche Wolkenflecken und Sternenstaub
    for (let i = 0; i < flaeche * 0.12; i += 1) {
      stift.fillStyle(0xf6f0ff, 0.25 + zufall() * 0.2);
      stift.fillEllipse(zufall() * ort.breite, zufall() * ort.hoehe, 120 + zufall() * 220, 50 + zufall() * 70);
    }
    punkte(stift, ort, [0xffffff, 0xffe9a8, 0xffc8e8], Math.round(flaeche * 1.2), 2, zufall);
  } else {
    // Blüten
    punkte(stift, ort, [0xc9b8ff, 0x8ef0ff, 0xff9ad5], Math.round(flaeche), 2.5, zufall);
  }

  wegeMalen(stift, ort, farben);
  if (ort.stil === 'dorf') {
    // Der Dorfplatz rund um den großen Kristall
    const platz = (ort.kristalle ?? [])[2] ?? { x: ort.breite / 2, y: ort.hoehe / 2 };
    stift.fillStyle(farben.weg, 0.6);
    stift.fillCircle(platz.x, platz.y - 20, 210);
    stift.fillStyle(0xb9a8de, 0.5);
    stift.fillCircle(platz.x, platz.y - 20, 150);
  }
  if (unterDerErde(ort.stil)) felswandMalen(stift, ort, zufall);
  // Schatten am Ufer des gemalten Sees
  for (const see of ort.seen ?? []) {
    if (see.bild) {
      stift.fillStyle(0x170b2c, 0.35);
      stift.fillEllipse(see.x, see.y + 24, see.breite * 1.04, see.hoehe * 1.02);
    }
  }
  seenMalen(stift, ort, zufall);
  grasMalen(stift, ort, zufall);

  // Schatten unter allem, was herumsteht
  stift.fillStyle(0x170b2c, 0.4);
  for (const baum of ort.baeume ?? []) stift.fillEllipse(baum.x, baum.y, 120, 36);
  for (const kristall of ort.kristalle ?? []) stift.fillEllipse(kristall.x, kristall.y, 96, 26);
  for (const pilz of ort.pilze ?? []) stift.fillEllipse(pilz.x, pilz.y, 70, 20);
  for (const pflanze of [...(ort.pflanzen ?? []), ...(ort.deko ?? [])]) stift.fillEllipse(pflanze.x, pflanze.y, pflanze.groesse * 0.55, pflanze.groesse * 0.14);
  if (ort.stil === 'regenwald') regenwaldBodenMalen(stift, ort, zufall);
  if (ort.dunklerKristall) stift.fillEllipse(ort.dunklerKristall.x, ort.dunklerKristall.y, 96, 26);
  for (const stahl of ort.prismastahl ?? []) stift.fillEllipse(stahl.x, stahl.y, 100, 28);
  for (const gold of ort.gold ?? []) stift.fillEllipse(gold.x, gold.y, 110, 30);
  for (const fels of ort.felsen ?? []) stift.fillEllipse(fels.x, fels.y - 4, 170, 40);
  for (const haus of ort.haeuser ?? []) stift.fillEllipse(haus.x, haus.y, 260, 40);
}

// Ein weicher Lichtschein: in der Mitte hell, nach außen immer durchsichtiger.
// Er wird mit der Farbe eingefärbt, in der etwas leuchtet.
export function lichtschein(szene, x, y, breite, hoehe, farbe) {
  return szene.add
    .image(x, y, 'lichtschein')
    .setDisplaySize(breite, hoehe)
    .setTint(farbe)
    .setBlendMode(Phaser.BlendModes.ADD);
}

// Ein Lichtkegel: oben schmal und hell, nach unten breiter und blasser.
function lichtkegelErzeugen(szene) {
  const groesse = 128;
  const leinwand = szene.textures.createCanvas('lichtkegel', groesse, groesse);
  const stift = leinwand.context;
  const verlauf = stift.createLinearGradient(0, 0, 0, groesse);
  verlauf.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  verlauf.addColorStop(1, 'rgba(255, 255, 255, 0)');
  stift.fillStyle = verlauf;
  stift.beginPath();
  stift.moveTo(groesse * 0.2, 0);
  stift.lineTo(groesse * 0.8, 0);
  stift.lineTo(groesse, groesse);
  stift.lineTo(0, groesse);
  stift.closePath();
  stift.fill();
  leinwand.refresh();
}

function lichtscheinErzeugen(szene) {
  const groesse = 128;
  const leinwand = szene.textures.createCanvas('lichtschein', groesse, groesse);
  const stift = leinwand.context;
  const verlauf = stift.createRadialGradient(groesse / 2, groesse / 2, 0, groesse / 2, groesse / 2, groesse / 2);
  verlauf.addColorStop(0, 'rgba(255, 255, 255, 1)');
  verlauf.addColorStop(0.4, 'rgba(255, 255, 255, 0.45)');
  verlauf.addColorStop(1, 'rgba(255, 255, 255, 0)');
  stift.fillStyle = verlauf;
  stift.fillRect(0, 0, groesse, groesse);
  leinwand.refresh();
}

// Malt jedes Bild einmal und merkt es sich unter einem Namen.
export function bilderErzeugen(szene) {
  if (szene.textures.exists('baum')) return;
  lichtscheinErzeugen(szene);
  lichtkegelErzeugen(szene);
  // Die Sachen für die Flaschenpost am Mondsee (das Ölkännchen liegt in der Mine)
  seeBilderMalen(szene);
  const stift = szene.add.graphics();
  const malen = (name, wie) => {
    wie(stift);
    stift.generateTexture(name, BILDER[name].breite, BILDER[name].hoehe);
    stift.clear();
  };
  malen('baum', baumMalen);
  malen('kristall-lila', (s) => kristallMalen(s, 0x8a5be0, 0xb99cf0));
  malen('kristall-blau', (s) => kristallMalen(s, 0x5b8fe0, 0x9cc0f2));
  malen('prismastahl', prismastahlMalen);
  malen('felsen', felsenMalen);
  malen('schild', schildMalen);
  malen('gold', goldMalen);
  malen('funkel', funkelMalen);
  malen('wolke', wolkeMalen);
  malen('lagerfeuer', lagerfeuerMalen);
  malen('sitzstamm', sitzstammMalen);
  malen('hoehle-hinein', (s) => hoehleMalen(s, false));
  malen('hoehle-hinaus', (s) => hoehleMalen(s, true));
  stift.destroy();
}

function bodenErzeugen(szene, schluessel, ort) {
  const name = `boden-${schluessel}`;
  if (!szene.textures.exists(name)) {
    const stift = szene.add.graphics();
    bodenMalen(stift, ort);
    stift.generateTexture(name, ort.breite, ort.hoehe);
    stift.destroy();
  }
  return name;
}

// ---------------------------------------------------------------- Aufbauen

// Wie groß ein Bild ist und wo sein Fuß sitzt.
function masse(szene, name) {
  if (BILDER[name]) return BILDER[name];
  const quelle = szene.textures.get(name).getSourceImage();
  return { breite: quelle.width, hoehe: quelle.height, fuss: quelle.height * 0.97 };
}

// Stellt den Ort mit dem Kurznamen schluessel auf. Gibt zurück:
//   verdecker:   alles, was die Figur verdecken kann (Bäume und Häuser),
//                damit es durchsichtig werden kann
//   verschuettet: die Ausgänge, die noch nicht offen sind (offen sagt das
//                für jeden Ausgang). Davor liegt Geröll, und ihr Schild und
//                ihre Höhle sind versteckt, bis man sie mit wegFreimachen öffnet.
// Was weiter unten steht, verdeckt, was weiter oben steht: Darum bekommt jedes
// Bild als Tiefe sein y.
export function ortAufbauen(szene, schluessel, offen = () => true) {
  const ort = ORTE[schluessel];
  bilderErzeugen(szene);
  // Ein Zimmer hat ein gemaltes Bild als Boden und Wand (bild beim Ort),
  // sonst wird der Boden gemalt.
  if (ort.bild) szene.add.image(0, 0, ort.bild).setOrigin(0).setDisplaySize(ort.breite, ort.hoehe).setDepth(-10);
  else szene.add.image(0, 0, bodenErzeugen(szene, schluessel, ort)).setOrigin(0).setDepth(-10);

  const verdecker = [];
  const stellen = (name, x, y, verdeckt = false, groesse = 1) => {
    const { hoehe, fuss, breite } = masse(szene, name);
    const bild = szene.add.image(x, y, name).setOrigin(0.5, fuss / hoehe).setDepth(y).setScale(groesse);
    if (verdeckt) {
      verdecker.push({ bild, x, y, hoehe: fuss * groesse, halbeBreite: (breite * groesse) / 2 + 10 });
    }
    return bild;
  };
  // Bäume: Welcher es wird, würfelt ein Würfel, der immer gleich würfelt.
  const baumWuerfel = wuerfel(7 + ort.breite + ort.hoehe);
  const baumStellen = (x, y) => {
    const art = BAUM_ARTEN[Math.floor(baumWuerfel() * BAUM_ARTEN.length)];
    const groesse = art.groesse * (0.9 + baumWuerfel() * 0.2);
    stellen(art.name, x, y, true, groesse).setFlipX(baumWuerfel() < 0.5);
  };

  // Was glitzern soll: Kristalle, Prismastahl und Gold.
  const glitzernde = [];
  const licht = ort.dunkel ? LICHT_TIEFE : null;

  for (const baum of ort.baeume ?? []) baumStellen(baum.x, baum.y);
  (ort.haeuser ?? []).forEach((haus, nummer) => {
    const name = HAUS_BILDER[nummer % HAUS_BILDER.length];
    const bild = stellen(name, haus.x, haus.y, true, HAUS_HOEHE / masse(szene, name).hoehe);
    hausLeuchten(szene, bild, HAUS_LICHTER[name]);
  });
  (ort.kristalle ?? []).forEach((punkt, nummer) => {
    const farbe = nummer % 2 === 0 ? 'lila' : 'blau';
    // Im Dorf ist der mittlere Kristall auf dem Platz besonders groß.
    const groesse = ort.stil === 'dorf' && nummer === 2 ? 1.6 : 1;
    stellen(`kristall-${farbe}`, punkt.x, punkt.y, false, groesse);
    const tone = farbe === 'lila' ? [0xd9c9ff, 0xb99cf0, 0xffffff] : [0xc4e0ff, 0x9cc0f2, 0xffffff];
    lichthof(szene, punkt, groesse, tone[1], licht);
    glitzernde.push({ x: punkt.x, y: punkt.y, breite: 90 * groesse, hoehe: 150 * groesse, farben: tone });
  });
  for (const stahl of ort.prismastahl ?? []) {
    stellen('prismastahl', stahl.x, stahl.y);
    glitzernde.push({ x: stahl.x, y: stahl.y, breite: 100, hoehe: 160, farben: [0xffffff, 0xff9ad5, 0x8ef0ff, 0xffe066] });
  }
  for (const gold of ort.gold ?? []) {
    stellen('gold', gold.x, gold.y);
    lichthof(szene, { x: gold.x, y: gold.y + 40 }, 0.6, 0xffd166, licht);
    // Gold glitzert doppelt so oft.
    for (let i = 0; i < 2; i += 1) {
      glitzernde.push({ x: gold.x, y: gold.y, breite: 90, hoehe: 70, farben: [0xffe9a8, 0xffd166, 0xffffff] });
    }
  }
  for (const fels of ort.felsen ?? []) stellen('felsen', fels.x, fels.y);
  // Pflanzen im Regenwald (gemalt mit werkzeuge/pflanzen_malen.py)
  for (const pflanze of [...(ort.pflanzen ?? []), ...(ort.deko ?? [])]) {
    const bild = stellen(`pflanze-${pflanze.art}`, pflanze.x, pflanze.y, true, pflanze.groesse / masse(szene, `pflanze-${pflanze.art}`).hoehe);
    bild.setFlipX(pflanze.x % 3 === 0);
    // Die Pflanzen wiegen sich ein kleines bisschen im Wind.
    szene.tweens.add({ targets: bild, angle: { from: -1.5, to: 1.5 }, duration: 2400 + (pflanze.x % 7) * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  if (ort.stil === 'regenwald') {
    dschungelAufstellen(szene, ort, stellen);
    regenwaldWetter(szene, ort);
  }
  if (ort.nebel) nebelZiehen(szene, ort, ort.nebel);
  const pilze = (ort.pilze ?? []).map((pilz) => stellen('pilz', pilz.x, pilz.y, false, PILZ_GROESSE));
  pilzeLeuchtenLassen(szene, pilze, licht);
  // Der dunkle Kristall: Der Schatten hat ihm sein Licht und seine Farben ausgesaugt.
  if (ort.dunklerKristall) stellen('kristall-ausgesaugt', ort.dunklerKristall.x, ort.dunklerKristall.y, false, DUNKLER_KRISTALL_GROESSE);
  for (const see of ort.seen ?? []) if (see.bild) gemaltenSeeAufstellen(szene, see, licht);
  if (ort.lagerfeuer) lagerfeuerAnzuenden(szene, ort.lagerfeuer, stellen);
  nachtblumenPflanzen(szene, ort);

  randAufbauen(szene, ort, stellen, baumStellen, licht);
  // Zu jedem Ausgang merken wir uns, was zu ihm gehört: Höhle, Licht und Schild.
  const zumAusgang = new Map(ort.ausgaenge.map((ausgang) => [ausgang, []]));
  tuerenAufstellen(szene, ort, stellen, licht);
  hoehlenAufstellen(szene, ort, stellen, licht, zumAusgang);
  schilderAufstellen(szene, ort, stellen, zumAusgang);
  glitzernLassen(szene, glitzernde, licht);
  const verschuettet = ort.ausgaenge.filter((ausgang) => !offen(ausgang)).map((ausgang) => geroellAufschuetten(ort, ausgang, stellen, zumAusgang.get(ausgang)));
  return { verdecker, verschuettet };
}

// Vor einem verschütteten Ausgang liegt ein Haufen Felsen. Schild und Höhle
// sind noch nicht zu sehen.
function geroellAufschuetten(ort, ausgang, stellen, teile) {
  const grenzen = weltGrenzen(ort);
  const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
  const felsen = [];
  for (const [weit, seitlich, groesse] of [[20, -80, 1], [20, 0, 1.15], [20, 80, 1], [90, -40, 0.8], [90, 45, 0.85]]) {
    const punkt = hinterDemAusgang(ausgang, grenzen, weit);
    const x = punkt.x + (quer ? 0 : seitlich);
    const y = punkt.y + (quer ? seitlich : 0) + 30;
    felsen.push({ bild: stellen('felsen', x, y, false, groesse), x, y, radius: 44 * groesse });
  }
  for (const teil of teile) teil.setVisible(false);
  return {
    ausgang,
    teile,
    felsen,
    hindernisse: felsen.map(({ x, y, radius }) => ({ x, y: y - 14, radius })),
    mitte: hinterDemAusgang(ausgang, grenzen, 60),
  };
}

// Die Felsen rollen zur Seite, und Höhle und Schild tauchen auf.
export function wegFreimachen(szene, weg) {
  weg.felsen.forEach(({ bild }, nummer) => {
    szene.tweens.add({
      targets: bild,
      x: bild.x + (nummer % 2 ? 60 : -60),
      y: bild.y + 40,
      angle: nummer % 2 ? 40 : -40,
      alpha: 0,
      delay: nummer * 160,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => bild.destroy(),
    });
  });
  for (const teil of weg.teile) {
    teil.setVisible(true);
    if (teil.type !== 'Image' || teil.blendMode === Phaser.BlendModes.ADD) continue;
    teil.setAlpha(0);
    szene.tweens.add({ targets: teil, alpha: 1, delay: 500, duration: 900 });
  }
}

// Ein weicher, pulsierender Lichtschein um etwas, das leuchtet.
// Ist licht eine Zahl, scheint er durch die Dunkelheit der Höhle.
function lichthof(szene, punkt, groesse, farbe, licht) {
  const hof = lichtschein(szene, punkt.x, punkt.y - 70 * groesse, 200 * groesse, 240 * groesse, farbe)
    .setAlpha(0.3)
    .setDepth(licht ?? punkt.y + 1);
  szene.tweens.add({
    targets: hof,
    alpha: 0.6,
    scaleX: hof.scaleX * 1.12,
    scaleY: hof.scaleY * 1.12,
    duration: 900 + Math.random() * 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

// Die Pilze leuchten: Unter dem Kopf strahlt ein Lichtkegel auf den Boden,
// und aus den weißen Punkten steigen immer wieder kleine Lichtstrahlen auf.
function pilzeLeuchtenLassen(szene, pilze, licht) {
  if (pilze.length === 0) return;
  for (const pilz of pilze) {
    const kopfUnten = pilz.y - (pilz.originY - PILZ_KOPF_UNTEN) * pilz.displayHeight;
    const kegel = szene.add
      .image(pilz.x, kopfUnten, 'lichtkegel')
      .setOrigin(0.5, 0)
      .setDisplaySize(pilz.displayWidth * 1.1, pilz.y - kopfUnten + 30)
      .setTint(PILZ_LICHT)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.35)
      .setDepth(licht ?? pilz.y + 1);
    const boden = lichtschein(szene, pilz.x, pilz.y, pilz.displayWidth * 1.8, 50, PILZ_LICHT).setAlpha(0.4).setDepth(-2);
    const dauer = 1300 + Math.random() * 600;
    szene.tweens.add({ targets: [kegel, boden], alpha: 0.6, duration: dauer, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  szene.time.addEvent({
    delay: Math.max(60, 500 / pilze.length),
    loop: true,
    callback: () => {
      const pilz = Phaser.Utils.Array.GetRandom(pilze);
      const [anteilX, anteilY] = Phaser.Utils.Array.GetRandom(PILZ_PUNKTE);
      const x = pilz.x + (anteilX - pilz.originX) * pilz.displayWidth;
      const y = pilz.y + (anteilY - pilz.originY) * pilz.displayHeight;
      const strahl = szene.add
        .ellipse(x, y, 3, 16, 0xfff6e8)
        .setOrigin(0.5, 1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(licht ?? pilz.y + 2);
      szene.tweens.add({
        targets: strahl,
        y: y - 40 - Math.random() * 30,
        scaleY: 1.8,
        alpha: 0,
        duration: 900 + Math.random() * 500,
        ease: 'Sine.easeOut',
        onComplete: () => strahl.destroy(),
      });
    },
  });
}

// Immer wieder blitzt an einem der glitzernden Dinge ein kleiner Stern auf.
function glitzernLassen(szene, glitzernde, licht) {
  if (glitzernde.length === 0) return;
  szene.time.addEvent({
    delay: Math.max(25, 600 / glitzernde.length),
    loop: true,
    callback: () => {
      const ding = Phaser.Utils.Array.GetRandom(glitzernde);
      const x = ding.x + (Math.random() - 0.5) * ding.breite;
      const y = ding.y - 10 - Math.random() * ding.hoehe;
      const stern = szene.add
        .image(x, y, 'funkel')
        .setTint(Phaser.Utils.Array.GetRandom(ding.farben))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(licht ?? ding.y + 2)
        .setScale(0);
      szene.tweens.add({
        targets: stern,
        scale: 0.5 + Math.random() * 0.6,
        angle: 90,
        duration: 320,
        yoyo: true,
        ease: 'Sine.easeOut',
        onComplete: () => stern.destroy(),
      });
    },
  });
}

// Der gemalte See. Damit er lebendig aussieht, glitzert das Wasser, kleine
// Wellenringe breiten sich aus und das Spiegelbild des Mondes leuchtet.
function gemaltenSeeAufstellen(szene, see, licht) {
  const bild = szene.add.image(see.x, see.y, see.bild).setDepth(-5);
  bild.setDisplaySize(see.breite * 1.04, see.hoehe * 1.04);
  const links = see.x - bild.displayWidth / 2;
  const oben = see.y - bild.displayHeight / 2;

  // Irgendein Punkt auf dem Wasser, nicht zu nah am Ufer.
  const aufDemWasser = () => {
    const winkel = Math.random() * Math.PI * 2;
    const weit = Math.sqrt(Math.random()) * 0.78;
    return {
      x: see.x + Math.cos(winkel) * (see.breite / 2) * weit,
      y: see.y + Math.sin(winkel) * (see.hoehe / 2) * weit,
    };
  };

  // Der Mond im Wasser leuchtet und wird langsam heller und dunkler.
  const mond = {
    x: links + MOND_IM_SEE.x * bild.displayWidth,
    y: oben + MOND_IM_SEE.y * bild.displayHeight,
  };
  const schein = lichtschein(szene, mond.x, mond.y, MOND_IM_SEE.breite * bild.displayWidth * 3, MOND_IM_SEE.hoehe * bild.displayHeight * 2.4, 0xfff6d6)
    .setAlpha(0.12)
    .setDepth(licht ?? -4);
  szene.tweens.add({ targets: schein, alpha: 0.3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // Glitzern auf dem Wasser
  szene.time.addEvent({
    delay: 90,
    loop: true,
    callback: () => {
      const punkt = aufDemWasser();
      const glanz = szene.add
        .ellipse(punkt.x, punkt.y, 18 + Math.random() * 26, 4, 0xe8f2ff)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(-4);
      szene.tweens.add({
        targets: glanz,
        alpha: 0.7,
        x: punkt.x + 14,
        duration: 600 + Math.random() * 500,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => glanz.destroy(),
      });
    },
  });

  // Wellenringe, als ob ein Fisch oder ein Tropfen ins Wasser fällt.
  szene.time.addEvent({
    delay: 650,
    loop: true,
    callback: () => {
      const punkt = aufDemWasser();
      const ring = szene.add.ellipse(punkt.x, punkt.y, 24, 10).setStrokeStyle(2, 0xbfe0ff, 0.7).setDepth(-4);
      szene.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 1800,
        ease: 'Sine.easeOut',
        onComplete: () => ring.destroy(),
      });
    },
  });
}

// Führt dieser Weg in die Mine hinein oder aus ihr hinaus?
function istHoehle(ort, ausgang) {
  return unterDerErde(ort.stil) || unterDerErde(ORTE[ausgang.nach].stil);
}

// Führt ein Weg in die Mine oder aus ihr hinaus, steht dort ein Höhleneingang.
// Draußen ist die Öffnung dunkel, drinnen kommt durch sie das Licht herein.
function hoehlenAufstellen(szene, ort, stellen, licht, zumAusgang) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    if (!istHoehle(ort, ausgang)) continue;
    const hinaus = unterDerErde(ort.stil);
    const punkt = hinterDemAusgang(ausgang, grenzen, -5);
    // Der Fuß liegt etwas unter dem Weg, die Figur läuft also genau in die Öffnung.
    const tor = stellen(hinaus ? 'hoehle-hinaus' : 'hoehle-hinein', punkt.x, punkt.y + 40);
    // Aber die Figur soll vor der Öffnung zu sehen sein, nicht dahinter verschwinden.
    tor.setDepth(punkt.y - 60);
    zumAusgang.get(ausgang).push(tor);

    if (hinaus) {
      const strahl = lichtschein(szene, punkt.x, punkt.y - 60, 420, 420, 0xe8e0ff).setAlpha(0.5).setDepth(licht ?? punkt.y);
      szene.tweens.add({ targets: strahl, alpha: 0.75, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      zumAusgang.get(ausgang).push(strahl);
    }
  }
}

// Die Türen mitten im Ort (tueren beim Ort):
//   pilzring: ein Ring aus kleinen leuchtenden Pilzen, in der Mitte schimmert der Boden
//   treppe:   eine Treppe nach oben, aus der Licht hereinfällt
//   haustuer: vor der Haustür leuchtet der Boden warm, damit man sie findet
function tuerenAufstellen(szene, ort, stellen, licht) {
  for (const tuer of ort.tueren ?? []) {
    if (tuer.art === 'pilzring') {
      const pilze = pilzringPilze(tuer).map((pilz, nummer) =>
        stellen('pilz', pilz.x, pilz.y, false, PILZ_GROESSE * (0.5 + (nummer % 3) * 0.08)).setFlipX(nummer % 2 === 1),
      );
      pilzeLeuchtenLassen(szene, pilze, licht);
      const mitte = lichtschein(szene, tuer.x, tuer.y, 150, 70, 0xc9b8ff).setAlpha(0.25).setDepth(-2);
      szene.tweens.add({ targets: mitte, alpha: 0.55, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (tuer.art === 'portal') {
      portalAufstellen(szene, tuer, licht);
    } else if (tuer.art === 'stollen') {
      // Ein alter Stollen: eine dunkle Öffnung im Fels, und ein Schild.
      stellen('hoehle-hinein', tuer.x, tuer.y + 40).setDepth(tuer.y - 60);
      szene.add
        .text(tuer.x, tuer.y - 230, `↓ ${ORTE[tuer.nach].name}`, schrift(20, '#ffffff'))
        .setOrigin(0.5)
        .setPadding(10, 6)
        .setBackgroundColor('#5a3a2a')
        .setDepth(tuer.y);
    } else if (tuer.art === 'wolkentreppe') {
      // Die Wolkentreppe: ein weißblau leuchtender Wirbel aus Wolken.
      portalAufstellen(szene, tuer, licht, { farben: [0xbfd8ff, 0xffffff, 0xe8f4ff], schein: 0xcfe8ff, mindestens: 0.4 });
      szene.add
        .text(tuer.x, tuer.y - 210, `☁ ${ORTE[tuer.nach].name}`, schrift(20, '#ffffff', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setPadding(10, 6)
        .setBackgroundColor('#3a5a9a')
        .setDepth(tuer.y);
    } else if (tuer.art === 'freundschaftstor') {
      // Das Freundschaftstor sieht man immer, es leuchtet golden und rosa.
      portalAufstellen(szene, tuer, licht, { farben: [0xffd166, 0xff9ad5, 0xfff3c4], schein: 0xffb8e0, mindestens: 0.55 });
      // Auf dem Schild steht, wohin es geht, und dass es nur zu zweit aufgeht.
      const zuZweit = tuer.zuZweit ? '\n★ nur zu zweit ★' : '';
      szene.add
        .text(tuer.x, tuer.y - 215, `${ORTE[tuer.nach].name}${zuZweit}`, schrift(21, '#ffffff', { fontStyle: '600', align: 'center', lineSpacing: 2 }))
        .setOrigin(0.5)
        .setPadding(12, 6)
        .setBackgroundColor('#7a3a8a')
        .setDepth(tuer.y);
    } else if (tuer.art === 'tauchplatz') {
      // Ein Tauchplatz am Ufer: Blasen steigen auf, und Ringe breiten sich aus.
      const fleck = lichtschein(szene, tuer.x + 30, tuer.y, 150, 70, 0x9ad8ff).setAlpha(0.4).setDepth(-4);
      szene.tweens.add({ targets: fleck, alpha: 0.75, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      szene.time.addEvent({
        delay: 380,
        loop: true,
        callback: () => {
          const blase = szene.add.circle(tuer.x + 20 + Math.random() * 40, tuer.y + 10, 3 + Math.random() * 4).setStrokeStyle(2, 0xe8f6ff, 0.9).setDepth(-3);
          szene.tweens.add({ targets: blase, y: blase.y - 30, alpha: 0, scale: 1.6, duration: 900, onComplete: () => blase.destroy() });
        },
      });
    } else if (tuer.art === 'treppe') {
      stellen('hoehle-hinaus', tuer.x, tuer.y + 40).setDepth(tuer.y - 60);
      const strahl = lichtschein(szene, tuer.x, tuer.y - 60, 420, 420, 0xe8e0ff).setAlpha(0.5).setDepth(licht ?? tuer.y);
      szene.tweens.add({ targets: strahl, alpha: 0.75, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      szene.add
        .text(tuer.x, tuer.y - 230, `↑ ${ORTE[tuer.nach].name}`, schrift(20, '#ffffff'))
        .setOrigin(0.5)
        .setPadding(10, 6)
        .setBackgroundColor('#5a3a2a')
        .setDepth(tuer.y);
    } else {
      const matte = lichtschein(szene, tuer.x, tuer.y, 120, 46, 0xffd6a0).setAlpha(0.35).setDepth(-2);
      szene.tweens.add({ targets: matte, alpha: 0.7, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

// Das Lagerfeuer brennt: Flammen flackern, Funken steigen auf, und der
// Boden drumherum leuchtet warm. Daneben liegen zwei Stämme zum Sitzen.
function lagerfeuerAnzuenden(szene, feuer, stellen) {
  const { x, y } = feuer;
  const boden = lichtschein(szene, x, y, 420, 200, 0xff9a3d).setAlpha(0.45).setDepth(-2);
  szene.tweens.add({ targets: boden, alpha: 0.65, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Holz, Steine und Stämme hat eine Bild-KI gemalt (werkzeuge/sachen_malen.py),
  // sonst malt das Spiel sie selbst.
  const gemalt = (name, breite) => (szene.textures.exists(`${name}-ki`) ? [`${name}-ki`, breite / masse(szene, `${name}-ki`).breite] : [name, 1]);
  const [stamm, stammGroesse] = gemalt('sitzstamm', 130);
  stellen(stamm, x - 130, y + 30, false, stammGroesse).setAngle(-12);
  stellen(stamm, x + 130, y + 30, false, stammGroesse).setAngle(12).setFlipX(true);
  const [holz, holzGroesse] = gemalt('lagerfeuer', 170);
  stellen(holz, x, y, false, holzGroesse);
  // Die Flammen: mehrere gemalte Bilder, die sich schnell abwechseln, so
  // züngeln sie wie ein echtes Feuer. Dahinter ein leuchtender Schein.
  const bilder = Array.from({ length: FLAMMEN_BILDER }, (_, nummer) => flammeMalen(szene, nummer));
  const glut = szene.add.image(x, y - 14, bilder[0]).setOrigin(0.5, 1).setScale(1.25, 1.1).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 1);
  const flamme = szene.add.image(x, y - 14, bilder[0]).setOrigin(0.5, 1).setDepth(y + 2);
  let bild = 0;
  szene.time.addEvent({
    delay: 85,
    loop: true,
    callback: () => {
      bild = (bild + 1 + Math.floor(Math.random() * 2)) % bilder.length;
      flamme.setTexture(bilder[bild]).setScale(0.92 + Math.random() * 0.16, 0.9 + Math.random() * 0.22);
      glut.setTexture(bilder[(bild + 2) % bilder.length]);
    },
  });
  // Rauch steigt auf und wird dabei größer und blasser.
  szene.time.addEvent({
    delay: 420,
    loop: true,
    callback: () => {
      const rauch = szene.add.circle(x + (Math.random() - 0.5) * 20, y - 120, 12, 0x6a6080, 0.35).setDepth(y + 3);
      szene.tweens.add({ targets: rauch, y: rauch.y - 140, x: rauch.x + (Math.random() - 0.3) * 60, scale: 3, alpha: 0, duration: 2600, onComplete: () => rauch.destroy() });
    },
  });
  // Es knistert, wenn man in der Nähe ist.
  szene.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      const figur = szene.spieler?.ort;
      if (!figur || szene.wechselt) return;
      const weit = Math.hypot(figur.x - x, figur.y - y);
      if (weit < 450) umgebung('haus', { pan: Phaser.Math.Clamp((x - figur.x) / 600, -0.8, 0.8), lautstaerke: 1 - weit / 450 });
    },
  });
  const schein = lichtschein(szene, x, y - 50, 260, 260, 0xffb060).setAlpha(0.5).setDepth(y + 2);
  szene.tweens.add({ targets: schein, alpha: 0.75, duration: 300, yoyo: true, repeat: -1 });
  szene.time.addEvent({
    delay: 160,
    loop: true,
    callback: () => {
      const funke = szene.add.circle(x + (Math.random() - 0.5) * 40, y - 40, 2 + Math.random() * 2, 0xffd166).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 3);
      szene.tweens.add({ targets: funke, y: funke.y - 90 - Math.random() * 80, x: funke.x + (Math.random() - 0.5) * 60, alpha: 0, duration: 1100 + Math.random() * 600, onComplete: () => funke.destroy() });
    },
  });
  szene.add
    .text(x, y + 78, 'Treffpunkt für zwei', schrift(19, '#ffffff', { fontStyle: '600' }))
    .setOrigin(0.5)
    .setPadding(10, 6)
    .setBackgroundColor('#8a4a2a')
    .setDepth(y);
}

// So viele Bilder hat das Lagerfeuer, damit die Flammen züngeln.
const FLAMMEN_BILDER = 6;

// Eine Flamme: außen rot und orange, innen gelb und in der Mitte fast weiß.
// Jedes Bild hat andere Flammenzungen.
function flammeMalen(szene, nummer) {
  const name = `flamme-${nummer}`;
  if (szene.textures.exists(name)) return name;
  const breite = 130;
  const hoehe = 180;
  const leinwand = szene.textures.createCanvas(name, breite, hoehe);
  const stift = leinwand.context;
  let zustand = nummer * 7919 + 17;
  const zufall = () => {
    zustand = (zustand * 16807) % 2147483647;
    return zustand / 2147483647;
  };
  const unten = hoehe - 6;
  // Eine Flammenzunge: unten rund, oben eine Spitze, die sich zur Seite biegt.
  const zunge = (mitte, dicke, lang, neigung, innen, aussen, strich = false) => {
    const pfad = () => {
      stift.beginPath();
      stift.moveTo(mitte - dicke / 2, unten);
      stift.bezierCurveTo(mitte - dicke / 2, unten - lang * 0.45, mitte + neigung * 0.3 - dicke * 0.2, unten - lang * 0.72, mitte + neigung, unten - lang);
      stift.bezierCurveTo(mitte + neigung * 0.3 + dicke * 0.2, unten - lang * 0.72, mitte + dicke / 2, unten - lang * 0.45, mitte + dicke / 2, unten);
      stift.quadraticCurveTo(mitte, unten + dicke * 0.22, mitte - dicke / 2, unten);
      stift.closePath();
    };
    const verlauf = stift.createLinearGradient(0, unten, 0, unten - lang);
    verlauf.addColorStop(0, innen);
    verlauf.addColorStop(0.55, aussen);
    verlauf.addColorStop(1, 'rgba(255, 80, 30, 0.6)');
    pfad();
    stift.fillStyle = verlauf;
    stift.fill();
    if (strich) {
      stift.lineWidth = 3;
      stift.strokeStyle = 'rgba(80, 20, 20, 0.85)';
      stift.lineJoin = 'round';
      stift.stroke();
    }
  };
  const mitte = breite / 2;
  // Außen: drei rote Zungen, unterschiedlich lang
  for (const [dx, dicke] of [[-24, 46], [24, 46], [0, 64]]) {
    zunge(mitte + dx, dicke, 90 + zufall() * 70, (zufall() - 0.5) * 40, '#ff8a2a', '#e8401c', true);
  }
  // Mitte: orange-gelb
  zunge(mitte + (zufall() - 0.5) * 10, 46, 80 + zufall() * 40, (zufall() - 0.5) * 30, '#ffe066', '#ff9a2a');
  zunge(mitte + (zufall() - 0.5) * 16, 26, 50 + zufall() * 30, (zufall() - 0.5) * 24, '#ffe8a0', '#ffc040');
  // Innen: ein heller, fast weißer Kern
  zunge(mitte, 22, 34 + zufall() * 16, (zufall() - 0.5) * 10, '#ffffff', '#fff3b0');
  // Ein paar Funken, die sich lösen
  for (let i = 0; i < 3; i += 1) {
    stift.beginPath();
    stift.arc(mitte + (zufall() - 0.5) * 70, unten - 110 - zufall() * 60, 2 + zufall() * 2, 0, Math.PI * 2);
    stift.fillStyle = '#ffd166';
    stift.fill();
  }
  leinwand.refresh();
  return name;
}

// Ein geheimes Portal: ein grüner, wirbelnder Ring aus Licht. Von weitem
// sieht man es kaum, je näher man kommt, desto heller leuchtet es.
// aussehen: (für das Freundschaftstor und die Wolkentreppe) andere farben (außen, Mitte, innen), die
// Farbe vom schein, und wie hell es mindestens leuchtet (0 bis 1).
const PORTAL_GRUEN = { farben: [0x2fd06a, 0x9af0b0, 0xe8fff0], schein: 0x5af08a, mindestens: 0.12 };

function portalAufstellen(szene, tuer, licht, aussehen = PORTAL_GRUEN) {
  const mitte = { x: tuer.x, y: tuer.y - 70 };
  const teile = [];
  const [aussen, mittel, innen] = aussehen.farben;
  for (const [breite, farbe, alpha] of [[150, aussen, 0.5], [110, mittel, 0.6], [70, innen, 0.8]]) {
    const ring = szene.add.ellipse(mitte.x, mitte.y, breite, breite * 1.45).setStrokeStyle(6, farbe, alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(licht ?? tuer.y);
    szene.tweens.add({ targets: ring, angle: breite % 3 ? 360 : -360, duration: 3000 + breite * 20, repeat: -1 });
    szene.tweens.add({ targets: ring, scaleX: 1.12, scaleY: 0.92, duration: 900 + breite * 5, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    teile.push(ring);
  }
  const schein = lichtschein(szene, mitte.x, mitte.y, 260, 320, aussehen.schein).setDepth(licht ?? tuer.y - 1);
  teile.push(schein);
  // Funken und Blätter werden ins Portal gesogen.
  szene.time.addEvent({
    delay: 200,
    loop: true,
    callback: () => {
      const winkel = Math.random() * Math.PI * 2;
      const funke = szene.add
        .image(mitte.x + Math.cos(winkel) * 110, mitte.y + Math.sin(winkel) * 140, 'funkel')
        .setTint(Phaser.Utils.Array.GetRandom([mittel, innen, aussehen.schein]))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(licht ?? tuer.y + 1)
        .setScale(0.5)
        .setAlpha(teile[0].alpha);
      szene.tweens.add({ targets: funke, x: mitte.x, y: mitte.y, scale: 0.1, angle: 180, duration: 900, onComplete: () => funke.destroy() });
    },
  });
  // Wie hell es leuchtet, hängt davon ab, wie nah die Figur ist.
  szene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => {
      const figur = szene.spieler?.ort;
      const { mindestens } = aussehen;
      const nah = figur ? Phaser.Math.Clamp(1 - (Math.hypot(figur.x - tuer.x, figur.y - tuer.y) - 150) / 600, mindestens, 1) : mindestens;
      for (const teil of teile) teil.setAlpha(teil === schein ? nah * 0.5 : nah);
    },
  });
}

// Der Waldboden im Regenwald: Moos, Laub, kleine Farne und Pfützen.
function regenwaldBodenMalen(stift, ort, zufall) {
  for (let i = 0; i < (ort.breite * ort.hoehe) / 9000; i += 1) {
    const x = zufall() * ort.breite;
    const y = zufall() * ort.hoehe;
    stift.fillStyle([0x4f8a3a, 0x5aa04a, 0x3a6e2e, 0x7a5a32][Math.floor(zufall() * 4)], 0.8);
    stift.fillEllipse(x, y, 10 + zufall() * 18, 5 + zufall() * 8);
  }
  for (let i = 0; i < 14; i += 1) {
    stift.fillStyle(0x5a8ab0, 0.45);
    stift.fillEllipse(zufall() * ort.breite, 300 + zufall() * (ort.hoehe - 400), 80 + zufall() * 90, 24 + zufall() * 20);
  }
}

// Der Dschungel: riesige Ceiba-Bäume, die oben aus dem Bild wachsen, Wurzeln
// und Laub am Boden, Büsche und Lianen. Alles gemalt mit werkzeuge/pflanzen_malen.py.
function dschungelAufstellen(szene, ort, stellen) {
  const zufall = wuerfel(17 + ort.breite);
  const masseVon = (name) => masse(szene, name);
  // Laub und Wurzeln liegen flach auf dem Boden, unter allem anderen.
  for (let i = 0; i < (ort.laub ?? 0); i += 1) {
    const laub = szene.add.image(zufall() * ort.breite, 200 + zufall() * (ort.hoehe - 200), 'pflanze-blaetter').setDepth(-3).setAngle(zufall() * 360).setAlpha(0.9);
    laub.setScale((40 + zufall() * 40) / masseVon('pflanze-blaetter').breite);
  }
  for (const wurzel of ort.wurzeln ?? []) {
    const bild = szene.add.image(wurzel.x, wurzel.y, 'pflanze-wurzeln').setDepth(-3).setFlipX(zufall() < 0.5);
    bild.setScale((220 + zufall() * 120) / masseVon('pflanze-wurzeln').breite);
  }
  // Viele schlanke Stämme, mit Moos bewachsen und von Ranken umwickelt.
  // Auch sie wachsen oben aus dem Bild hinaus.
  stammMalen(szene);
  for (const stamm of ort.staemme ?? []) {
    const hoch = 900 + zufall() * 500;
    const bild = szene.add.image(stamm.x, stamm.y + 4, 'regenwald-stamm').setOrigin(0.5, 1).setDepth(stamm.y);
    bild.setScale((0.6 + zufall() * 0.6) * 1, hoch / bild.height).setFlipX(zufall() < 0.5);
    // Hellere Stämme stehen weiter hinten im Dunst.
    bild.setTint(zufall() < 0.4 ? 0xc8d8c0 : 0xffffff);
    szene.add.ellipse(stamm.x, stamm.y, 70, 20, 0x10260f, 0.4).setDepth(-2);
  }
  // Die Riesenbäume: Der Stamm geht weit nach oben aus dem Bild hinaus.
  for (const baum of ort.riesenbaeume ?? []) {
    szene.add.ellipse(baum.x, baum.y, 360, 90, 0x10260f, 0.4).setDepth(-2);
    // Der gemalte Baum ist breit: Er wird in die Höhe gestreckt, damit er weit nach oben ragt.
    const { breite, hoehe } = masseVon('pflanze-ceiba');
    stellen('pflanze-ceiba', baum.x, baum.y + 20, true, 1).setScale(440 / breite, baum.groesse / hoehe).setFlipX(zufall() < 0.5);
  }
  // Büsche: Steht man dahinter, werden sie durchsichtig.
  for (const busch of ort.buesche ?? []) {
    const name = zufall() < 0.5 ? 'pflanze-busch' : 'pflanze-farnbusch';
    const bild = stellen(name, busch.x, busch.y, true, (120 + zufall() * 70) / masseVon(name).hoehe).setFlipX(zufall() < 0.5);
    szene.tweens.add({ targets: bild, scaleX: bild.scaleX * 1.03, duration: 1800 + zufall() * 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // Lianen hängen von oben herab und schaukeln ein bisschen.
  for (const liane of ort.lianen ?? []) {
    const lang = 500 + zufall() * 300;
    const bild = szene.add
      .image(liane.x, liane.y, 'pflanze-liane')
      .setOrigin(0.5, 1)
      .setDepth(liane.y + 400)
      .setAlpha(0.95);
    bild.setScale(lang / masseVon('pflanze-liane').hoehe);
    szene.tweens.add({ targets: bild, angle: { from: -2, to: 2 }, duration: 2600 + zufall() * 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // Große Blätter ganz vorne am Bildrand, wie wenn man durch den Dschungel
  // schaut. Sie bleiben am Bildschirm kleben und wiegen sich.
  const vorne = [
    { name: 'pflanze-bananenstaude', x: BILDSCHIRM.breite + 30, y: BILDSCHIRM.hoehe + 60, hoch: 560, winkel: -18 },
    { name: 'pflanze-monstera', x: BILDSCHIRM.breite - 20, y: 260, hoch: 360, winkel: 200 },
    { name: 'pflanze-farnbusch', x: 120, y: BILDSCHIRM.hoehe + 70, hoch: 300, winkel: 8 },
    { name: 'pflanze-monstera', x: 560, y: BILDSCHIRM.hoehe + 130, hoch: 260, winkel: -6 },
  ];
  for (const blatt of vorne) {
    const bild = szene.add
      .image(blatt.x, blatt.y, blatt.name)
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setAngle(blatt.winkel)
      .setTint(0x5a8a50)
      .setAlpha(0.96)
      .setDepth(99000);
    bild.setScale(blatt.hoch / masseVon(blatt.name).hoehe);
    szene.tweens.add({ targets: bild, angle: blatt.winkel + 3, duration: 2600 + zufall() * 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // Heller Dunst oben, wo das Licht durch das Blätterdach kommt
  szene.add.image(BILDSCHIRM.breite / 2, -60, 'lichtschein').setScrollFactor(0).setDisplaySize(BILDSCHIRM.breite * 1.6, 520).setTint(0xf2fff0).setAlpha(0.45).setDepth(98900);

  // Sonnenstrahlen fallen schräg durch das Blätterdach.
  for (let i = 0; i < 7; i += 1) {
    const strahl = szene.add
      .image(200 + zufall() * (ort.breite - 400), 0, 'lichtkegel')
      .setOrigin(0.5, 0)
      .setDisplaySize(160 + zufall() * 120, ort.hoehe * 0.9)
      .setAngle(-18)
      .setTint(0xf6ffd0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.12)
      .setDepth(90000 - 30);
    szene.tweens.add({ targets: strahl, alpha: 0.22, duration: 3000 + zufall() * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

// Ein schlanker Baumstamm, einmal gemalt: graubraun mit wackeligem Rand,
// grünen Moosflecken und einer Ranke, die sich hinaufwindet.
function stammMalen(szene) {
  if (szene.textures.exists('regenwald-stamm')) return;
  const breite = 64;
  const hoehe = 900;
  const leinwand = szene.textures.createCanvas('regenwald-stamm', breite, hoehe);
  const stift = leinwand.context;
  const zufall = wuerfel(99);
  const rand = (y) => 6 + Math.sin(y / 70) * 3 + zufall() * 2;
  stift.beginPath();
  stift.moveTo(rand(0) + 4, 0);
  for (let y = 0; y <= hoehe; y += 30) stift.lineTo(rand(y) + (y / hoehe) * -4, y);
  for (let y = hoehe; y >= 0; y -= 30) stift.lineTo(breite - rand(y) + (y / hoehe) * 4, y);
  stift.closePath();
  const licht = stift.createLinearGradient(0, 0, breite, 0);
  licht.addColorStop(0, '#9a9a82');
  licht.addColorStop(0.4, '#7a7a64');
  licht.addColorStop(1, '#4e4e3e');
  stift.fillStyle = licht;
  stift.fill();
  stift.strokeStyle = '#2e3a22';
  stift.lineWidth = 3;
  stift.stroke();
  // Moos
  for (let i = 0; i < 40; i += 1) {
    stift.fillStyle = ['rgba(90, 150, 60, 0.75)', 'rgba(120, 180, 70, 0.7)', 'rgba(60, 110, 50, 0.8)'][i % 3];
    stift.beginPath();
    stift.ellipse(10 + zufall() * (breite - 20), zufall() * hoehe, 6 + zufall() * 10, 10 + zufall() * 26, 0, 0, Math.PI * 2);
    stift.fill();
  }
  // Eine Ranke windet sich hinauf, mit kleinen Blättern.
  stift.strokeStyle = '#3f7a32';
  stift.lineWidth = 4;
  stift.beginPath();
  for (let y = hoehe; y >= 0; y -= 6) {
    const x = breite / 2 + Math.sin(y / 38) * (breite / 2 - 6);
    if (y === hoehe) stift.moveTo(x, y);
    else stift.lineTo(x, y);
  }
  stift.stroke();
  stift.fillStyle = '#5aa04a';
  for (let y = hoehe - 20; y > 0; y -= 46) {
    const x = breite / 2 + Math.sin(y / 38) * (breite / 2 - 6);
    stift.beginPath();
    stift.ellipse(x + 8, y, 10, 5, 0.6, 0, Math.PI * 2);
    stift.fill();
  }
  leinwand.refresh();
}

// Im Regenwald nieselt es, und Nebelschwaden ziehen langsam vorbei.
function regenwaldWetter(szene, ort) {
  szene.time.addEvent({
    delay: 30,
    loop: true,
    callback: () => {
      const kamera = szene.cameras.main;
      const x = kamera.scrollX + Math.random() * kamera.width;
      const y = kamera.scrollY + Math.random() * kamera.height * 0.6;
      const tropfen = szene.add.rectangle(x, y, 2, 16, 0xcfe8ff, 0.5).setAngle(12).setDepth(90000 - 10);
      szene.tweens.add({ targets: tropfen, x: x + 60, y: y + 260, alpha: 0, duration: 700, onComplete: () => tropfen.destroy() });
    },
  });
  for (let i = 0; i < 6; i += 1) {
    const nebel = lichtschein(szene, Math.random() * ort.breite, 200 + Math.random() * (ort.hoehe - 300), 700, 220, 0xe8fff0)
      .setAlpha(0.18)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setDepth(90000 - 20);
    szene.tweens.add({ targets: nebel, x: nebel.x + 400, alpha: 0.08, duration: 14000 + i * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

// Nebel (nebel beim Ort, von 0 bis 1): Weiche Schwaden ziehen langsam hin und
// her, und über allem liegt ein leichter Dunst.
function nebelZiehen(szene, ort, staerke) {
  const zufall = wuerfel(5 + ort.hoehe);
  const anzahl = Math.round((ort.breite * ort.hoehe) / 260000);
  for (let i = 0; i < anzahl; i += 1) {
    const schwade = lichtschein(szene, zufall() * ort.breite, 150 + zufall() * (ort.hoehe - 200), 600 + zufall() * 500, 180 + zufall() * 140, 0xe6e2ff)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setAlpha(staerke * (0.35 + zufall() * 0.3))
      .setDepth(90000 - 20);
    szene.tweens.add({
      targets: schwade,
      x: schwade.x + (zufall() < 0.5 ? -1 : 1) * (300 + zufall() * 300),
      alpha: staerke * 0.15,
      duration: 12000 + zufall() * 10000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  // Ein leichter Dunst über dem ganzen Bildschirm
  szene.add.rectangle(0, 0, BILDSCHIRM.breite, BILDSCHIRM.hoehe, 0xd8d4f0, staerke * 0.18).setOrigin(0).setScrollFactor(0).setDepth(90000 - 19);
}

// Der Rand: dichte Bäume rund um den Ort, in der Mine gemalte Steine mit
// Kristallen, auch oben vor der Felswand. Wo ein Weg hinausführt, bleibt eine Lücke.
function randAufbauen(szene, ort, stellen, baumStellen, licht) {
  // Ein Zimmer hat Wände, die sind schon im Bild.
  if (ort.stil === 'haus') return;
  const zufall = wuerfel(3 + ort.breite);
  // Im Regenwald ist der Rand ein Dickicht aus großen Pflanzen.
  if (ort.stil === 'regenwald') {
    const arten = ['monstera', 'bananenstaude', 'baumfarn', 'helikonie'];
    const dickicht = (x, y) => {
      const name = `pflanze-${arten[Math.floor(zufall() * arten.length)]}`;
      stellen(name, x, y, true, ((260 + zufall() * 120) / masse(szene, name).hoehe)).setFlipX(zufall() < 0.5);
    };
    for (let x = 0; x <= ort.breite; x += 140) {
      dickicht(x + zufall() * 40, 150 + zufall() * 30);
      dickicht(x + zufall() * 40, ort.hoehe + 120 + zufall() * 30);
    }
    for (let y = 260; y <= ort.hoehe; y += 150) {
      if (Math.abs(y - 900) > 160) dickicht(20 + zufall() * 30, y + zufall() * 30);
      dickicht(ort.breite - 20 - zufall() * 30, y + zufall() * 30);
    }
    return;
  }
  // Auf der Sternenwolke ist der Rand aus dicken Wolken, und dahinter funkeln Sterne.
  if (ort.stil === 'himmel') {
    const wolke = (x, y) => stellen('wolke', x, y, true, 0.9 + zufall() * 0.5).setFlipX(zufall() < 0.5);
    for (let x = 0; x <= ort.breite; x += 170) {
      wolke(x + zufall() * 40, 150 + zufall() * 30);
      wolke(x + zufall() * 40, ort.hoehe + 110 + zufall() * 30);
    }
    for (let y = 260; y <= ort.hoehe; y += 150) {
      wolke(20 + zufall() * 30, y + zufall() * 30);
      wolke(ort.breite - 20 - zufall() * 30, y + zufall() * 30);
    }
    const sterne = Array.from({ length: 30 }, () => ({
      x: zufall() * ort.breite,
      y: zufall() * ort.hoehe,
      breite: 60,
      hoehe: 60,
      farben: [0xffffff, 0xffe9a8, 0xffc8e8],
    }));
    glitzernLassen(szene, sterne, licht);
    return;
  }
  // Unter Wasser liegen die gemalten Steine mit Kristallen auf dem Sandboden.
  if (ort.stil === 'wasser') {
    const steine = [];
    for (let x = 120; x < ort.breite; x += 340 + zufall() * 120) {
      const name = RANDSTEINE[Math.floor(zufall() * RANDSTEINE.length)];
      const groesse = (150 / masse(szene, name).breite) * (0.8 + zufall() * 0.4);
      steine.push(stellen(name, x, ort.hoehe - 8, false, groesse).setFlipX(zufall() < 0.5));
    }
    randKristalleLeuchten(szene, steine, licht, zufall);
    return;
  }
  const steinig = unterDerErde(ort.stil);
  const steine = [];
  const steinStellen = (x, y) => {
    const name = RANDSTEINE[Math.floor(zufall() * RANDSTEINE.length)];
    const groesse = (RANDSTEIN_BREITE / masse(szene, name).breite) * (0.85 + zufall() * 0.3);
    steine.push(stellen(name, x, y, true, groesse).setFlipX(zufall() < 0.5));
  };
  const randStellen = (x, y) => (steinig ? steinStellen(x, y) : baumStellen(x, y));
  const frei = (seite, wert) =>
    ort.ausgaenge.some(
      (ausgang) => ausgang.seite === seite && Math.abs(wert - ausgang.mitte) < AUSGANG_BREITE / 2 + 50,
    );

  const schritt = steinig ? 130 : 115;
  for (let x = 0; x <= ort.breite; x += schritt) {
    if (!frei('oben', x)) randStellen(x + zufall() * 30, (steinig ? 160 : 105) + zufall() * 35);
    if (!frei('unten', x)) {
      randStellen(x + zufall() * 30, ort.hoehe + (steinig ? 70 : 180) + zufall() * 30);
    }
  }
  for (let y = 260; y <= ort.hoehe; y += 130) {
    const hier = y + zufall() * 30;
    if (!frei('links', hier)) randStellen(10 + zufall() * 30, hier);
    const dort = y + zufall() * 30;
    if (!frei('rechts', dort)) randStellen(ort.breite - 10 - zufall() * 30, dort);
  }
  randKristalleLeuchten(szene, steine, licht, zufall);
}

// Im Haus leuchten die Lampen und die Fenster. Lampen flackern warm,
// Fenster werden langsam heller und dunkler, die Lichterkette blinkt.
function hausLeuchten(szene, haus, lichter) {
  if (!lichter) return;
  const punkt = ({ x, y }) => ({
    x: haus.x + (x - haus.originX) * haus.displayWidth,
    y: haus.y + (y - haus.originY) * haus.displayHeight,
  });
  const tiefe = haus.depth + 1;
  for (const fenster of lichter.fenster) {
    const { x, y } = punkt(fenster);
    const weit = fenster.groesse * haus.displayWidth;
    const schein = lichtschein(szene, x, y, weit, weit, FENSTER_LICHT).setAlpha(0.45).setDepth(tiefe);
    szene.tweens.add({ targets: schein, alpha: 0.7, duration: 2200 + Math.random() * 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  for (const lampe of lichter.lampen) {
    const { x, y } = punkt(lampe);
    const weit = lampe.groesse * haus.displayWidth;
    const kern = lichtschein(szene, x, y, weit, weit, LAMPEN_LICHT).setAlpha(0.8).setDepth(tiefe);
    const hof = lichtschein(szene, x, y, weit * 2.6, weit * 2.6, LAMPEN_LICHT).setAlpha(0.3).setDepth(tiefe);
    // Flackern wie eine echte Flamme: immer wieder ein bisschen anders.
    const flackern = () => {
      szene.tweens.add({
        targets: [kern, hof],
        alpha: (ziel) => (ziel === kern ? 0.6 + Math.random() * 0.35 : 0.2 + Math.random() * 0.2),
        duration: 120 + Math.random() * 260,
        onComplete: flackern,
      });
    };
    flackern();
  }
  const kette = lichter.kette;
  if (!kette) return;
  for (let i = 0; i < kette.lichter; i += 1) {
    const anteil = i / (kette.lichter - 1);
    const { x, y } = punkt({
      x: kette.von.x + (kette.bis.x - kette.von.x) * anteil,
      y: kette.von.y + (kette.bis.y - kette.von.y) * anteil + Math.sin(anteil * Math.PI) * kette.durchhaengen,
    });
    const licht = lichtschein(szene, x, y, 22, 22, i % 2 ? 0xffe066 : 0xff9ad5).setAlpha(0.3).setDepth(tiefe);
    szene.tweens.add({ targets: licht, alpha: 1, duration: 500, delay: i * 180, yoyo: true, repeat: -1, repeatDelay: 400, ease: 'Sine.easeInOut' });
  }
}

// Die Kristalle auf den Steinen am Rand der Mine leuchten in ihren Farben,
// auch durch die Dunkelheit hindurch, und funkeln immer wieder auf.
function randKristalleLeuchten(szene, steine, licht, zufall) {
  if (steine.length === 0) return;
  const funkelnde = [];
  for (const stein of steine) {
    const breite = stein.displayWidth;
    const hoehe = stein.displayHeight;
    for (let i = 0; i < 2; i += 1) {
      const x = stein.x + (zufall() - 0.5) * breite * 0.6;
      const y = stein.y - hoehe * (0.35 + zufall() * 0.45);
      const farbe = RANDSTEIN_LICHT[Math.floor(zufall() * RANDSTEIN_LICHT.length)];
      const schein = lichtschein(szene, x, y, breite * 0.7, hoehe * 0.7, farbe)
        .setAlpha(0.25)
        .setDepth(licht ?? stein.depth + 1);
      szene.tweens.add({
        targets: schein,
        alpha: 0.6,
        duration: 1000 + zufall() * 1200,
        delay: zufall() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      funkelnde.push({ x, y: y + hoehe * 0.2, breite: breite * 0.4, hoehe: hoehe * 0.4, farben: [0xffffff, farbe] });
    }
  }
  glitzernLassen(szene, funkelnde, licht);
}

// An jedem Ausgang steht ein Schild mit dem Namen des nächsten Ortes.
function schilderAufstellen(szene, ort, stellen, zumAusgang) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    // Bei einer Höhle steht das Schild ein Stück davor, sonst verdeckt sie es.
    const punkt = hinterDemAusgang(ausgang, grenzen, istHoehle(ort, ausgang) ? 190 : 40);
    const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
    const x = quer ? punkt.x : punkt.x + AUSGANG_BREITE / 2 + 30;
    const y = quer ? punkt.y - AUSGANG_BREITE / 2 - 10 : punkt.y;
    const pfosten = stellen('schild', x, y);
    const pfeil = { links: '← ', rechts: '', oben: '↑ ', unten: '↓ ' }[ausgang.seite];
    const ende = ausgang.seite === 'rechts' ? ' →' : '';
    const tafel = szene.add
      .text(x, y - 70, `${pfeil}${ORTE[ausgang.nach].name}${ende}`, schrift(20, '#ffffff'))
      .setOrigin(ausgang.seite === 'rechts' ? 0.85 : ausgang.seite === 'links' ? 0.15 : 0.5, 0.5)
      .setPadding(10, 6)
      .setBackgroundColor('#5a3a2a')
      .setDepth(y + 1);
    zumAusgang.get(ausgang).push(pfosten, tafel);
  }
}
