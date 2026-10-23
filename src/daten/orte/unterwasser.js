// Unter Wasser im Mondsee. Diese Datei gehört dir!
// Was die Angaben bedeuten, steht oben in kristallwald.js.
//
// Hierher kommt man nur mit dem Lungenkraut (es wächst im Schilf am Mondsee),
// über den Tauchplatz am Ufer (tueren in mondsee.js). Unter Wasser sieht man
// den See von der Seite: Oben ist die Wasseroberfläche, unten der Sandboden.
// Man schwimmt hoch und runter. Ganz oben in der Mitte geht es wieder ans Ufer.
//
// Im Seegras (hohesGras) verstecken sich Wasser-Kalamprios.
//
// muellQuest: eine Aufgabe von der alten Muschel. Überall liegt Müll (art ist
//   das Bild: 'plastikflasche', 'plastiktuete', 'dose' oder 'joghurtbecher').
//   Wer alles einsammelt und zur Muschel zurückbringt, bekommt die belohnung,
//   und das Wasser wird wieder klar.
//   Was die Muschel sagt: auftrag (am Anfang), weiter (zwischendurch, {anzahl}
//   und {alle} werden ersetzt), geschafft (wenn alles eingesammelt ist) und
//   danke (danach). Diese Sätze werden vorgelesen (npm run stimmen).

export const UNTERWASSER = {
  name: 'Im Mondsee',
  stil: 'wasser',
  breite: 2600,
  hoehe: 1500,
  // Oben ist die Wasseroberfläche, unten der Sandboden.
  grenzen: { links: 90, oben: 150, rechts: 2510, unten: 1360 },

  ausgaenge: [{ nach: 'mondsee', seite: 'oben', mitte: 1300 }],

  wildeKalamprios: [
    { art: 'bolo', x: 600, y: 760 },
    { art: 'elefantia', x: 1800, y: 1150 },
    { art: 'robossor', x: 2200, y: 600 },
    { art: 'bolo', x: 1050, y: 1100 },
  ],
  wildesLevel: 3,

  // Das Seegras am Boden
  tiereImGras: ['bolo', 'elefantia', 'robossor'],
  hohesGras: [
    { links: 280, oben: 1080, breite: 480, hoehe: 280 },
    { links: 1480, oben: 1100, breite: 440, hoehe: 260 },
    { links: 2140, oben: 1050, breite: 360, hoehe: 310 },
  ],

  // Kristalle wachsen auf dem Boden.
  kristalle: [
    { x: 180, y: 1390 },
    { x: 940, y: 1395 },
    { x: 1700, y: 1385 },
    { x: 2050, y: 1395 },
    { x: 2470, y: 1390 },
  ],

  muellQuest: {
    muschel: { x: 1300, y: 1350 },
    muell: [
      { art: 'plastikflasche', x: 430, y: 1320 },
      { art: 'plastiktuete', x: 760, y: 520 },
      { art: 'dose', x: 1080, y: 1310 },
      { art: 'joghurtbecher', x: 1560, y: 880 },
      { art: 'plastikflasche', x: 1900, y: 380 },
      { art: 'plastiktuete', x: 2380, y: 1240 },
      { art: 'dose', x: 2440, y: 760 },
      { art: 'joghurtbecher', x: 260, y: 640 },
    ],
    auftrag: [
      'Eine alte Muschel liegt im Sand. Sie seufzt ganz tief.',
      '„Hallo, kleiner Taucher! Schau dich um: Überall liegt Müll in meinem See. Plastikflaschen, Tüten, Dosen und Becher!“',
      '„Die Wasser-Kalamprios werden davon ganz traurig. Sammelst du alle acht Teile ein? Dann wird das Wasser wieder klar.“',
    ],
    weiter: '„Du hast schon {anzahl} von {alle} eingesammelt. Weiter so!“',
    geschafft: '„Du hast den ganzen Müll eingesammelt! Schau nur, wie klar das Wasser wird. Die Kalamprios danken dir. Hier, das ist für dich!“',
    danke: '„Mein See ist so schön sauber! Danke, dass du ihn gerettet hast.“',
    belohnung: { fangkristalle: 3 },
  },
};
