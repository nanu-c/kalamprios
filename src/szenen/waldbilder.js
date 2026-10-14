// Malt den Wald: Boden, hohes Gras, Bäume und Kristalle.
// Das sind Platzhalter, bis es gemalte Landschaftsbilder gibt.

import { KRISTALLWALD as WALD } from '../daten/kristallwald.js';

// Wo auf dem Baum- und dem Kristallbild der Fuß sitzt (0 = oben, 1 = unten).
const BAUM_FUSS = 255 / 270;
const KRISTALL_FUSS = 160 / 170;

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

function bodenMalen(stift) {
  const zufall = wuerfel(7);
  stift.fillStyle(0x3b2170);
  stift.fillRect(0, 0, WALD.breite, WALD.hoehe);

  // Helle und dunkle Flecken, damit man beim Laufen sieht, dass man vorankommt.
  for (let i = 0; i < 420; i += 1) {
    stift.fillStyle(zufall() < 0.5 ? 0x46288a : 0x331b62, 0.55);
    stift.fillEllipse(
      zufall() * WALD.breite,
      zufall() * WALD.hoehe,
      50 + zufall() * 130,
      24 + zufall() * 50,
    );
  }
  const bluetenfarben = [0xc9b8ff, 0x8ef0ff, 0xff9ad5];
  for (let i = 0; i < 260; i += 1) {
    stift.fillStyle(bluetenfarben[i % bluetenfarben.length], 0.85);
    stift.fillCircle(zufall() * WALD.breite, zufall() * WALD.hoehe, 2.5 + zufall() * 2.5);
  }

  // Hohes Gras: eine blaugrüne Fläche mit vielen Halmen.
  for (const gras of WALD.hohesGras) {
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

  // Schatten unter Bäumen und Kristallen
  stift.fillStyle(0x170b2c, 0.4);
  for (const baum of WALD.baeume) stift.fillEllipse(baum.x, baum.y, 120, 36);
  for (const kristall of WALD.kristalle) stift.fillEllipse(kristall.x, kristall.y, 96, 26);
}

// Malt jedes Bild einmal und merkt es sich unter einem Namen.
function bilderErzeugen(szene) {
  if (szene.textures.exists('waldboden')) return;
  const stift = szene.add.graphics();

  baumMalen(stift);
  stift.generateTexture('baum', 220, 270);
  stift.clear();

  kristallMalen(stift, 0x8a5be0, 0xb99cf0);
  stift.generateTexture('kristall-lila', 110, 170);
  stift.clear();

  kristallMalen(stift, 0x5b8fe0, 0x9cc0f2);
  stift.generateTexture('kristall-blau', 110, 170);
  stift.clear();

  bodenMalen(stift);
  stift.generateTexture('waldboden', WALD.breite, WALD.hoehe);
  stift.destroy();
}

// Stellt den Wald auf und gibt alle Baumbilder zurück.
// Was weiter unten steht, verdeckt, was weiter oben steht: Darum bekommt jedes
// Bild als Tiefe sein y.
export function waldAufbauen(szene) {
  bilderErzeugen(szene);
  szene.add.image(0, 0, 'waldboden').setOrigin(0).setDepth(-10);

  const baeume = [];
  const baum = (x, y) => {
    baeume.push(szene.add.image(x, y, 'baum').setOrigin(0.5, BAUM_FUSS).setDepth(y));
  };

  for (const ort of WALD.baeume) baum(ort.x, ort.y);
  WALD.kristalle.forEach((ort, nummer) => {
    szene.add
      .image(ort.x, ort.y, nummer % 2 === 0 ? 'kristall-lila' : 'kristall-blau')
      .setOrigin(0.5, KRISTALL_FUSS)
      .setDepth(ort.y);
  });

  // Der Waldrand: dichte Bäume rund um die Welt.
  const zufall = wuerfel(3);
  for (let x = 0; x <= WALD.breite; x += 115) {
    baum(x + zufall() * 30, 105 + zufall() * 35);
    baum(x + zufall() * 30, WALD.hoehe + 180 + zufall() * 30);
  }
  for (let y = 260; y <= WALD.hoehe; y += 130) {
    baum(10 + zufall() * 30, y + zufall() * 30);
    baum(WALD.breite - 10 - zufall() * 30, y + zufall() * 30);
  }
  return baeume;
}
