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
//                  Mit erstNachRaetsel: true ist der Weg verschüttet, bis
//                  das Rätsel dieses Ortes gelöst ist. Man findet ihn vorher nicht.
//                  Mit erstNachRivalin: true bewacht die Rivalin den Weg. Man
//                  kommt erst hindurch, wenn man sie besiegt hat.
// start:           (nur im Startort) hier beginnt die Figur
// rivalin:         (nur im Wald) hier wartet die Figur, die man nicht gewählt hat.
//                  Bewacht sie einen Weg (erstNachRivalin), steht sie mitten
//                  darin, und niemand kommt an ihr vorbei.
// rivalinNachSieg: (optional) hierhin geht sie zur Seite, wenn man sie besiegt hat
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
// licht:           (optional, nur wenn es dunkel ist) wie weit das Licht um
//                  die Figur scheint. 1 ist normal, 0.7 ist weniger weit.
// raetsel:         (optional) ein Rätsel. Bei x und y steht der Rätselstein
//                  mit dem goldenen Fragezeichen, er erklärt die Aufgabe.
//                  art sagt, was für ein Rätsel es ist:
//                  'suchen':      Bei dinge stehen die Plätze, an denen
//                                 etwas versteckt liegt. farbe ist die Farbe
//                                 der Dinge.
//                  'reihenfolge': Bei steine stehen bunte Klangsteine. Sie
//                                 leuchten nacheinander auf, dann muss man in
//                                 derselben Reihenfolge darüberlaufen. Die
//                                 Reihenfolge würfelt das Spiel jedes Mal neu.
//                                 Bei runden steht, wie viele Steine in jeder
//                                 Runde aufleuchten, zum Beispiel [3, 4, 5].
//                                 Wer sich vertut, fängt die Runde von vorn an.
//                  'frage':       Bei fragen stehen Rätselfragen mit bis zu
//                                 vier antworten. richtig ist die richtige
//                                 Antwort, genau so geschrieben. Bei wieViele
//                                 steht, wie viele Fragen man richtig
//                                 beantworten muss. Die Fragen kommen jedes
//                                 Mal durcheinander dran.
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
  breite: 3120,
  hoehe: 2080,

  ausgaenge: [
    { nach: 'lilaDorf', seite: 'links', mitte: 1070 },
    // Den Weg in die Mine bewacht die Rivalin.
    { nach: 'prismastahlMine', seite: 'rechts', mitte: 1870, erstNachRivalin: true },
  ],

  // Die Rivalin steht im Eingang zur Mine. Wer sie besiegt, dem macht sie Platz.
  rivalin: { x: 2940, y: 1870 },
  rivalinNachSieg: { x: 2600, y: 1880 },

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 520, y: 910 },

  wildeKalamprios: [
    { art: 'bisakatze', x: 1250, y: 700 },
    { art: 'kalampria', x: 1950, y: 1170 },
    { art: 'bisakatze', x: 550, y: 1740 },
    { art: 'qalutu', x: 1720, y: 1920 },
    { art: 'kabon', x: 2350, y: 1960 },
    { art: 'tschank', x: 2900, y: 1450 },
    { art: 'pflinia', x: 1320, y: 1820 },
    { art: 'schnektata', x: 2650, y: 600 },
  ],

  tiereImGras: ['kalampria', 'bisakatze', 'qalutu', 'kabon', 'tschank', 'pflinia', 'schnektata'],
  hohesGras: [
    { links: 730, oben: 1250, breite: 680, hoehe: 440 },
    { links: 1660, oben: 290, breite: 600, hoehe: 390 },
    { links: 2240, oben: 1330, breite: 620, hoehe: 470 },
  ],

  baeume: [
    { x: 2430, y: 350 },
    { x: 420, y: 380 },
    { x: 1350, y: 440 },
    { x: 270, y: 720 },
    { x: 2400, y: 730 },
    { x: 1820, y: 770 },
    { x: 2200, y: 900 },
    { x: 1480, y: 950 },
    { x: 2680, y: 960 },
    { x: 1160, y: 980 },
    { x: 1660, y: 1130 },
    { x: 1330, y: 1180 },
    { x: 2220, y: 1220 },
    { x: 270, y: 1430 },
    { x: 1920, y: 1440 },
    { x: 1600, y: 1550 },
    { x: 2130, y: 1680 },
    { x: 1900, y: 1740 },
    { x: 2050, y: 1950 },
    { x: 600, y: 1150 },
    { x: 2900, y: 1000 },
  ],

  kristalle: [
    { x: 2860, y: 340 },
    { x: 1590, y: 360 },
    { x: 1050, y: 250 },
    { x: 1560, y: 620 },
    { x: 910, y: 1130 },
    { x: 2560, y: 1180 },
    { x: 2810, y: 1250 },
    { x: 610, y: 1440 },
    { x: 290, y: 1790 },
    { x: 1500, y: 1820 },
    { x: 1160, y: 1850 },
    { x: 900, y: 1870 },
    { x: 2950, y: 1650 },
  ],

  fangkristalle: [
    { x: 2030, y: 520 },
    { x: 430, y: 1170 },
  ],

  // Das Rätsel: Fünf Klangsteine liegen auf einer Lichtung um den Rätselstein
  // herum. Sie leuchten in jeder Runde in einer neuen Reihenfolge auf, und
  // jede Runde leuchten mehr Steine.
  raetsel: {
    art: 'reihenfolge',
    x: 760,
    y: 560,
    aufgabe: [
      'Ein Rätselstein mit einem goldenen Fragezeichen. Um ihn herum liegen fünf bunte Klangsteine.',
      '„Gleich leuchten die Klangsteine nacheinander auf. Schau ganz genau hin und hör gut zu!“',
      '„Dann lauf in genau dieser Reihenfolge über die Steine. Es gibt drei Runden, und jede ist ein bisschen länger.“',
    ],
    steine: [
      { x: 760, y: 385, farbe: 'gelb' },
      { x: 926, y: 506, farbe: 'blau' },
      { x: 863, y: 702, farbe: 'gruen' },
      { x: 657, y: 702, farbe: 'rot' },
      { x: 594, y: 506, farbe: 'lila' },
    ],
    // So viele Steine leuchten in jeder Runde auf: erst 3, dann 4, dann 5.
    runden: [3, 4, 5],
    geschafft: '„Wunderbar! Die Klangsteine singen wieder. Hier, nimm diese Fangkristalle mit.“',
    belohnung: { fangkristalle: 2 },
  },
};
