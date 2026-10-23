// Zahlen, mit denen du das Spielgefühl einstellen kannst. Diese Datei gehört dir!

export const REGELN = {
  // --- Kampf ---

  // Wie stark der Schaden schwankt. 0.3 bedeutet: Jeder Treffer macht
  // bis zu 30 von 100 mehr oder weniger Schaden. 0 bedeutet: immer gleich viel.
  schadenZufall: 0.3,

  // So viel zählt jeder Treffer. 1 ist normal, 1.6 bedeutet: Jeder Treffer
  // macht 1,6-mal so viel Schaden, die Kämpfe sind dann kürzer. Wer
  // gewinnt, ändert sich dadurch kaum. Wie viele Angriffe ein Kampf dauert,
  // zeigt `npm run kampfprobe`.
  schadenMal: 1.6,

  // Wie stark das Tempo schwankt. Jede Runde hat jedes Kalamprio einen
  // schnelleren oder langsameren Moment. So ist manchmal auch das langsamere
  // Tier zuerst dran. 0 bedeutet: Das schnellere ist immer zuerst dran.
  tempoZufall: 0.3,

  // Nicht jede Attacke trifft richtig. 0.08 bedeutet 8 von 100.
  //
  // So oft haut ein Kalamprio daneben und macht gar keinen Schaden.
  danebenChance: 0.08,
  // So oft springt der Gegner zur Seite und weicht aus. Wer schneller ist als
  // der Angreifer, weicht öfter aus (höchstens doppelt so oft), wer
  // langsamer ist, seltener.
  ausweichChance: 0.08,
  // So oft wehrt der Gegner die Attacke ab ...
  abwehrChance: 0.1,
  // ... und bekommt dann nur so viel vom Schaden ab. 0.5 bedeutet die Hälfte.
  abgewehrtSchaden: 0.5,

  // --- Level ---

  // Für jeden Sieg bekommt ein Kalamprio Erfahrung: so viel, wie das Level
  // des besiegten Gegners (Level 1 bringt 1, Level 3 bringt 3). Die Erfahrung
  // bekommt das Kalamprio, das am Ende des Kampfes noch steht.
  //
  // So viel Erfahrung braucht es für jedes Level: Level 1 hat es am Anfang
  // (0), Level 2 ab 5, Level 3 ab 15. Mehr Level gibt es nicht.
  erfahrungFuerLevel: [0, 5, 15],

  // Wie stark ein Kalamprio auf jedem Level ist, für Level 1, 2, 3, 4 und 5.
  // 1 ist normal, 1.5 bedeutet: Lebenspunkte, Angriff und Verteidigung sind
  // eineinhalbmal so groß. Das Tempo wächst nur halb so viel.
  // Jedes Level ist viel stärker als das davor: Gegen ein wildes Kalamprio mit
  // Level 3 braucht man mindestens zwei Kalamprios mit Level 2, und auch dann
  // klappt es nicht immer. Mit Level-1-Kalamprios schafft man es nie.
  // Level 4 und 5 gibt es nur für das geheime Kalamprio (geheimesLevel unten),
  // die eigenen Kalamprios kommen höchstens bis Level 3.
  // Wie sich andere Zahlen anfühlen, zeigt `npm run kampfprobe`.
  staerkeJeLevel: [1, 1.35, 1.75, 2, 2.3],

  // Wilde Kalamprios mit Level 1 (im Kristallwald) sind ein bisschen
  // schwächer als deine: Lebenspunkte und Angriff mal diese Zahl.
  // 1 ist gleich stark. Mit 0.9 gewinnt ein einzelnes Level-1-Kalamprio
  // ungefähr 7 von 10 Kämpfen, mit 1 nur die Hälfte.
  wildeAufLevel1: 0.9,

  // --- Wald ---

  // Wie schnell die Figur läuft (Pixel pro Sekunde).
  lauftempo: 260,
  // Unter Wasser schwimmt man langsamer: so viel vom Lauftempo.
  schwimmTempo: 0.7,

  // Wie lange sich dein Kalamprio nach einer Niederlage erholen muss (Sekunden).
  // In dieser Zeit kann es nicht kämpfen.
  erholungSekunden: 20,

  // Wie lange ein besiegtes wildes Kalamprio verschwunden bleibt (Sekunden).
  wildeKommenWiederSekunden: 60,

  // Im hohen Gras: Nach so vielen Pixeln wird gewürfelt, ob etwas auftaucht ...
  grasSchritt: 70,
  // ... und so groß ist die Chance dabei. 0.12 bedeutet 12 von 100.
  grasChance: 0.12,

  // --- Fangkristalle ---

  // So viele Fangkristalle hat man am Anfang.
  fangkristalleAmAnfang: 3,

  // Die Chance, ein wildes Kalamprio zu fangen, das noch alle Lebenspunkte
  // hat. 0.2 bedeutet 20 von 100 ...
  fangChanceGesund: 0.2,
  // ... und die Chance, wenn es fast keine Lebenspunkte mehr hat.
  // Dazwischen wird die Chance immer größer, je schwächer es ist.
  fangChanceSchwach: 0.9,

  // Wie lange es dauert, bis an derselben Stelle wieder ein Fangkristall
  // liegt, nachdem man ihn aufgesammelt hat (Sekunden).
  fangkristallWaechstNachSekunden: 90,

  // --- Zutaten ---

  // Wie lange es dauert, bis eine Zutat draußen nachgewachsen ist, nachdem
  // man sie gepflückt hat (Sekunden). Wo welche wachsen, steht bei zutaten
  // in den Dateien der Orte.
  zutatenWachsenNachSekunden: 90,

  // --- Kamera und Fotoalbum ---

  // So nah (in Pixeln) muss ein wildes Kalamprio sein, damit es aufs Foto
  // kommt. Zum Vergleich: Der Bildschirm ist 1280 Pixel breit.
  fotoWeite: 500,
  // So viele Fotos sind auf einer Seite im Fotoalbum.
  fotosJeSeite: 4,
  // So viele Fangkristalle bekommt man, wenn das Fotoalbum voll ist.
  albumVollFangkristalle: 5,

  // --- Das Team ---

  // So viele Kalamprios dürfen höchstens mit in einen Kampf. Welche das sind,
  // wählt man mit dem Knopf „Team“.
  imKampfHoechstens: 3,

  // --- Die Rivalin ---

  // So viele Kalamprios müssen mindestens mit in den Kampf kommen, damit die
  // Rivalin kämpft. Sie bewacht den Weg in die Mine: Mit nur einem
  // Kalamprio kommt man nicht an ihr vorbei.
  teamFuerRivalin: 2,

  // --- Das geheime Kalamprio ---

  // So viele Kalamprios müssen mindestens mit in den Kampf kommen, um das
  // geheime Kalamprio zu besiegen. Mit weniger schützt es ein Schild aus Licht, und
  // es verschwindet wieder. Wer es besiegt oder fängt, hat das Spiel geschafft.
  teamFuerGeheimes: 3,
  // ... und so ein hohes Level müssen sie alle mindestens haben.
  levelFuerGeheimes: 3,
  // Das Level des geheimen Kalamprios. Es ist der Endgegner: Mit drei
  // Kalamprios auf Level 3 gewinnt man ungefähr acht von zehn Kämpfen.
  geheimesLevel: 5,
};
