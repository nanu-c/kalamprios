// Die Sternenwolke: die zweite Welt hinter dem Freundschaftstor, hoch oben am
// Himmel. Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in
// kristallwald.js und mondbluetental.js.
//
// Hierher kommt man über die Wolkentreppe im Garten der Mondrosen. Die wächst
// erst, wenn dort das Rätsel gelöst ist.
//
// raetsel:     art 'zuZweit': In jeder Runde leuchten zwei Sternplatten auf.
//              Erst wenn auf beiden gleichzeitig jemand steht, ist die Runde
//              geschafft. Bei runden stehen die beiden Platten jeder Runde.

export const STERNENWOLKE = {
  name: 'Sternenwolke',
  stil: 'himmel',
  breite: 2600,
  hoehe: 1700,
  nurZuZweit: true,
  zurueckNach: 'lilaDorf',

  ausgaenge: [],
  tueren: [{ x: 330, y: 900, nach: 'mondrosengarten', art: 'wolkentreppe', ankunft: { x: 500, y: 960 } }],

  ankommen: [
    'Die Wolkentreppe endet hoch über dem Land. Unter euren Füßen sind Wolken, so weich wie Watte.',
    'Das ist die Sternenwolke. Aber der Himmel ist fast leer: Nur ein paar Sterne funkeln noch.',
    'Hier oben hat der Schatten das Sternenlicht versteckt, das er gestohlen hat. Es steckt in alten Sternplatten.',
    'Die Kalamprios hier oben sind stark. Kämpft lieber zusammen gegen sie!',
  ],

  // Die Kalamprios hier haben Level 3, so hoch oben sind sie stärker. Wer zu
  // zweit kämpft, macht sie noch stärker (wildeZuZweit in daten/zusammen.js).
  wildesLevel: 3,
  wildeKalamprios: [
    { art: 'eulator', x: 820, y: 320 },
    { art: 'blitznara', x: 1900, y: 480 },
    { art: 'mola', x: 2200, y: 1460 },
    { art: 'simfita', x: 1000, y: 1180 },
    { art: 'taktik', x: 1750, y: 1100 },
    { art: 'zetarata', x: 2350, y: 700 },
    { art: 'kapapa', x: 520, y: 1460 },
  ],

  // In den dicken Wolken verstecken sich noch mehr.
  tiereImGras: ['kapapa', 'mola', 'simfita', 'taktik', 'zetarata', 'blitznara', 'eulator'],
  hohesGras: [
    { links: 1420, oben: 1240, breite: 520, hoehe: 300 },
    { links: 260, oben: 420, breite: 400, hoehe: 280 },
  ],

  kristalle: [
    { x: 600, y: 720 },
    { x: 1520, y: 840 },
    { x: 2050, y: 820 },
    { x: 1120, y: 600 },
    { x: 1820, y: 1560 },
    { x: 380, y: 1220 },
    { x: 2420, y: 1180 },
  ],

  fangkristalle: [
    { x: 1500, y: 1020 },
    { x: 2280, y: 1300 },
    { x: 720, y: 1020 },
  ],

  nebel: 0.15,

  raetsel: {
    art: 'zuZweit',
    x: 1250,
    y: 820,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Er glitzert wie ein Stern.',
      '„In den Sternplatten steckt das gestohlene Sternenlicht. Immer zwei gehören zusammen.“',
      '„Aber sie leuchten nur, wenn auf beiden gleichzeitig jemand steht. Teilt euch auf! Es gibt drei Runden.“',
    ],
    runden: [
      [{ x: 900, y: 620 }, { x: 1600, y: 620 }],
      [{ x: 660, y: 1340 }, { x: 2060, y: 1280 }],
      [{ x: 1300, y: 340 }, { x: 2250, y: 960 }],
    ],
    geschafft: '„Seht nur! Das Sternenlicht fliegt aus den Platten in den Himmel zurück. Über dem ganzen Land funkeln wieder die Sterne. Das habt ihr zusammen geschafft! Hier, für jede von euch ein paar Fangkristalle.“',
    belohnung: { fangkristalle: 5 },
  },
};
