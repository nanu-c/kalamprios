// Was sich das Spiel merkt, solange es läuft: wer man ist, welches Kalamprio
// man hat und was im Wald schon passiert ist.
// Beim Neuladen der Seite beginnt alles von vorn. Speichern kommt später.

export const spielstand = {
  charakter: null, // Kurzname aus charaktere.js
  rivalin: null, // die andere Figur
  kalamprio: null, // Kurzname aus kalamprios.js
  rivalinKalamprio: null,
  rivalinBesiegt: false,

  position: null, // wo die Figur im Wald zuletzt stand

  // Zeitpunkte (in Millisekunden, wie Date.now() sie liefert):
  erschoepftBis: 0, // bis dahin erholt sich das eigene Kalamprio
  ruheBis: 0, // kurze Verschnaufpause nach jedem Kampf
  wildeWiederDa: {}, // Nummer des wilden Kalamprios -> ab wann es wieder da ist

  hinweisGesehen: false, // der Tipp zur Steuerung wird nur einmal gezeigt
};
