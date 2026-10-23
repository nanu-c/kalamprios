// Regeln fürs Spielen zu zweit, die nur rechnen: der Code zum Verbinden und
// das Tauschen von Kalamprios. Die Verbindung selbst steht in verbindung.js.

import { levelAusErfahrung } from '../kampf/kampflogik.js';

// Würfelt einen Code: laenge Nummern, jede von 0 bis anzahl - 1. Jede Nummer
// ist ein Kalamprio aus codeBilder (daten/zusammen.js).
export function codeWuerfeln(anzahl, laenge, zufall = Math.random) {
  return Array.from({ length: laenge }, () => Math.floor(zufall() * anzahl));
}

// Welche eigenen Kalamprios man der anderen anbieten kann: alle, die sie
// noch nicht hat (jedes Kalamprio kann man nur einmal im Team haben).
export function anbietbar(meinTeam, ihrTeam) {
  return meinTeam.filter((kurzname) => !ihrTeam.includes(kurzname));
}

// Passt ein Tausch? gibt ist das eigene Angebot, bekommt das der anderen.
export function tauschPasst(meinTeam, ihrTeam, gibt, bekommt) {
  return Boolean(
    gibt &&
      bekommt &&
      meinTeam.includes(gibt) &&
      ihrTeam.includes(bekommt) &&
      !meinTeam.includes(bekommt) &&
      !ihrTeam.includes(gibt),
  );
}

// Tauscht im Spielstand stand: gibt geht weg (mit seiner Erfahrung), bekommt
// kommt dazu, und zwar mit der Erfahrung, die es bei der anderen hatte.
// Es nimmt im Team den Platz des alten ein. Kam das alte mit in den Kampf,
// kommt jetzt das neue mit.
export function tauschen(stand, gibt, bekommt, erfahrung) {
  stand.team = stand.team.map((kurzname) => (kurzname === gibt ? bekommt : kurzname));
  stand.kampfteam = stand.kampfteam.map((kurzname) => (kurzname === gibt ? bekommt : kurzname));
  if (stand.kampfteam.length === 0) stand.kampfteam = [bekommt];
  stand.kalamprio = stand.kampfteam[0];
  delete stand.erfahrung[gibt];
  stand.erfahrung[bekommt] = Math.max(0, Number.isFinite(erfahrung) ? erfahrung : 0);
  delete stand.erschoepftBis[gibt];
  delete stand.erschoepftBis[bekommt];
}

// Wer aus dem Kampfteam in einen Kampf zu zweit mitkommt: alle, die bereit
// sind (erholtSichNoch sagt, wie lange eines sich noch erholt), höchstens
// hoechstens viele. Zurück kommt eine Liste aus { kurzname, level }.
export function teamFuerZuZweit(stand, erholtSichNoch, hoechstens) {
  return stand.kampfteam
    .filter((kurzname) => erholtSichNoch(kurzname) === 0)
    .slice(0, hoechstens)
    .map((kurzname) => ({ kurzname, level: levelAusErfahrung(stand.erfahrung[kurzname] ?? 0) }));
}
