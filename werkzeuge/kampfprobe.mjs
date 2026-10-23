// Spielt viele Kämpfe gegen wilde Kalamprios durch und zeigt, wie oft man
// gewinnt: mit 1, 2 oder 3 eigenen Kalamprios, auf Level 1, 2 oder 3.
// So sieht man, ob staerkeJeLevel in regeln.js passt.
//
// Starten im Terminal:  npm run kampfprobe
// Andere Zahlen ausprobieren, ohne regeln.js zu ändern:
//                       npm run kampfprobe -- "[1, 1.1, 1.6]"
//
// Die eigenen Kalamprios nehmen immer die stärkste Attacke, die bereit ist.
// Gegner sind die wilden Kalamprios vom Mondsee. Am Ende kommt noch das
// geheime Kalamprio (der Endgegner) mit seinem Level aus regeln.js.

import { KALAMPRIOS } from '../src/daten/kalamprios.js';
import { MONDSEE } from '../src/daten/orte/mondsee.js';
import { REGELN } from '../src/daten/regeln.js';
import { angreifen, gegnerWaehlt, istBereit, kaempferErstellen, rundeBeenden, werZuerst } from '../src/kampf/kampflogik.js';

if (process.argv[2]) REGELN.staerkeJeLevel = JSON.parse(process.argv[2]);
const KAEMPFE = 4000;
const tiere = Object.keys(KALAMPRIOS).filter((kurzname) => !KALAMPRIOS[kurzname].geheim);
const wilde = MONDSEE.wildeKalamprios.map((wild) => wild.art);
const irgendeins = (liste) => liste[Math.floor(Math.random() * liste.length)];

// So viele Angriffe gab es bisher, für den Durchschnitt
let angriffe = 0;

// Ein Kampf. true heißt gewonnen.
function kaempfen(anzahl, level, gegnerLevel, gegnerArt = null) {
  const team = Array.from({ length: anzahl }, () => kaempferErstellen(irgendeins(tiere), level));
  const gegner = kaempferErstellen(gegnerArt ?? irgendeins(wilde), gegnerLevel);
  let dran = 0;
  for (let runde = 0; runde < 200; runde += 1) {
    const ich = team[dran];
    const meine = ich.attacken.filter(istBereit).reduce((a, b) => (b.staerke > a.staerke ? b : a));
    const seine = gegnerWaehlt(gegner);
    for (const wer of werZuerst(ich, gegner)) {
      angriffe += 1;
      if (wer === ich) angreifen(ich, gegner, meine);
      else angreifen(gegner, ich, seine);
      if (gegner.kp <= 0) return true;
      if (ich.kp <= 0) {
        dran += 1;
        if (dran >= team.length) return false;
        break;
      }
    }
    rundeBeenden([...team, gegner]);
  }
  return false;
}

console.log(`staerkeJeLevel: ${JSON.stringify(REGELN.staerkeJeLevel)}`);
console.log(`schadenMal: ${REGELN.schadenMal}`);
console.log('So oft gewinnt man (von 100 Kämpfen), mit 1, 2 oder 3 Kalamprios:\n');
for (const gegnerLevel of [2, 3]) {
  for (let level = 1; level <= gegnerLevel; level += 1) {
    angriffe = 0;
    const spalten = [1, 2, 3].map((anzahl) => {
      let siege = 0;
      for (let i = 0; i < KAEMPFE; i += 1) if (kaempfen(anzahl, level, gegnerLevel)) siege += 1;
      return `${anzahl}: ${String(Math.round((siege / KAEMPFE) * 100)).padStart(3)}`;
    });
    const dauer = Math.round(angriffe / (KAEMPFE * 3));
    console.log(`Wildes Level ${gegnerLevel}, eigene Level ${level}:   ${spalten.join('    ')}    (ein Kampf: ${dauer} Angriffe)`);
  }
}

const geheimes = Object.keys(KALAMPRIOS).find((kurzname) => KALAMPRIOS[kurzname].geheim);
console.log(`\nDas geheime Kalamprio auf Level ${REGELN.geheimesLevel} (ohne Schild aus Licht gerechnet):\n`);
for (let level = 1; level <= REGELN.erfahrungFuerLevel.length; level += 1) {
  angriffe = 0;
  const spalten = [1, 2, 3].map((anzahl) => {
    let siege = 0;
    for (let i = 0; i < KAEMPFE; i += 1) if (kaempfen(anzahl, level, REGELN.geheimesLevel, geheimes)) siege += 1;
    return `${anzahl}: ${String(Math.round((siege / KAEMPFE) * 100)).padStart(3)}`;
  });
  const dauer = Math.round(angriffe / (KAEMPFE * 3));
  console.log(`Eigene Level ${level}:   ${spalten.join('    ')}    (ein Kampf: ${dauer} Angriffe)`);
}
