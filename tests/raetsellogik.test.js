import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ORTE } from '../src/daten/orte.js';
import {
  farbenMischen,
  lichterTreten,
  lichterWuerfeln,
  paareLegen,
  spiegelDrehen,
  stimmenRunde,
  strahlVerfolgen,
  wegWuerfeln,
  zutatenFuerFarbe,
} from '../src/welt/raetsellogik.js';

// Ein Würfel, der immer dieselben Zahlen liefert.
function wuerfel(startwert = 1) {
  let zustand = startwert;
  return () => {
    zustand = (zustand * 16807) % 2147483647;
    return (zustand - 1) / 2147483646;
  };
}

test('zwei Grundfarben ergeben eine Mischfarbe', () => {
  assert.equal(farbenMischen('rot', 'gelb'), 'orange');
  assert.equal(farbenMischen('gelb', 'rot'), 'orange');
  assert.equal(farbenMischen('blau', 'gelb'), 'gruen');
  assert.equal(farbenMischen('rot', 'blau'), 'lila');
  assert.equal(farbenMischen('rot', 'rot'), 'rot');
  assert.deepEqual(zutatenFuerFarbe('lila'), ['blau', 'rot']);
  assert.equal(zutatenFuerFarbe('rot'), null);
});

test('bei "Wer ruft da?" klingen alle zur Auswahl verschieden', () => {
  const stimmen = { a: 'piepsen', b: 'piepsen', c: 'brummen', d: 'glocke', e: 'zirpen', f: 'glocke' };
  for (let runde = 1; runde < 30; runde += 1) {
    const { gesucht, auswahl } = stimmenRunde(Object.keys(stimmen), (k) => stimmen[k], 4, wuerfel(runde));
    assert.ok(auswahl.includes(gesucht));
    assert.equal(auswahl.length, 4);
    assert.equal(new Set(auswahl.map((k) => stimmen[k])).size, 4);
  }
});

test('bei den Bilderpaaren kommt jedes Bild genau zweimal vor', () => {
  const gelegt = paareLegen(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 12, wuerfel(3));
  assert.equal(gelegt.length, 12);
  const anzahl = {};
  for (const bild of gelegt) anzahl[bild] = (anzahl[bild] ?? 0) + 1;
  assert.equal(Object.keys(anzahl).length, 6);
  assert.ok(Object.values(anzahl).every((n) => n === 2));
});

test('der geheime Weg führt von links nach rechts, Schritt für Schritt', () => {
  for (let runde = 1; runde < 50; runde += 1) {
    const weg = wegWuerfeln(6, 5, wuerfel(runde));
    assert.equal(weg[0].spalte, 0);
    assert.equal(weg.at(-1).spalte, 5);
    assert.equal(new Set(weg.map((f) => `${f.spalte} ${f.reihe}`)).size, weg.length, 'kein Feld doppelt');
    for (let i = 1; i < weg.length; i += 1) {
      const dx = weg[i].spalte - weg[i - 1].spalte;
      const dy = Math.abs(weg[i].reihe - weg[i - 1].reihe);
      assert.ok((dx === 1 && dy === 0) || (dx === 0 && dy === 1), 'immer ein Nachbarfeld, nie zurück');
      assert.ok(weg[i].reihe >= 0 && weg[i].reihe < 5);
    }
  }
});

test('Spiegel lenken den Lichtstrahl um', () => {
  const start = { spalte: 0, reihe: 2, richtung: 'rechts' };
  assert.deepEqual(strahlVerfolgen(4, 4, start, []).ende, { spalte: 3, reihe: 2, richtung: 'rechts' });
  const nachOben = strahlVerfolgen(4, 4, start, [{ spalte: 1, reihe: 2, stellung: '/' }]);
  assert.deepEqual(nachOben.ende, { spalte: 1, reihe: 0, richtung: 'oben' });
  const nachUnten = strahlVerfolgen(4, 4, start, [{ spalte: 1, reihe: 2, stellung: '\\' }]);
  assert.deepEqual(nachUnten.ende, { spalte: 1, reihe: 3, richtung: 'unten' });
  assert.equal(spiegelDrehen('/'), '\\');
  assert.equal(spiegelDrehen('\\'), '/');
});

test('ein Lichtstrahl im Kreis hört trotzdem auf', () => {
  const spiegel = [
    { spalte: 1, reihe: 0, stellung: '\\' },
    { spalte: 1, reihe: 1, stellung: '/' },
    { spalte: 0, reihe: 1, stellung: '\\' },
    { spalte: 0, reihe: 0, stellung: '/' },
  ];
  const { felder } = strahlVerfolgen(2, 2, { spalte: 0, reihe: 0, richtung: 'rechts' }, spiegel);
  assert.ok(felder.length < 20);
});

test('beim Lichter-Rätsel wechseln das Feld und seine Nachbarn', () => {
  const alleAus = Array(9).fill(false);
  assert.deepEqual(lichterTreten(alleAus, 3, 4), [false, true, false, true, true, true, false, true, false]);
  assert.deepEqual(lichterTreten(alleAus, 3, 0), [true, true, false, true, false, false, false, false, false]);
});

test('das Lichter-Rätsel kann man immer schaffen', () => {
  for (let runde = 1; runde < 30; runde += 1) {
    const felder = lichterWuerfeln(3, 3, 4, wuerfel(runde));
    assert.ok(!felder.every(Boolean), 'am Anfang ist nicht alles an');
    // Alle Möglichkeiten ausprobieren: Irgendeine Auswahl von Feldern macht alles an.
    let geschafft = false;
    for (let auswahl = 0; auswahl < 512 && !geschafft; auswahl += 1) {
      let probe = felder;
      for (let nummer = 0; nummer < 9; nummer += 1) if (auswahl & (1 << nummer)) probe = lichterTreten(probe, 3, nummer);
      geschafft = probe.every(Boolean);
    }
    assert.ok(geschafft);
  }
});

for (const ort of Object.values(ORTE).filter((anderer) => anderer.raetsel?.art === 'spiegel')) test(`das Spiegel-Rätsel in ${ort.name} kann man lösen, aber am Anfang ist es nicht gelöst`, () => {
  const { spalten, reihen, startReihe, zielReihe, spiegel } = ort.raetsel;
  const start = { spalte: 0, reihe: startReihe, richtung: 'rechts' };
  const trifft = (stellungen) => {
    const { ende } = strahlVerfolgen(spalten, reihen, start, stellungen);
    return ende?.richtung === 'rechts' && ende.spalte === spalten - 1 && ende.reihe === zielReihe;
  };
  assert.equal(trifft(spiegel), false);
  let loesungen = 0;
  for (let auswahl = 0; auswahl < 2 ** spiegel.length; auswahl += 1) {
    const probe = spiegel.map((s, nummer) => ({ ...s, stellung: auswahl & (1 << nummer) ? spiegelDrehen(s.stellung) : s.stellung }));
    if (trifft(probe)) loesungen += 1;
  }
  assert.ok(loesungen > 0);
});
