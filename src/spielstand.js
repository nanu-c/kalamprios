// Was sich das Spiel merkt: wer man ist, welches Kalamprio man hat, wo man
// ist und was unterwegs schon passiert ist.
// Der Spielstand wird im Browser gespeichert (localStorage). Nach dem
// Neuladen kann man auf dem Startbildschirm weiterspielen.

import { CHARAKTERE } from './daten/charaktere.js';
import { KALAMPRIOS } from './daten/kalamprios.js';
import { ORTE, START_ORT } from './daten/orte.js';
import { REGELN } from './daten/regeln.js';
import { levelAusErfahrung } from './kampf/kampflogik.js';

// Unter diesem Namen liegt der Spielstand im Browser.
const SPEICHERNAME = 'kalamprios-spielstand';

// So sieht der Spielstand am Anfang eines neuen Spiels aus.
const anfangsStand = () => ({
  charakter: null, // Kurzname aus charaktere.js
  rivalin: null, // die andere Figur
  kalamprio: null, // Kurzname aus kalamprios.js: das Kalamprio, das gerade kämpft
  team: [], // alle Kalamprios, die man hat (Kurznamen), das erste hat man gewählt
  kampfteam: [], // die aus dem Team, die mit in den Kampf kommen (höchstens REGELN.imKampfHoechstens).
  //                Das erste ist spielstand.kalamprio und kämpft zuerst.
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
  raetselAngefangen: {}, // Kurzname des Ortes -> true, wenn der Rätselstein die Aufgabe erklärt hat
  raetselGefunden: {}, // Kurzname des Ortes -> Nummern der Dinge, die man schon gefunden hat
  raetselGeloest: {}, // Kurzname des Ortes -> true, wenn das Rätsel gelöst ist
  hinweisGesehen: false, // der Tipp zur Steuerung wird nur einmal gezeigt
});

export const spielstand = anfangsStand();

// Welches Level ein Kalamprio aus dem Team hat.
export function levelVon(kurzname) {
  return levelAusErfahrung(spielstand.erfahrung[kurzname] ?? 0);
}

// Nimmt ein Kalamprio aus dem Team mit in den Kampf. Gibt false zurück,
// wenn schon so viele dabei sind, wie mitdürfen.
export function mitnehmen(kurzname) {
  if (spielstand.kampfteam.includes(kurzname)) return true;
  if (spielstand.kampfteam.length >= REGELN.imKampfHoechstens) return false;
  spielstand.kampfteam.push(kurzname);
  return true;
}

// Lässt ein Kalamprio beim nächsten Kampf weg. Eines muss immer dabei sein.
export function weglassen(kurzname) {
  if (spielstand.kampfteam.length <= 1) return false;
  spielstand.kampfteam = spielstand.kampfteam.filter((anderes) => anderes !== kurzname);
  spielstand.kalamprio = spielstand.kampfteam[0];
  return true;
}

// Stellt ein Kalamprio, das mitkommt, nach vorne: Es kämpft als erstes.
export function zuerstKaempfen(kurzname) {
  spielstand.kampfteam = [kurzname, ...spielstand.kampfteam.filter((anderes) => anderes !== kurzname)];
  spielstand.kalamprio = kurzname;
}

// Wie lange sich ein Kalamprio noch erholen muss (Millisekunden, 0 heißt: bereit).
export function erholtSichNoch(kurzname) {
  return Math.max(0, (spielstand.erschoepftBis[kurzname] ?? 0) - Date.now());
}

// ------------------------------------------------------------- Speichern

// Der Speicher des Browsers. In manchen Browsern (privates Fenster) gibt es
// ihn nicht, dann wird eben nicht gespeichert.
function browserSpeicher() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Ist schon ein Spiel im Gange? Erst dann gibt es etwas zu speichern.
function spielLaeuft() {
  return Boolean(spielstand.charakter && spielstand.kalamprio && spielstand.team.length > 0);
}

// Schreibt den Spielstand in den Browser.
export function speichern(speicher = browserSpeicher()) {
  if (!speicher || !spielLaeuft()) return;
  try {
    speicher.setItem(SPEICHERNAME, JSON.stringify(spielstand));
  } catch {
    // Speicher voll oder gesperrt: dann geht es ohne Speichern weiter.
  }
}

