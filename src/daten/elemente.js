// Alle Elemente der Welt von Kalamprios.
//
// name:  so heißt das Element im Spiel
// farbe: die Farbe des Elements, geschrieben als 0x und dann sechs Zeichen
//        (je zwei für Rot, Grün und Blau). Du kannst sie frei ändern.
//
// Noch gibt es keine Stärken und Schwächen. Die kommen später dazu.

export const ELEMENTE = {
  mond: { name: 'Mond', farbe: 0xc9b8ff },
  elektro: { name: 'Elektro', farbe: 0xffe066 },
  kristall: { name: 'Kristall', farbe: 0x8ef0ff },
  prismastahl: { name: 'Prismastahl', farbe: 0xb8c4d9 },
  pflanze: { name: 'Pflanze', farbe: 0x7be08a },
  schatten: { name: 'Schatten', farbe: 0x8d7bc4 },
  stein: { name: 'Stein', farbe: 0xc2a888 },
  luft: { name: 'Luft', farbe: 0xdff6ff },
  wasser: { name: 'Wasser', farbe: 0x5ec8ff },

  // Das Element des geheimen Kalamprios. Niemand weiß, was es ist.
  geheim: { name: '???', farbe: 0xff6fcf },
};
