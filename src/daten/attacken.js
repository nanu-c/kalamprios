// Alle Attacken des Spiels. Diese Datei gehört dir!
//
// Jede Attacke ist eine Zeile:
//
//   kurzname: { name: 'So heißt sie im Spiel', staerke: 10, pause: 0 },
//
// kurzname: nur Kleinbuchstaben, ohne Leerzeichen und ohne ä, ö, ü, ß.
//           Diesen Kurznamen schreibst du in kalamprios.js zu den Tieren.
// staerke:  wie viel Schaden die Attacke macht. 10 ist normal, 20 ist stark.
// pause:    wie viele Runden die Attacke danach aussetzen muss.
//           0 bedeutet: Sie geht jede Runde.
//
// Wichtig: Jedes Kalamprio braucht mindestens eine Attacke mit pause: 0,
// sonst hat es in manchen Runden nichts zu tun.

export const ATTACKEN = {
  // Kalampria
  mondstrahl: { name: 'Mondstrahl', staerke: 10, pause: 0 },
  traumwelle: { name: 'Traumwelle', staerke: 18, pause: 2 },

  // Bisakatze (Platzhalter: Denk dir gern eigene Namen und Werte aus!)
  funkenpfote: { name: 'Funkenpfote', staerke: 9, pause: 0 },
  blitzknospe: { name: 'Blitzknospe', staerke: 20, pause: 2 },

  // Die Attacken der neuen Kalamprios sind auch Platzhalter.
  // Kapapa
  steinbiss: { name: 'Steinbiss', staerke: 10, pause: 0 },
  felsenfall: { name: 'Felsenfall', staerke: 19, pause: 2 },

  // Qalutu
  funkelherz: { name: 'Funkelherz', staerke: 10, pause: 0 },
  kristallregen: { name: 'Kristallregen', staerke: 18, pause: 2 },

  // Bolo
  blubberstrahl: { name: 'Blubberstrahl', staerke: 10, pause: 0 },
  wirbelschweif: { name: 'Wirbelschweif', staerke: 19, pause: 2 },

  // Mola
  fluegelwind: { name: 'Flügelwind', staerke: 9, pause: 0 },
  fadentanz: { name: 'Fadentanz', staerke: 20, pause: 2 },

  // Das geheime Kalamprio
  kronenblitz: { name: 'Kronenblitz', staerke: 11, pause: 0 },
  geheimsturm: { name: '???', staerke: 20, pause: 2 },
};
