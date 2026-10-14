// Der Mondsee: ein großer See im Mondlicht, der letzte Ort.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
// Am See ist das hohe Gras Schilf.

export const MONDSEE = {
  name: 'Mondsee',
  stil: 'see',
  breite: 2400,
  hoehe: 1600,

  ausgaenge: [{ nach: 'prismastahlMine', seite: 'links', mitte: 500 }],

  wildeKalamprios: [
    { art: 'bolo', x: 640, y: 760 },
    { art: 'mola', x: 1400, y: 340 },
    { art: 'bolo', x: 2080, y: 1000 },
    { art: 'mola', x: 1250, y: 1400 },
  ],

  tiereImGras: ['bolo', 'mola'],
  hohesGras: [
    { links: 520, oben: 1150, breite: 440, hoehe: 300 },
    { links: 1880, oben: 240, breite: 400, hoehe: 280 },
    { links: 1560, oben: 1250, breite: 480, hoehe: 280 },
  ],

  // Das geheime Kalamprio versteckt sich ganz selten im Schilf.
  // chance: 0.04 bedeutet: 4 von 100 Begegnungen im Schilf.
  geheimesImGras: { art: 'geheimnis', chance: 0.04 },

  seen: [{ x: 1350, y: 850, breite: 1100, hoehe: 640 }],

  baeume: [
    { x: 330, y: 300 },
    { x: 1000, y: 290 },
    { x: 1700, y: 280 },
    { x: 300, y: 1050 },
    { x: 2200, y: 760 },
    { x: 2180, y: 1380 },
  ],

  kristalle: [
    { x: 650, y: 420 },
    { x: 2240, y: 560 },
    { x: 1100, y: 1380 },
    { x: 380, y: 1450 },
  ],
};
