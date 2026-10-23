// Die Prismastahl-Mine: eine dunkle Höhle voller glänzendem Prismastahl und Gold.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
// In der Mine ist das hohe Gras Geröll.

export const PRISMASTAHL_MINE = {
  name: 'Prismastahl-Mine',
  stil: 'mine',
  breite: 2860,
  hoehe: 1950,

  ausgaenge: [
    { nach: 'kristallwald', seite: 'links', mitte: 980 },
    // Der Weg zum Mondsee ist verschüttet. Erst wenn das Rätsel gelöst ist,
    // wird er frei.
    { nach: 'mondsee', seite: 'rechts', mitte: 550, erstNachRaetsel: true },
  ],

  // Besondere Dinge, die man nur einmal findet. Das Ölkännchen braucht man
  // für das quietschende Wasserrad am Mondsee (flaschenpost in mondsee.js).
  besonderes: [
    {
      art: 'oelkanne',
      name: 'Ölkännchen',
      x: 960,
      y: 1080,
      info: 'Damit kann man quietschende Dinge ölen.',
      satz: 'Ein altes Ölkännchen der Bergleute! Damit kann man quietschende Dinge ölen. Wofür du es wohl brauchst?',
    },
  ],

  // Ganz rechts in der Wand: der Eingang zum verschollenen Stollen
  // (verschollenerStollen.js). Man kommt erst hinein, wenn das Rätsel hier
  // gelöst ist.
  tueren: [
    {
      x: 2680,
      y: 1060,
      nach: 'verschollenerStollen',
      art: 'stollen',
      erstNachRaetsel: true,
      ohne: 'Zwischen den Felsen pfeift ein kalter Wind. Dahinter muss ein alter Gang sein. Aber es ist viel zu dunkel, um ihn zu finden …',
      satz: 'Ein alter Stollen! Er sieht aus, als wäre hier seit vielen, vielen Jahren niemand mehr gewesen. Gehst du hinein?',
    },
  ],

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 560, y: 1120 },

  wildeKalamprios: [
    { art: 'kapapa', x: 1170, y: 1040 },
    { art: 'kapapa', x: 2080, y: 570 },
    { art: 'qalutu', x: 1560, y: 1300 },
    { art: 'simfita', x: 2400, y: 730 },
    { art: 'kristalta', x: 2700, y: 600 },
    { art: 'totantia', x: 1100, y: 1500 },
    { art: 'zeittakel', x: 1050, y: 400 },
  ],

  // Die Kalamprios in der Mine sind schon etwas stärker.
  wildesLevel: 2,

  tiereImGras: ['kapapa', 'kapapa', 'qalutu', 'simfita', 'kristalta', 'totantia', 'zeittakel'],
  hohesGras: [
    { links: 430, oben: 1200, breite: 600, hoehe: 390 },
    { links: 1690, oben: 730, breite: 650, hoehe: 380 },
    { links: 1950, oben: 1440, breite: 550, hoehe: 380 },
  ],

  felsen: [
    { x: 680, y: 550 },
    { x: 1250, y: 430 },
    { x: 1430, y: 1530 },
    { x: 1530, y: 880 },
    { x: 2520, y: 1200 },
    { x: 390, y: 1740 },
    { x: 800, y: 1720 },
    { x: 2000, y: 1320 },
  ],

  prismastahl: [
    { x: 910, y: 810 },
    { x: 1300, y: 1240 },
    { x: 1850, y: 430 },
    { x: 2600, y: 880 },
    { x: 1070, y: 1770 },
    { x: 1690, y: 1790 },
  ],

  kristalle: [
    { x: 490, y: 810 },
    { x: 2140, y: 1270 },
    { x: 2540, y: 1760 },
  ],

  gold: [
    { x: 810, y: 1430 },
    { x: 1920, y: 1120 },
    { x: 2370, y: 430 },
    { x: 340, y: 610 },
    { x: 2210, y: 1860 },
  ],

  zutaten: [
    { art: 'zucker', x: 1200, y: 800 },
    { art: 'zucker', x: 2300, y: 1050 },
  ],

  saatgut: [
    { art: 'kristallkeim', x: 1290, y: 820 },
  ],

  fangkristalle: [
    { x: 1360, y: 730 },
    { x: 2470, y: 1500 },
  ],

  // In der Höhle ist es richtig dunkel, nur ganz nah um die Figur ist es hell.
  dunkel: 0.97,
  licht: 0.7,

  // Das Rätsel: Drei Glühsteine liegen im Dunkeln. Wer alle findet, hat mehr Licht.
  raetsel: {
    art: 'suchen',
    x: 730,
    y: 990,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Er leuchtet ein kleines bisschen.',
      '„In der Mine sind drei Glühsteine verloren gegangen. Mit ihnen wird es heller.“',
      '„Im Dunkeln siehst du sie erst, wenn du ganz nah bist. Such gut!“',
      '„Ohne ihr Licht findest du den Weg zum Mondsee nie.“',
    ],
    farbe: 'blau',
    dinge: [
      { x: 320, y: 1500 },
      { x: 1500, y: 580 },
      { x: 2590, y: 340 },
    ],
    geschafft: '„Du hast alle Glühsteine gefunden! Jetzt leuchtet dein Licht viel weiter. Und hörst du das Rumpeln? Der Weg zum Mondsee ist frei! Und ganz rechts in der Wand ist im Licht ein alter Stollen aufgetaucht …“',
    belohnung: { fangkristalle: 1, mehrLicht: true },
  },
};
