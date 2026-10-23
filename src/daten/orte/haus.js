// Die Küche im Haus mit dem blauen Dach im Lila Dorf. Diese Datei gehört dir!
// Was die Angaben eines Ortes bedeuten, steht oben in kristallwald.js.
//
// Das Zimmer ist ein gemaltes Bild (bild: 'kueche', public/bilder/landschaft/kueche.jpg).
// grenzen sagt, wo man im Bild laufen kann: oben ist die Wand mit dem Herd.
// sperren sind unsichtbare Kreise, durch die man nicht laufen kann. Mit
// radiusX und radiusY wird es ein Oval (der Herd).
//
// So kocht man: Zum Herd gehen und ein Rezept aussuchen. Dann die Zutaten
// einsammeln, die auf dem Boden liegen, und zurück zum Herd: Alles kommt in
// den Topf, man rührt um, und fertig ist das Essen. Es kommt in den Beutel.
// Im Kampf kann man es aus dem Beutel holen, das kostet einen Zug:
//   imKampf: { heilen: 1 }       das Kalamprio bekommt alle Lebenspunkte
//                                zurück (0.5 ist die Hälfte)
//   imKampf: { staerker: 1.5 }   sein Angriff wird 1,5-mal so stark, bis der
//                                Kampf vorbei ist
//   imKampf: { wecken: 0.5 }     alle besiegten Kalamprios im Team wachen
//                                wieder auf, mit der Hälfte der Lebenspunkte
//   Man kann auch mehreres zusammen nehmen, zum Beispiel { heilen: 1, staerker: 1.3 }.
// kurzname: so heißt das Essen im Beutel (nur Kleinbuchstaben)
// info:     was im Beutel unter dem Namen steht
// zutaten:  Kurznamen von Zutaten (unten bei zutaten) oder von anderem Essen,
//           das man vorher kochen muss (zum Beispiel 'apfelkuchen'). Das
//           Essen kommt dann aus dem Beutel.
// fundort:  (optional) Dieses Rezept kennt man am Anfang nicht. Es liegt als
//           Rezeptbuch an diesem Ort ({ ort, x, y }), und wer es aufhebt,
//           kann es ab dann kochen. Im Kochbuch steht es bis dahin als „???“.
// Dasselbe Essen kann man erst nach wiederNachSekunden noch einmal kochen.

