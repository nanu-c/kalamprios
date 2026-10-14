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
  },

  // DEINE AUFGABE: Kapapa ins Spiel bringen. Das Bild ist schon fertig.
  //
  // 1. Denk dir in attacken.js zwei Attacken für Kapapa aus.
  // 2. Entferne hier unten die zwei Schrägstriche // am Anfang jeder Zeile.
  // 3. Trag Kapapas Element, seine Werte und die Kurznamen der Attacken ein.
  // 4. Speichern. Kapapa erscheint dann von selbst in der Auswahl.
  //
  // kapapa: {
  //   name: 'Kapapa',
  //   element: 'stein',
  //   bild: 'bilder/kalamprios/kapapa.png',
  //   blick: 'vorne',
  //   kp: 65,
  //   angriff: 10,
  //   verteidigung: 10,
  //   tempo: 10,
  //   attacken: ['erste_attacke', 'zweite_attacke'],
  // },
};
