// Die Prismastahl-Mine: eine dunkle Höhle voller glänzendem Prismastahl und Gold.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
// In der Mine ist das hohe Gras Geröll.

export const PRISMASTAHL_MINE = {
  name: 'Prismastahl-Mine',
  stil: 'mine',
  breite: 2200,
  hoehe: 1500,

  ausgaenge: [
    { nach: 'kristallwald', seite: 'links', mitte: 750 },
    { nach: 'mondsee', seite: 'rechts', mitte: 420 },
  ],

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 430, y: 860 },

  wildeKalamprios: [
    { art: 'kapapa', x: 900, y: 800 },
    { art: 'kapapa', x: 1600, y: 440 },
    { art: 'qalutu', x: 1200, y: 1000 },
    { art: 'simfita', x: 1850, y: 560 },
  ],

  tiereImGras: ['kapapa', 'kapapa', 'qalutu', 'simfita'],
  hohesGras: [
    { links: 330, oben: 920, breite: 460, hoehe: 300 },
    { links: 1300, oben: 560, breite: 500, hoehe: 290 },
    { links: 1500, oben: 1110, breite: 420, hoehe: 290 },
  ],

  felsen: [
    { x: 520, y: 420 },
    { x: 960, y: 330 },
    { x: 1100, y: 1180 },
    { x: 1180, y: 680 },
    { x: 1940, y: 920 },
    { x: 300, y: 1340 },
  ],

  prismastahl: [
    { x: 700, y: 620 },
    { x: 1000, y: 950 },
    { x: 1420, y: 330 },
    { x: 2000, y: 680 },
    { x: 820, y: 1360 },
    { x: 1300, y: 1380 },
  ],

  kristalle: [
    { x: 380, y: 620 },
    { x: 1650, y: 980 },
    { x: 1950, y: 1350 },
  ],

  gold: [
    { x: 620, y: 1100 },
    { x: 1480, y: 860 },
    { x: 1820, y: 330 },
    { x: 260, y: 470 },
    { x: 1700, y: 1430 },
  ],

  fangkristalle: [
    { x: 1050, y: 560 },
    { x: 1900, y: 1150 },
  ],

  // In der Höhle ist es dunkel, nur rund um die Figur ist es hell.
  dunkel: 0.82,

  // Das Rätsel: Drei Glühsteine liegen im Dunkeln. Wer alle findet, hat mehr Licht.
  raetsel: {
    art: 'suchen',
    x: 560,
    y: 760,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Er leuchtet ein kleines bisschen.',
      '„In der Mine sind drei Glühsteine verloren gegangen. Mit ihnen wird es heller.“',
      '„Im Dunkeln siehst du sie erst, wenn du ganz nah bist. Such gut!“',
    ],
    farbe: 'blau',
    dinge: [
      { x: 250, y: 1150 },
      { x: 1150, y: 450 },
      { x: 1990, y: 260 },
    ],
    geschafft: '„Du hast alle Glühsteine gefunden! Jetzt leuchtet dein Licht viel weiter.“',
    belohnung: { fangkristalle: 1, mehrLicht: true },
  },
};
