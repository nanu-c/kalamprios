// Der Garten der Mondrosen: hinter dem Mondblütental. Diese Datei gehört dir!
// Was die Angaben bedeuten, steht oben in kristallwald.js und mondbluetental.js.
//
// raetsel: art 'tor' (Rosentor): Um den Mondtau (blume) wächst ein Ring aus
//          dornigen Mondrosen (ring ist sein Radius). Die Rosen beim Tor
//          gehen nur auf, solange jemand auf dem Mondstein (platte) steht.
//          Der Mondstein ist weit weg: Eine hält das Tor offen, die andere
//          holt den Mondtau. tor sagt, auf welcher Seite das Tor ist:
//          'links', 'rechts', 'oben' oder 'unten'.
//
// Die Wolkentreppe führt hinauf zur Sternenwolke. Sie wächst erst, wenn das
// Rätsel hier gelöst ist (erstNachRaetsel bei der Tür).

export const MONDROSENGARTEN = {
  name: 'Garten der Mondrosen',
  stil: 'garten',
  breite: 2600,
  hoehe: 1700,
  nurZuZweit: true,
  zurueckNach: 'lilaDorf',

  ausgaenge: [{ nach: 'mondbluetental', seite: 'links', mitte: 900 }],
  tueren: [
    {
      x: 2250,
      y: 380,
      nach: 'sternenwolke',
      art: 'wolkentreppe',
      erstNachRaetsel: true,
      ohne: 'Hier glitzert es ein bisschen in der Luft, als ob hier etwas wachsen möchte. Aber dafür braucht es den Mondtau.',
      ankunft: { x: 2250, y: 490 },
      satz: 'Aus dem Mondtau ist eine Treppe aus Wolken gewachsen. Sie führt hoch hinauf, bis zu den Sternen. Steigen wir hinauf?',
    },
  ],

  ankommen: [
    'Im Garten der Mondrosen ist es still. Die Rosen schimmern silbern im Mondlicht.',
    'In der Mitte wächst ein Ring aus dornigen Rosen. Darin glitzert ein Tropfen Mondtau, hell wie ein kleiner Mond.',
    'Der Schatten hat ihn dort eingesperrt. Mit dem Mondtau könnte man bis zu den Sternen hinaufwachsen …',
  ],

  wildesLevel: 2,
  wildeKalamprios: [
    { art: 'robossor', x: 1300, y: 420 },
    { art: 'blitznara', x: 2300, y: 1400 },
    { art: 'zetarata', x: 1050, y: 1150 },
    { art: 'bisakatze', x: 420, y: 650 },
  ],

  tiereImGras: ['robossor', 'blitznara', 'zetarata', 'bisakatze', 'mola'],
  hohesGras: [{ links: 1150, oben: 1350, breite: 520, hoehe: 240 }],

  baeume: [
    { x: 300, y: 360 },
    { x: 1600, y: 320 },
    { x: 2450, y: 950 },
    { x: 980, y: 1560 },
    { x: 2420, y: 1580 },
  ],

  nachtblumen: { anzahl: 170, arten: ['mondrose', 'mondrose', 'leuchtglocke', 'mondwinde', 'sternbluete'] },

  fangkristalle: [
    { x: 400, y: 1300 },
    { x: 2050, y: 650 },
  ],

  raetsel: {
    art: 'tor',
    x: 700,
    y: 520,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Eine Rose rankt sich um ihn herum.',
      '„Die Mondrosen lassen niemanden zum Mondtau. Nur solange jemand auf dem Mondstein steht, öffnen sie ihr Tor.“',
      '„Der Mondstein liegt weit weg vom Tor. Eine von euch hält das Tor offen, die andere holt den Mondtau!“',
    ],
    platte: { x: 600, y: 1350 },
    blume: { x: 1750, y: 1000 },
    ring: 230,
    tor: 'links',
    geschafft: '„Ihr habt den Mondtau! Seht nur, wie er funkelt. Oben am Rand des Gartens wächst eine Treppe aus Wolken in den Himmel!“',
    belohnung: { fangkristalle: 4 },
  },
};
