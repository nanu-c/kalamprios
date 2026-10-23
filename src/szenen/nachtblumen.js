// Nachtblumen: Sie wachsen hinter dem Freundschaftstor, im Mondblütental und
// im Garten der Mondrosen, und leuchten im Dunkeln. Gemalt hat sie eine
// Bild-KI (werkzeuge/sachen_malen.py). Fehlt ein Bild, malt das Spiel die
// Blume selbst, mit einem dunklen, etwas wackeligen Strich außen herum.
// Wie viele wachsen, steht beim Ort bei nachtblumen (zum Beispiel
// daten/orte/mondbluetental.js). Wo genau, würfelt ein Würfel, der immer
// gleich würfelt, so stehen sie jedes Mal an derselben Stelle.

import Phaser from 'phaser';
import { freierPlatz } from '../welt/weltlogik.js';
import { lichtschein } from './landschaft.js';
import { farbeAlsCss, STRICH, wackelstrich, wuerfel } from './raetsel.js';

// Die Nachtblumen: welche Farbe sie haben und in welcher Farbe sie leuchten.
export const NACHTBLUMEN = {
  mondwinde: { name: 'Mondwinde', farbe: 0xf4f0ff, licht: 0xbfd8ff },
  nachtkerze: { name: 'Nachtkerze', farbe: 0xfff0a0, licht: 0xffe066 },
  sternbluete: { name: 'Sternblüte', farbe: 0x7fb4ff, licht: 0x8ec8ff },
  leuchtglocke: { name: 'Leuchtglocke', farbe: 0xff9ad5, licht: 0xff9ad5 },
  mondrose: { name: 'Mondrose', farbe: 0xd8c8ff, licht: 0xc9b8ff },
};

const BREITE = 80;
const HOEHE = 110;

// Ein grüner, leicht gebogener Stängel mit zwei Blättern. Oben endet er bei kopf.
function staengel(stift, zufall, kopf) {
  stift.lineCap = 'round';
  stift.strokeStyle = STRICH;
  stift.lineWidth = 7;
  const punkte = [[BREITE / 2, HOEHE - 4], [BREITE / 2 + (zufall() - 0.5) * 10, HOEHE * 0.7], kopf];
  wackelstrich(stift, punkte, zufall, 1);
  stift.strokeStyle = '#3f9a72';
  stift.lineWidth = 4;
  wackelstrich(stift, punkte, zufall, 1);
  for (const seite of [-1, 1]) {
    const y = HOEHE * (0.62 + seite * 0.08);
    stift.beginPath();
    stift.ellipse(BREITE / 2 + seite * 13, y, 13, 5, seite * 0.5, 0, Math.PI * 2);
    stift.fillStyle = '#4fb488';
    stift.fill();
    stift.lineWidth = 2.5;
    stift.strokeStyle = STRICH;
    stift.stroke();
  }
}

// Malt einen Umriss: erst füllen (mit einem Licht in der Mitte), dann der dunkle Strich.
function umrissMalen(stift, pfad, farbe, mitte) {
  const licht = stift.createRadialGradient(mitte.x, mitte.y, 1, mitte.x, mitte.y, 30);
  licht.addColorStop(0, '#ffffff');
  licht.addColorStop(0.35, farbeAlsCss(farbe, 0.4));
  licht.addColorStop(1, farbeAlsCss(farbe, -0.15));
  pfad();
  stift.fillStyle = licht;
  stift.fill();
  pfad();
  stift.lineWidth = 3;
  stift.strokeStyle = STRICH;
  stift.lineJoin = 'round';
  stift.stroke();
}

