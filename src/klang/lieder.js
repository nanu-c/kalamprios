// Die Lieder des Spiels: für jeden Ort ein eigenes Lied, vier für Kämpfe
// (welche, steht in klaenge.js bei kampflieder), eins für den Kampf gegen das
// geheime Kalamprio und eins für die Party.
// Dazu kurze Melodien, wenn man gewinnt, verliert, etwas fängt oder ein
// Level höher kommt.
//
// So ist ein Lied aufgeschrieben:
//   tempo:    Schläge pro Minute
//   akkorde:  ein Akkord pro Takt, zum Beispiel 'F' (Dur) oder 'Dm' (Moll).
//             'Bb C' heißt: halber Takt Bb, halber Takt C.
//   melodie:  pro Takt acht Achtelnoten. 'A4' ist eine Note, '-' hält die
//             Note davor länger, '.' ist eine Pause.
//   bass, begleitung: welche Töne des Akkords gespielt werden (1 Grundton,
//             3 Terz, 5 Quinte, 8 Grundton höher, 0 Terz höher, '.' Pause).
//             8 Zeichen sind Achtel, 16 Zeichen Sechzehntel.
//   schlagzeug: 16 Zeichen pro Takt: k Bauchtrommel, s Schnarre, h Becken
//   klang:    welches Instrument die Melodie spielt

