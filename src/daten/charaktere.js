// Die Figuren, zwischen denen man am Anfang wählt. Diese Datei gehört dir!
//
// Die Figur, die man nicht wählt, wartet als Rivalin im Wald.
//
// name:     so heißt die Figur im Spiel
// bild:     wo das Spielbild liegt (im Ordner public)
// gruss:    das sagt sie als Rivalin, wenn man sie zum ersten Mal trifft
// revanche: das sagt sie, nachdem man sie schon einmal besiegt hat
// zuWenige: das sagt sie, wenn man mit zu wenigen Kalamprios kommt
//           ({anzahl} wird durch teamFuerRivalin aus regeln.js ersetzt)
// besiegt:  das sagt sie gleich, nachdem man sie besiegt hat
//
// Die Sätze sind Platzhalter. Schreib gern eigene!

export const CHARAKTERE = {
  kala: {
    name: 'Kala',
    bild: 'bilder/charaktere/kala.png',
    gruss: 'Hallo! Ich bin Kala. Hier geht es in die Mine. Erst wenn du mich besiegst, lasse ich dich durch!',
    revanche: 'Du warst richtig stark! Noch eine Runde?',
    zuWenige: 'Mit so wenigen Kalamprios kommst du nicht an mir vorbei! Komm wieder, wenn du {anzahl} mit in den Kampf bringst.',
    besiegt: 'Wow, du hast gewonnen! Jetzt darfst du in die Mine. Pass auf, da drin ist es stockdunkel!',
  },

  pflanstaria: {
    name: 'Pflanstaria',
    bild: 'bilder/charaktere/pflanstaria.png',
    gruss: 'Hallo! Ich bin Pflanstaria. Hier geht es in die Mine. Zeig mir erst, was deine Kalamprios können!',
    revanche: 'Das war ein toller Kampf! Traust du dich noch einmal?',
    zuWenige: 'Nur so wenige Kalamprios? Damit schaffst du mich nie! Komm wieder, wenn du {anzahl} mit in den Kampf bringst.',
    besiegt: 'Du bist wirklich stark! Der Weg in die Mine ist frei. Pass auf, da drin ist es stockdunkel!',
  },
};
