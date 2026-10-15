import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KALAMPRIOS } from '../src/daten/kalamprios.js';
import { datenPruefen } from '../src/daten/pruefen.js';
import { REGELN } from '../src/daten/regeln.js';
import {
  attackeAusfuehren,
  fangChance,
  fangen,
  gegnerWaehlt,
  istBereit,
  kaempferErstellen,
  erfahrungBisNaechstesLevel,
  erfahrungFuerSieg,
  levelAusErfahrung,
  levelFortschritt,
  rundeBeenden,
  schadenBerechnen,
  werZuerst,
} from '../src/kampf/kampflogik.js';

const immer = (wert) => () => wert;

// Ein Würfel, der nacheinander genau diese Zahlen liefert.
function folge(...werte) {
  let stelle = 0;
  return () => werte[stelle++];
}

function kaempfer(werte = {}) {
  return {
    name: 'Testtier',
    maxKp: 50,
    kp: 50,
    angriff: 10,
    verteidigung: 10,
    tempo: 10,
    attacken: [
      { kurzname: 'schwach', name: 'Schwach', staerke: 10, pause: 0, bereitIn: 0 },
      { kurzname: 'stark', name: 'Stark', staerke: 20, pause: 2, bereitIn: 0 },
    ],
    ...werte,
  };
}

test('die Daten im Spiel sind fehlerfrei', () => {
  assert.deepEqual(datenPruefen(), []);
});

test('ein neuer Kämpfer hat volle Lebenspunkte und alle Attacken bereit', () => {
  for (const kurzname of Object.keys(KALAMPRIOS)) {
    const neu = kaempferErstellen(kurzname);
    assert.equal(neu.kp, KALAMPRIOS[kurzname].kp);
    assert.ok(neu.attacken.every(istBereit));
    assert.ok(neu.attacken.every((attacke) => attacke.staerke > 0));
  }
});

test('Schaden steigt mit Angriff und sinkt mit Verteidigung', () => {
  const mitte = immer(0.5); // Schwankung genau 1,0
  const attacke = { staerke: 10 };
  assert.equal(schadenBerechnen(kaempfer(), kaempfer(), attacke, mitte), 10);
  assert.equal(schadenBerechnen(kaempfer({ angriff: 20 }), kaempfer(), attacke, mitte), 20);
  assert.equal(schadenBerechnen(kaempfer(), kaempfer({ verteidigung: 20 }), attacke, mitte), 5);
});

test('Schaden schwankt so stark, wie schadenZufall sagt, und ist mindestens 1', () => {
  const attacke = { staerke: 100 };
  const z = REGELN.schadenZufall;
  assert.equal(schadenBerechnen(kaempfer(), kaempfer(), attacke, immer(0)), Math.round(100 * (1 - z)));
  assert.equal(schadenBerechnen(kaempfer(), kaempfer(), attacke, immer(1)), Math.round(100 * (1 + z)));
  assert.equal(schadenBerechnen(kaempfer({ angriff: 1 }), kaempfer({ verteidigung: 99 }), { staerke: 1 }, immer(0)), 1);
});

test('Lebenspunkte fallen nie unter 0', () => {
  const angreifer = kaempfer({ angriff: 99 });
  const ziel = kaempfer({ kp: 5 });
  const schaden = attackeAusfuehren(angreifer, ziel, angreifer.attacken[1], immer(0.5));
  assert.equal(schaden, 5);
  assert.equal(ziel.kp, 0);
});

test('eine Attacke mit pause 2 setzt genau zwei Runden aus', () => {
  const angreifer = kaempfer();
  const ziel = kaempfer({ kp: 999, maxKp: 999 });
  const [schwach, stark] = angreifer.attacken;

  attackeAusfuehren(angreifer, ziel, stark, immer(0.5)); // Runde 1
  rundeBeenden([angreifer, ziel]);
  assert.equal(istBereit(stark), false); // Runde 2: Pause
  assert.equal(stark.bereitIn, 2);

  attackeAusfuehren(angreifer, ziel, schwach, immer(0.5));
  rundeBeenden([angreifer, ziel]);
  assert.equal(istBereit(stark), false); // Runde 3: Pause
  assert.equal(istBereit(schwach), true); // ohne Pause geht jede Runde

  attackeAusfuehren(angreifer, ziel, schwach, immer(0.5));
  rundeBeenden([angreifer, ziel]);
  assert.equal(istBereit(stark), true); // Runde 4: wieder bereit
});

