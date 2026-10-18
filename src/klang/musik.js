// Spielt die Lieder aus lieder.js ab.

import { akkordLesen, akkordTon, LIEDER, liedVorbereiten, MELODIEN, noteLesen } from './lieder.js';
import { KLAENGE } from '../daten/klaenge.js';
import { bereit, hertz, jetzt, musikAusgang, neuerKnoten, rauschen, ton } from './klang.js';

const VORBEREITET = Object.fromEntries(Object.entries(LIEDER).map(([name, lied]) => [name, liedVorbereiten(lied)]));

// ------------------------------------------------------------- Instrumente

const INSTRUMENTE = {
  // klingt wie ein Glockenspiel
  glocke(zeit, note, dauer, ziel, laut = 1) {
    const f = hertz(note);
    ton({ frequenz: f, zeit, dauer: Math.max(dauer, 0.9), lautstaerke: 0.16 * laut, ziel });
    ton({ frequenz: f * 2, zeit, dauer: 0.5, lautstaerke: 0.05 * laut, ziel });
    ton({ frequenz: f * 3.01, zeit, dauer: 0.25, lautstaerke: 0.025 * laut, ziel });
  },
  // gezupft, wie eine Harfe
  zupfen(zeit, note, dauer, ziel, laut = 1) {
    ton({ frequenz: hertz(note), art: 'triangle', zeit, dauer: Math.max(dauer, 0.5), lautstaerke: 0.2 * laut, filter: { frequenz: 3000, zu: 600, dauer: 0.4 }, ziel });
  },
  // weich, wie eine Flöte
  floete(zeit, note, dauer, ziel, laut = 1) {
    ton({ frequenz: hertz(note), zeit, dauer, lautstaerke: 0.16 * laut, anschlag: 0.06, ausklang: 0.12, vibrato: { tempo: 5, tiefe: 0.006 }, ziel });
    ton({ frequenz: hertz(note), art: 'triangle', zeit, dauer, lautstaerke: 0.05 * laut, anschlag: 0.06, ausklang: 0.12, ziel });
  },
  // wie ein altes Videospiel, aber nicht zu schrill
  quadrat(zeit, note, dauer, ziel, laut = 1) {
    ton({ frequenz: hertz(note), art: 'square', zeit, dauer: dauer * 0.92, lautstaerke: 0.07 * laut, anschlag: 0.01, ausklang: 0.05, filter: { frequenz: 2400 }, vibrato: { tempo: 6, tiefe: 0.004 }, ziel });
  },
  bass(zeit, note, dauer, ziel) {
    ton({ frequenz: hertz(note), art: 'triangle', zeit, dauer, lautstaerke: 0.28, anschlag: 0.01, ausklang: 0.06, ziel });
    ton({ frequenz: hertz(note), zeit, dauer, lautstaerke: 0.14, anschlag: 0.01, ausklang: 0.06, ziel });
  },
  // ein leiser, breiter Klangteppich unter allem
  flaeche(zeit, noten, dauer, ziel) {
    for (const note of noten) {
      for (const verstimmt of [0.996, 1.004]) {
        ton({ frequenz: hertz(note) * verstimmt, art: 'sawtooth', zeit, dauer: dauer + 0.3, lautstaerke: 0.018, anschlag: 0.4, ausklang: 0.6, filter: { frequenz: 900 }, ziel });
      }
    }
  },
  k(zeit, ziel) {
    ton({ frequenz: 140, gleitenZu: 42, gleitDauer: 0.18, zeit, dauer: 0.25, lautstaerke: 0.5, ziel });
  },
  s(zeit, ziel) {
    rauschen({ zeit, dauer: 0.15, lautstaerke: 0.14, filter: { art: 'bandpass', frequenz: 1900, q: 0.8 }, ziel });
    ton({ frequenz: 190, art: 'triangle', zeit, dauer: 0.08, lautstaerke: 0.12, ziel });
  },
  h(zeit, ziel) {
    rauschen({ zeit, dauer: 0.05, lautstaerke: 0.06, filter: { art: 'highpass', frequenz: 7500 }, ziel });
  },
};

// ------------------------------------------------------------ Abspielen

const VORAUS = 0.15; // so viele Sekunden im Voraus werden Noten geplant

function sechzehntel(lied) {
  return 60 / lied.tempo / 4;
}

// Spielt alles, was auf diesem Sechzehntel passiert.
function schrittSpielen(lauf, schritt, zeit) {
  const { lied, weg } = lauf;
  const s = sechzehntel(lied);
  const taktNummer = Math.floor(schritt / 16) % lied.takte.length;
  const imTakt = schritt % 16;
  const takt = lied.takte[taktNummer];
  const akkord = takt.akkorde[Math.floor((imTakt / 16) * takt.akkorde.length)];

  if (lied.flaeche && imTakt % (16 / takt.akkorde.length) === 0) {
    const noten = [1, 3, 5].map((ziffer) => akkordTon(akkord, ziffer, 55));
    INSTRUMENTE.flaeche(zeit, noten, s * (16 / takt.akkorde.length), weg);
  }

  // Melodie in Achteln: Eine Note klingt, bis eine neue Note oder eine Pause kommt.
  if (takt.melodie.length && imTakt % 2 === 0) {
    const nummer = imTakt / 2;
    const zeichen = takt.melodie[nummer];
    if (zeichen !== '-' && zeichen !== '.') {
      let laenge = 1;
      while (takt.melodie[nummer + laenge] === '-') laenge += 1;
      INSTRUMENTE[lied.klang](zeit, noteLesen(zeichen), laenge * s * 2, weg);
    }
  }

  for (const [muster, tiefe, spielen] of [
    [lied.bass, 36, (note, dauer) => INSTRUMENTE.bass(zeit, note, dauer, weg)],
    [lied.begleitung, 55, (note, dauer) => INSTRUMENTE.zupfen(zeit, note, dauer, weg, 0.45)],
  ]) {
    if (!muster) continue;
    const proSchritt = 16 / muster.length; // 2 bei Achteln, 1 bei Sechzehnteln
    if (imTakt % proSchritt !== 0) continue;
    const ziffer = muster[imTakt / proSchritt];
    if (ziffer !== '.') spielen(akkordTon(akkord, ziffer, tiefe), s * proSchritt);
  }

  const schlag = lied.schlagzeug?.[imTakt];
  if (schlag && schlag !== '.') INSTRUMENTE[schlag](zeit, weg);
}

