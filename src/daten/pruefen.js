// Prüft die Dateien im Ordner daten auf Tippfehler und erklärt sie auf Deutsch.
// Das Spiel zeigt diese Hinweise auf dem Bildschirm, statt einfach kaputtzugehen.

import { ATTACKEN } from './attacken.js';
import { CHARAKTERE } from './charaktere.js';
import { ELEMENTE } from './elemente.js';
import { KALAMPRIOS } from './kalamprios.js';
import { ORTE, START_ORT } from './orte.js';
import { REGELN } from './regeln.js';

const ZAHLEN = ['kp', 'angriff', 'verteidigung', 'tempo'];
const BLICKE = ['vorne', 'links', 'rechts'];
const STILE = ['dorf', 'wald', 'mine', 'see'];
const SEITEN = ['links', 'rechts', 'oben', 'unten'];

export function datenPruefen() {
  const fehler = [];

  for (const [kurzname, attacke] of Object.entries(ATTACKEN)) {
    if (!(attacke.staerke > 0)) {
      fehler.push(`Attacke "${kurzname}": staerke muss eine Zahl größer als 0 sein.`);
    }
    if (!Number.isInteger(attacke.pause) || attacke.pause < 0) {
      fehler.push(`Attacke "${kurzname}": pause muss 0 oder eine ganze Zahl sein.`);
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
  return fehler;
}

function ortPruefen(kurzname, ort) {
  const fehler = [];
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
    if (!(ziel.ausgaenge ?? []).some((zurueck) => zurueck.nach === kurzname)) {
      fehler.push(`${ziel.name} braucht einen Ausgang zurück nach "${kurzname}".`);
    }
  }

  const liste = (feld) => ort[feld] ?? [];
  const punkte = [
    ['start', ort.start],
    ['rivalin', ort.rivalin],
    ...ort.wildeKalamprios.map((wild) => [`das wilde Kalamprio "${wild.art}"`, wild]),
    ...liste('baeume').map((punkt) => ['ein Baum', punkt]),
    ...liste('kristalle').map((punkt) => ['ein Kristall', punkt]),
    ...liste('felsen').map((punkt) => ['ein Felsen', punkt]),
    ...liste('prismastahl').map((punkt) => ['ein Prismastahl', punkt]),
    ...liste('haeuser').map((punkt) => ['ein Haus', punkt]),
    ...liste('seen').map((punkt) => ['ein See', punkt]),
  ].filter(([, punkt]) => punkt);
  for (const [was, punkt] of punkte) {
    const drin = punkt.x >= 0 && punkt.x <= ort.breite && punkt.y >= 0 && punkt.y <= ort.hoehe;
    if (!drin) {
      fehler.push(`${name}: ${was} liegt bei x ${punkt.x}, y ${punkt.y} und damit außerhalb des Ortes.`);
    }
  }
  return fehler;
}
