// Was sich das Spiel merkt: wer man ist, welches Kalamprio man hat, wo man
// ist und was unterwegs schon passiert ist.
// Der Spielstand wird im Browser gespeichert (localStorage). Nach dem
// Neuladen kann man auf dem Startbildschirm weiterspielen.

import { BEET } from './daten/beet.js';
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
  kamera: false, // true, sobald die Rivalin einem die Kamera geschenkt hat
  fotos: {}, // Kurzname eines Kalamprios -> Kurzname des Ortes, an dem das Foto gemacht wurde
  albumVoll: false, // true, sobald alle Fotos im Album sind (die Belohnung gibt es nur einmal)

  ort: START_ORT, // Kurzname aus orte.js: wo man gerade ist
  position: null, // wo die Figur an diesem Ort zuletzt stand
  ortsnameZeigen: true, // beim Ankommen groß den Namen des Ortes zeigen

  // Zeitpunkte (in Millisekunden, wie Date.now() sie liefert):
  erschoepftBis: {}, // Kurzname -> bis dahin erholt sich dieses Kalamprio
  ruheBis: 0, // kurze Verschnaufpause nach jedem Kampf
  wildeWiederDa: {}, // Ort und Nummer des wilden Kalamprios -> ab wann es wieder da ist
  fangkristallWiederDa: {}, // Ort und Nummer des Fangkristalls -> ab wann wieder einer daliegt
  zutatWiederDa: {}, // Ort und Nummer einer Zutat draußen -> ab wann sie wieder gewachsen ist
  dropOrte: {}, // Fangkristall oder Zutat -> der Platz {x, y}, an dem sie als Nächstes liegt
  rezepteGefunden: {}, // Kurzname eines Rezepts mit fundort -> true, sobald man es gefunden hat
  gefunden: {}, // besondere Dinge (zum Beispiel das Lungenkraut) -> true, sobald man sie hat
  pflanzenFotos: {}, // Pflanze im Regenwald -> true, sobald sie fotografiert ist
  pflanzenalbum: false, // true, sobald man das Pflanzenalbum im Regenwald gefunden hat
  pflanzenalbumVoll: false, // true, sobald alle Pflanzen im Album sind (Belohnung nur einmal)
  angekommen: {}, // Ort -> true, sobald man dort einmal angekommen ist (für die ersten Sätze)
  muell: {}, // Ort und Nummer eines Müllteils unter Wasser -> true, wenn eingesammelt
  questAngefangen: {}, // Ort -> true, sobald die Aufgabe dort angefangen hat
  questFertig: {}, // Ort -> true, sobald die Aufgabe dort geschafft ist
  grasOhneGeheimes: {}, // Ort -> wie viele andere Kalamprios im Gras seit dem geheimen kamen

  geschichteGehoert: {}, // Kurzname des Ortes -> true, wenn der dunkle Kristall erzählt hat
  raetselAngefangen: {}, // Kurzname des Ortes -> true, wenn der Rätselstein die Aufgabe erklärt hat
  raetselGefunden: {}, // Kurzname des Ortes -> Nummern der Dinge, die man schon gefunden hat
  raetselRunde: {}, // Kurzname des Ortes -> so viele Runden vom Klangstein-Rätsel sind geschafft
  raetselGeloest: {}, // Kurzname des Ortes -> true, wenn das Rätsel gelöst ist
  festGefeiert: false, // true, sobald man das geheime Kalamprio besiegt und gefeiert hat
  tuerenGefunden: {}, // Ort und Nummer der Tür -> true, wenn man schon einmal hindurchgegangen ist
  schatzGeoeffnet: false, // true, sobald die Truhe in der Schatzkammer offen ist
  gekochtAm: {}, // Name des Rezepts -> wann man es zuletzt gekocht hat
  beutel: {}, // Kurzname eines Essens -> wie viele davon im Beutel sind (die Fangkristalle zählt fangkristalle)
  beet: [], // was im Beet im Lila Dorf eingesetzt ist: { art, platz, zeit } (wie es wächst, rechnet welt/beetlogik.js aus)
  hinweisGesehen: false, // der Tipp zur Steuerung wird nur einmal gezeigt
  begruesst: false, // true, sobald man im Kinderzimmer begrüßt wurde
});

export const spielstand = anfangsStand();

// Welches Level ein Kalamprio aus dem Team hat.
export function levelVon(kurzname) {
  return levelAusErfahrung(spielstand.erfahrung[kurzname] ?? 0);
}

