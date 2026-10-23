// Alle Geräusche des Spiels. Jedes ist eine kleine Funktion, die ein paar
// Töne und etwas Rauschen zusammenmischt.
//
// Viele nehmen ort: { pan, lautstaerke, dumpf } (siehe raumWeg in klang.js).
// So kann ein Geräusch von links oder rechts kommen und aus der Ferne leiser
// und dumpfer klingen.

import { HOEHEN, KLAENGE } from '../daten/klaenge.js';
import { dauerton, hertz, rauschen, raumWeg, ton } from './klang.js';

function zufall(min, max) {
  return min + Math.random() * (max - min);
}

// ------------------------------------------------------------ Bedienen

export function klick() {
  ton({ frequenz: 880, gleitenZu: 1320, dauer: 0.07, lautstaerke: 0.12, art: 'triangle' });
}

export function aufsammeln() {
  [76, 81, 84, 88].forEach((note, i) => ton({ frequenz: hertz(note), start: i * 0.06, dauer: 0.35, lautstaerke: 0.14 }));
  rauschen({ dauer: 0.3, lautstaerke: 0.05, filter: { art: 'highpass', frequenz: 8000 } });
}

export function ortWechsel() {
  rauschen({ dauer: 0.6, lautstaerke: 0.2, anschlag: 0.25, filter: { art: 'bandpass', frequenz: 400, zu: 2500, q: 1.5 } });
}

// ------------------------------------------------------------ in der Welt

// Ein Schritt. boden: 'gras', 'stein' oder 'erde'.
export function schritt(boden) {
  const laut = zufall(0.8, 1.1);
  if (boden === 'gras') {
    rauschen({ dauer: 0.16, lautstaerke: 0.1 * laut, anschlag: 0.02, filter: { art: 'bandpass', frequenz: zufall(2500, 4000), q: 0.7 }, zittern: 40 });
  } else if (boden === 'wasser') {
    // Ein Schwimmzug: ein weiches Rauschen und ein paar Blubberblasen
    rauschen({ dauer: 0.25, lautstaerke: 0.06 * laut, anschlag: 0.08, filter: { art: 'lowpass', frequenz: zufall(500, 800) } });
    ton({ frequenz: zufall(500, 800), gleitenZu: zufall(900, 1300), dauer: 0.06, lautstaerke: 0.04 * laut });
  } else if (boden === 'holz') {
    // Holzdielen: ein kurzes, hohles Klopfen
    ton({ frequenz: zufall(140, 170), gleitenZu: 110, dauer: 0.07, lautstaerke: 0.12 * laut, art: 'triangle' });
    rauschen({ dauer: 0.04, lautstaerke: 0.06 * laut, filter: { art: 'bandpass', frequenz: zufall(900, 1300), q: 3 } });
  } else if (boden === 'stein') {
    rauschen({ dauer: 0.07, lautstaerke: 0.14 * laut, filter: { art: 'bandpass', frequenz: zufall(1800, 2600), q: 2 } });
    ton({ frequenz: zufall(180, 230), dauer: 0.05, lautstaerke: 0.08 * laut, art: 'triangle' });
  } else {
    rauschen({ dauer: 0.09, lautstaerke: 0.12 * laut, filter: { art: 'lowpass', frequenz: zufall(700, 1000) } });
    ton({ frequenz: zufall(90, 110), gleitenZu: 60, dauer: 0.08, lautstaerke: 0.1 * laut });
  }
}

