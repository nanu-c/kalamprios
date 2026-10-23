import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  aktiver,
  ereignisAnwenden,
  istRaus,
  kampfErstellen,
  rundeAusrechnen,
  sieger,
  werWaehlt,
} from '../src/kampf/zusammenkampf.js';

// Ein Würfel, der immer dieselben Zahlen würfelt (damit Tests gleich ausgehen).
function wuerfel(startwert) {
  let zustand = startwert;
  return () => {
    zustand = (zustand * 16807) % 2147483647;
    return zustand / 2147483647;
  };
}

// Wählt für jeden Platz die erste Attacke, die bereit ist.
function ersteAttacke(kampf) {
  return Object.fromEntries(
    werWaehlt(kampf).map((nummer) => {
      const kaempfer = aktiver(kampf.plaetze[nummer]);
      return [nummer, { art: 'attacke', nummer: kaempfer.attacken.findIndex((attacke) => attacke.bereitIn === 0) }];
    }),
  );
}

// Spielt einen Kampf bis zum Ende. Gerät a rechnet, Gerät b bekommt nur die
// Ereignisse. Am Ende müssen beide denselben Kampf haben.
function durchspielen(kampf, zufall) {
  const geraetA = structuredClone(kampf);
  const geraetB = structuredClone(kampf);
  for (let runde = 0; runde < 200 && !geraetA.ende; runde += 1) {
    const ereignisse = rundeAusrechnen(geraetA, ersteAttacke(geraetA), zufall);
    for (const ereignis of structuredClone(ereignisse)) ereignisAnwenden(geraetA, ereignis);
    for (const ereignis of JSON.parse(JSON.stringify(ereignisse))) ereignisAnwenden(geraetB, ereignis);
  }
  return { geraetA, geraetB };
}

const duell = () =>
  kampfErstellen({
    art: 'duell',
    teamA: [{ kurzname: 'kalampria', level: 2 }, { kurzname: 'bolo', level: 1 }],
    teamB: [{ kurzname: 'bisakatze', level: 2 }, { kurzname: 'qalutu', level: 1 }],
  });

const zusammen = (wildStaerker = 1.6) =>
  kampfErstellen({
    art: 'zusammen',
    teamA: [{ kurzname: 'kalampria', level: 2 }],
    teamB: [{ kurzname: 'bisakatze', level: 2 }],
    gegner: { kurzname: 'tschank', level: 2 },
    wildStaerker,
  });

test('Beim Duell steht jede auf ihrer Seite', () => {
  const kampf = duell();
  assert.deepEqual(kampf.plaetze.map((platz) => platz.seite), ['links', 'rechts']);
  assert.deepEqual(werWaehlt(kampf), [0, 1]);
});

test('Zu zweit gegen ein wildes Kalamprio: Es hat mehr Lebenspunkte', () => {
  const allein = zusammen(1).plaetze[2].team[0];
  const staerker = zusammen(1.6).plaetze[2].team[0];
  assert.equal(staerker.maxKp, Math.round(allein.maxKp * 1.6));
  assert.equal(staerker.kp, staerker.maxKp);
  assert.deepEqual(zusammen().plaetze.map((platz) => platz.seite), ['links', 'links', 'rechts']);
  // Das wilde Kalamprio wählt selbst.
  assert.deepEqual(werWaehlt(zusammen()), [0, 1]);
});

test('Beide Geräte haben nach einem ganzen Duell genau denselben Kampf', () => {
  for (const start of [1, 7, 42, 99]) {
    const { geraetA, geraetB } = durchspielen(duell(), wuerfel(start));
    assert.ok(geraetA.ende, 'der Kampf geht zu Ende');
    assert.deepEqual(geraetB, geraetA);
    assert.equal(sieger(geraetA), geraetA.ende.sieger);
  }
});

test('Zu zweit gegen ein wildes Kalamprio geht der Kampf auch zu Ende', () => {
  for (const start of [3, 5, 8]) {
    const { geraetA, geraetB } = durchspielen(zusammen(), wuerfel(start));
    assert.ok(geraetA.ende);
    assert.deepEqual(geraetB, geraetA);
  }
});

test('Rundeausrechnen verändert den Kampf selbst nicht', () => {
  const kampf = duell();
  const vorher = structuredClone(kampf);
  rundeAusrechnen(kampf, ersteAttacke(kampf), wuerfel(11));
  assert.deepEqual(kampf, vorher);
});

test('Wer umfällt, wird vom Nächsten aus dem Team abgelöst', () => {
  const kampf = duell();
  kampf.plaetze[1].team[0].kp = 1;
  kampf.plaetze[1].team[0].verteidigung = 1;
  kampf.plaetze[1].team[0].tempo = 1;
  // Der Würfel trifft immer, und Gerät a ist schneller und darum zuerst dran.
  const ereignisse = rundeAusrechnen(kampf, ersteAttacke(kampf), () => 0.99);
  const arten = ereignisse.map((ereignis) => ereignis.art);
  assert.deepEqual(arten.slice(0, 3), ['angriff', 'umgefallen', 'einwechseln']);
  assert.equal(ereignisse[2].zu, 1);
  // Das eingewechselte Kalamprio greift in dieser Runde nicht mehr an.
  assert.equal(arten.filter((art) => art === 'angriff').length, 1);
});

test('Tauschen kommt vor jeder Attacke', () => {
  const kampf = duell();
  const ereignisse = rundeAusrechnen(kampf, { 0: { art: 'attacke', nummer: 0 }, 1: { art: 'tauschen', zu: 1 } }, wuerfel(4));
  assert.equal(ereignisse[0].art, 'tauschen');
  const angriff = ereignisse.find((ereignis) => ereignis.art === 'angriff');
  assert.equal(angriff.von, 0);
});

test('Ein Fangkristall, der klappt, beendet den Kampf', () => {
  const kampf = zusammen();
  const ereignisse = rundeAusrechnen(kampf, { 0: { art: 'attacke', nummer: 0 }, 1: { art: 'fangen' } }, () => 0);
  assert.deepEqual(
    ereignisse.map((ereignis) => ereignis.art),
    ['fangen', 'ende'],
  );
  assert.equal(ereignisse[1].gefangenVon, 1);
  assert.equal(ereignisse[1].sieger, 'links');
});

test('Wer weg ist, wählt nicht mehr und wird nicht angegriffen', () => {
  const kampf = zusammen();
  kampf.plaetze[1].weg = true;
  assert.ok(istRaus(kampf.plaetze[1]));
  assert.deepEqual(werWaehlt(kampf), [0]);
  for (let runde = 0; runde < 5; runde += 1) {
    const ereignisse = rundeAusrechnen(kampf, ersteAttacke(kampf), wuerfel(runde + 1));
    assert.ok(ereignisse.every((ereignis) => ereignis.auf !== 1));
  }
});

test('Essen macht auf beiden Geräten gleich gesund', () => {
  const kampf = duell();
  aktiver(kampf.plaetze[0]).kp = 5;
  const ereignisse = rundeAusrechnen(kampf, { 0: { art: 'essen', sache: 'mondsuppe', imKampf: { heilen: 1 } }, 1: { art: 'tauschen', zu: 1 } }, wuerfel(2));
  assert.equal(ereignisse[0].art, 'essen');
  const { geheilt } = ereignisAnwenden(kampf, ereignisse[0]);
  assert.equal(aktiver(kampf.plaetze[0]).kp, aktiver(kampf.plaetze[0]).maxKp);
  assert.equal(geheilt, aktiver(kampf.plaetze[0]).maxKp - 5);
});
