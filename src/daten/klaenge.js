// Musik, Geräusche und die Stimmen der Kalamprios. Diese Datei gehört dir!
//
// Alle Töne rechnet der Browser selbst aus. Es gibt keine Tondateien.
// Mit dem Knopf unten links (neben dem Vollbild-Knopf) schaltet man den Ton
// an und aus.

export const KLAENGE = {
  // Wie laut die Musik ist, von 0 (still) bis 1 (ganz laut).
  musik: 0.45,

  // Wie laut die Musik im Kampf ist, im Vergleich zur Musik draußen.
  // 1 ist gleich laut, 0.6 ist etwas leiser.
  musikImKampf: 0.6,

  // Die Lieder für Kämpfe (aus src/klang/lieder.js). Bei jedem Kampf kommt
  // ein anderes dran, nie zweimal hintereinander dasselbe.
  kampflieder: ['kampf', 'kampfHuepfend', 'kampfWirbel', 'kampfMutig'],

  // Wie laut die Geräusche sind (Schritte, Attacken, Rufe), von 0 bis 1.
  geraeusche: 0.8,

  // So weit (in Pixeln) hört man ein wildes Kalamprio rufen. Je näher man
  // hingeht, desto lauter wird es, so wie das Licht in der Mine.
  // Zum Vergleich: Der Bildschirm ist 1280 Pixel breit.
  hoerweite: 650,

  // Die Stimme jedes Kalamprios. Wilde Kalamprios rufen ab und zu. Im Kampf
  // ruft jedes, wenn es auftaucht und wenn es angreift, und quiekt kurz, wenn
  // es getroffen wird.
  //
  // stimme: wie es klingt. Zur Auswahl:
  //         'piepsen'  kleine helle Piepser
  //         'glocke'   wie eine kleine Glocke
  //         'glitzern' viele helle Glöckchen, schnell hintereinander
  //         'miauen'   wie eine Katze
  //         'brummen'  tief und rumpelig
  //         'blubbern' wie Blasen im Wasser
  //         'pfeifen'  wie ein Vogel, der pfeift
  //         'gurren'   wie eine Taube
  //         'zirpen'   wie eine Grille
  //         'ticken'   wie eine Uhr
  //         'zauber'   geheimnisvoll
  // hoehe:  'tief', 'mittel', 'hoch' oder 'ganz hoch'
  // silben: wie viele Töne es auf einmal macht, von 1 bis 6
  //
  // Ein Kalamprio, das hier fehlt, piepst.
  rufe: {
    kalampria: { stimme: 'glocke', hoehe: 'mittel', silben: 3 },
    bisakatze: { stimme: 'miauen', hoehe: 'hoch', silben: 2 },
    kapapa: { stimme: 'brummen', hoehe: 'tief', silben: 2 },
    qalutu: { stimme: 'glitzern', hoehe: 'hoch', silben: 5 },
    bolo: { stimme: 'blubbern', hoehe: 'mittel', silben: 4 },
    mola: { stimme: 'pfeifen', hoehe: 'hoch', silben: 2 },
    kabon: { stimme: 'gurren', hoehe: 'tief', silben: 3 },
    simfita: { stimme: 'zirpen', hoehe: 'ganz hoch', silben: 3 },
    taktik: { stimme: 'ticken', hoehe: 'mittel', silben: 4 },
    tschank: { stimme: 'brummen', hoehe: 'mittel', silben: 3 },
    blitznara: { stimme: 'zirpen', hoehe: 'hoch', silben: 5 },
    pflinia: { stimme: 'glocke', hoehe: 'hoch', silben: 2 },
    schnektata: { stimme: 'blubbern', hoehe: 'tief', silben: 3 },
    kristalta: { stimme: 'glitzern', hoehe: 'ganz hoch', silben: 4 },
    totantia: { stimme: 'brummen', hoehe: 'mittel', silben: 2 },
    zeittakel: { stimme: 'ticken', hoehe: 'hoch', silben: 6 },
    elefantia: { stimme: 'brummen', hoehe: 'tief', silben: 4 },
    zetarata: { stimme: 'ticken', hoehe: 'ganz hoch', silben: 3 },
    geheimnis: { stimme: 'zauber', hoehe: 'mittel', silben: 3 },
  },
};

// Die Stimmen und Höhen, die es gibt (damit das Spiel Tippfehler findet).
export const STIMMEN = ['piepsen', 'glocke', 'glitzern', 'miauen', 'brummen', 'blubbern', 'pfeifen', 'gurren', 'zirpen', 'ticken', 'zauber'];
export const HOEHEN = { tief: 0.6, mittel: 1, hoch: 1.5, 'ganz hoch': 2.1 };