// Geräusche der Orte, die ab und zu zu hören sind.
export function umgebung(stil, ort) {
  const weg = raumWeg({ ...ort, sekunden: 3 });
  if (!weg) return;
  if (stil === 'regenwald') {
    // Der Regenwald: ein bunter Vogel, ein Frosch, Zikaden oder ein Tropfen
    const was = Math.random();
    if (was < 0.35) {
      // Ein tropischer Vogel ruft: hoch und runter, zweimal
      const f = zufall(1400, 2400);
      for (let i = 0; i < 2; i += 1) {
        ton({ frequenz: f, gleitenZu: f * 1.6, start: i * 0.28, dauer: 0.12, lautstaerke: 0.07, ziel: weg });
        ton({ frequenz: f * 1.6, gleitenZu: f * 0.9, start: i * 0.28 + 0.12, dauer: 0.12, lautstaerke: 0.06, ziel: weg });
      }
    } else if (was < 0.6) {
      // Ein Frosch quakt: tief und knarzig
      for (let i = 0; i < 3; i += 1) ton({ frequenz: zufall(110, 160), gleitenZu: 90, start: i * 0.16, dauer: 0.1, lautstaerke: 0.1, art: 'square', filter: { frequenz: 700 }, ziel: weg });
    } else if (was < 0.85) {
      // Zikaden zirpen: ein schnelles, hohes Schnarren
      rauschen({ dauer: 1.1, lautstaerke: 0.04, anschlag: 0.2, filter: { art: 'bandpass', frequenz: zufall(5000, 7000), q: 8 }, zittern: 28, ziel: weg });
    } else {
      // Ein dicker Regentropfen fällt auf ein Blatt.
      const f = zufall(700, 1100);
      ton({ frequenz: f, gleitenZu: f * 1.6, dauer: 0.08, lautstaerke: 0.1, ziel: weg });
    }
  } else if (stil === 'garten') {
    // Grillen zirpen in der Nacht.
    for (let i = 0; i < 2; i += 1) {
      rauschen({ dauer: 0.5, start: i * 0.7, lautstaerke: 0.03, anschlag: 0.05, filter: { art: 'bandpass', frequenz: zufall(4200, 5200), q: 10 }, zittern: 22, ziel: weg });
    }
  } else if (stil === 'himmel') {
    // Ein Windspiel klingt, wie Sterne, die aneinanderstoßen.
    for (let i = 0; i < 3; i += 1) {
      ton({ frequenz: zufall(1500, 2600), start: i * zufall(0.12, 0.3), dauer: 0.7, lautstaerke: 0.05, art: 'triangle', ziel: weg });
    }
  } else if (stil === 'wasser') {
    // Blasen steigen auf: blubb, blubb
    for (let i = 0; i < 3; i += 1) {
      const f = zufall(400, 900);
      ton({ frequenz: f, gleitenZu: f * 1.9, start: i * zufall(0.08, 0.2), dauer: 0.07, lautstaerke: 0.08, ziel: weg });
    }
  } else if (stil === 'haus') {
    // Das Feuer im Herd knistert.
    for (let i = 0; i < 4; i += 1) {
      rauschen({ dauer: 0.03, start: i * zufall(0.05, 0.2), lautstaerke: 0.05, filter: { art: 'bandpass', frequenz: zufall(2000, 4000), q: 2 }, ziel: weg });
    }
  } else if (stil === 'mine' || stil === 'gang') {
    // Ein Wassertropfen in der Höhle
    const f = zufall(900, 1500);
    ton({ frequenz: f, gleitenZu: f * 1.8, dauer: 0.12, lautstaerke: 0.12, ziel: weg });
  } else if (stil === 'see') {
    // Eine kleine Welle
    rauschen({ dauer: 2.2, lautstaerke: 0.07, anschlag: 0.9, filter: { frequenz: 500, zu: 1200, dauer: 1 }, ziel: weg });
  } else if (stil === 'wald') {
    // Kristalle im Wind, wie ein Windspiel
    for (let i = 0; i < 3; i += 1) ton({ frequenz: hertz([86, 89, 93, 96][Math.floor(Math.random() * 4)]), start: i * zufall(0.1, 0.3), dauer: 1.2, lautstaerke: 0.035, ziel: weg });
  } else {
    // Ein Vogel zwitschert
    for (let i = 0; i < 3; i += 1) {
      const f = zufall(2600, 3400);
      ton({ frequenz: f, gleitenZu: f * 1.3, start: i * 0.11, dauer: 0.07, lautstaerke: 0.05, ziel: weg });
    }
  }
}

// Der dunkle Kristall summt leise, so lange man in der Nähe ist.
export function kristallSummen() {
  return dauerton((kontext, ziel) => {
    // Das Summen schwillt langsam an und ab.
    const atem = kontext.createGain();
    atem.gain.value = 0.6;
    atem.connect(ziel);
    const quellen = [];
    for (const [frequenz, laut] of [[110, 0.2], [164.8, 0.13], [220.7, 0.07]]) {
      const welle = kontext.createOscillator();
      welle.frequency.value = frequenz;
      const verstaerker = kontext.createGain();
      verstaerker.gain.value = laut;
      welle.connect(verstaerker).connect(atem);
      welle.start();
      quellen.push(welle);
    }
    const atmen = kontext.createOscillator();
    atmen.frequency.value = 0.3;
    const tiefe = kontext.createGain();
    tiefe.gain.value = 0.4;
    atmen.connect(tiefe).connect(atem.gain);
    atmen.start();
    quellen.push(atmen);
    return quellen;
  });
}

