// Das Lila Dorf: Hier beginnt das Abenteuer. Diese Datei gehört dir!
// Was die Angaben bedeuten, steht oben in kristallwald.js.
// Im Dorf gibt es keine wilden Kalamprios.

export const LILA_DORF = {
  name: 'Lila Dorf',
  stil: 'dorf',
  breite: 1800,
  hoehe: 1200,

  ausgaenge: [{ nach: 'kristallwald', seite: 'rechts', mitte: 640 }],

  start: { x: 520, y: 700 },

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 300, y: 720 },

  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],

  haeuser: [
    { x: 380, y: 430 },
    { x: 880, y: 400 },
    { x: 1380, y: 440 },
    { x: 700, y: 1000 },
    { x: 1260, y: 1010 },
  ],

  baeume: [
    { x: 1620, y: 320 },
    { x: 160, y: 960 },
    { x: 1000, y: 1120 },
    { x: 1640, y: 1000 },
  ],

  // Leuchtkristalle wie Laternen am Weg, und der große Kristall auf dem Platz
  kristalle: [
    { x: 640, y: 560 },
    { x: 1150, y: 560 },
    { x: 900, y: 690 },
    { x: 640, y: 810 },
    { x: 1150, y: 810 },
  ],

  fangkristalle: [{ x: 1500, y: 720 }],

  // Das Rätsel: Drei Glöckchen liegen versteckt hinter Häusern und Bäumen.
  raetsel: {
    art: 'suchen',
    x: 780,
    y: 700,
    aufgabe: [
      'Ein alter Rätselstein mit einem goldenen Fragezeichen. Er brummt freundlich.',
      '„Der Schatten hat drei goldene Glöckchen aus dem Dorf mitgenommen und auf der Flucht verloren.“',
      '„Sie liegen gut versteckt, hinter Häusern und Bäumen. Findest du alle drei?“',
    ],
    farbe: 'gelb',
    dinge: [
      { x: 380, y: 300 },
      { x: 1290, y: 880 },
      { x: 1620, y: 250 },
    ],
    geschafft: '„Alle drei Glöckchen! Hör nur, wie schön sie klingen. Das hier ist für dich.“',
    belohnung: { fangkristalle: 2 },
  },
};