export const LIEDER = {
  // Lila Dorf und Startbildschirm: fröhlich
  dorf: {
    tempo: 96,
    klang: 'glocke',
    akkorde: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb C', 'F'],
    melodie: [
      'A4 - C5 - F5 - E5 D5',
      'C5 - - - G4 - . .',
      'D5 - F5 - A5 - G5 F5',
      'F5 - D5 - - - . .',
      'A4 C5 F5 A5 G5 - F5 E5',
      'E5 - G5 - E5 - C5 -',
      'D5 - F5 - E5 - G5 -',
      'F5 - - - - - . .',
    ],
    bass: '1...5...',
    begleitung: '1.3.5.3.',
    schlagzeug: 'k...h...s...h...',
  },

  // Kristallwald: geheimnisvoll und glitzernd
  wald: {
    tempo: 84,
    klang: 'zupfen',
    akkorde: ['Dm', 'C', 'Bb', 'C', 'Dm', 'F', 'G', 'A'],
    melodie: [
      'A4 - - - D5 - E5 F5',
      'E5 - - - C5 - . .',
      'D5 - - - F5 - E5 D5',
      'E5 - - - - - . .',
      'A5 - - - F5 - D5 -',
      'C5 - - - A4 - C5 -',
      'B4 - D5 - G5 - F5 E5',
      'E5 - - - C#5 - - -',
    ],
    bass: '1.......',
    begleitung: '1358853113588531',
    flaeche: true,
    schlagzeug: '..h...h...h...h.',
  },

  // Prismastahl-Mine: dunkel, langsam, mit viel Hall
  mine: {
    tempo: 66,
    klang: 'glocke',
    akkorde: ['Am', 'Am', 'F', 'E', 'Am', 'Dm', 'E', 'E'],
    melodie: [
      'E5 - - - . . . .',
      '. . A5 - G5 - E5 -',
      'F5 - - - . . . .',
      '. . G#5 - - - . .',
      'C5 - - - E5 - A4 -',
      'D5 - - - F5 - . .',
      'B4 - - - E5 - - -',
      'G#4 - - - - - . .',
    ],
    bass: '1...5...',
    flaeche: true,
    schlagzeug: 'k.......k.......',
  },

  // Mondsee: verträumt
  see: {
    tempo: 72,
    klang: 'floete',
    akkorde: ['Eb', 'Ab', 'Cm', 'Bb', 'Eb', 'Ab', 'Fm', 'Bb'],
    melodie: [
      'G4 - - - Bb4 - Eb5 -',
      'C5 - - - - - Bb4 Ab4',
      'G4 - - - Eb5 - D5 C5',
      'D5 - - - - - . .',
      'Bb4 - Eb5 - G5 - F5 Eb5',
      'Eb5 - C5 - - - Ab4 -',
      'Ab4 - C5 - F5 - Eb5 D5',
      'Bb4 - - - - - . .',
    ],
    bass: '1.......',
    begleitung: '13588531',
    flaeche: true,
  },

  // Die Geschichte am Anfang: leise, damit man die Stimme gut hört
  geschichte: {
    tempo: 64,
    akkorde: ['Am', 'F', 'C', 'G'],
    bass: '1.......',
    begleitung: '1.5.8.5.',
    flaeche: true,
  },

  // Kampf: schnell und mutig
  kampf: {
    tempo: 140,
    klang: 'quadrat',
    akkorde: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'],
    melodie: [
      'E5 - B4 - E5 - G5 -',
      'F#5 - E5 - D5 - B4 -',
      'C5 - E5 - G5 - E5 -',
      'F#5 - - - A5 - F#5 -',
      'G5 - F#5 - E5 - B4 -',
      'E5 - G5 - B5 - A5 G5',
      'E5 - - - G5 - C5 -',
      'D#5 - F#5 - B5 - A5 F#5',
    ],
    bass: '18185818',
    begleitung: '1358535813585358',
    schlagzeug: 'k.h.s.h.k.k.s.h.',
  },

  // Kampf: hüpfend und fröhlich
  kampfHuepfend: {
    tempo: 150,
    klang: 'zupfen',
    akkorde: ['D', 'D', 'G', 'A', 'Bm', 'G', 'Em A', 'D'],
    melodie: [
      'D5 - F#5 - A5 - F#5 -',
      'D5 - A4 - D5 - F#5 E5',
      'G5 - - - B5 - A5 G5',
      'A5 - - - E5 - . .',
      'F#5 - D5 - B4 - D5 F#5',
      'G5 - B5 - D6 - B5 -',
      'G5 - E5 - C#5 - E5 -',
      'D5 - - - - - . .',
    ],
    bass: '18181818',
    begleitung: '1358535813585358',
    schlagzeug: 'k...s.h.k.k.s.h.',
  },

  // Kampf: wirbelnd und flink
  kampfWirbel: {
    tempo: 156,
    klang: 'quadrat',
    akkorde: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm E', 'Am'],
    melodie: [
      'A4 C5 E5 A5 G5 E5 C5 E5',
      'F5 - A5 - C6 - A5 -',
      'G5 - B5 - D6 - B5 G5',
      'G#5 - - - E5 - B4 -',
      'A5 - E5 - C5 - E5 A5',
      'C6 - A5 - F5 - A5 -',
      'D5 - F5 - E5 - G#5 -',
      'A5 - - - E5 - A4 -',
    ],
    bass: '1.851.85',
    begleitung: '1358135813581358',
    schlagzeug: 'k.hks.hhk.hks.hs',
  },

  // Kampf: mutig wie ein Held, mit Glocken
  kampfMutig: {
    tempo: 132,
    klang: 'glocke',
    akkorde: ['G', 'D', 'Em', 'C', 'G', 'D', 'C D', 'G'],
    melodie: [
      'B4 - D5 - G5 - - -',
      'F#5 - E5 - D5 - A4 -',
      'B4 - E5 - G5 - B5 -',
      'A5 - G5 - E5 - C5 -',
      'D5 - G5 - B5 - A5 G5',
      'F#5 - A5 - D6 - - -',
      'E5 - C5 - F#5 - A5 -',
      'G5 - - - - - . .',
    ],
    bass: '1.5.1.5.',
    begleitung: '13581358',
    flaeche: true,
    schlagzeug: 'k.h.s.h.k.h.s.hh',
  },

  // Kampf gegen das geheime Kalamprio: noch schneller und spannender
  geheim: {
    tempo: 150,
    klang: 'quadrat',
    akkorde: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm G', 'Cm'],
    melodie: [
      'C5 - Eb5 - G5 - C6 -',
      'Bb5 - Ab5 - G5 - Eb5 -',
      'F5 - D5 - Bb4 - D5 F5',
      'G5 - - - B4 - D5 -',
      'Eb5 - D5 - C5 - G4 -',
      'Ab4 - C5 - Eb5 - Ab5 -',
      'F5 - Ab5 - G5 - B5 -',
      'C6 - - - G5 - Eb5 -',
    ],
    bass: '18181818',
    begleitung: '1358853113588531',
    flaeche: true,
    schlagzeug: 'k.hks.h.k.hks.hs',
  },

  // Die Party am Ende
  ende: {
    tempo: 124,
    klang: 'glocke',
    akkorde: ['C', 'G', 'Am', 'F', 'C', 'G', 'F G', 'C'],
    melodie: [
      'E5 - G5 - C6 - G5 -',
      'B5 - - - G5 - D5 -',
      'C6 - B5 - A5 - E5 -',
      'F5 - A5 - C6 - A5 -',
      'G5 - E5 - C5 - E5 G5',
      'D5 - G5 - B5 - - -',
      'A5 - F5 - G5 - B5 -',
      'C6 - - - - - . .',
    ],
    bass: '18181818',
    begleitung: '1358535813585358',
    schlagzeug: 'k.h.s.h.k.hks.h.',
  },
};