// Ein Fangkristall in der Welt funkelt.
export function funkeln(ort) {
  const weg = raumWeg({ ...ort, sekunden: 1.5 });
  if (!weg) return;
  ton({ frequenz: hertz(93), dauer: 0.5, lautstaerke: 0.06, ziel: weg });
  ton({ frequenz: hertz(100), start: 0.08, dauer: 0.5, lautstaerke: 0.04, ziel: weg });
}

// ---------------------------------------------------------------- Rufe

// Jedes Kalamprio ruft mit seiner Stimme aus daten/klaenge.js.
// traurig: true macht den Ruf tiefer und langsamer (wenn es nicht mehr kann).
// hoechstens: (optional) so viele Silben höchstens, für einen kurzen Ruf
export function ruf(art, { ort = {}, traurig = false, hoechstens = 6 } = {}) {
  const { stimme = 'piepsen', hoehe = 'mittel', silben: alleSilben = 2 } = KLAENGE.rufe[art] ?? {};
  const silben = Math.min(alleSilben, hoechstens);
  const weg = raumWeg({ ...ort, lautstaerke: (ort.lautstaerke ?? 1) * KLAENGE.rufLautstaerke, sekunden: 3 });
  if (!weg) return;
  const f = 520 * (HOEHEN[hoehe] ?? 1) * (traurig ? 0.7 : 1);
  const langsam = traurig ? 1.6 : 1;
  STIMMEN[stimme](f, silben, langsam, weg, traurig);
}

