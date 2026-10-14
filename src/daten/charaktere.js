// Die Figuren, zwischen denen man am Anfang wählt. Diese Datei gehört dir!
//
// Die Figur, die man nicht wählt, wartet als Rivalin im Wald.
//
// name:     so heißt die Figur im Spiel
// bild:     wo das Spielbild liegt (im Ordner public)
// gruss:    das sagt sie als Rivalin, wenn man sie zum ersten Mal trifft
// revanche: das sagt sie, nachdem man sie schon einmal besiegt hat
//
// Die Sätze sind Platzhalter. Schreib gern eigene!

export const CHARAKTERE = {
  kala: {
    name: 'Kala',
    bild: 'bilder/charaktere/kala.png',
    gruss: 'Hallo! Ich bin Kala. Wollen wir kämpfen?',
    revanche: 'Du warst richtig stark! Noch eine Runde?',
  },

  pflanstaria: {
    name: 'Pflanstaria',
    bild: 'bilder/charaktere/pflanstaria.png',
    gruss: 'Hallo! Ich bin Pflanstaria. Zeig mir, was dein Kalamprio kann!',
    revanche: 'Das war ein toller Kampf! Traust du dich noch einmal?',
  },
};
