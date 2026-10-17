import assert from 'node:assert/strict';
import { test } from 'node:test';

import { datenPruefen } from '../src/daten/pruefen.js';
import { ORTE } from '../src/daten/orte.js';
import { reihenfolgeTreten } from '../src/welt/weltlogik.js';

test('Klangsteine in der richtigen Reihenfolge lösen das Rätsel', () => {
  let stand = { geschafft: 0 };
  for (const [nummer, erwartet] of [[0, 'richtig'], [1, 'richtig'], [2, 'fertig']]) {
    stand = reihenfolgeTreten(stand.geschafft, nummer, 3);
    assert.equal(stand.ergebnis, erwartet);
  }
  assert.equal(stand.geschafft, 3);
});

test('Ein falscher Klangstein fängt von vorn an, ein leuchtender zählt nicht', () => {
  assert.deepEqual(reihenfolgeTreten(2, 3, 4), { geschafft: 0, ergebnis: 'falsch' });
  assert.deepEqual(reihenfolgeTreten(2, 0, 4), { geschafft: 2, ergebnis: 'schon' });
});

test('Jeder Ort hat ein Rätsel, und die Daten sind ohne Fehler', () => {
  for (const ort of Object.values(ORTE)) assert.ok(ort.raetsel, `${ort.name} hat kein Rätsel`);
  assert.deepEqual(datenPruefen(), []);
});
