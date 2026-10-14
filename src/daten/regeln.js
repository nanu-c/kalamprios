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
};
