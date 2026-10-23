import assert from 'node:assert/strict';
import { test } from 'node:test';

import { allesEssen, beutelInhalt, einpacken, herausnehmen, sachenImBeutel, sammelZutaten } from '../src/beutel.js';
import { laden, neuesSpiel, speichern, spielstand } from '../src/spielstand.js';

function testSpeicher() {
  const daten = new Map();
  return {
    getItem: (name) => (daten.has(name) ? daten.get(name) : null),
    setItem: (name, wert) => daten.set(name, String(wert)),
    removeItem: (name) => daten.delete(name),
  };
}

test('im Beutel sind die Fangkristalle und das gekochte Essen', () => {
  neuesSpiel(testSpeicher());
  spielstand.fangkristalle = 2;
  const [suppe, kuchen] = allesEssen();
  assert.deepEqual(beutelInhalt().map((sache) => sache.kurzname), ['fangkristall']);

  einpacken(suppe.kurzname);
  einpacken(suppe.kurzname);
  einpacken(kuchen.kurzname);
  assert.deepEqual(
    beutelInhalt().map((sache) => [sache.kurzname, sache.anzahl]),
    [['fangkristall', 2], [suppe.kurzname, 2], [kuchen.kurzname, 1]],
  );
  assert.equal(sachenImBeutel(), 5);

  assert.equal(herausnehmen(kuchen.kurzname), true);
  assert.equal(herausnehmen(kuchen.kurzname), false, 'was nicht mehr da ist, kann man nicht herausnehmen');
  assert.equal(herausnehmen('fangkristall'), true);
  assert.equal(spielstand.fangkristalle, 1);
  assert.equal(sachenImBeutel(), 3);
});

test('der Beutel bleibt beim Speichern und Laden erhalten', () => {
  const speicher = testSpeicher();
  neuesSpiel(speicher);
  Object.assign(spielstand, { charakter: 'kala', rivalin: 'pflanstaria', kalamprio: 'kalampria', team: ['kalampria'], kampfteam: ['kalampria'] });
  einpacken(allesEssen()[0].kurzname, 3);
  speichern(speicher);
  neuesSpiel(testSpeicher());
  assert.equal(laden(speicher), true);
  assert.equal(spielstand.beutel[allesEssen()[0].kurzname], 3);
});

test('gesammelte Zutaten sind im Beutel, aber im Kampf kann man sie nicht benutzen', () => {
  neuesSpiel(testSpeicher());
  spielstand.fangkristalle = 0;
  const [zutat] = sammelZutaten();
  einpacken(zutat.kurzname, 2);
  assert.deepEqual(beutelInhalt().map((sache) => sache.kurzname), [zutat.kurzname]);
  assert.deepEqual(beutelInhalt(true), []);
  assert.equal(sachenImBeutel(), 2);
  assert.equal(sachenImBeutel(true), 0);
});
