import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KALAMPRIOS } from '../src/daten/kalamprios.js';
import { ZUSAMMEN } from '../src/daten/zusammen.js';
import { anbietbar, codeWuerfeln, tauschen, tauschPasst, teamFuerZuZweit } from '../src/zusammen/zusammenlogik.js';

test('Der Code hat die richtige Länge und nur Nummern von Code-Bildern', () => {
  const code = codeWuerfeln(ZUSAMMEN.codeBilder.length, ZUSAMMEN.codeLaenge);
  assert.equal(code.length, ZUSAMMEN.codeLaenge);
  assert.ok(code.every((nummer) => Number.isInteger(nummer) && nummer >= 0 && nummer < ZUSAMMEN.codeBilder.length));
  assert.deepEqual(codeWuerfeln(8, 4, () => 0.99), [7, 7, 7, 7]);
});

test('Die Code-Bilder sind alles Kalamprios', () => {
  assert.ok(ZUSAMMEN.codeBilder.length >= 4);
  for (const kurzname of ZUSAMMEN.codeBilder) assert.ok(KALAMPRIOS[kurzname], kurzname);
});

test('Anbieten kann man nur, was die andere noch nicht hat', () => {
  assert.deepEqual(anbietbar(['bolo', 'kabon', 'qalutu'], ['kabon']), ['bolo', 'qalutu']);
  assert.ok(tauschPasst(['bolo', 'kabon'], ['qalutu'], 'bolo', 'qalutu'));
  assert.ok(!tauschPasst(['bolo', 'kabon'], ['qalutu', 'bolo'], 'bolo', 'qalutu'), 'sie hat bolo schon');
  assert.ok(!tauschPasst(['bolo', 'qalutu'], ['qalutu'], 'bolo', 'qalutu'), 'ich habe qalutu schon');
  assert.ok(!tauschPasst(['bolo'], ['qalutu'], 'bolo', null));
});

test('Beim Tauschen wandert die Erfahrung mit, und der Platz im Kampfteam bleibt', () => {
  const stand = {
    team: ['bolo', 'kabon', 'qalutu'],
    kampfteam: ['kabon', 'bolo'],
    kalamprio: 'kabon',
    erfahrung: { bolo: 4, kabon: 16 },
    erschoepftBis: { kabon: 99 },
  };
  tauschen(stand, 'kabon', 'tschank', 7);
  assert.deepEqual(stand.team, ['bolo', 'tschank', 'qalutu']);
  assert.deepEqual(stand.kampfteam, ['tschank', 'bolo']);
  assert.equal(stand.kalamprio, 'tschank');
  assert.deepEqual(stand.erfahrung, { bolo: 4, tschank: 7 });
  assert.deepEqual(stand.erschoepftBis, {});
});

test('In einen Kampf zu zweit kommen nur die mit, die bereit sind', () => {
  const stand = { kampfteam: ['bolo', 'kabon', 'qalutu'], erfahrung: { bolo: 5, kabon: 20 } };
  const team = teamFuerZuZweit(stand, (kurzname) => (kurzname === 'kabon' ? 1000 : 0), 3);
  assert.deepEqual(team, [
    { kurzname: 'bolo', level: 2 },
    { kurzname: 'qalutu', level: 1 },
  ]);
  assert.equal(teamFuerZuZweit(stand, () => 0, 1).length, 1);
});
