// Prüft die Dateien im Ordner daten auf Tippfehler und erklärt sie auf Deutsch.
// Das Spiel zeigt diese Hinweise auf dem Bildschirm, statt einfach kaputtzugehen.

import { ATTACKEN } from './attacken.js';
import { CHARAKTERE } from './charaktere.js';
import { ELEMENTE } from './elemente.js';
import { GESCHICHTE } from './geschichte.js';
import { KALAMPRIOS } from './kalamprios.js';
import { HOEHEN, KLAENGE, STIMMEN } from './klaenge.js';
import { ORTE, START_ORT } from './orte.js';
import { REGELN } from './regeln.js';

const ZAHLEN = ['kp', 'angriff', 'verteidigung', 'tempo'];
const BLICKE = ['vorne', 'links', 'rechts'];
const STILE = ['dorf', 'wald', 'mine', 'see'];
const SEITEN = ['links', 'rechts', 'oben', 'unten'];
// Wie Attacken außer den Elementen noch aussehen können (siehe attacken.js).
const AUSSEHEN = ['herz', 'strahl', 'traum', 'krallen', 'blitzschlag', 'biss', 'wirbel', 'faden', 'bombe', 'hieb', 'krone'];
const RAETSEL_ARTEN = ['suchen', 'reihenfolge', 'frage'];
// Die Farben aus szenen/raetsel.js
const RAETSEL_FARBEN = ['rot', 'gelb', 'blau', 'gruen', 'lila', 'weiss'];