const BLUETEN = {
  // eine weiße Trichterblüte, die nach oben schaut
  mondwinde(stift, farbe, kopf) {
    umrissMalen(
      stift,
      () => {
        stift.beginPath();
        stift.moveTo(kopf[0] - 5, kopf[1] + 6);
        stift.lineTo(kopf[0] - 26, kopf[1] - 22);
        stift.quadraticCurveTo(kopf[0], kopf[1] - 34, kopf[0] + 26, kopf[1] - 22);
        stift.lineTo(kopf[0] + 5, kopf[1] + 6);
        stift.closePath();
      },
      farbe,
      { x: kopf[0], y: kopf[1] - 22 },
    );
    stift.strokeStyle = 'rgba(120, 140, 220, 0.6)';
    stift.lineWidth = 2;
    for (const dx of [-12, 0, 12]) wackelstrich(stift, [[kopf[0], kopf[1] + 2], [kopf[0] + dx, kopf[1] - 26]], wuerfel(5), 1);
  },
  // vier runde Blütenblätter wie ein kleiner Becher
  nachtkerze(stift, farbe, kopf) {
    for (const winkel of [0, 1, 2, 3].map((n) => (n / 4) * Math.PI * 2 + Math.PI / 4)) {
      const x = kopf[0] + Math.cos(winkel) * 12;
      const y = kopf[1] - 12 + Math.sin(winkel) * 10;
      umrissMalen(stift, () => {
        stift.beginPath();
        stift.ellipse(x, y, 13, 11, winkel, 0, Math.PI * 2);
      }, farbe, { x, y });
    }
    stift.beginPath();
    stift.arc(kopf[0], kopf[1] - 12, 5, 0, Math.PI * 2);
    stift.fillStyle = '#ffb347';
    stift.fill();
  },
  // ein Stern mit fünf spitzen Blättern
  sternbluete(stift, farbe, kopf) {
    const mitte = { x: kopf[0], y: kopf[1] - 16 };
    umrissMalen(stift, () => {
      stift.beginPath();
      for (let i = 0; i <= 10; i += 1) {
        const winkel = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const weit = i % 2 === 0 ? 26 : 10;
        const x = mitte.x + Math.cos(winkel) * weit;
        const y = mitte.y + Math.sin(winkel) * weit;
        if (i === 0) stift.moveTo(x, y);
        else stift.lineTo(x, y);
      }
      stift.closePath();
    }, farbe, mitte);
    stift.beginPath();
    stift.arc(mitte.x, mitte.y, 4, 0, Math.PI * 2);
    stift.fillStyle = '#ffffff';
    stift.fill();
  },
  // drei Glöckchen, die an einem Bogen hängen
  leuchtglocke(stift, farbe, kopf) {
    stift.strokeStyle = STRICH;
    stift.lineWidth = 4;
    stift.beginPath();
    stift.moveTo(kopf[0], kopf[1]);
    stift.quadraticCurveTo(kopf[0] + 10, kopf[1] - 26, kopf[0] + 30, kopf[1] - 10);
    stift.stroke();
    for (const [dx, dy] of [[4, -10], [16, -16], [28, -6]]) {
      const x = kopf[0] + dx;
      const y = kopf[1] + dy + 10;
      umrissMalen(stift, () => {
        stift.beginPath();
        stift.moveTo(x - 9, y + 8);
        stift.quadraticCurveTo(x - 9, y - 8, x, y - 9);
        stift.quadraticCurveTo(x + 9, y - 8, x + 9, y + 8);
        stift.closePath();
      }, farbe, { x, y });
    }
  },
  // eine Rose aus vielen runden Blättern
  mondrose(stift, farbe, kopf) {
    const mitte = { x: kopf[0], y: kopf[1] - 16 };
    umrissMalen(stift, () => {
      stift.beginPath();
      stift.arc(mitte.x, mitte.y, 20, 0, Math.PI * 2);
    }, farbe, mitte);
    stift.strokeStyle = STRICH;
    stift.lineWidth = 2.5;
    stift.beginPath();
    for (let t = 0; t < Math.PI * 5; t += 0.3) {
      const weit = 2 + t * 1.1;
      const x = mitte.x + Math.cos(t) * weit;
      const y = mitte.y + Math.sin(t) * weit * 0.9;
      if (t === 0) stift.moveTo(x, y);
      else stift.lineTo(x, y);
    }
    stift.stroke();
  },
};

// Malt eine Nachtblume einmal und merkt sie sich unter einem Namen.
export function nachtblumeMalen(szene, art) {
  const name = `nachtblume-${art}`;
  if (szene.textures.exists(name)) return name;
  const leinwand = szene.textures.createCanvas(name, BREITE, HOEHE);
  const stift = leinwand.context;
  const zufall = wuerfel(art.length * 31 + 7);
  const kopf = [BREITE / 2 + (zufall() - 0.5) * 8, HOEHE * 0.45];
  staengel(stift, zufall, kopf);
  BLUETEN[art](stift, NACHTBLUMEN[art].farbe, kopf);
  leinwand.refresh();
  return name;
}

