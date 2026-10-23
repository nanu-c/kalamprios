// Der verschollene Stollen: ein alter Gang tief in der Prismastahl-Mine.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in
// kristallwald.js, wie das Spiegel-Rätsel geht, oben in geheimgang.js.
//
// Der Eingang ist in der Mine ganz rechts (bei tueren in prismastahlMine.js).
// Man findet ihn erst, wenn das Rätsel der Mine gelöst ist und das Licht
// weiter scheint.
//
// statue: Eine Statue, die seit langer Zeit verschollen ist. Sie taucht auf,
//         wenn das Rätsel hier gelöst ist.
//   x, y:      wo sie steht
//   kalamprio: welches Kalamprio sie zeigt (Kurzname aus kalamprios.js)
//   inschrift: was auf dem Sockel steht
//   satz:      was man hört, wenn man zu ihr geht

export const VERSCHOLLENER_STOLLEN = {
  name: 'Verschollener Stollen',
  stil: 'mine',
  breite: 2000,
  hoehe: 1250,

  ausgaenge: [],
  tueren: [{ x: 260, y: 700, nach: 'prismastahlMine', art: 'treppe', ankunft: { x: 420, y: 760 } }],

  ankommen: [
    'Ein alter, schmaler Stollen. Hier war schon sehr lange niemand mehr.',
    'An den Wänden hängen verrostete Laternen, und auf dem Boden liegen alte Schienen.',
    'Man erzählt sich, dass hier unten vor langer Zeit eine Statue verloren gegangen ist …',
  ],

  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],

  prismastahl: [
    { x: 520, y: 330 },
    { x: 1820, y: 1120 },
  ],
  gold: [
    { x: 330, y: 1100 },
    { x: 1250, y: 1150 },
  ],
  felsen: [{ x: 600, y: 1100 }],

  dunkel: 0.9,
  licht: 1,

  raetsel: {
    art: 'spiegel',
    x: 420,
    y: 470,
    aufgabe: [
      'Ein alter Rätselstein, ganz staubig. Daneben flackert eine Pilzlampe.',
      '„Seit vielen Jahren wartet hier etwas Verlorenes. Nur das Licht kann es zurückholen.“',
      '„Lauf über die Spiegel, dann drehen sie sich. Lenk den Lichtstrahl bis zum dunklen Kristall!“',
    ],
    links: 700,
    oben: 330,
    spalten: 6,
    reihen: 5,
    groesse: 140,
    startReihe: 3,
    zielReihe: 1,
    spiegel: [
      { spalte: 1, reihe: 3, stellung: '\\' },
      { spalte: 1, reihe: 0, stellung: '\\' },
      { spalte: 4, reihe: 0, stellung: '/' },
      { spalte: 4, reihe: 1, stellung: '/' },
      { spalte: 3, reihe: 3, stellung: '/' },
      { spalte: 2, reihe: 2, stellung: '\\' },
      { spalte: 0, reihe: 1, stellung: '/' },
      { spalte: 3, reihe: 4, stellung: '\\' },
      { spalte: 5, reihe: 3, stellung: '/' },
      { spalte: 2, reihe: 4, stellung: '/' },
      { spalte: 5, reihe: 0, stellung: '\\' },
    ],
    geschafft: '„Der Kristall leuchtet! Und schau nur, da hinten: Im Licht ist etwas aufgetaucht, das sehr lange verschollen war!“',
    belohnung: { fangkristalle: 3 },
  },

  statue: {
    x: 1700,
    y: 1060,
    kalamprio: 'kalampria',
    inschrift: 'Grüße von Mia',
    satz: 'Eine alte Statue aus Stein, ein Kalamprio auf einem Sockel. Sie war viele Jahre verschollen. Auf dem Sockel steht: „Grüße von Mia“.',
  },
};