const STIMMEN = {
  piepsen(f, silben, langsam, ziel, traurig) {
    for (let i = 0; i < silben; i += 1) {
      const h = f * (1 + i * 0.12);
      ton({ frequenz: h, gleitenZu: traurig ? h * 0.7 : h * 1.4, start: i * 0.14 * langsam, dauer: 0.1 * langsam, lautstaerke: 0.22, ziel });
    }
  },
  glocke(f, silben, langsam, ziel, traurig) {
    const stufen = traurig ? [7, 4, 0, -5, -8, -12] : [0, 4, 7, 12, 16, 19];
    for (let i = 0; i < silben; i += 1) {
      const h = f * 2 ** (stufen[i % stufen.length] / 12);
      ton({ frequenz: h, start: i * 0.16 * langsam, dauer: 0.9, lautstaerke: 0.2, ziel });
      ton({ frequenz: h * 2.01, start: i * 0.16 * langsam, dauer: 0.4, lautstaerke: 0.06, ziel });
    }
  },
  glitzern(f, silben, langsam, ziel) {
    for (let i = 0; i < silben; i += 1) {
      const h = f * 2 * 2 ** (Math.floor(zufall(0, 8)) / 12);
      ton({ frequenz: h, start: i * 0.06 * langsam, dauer: 0.45, lautstaerke: 0.17, ziel });
    }
  },
  miauen(f, silben, langsam, ziel, traurig) {
    for (let i = 0; i < silben; i += 1) {
      const start = i * 0.42 * langsam;
      const h = f * (i % 2 ? 0.9 : 1);
      ton({ frequenz: h * 0.8, gleitenZu: traurig ? h * 0.6 : h * 1.25, gleitDauer: 0.18 * langsam, start, dauer: 0.34 * langsam, lautstaerke: 0.22, anschlag: 0.03, ausklang: 0.12, art: 'sawtooth', filter: { art: 'bandpass', frequenz: 1400, zu: 900, q: 2 }, ziel });
    }
  },
  brummen(f, silben, langsam, ziel) {
    for (let i = 0; i < silben; i += 1) {
      const h = f * 0.3 * (i % 2 ? 0.85 : 1);
      ton({ frequenz: h, start: i * 0.3 * langsam, dauer: 0.26 * langsam, lautstaerke: 0.3, anschlag: 0.03, ausklang: 0.1, art: 'sawtooth', filter: { frequenz: 500 }, vibrato: { tempo: 9, tiefe: 0.04 }, ziel });
    }
  },
  blubbern(f, silben, langsam, ziel) {
    for (let i = 0; i < silben; i += 1) {
      const h = f * zufall(0.8, 1.3);
      ton({ frequenz: h * 0.6, gleitenZu: h * 1.5, start: i * 0.1 * langsam, dauer: 0.08, lautstaerke: 0.22, ziel });
    }
  },
  pfeifen(f, silben, langsam, ziel, traurig) {
    for (let i = 0; i < silben; i += 1) {
      const h = f * 2 * (i % 2 ? 1.2 : 1);
      ton({ frequenz: h, gleitenZu: traurig ? h * 0.75 : h * 1.15, start: i * 0.3 * langsam, dauer: 0.24 * langsam, lautstaerke: 0.17, anschlag: 0.03, ausklang: 0.08, vibrato: { tempo: 12, tiefe: 0.02 }, ziel });
    }
  },
  gurren(f, silben, langsam, ziel) {
    for (let i = 0; i < silben; i += 1) {
      const h = f * 0.5;
      ton({ frequenz: h * 1.1, gleitenZu: h * 0.85, start: i * 0.26 * langsam, dauer: 0.22 * langsam, lautstaerke: 0.25, anschlag: 0.04, art: 'triangle', vibrato: { tempo: 22, tiefe: 0.03 }, ziel });
    }
  },
  zirpen(f, silben, langsam, ziel) {
    for (let i = 0; i < silben; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        ton({ frequenz: f * 2, start: (i * 0.24 + j * 0.035) * langsam, dauer: 0.025, lautstaerke: 0.12, art: 'square', filter: { frequenz: 5000 }, ziel });
      }
    }
  },
  ticken(f, silben, langsam, ziel) {
    for (let i = 0; i < silben; i += 1) {
      rauschen({ start: i * 0.25 * langsam, dauer: 0.03, lautstaerke: 0.25, filter: { art: 'bandpass', frequenz: i % 2 ? 2400 : 3200, q: 4 }, ziel });
    }
    ton({ frequenz: f * 2, start: silben * 0.25 * langsam, dauer: 0.8, lautstaerke: 0.15, ziel });
  },
  zauber(f, silben, langsam, ziel) {
    rauschen({ dauer: 1.2, lautstaerke: 0.06, anschlag: 0.6, filter: { art: 'highpass', frequenz: 6000 }, ziel });
    for (let i = 0; i < silben; i += 1) {
      const h = f * 2 ** ([0, 3, 7, 10, 14, 17][i % 6] / 12);
      ton({ frequenz: h, start: i * 0.15 * langsam, dauer: 1.2, lautstaerke: 0.1, anschlag: 0.08, vibrato: { tempo: 5, tiefe: 0.01 }, ziel });
      ton({ frequenz: h * 1.5, start: i * 0.15 * langsam + 0.05, dauer: 1, lautstaerke: 0.04, anschlag: 0.1, ziel });
    }
  },
};

// ---------------------------------------------------------------- Kampf

// Ein Kalamprio springt in den Kampf und landet.
export function landen() {
  ton({ frequenz: 120, gleitenZu: 50, dauer: 0.25, lautstaerke: 0.35 });
  rauschen({ dauer: 0.3, lautstaerke: 0.12, filter: { frequenz: 900, zu: 200 } });
}

export function wusch(lautstaerke = 0.25, hoch = false) {
  rauschen({ dauer: 0.3, lautstaerke, anschlag: 0.08, filter: { art: 'bandpass', frequenz: hoch ? 3000 : 600, zu: hoch ? 800 : 2400, q: 1.2 } });
}

// Das Kalamprio lädt seine Attacke auf: ein Ton, der immer höher wird.
export function aufladen(sekunden, stark) {
  ton({ frequenz: 200, gleitenZu: stark ? 1100 : 800, dauer: sekunden, lautstaerke: 0.08, anschlag: sekunden * 0.6, art: 'sawtooth', filter: { frequenz: 600, zu: 3000 } });
  ton({ frequenz: 400, gleitenZu: stark ? 2200 : 1600, dauer: sekunden, lautstaerke: 0.06, anschlag: sekunden * 0.6, vibrato: { tempo: 14, tiefe: 0.02 } });
}

