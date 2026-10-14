// Was sich das Spiel merkt, solange es läuft: wer man ist, welches Kalamprio
// man hat, wo man ist und was unterwegs schon passiert ist.
// Beim Neuladen der Seite beginnt alles von vorn. Speichern kommt später.

import { START_ORT } from './daten/orte.js';

export const spielstand = {
  charakter: null, // Kurzname aus charaktere.js
  rivalin: null, // die andere Figur
  kalamprio: null, // Kurzname aus kalamprios.js
  rivalinKalamprio: null,
  rivalinBesiegt: false,

  ort: START_ORT, // Kurzname aus orte.js: wo man gerade ist
  position: null, // wo die Figur an diesem Ort zuletzt stand
  ortsnameZeigen: true, // beim Ankommen groß den Namen des Ortes zeigen

  // Zeitpunkte (in Millisekunden, wie Date.now() sie liefert):
  erschoepftBis: 0, // bis dahin erholt sich das eigene Kalamprio
  ruheBis: 0, // kurze Verschnaufpause nach jedem Kampf
  wildeWiederDa: {}, // Ort und Nummer des wilden Kalamprios -> ab wann es wieder da ist

  hinweisGesehen: false, // der Tipp zur Steuerung wird nur einmal gezeigt
};
