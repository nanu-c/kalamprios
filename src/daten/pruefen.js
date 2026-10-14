// Prüft die Dateien im Ordner daten auf Tippfehler und erklärt sie auf Deutsch.
// Das Spiel zeigt diese Hinweise auf dem Bildschirm, statt einfach kaputtzugehen.

import { ATTACKEN } from './attacken.js';
import { CHARAKTERE } from './charaktere.js';
import { ELEMENTE } from './elemente.js';
import { KALAMPRIOS } from './kalamprios.js';
import { KRISTALLWALD } from './kristallwald.js';
import { REGELN } from './regeln.js';

const ZAHLEN = ['kp', 'angriff', 'verteidigung', 'tempo'];
const BLICKE = ['vorne', 'links', 'rechts'];

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

  fehler.push(...waldPruefen(KRISTALLWALD));
  return fehler;
}

function waldPruefen(wald) {
  const fehler = [];
  const tiere = [...wald.wildeKalamprios.map((wild) => wild.art), ...wald.tiereImGras];
  for (const art of new Set(tiere)) {
    if (!KALAMPRIOS[art]) {
      fehler.push(`${wald.name}: Das Kalamprio "${art}" steht nicht in kalamprios.js.`);
    }
  }
  if (wald.hohesGras.length > 0 && wald.tiereImGras.length === 0) {
    fehler.push(`${wald.name}: Im hohen Gras wohnt niemand. Trag Tiere bei tiereImGras ein.`);
  }

  const punkte = [
    ['start', wald.start],
    ['rivalin', wald.rivalin],
    ...wald.wildeKalamprios.map((wild) => [`das wilde Kalamprio "${wild.art}"`, wild]),
    ...wald.baeume.map((baum) => ['ein Baum', baum]),
    ...wald.kristalle.map((kristall) => ['ein Kristall', kristall]),
  ];
  for (const [name, punkt] of punkte) {
    const drin = punkt.x >= 0 && punkt.x <= wald.breite && punkt.y >= 0 && punkt.y <= wald.hoehe;
    if (!drin) {
      fehler.push(`${wald.name}: ${name} liegt bei x ${punkt.x}, y ${punkt.y} und damit außerhalb der Welt.`);
    }
  }
  return fehler;
}
