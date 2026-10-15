// Was sich das Spiel merkt, solange es läuft: wer man ist, welches Kalamprio
// man hat, wo man ist und was unterwegs schon passiert ist.
// Beim Neuladen der Seite beginnt alles von vorn. Speichern kommt später.

import { START_ORT } from './daten/orte.js';
import { REGELN } from './daten/regeln.js';
import { levelAusErfahrung } from './kampf/kampflogik.js';

export const spielstand = {
  charakter: null, // Kurzname aus charaktere.js
  rivalin: null, // die andere Figur
  kalamprio: null, // Kurzname aus kalamprios.js: das Kalamprio, das gerade kämpft
  team: [], // alle Kalamprios, die man hat (Kurznamen), das erste hat man gewählt
  erfahrung: {}, // Kurzname -> wie viel Erfahrung dieses Kalamprio hat (daraus kommt sein Level)
  fangkristalle: REGELN.fangkristalleAmAnfang, // so viele hat man dabei
  rivalinKalamprio: null,
  rivalinBesiegt: false,

  ort: START_ORT, // Kurzname aus orte.js: wo man gerade ist
  position: null, // wo die Figur an diesem Ort zuletzt stand
  ortsnameZeigen: true, // beim Ankommen groß den Namen des Ortes zeigen

  // Zeitpunkte (in Millisekunden, wie Date.now() sie liefert):
  erschoepftBis: {}, // Kurzname -> bis dahin erholt sich dieses Kalamprio
  ruheBis: 0, // kurze Verschnaufpause nach jedem Kampf
  wildeWiederDa: {}, // Ort und Nummer des wilden Kalamprios -> ab wann es wieder da ist
  fangkristallWiederDa: {}, // Ort und Nummer des Fangkristalls -> ab wann wieder einer daliegt
  grasOhneGeheimes: {}, // Ort -> wie viele andere Kalamprios im Gras seit dem geheimen kamen

  geschichteGehoert: {}, // Kurzname des Ortes -> true, wenn der dunkle Kristall erzählt hat
  hinweisGesehen: false, // der Tipp zur Steuerung wird nur einmal gezeigt
};

// Welches Level ein Kalamprio aus dem Team hat.
export function levelVon(kurzname) {
  return levelAusErfahrung(spielstand.erfahrung[kurzname] ?? 0);
}

// Wie lange sich ein Kalamprio noch erholen muss (Millisekunden, 0 heißt: bereit).
export function erholtSichNoch(kurzname) {
  return Math.max(0, (spielstand.erschoepftBis[kurzname] ?? 0) - Date.now());
}
