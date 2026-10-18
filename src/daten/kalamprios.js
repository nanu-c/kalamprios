// Alle Kalamprios des Spiels. Diese Datei gehört dir!
//
// Jedes Kalamprio ist ein Eintrag mit diesen Angaben:
//
// name:         so heißt es im Spiel
// element:      ein Kurzname aus elemente.js, zum Beispiel 'mond'
// bild:         wo das Spielbild liegt (im Ordner public)
// blick:        wohin es auf dem Bild schaut: 'vorne', 'links' oder 'rechts'.
//               Im Kampf dreht das Spiel es damit zum Gegner.
// kp:           Lebenspunkte. Bei 0 kann es nicht mehr kämpfen.
// angriff:      je höher, desto mehr Schaden machen seine Attacken
// verteidigung: je höher, desto weniger Schaden bekommt es
// tempo:        wer mehr Tempo hat, greift in der Runde zuerst an
// attacken:     Kurznamen aus attacken.js, am Anfang zwei Stück
// zumStart:     true bedeutet: Dieses Kalamprio kann man am Anfang auswählen.
//               Alle anderen muss man später fangen.
// geheim:       (nur beim geheimen Kalamprio) true bedeutet: Man kann es am
//               Anfang nicht auswählen, man kann es nur ganz selten treffen.
//               Mit dem Fangkristall ist es doppelt so schwer zu fangen.
// fliegt:       (optional) true bedeutet: Es schwebt über dem Boden, sein
//               Schatten bleibt unten.
//
// Die Werte von Kapapa, Qalutu, Bolo, Mola, Kabon, Simfita, Tak-Tik, Tschank,
// Blitznara und dem geheimen Kalamprio sind Platzhalter. Ändere sie gern!

export const KALAMPRIOS = {
  kalampria: {
    name: 'Kalampria',
    element: 'mond',
    bild: 'bilder/kalamprios/kalampria.png',
    blick: 'vorne',
    kp: 70,
    angriff: 10,
    verteidigung: 10,
    tempo: 12,
    attacken: ['mondstrahl', 'traumwelle'],
    zumStart: true,
  },

  bisakatze: {
    name: 'Bisakatze',
    element: 'elektro',
    bild: 'bilder/kalamprios/bisakatze.png',
    blick: 'links',
    kp: 66,
    angriff: 11,
    verteidigung: 9,
    tempo: 14,
    attacken: ['funkenpfote', 'blitzknospe'],
    zumStart: true,
  },

  kapapa: {
    name: 'Kapapa',
    element: 'stein',
    bild: 'bilder/kalamprios/kapapa.png',
    blick: 'vorne',
    kp: 72,
    angriff: 10,
    verteidigung: 10,
    tempo: 8,
    attacken: ['steinbiss', 'felsenfall'],
  },

  qalutu: {
    name: 'Qalutu',
    element: 'kristall',
    bild: 'bilder/kalamprios/qalutu.png',
    blick: 'vorne',
    kp: 70,
    angriff: 10,
    verteidigung: 10,
    tempo: 12,
    attacken: ['funkelherz', 'kristallregen'],
  },

  bolo: {
    name: 'Bolo',
    element: 'wasser',
    bild: 'bilder/kalamprios/bolo.png',
    blick: 'links',
    kp: 70,
    angriff: 10,
    verteidigung: 10,
    tempo: 10,
    attacken: ['blubberstrahl', 'wirbelschweif'],
  },

  mola: {
    name: 'Mola',
    element: 'luft',
    bild: 'bilder/kalamprios/mola.png',
    blick: 'rechts',
    kp: 64,
    angriff: 11,
    verteidigung: 9,
    tempo: 16,
    attacken: ['fluegelwind', 'fadentanz'],
    fliegt: true,
  },

  kabon: {
    name: 'Kabon',
    element: 'pflanze',
    bild: 'bilder/kalamprios/kabon.png',
    blick: 'rechts',
    kp: 74,
    angriff: 9,
    verteidigung: 12,
    tempo: 8,
    attacken: ['blattschlag', 'nussbombe'],
  },

  simfita: {
    name: 'Simfita',
    element: 'kristall',
    bild: 'bilder/kalamprios/simfita.png',
    blick: 'vorne',
    kp: 66,
    angriff: 12,
    verteidigung: 8,
    tempo: 15,
    attacken: ['schweifhieb', 'kristallsplitter'],
  },

  taktik: {
    name: 'Tak-Tik',
    element: 'zeit',
    bild: 'bilder/kalamprios/taktik.png',
    blick: 'vorne',
    kp: 68,
    angriff: 10,
    verteidigung: 10,
    tempo: 13,
    attacken: ['ticktack', 'weckerklingeln'],
  },

  // Ein Baum mit Äpfeln und einem Gesicht am Stamm. Lebt im Kristallwald.
  tschank: {
    name: 'Tschank',
    element: 'pflanze',
    bild: 'bilder/kalamprios/tschank.png',
    blick: 'vorne',
    kp: 78,
    angriff: 10,
    verteidigung: 12,
    tempo: 7,
    attacken: ['wurzelgriff', 'apfelregen'],
  },

  // Eine Schlange, die sich zu einer Spirale einrollt. Lebt am Mondsee.
  blitznara: {
    name: 'Blitznara',
    element: 'elektro',
    bild: 'bilder/kalamprios/blitznara.png',
    blick: 'vorne',
    kp: 62,
    angriff: 12,
    verteidigung: 8,
    tempo: 17,
    attacken: ['schlangenbiss', 'spiralblitz'],
  },

  // Das geheime Kalamprio. Von ihm weiß man nicht viel ...
  geheimnis: {
    name: '???',
    element: 'geheim',
    bild: 'bilder/kalamprios/geheimnis.png',
    blick: 'vorne',
    kp: 70,
    angriff: 10,
    verteidigung: 10,
    tempo: 13,
    attacken: ['kronenblitz', 'geheimsturm'],
    geheim: true,
  },
};