// Gibt jedem dieser Kalamprios so viel Erfahrung. Zurück kommt ein kurzer
// Satz, wer dabei ein Level höher gekommen ist (oder '', wenn keins).
// Bei vielen Kalamprios werden sie nicht alle einzeln aufgezählt.
export function erfahrungGeben(kurznamen, menge) {
  const aufgestiegen = kurznamen.filter((kurzname) => {
    const vorher = levelVon(kurzname);
    spielstand.erfahrung[kurzname] = (spielstand.erfahrung[kurzname] ?? 0) + menge;
    return levelVon(kurzname) > vorher;
  });
  const namen = aufgestiegen.map((kurzname) => KALAMPRIOS[kurzname].name);
  if (namen.length === 0) return '';
  if (namen.length === 1) return `${namen[0]} ist jetzt Level ${levelVon(aufgestiegen[0])}!`;
  if (namen.length <= 3) return `${namen.slice(0, -1).join(', ')} und ${namen.at(-1)} sind ein Level höher!`;
  return `${namen.length} Kalamprios sind ein Level höher!`;
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
// Ein Kalamprio braucht man dafür nicht: Das schenkt einem erst die Rivalin.
function spielLaeuft() {
  return Boolean(spielstand.charakter);
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
  if (!Object.hasOwn(CHARAKTERE, alt.charakter)) return null;

  // Am Anfang hat man noch kein Kalamprio (die Rivalin schenkt es einem).
  const kalamprio = team.includes(alt.kalamprio) ? alt.kalamprio : team[0] ?? null;
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
    kampfteam: kalamprio ? [kalamprio, ...kampfteam] : [],
    erfahrung: liste(alt.erfahrung),
    fangkristalle: zahl(alt.fangkristalle, REGELN.fangkristalleAmAnfang),
    rivalinKalamprio: gibtEs(alt.rivalinKalamprio) ? alt.rivalinKalamprio : Object.keys(KALAMPRIOS).find((anderes) => KALAMPRIOS[anderes].zumStart && anderes !== kalamprio),
    rivalinBesiegt: alt.rivalinBesiegt === true,
    // Wer die Rivalin schon besiegt hat, bevor es die Kamera gab, hat sie auch.
    kamera: alt.kamera === true || alt.rivalinBesiegt === true,
    fotos: Object.fromEntries(Object.entries(liste(alt.fotos)).filter(([kurzname]) => gibtEs(kurzname))),
    albumVoll: alt.albumVoll === true,
    ort: ortPasst ? alt.ort : START_ORT,
    position: ortPasst ? position : null,
    erschoepftBis: liste(alt.erschoepftBis),
    ruheBis: zahl(alt.ruheBis, 0),
    wildeWiederDa: liste(alt.wildeWiederDa),
    fangkristallWiederDa: liste(alt.fangkristallWiederDa),
    zutatWiederDa: liste(alt.zutatWiederDa),
    rezepteGefunden: liste(alt.rezepteGefunden),
    gefunden: liste(alt.gefunden),
    pflanzenFotos: liste(alt.pflanzenFotos),
    pflanzenalbum: alt.pflanzenalbum === true,
    pflanzenalbumVoll: alt.pflanzenalbumVoll === true,
    angekommen: liste(alt.angekommen),
    muell: liste(alt.muell),
    questAngefangen: liste(alt.questAngefangen),
    questFertig: liste(alt.questFertig),
    dropOrte: Object.fromEntries(
      Object.entries(liste(alt.dropOrte)).filter(([, platz]) => Number.isFinite(platz?.x) && Number.isFinite(platz?.y)),
    ),
    grasOhneGeheimes: liste(alt.grasOhneGeheimes),
    geschichteGehoert: liste(alt.geschichteGehoert),
    raetselAngefangen: liste(alt.raetselAngefangen),
    raetselGefunden: Object.fromEntries(
      Object.entries(liste(alt.raetselGefunden))
        .filter(([, nummern]) => Array.isArray(nummern))
        .map(([ort, nummern]) => [ort, nummern.filter(Number.isInteger)]),
    ),
    raetselRunde: liste(alt.raetselRunde),
    raetselGeloest: liste(alt.raetselGeloest),
    festGefeiert: alt.festGefeiert === true,
    tuerenGefunden: liste(alt.tuerenGefunden),
    schatzGeoeffnet: alt.schatzGeoeffnet === true,
    gekochtAm: liste(alt.gekochtAm),
    beutel: Object.fromEntries(Object.entries(liste(alt.beutel)).filter(([, anzahl]) => Number.isInteger(anzahl) && anzahl > 0)),
    beet: (Array.isArray(alt.beet) ? alt.beet : []).filter(
      (pflanze) => Object.hasOwn(BEET.samen, pflanze?.art) && Number.isInteger(pflanze.platz) && Number.isFinite(pflanze.zeit),
    ),
    hinweisGesehen: alt.hinweisGesehen === true,
    // Wer schon ein Kalamprio hat, hat das Spiel nicht im Kinderzimmer begonnen.
    begruesst: alt.begruesst === true || team.length > 0,
  };
}