// Der Treffer: ein dumpfer Schlag und ein Knall
export function wumms(stark) {
  ton({ frequenz: stark ? 160 : 200, gleitenZu: 40, dauer: stark ? 0.45 : 0.3, lautstaerke: stark ? 0.6 : 0.45 });
  rauschen({ dauer: stark ? 0.4 : 0.22, lautstaerke: stark ? 0.3 : 0.2, filter: { frequenz: 4000, zu: 300 } });
}

export function glitzern(anzahl = 5, hoehe = 1) {
  for (let i = 0; i < anzahl; i += 1) {
    ton({ frequenz: hertz(84 + Math.floor(zufall(0, 14))) * hoehe, start: i * zufall(0.03, 0.07), dauer: 0.3, lautstaerke: 0.06 });
  }
}

export function mondKlang(stark) {
  for (const [stufe, start] of [[0, 0], [7, 0.05], [12, 0.1]]) {
    ton({ frequenz: hertz(76 + stufe), start, dauer: stark ? 1.2 : 0.8, lautstaerke: 0.09, vibrato: { tempo: 6, tiefe: 0.01 } });
  }
}

export function zap(lautstaerke = 0.6) {
  const f = zufall(70, 110);
  ton({ frequenz: f, gleitenZu: f * 0.5, dauer: 0.18, lautstaerke: 0.14 * lautstaerke, art: 'sawtooth', vibrato: { tempo: 60, tiefe: 0.4 } });
  rauschen({ dauer: 0.15, lautstaerke: 0.25 * lautstaerke, filter: { art: 'highpass', frequenz: 2500 }, zittern: 70 });
}

export function donner(stark) {
  rauschen({ dauer: 0.12, lautstaerke: 0.4, filter: { art: 'highpass', frequenz: 1500 } });
  rauschen({ start: 0.05, dauer: stark ? 1.4 : 0.9, lautstaerke: 0.35, anschlag: 0.05, filter: { frequenz: 600, zu: 120 }, zittern: 9 });
}

export function pling(hoehe = 1) {
  ton({ frequenz: zufall(1800, 2600) * hoehe, dauer: 0.18, lautstaerke: 0.08, art: 'triangle' });
}

export function klirren() {
  for (let i = 0; i < 6; i += 1) ton({ frequenz: zufall(2500, 6000), start: zufall(0, 0.1), dauer: zufall(0.1, 0.3), lautstaerke: 0.05 });
  rauschen({ dauer: 0.15, lautstaerke: 0.1, filter: { art: 'highpass', frequenz: 5000 } });
}

// Wie wenn Metall angeschlagen wird
export function metall(lautstaerke = 1) {
  for (const [teil, laut] of [[1, 0.1], [2.76, 0.06], [5.4, 0.04], [8.93, 0.02]]) {
    ton({ frequenz: 420 * teil, dauer: 0.9, lautstaerke: laut * lautstaerke });
  }
}

export function rascheln(sekunden = 0.6) {
  rauschen({ dauer: sekunden, lautstaerke: 0.14, anschlag: 0.05, filter: { art: 'bandpass', frequenz: 3500, q: 0.6 }, zittern: 28 });
}

export function schattenKlang(stark) {
  ton({ frequenz: 140, gleitenZu: 70, dauer: stark ? 0.9 : 0.6, lautstaerke: 0.25, art: 'sawtooth', filter: { frequenz: 400 }, vibrato: { tempo: 5, tiefe: 0.08 } });
  rauschen({ dauer: 0.8, lautstaerke: 0.08, anschlag: 0.3, filter: { frequenz: 300 } });
}

export function rumpeln() {
  ton({ frequenz: 90, gleitenZu: 40, dauer: 0.3, lautstaerke: 0.35 });
  rauschen({ dauer: 0.35, lautstaerke: 0.22, filter: { frequenz: 700, zu: 150 } });
}

export function wind(sekunden = 0.9, lautstaerke = 0.25) {
  rauschen({ dauer: sekunden, lautstaerke, anschlag: sekunden * 0.3, filter: { art: 'bandpass', frequenz: 500, zu: 2000, q: 2 } });
  rauschen({ dauer: sekunden, lautstaerke: lautstaerke * 0.5, anschlag: sekunden * 0.5, filter: { art: 'bandpass', frequenz: 1800, zu: 700, q: 3 } });
}