export function datenPruefen() {
  const fehler = [];

  for (const [kurzname, attacke] of Object.entries(ATTACKEN)) {
    if (!(attacke.staerke > 0)) {
      fehler.push(`Attacke "${kurzname}": staerke muss eine Zahl größer als 0 sein.`);
    }
    if (!Number.isInteger(attacke.pause) || attacke.pause < 0) {
      fehler.push(`Attacke "${kurzname}": pause muss 0 oder eine ganze Zahl sein.`);
    }
    if (attacke.effekt !== undefined && !ELEMENTE[attacke.effekt] && !AUSSEHEN.includes(attacke.effekt)) {
      fehler.push(`Attacke "${kurzname}": Den effekt "${attacke.effekt}" gibt es nicht. Nimm einen Kurznamen aus elemente.js oder einen von oben aus attacken.js.`);
    }
  }

  for (const tier of Object.values(KALAMPRIOS)) {
    if (!ELEMENTE[tier.element]) {
      fehler.push(`${tier.name}: Das Element "${tier.element}" steht nicht in elemente.js.`);
    }
    if (!BLICKE.includes(tier.blick)) {
      fehler.push(`${tier.name}: blick muss 'vorne', 'links' oder 'rechts' sein.`);
    }
    for (const wert of ZAHLEN) {
      if (!(tier[wert] > 0)) {
        fehler.push(`${tier.name}: ${wert} muss eine Zahl größer als 0 sein.`);
      }
    }

    const attacken = tier.attacken ?? [];
    const unbekannt = attacken.filter((attacke) => !ATTACKEN[attacke]);
    for (const attacke of unbekannt) {
      fehler.push(`${tier.name}: Die Attacke "${attacke}" steht nicht in attacken.js.`);
    }
    if (unbekannt.length === 0 && !attacken.some((attacke) => ATTACKEN[attacke].pause === 0)) {
      fehler.push(`${tier.name} braucht mindestens eine Attacke mit pause: 0.`);
    }
  }

  if (Object.keys(KALAMPRIOS).length < 2) {
    fehler.push('Für einen Kampf braucht es mindestens zwei Kalamprios in kalamprios.js.');
  }
  if (Object.keys(CHARAKTERE).length < 2) {
    fehler.push('Es braucht mindestens zwei Figuren in charaktere.js: eine zum Spielen und eine Rivalin.');
  }

  for (const name of ['fangChanceGesund', 'fangChanceSchwach']) {
    if (!(REGELN[name] >= 0 && REGELN[name] <= 1)) {
      fehler.push(`regeln.js: ${name} muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.5.`);
    }
  }
  if (!(Number.isInteger(REGELN.fangkristalleAmAnfang) && REGELN.fangkristalleAmAnfang >= 0)) {
    fehler.push('regeln.js: fangkristalleAmAnfang muss 0 oder eine ganze Zahl sein.');
  }

  const stufen = REGELN.erfahrungFuerLevel;
  const aufsteigend = Array.isArray(stufen) && stufen.every((noetig, nummer) => Number.isInteger(noetig) && (nummer === 0 ? noetig === 0 : noetig > stufen[nummer - 1]));
  if (!aufsteigend || stufen.length === 0) {
    fehler.push('regeln.js: erfahrungFuerLevel muss mit 0 anfangen und dann immer größer werden, zum Beispiel [0, 5, 15].');
  }
  if (!(REGELN.staerkerProLevel >= 0 && REGELN.staerkerProLevel <= 1)) {
    fehler.push('regeln.js: staerkerProLevel muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.1.');
  }

  for (const name of ['danebenChance', 'ausweichChance', 'abwehrChance', 'abgewehrtSchaden']) {
    if (!(REGELN[name] >= 0 && REGELN[name] <= 1)) {
      fehler.push(`regeln.js: ${name} muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.1.`);
    }
  }
  if (REGELN.danebenChance + REGELN.ausweichChance * 2 + REGELN.abwehrChance > 0.9) {
    fehler.push('regeln.js: danebenChance, ausweichChance und abwehrChance sind zusammen zu groß. Dann trifft fast nie eine Attacke.');
  }

  for (const name of ['schadenZufall', 'tempoZufall']) {
    if (!(REGELN[name] >= 0 && REGELN[name] < 1)) {
      fehler.push(`regeln.js: ${name} muss eine Zahl von 0 bis knapp unter 1 sein, zum Beispiel 0.3.`);
    }
  }

  if (Object.values(KALAMPRIOS).filter((tier) => tier.zumStart).length < 2) {
    fehler.push('Es braucht mindestens zwei Kalamprios mit zumStart: true: eins für dich und eins für die Rivalin.');
  }

  if (!ORTE[START_ORT]?.start) {
    fehler.push(`orte.js: Der Startort "${START_ORT}" braucht einen start-Punkt.`);
  }
  if (!Object.values(ORTE).some((ort) => ort.rivalin)) {
    fehler.push('Irgendein Ort braucht einen rivalin-Punkt, damit die Rivalin wartet.');
  }
  for (const [kurzname, ort] of Object.entries(ORTE)) fehler.push(...ortPruefen(kurzname, ort));

  if (!(GESCHICHTE.anfang?.length > 0)) {
    fehler.push('geschichte.js: Bei anfang braucht es mindestens einen Satz.');
  }
  if (!(GESCHICHTE.ende?.length > 0)) {
    fehler.push('geschichte.js: Bei ende braucht es mindestens einen Satz.');
  }
  if (!(Number.isInteger(REGELN.imKampfHoechstens) && REGELN.imKampfHoechstens >= 1)) {
    fehler.push('regeln.js: imKampfHoechstens muss eine ganze Zahl ab 1 sein, zum Beispiel 3.');
  } else if (REGELN.teamFuerGeheimes > REGELN.imKampfHoechstens) {
    fehler.push('regeln.js: teamFuerGeheimes darf nicht größer sein als imKampfHoechstens, sonst kann man das geheime Kalamprio nie besiegen.');
  }
  if (!(Number.isInteger(REGELN.teamFuerRivalin) && REGELN.teamFuerRivalin >= 1 && REGELN.teamFuerRivalin <= REGELN.imKampfHoechstens)) {
    fehler.push('regeln.js: teamFuerRivalin muss eine ganze Zahl ab 1 sein und darf nicht größer sein als imKampfHoechstens.');
  }
  if (!(Number.isInteger(REGELN.teamFuerGeheimes) && REGELN.teamFuerGeheimes >= 1)) {
    fehler.push('regeln.js: teamFuerGeheimes muss eine ganze Zahl ab 1 sein, zum Beispiel 3.');
  }
  for (const [kurzname, saetze] of Object.entries(GESCHICHTE.orte ?? {})) {
    if (!ORTE[kurzname]) {
      fehler.push(`geschichte.js: Den Ort "${kurzname}" gibt es nicht in orte.js.`);
    } else if (!ORTE[kurzname].dunklerKristall) {
      fehler.push(`${ORTE[kurzname].name} braucht einen dunklerKristall, der die Geschichte erzählt.`);
    } else if (!(saetze.length > 0)) {
      fehler.push(`geschichte.js: Bei ${kurzname} braucht es mindestens einen Satz.`);
    }
  }
  fehler.push(...klaengePruefen());
  return fehler;
}