let laeuft = null; // das Lied, das gerade spielt: { name, lied, weg, schritt, zeit }
let gewuenscht = null; // das Lied, das spielen soll, sobald der Ton angeht
let gewuenschtLaut = 1; // wie laut es spielen soll (im Kampf leiser)

// Ein eigener Lautstärkeregler pro Lied, damit Lieder ineinander übergehen können.
function liedWeg() {
  const weg = neuerKnoten('createGain');
  weg.gain.value = 0;
  weg.connect(musikAusgang());
  return weg;
}

function ausblenden(lauf, sekunden) {
  lauf.weg.gain.setTargetAtTime(0, jetzt(), sekunden / 3);
  setTimeout(() => lauf.weg.disconnect(), sekunden * 1000 + 600);
}

function liedStarten(name) {
  if (laeuft) ausblenden(laeuft, 0.8);
  const weg = liedWeg();
  weg.gain.setTargetAtTime(gewuenschtLaut, jetzt(), 0.3);
  laeuft = { name, lied: VORBEREITET[name], weg, schritt: 0, zeit: 0 };
}

function planen() {
  if (!bereit()) {
    if (laeuft) laeuft.zeit = 0; // wenn der Ton wieder angeht, geht es ohne Sprung weiter
    return;
  }
  if (gewuenscht && laeuft?.name !== gewuenscht) liedStarten(gewuenscht);
  if (!laeuft) return;
  if (laeuft.zeit < jetzt()) laeuft.zeit = jetzt() + 0.05;
  while (laeuft.zeit < jetzt() + VORAUS) {
    schrittSpielen(laeuft, laeuft.schritt, laeuft.zeit);
    laeuft.schritt += 1;
    laeuft.zeit += sechzehntel(laeuft.lied);
  }
}
setInterval(planen, 25);

// Spielt ein Lied aus lieder.js in Dauerschleife. Läuft es schon, spielt es
// einfach weiter. Ist der Ton noch nicht an, fängt es an, sobald er angeht.
// laut: 1 ist normal, 0.5 halb so laut.
export function musikSpielen(name, laut = 1) {
  gewuenscht = name;
  if (laeuft?.name === name && gewuenschtLaut !== laut) laeuft.weg.gain.setTargetAtTime(laut, jetzt(), 0.3);
  gewuenschtLaut = laut;
  planen();
}

let letztesKampflied = null;

// Spielt eins der Kampflieder aus klaenge.js, etwas leiser als draußen.
// Nie zweimal hintereinander dasselbe, wenn es mehrere gibt.
export function kampfmusikSpielen() {
  const auswahl = KLAENGE.kampflieder.filter((name) => name !== letztesKampflied);
  const liste = auswahl.length ? auswahl : KLAENGE.kampflieder;
  letztesKampflied = liste[Math.floor(Math.random() * liste.length)];
  musikSpielen(letztesKampflied, KLAENGE.musikImKampf);
}

export function musikAus(sekunden = 0.6) {
  gewuenscht = null;
  if (!laeuft) return;
  ausblenden(laeuft, sekunden);
  laeuft = null;
}

// Spielt eine kurze Melodie aus MELODIEN einmal. Die Musik macht so lange Pause.
export function melodieSpielen(name) {
  if (!bereit()) return;
  musikAus(0.3);
  const { tempo, klang, noten, akkord } = MELODIEN[name];
  const weg = liedWeg();
  weg.gain.value = 1;
  const achtel = 60 / tempo / 2;
  let zeit = jetzt() + 0.05;
  for (const [note, laenge] of noten) {
    if (note !== '.') INSTRUMENTE[klang](zeit, noteLesen(note), laenge * achtel, weg, 1.4);
    zeit += laenge * achtel;
  }
  const grund = akkordLesen(akkord);
  const gesamt = zeit - jetzt();
  INSTRUMENTE.flaeche(jetzt() + 0.05, [1, 3, 5].map((ziffer) => akkordTon(grund, ziffer, 55)), gesamt, weg);
  INSTRUMENTE.bass(zeit - laengeLetzte(noten) * achtel, akkordTon(grund, 1, 36), laengeLetzte(noten) * achtel, weg);
  setTimeout(() => weg.disconnect(), gesamt * 1000 + 2500);
}

function laengeLetzte(noten) {
  return noten[noten.length - 1][1];
}
