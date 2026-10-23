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
// kamera:   das sagt sie danach, wenn sie einem ihre Kamera schenkt
// hunger:   das sagt sie am Anfang im Lila Dorf: Sie wünscht sich Pfannkuchen
// danke:    das sagt sie, wenn man ihr die Pfannkuchen bringt, bevor sie
//           einem ein Kalamprio schenkt
// bisGleich: das sagt sie, nachdem sie einem das Kalamprio geschenkt hat
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
    kamera: 'Und weil du so toll gekämpft hast, schenke ich dir meine Kamera! Mach Fotos von allen Kalamprios und kleb sie in dein Fotoalbum. Schaffst du es, das ganze Album zu füllen?',
    hunger: 'Hallo! Ich bin Kala. Mein Bauch knurrt so laut! Wenn du mir Sternenpfannkuchen bringst, schenke ich dir dein erstes Kalamprio. Kochen kannst du in der Küche im Haus mit dem blauen Dach. Honig wächst hier im Dorf.',
    danke: 'Sternenpfannkuchen! Die riechen ja herrlich! Vielen Dank! Wie versprochen bekommst du jetzt dein erstes Kalamprio. Such dir eins aus!',
    bisGleich: 'Pass gut auf dein Kalamprio auf! Ich gehe schon mal in den Kristallwald. Wir sehen uns am Eingang zur Mine!',
  },

  pflanstaria: {
    name: 'Pflanstaria',
    bild: 'bilder/charaktere/pflanstaria.png',
    gruss: 'Hallo! Ich bin Pflanstaria. Hier geht es in die Mine. Zeig mir erst, was deine Kalamprios können!',
    revanche: 'Das war ein toller Kampf! Traust du dich noch einmal?',
    zuWenige: 'Nur so wenige Kalamprios? Damit schaffst du mich nie! Komm wieder, wenn du {anzahl} mit in den Kampf bringst.',
    besiegt: 'Du bist wirklich stark! Der Weg in die Mine ist frei. Pass auf, da drin ist es stockdunkel!',
    kamera: 'Hier, nimm meine Kamera! Damit kannst du alle Kalamprios fotografieren. Die Fotos kommen in dein Fotoalbum. Ob du alle findest?',
    hunger: 'Hallo! Ich bin Pflanstaria. Ich habe so einen Hunger auf Sternenpfannkuchen! Bringst du mir welche? Dann bekommst du ein Kalamprio von mir geschenkt. In der Küche im Haus mit dem blauen Dach kannst du kochen, und Honig findest du hier im Dorf.',
    danke: 'Mmh, Sternenpfannkuchen! Danke, du bist toll! Zum Dank schenke ich dir dein erstes Kalamprio. Welches möchtest du?',
    bisGleich: 'Viel Spaß mit deinem Kalamprio! Ich warte im Kristallwald am Eingang zur Mine auf dich. Dann zeigen wir mal, wer stärker ist!',
  },
};