function klaengePruefen() {
  const fehler = [];
  for (const name of ['musik', 'geraeusche']) {
    if (!(KLAENGE[name] >= 0 && KLAENGE[name] <= 1)) {
      fehler.push(`klaenge.js: ${name} muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.5.`);
    }
  }
  if (!(KLAENGE.hoerweite > 0)) {
    fehler.push('klaenge.js: hoerweite muss eine Zahl größer als 0 sein, zum Beispiel 650.');
  }
  for (const [kurzname, ruf] of Object.entries(KLAENGE.rufe ?? {})) {
    if (!KALAMPRIOS[kurzname]) {
      fehler.push(`klaenge.js: Das Kalamprio "${kurzname}" steht nicht in kalamprios.js.`);
      continue;
    }
    const name = KALAMPRIOS[kurzname].name;
    if (!STIMMEN.includes(ruf.stimme)) {
      fehler.push(`klaenge.js: Die stimme "${ruf.stimme}" bei ${name} gibt es nicht. Oben in klaenge.js steht, welche es gibt.`);
    }
    if (!(ruf.hoehe in HOEHEN)) {
      fehler.push(`klaenge.js: hoehe bei ${name} muss 'tief', 'mittel', 'hoch' oder 'ganz hoch' sein.`);
    }
    if (!(Number.isInteger(ruf.silben) && ruf.silben >= 1 && ruf.silben <= 6)) {
      fehler.push(`klaenge.js: silben bei ${name} muss eine ganze Zahl von 1 bis 6 sein.`);
    }
  }
  return fehler;
}

