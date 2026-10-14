// Der Kristallwald: die Welt, durch die man spaziert. Diese Datei gehört dir!
//
// Alle Orte sind Punkte mit x und y, gemessen in Pixeln:
// x zählt von links nach rechts, y zählt von oben nach unten.
// Die Welt ist 2400 breit und 1600 hoch, also größer als der Bildschirm.
//
// start:           hier beginnt die Figur
// rivalin:         hier wartet die Figur, die man nicht gewählt hat
// wildeKalamprios: diese Tiere laufen sichtbar herum. art ist ein Kurzname
//                  aus kalamprios.js.
// hohesGras:       Rechtecke mit hohem Gras. Darin verstecken sich die
//                  Tiere aus der Liste tiereImGras.
// baeume, kristalle: stehen im Weg. Man kann um sie herumlaufen.

export const KRISTALLWALD = {
  name: 'Kristallwald',
  breite: 2400,
  hoehe: 1600,

  start: { x: 320, y: 820 },
  rivalin: { x: 2040, y: 430 },

  wildeKalamprios: [
    { art: 'bisakatze', x: 960, y: 540 },
    { art: 'kalampria', x: 1500, y: 900 },
    { art: 'bisakatze', x: 420, y: 1340 },
  ],

  tiereImGras: ['kalampria', 'bisakatze'],
  hohesGras: [
    { links: 560, oben: 960, breite: 520, hoehe: 340 },
    { links: 1280, oben: 220, breite: 460, hoehe: 300 },
    { links: 1720, oben: 1020, breite: 480, hoehe: 360 },
  ],

  baeume: [
    { x: 1870, y: 270 },
    { x: 690, y: 280 },
    { x: 320, y: 290 },
    { x: 1040, y: 340 },
    { x: 210, y: 550 },
    { x: 1850, y: 560 },
    { x: 1400, y: 590 },
    { x: 620, y: 620 },
    { x: 1690, y: 690 },
    { x: 1140, y: 730 },
    { x: 2060, y: 740 },
    { x: 890, y: 750 },
    { x: 1280, y: 870 },
    { x: 1020, y: 910 },
    { x: 1710, y: 940 },
    { x: 210, y: 1100 },
    { x: 1480, y: 1110 },
    { x: 1230, y: 1190 },
    { x: 1640, y: 1290 },
    { x: 1460, y: 1340 },
  ],

  kristalle: [
    { x: 2200, y: 260 },
    { x: 1220, y: 280 },
    { x: 450, y: 480 },
    { x: 770, y: 480 },
    { x: 1200, y: 480 },
    { x: 700, y: 870 },
    { x: 1970, y: 910 },
    { x: 2160, y: 960 },
    { x: 470, y: 1110 },
    { x: 220, y: 1380 },
    { x: 1150, y: 1400 },
    { x: 890, y: 1420 },
    { x: 690, y: 1440 },
  ],
};