// Ein altes, rostiges Rad quietscht: hoch und kratzig, mal lauter, mal leiser.
// ort sagt, wie weit weg es ist (siehe raumWeg in klang.js).
export function quietschen(ort = {}) {
  const weg = raumWeg(ort);
  if (!weg) return;
  const f = zufall(1100, 1500);
  ton({ frequenz: f, gleitenZu: f * 1.35, dauer: 0.35, lautstaerke: 0.06, art: 'sawtooth', filter: { frequenz: 2600 }, vibrato: { tempo: 22, tiefe: 0.03 }, ziel: weg });
  ton({ frequenz: f * 1.3, gleitenZu: f * 0.9, start: 0.38, dauer: 0.3, lautstaerke: 0.05, art: 'sawtooth', filter: { frequenz: 2600 }, vibrato: { tempo: 25, tiefe: 0.03 }, ziel: weg });
}

// Ein Frosch quakt: tief und knarzig, zweimal.
export function quaken(ort = {}) {
  const weg = raumWeg(ort);
  if (!weg) return;
  for (let i = 0; i < 2; i += 1) {
    ton({ frequenz: zufall(140, 190), gleitenZu: 100, start: i * 0.22, dauer: 0.14, lautstaerke: 0.14, art: 'square', filter: { frequenz: 800 }, ziel: weg });
  }
}

export function plopp(hoehe = 1) {
  const f = zufall(300, 500) * hoehe;
  ton({ frequenz: f, gleitenZu: f * 2.2, dauer: 0.09, lautstaerke: 0.18 });
}

export function herzPochen() {
  ton({ frequenz: 90, gleitenZu: 55, dauer: 0.12, lautstaerke: 0.3 });
  ton({ frequenz: 85, gleitenZu: 50, start: 0.16, dauer: 0.12, lautstaerke: 0.22 });
  ton({ frequenz: hertz(88), start: 0.05, dauer: 0.4, lautstaerke: 0.05 });
}

export function tick(tack = false) {
  rauschen({ dauer: 0.03, lautstaerke: 0.3, filter: { art: 'bandpass', frequenz: tack ? 2000 : 3000, q: 5 } });
}

// Ein Wecker klingelt.
export function klingeln(sekunden = 0.8) {
  for (let t = 0; t < sekunden; t += 0.05) {
    ton({ frequenz: 1900, start: t, dauer: 0.045, lautstaerke: 0.07, art: 'square', filter: { frequenz: 4000 } });
  }
}

// Die Zeit springt wieder an: ein Ton, der rückwärts klingt.
export function zeitSprung() {
  ton({ frequenz: 300, gleitenZu: 1200, dauer: 0.35, lautstaerke: 0.15, anschlag: 0.3, art: 'triangle' });
  rauschen({ dauer: 0.35, lautstaerke: 0.15, anschlag: 0.3, filter: { art: 'highpass', frequenz: 2000 } });
}

export function zeitLangsam(sekunden) {
  ton({ frequenz: 440, gleitenZu: 110, dauer: sekunden, lautstaerke: 0.08, anschlag: 0.05, ausklang: 0.4, vibrato: { tempo: 2, tiefe: 0.03 } });
}

export function sternchen() {
  glitzern(4, 1.2);
  ton({ frequenz: hertz(91), dauer: 0.5, lautstaerke: 0.06, vibrato: { tempo: 8, tiefe: 0.01 } });
}

// Ein langer, summender Strahl
export function strahl(sekunden, stark) {
  for (const stufe of stark ? [0, 7, 12] : [0, 7]) {
    ton({ frequenz: hertz(64 + stufe), dauer: sekunden, lautstaerke: 0.06, anschlag: 0.08, ausklang: 0.2, art: 'sawtooth', filter: { frequenz: 1800 }, vibrato: { tempo: 16, tiefe: 0.01 } });
  }
  rauschen({ dauer: sekunden, lautstaerke: 0.08, anschlag: 0.08, ausklang: 0.2, filter: { art: 'bandpass', frequenz: 3000, q: 1 } });
}

// Ein Akkord, der schwankt wie im Traum
export function traum(sekunden) {
  for (const note of [72, 76, 79, 83]) {
    ton({ frequenz: hertz(note), dauer: sekunden, lautstaerke: 0.05, anschlag: 0.2, ausklang: 0.4, vibrato: { tempo: 3, tiefe: 0.025 } });
  }
}