function ortPruefen(kurzname, ort) {
  const fehler = [];
  const liste = (feld) => ort[feld] ?? [];
  const name = ort.name ?? kurzname;
  if (!STILE.includes(ort.stil)) {
    fehler.push(`${name}: stil muss 'dorf', 'wald', 'mine' oder 'see' sein.`);
  }

  const geheimes = ort.geheimesImGras;
  const tiere = [
    ...ort.wildeKalamprios.map((wild) => wild.art),
    ...ort.tiereImGras,
    ...(geheimes ? [geheimes.art] : []),
  ];
  for (const art of new Set(tiere)) {
    if (!KALAMPRIOS[art]) {
      fehler.push(`${name}: Das Kalamprio "${art}" steht nicht in kalamprios.js.`);
    }
  }
  if (ort.hohesGras.length > 0 && ort.tiereImGras.length === 0) {
    fehler.push(`${name}: Im hohen Gras wohnt niemand. Trag Tiere bei tiereImGras ein.`);
  }
  const hoechstes = REGELN.erfahrungFuerLevel?.length ?? 1;
  if (ort.wildesLevel !== undefined && !(Number.isInteger(ort.wildesLevel) && ort.wildesLevel >= 1 && ort.wildesLevel <= hoechstes)) {
    fehler.push(`${name}: wildesLevel muss eine ganze Zahl von 1 bis ${hoechstes} sein.`);
  }
  if (geheimes?.spaetestensNach !== undefined && !(Number.isInteger(geheimes.spaetestensNach) && geheimes.spaetestensNach >= 0)) {
    fehler.push(`${name}: spaetestensNach beim geheimen Kalamprio muss 0 oder eine ganze Zahl sein, zum Beispiel 3.`);
  }
  if (ort.dunkel !== undefined && !(ort.dunkel >= 0 && ort.dunkel <= 1)) {
    fehler.push(`${name}: dunkel muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.8.`);
  }
  if (ort.licht !== undefined && !(ort.licht > 0)) {
    fehler.push(`${name}: licht muss eine Zahl größer als 0 sein, zum Beispiel 0.7.`);
  }
  for (const see of liste('seen')) {
    if (see.bild !== undefined && see.bild !== 'mondsee') {
      fehler.push(`${name}: Ein See-Bild "${see.bild}" gibt es nicht. Nimm 'mondsee' oder lass bild weg.`);
    }
  }
  if (geheimes && !(geheimes.chance >= 0 && geheimes.chance <= 1)) {
    fehler.push(`${name}: Die chance beim geheimen Kalamprio muss von 0 bis 1 gehen, zum Beispiel 0.04.`);
  }

  for (const ausgang of ort.ausgaenge ?? []) {
    const ziel = ORTE[ausgang.nach];
    if (!ziel) {
      fehler.push(`${name}: Der Ausgang führt nach "${ausgang.nach}", aber diesen Ort gibt es nicht in orte.js.`);
      continue;
    }
    if (!SEITEN.includes(ausgang.seite)) {
      fehler.push(`${name}: Beim Ausgang nach ${ziel.name} muss seite 'links', 'rechts', 'oben' oder 'unten' sein.`);
    }
    const laenge = ausgang.seite === 'links' || ausgang.seite === 'rechts' ? ort.hoehe : ort.breite;
    if (!(ausgang.mitte >= 0 && ausgang.mitte <= laenge)) {
      fehler.push(`${name}: Beim Ausgang nach ${ziel.name} liegt mitte außerhalb des Ortes.`);
    }
    if (ausgang.erstNachRivalin && !ort.rivalin) {
      fehler.push(`${name}: Den Ausgang nach ${ziel.name} soll die Rivalin bewachen, aber hier gibt es keinen rivalin-Punkt.`);
    }
    if (ausgang.erstNachRaetsel && !ort.raetsel) {
      fehler.push(`${name}: Der Ausgang nach ${ziel.name} soll erst nach dem Rätsel frei werden, aber hier gibt es kein Rätsel.`);
    }
    if (!(ziel.ausgaenge ?? []).some((zurueck) => zurueck.nach === kurzname)) {
      fehler.push(`${ziel.name} braucht einen Ausgang zurück nach "${kurzname}".`);
    }
  }

  const punkte = [
    ['start', ort.start],
    ['rivalin', ort.rivalin],
    ['rivalinNachSieg', ort.rivalinNachSieg],
    ['dunklerKristall', ort.dunklerKristall],
    ...ort.wildeKalamprios.map((wild) => [`das wilde Kalamprio "${wild.art}"`, wild]),
    ...liste('baeume').map((punkt) => ['ein Baum', punkt]),
    ...liste('kristalle').map((punkt) => ['ein Kristall', punkt]),
    ...liste('felsen').map((punkt) => ['ein Felsen', punkt]),
    ...liste('prismastahl').map((punkt) => ['ein Prismastahl', punkt]),
    ...liste('haeuser').map((punkt) => ['ein Haus', punkt]),
    ...liste('gold').map((punkt) => ['ein Gold', punkt]),
    ...liste('fangkristalle').map((punkt) => ['ein Fangkristall', punkt]),
    ...liste('seen').map((punkt) => ['ein See', punkt]),
    ...(ort.raetsel ? [['der Rätselstein', ort.raetsel]] : []),
    ...(ort.raetsel?.dinge ?? []).map((punkt) => ['ein Ding beim Rätsel', punkt]),
    ...(ort.raetsel?.steine ?? []).map((punkt) => ['ein Klangstein beim Rätsel', punkt]),
  ].filter(([, punkt]) => punkt);
  if (ort.raetsel) fehler.push(...raetselPruefen(name, ort.raetsel));

  for (const [was, punkt] of punkte) {
    const drin = punkt.x >= 0 && punkt.x <= ort.breite && punkt.y >= 0 && punkt.y <= ort.hoehe;
    if (!drin) {
      fehler.push(`${name}: ${was} liegt bei x ${punkt.x}, y ${punkt.y} und damit außerhalb des Ortes.`);
    }
  }
  return fehler;
}

