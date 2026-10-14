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
};
