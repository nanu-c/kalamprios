// Das Lila Dorf: Hier beginnt das Abenteuer. Diese Datei gehört dir!
// Was die Angaben bedeuten, steht oben in kristallwald.js.
// Im Dorf gibt es keine wilden Kalamprios.

export const LILA_DORF = {
  name: 'Lila Dorf',
  stil: 'dorf',
  breite: 2340,
  hoehe: 1560,

  // Den Weg in den Kristallwald gibt die Rivalin erst frei, wenn sie einem
  // ein Kalamprio geschenkt hat (erstNachGeschenk).
  ausgaenge: [{ nach: 'kristallwald', seite: 'rechts', mitte: 830, erstNachGeschenk: true }],

  // Am Anfang steht die Rivalin hier am Weg zum Kristallwald. Sie hat
  // Hunger: Wer ihr bringt, was bei wuenscht steht (ein Rezept aus haus.js),
  // dem schenkt sie zum Dank ein Kalamprio. Danach wartet sie im Kristallwald.
  rivalinAmAnfang: { x: 2130, y: 905, wuenscht: 'sternenpfannkuchen' },

  start: { x: 680, y: 910 },

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 390, y: 940 },

  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],

  // Im Haus mit dem blauen Dach kann man kochen (haus.js).
  // Im gemalten Haus ist das Kinderzimmer, wo man am Anfang aufwacht.
  tueren: [
    { x: 1790, y: 600, nach: 'kueche', art: 'haustuer' },
    { x: 490, y: 598, nach: 'kinderzimmer', art: 'haustuer' },
  ],

  haeuser: [
    { x: 490, y: 560 },
    { x: 1140, y: 520 },
    { x: 1790, y: 570 },
    { x: 910, y: 1300 },
    { x: 1640, y: 1310 },
  ],

  baeume: [
    { x: 2110, y: 420 },
    { x: 210, y: 1250 },
    { x: 1300, y: 1460 },
    { x: 2130, y: 1300 },
    { x: 2050, y: 650 },
    { x: 1800, y: 1420 },
    { x: 480, y: 1450 },
  ],

  // Leuchtkristalle wie Laternen am Weg, und der große Kristall auf dem Platz
  kristalle: [
    { x: 830, y: 730 },
    { x: 1500, y: 730 },
    { x: 1170, y: 900 },
    { x: 830, y: 1050 },
    { x: 1500, y: 1050 },
  ],

  zutaten: [
    { art: 'honig', x: 300, y: 1250 },
    { art: 'honig', x: 2050, y: 1150 },
  ],

  fangkristalle: [{ x: 1950, y: 940 }],

  // Das Rätsel: Drei Glöckchen liegen versteckt hinter Häusern und Bäumen.
  raetsel: {
    art: 'suchen',
    x: 1010,
    y: 910,
    aufgabe: [
      'Ein alter Rätselstein mit einem goldenen Fragezeichen. Er brummt freundlich.',
      '„Der Schatten hat drei goldene Glöckchen aus dem Dorf mitgenommen und auf der Flucht verloren.“',
      '„Sie liegen gut versteckt, hinter Häusern und Bäumen. Findest du alle drei?“',
    ],
    farbe: 'gelb',
    dinge: [
      { x: 490, y: 390 },
      { x: 1680, y: 1140 },
      { x: 2110, y: 320 },
    ],
    geschafft: '„Alle drei Glöckchen! Hör nur, wie schön sie klingen. Das hier ist für dich.“',
    belohnung: { fangkristalle: 2 },
  },
};
