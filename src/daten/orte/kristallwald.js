// Der Kristallwald. Diese Datei gehört dir!
//
// So ist jeder Ort aufgebaut (auch das Dorf, die Mine und der See):
//
// Alle Plätze sind Punkte mit x und y, gemessen in Pixeln:
// x zählt von links nach rechts, y zählt von oben nach unten.
// Der Ort ist breite mal hoehe groß, also größer als der Bildschirm.
//
// name:            so heißt der Ort im Spiel
// stil:            wie der Ort aussieht: 'dorf', 'wald', 'mine' oder 'see'
// ausgaenge:       Wege zu anderen Orten. nach ist der Kurzname aus orte.js,
//                  seite ist 'links', 'rechts', 'oben' oder 'unten', und
//                  mitte sagt, wo an dieser Seite der Weg hinausführt.
//                  Wichtig: Der andere Ort braucht einen Weg zurück.
// start:           (nur im Startort) hier beginnt die Figur
// rivalin:         (nur im Wald) hier wartet die Figur, die man nicht gewählt hat
// dunklerKristall: hier steht der dunkle Kristall, der die Geschichte flüstert
// wildeKalamprios: diese Tiere laufen sichtbar herum. art ist ein Kurzname
//                  aus kalamprios.js.
// wildesLevel:     (optional) welches Level die wilden Kalamprios hier haben,
//                  1, 2 oder 3. Ohne Angabe ist es 1.
// hohesGras:       Rechtecke mit hohem Gras (in der Mine ist es Geröll, am See
//                  Schilf). Darin verstecken sich die Tiere aus tiereImGras.
// baeume, kristalle, felsen, prismastahl, haeuser: stehen im Weg.
//                  Man kann um sie herumlaufen.
// seen:            Wasser, durch das man nicht laufen kann: x und y sind die
//                  Mitte, breite und hoehe die Größe. Mit bild: 'mondsee'
//                  wird das gemalte Bild des Sees genommen.
// gold:            (nur in der Mine) glitzerndes Gold, steht im Weg
// fangkristalle:   hier liegen Fangkristalle zum Aufsammeln. Nach einer Weile
//                  liegt wieder einer da (siehe regeln.js).
// dunkel:          (optional) wie dunkel es ist, von 0 (hell) bis 1 (ganz
//                  schwarz). Nur rund um die Figur ist es hell.
// raetsel:         (optional) ein Rätsel. Bei x und y steht der Rätselstein
//                  mit dem goldenen Fragezeichen, er erklärt die Aufgabe.
//                  art sagt, was für ein Rätsel es ist:
//                  'suchen':      Bei dinge stehen die Plätze, an denen
//                                 etwas versteckt liegt. farbe ist die Farbe
//                                 der Dinge.
//                  'reihenfolge': Bei steine stehen bunte Klangsteine. Sie
//                                 leuchten nacheinander auf, dann muss man in
//                                 derselben Reihenfolge darüberlaufen. Die
//                                 richtige Reihenfolge ist die in der Liste.
//                  'frage':       Bei fragen stehen Rätselfragen mit bis zu
//                                 vier antworten. richtig ist die richtige
//                                 Antwort, genau so geschrieben.
//                  Farben gibt es: 'rot', 'gelb', 'blau', 'gruen', 'lila', 'weiss'.
//                  aufgabe:   was der Stein am Anfang sagt (Sätze wie in geschichte.js)
//                  geschafft: was er sagt, wenn das Rätsel gelöst ist
//                  belohnung: so viele fangkristalle gibt es. Mit
//                             mehrLicht: true wird es im Dunkeln heller.
//
// Führt ein Ausgang in die Mine oder aus ihr hinaus, ist dort ein Höhleneingang.

export const KRISTALLWALD = {
  name: 'Kristallwald',
  stil: 'wald',
  breite: 2400,
  hoehe: 1600,

  ausgaenge: [
    { nach: 'lilaDorf', seite: 'links', mitte: 820 },
    { nach: 'prismastahlMine', seite: 'rechts', mitte: 1440 },
  ],

  rivalin: { x: 2040, y: 430 },

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 400, y: 700 },

  wildeKalamprios: [
    { art: 'bisakatze', x: 960, y: 540 },
    { art: 'kalampria', x: 1500, y: 900 },
    { art: 'bisakatze', x: 420, y: 1340 },
    { art: 'qalutu', x: 1320, y: 1480 },
    { art: 'kabon', x: 1950, y: 1460 },
  ],

  tiereImGras: ['kalampria', 'bisakatze', 'qalutu', 'kabon'],
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

  fangkristalle: [
    { x: 1560, y: 400 },
    { x: 330, y: 900 },
  ],

  // Das Rätsel: Vier Klangsteine liegen um den Rätselstein herum.
  raetsel: {
    art: 'reihenfolge',
    x: 580,
    y: 360,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Um ihn herum liegen vier bunte Klangsteine.',
      '„Gleich leuchten die Klangsteine nacheinander auf. Schau ganz genau hin!“',
      '„Dann lauf in genau dieser Reihenfolge über die Steine.“',
    ],
    // In dieser Reihenfolge muss man darüberlaufen.
    steine: [
      { x: 720, y: 360, farbe: 'gelb' },
      { x: 580, y: 270, farbe: 'blau' },
      { x: 440, y: 360, farbe: 'rot' },
      { x: 580, y: 450, farbe: 'gruen' },
    ],
    geschafft: '„Wunderbar! Die Klangsteine singen wieder. Hier, nimm diese Fangkristalle mit.“',
    belohnung: { fangkristalle: 2 },
  },
};
