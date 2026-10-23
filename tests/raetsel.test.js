import assert from 'node:assert/strict';
import { test } from 'node:test';

import { datenPruefen } from '../src/daten/pruefen.js';
import { ORTE } from '../src/daten/orte.js';
import { durcheinander, reihenfolgeTreten, reihenfolgeWuerfeln } from '../src/welt/weltlogik.js';

test('Klangsteine in der richtigen Reihenfolge lösen das Rätsel', () => {
  let stand = { geschafft: 0 };
  for (const [nummer, erwartet] of [[2, 'richtig'], [0, 'richtig'], [2, 'fertig']]) {
    stand = reihenfolgeTreten(stand.geschafft, nummer, [2, 0, 2]);
    assert.equal(stand.ergebnis, erwartet);
  }
  assert.equal(stand.geschafft, 3);
});

test('Ein falscher Klangstein fängt von vorn an, der gerade richtige zählt nicht noch einmal', () => {
  assert.deepEqual(reihenfolgeTreten(2, 3, [1, 0, 2, 4]), { geschafft: 0, ergebnis: 'falsch' });
  assert.deepEqual(reihenfolgeTreten(2, 0, [1, 0, 2, 4]), { geschafft: 2, ergebnis: 'schon' });
  assert.deepEqual(reihenfolgeTreten(2, 1, [1, 0, 2, 4]), { geschafft: 0, ergebnis: 'falsch' });
});

test('Die gewürfelte Reihenfolge hat nie denselben Stein zweimal hintereinander', () => {
  const folge = reihenfolgeWuerfeln(5, 200);
  assert.equal(folge.length, 200);
  for (let i = 1; i < folge.length; i += 1) assert.notEqual(folge[i], folge[i - 1]);
  assert.ok(folge.every((nummer) => nummer >= 0 && nummer < 5));
});

test('durcheinander bringt jede Nummer genau einmal', () => {
  assert.deepEqual([...durcheinander(12)].sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i));
});

test('Jeder Ort hat ein Rätsel, und die Daten sind ohne Fehler', () => {
  // Nur in den Zimmern, in der Schatzkammer und unter Wasser (dort gibt es
  // die Müll-Aufgabe) und im Regenwald (dort fotografiert man Pflanzen) gibt es kein Rätsel.
  for (const ort of Object.values(ORTE)) assert.ok(ort.raetsel || ort.stil === 'haus' || ort.schatz || ort.muellQuest || ort.pflanzen, `${ort.name} hat kein Rätsel`);
  assert.deepEqual(datenPruefen(), []);
});