// Gibt es einen gespeicherten Spielstand, mit dem man weiterspielen kann?
export function gespeichertesSpiel(speicher = browserSpeicher()) {
  return gespeichertLesen(speicher) !== null;
}

// Holt den gespeicherten Spielstand zurück. Gibt false zurück, wenn es
// keinen gibt oder er nicht mehr zum Spiel passt.
export function laden(speicher = browserSpeicher()) {
  const gelesen = gespeichertLesen(speicher);
  if (!gelesen) return false;
  Object.assign(spielstand, gelesen, { ortsnameZeigen: true });
  return true;
}

// Löscht den gespeicherten Spielstand und fängt ganz von vorn an.
export function neuesSpiel(speicher = browserSpeicher()) {
  Object.assign(spielstand, anfangsStand());
  try {
    speicher?.removeItem(SPEICHERNAME);
  } catch {
    // nichts zu tun
  }
}

// Liest den gespeicherten Spielstand und prüft ihn. Seit dem Speichern kann
// sich das Spiel geändert haben (zum Beispiel ein Kalamprio umbenannt).
// Was nicht mehr passt, wird weggelassen. Passt das Wichtigste nicht mehr,
// gibt es null zurück.
function gespeichertLesen(speicher) {
  let alt;
  try {
    alt = JSON.parse(speicher?.getItem(SPEICHERNAME) ?? 'null');
  } catch {
    return null;
  }
  if (!alt || typeof alt !== 'object') return null;

  const gibtEs = (kurzname) => Object.hasOwn(KALAMPRIOS, kurzname);
  const team = Array.isArray(alt.team) ? [...new Set(alt.team.filter(gibtEs))] : [];
  if (!Object.hasOwn(CHARAKTERE, alt.charakter) || team.length === 0) return null;

  const kalamprio = team.includes(alt.kalamprio) ? alt.kalamprio : team[0];
  const kampfteam = (Array.isArray(alt.kampfteam) ? alt.kampfteam : [])
    .filter((kurzname) => team.includes(kurzname) && kurzname !== kalamprio)
    .slice(0, REGELN.imKampfHoechstens - 1);
  const ortPasst = Object.hasOwn(ORTE, alt.ort);
  const zahl = (wert, sonst) => (Number.isFinite(wert) ? wert : sonst);
  const liste = (wert) => (wert && typeof wert === 'object' && !Array.isArray(wert) ? wert : {});
  const position = alt.position && Number.isFinite(alt.position.x) && Number.isFinite(alt.position.y) ? alt.position : null;

  return {
    ...anfangsStand(),
    charakter: alt.charakter,
    rivalin: Object.hasOwn(CHARAKTERE, alt.rivalin) ? alt.rivalin : Object.keys(CHARAKTERE).find((andere) => andere !== alt.charakter),
    kalamprio,
    team,
    kampfteam: [kalamprio, ...kampfteam],
    erfahrung: liste(alt.erfahrung),
    fangkristalle: zahl(alt.fangkristalle, REGELN.fangkristalleAmAnfang),
    rivalinKalamprio: gibtEs(alt.rivalinKalamprio) ? alt.rivalinKalamprio : Object.keys(KALAMPRIOS).find((anderes) => KALAMPRIOS[anderes].zumStart && anderes !== kalamprio),
    rivalinBesiegt: alt.rivalinBesiegt === true,
    ort: ortPasst ? alt.ort : START_ORT,
    position: ortPasst ? position : null,
    erschoepftBis: liste(alt.erschoepftBis),
    ruheBis: zahl(alt.ruheBis, 0),
    wildeWiederDa: liste(alt.wildeWiederDa),
    fangkristallWiederDa: liste(alt.fangkristallWiederDa),
    grasOhneGeheimes: liste(alt.grasOhneGeheimes),
    geschichteGehoert: liste(alt.geschichteGehoert),
    raetselAngefangen: liste(alt.raetselAngefangen),
    raetselGefunden: Object.fromEntries(
      Object.entries(liste(alt.raetselGefunden))
        .filter(([, nummern]) => Array.isArray(nummern))
        .map(([ort, nummern]) => [ort, nummern.filter(Number.isInteger)]),
    ),
    raetselGeloest: liste(alt.raetselGeloest),
    hinweisGesehen: alt.hinweisGesehen === true,
  };
}
