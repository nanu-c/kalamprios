// Malt die Orte: Boden, hohes Gras, Bäume, Häuser, Felsen, Kristalle, Gold,
// Seen und Höhleneingänge. Der Mondsee und zwei der Bäume sind gemalt (die
// Bilder liegen in public/bilder/landschaft), der Rest ist noch Platzhalter.

import Phaser from 'phaser';
import { ORTE } from '../daten/orte.js';
import { AUSGANG_BREITE, hinterDemAusgang, weltGrenzen } from '../welt/weltlogik.js';
import { schrift } from './stil.js';

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

// Wo im gemalten Mondsee der Mond liegt (Anteil von Breite und Höhe des Bildes).
const MOND_IM_SEE = { x: 0.44, y: 0.49, breite: 0.14, hoehe: 0.22 };

// Jedes Bild: wie groß es ist und wo der Fuß sitzt (in Pixeln von oben).
// Gemalte Bilder fehlen hier, bei ihnen sitzt der Fuß ganz unten.
const BILDER = {
  baum: { breite: 220, hoehe: 270, fuss: 255 },
  'kristall-lila': { breite: 110, hoehe: 170, fuss: 160 },
  'kristall-blau': { breite: 110, hoehe: 170, fuss: 160 },
  'kristall-dunkel': { breite: 110, hoehe: 170, fuss: 160 },
  prismastahl: { breite: 120, hoehe: 180, fuss: 168 },
  felsen: { breite: 170, hoehe: 140, fuss: 126 },
  haus: { breite: 280, hoehe: 270, fuss: 256 },
  schild: { breite: 40, hoehe: 90, fuss: 86 },
  gold: { breite: 120, hoehe: 96, fuss: 86 },
  'hoehle-hinein': { breite: 300, hoehe: 280, fuss: 272 },
  'hoehle-hinaus': { breite: 300, hoehe: 280, fuss: 272 },
  funkel: { breite: 32, hoehe: 32, fuss: 16 },
};

// Farben für Boden und Flecken, je nachdem wie der Ort aussieht.
const BODEN = {
  dorf: { grund: 0x4a2a80, hell: 0x5a36a0, dunkel: 0x3f2370, weg: 0x9a84c8 },
  wald: { grund: 0x3b2170, hell: 0x46288a, dunkel: 0x331b62, weg: 0x6c55a0 },
  mine: { grund: 0x2b2340, hell: 0x372d52, dunkel: 0x211a33, weg: 0x5a4f6e },
  see: { grund: 0x2f2a6a, hell: 0x3a3580, dunkel: 0x28235a, weg: 0x7a6cb0 },
};

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

