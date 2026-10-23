// Das Mondblütental: die erste Welt hinter dem Freundschaftstor im Lila Dorf.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
//
// Hierher kommt man nur zu zweit (daten/zusammen.js). Reißt die Verbindung
// ab, trägt einen ein warmer Wind zurück ins Lila Dorf.
//
// nurZuZweit:  true heißt: Allein kann man hier nicht sein.
// zurueckNach: wohin man kommt, wenn die andere nicht mehr da ist
// ankommen:    was beim ersten Mal erzählt wird
// nachtblumen: so viele leuchtende Nachtblumen wachsen hier (anzahl). Mit
//              arten kann man sagen, welche (siehe szenen/nachtblumen.js):
//              'mondwinde', 'nachtkerze', 'sternbluete', 'leuchtglocke', 'mondrose'
// raetsel:     art 'fluestern' (Blumenflüstern): Bei blumen stehen große
//              Nachtblumen auf Steinplatten. In jeder Runde sieht nur eine
//              von euch, in welcher Reihenfolge sie leuchten, und die andere
//              muss in dieser Reihenfolge über sie laufen. Dazu müsst ihr
//              miteinander reden! Jede Runde wird getauscht. Bei runden
//              steht, wie viele Blumen in jeder Runde leuchten.

export const MONDBLUETENTAL = {
  name: 'Mondblütental',
  stil: 'garten',
  breite: 2800,
  hoehe: 1800,
  nurZuZweit: true,
  zurueckNach: 'lilaDorf',

  ausgaenge: [{ nach: 'mondrosengarten', seite: 'rechts', mitte: 900 }],
  tueren: [{ x: 320, y: 900, nach: 'lilaDorf', art: 'freundschaftstor', ankunft: { x: 490, y: 960 } }],

  ankommen: [
    'Hinter dem Freundschaftstor liegt ein stilles Tal. Überall wachsen Nachtblumen, so viele, dass man sie gar nicht zählen kann.',
    'Ein paar von ihnen leuchten blau, rosa und golden. Aber viele sind dunkel und lassen die Köpfe hängen.',
    'Eine alte Mondblüte flüstert: „Der Schatten ist durch unser Tal gehuscht und hat unser Leuchten mitgenommen.“',
    '„Vor langer Zeit haben zwei Freundinnen dieses Tal gepflanzt. Seitdem leuchten wir nur für die, die zusammenhalten.“',
    '„Bitte helft uns! Am Rätselstein erfahrt ihr, wie.“',
  ],

  wildesLevel: 2,
  wildeKalamprios: [
    { art: 'pflinia', x: 1000, y: 420 },
    { art: 'schnektata', x: 2200, y: 480 },
    { art: 'kalampria', x: 2350, y: 1450 },
    { art: 'eulator', x: 700, y: 1450 },
    { art: 'simfita', x: 1250, y: 1480 },
  ],

  tiereImGras: ['pflinia', 'schnektata', 'kalampria', 'eulator', 'simfita'],
  hohesGras: [{ links: 1950, oben: 1150, breite: 480, hoehe: 260 }],

  baeume: [
    { x: 600, y: 360 },
    { x: 2500, y: 420 },
    { x: 1560, y: 330 },
    { x: 400, y: 1560 },
    { x: 2560, y: 1580 },
  ],

  nachtblumen: { anzahl: 200 },

  saatgut: [
    { art: 'mondwindensamen', x: 2200, y: 980 },
  ],

  fangkristalle: [
    { x: 2100, y: 900 },
    { x: 650, y: 1150 },
  ],

  raetsel: {
    art: 'fluestern',
    x: 900,
    y: 880,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Um ihn herum duftet es süß.',
      '„Dort drüben stehen fünf große Mondblüten. Sie flüstern, in welcher Reihenfolge man sie wecken muss, aber immer nur einer von euch!“',
      '„Wer es sieht, sagt der anderen Bescheid. Die andere läuft in dieser Reihenfolge über die Blüten. Nach jeder Runde wird getauscht.“',
    ],
    blumen: [
      { x: 1600, y: 620, art: 'nachtkerze' },
      { x: 1850, y: 800, art: 'sternbluete' },
      { x: 1750, y: 1100, art: 'leuchtglocke' },
      { x: 1450, y: 1100, art: 'mondwinde' },
      { x: 1350, y: 800, art: 'mondrose' },
    ],
    runden: [3, 4, 4, 5],
    geschafft: '„Hört ihr das? Die Mondblüten singen! Ihr Leuchten ist zurück. Hinter dem Tal, im Garten der Mondrosen, wartet noch etwas auf euch.“',
    belohnung: { fangkristalle: 4 },
  },
};