export const KUECHE = {
  name: 'Küche',
  stil: 'haus',
  bild: 'kueche',
  breite: 1536,
  hoehe: 1024,
  grenzen: { links: 60, oben: 660, rechts: 1476, unten: 985 },

  ausgaenge: [{ nach: 'lilaDorf', seite: 'unten', mitte: 768 }],

  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],

  sperren: [{ x: 270, y: 680, radiusX: 230, radiusY: 40 }],

  kueche: {
    // Vor dem Herd steht man zum Kochen. topf: wo der Topf im Bild steht.
    herd: { x: 280, y: 770, topf: { x: 265, y: 300 } },

    // Die Zutaten. name steht im Spiel, bild ist das gemalte Bild dazu.
    // Mit x und y liegt die Zutat hier in der Küche, so viel man will.
    // Mit wo wächst sie draußen und muss gesammelt werden (bei zutaten in
    // der Datei des Ortes). Gesammelte Zutaten kommen in den Beutel.
    zutaten: {
      wasser: { name: 'Wasser', bild: 'wasser', x: 700, y: 790 },
      mehl: { name: 'Mehl', bild: 'mehl', x: 1000, y: 760 },
      ei: { name: 'Ei', bild: 'ei', x: 1300, y: 780 },
      milch: { name: 'Milch', bild: 'milch', x: 1150, y: 940 },
      pilz: { name: 'Pilz', bild: 'pilz', wo: 'im Kristallwald' },
      apfel: { name: 'Apfel', bild: 'apfel', wo: 'im Kristallwald, bei Tschank' },
      honig: { name: 'Honig', bild: 'honig', wo: 'im Lila Dorf' },
      zucker: { name: 'Kristallzucker', bild: 'zucker', wo: 'in der Prismastahl-Mine' },
      mondbeeren: { name: 'Mondbeeren', bild: 'mondbeeren', wo: 'am Mondsee' },
    },

    rezepte: [
      {
        name: 'Mondsuppe',
        kurzname: 'mondsuppe',
        bild: 'suppe',
        zutaten: ['wasser', 'pilz', 'mondbeeren'],
        imKampf: { heilen: 1 },
        info: 'Macht im Kampf wieder ganz gesund.',
        satz: 'Eine warme, lila Mondsuppe! Sie kommt in deinen Beutel. Im Kampf macht sie dein Kalamprio wieder ganz gesund.',
      },
      {
        name: 'Apfelkuchen',
        kurzname: 'apfelkuchen',
        bild: 'kuchen',
        zutaten: ['apfel', 'mehl', 'ei', 'zucker'],
        imKampf: { heilen: 0.5 },
        info: 'Bringt im Kampf die Hälfte der Lebenspunkte zurück.',
        satz: 'Ein duftender Apfelkuchen! Er kommt in deinen Beutel. Im Kampf bringt er deinem Kalamprio die Hälfte der Lebenspunkte zurück.',
      },
      {
        name: 'Sternenpfannkuchen',
        kurzname: 'sternenpfannkuchen',
        bild: 'pfannkuchen',
        zutaten: ['mehl', 'milch', 'ei', 'honig'],
        imKampf: { staerker: 1.5 },
        info: 'Macht im Kampf den Angriff 1,5-mal so stark.',
        satz: 'Sternenpfannkuchen mit Honig! Sie kommen in deinen Beutel. Wer sie im Kampf isst, greift viel stärker an.',
      },

      // Diese Rezepte muss man erst finden.
      {
        name: 'Kristalltorte',
        kurzname: 'kristalltorte',
        bild: 'kristalltorte',
        zutaten: ['apfelkuchen', 'zucker', 'milch'],
        imKampf: { heilen: 1, staerker: 1.3 },
        info: 'Macht im Kampf ganz gesund und ein bisschen stärker.',
        fundort: { ort: 'prismastahlMine', x: 2650, y: 1650 },
        satz: 'Eine glitzernde Kristalltorte! Sie kommt in deinen Beutel. Im Kampf macht sie dein Kalamprio ganz gesund und ein bisschen stärker.',
      },
      {
        name: 'Zauberpunsch',
        kurzname: 'zauberpunsch',
        bild: 'zauberpunsch',
        zutaten: ['mondsuppe', 'honig', 'mondbeeren'],
        imKampf: { wecken: 0.5 },
        info: 'Weckt im Kampf alle besiegten Kalamprios im Team wieder auf.',
        fundort: { ort: 'mondsee', x: 2950, y: 1950 },
        satz: 'Ein funkelnder Zauberpunsch! Er kommt in deinen Beutel. Im Kampf weckt er alle Kalamprios in deinem Team wieder auf, die nicht mehr kämpfen konnten.',
      },
      {
        name: 'Sternenfestmahl',
        kurzname: 'sternenfestmahl',
        bild: 'festmahl',
        zutaten: ['sternenpfannkuchen', 'mondsuppe', 'apfelkuchen'],
        imKampf: { heilen: 1, staerker: 2 },
        info: 'Macht im Kampf ganz gesund und doppelt so stark.',
        fundort: { ort: 'schatzkammer', x: 1200, y: 820 },
        satz: 'Ein riesiges Sternenfestmahl! Es kommt in deinen Beutel. Im Kampf macht es dein Kalamprio ganz gesund, und es greift doppelt so stark an.',
      },
    ],

    wiederNachSekunden: 120,

    // Was man am Herd hört
    frage: 'Was möchtest du kochen?',
    fehlt: 'Für {rezept} brauchst du noch: {zutaten}.',
    umruehren: 'Alles ist im Topf! Jetzt kräftig umrühren!',
    nochZuFrueh: 'Das hast du gerade erst gekocht. Probier doch etwas anderes!',
    gefunden: 'Du hast ein Rezept gefunden: {rezept}! Dafür brauchst du: {zutaten}. Koch es in der Küche!',
  },
};

// Das Kinderzimmer im gemalten Haus im Lila Dorf. Hier wacht man am Anfang
// des Spiels auf. Was die Angaben bedeuten, steht oben bei der Küche und in
// kristallwald.js.
export const KINDERZIMMER = {
  name: 'Kinderzimmer',
  stil: 'haus',
  bild: 'kinderzimmer',
  breite: 1536,
  hoehe: 1024,
  grenzen: { links: 60, oben: 720, rechts: 1476, unten: 985 },

  ausgaenge: [{ nach: 'lilaDorf', seite: 'unten', mitte: 768 }],

  // Hier steht man, wenn ein neues Spiel beginnt.
  start: { x: 700, y: 820 },

  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],

  // Der große Teddy rechts unten
  sperren: [{ x: 1314, y: 900, radius: 60 }],

  // Das hört man, wenn man zum ersten Mal hier aufwacht.
  // {name} ist die eigene Figur, {rivalin} die andere.
  begruessung: [
    'Guten Morgen, {name}! Du bist in deinem Zimmer aufgewacht. Was für ein Durcheinander!',
    'Draußen im Lila Dorf wartet {rivalin} auf dich. Geh unten aus der Tür hinaus.',
  ],
};