// Kurze Melodien, die einmal gespielt werden: [Note, Länge in Achteln]
export const MELODIEN = {
  sieg: { tempo: 150, klang: 'glocke', noten: [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 2], ['G5', 1], ['C6', 4]], akkord: 'C' },
  niederlage: { tempo: 90, klang: 'floete', noten: [['E5', 2], ['D5', 2], ['C5', 2], ['B4', 2], ['A4', 6]], akkord: 'Am' },
  gefangen: { tempo: 170, klang: 'glocke', noten: [['G5', 1], ['C6', 1], ['E6', 1], ['G6', 1], ['E6', 1], ['G6', 4]], akkord: 'C' },
  level: { tempo: 160, klang: 'quadrat', noten: [['C5', 1], ['C5', 1], ['C5', 1], ['C5', 2], ['Ab4', 2], ['Bb4', 2], ['C5', 1], ['.', 1], ['Bb4', 1], ['C5', 6]], akkord: 'C' },
};

// ------------------------------------------------------------- Noten lesen

const STUFEN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// 'C#5' -> 73
export function noteLesen(name) {
  const [, buchstabe, zeichen, oktave] = name.match(/^([A-G])([#b]?)(\d)$/);
  return 12 * (Number(oktave) + 1) + STUFEN[buchstabe] + (zeichen === '#' ? 1 : zeichen === 'b' ? -1 : 0);
}

// 'Dm' -> die Töne des Akkords, als Abstände zum Grundton
export function akkordLesen(name) {
  const [, grund, zeichen, moll] = name.match(/^([A-G])([#b]?)(m?)$/);
  const ton = (STUFEN[grund] + (zeichen === '#' ? 1 : zeichen === 'b' ? -1 : 0) + 12) % 12;
  return { ton, terz: moll ? 3 : 4 };
}

// Welche Note eine Ziffer aus bass oder begleitung im Akkord ist.
export function akkordTon(akkord, ziffer, tiefe) {
  const abstand = { 1: 0, 3: akkord.terz, 5: 7, 8: 12, 0: akkord.terz + 12 }[ziffer];
  return tiefe + akkord.ton + abstand;
}

// Jedes Lied wird einmal in eine Liste aus Achteln und Sechzehnteln übersetzt.
export function liedVorbereiten(lied) {
  const takte = lied.akkorde.map((zeile, nummer) => {
    const akkorde = zeile.split(' ').map(akkordLesen);
    const melodie = lied.melodie ? lied.melodie[nummer].split(' ') : [];
    return { akkorde, melodie };
  });
  return { ...lied, takte };
}