function raetselPruefen(name, raetsel) {
  const fehler = [];
  const satzListe = (saetze) => Array.isArray(saetze) && saetze.length > 0 && saetze.every((satz) => typeof satz === 'string');
  if (!RAETSEL_ARTEN.includes(raetsel.art)) {
    fehler.push(`${name}: Beim Rätsel muss art 'suchen', 'reihenfolge' oder 'frage' sein.`);
  }
  if (!satzListe(raetsel.aufgabe)) {
    fehler.push(`${name}: Beim Rätsel braucht aufgabe mindestens einen Satz in Anführungszeichen.`);
  }
  if (typeof raetsel.geschafft !== 'string') {
    fehler.push(`${name}: Beim Rätsel braucht geschafft einen Satz in Anführungszeichen.`);
  }
  const kristalle = raetsel.belohnung?.fangkristalle;
  if (kristalle !== undefined && !(Number.isInteger(kristalle) && kristalle >= 0)) {
    fehler.push(`${name}: Bei der Belohnung vom Rätsel muss fangkristalle 0 oder eine ganze Zahl sein.`);
  }

  if (raetsel.art === 'suchen') {
    if (!(raetsel.dinge?.length > 0)) fehler.push(`${name}: Beim Such-Rätsel braucht es mindestens ein Ding bei dinge.`);
    if (raetsel.farbe !== undefined && !RAETSEL_FARBEN.includes(raetsel.farbe)) {
      fehler.push(`${name}: Die Farbe "${raetsel.farbe}" beim Rätsel gibt es nicht. Nimm ${RAETSEL_FARBEN.join(', ')}.`);
    }
  }
  if (raetsel.art === 'reihenfolge') {
    if (!(raetsel.steine?.length >= 2)) fehler.push(`${name}: Beim Reihenfolge-Rätsel braucht es mindestens zwei Klangsteine bei steine.`);
    const runden = raetsel.runden ?? [raetsel.steine?.length ?? 0];
    if (!(Array.isArray(runden) && runden.length > 0 && runden.every((anzahl) => Number.isInteger(anzahl) && anzahl >= 1))) {
      fehler.push(`${name}: Beim Reihenfolge-Rätsel muss runden eine Liste mit ganzen Zahlen sein, zum Beispiel [3, 4, 5].`);
    }
    for (const stein of raetsel.steine ?? []) {
      if (!RAETSEL_FARBEN.includes(stein.farbe)) {
        fehler.push(`${name}: Die Farbe "${stein.farbe}" bei einem Klangstein gibt es nicht. Nimm ${RAETSEL_FARBEN.join(', ')}.`);
      }
    }
  }
  if (raetsel.art === 'frage') {
    if (!(raetsel.fragen?.length > 0)) fehler.push(`${name}: Beim Frage-Rätsel braucht es mindestens eine Frage bei fragen.`);
    const wieViele = raetsel.wieViele ?? raetsel.fragen?.length;
    if (!(Number.isInteger(wieViele) && wieViele >= 1 && wieViele <= (raetsel.fragen?.length ?? 0))) {
      fehler.push(`${name}: Beim Frage-Rätsel muss wieViele eine ganze Zahl ab 1 sein und darf nicht größer sein, als es Fragen gibt.`);
    }
    for (const frage of raetsel.fragen ?? []) {
      const antworten = frage.antworten ?? [];
      if (typeof frage.frage !== 'string') fehler.push(`${name}: Bei einer Rätselfrage fehlt der Satz bei frage.`);
      if (!(antworten.length >= 2 && antworten.length <= 4)) {
        fehler.push(`${name}: Die Rätselfrage „${frage.frage}“ braucht zwei bis vier antworten.`);
      } else if (!antworten.includes(frage.richtig)) {
        fehler.push(`${name}: Bei der Rätselfrage „${frage.frage}“ steht bei richtig etwas, das nicht bei antworten steht.`);
      }
    }
  }
  return fehler;
}