export function kratzen() {
  rauschen({ dauer: 0.1, lautstaerke: 0.22, filter: { art: 'bandpass', frequenz: 6000, zu: 2000, q: 1 } });
}

export function schnapp() {
  rauschen({ dauer: 0.05, lautstaerke: 0.35, filter: { art: 'bandpass', frequenz: 1500, q: 2 } });
  ton({ frequenz: 300, gleitenZu: 80, dauer: 0.12, lautstaerke: 0.3, art: 'square', filter: { frequenz: 900 } });
  rauschen({ start: 0.04, dauer: 0.25, lautstaerke: 0.2, filter: { frequenz: 1500 }, zittern: 30 });
}

// Ein Faden wird gezupft und rutscht nach oben
export function faden(hoehe = 1) {
  ton({ frequenz: 300 * hoehe, gleitenZu: 900 * hoehe, dauer: 0.35, lautstaerke: 0.1, art: 'sawtooth', filter: { frequenz: 2500, zu: 700 } });
}

export function fadenReissen() {
  ton({ frequenz: 1200, gleitenZu: 200, dauer: 0.2, lautstaerke: 0.12, art: 'triangle' });
}

// Etwas pfeift beim Herunterfallen
export function pfeifenFallen(sekunden) {
  ton({ frequenz: 1800, gleitenZu: 500, dauer: sekunden, lautstaerke: 0.08, ausklang: 0.05 });
}

export function explosion(stark) {
  ton({ frequenz: 110, gleitenZu: 30, dauer: stark ? 1.1 : 0.8, lautstaerke: 0.7 });
  rauschen({ dauer: stark ? 1.6 : 1.1, lautstaerke: 0.45, filter: { frequenz: 3000, zu: 120 } });
}

export function wasserWirbel(sekunden) {
  rauschen({ dauer: sekunden, lautstaerke: 0.2, anschlag: 0.2, ausklang: 0.3, filter: { art: 'bandpass', frequenz: 400, zu: 1600, q: 3 }, zittern: 7 });
  for (let i = 0; i < 8; i += 1) plopp(zufall(0.7, 1.6) * (1 + i * 0.05));
}

export function krone() {
  [72, 76, 79, 84].forEach((note, i) => ton({ frequenz: hertz(note), start: i * 0.08, dauer: 0.8, lautstaerke: 0.1, art: 'triangle' }));
}

// Das Schild aus Licht hält die Attacke auf.
export function schild() {
  ton({ frequenz: 220, dauer: 1.6, lautstaerke: 0.25 });
  ton({ frequenz: 330.5, dauer: 1.4, lautstaerke: 0.12 });
  ton({ frequenz: 880, dauer: 1, lautstaerke: 0.06, vibrato: { tempo: 7, tiefe: 0.01 } });
}

// Ein Kalamprio kann nicht mehr: es rutscht nach unten.
export function umfallen() {
  ton({ frequenz: 600, gleitenZu: 120, dauer: 0.7, lautstaerke: 0.12, art: 'triangle' });
  ton({ start: 0.6, frequenz: 90, gleitenZu: 45, dauer: 0.25, lautstaerke: 0.3 });
}

export function einwechseln() {
  ton({ frequenz: 500, gleitenZu: 1500, dauer: 0.25, lautstaerke: 0.1, art: 'triangle' });
  glitzern(3);
}

// --------------------------------------------------------- Fangkristall

export function werfen() {
  wusch(0.2, true);
}

export function einsaugen() {
  ton({ frequenz: 300, gleitenZu: 1600, dauer: 0.42, lautstaerke: 0.12, art: 'triangle' });
  rauschen({ dauer: 0.42, lautstaerke: 0.1, anschlag: 0.3, filter: { art: 'bandpass', frequenz: 800, zu: 5000, q: 2 } });
}

export function aufprallen() {
  ton({ frequenz: hertz(84), dauer: 0.25, lautstaerke: 0.1, art: 'triangle' });
  ton({ frequenz: hertz(84), start: 0.18, dauer: 0.15, lautstaerke: 0.05, art: 'triangle' });
}

export function wackeln() {
  ton({ frequenz: 260, gleitenZu: 200, dauer: 0.08, lautstaerke: 0.18, art: 'triangle' });
  ton({ frequenz: 220, gleitenZu: 180, start: 0.14, dauer: 0.08, lautstaerke: 0.14, art: 'triangle' });
}

