// Der Regenwald: ein geheimer Ort hinter einem Portal im Kristallwald.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
//
// Hier gibt es keine Kalamprios, aber viele Pflanzen. Mit der Kamera (von der
// Rivalin) fotografiert man sie wie eine Biologin. Die Fotos kommen in das
// Pflanzenalbum, das irgendwo hier am Boden liegt.
//
// pflanzen:   jede Pflanze, die man fotografieren kann. art ist das Bild
//             (public/bilder/pflanzen/…), name steht im Album, notiz ist das,
//             was die Biologin dazu aufschreibt. Neue Bilder malt
//             werkzeuge/pflanzen_malen.py.
//             groesse: so hoch steht die Pflanze da (in Pixeln).
// deko:       noch mehr Pflanzen, nur zum Anschauen (ohne Foto)
// riesenbaeume: riesige Ceiba-Bäume. Sie sind so hoch, dass sie oben aus dem
//             Bild hinauswachsen. x und y ist der Fuß des Stammes.
// staemme:    viele schlanke, moosige Baumstämme, die auch oben aus dem Bild
//             wachsen. So wird der Wald dicht.
// wurzeln, buesche, lianen: noch mehr Dschungel. Wurzeln liegen am Boden,
//             durch Büsche sieht man durch, wenn man dahinter steht, und
//             Lianen hängen von oben herab (y ist ihr unteres Ende).
// laub:       so viele Haufen Blätter liegen verstreut auf dem Boden
// album:      hier liegt das Pflanzenalbum
// ankommen:   was die Figur beim ersten Mal sagt ({name} ist die Figur)
// albumGefunden, albumVoll: was man dabei hört
// belohnung:  so viele Fangkristalle gibt es, wenn das Pflanzenalbum voll ist

