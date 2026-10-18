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
// effekt:   (freiwillig) wie die Attacke aussieht. Ohne effekt sieht sie so
//           aus wie das Element des Kalamprios. Man kann auch den Kurznamen
//           eines anderen Elements aus elemente.js nehmen, zum Beispiel
//           effekt: 'wasser', oder eins von diesen:
//             'herz'        fliegende Herzen (stark: auch ein Herzregen)
//             'strahl'      ein langer, leuchtender Strahl
//             'traum'       bunte Traumwellen und Schlafsterne
//             'krallen'     hinlaufen und dreimal kratzen
//             'blitzschlag' eine Blüte am Himmel, aus der Blitze schlagen
//             'biss'        riesige Zähne schnappen zu
//             'wirbel'      ein Wasserwirbel um den Gegner
//             'faden'       Fäden wickeln sich um den Gegner
//             'bombe'       eine Nuss fliegt hin und explodiert
//             'hieb'        hinlaufen und mit dem Schweif ausholen
//             'krone'       eine Krone, aus der Blitze regnen
//           Die Farbe kommt vom Element des Kalamprios.
//           Starke Attacken (mit Pause) sehen größer aus.
//
// Wichtig: Jedes Kalamprio braucht mindestens eine Attacke mit pause: 0,
// sonst hat es in manchen Runden nichts zu tun.

export const ATTACKEN = {
  // Kalampria
  mondstrahl: { name: 'Mondstrahl', staerke: 10, pause: 0, effekt: 'strahl' },
  traumwelle: { name: 'Traumwelle', staerke: 18, pause: 2, effekt: 'traum' },

  // Bisakatze (Platzhalter: Denk dir gern eigene Namen und Werte aus!)
  funkenpfote: { name: 'Funkenpfote', staerke: 9, pause: 0, effekt: 'krallen' },
  blitzknospe: { name: 'Blitzknospe', staerke: 20, pause: 2, effekt: 'blitzschlag' },

  // Die Attacken der neuen Kalamprios sind auch Platzhalter.
  // Kapapa
  steinbiss: { name: 'Steinbiss', staerke: 10, pause: 0, effekt: 'biss' },
  felsenfall: { name: 'Felsenfall', staerke: 19, pause: 2 },

  // Qalutu
  funkelherz: { name: 'Funkelherz', staerke: 10, pause: 0, effekt: 'herz' },
  kristallregen: { name: 'Kristallregen', staerke: 18, pause: 2, effekt: 'herz' },

  // Bolo
  blubberstrahl: { name: 'Blubberstrahl', staerke: 10, pause: 0 },
  wirbelschweif: { name: 'Wirbelschweif', staerke: 19, pause: 2, effekt: 'wirbel' },

  // Mola
  fluegelwind: { name: 'Flügelwind', staerke: 9, pause: 0 },
  fadentanz: { name: 'Fadentanz', staerke: 20, pause: 2, effekt: 'faden' },

  // Kabon
  blattschlag: { name: 'Blattschlag', staerke: 10, pause: 0 },
  nussbombe: { name: 'Nussbombe', staerke: 19, pause: 2, effekt: 'bombe' },

  // Simfita
  schweifhieb: { name: 'Schweifhieb', staerke: 10, pause: 0, effekt: 'hieb' },
  kristallsplitter: { name: 'Kristallsplitter', staerke: 19, pause: 2 },

  // Tak-Tik
  ticktack: { name: 'Tick-Tack', staerke: 10, pause: 0 },
  weckerklingeln: { name: 'Weckerklingeln', staerke: 19, pause: 2 },

  // Tschank
  wurzelgriff: { name: 'Wurzelgriff', staerke: 10, pause: 0, effekt: 'faden' },
  apfelregen: { name: 'Apfelregen', staerke: 19, pause: 2, effekt: 'bombe' },

  // Blitznara
  schlangenbiss: { name: 'Schlangenbiss', staerke: 10, pause: 0, effekt: 'biss' },
  spiralblitz: { name: 'Spiralblitz', staerke: 20, pause: 2 },

  // Pflinia
  sonnenblatt: { name: 'Sonnenblatt', staerke: 10, pause: 0, effekt: 'strahl' },
  blaetterkranz: { name: 'Blätterkranz', staerke: 19, pause: 2 },

  // Schnektata
  rankenpeitsche: { name: 'Rankenpeitsche', staerke: 10, pause: 0, effekt: 'faden' },
  moosschleim: { name: 'Moosschleim', staerke: 18, pause: 2, effekt: 'wirbel' },

  // Kristalta
  flossenschlag: { name: 'Flossenschlag', staerke: 10, pause: 0, effekt: 'hieb' },
  funkelspitze: { name: 'Funkelspitze', staerke: 19, pause: 2 },

  // Totantia
  hornstoss: { name: 'Hornstoß', staerke: 10, pause: 0, effekt: 'krallen' },
  schuppenregen: { name: 'Schuppenregen', staerke: 19, pause: 2 },

  // Zeittakel
  zeigerschlag: { name: 'Zeigerschlag', staerke: 10, pause: 0, effekt: 'hieb' },
  uhrenwirbel: { name: 'Uhrenwirbel', staerke: 19, pause: 2, effekt: 'wirbel' },

  // Elefantia
  ruesselspritzer: { name: 'Rüsselspritzer', staerke: 10, pause: 0, effekt: 'strahl' },
  stampfwelle: { name: 'Stampfwelle', staerke: 20, pause: 2 },

  // Zetarata
  tentakeltick: { name: 'Tentakel-Tick', staerke: 10, pause: 0, effekt: 'faden' },
  zeitsprung: { name: 'Zeitsprung', staerke: 19, pause: 2 },

  // Das geheime Kalamprio
  kronenblitz: { name: 'Kronenblitz', staerke: 11, pause: 0, effekt: 'krone' },
  geheimsturm: { name: '???', staerke: 20, pause: 2 },
};
