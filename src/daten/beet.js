// Das Gartenbeet unten im Lila Dorf. Diese Datei gehört dir!
//
// An vielen Orten liegt Saatgut (saatgut beim Ort, zum Beispiel in
// kristallwald.js). Wer es aufsammelt, hat es im Beutel. Im Beet setzt man
// es ein. Dann wächst es, ganz langsam, auch wenn man gerade nicht spielt.
// Es lohnt sich, immer wieder einmal nachzusehen: Erst ist da ein kleiner
// Keimling, nach einer Stunde eine große Pflanze. Und dann wird sie wild: Sie wird immer größer und streut Ableger, auch über den Zaun hinaus.
// Zähmen kann man das Beet dann nicht mehr!
//
// Die Zeiten stehen in Sekunden. 60 * 60 ist eine Stunde.
// keimenSekunden:     so lange ist eine Pflanze ein kleiner Keimling
// reifSekunden:       nach so vielen Sekunden ist sie ganz groß
// ausbreitenSekunden: danach streut sie jedes Mal nach so vielen Sekunden einen Ableger
// ablegerJePflanze:   so viele Ableger streut jede Pflanze höchstens
// andereArt:          so oft wird aus einem Ableger eine andere Pflanze
//                     aus dem Beet. 0.15 bedeutet 15 von 100.
// hoechstens:         so viele Pflanzen wachsen höchstens, Ableger mitgezählt
// wildWeite:          so weit (in Pixeln) wuchern die Ableger um das Beet herum
// samen:              das Saatgut. Bei jedem steht:
//   name:    so heißt es im Beutel
//   farbe:   die Farbe auf dem Saatgut-Tütchen
//   pflanze: das Bild der Pflanze, die daraus wächst
//   groesse: so hoch ist die Pflanze, wenn sie ganz groß ist (in Pixeln)
//   wo:      wo man es findet (steht im Beutel)
// saetze:             was das Beet sagt

export const BEET = {
  keimenSekunden: 10 * 60, // zehn Minuten
  reifSekunden: 60 * 60, // eine Stunde
  ausbreitenSekunden: 45 * 60, // alle 45 Minuten ein Ableger
  ablegerJePflanze: 4,
  andereArt: 0.15,
  hoechstens: 110,
  wildWeite: 480,

  samen: {
    pilzsporen: { name: 'Pilzsporen', farbe: 0xffb38a, pflanze: 'pilz', groesse: 90, wo: 'im Kristallwald' },
    apfelkerne: { name: 'Apfelkerne', farbe: 0xff6b6b, pflanze: 'baum-rund', groesse: 230, wo: 'im Kristallwald, bei Tschank' },
    kristallkeim: { name: 'Kristallkeim', farbe: 0x8ec8ff, pflanze: 'kristall-blau', groesse: 120, wo: 'in der Prismastahl-Mine' },
    seerosensamen: { name: 'Seerosensamen', farbe: 0x7be0c0, pflanze: 'pflanze-riesenseerose', groesse: 90, wo: 'am Mondsee' },
    orchideensamen: { name: 'Orchideensamen', farbe: 0xe08aff, pflanze: 'pflanze-orchidee', groesse: 130, wo: 'im Regenwald' },
    passionsblumensamen: { name: 'Passionsblumensamen', farbe: 0x9a7aff, pflanze: 'pflanze-passionsblume', groesse: 140, wo: 'im Regenwald' },
    kannenpflanzensamen: { name: 'Kannenpflanzensamen', farbe: 0x8ad06a, pflanze: 'pflanze-kannenpflanze', groesse: 140, wo: 'im Regenwald' },
    nachtkerzensamen: { name: 'Nachtkerzensamen', farbe: 0xffe066, pflanze: 'nachtblume-nachtkerze', groesse: 100, wo: 'im Lila Dorf' },
    mondwindensamen: { name: 'Mondwindensamen', farbe: 0xd8e4ff, pflanze: 'nachtblume-mondwinde', groesse: 100, wo: 'im Mondblütental (nur zu zweit)' },
  },

  saetze: {
    leer: 'Ein Beet mit frischer, dunkler Erde. Hier kannst du Saatgut einsetzen. Saatgut findest du an vielen Orten.',
    keimt: 'Im Beet spitzen kleine Keimlinge aus der Erde. Gib ihnen ein bisschen Zeit!',
    waechst: 'Im Beet wächst und wächst es. Wie groß das wohl wird?',
    wild: 'Das Beet wird wild! Ranken klettern über den Zaun, und überall sprießen neue Pflanzen.',
    ganzWild: 'Das Beet ist ganz wild geworden. Es wuchert über den Zaun und über die ganze Wiese!',
    voll: 'Im Beet ist kein Platz mehr frei.',
    keinSaatgut: 'Du hast kein Saatgut dabei. Such es an anderen Orten!',
    eingesetzt: 'Du setzt {name} in die Erde. Jetzt heißt es warten …',
    ordentlich: 'Du zupfst ein paar Blätter zurecht. Das Beet ist schön ordentlich.',
    nichtZaehmen: 'Du ziehst und zupfst und schneidest … aber die Pflanzen wachsen sofort wieder nach, noch wilder als vorher! Dieses Beet lässt sich nicht mehr zähmen.',
  },
};
