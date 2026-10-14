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
//
// Die Werte von Kapapa, Qalutu, Bolo, Mola und dem geheimen Kalamprio sind
// Platzhalter. Ändere sie gern!

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
