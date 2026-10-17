// Der Mondsee: ein großer See im Mondlicht, der letzte Ort.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
// Am See ist das hohe Gras Schilf.
// Der See ist gemalt (Landschaft/Mondsee.jpg): mit Steinen am Ufer, Seerosen,
// Blüten und dem Mond, der sich in der Mitte spiegelt.

export const MONDSEE = {
  name: 'Mondsee',
  stil: 'see',
  breite: 2400,
  hoehe: 1600,

  ausgaenge: [{ nach: 'prismastahlMine', seite: 'links', mitte: 500 }],

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 480, y: 640 },

  wildeKalamprios: [
    { art: 'bolo', x: 520, y: 880 },
    { art: 'mola', x: 1400, y: 300 },
    { art: 'bolo', x: 2080, y: 1000 },
    { art: 'mola', x: 1250, y: 1480 },
    { art: 'taktik', x: 2250, y: 1050 },
  ],

  // Am Mondsee sind die wilden Kalamprios stärker.
  wildesLevel: 3,

  tiereImGras: ['bolo', 'mola', 'taktik'],
  hohesGras: [
    { links: 180, oben: 1120, breite: 440, hoehe: 300 },
    { links: 1880, oben: 240, breite: 400, hoehe: 280 },
    { links: 1720, oben: 1260, breite: 480, hoehe: 280 },
  ],

  // Das geheime Kalamprio versteckt sich im Schilf.
  // chance: 0.04 bedeutet: 4 von 100 Begegnungen im Schilf.
  // spaetestensNach: 3 bedeutet: Nach höchstens 3 anderen Kalamprios im
  // Schilf kommt es ganz sicher. Danach wird wieder von vorn gezählt.
  geheimesImGras: { art: 'geheimnis', chance: 0.04, spaetestensNach: 3 },

  // Das gemalte Bild ist 1300 mal 1086 Pixel groß. Damit es nicht verzerrt
  // wird, sollte breite geteilt durch hoehe ungefähr 1.2 sein.
  seen: [{ x: 1250, y: 880, breite: 1150, hoehe: 960, bild: 'mondsee' }],

  baeume: [
    { x: 330, y: 300 },
    { x: 1000, y: 290 },
    { x: 1700, y: 280 },
    { x: 260, y: 1050 },
    { x: 2200, y: 760 },
    { x: 2180, y: 1380 },
  ],

  kristalle: [
    { x: 620, y: 420 },
    { x: 2240, y: 560 },
    { x: 1000, y: 1460 },
    { x: 700, y: 1480 },
  ],

  fangkristalle: [
    { x: 2050, y: 620 },
    { x: 1600, y: 1460 },
  ],

  // Das Rätsel: Zwei Rätselfragen. Die Antworten sollten kurz sein, sonst
  // passen sie nicht auf die Knöpfe. Die Antworten stehen auch in der Frage,
  // damit sie mit vorgelesen werden.
  raetsel: {
    art: 'frage',
    x: 320,
    y: 580,
    aufgabe: [
      'Ein alter Rätselstein mit einem goldenen Fragezeichen. Er glitzert im Mondlicht.',
      '„Ich habe zwei Rätsel für dich. Wenn du beide löst, bekommst du etwas Schönes.“',
    ],
    fragen: [
      {
        frage: '„Ich bin rund und leuchte in der Nacht. Im See siehst du mich gleich zweimal. Bin ich ein Stern, der Mond oder eine Laterne?“',
        antworten: ['Ein Stern', 'Der Mond', 'Eine Laterne'],
        richtig: 'Der Mond',
      },
      {
        frage: '„Was wird immer nasser, je mehr es trocknet: ein Fisch, der Regen oder ein Handtuch?“',
        antworten: ['Ein Fisch', 'Der Regen', 'Ein Handtuch'],
        richtig: 'Ein Handtuch',
      },
    ],
    geschafft: '„Richtig! Du bist wirklich klug. Hier, nimm diese Fangkristalle mit.“',
    belohnung: { fangkristalle: 3 },
  },
};