// Ein rundes Dorfhaus mit spitzem Dach, Tür und leuchtenden Fenstern.
function hausMalen(stift) {
  stift.fillStyle(0xd8c8f0);
  stift.fillRect(45, 130, 190, 126);
  stift.fillStyle(0xbfa9e3);
  stift.fillRect(45, 130, 190, 14);
  stift.fillStyle(0x5a2c9a);
  stift.fillTriangle(20, 140, 140, 18, 260, 140);
  stift.fillStyle(0x7a44c4);
  stift.fillTriangle(140, 18, 260, 140, 140, 140);
  stift.fillStyle(0x3b1e66);
  stift.fillRoundedRect(118, 176, 44, 80, { tl: 22, tr: 22, bl: 0, br: 0 });
  stift.fillStyle(0xffe9a8);
  stift.fillCircle(80, 190, 18);
  stift.fillCircle(200, 190, 18);
  stift.fillStyle(0x8ef0ff);
  stift.fillTriangle(130, 30, 140, 0, 150, 30);
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

function bodenMalen(stift, ort) {
  const zufall = wuerfel(ort.breite + ort.hoehe + ort.stil.length);
  const farben = BODEN[ort.stil];
  stift.fillStyle(farben.grund);
  stift.fillRect(0, 0, ort.breite, ort.hoehe);
  flecken(stift, ort, farben, zufall);

  const flaeche = (ort.breite * ort.hoehe) / 15000;
  if (ort.stil === 'mine') {
    // Glitzernder Kristallstaub
    punkte(stift, ort, [0x8ef0ff, 0xb8c4d9, 0xff9ad5], Math.round(flaeche * 0.8), 1.5, zufall);
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
  if (ort.stil === 'mine') felswandMalen(stift, ort, zufall);
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
  const stift = szene.add.graphics();
  const malen = (name, wie) => {
    wie(stift);
    stift.generateTexture(name, BILDER[name].breite, BILDER[name].hoehe);
    stift.clear();
  };
  malen('baum', baumMalen);
  malen('kristall-lila', (s) => kristallMalen(s, 0x8a5be0, 0xb99cf0));
  malen('kristall-blau', (s) => kristallMalen(s, 0x5b8fe0, 0x9cc0f2));
  malen('kristall-dunkel', (s) => kristallMalen(s, 0x2a2238, 0x4a4060));
  malen('prismastahl', prismastahlMalen);
  malen('felsen', felsenMalen);
  malen('haus', hausMalen);
  malen('schild', schildMalen);
  malen('gold', goldMalen);
  malen('funkel', funkelMalen);
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

// Stellt den Ort mit dem Kurznamen schluessel auf. Gibt alles zurück, was die
// Figur verdecken kann (Bäume und Häuser), damit es durchsichtig werden kann.
// Was weiter unten steht, verdeckt, was weiter oben steht: Darum bekommt jedes
// Bild als Tiefe sein y.
export function ortAufbauen(szene, schluessel) {
  const ort = ORTE[schluessel];
  bilderErzeugen(szene);
  szene.add.image(0, 0, bodenErzeugen(szene, schluessel, ort)).setOrigin(0).setDepth(-10);

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
  for (const haus of ort.haeuser ?? []) stellen('haus', haus.x, haus.y, true);
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
  if (ort.dunklerKristall) stellen('kristall-dunkel', ort.dunklerKristall.x, ort.dunklerKristall.y);
  for (const see of ort.seen ?? []) if (see.bild) gemaltenSeeAufstellen(szene, see, licht);

  randAufbauen(ort, stellen, baumStellen);
  hoehlenAufstellen(szene, ort, stellen, licht);
  schilderAufstellen(szene, ort, stellen);
  glitzernLassen(szene, glitzernde, licht);
  return verdecker;
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
  return ort.stil === 'mine' || ORTE[ausgang.nach].stil === 'mine';
}

// Führt ein Weg in die Mine oder aus ihr hinaus, steht dort ein Höhleneingang.
// Draußen ist die Öffnung dunkel, drinnen kommt durch sie das Licht herein.
function hoehlenAufstellen(szene, ort, stellen, licht) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    if (!istHoehle(ort, ausgang)) continue;
    const hinaus = ort.stil === 'mine';
    const punkt = hinterDemAusgang(ausgang, grenzen, -5);
    // Der Fuß liegt etwas unter dem Weg, die Figur läuft also genau in die Öffnung.
    const tor = stellen(hinaus ? 'hoehle-hinaus' : 'hoehle-hinein', punkt.x, punkt.y + 40);
    // Aber die Figur soll vor der Öffnung zu sehen sein, nicht dahinter verschwinden.
    tor.setDepth(punkt.y - 60);

    if (hinaus) {
      const strahl = lichtschein(szene, punkt.x, punkt.y - 60, 420, 420, 0xe8e0ff).setAlpha(0.5).setDepth(licht ?? punkt.y);
      szene.tweens.add({ targets: strahl, alpha: 0.75, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

// Der Rand: dichte Bäume rund um den Ort, in der Mine Felsen.
// Wo ein Weg hinausführt, bleibt eine Lücke.
function randAufbauen(ort, stellen, baumStellen) {
  const zufall = wuerfel(3 + ort.breite);
  const randStellen = (x, y) => (ort.stil === 'mine' ? stellen('felsen', x, y, true) : baumStellen(x, y));
  const frei = (seite, wert) =>
    ort.ausgaenge.some(
      (ausgang) => ausgang.seite === seite && Math.abs(wert - ausgang.mitte) < AUSGANG_BREITE / 2 + 50,
    );

  const schritt = ort.stil === 'mine' ? 130 : 115;
  for (let x = 0; x <= ort.breite; x += schritt) {
    if (ort.stil !== 'mine' && !frei('oben', x)) randStellen(x + zufall() * 30, 105 + zufall() * 35);
    if (!frei('unten', x)) {
      randStellen(x + zufall() * 30, ort.hoehe + (ort.stil === 'mine' ? 70 : 180) + zufall() * 30);
    }
  }
  for (let y = 260; y <= ort.hoehe; y += 130) {
    const hier = y + zufall() * 30;
    if (!frei('links', hier)) randStellen(10 + zufall() * 30, hier);
    const dort = y + zufall() * 30;
    if (!frei('rechts', dort)) randStellen(ort.breite - 10 - zufall() * 30, dort);
  }
}

// An jedem Ausgang steht ein Schild mit dem Namen des nächsten Ortes.
function schilderAufstellen(szene, ort, stellen) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    // Bei einer Höhle steht das Schild ein Stück davor, sonst verdeckt sie es.
    const punkt = hinterDemAusgang(ausgang, grenzen, istHoehle(ort, ausgang) ? 190 : 40);
    const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
    const x = quer ? punkt.x : punkt.x + AUSGANG_BREITE / 2 + 30;
    const y = quer ? punkt.y - AUSGANG_BREITE / 2 - 10 : punkt.y;
    stellen('schild', x, y);
    const pfeil = { links: '← ', rechts: '', oben: '↑ ', unten: '↓ ' }[ausgang.seite];
    const ende = ausgang.seite === 'rechts' ? ' →' : '';
    szene.add
      .text(x, y - 70, `${pfeil}${ORTE[ausgang.nach].name}${ende}`, schrift(20, '#ffffff'))
      .setOrigin(ausgang.seite === 'rechts' ? 0.85 : ausgang.seite === 'links' ? 0.15 : 0.5, 0.5)
      .setPadding(10, 6)
      .setBackgroundColor('#5a3a2a')
      .setDepth(y + 1);
  }
}