test('würfeln beide gleich, ist das schnellere Kalamprio zuerst dran', () => {
  const schnell = kaempfer({ tempo: 14 });
  const langsam = kaempfer({ tempo: 12 });
  for (const wurf of [0, 0.5, 1]) {
    assert.deepEqual(werZuerst(langsam, schnell, immer(wurf)), [schnell, langsam]);
    assert.deepEqual(werZuerst(schnell, langsam, immer(wurf)), [schnell, langsam]);
  }
});

test('mit Glück ist auch das langsamere Kalamprio zuerst dran', () => {
  const schnell = kaempfer({ tempo: 14 });
  const langsam = kaempfer({ tempo: 12 });
  // Das langsame würfelt hoch (1), das schnelle niedrig (0).
  assert.deepEqual(werZuerst(langsam, schnell, folge(1, 0)), [langsam, schnell]);
  assert.deepEqual(werZuerst(schnell, langsam, folge(0, 1)), [langsam, schnell]);

  let langsamZuerst = 0;
  for (let i = 0; i < 4000; i += 1) {
    if (werZuerst(langsam, schnell)[0] === langsam) langsamZuerst += 1;
  }
  assert.ok(langsamZuerst > 400 && langsamZuerst < 2000, `${langsamZuerst} von 4000`);
});

test('bei genau gleichem Tempo entscheidet eine Münze', () => {
  const a = kaempfer();
  const b = kaempfer();
  assert.deepEqual(werZuerst(a, b, folge(0.5, 0.5, 0.1)), [a, b]);
  assert.deepEqual(werZuerst(a, b, folge(0.5, 0.5, 0.9)), [b, a]);
});

test('der Computer wählt nur Attacken, die bereit sind', () => {
  const gegner = kaempfer();
  const [schwach, stark] = gegner.attacken;
  assert.equal(gegnerWaehlt(gegner, immer(0.1)), stark);

  stark.bereitIn = 2;
  for (const wurf of [0, 0.5, 0.69, 0.7, 0.99]) {
    assert.equal(gegnerWaehlt(gegner, immer(wurf)), schwach);
  }
});

test('ein gesundes Kalamprio ist schwer zu fangen, ein schwaches leicht', () => {
  const tier = kaempferErstellen('bolo');
  assert.equal(fangChance(tier), REGELN.fangChanceGesund);
  tier.kp = 0;
  assert.ok(Math.abs(fangChance(tier) - REGELN.fangChanceSchwach) < 1e-9);
  tier.kp = tier.maxKp / 2;
  assert.ok(fangChance(tier) > REGELN.fangChanceGesund && fangChance(tier) < REGELN.fangChanceSchwach);
});

test('das geheime Kalamprio ist doppelt so schwer zu fangen', () => {
  const geheim = kaempferErstellen('geheimnis');
  assert.equal(fangChance(geheim), REGELN.fangChanceGesund / 2);
});

test('fangen klappt, wenn der Würfel unter der Chance liegt', () => {
  const tier = kaempferErstellen('mola');
  assert.equal(fangen(tier, () => 0), true);
  assert.equal(fangen(tier, () => 0.99), false);
});

test('mit mehr Erfahrung steigt das Level, aber nie über das höchste', () => {
  const stufen = REGELN.erfahrungFuerLevel;
  assert.equal(levelAusErfahrung(0), 1);
  assert.equal(levelAusErfahrung(stufen[1] - 1), 1);
  assert.equal(levelAusErfahrung(stufen[1]), 2);
  assert.equal(levelAusErfahrung(1000), stufen.length);
  assert.equal(erfahrungBisNaechstesLevel(0), stufen[1]);
  assert.equal(erfahrungBisNaechstesLevel(1000), null);
  assert.equal(levelFortschritt(0), 0);
  assert.equal(levelFortschritt(stufen[1]), 0);
  assert.equal(levelFortschritt(1000), 1);
});

test('ein stärkerer Gegner bringt mehr Erfahrung', () => {
  assert.equal(erfahrungFuerSieg(kaempferErstellen('bolo', 1)), 1);
  assert.equal(erfahrungFuerSieg(kaempferErstellen('bolo', 3)), 3);
});

test('mit jedem Level wird ein Kalamprio nur ein bisschen stärker', () => {
  const eins = kaempferErstellen('kalampria', 1);
  const drei = kaempferErstellen('kalampria', 3);
  assert.equal(eins.maxKp, KALAMPRIOS.kalampria.kp);
  assert.ok(drei.maxKp > eins.maxKp && drei.angriff > eins.angriff);
  assert.ok(drei.maxKp <= eins.maxKp * (1 + 2 * REGELN.staerkerProLevel) + 1);
  assert.equal(kaempferErstellen('kalampria', 9).level, REGELN.erfahrungFuerLevel.length);
});