export const REGENWALD = {
  name: 'Regenwald',
  stil: 'regenwald',
  breite: 2800,
  hoehe: 1800,

  ausgaenge: [],
  // Das Portal zurück in den Kristallwald
  tueren: [{ x: 260, y: 900, nach: 'kristallwald', art: 'portal', ankunft: { x: 420, y: 900 } }],
  start: { x: 420, y: 900 },

  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],

  pflanzen: [
    { art: 'monstera', name: 'Monstera', groesse: 200, x: 760, y: 560, notiz: 'Monstera: Ihre riesigen Blätter haben Löcher. So kommt der Wind durch, und Licht fällt auf die Blätter darunter.' },
    { art: 'bromelie', name: 'Bromelie', groesse: 150, x: 1180, y: 840, notiz: 'Bromelie: In der Mitte sammelt sie Regenwasser. Darin leben manchmal winzige Frösche!' },
    { art: 'orchidee', name: 'Orchidee', groesse: 160, x: 1560, y: 470, notiz: 'Orchidee: Sie wächst oft hoch oben auf Bäumen und holt sich das Wasser aus der Luft.' },
    { art: 'kannenpflanze', name: 'Kannenpflanze', groesse: 170, x: 2050, y: 760, notiz: 'Kannenpflanze: Insekten rutschen in ihre Kannen und kommen nicht mehr heraus. Sie frisst sie!' },
    { art: 'helikonie', name: 'Helikonie', groesse: 210, x: 2480, y: 520, notiz: 'Helikonie: Ihre Blüten sehen aus wie Hummerscheren. Kolibris trinken gern ihren Nektar.' },
    { art: 'baumfarn', name: 'Baumfarn', groesse: 260, x: 600, y: 1240, notiz: 'Baumfarn: Farne gab es schon zur Zeit der Dinosaurier. Dieser hier ist so groß wie ein kleiner Baum.' },
    { art: 'kakaobaum', name: 'Kakaobaum', groesse: 250, x: 1060, y: 1500, notiz: 'Kakaobaum: Die Früchte wachsen direkt am Stamm. Aus ihren Bohnen macht man Schokolade!' },
    { art: 'rafflesia', name: 'Rafflesia', groesse: 120, x: 1520, y: 1180, notiz: 'Rafflesia: Die größte Blüte der Welt. Sie riecht nach … puh, nach altem Fleisch!' },
    { art: 'passionsblume', name: 'Passionsblume', groesse: 170, x: 1960, y: 1460, notiz: 'Passionsblume: Eine Kletterpflanze mit Blüten wie kleine Kunstwerke. Ihre Früchte heißen Maracuja.' },
    { art: 'bananenstaude', name: 'Bananenstaude', groesse: 280, x: 2440, y: 1300, notiz: 'Bananenstaude: Sie sieht aus wie ein Baum, ist aber eine riesige Pflanze ohne Holz.' },
    { art: 'riesenseerose', name: 'Riesenseerose', groesse: 120, x: 1500, y: 1650, notiz: 'Riesenseerose: Ihre Blätter sind so groß und stark, dass ein kleines Kind darauf sitzen könnte!' },
    { art: 'ingwerbluete', name: 'Fackelingwer', groesse: 220, x: 2620, y: 900, notiz: 'Fackelingwer: Die Blüte leuchtet wie eine Fackel. Die Wurzel ist mit dem Ingwer aus der Küche verwandt.' },
  ],

  deko: [
    { art: 'monstera', groesse: 260, x: 160, y: 330 },
    { art: 'bananenstaude', groesse: 330, x: 420, y: 420 },
    { art: 'baumfarn', groesse: 320, x: 1300, y: 300 },
    { art: 'monstera', groesse: 240, x: 2000, y: 330 },
    { art: 'baumfarn', groesse: 300, x: 2700, y: 300 },
    { art: 'bananenstaude', groesse: 320, x: 150, y: 1650 },
    { art: 'monstera', groesse: 230, x: 820, y: 1720 },
    { art: 'baumfarn', groesse: 290, x: 2200, y: 1760 },
    { art: 'monstera', groesse: 250, x: 2720, y: 1700 },
    { art: 'bromelie', groesse: 110, x: 1820, y: 1050 },
    { art: 'orchidee', groesse: 120, x: 900, y: 980 },
  ],

  riesenbaeume: [
    { x: 980, y: 380, groesse: 1150 },
    { x: 1850, y: 600, groesse: 1250 },
    { x: 2330, y: 1080, groesse: 1200 },
    { x: 380, y: 1480, groesse: 1100 },
    { x: 1300, y: 1760, groesse: 1250 },
  ],

  staemme: [
    { x: 2519, y: 303 }, { x: 2064, y: 1116 }, { x: 818, y: 1423 },
    { x: 2311, y: 560 }, { x: 2476, y: 1635 }, { x: 916, y: 1182 }, { x: 2427, y: 746 },
    { x: 2642, y: 705 }, { x: 1661, y: 988 }, { x: 1144, y: 674 },
    { x: 1161, y: 1191 }, { x: 1427, y: 1306 }, { x: 919, y: 877 }, 
    { x: 2108, y: 1341 }, { x: 2061, y: 1699 }, { x: 550, y: 288 }, { x: 908, y: 686 },
    { x: 1710, y: 1628 }, { x: 2276, y: 254 }, { x: 493, y: 735 }, { x: 1456, y: 737 },
    { x: 2302, y: 1429 }, { x: 1408, y: 1501 },
  ],

  wurzeln: [
    { x: 700, y: 760 }, { x: 1450, y: 650 }, { x: 2250, y: 380 }, { x: 900, y: 1350 },
    { x: 1750, y: 1300 }, { x: 2600, y: 1580 }, { x: 300, y: 1100 }, { x: 2050, y: 1100 },
  ],

  buesche: [
    { x: 560, y: 690 }, { x: 1350, y: 520 }, { x: 1700, y: 900 }, { x: 2200, y: 600 },
    { x: 2560, y: 760 }, { x: 760, y: 1050 }, { x: 1000, y: 1250 }, { x: 1300, y: 1380 },
    { x: 1750, y: 1600 }, { x: 2250, y: 1500 }, { x: 2650, y: 1150 }, { x: 600, y: 1600 },
    { x: 2020, y: 482 }, { x: 1955, y: 956 }, { x: 1860, y: 382 }, { x: 363, y: 616 },
    { x: 198, y: 1685 }, { x: 1122, y: 1057 }, { x: 133, y: 598 }, { x: 2235, y: 867 },
    { x: 1719, y: 1132 }, { x: 658, y: 899 }, { x: 421, y: 315 }, { x: 2515, y: 1748 },
    { x: 211, y: 1339 }, { x: 2408, y: 293 }, { x: 2174, y: 1091 }, { x: 2524, y: 1420 },
    { x: 569, y: 460 }, { x: 1175, y: 333 }, { x: 425, y: 1113 }, { x: 1260, y: 692 },
  ],

  lianen: [
    { x: 700, y: 520 }, { x: 1150, y: 700 }, { x: 1620, y: 560 }, { x: 2100, y: 900 },
    { x: 2500, y: 640 }, { x: 860, y: 1100 }, { x: 1550, y: 1050 }, { x: 2650, y: 1350 }, { x: 450, y: 900 },
  ],

  laub: 70,

  album: { x: 1300, y: 1050 },

  ankommen: [
    '{name}: „Huch?! Wo bin ich denn hier gelandet?“',
    '{name}: „Es ist so warm und feucht … und überall wachsen Pflanzen, die ich noch nie gesehen habe!“',
    '{name}: „Hörst du die Vögel und die Frösche? Das muss ein Regenwald sein!“',
    '{name}: „Ich forsche jetzt wie eine richtige Biologin! Ich fotografiere alle Pflanzen hier. Mit der Kamera schaue ich durch den Sucher und stelle das Bild scharf.“',
  ],
  ohneKamera: '{name}: „Wenn ich nur eine Kamera hätte, dann könnte ich diese Pflanzen fotografieren!“',
  albumGefunden: 'Ein Pflanzenalbum liegt im Moos! Da klebst du deine Pflanzenfotos ein. Tipp oben auf das Album, um es anzusehen.',
  albumVoll: 'Dein Pflanzenalbum ist voll! Du hast alle {anzahl} Pflanzen fotografiert, wie eine echte Biologin! Als Belohnung bekommst du {belohnung} Fangkristalle.',
  belohnung: { fangkristalle: 5 },
};
