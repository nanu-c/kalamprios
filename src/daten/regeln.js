// Zahlen, mit denen du das Spielgefühl einstellen kannst. Diese Datei gehört dir!

export const REGELN = {
  // --- Kampf ---

  // Wie stark der Schaden schwankt. 0.3 bedeutet: Jeder Treffer macht
  // bis zu 30 von 100 mehr oder weniger Schaden. 0 bedeutet: immer gleich viel.
  schadenZufall: 0.3,

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

  // Wie stark ein Kalamprio auf jedem Level ist, für Level 1, 2 und 3.
  // 1 ist normal, 1.5 bedeutet: Lebenspunkte, Angriff und Verteidigung sind
  // eineinhalbmal so groß. Das Tempo wächst nur halb so viel.
  // Jedes Level ist viel stärker als das davor: Gegen ein wildes Kalamprio mit
  // Level 3 braucht man mindestens zwei Kalamprios mit Level 2, und auch dann
  // klappt es nicht immer. Mit Level-1-Kalamprios schafft man es nie.
  // Wie sich andere Zahlen anfühlen, zeigt `npm run kampfprobe`.
  staerkeJeLevel: [1, 1.35, 1.75],

  // --- Wald ---

  // Wie schnell die Figur läuft (Pixel pro Sekunde).
  lauftempo: 260,

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
};