// Ein dorniger Busch voller Mondrosen. Aus ihnen ist der Ring beim Rosentor.
export function rosenbuschMalen(szene) {
  const name = 'rosenbusch';
  if (szene.textures.exists(name)) return name;
  const leinwand = szene.textures.createCanvas(name, 110, 100);
  const stift = leinwand.context;
  const zufall = wuerfel(77);
  for (const [x, y, r] of [[30, 66, 26], [80, 66, 26], [55, 50, 32], [55, 74, 26]]) {
    stift.beginPath();
    stift.arc(x, y, r, 0, Math.PI * 2);
    stift.fillStyle = '#245f4e';
    stift.fill();
    stift.lineWidth = 3;
    stift.strokeStyle = STRICH;
    stift.stroke();
  }
  // Dornen
  stift.fillStyle = STRICH;
  for (let i = 0; i < 14; i += 1) {
    const winkel = zufall() * Math.PI * 2;
    const x = 55 + Math.cos(winkel) * 40;
    const y = 62 + Math.sin(winkel) * 30;
    stift.beginPath();
    stift.moveTo(x, y);
    stift.lineTo(x + Math.cos(winkel) * 9, y + Math.sin(winkel) * 9);
    stift.lineTo(x + Math.cos(winkel + 1.4) * 4, y + Math.sin(winkel + 1.4) * 4);
    stift.fill();
  }
  // Mondrosen darauf
  for (const [x, y] of [[34, 50], [72, 44], [55, 70], [86, 70], [22, 74]]) {
    stift.beginPath();
    stift.arc(x, y, 9, 0, Math.PI * 2);
    stift.fillStyle = farbeAlsCss(NACHTBLUMEN.mondrose.farbe, 0.2);
    stift.fill();
    stift.lineWidth = 2;
    stift.strokeStyle = STRICH;
    stift.stroke();
    stift.beginPath();
    stift.arc(x, y, 3.5, 0, Math.PI * 1.5);
    stift.stroke();
  }
  leinwand.refresh();
  return name;
}

// Pflanzt die Nachtblumen des Ortes. Sie stehen nicht im Weg.
// Dazu fliegen Glühwürmchen herum.
export function nachtblumenPflanzen(szene, ort) {
  const daten = ort.nachtblumen;
  if (!daten) return;
  const arten = daten.arten ?? Object.keys(NACHTBLUMEN);
  const zufall = wuerfel(ort.breite * 3 + ort.hoehe);
  for (let i = 0; i < daten.anzahl; i += 1) {
    const platz = freierPlatz(ort, zufall);
    if (!platz) continue;
    const art = arten[Math.floor(zufall() * arten.length)];
    const groesse = 0.5 + zufall() * 0.35;
    const bild = szene.add.image(platz.x, platz.y, nachtblumeMalen(szene, art)).setOrigin(0.5, 0.96).setDepth(platz.y);
    bild.setScale((HOEHE * groesse) / bild.height);
    bild.setFlipX(zufall() < 0.5);
    // Die Blüte leuchtet und wird langsam heller und dunkler.
    const schein = lichtschein(szene, platz.x, platz.y - HOEHE * 0.6 * groesse, 90 * groesse, 90 * groesse, NACHTBLUMEN[art].licht)
      .setAlpha(0.35)
      .setDepth(platz.y + 1);
    szene.tweens.add({ targets: schein, alpha: 0.7, duration: 1400 + zufall() * 1600, delay: zufall() * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    szene.tweens.add({ targets: bild, angle: { from: -2, to: 2 }, duration: 2200 + zufall() * 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Glühwürmchen schwirren dort herum, wo man gerade hinschaut.
  szene.time.addEvent({
    delay: 260,
    loop: true,
    callback: () => {
      const kamera = szene.cameras.main;
      const x = kamera.scrollX + Math.random() * kamera.width;
      const y = kamera.scrollY + Math.random() * kamera.height;
      const wurm = szene.add.circle(x, y, 2.5, 0xe8ff9a).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 200).setAlpha(0);
      szene.tweens.add({
        targets: wurm,
        x: x + (Math.random() - 0.5) * 160,
        y: y - 40 - Math.random() * 80,
        alpha: { from: 0, to: 1 },
        duration: 1300 + Math.random() * 900,
        yoyo: true,
        onComplete: () => wurm.destroy(),
      });
    },
  });
}