export function zerspringen() {
  klirren();
  ton({ frequenz: 900, gleitenZu: 200, dauer: 0.3, lautstaerke: 0.1, art: 'square', filter: { frequenz: 3000 } });
}

export function erfahrung() {
  for (let i = 0; i < 6; i += 1) ton({ frequenz: hertz(79 + i * 2), start: i * 0.07, dauer: 0.2, lautstaerke: 0.07, art: 'triangle' });
}

// ------------------------------------------------------------- Rätsel

// Jeder Klangstein singt seinen eigenen Ton (Töne wie auf einem Glockenspiel).
const KLANGSTEIN_NOTEN = [72, 74, 76, 79, 81, 84];
// Ein Kampf beginnt: ein Ton, der schnell nach oben saust, dann ein Trommelschlag
export function kampfBeginnt() {
  ton({ frequenz: 220, gleitenZu: 1400, dauer: 0.35, lautstaerke: 0.14, art: 'sawtooth', filter: { frequenz: 2500 } });
  rauschen({ dauer: 0.35, lautstaerke: 0.12, anschlag: 0.25, filter: { art: 'bandpass', frequenz: 800, zu: 4000, q: 1 } });
  ton({ frequenz: 110, gleitenZu: 45, start: 0.36, dauer: 0.4, lautstaerke: 0.5 });
  rauschen({ start: 0.36, dauer: 0.3, lautstaerke: 0.25, filter: { frequenz: 3000, zu: 200 } });
}

// Eine Belohnung: ein funkelnder Akkord, der nach oben läuft, mit Glitzern
export function belohnung() {
  [72, 76, 79, 84, 88, 91].forEach((note, i) => ton({ frequenz: hertz(note), start: i * 0.07, dauer: 0.9 - i * 0.06, lautstaerke: 0.1, art: 'triangle' }));
  ton({ frequenz: hertz(96), start: 0.45, dauer: 1.2, lautstaerke: 0.05, vibrato: { tempo: 7, tiefe: 0.012 } });
  glitzern(8, 1.3);
}

// Der Auslöser der Kamera: ein kurzes Klicken und Surren
export function ausloeser() {
  rauschen({ dauer: 0.04, lautstaerke: 0.25, filter: { art: 'bandpass', frequenz: 3500, q: 2 } });
  ton({ frequenz: 1800, gleitenZu: 900, start: 0.05, dauer: 0.05, lautstaerke: 0.08, art: 'square', filter: { frequenz: 2500 } });
  rauschen({ start: 0.12, dauer: 0.25, lautstaerke: 0.06, filter: { art: 'bandpass', frequenz: 1200, zu: 2200, q: 4 } });
}

export function klangstein(nummer) {
  const note = KLANGSTEIN_NOTEN[nummer % KLANGSTEIN_NOTEN.length];
  ton({ frequenz: hertz(note), dauer: 0.9, lautstaerke: 0.16, art: 'triangle' });
  ton({ frequenz: hertz(note + 12), dauer: 0.5, lautstaerke: 0.05 });
}

// Felsen rollen zur Seite und ein verschütteter Weg wird frei.
export function geroell() {
  rauschen({ dauer: 1.6, lautstaerke: 0.35, anschlag: 0.1, filter: { frequenz: 500, zu: 90 }, zittern: 13 });
  for (let i = 0; i < 6; i += 1) ton({ frequenz: zufall(70, 140), start: i * 0.22 + zufall(0, 0.1), dauer: 0.2, lautstaerke: 0.25 });
}

// ------------------------------------------------- Daneben und Abwehren

// Eine Attacke saust ins Leere.
export function daneben() {
  wusch(0.3, true);
  ton({ frequenz: 700, gleitenZu: 300, start: 0.1, dauer: 0.35, lautstaerke: 0.08, art: 'triangle' });
}

// Ein Kalamprio springt zur Seite.
export function ausweichen() {
  wusch(0.25);
  ton({ frequenz: 400, gleitenZu: 900, dauer: 0.18, lautstaerke: 0.09, art: 'triangle' });
}

// Ein Kalamprio wehrt eine Attacke ab: ein dumpfer Schlag auf einen Schild.
export function abwehren() {
  ton({ frequenz: 180, gleitenZu: 120, dauer: 0.25, lautstaerke: 0.3 });
  metall(0.6);
}
