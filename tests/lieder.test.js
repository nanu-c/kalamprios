import assert from 'node:assert/strict';
import { test } from 'node:test';

import { akkordLesen, LIEDER, MELODIEN, noteLesen } from '../src/klang/lieder.js';

test('Noten werden richtig gelesen', () => {
  assert.equal(noteLesen('C4'), 60);
  assert.equal(noteLesen('A4'), 69);
  assert.equal(noteLesen('C#5'), 73);
  assert.equal(noteLesen('Bb4'), 70);
});

test('Akkorde werden richtig gelesen', () => {
  assert.deepEqual(akkordLesen('C'), { ton: 0, terz: 4 });
  assert.deepEqual(akkordLesen('Dm'), { ton: 2, terz: 3 });
  assert.deepEqual(akkordLesen('Bb'), { ton: 10, terz: 4 });
  assert.deepEqual(akkordLesen('C#m'), { ton: 1, terz: 3 });
});

for (const [name, lied] of Object.entries(LIEDER)) {
  test(`Das Lied "${name}" ist richtig aufgeschrieben`, () => {
    assert.ok(lied.tempo > 0);
    for (const takt of lied.akkorde) for (const akkord of takt.split(' ')) assert.doesNotThrow(() => akkordLesen(akkord), akkord);

    if (lied.melodie) {
      assert.equal(lied.melodie.length, lied.akkorde.length, 'so viele Melodie-Takte wie Akkorde');
      lied.melodie.forEach((takt, nummer) => {
        const zeichen = takt.split(' ');
        assert.equal(zeichen.length, 8, `Takt ${nummer + 1} braucht acht Achtel: "${takt}"`);
        assert.notEqual(zeichen[0], '-', `Takt ${nummer + 1} darf nicht mit "-" anfangen`);
        for (const note of zeichen) if (note !== '-' && note !== '.') assert.doesNotThrow(() => noteLesen(note), note);
      });
    }

    for (const muster of [lied.bass, lied.begleitung].filter(Boolean)) {
      assert.ok([8, 16].includes(muster.length), `"${muster}" braucht 8 oder 16 Zeichen`);
      assert.match(muster, /^[13580.]+$/);
    }
    if (lied.schlagzeug) {
      assert.equal(lied.schlagzeug.length, 16);
      assert.match(lied.schlagzeug, /^[ksh.]+$/);
    }
  });
}

test('Die kurzen Melodien haben nur echte Noten', () => {
  for (const melodie of Object.values(MELODIEN)) {
    for (const [note, laenge] of melodie.noten) {
      assert.ok(laenge > 0);
      if (note !== '.') assert.doesNotThrow(() => noteLesen(note), note);
    }
  }
});
