import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gespeichertesSpiel, laden, neuesSpiel, speichern, spielstand } from '../src/spielstand.js';

// Ein Speicher wie im Browser, nur zum Ausprobieren.
function testSpeicher(anfang = {}) {
  const daten = new Map(Object.entries(anfang));
  return {
    getItem: (name) => (daten.has(name) ? daten.get(name) : null),
    setItem: (name, wert) => daten.set(name, String(wert)),
    removeItem: (name) => daten.delete(name),
    daten,
  };
}

test('Ohne gewählte Figur wird nichts gespeichert', () => {
  const speicher = testSpeicher();
  neuesSpiel(speicher);
  speichern(speicher);
  assert.equal(speicher.daten.size, 0);
  assert.equal(gespeichertesSpiel(speicher), false);
});

test('Gespeichert und wieder geladen ist alles wie vorher', () => {
  const speicher = testSpeicher();
  neuesSpiel(speicher);
  Object.assign(spielstand, {
    charakter: 'kala',
    rivalin: 'pflanstaria',
    kalamprio: 'taktik',
    team: ['kalampria', 'taktik', 'kabon'],
    kampfteam: ['taktik', 'kabon'],
    erfahrung: { taktik: 7 },
    fangkristalle: 1,
    ort: 'mondsee',
    position: { x: 300, y: 400 },
    geschichteGehoert: { lilaDorf: true },
    raetselAngefangen: { lilaDorf: true },
    raetselGefunden: { lilaDorf: [0, 2] },
    raetselGeloest: { mondsee: true },
  });
  speichern(speicher);
  assert.equal(gespeichertesSpiel(speicher), true);

  neuesSpiel(testSpeicher()); // alles vergessen, aber den Speicher behalten
  assert.equal(spielstand.charakter, null);
  assert.equal(laden(speicher), true);
  assert.equal(spielstand.charakter, 'kala');
  assert.deepEqual(spielstand.team, ['kalampria', 'taktik', 'kabon']);
  assert.deepEqual(spielstand.kampfteam, ['taktik', 'kabon']);
  assert.equal(spielstand.kalamprio, 'taktik');
  assert.equal(spielstand.erfahrung.taktik, 7);
  assert.equal(spielstand.fangkristalle, 1);
  assert.equal(spielstand.ort, 'mondsee');
  assert.deepEqual(spielstand.position, { x: 300, y: 400 });
  assert.equal(spielstand.geschichteGehoert.lilaDorf, true);
  assert.equal(spielstand.raetselAngefangen.lilaDorf, true);
  assert.deepEqual(spielstand.raetselGefunden.lilaDorf, [0, 2]);
  assert.equal(spielstand.raetselGeloest.mondsee, true);
  assert.equal(spielstand.ortsnameZeigen, true);
});

test('Was es im Spiel nicht mehr gibt, fällt beim Laden weg', () => {
  const speicher = testSpeicher({
    'kalamprios-spielstand': JSON.stringify({
      charakter: 'kala',
      kalamprio: 'gibtsnicht',
      team: ['gibtsnicht', 'bolo', 'mola', 'bolo', 'qalutu', 'kapapa'],
      kampfteam: ['gibtsnicht', 'mola', 'qalutu', 'kapapa', 'bolo'],
      ort: 'verschwundenerOrt',
      position: { x: 10, y: 10 },
      fangkristalle: 'viele',
    }),
  });
  assert.equal(laden(speicher), true);
  assert.deepEqual(spielstand.team, ['bolo', 'mola', 'qalutu', 'kapapa']);
  assert.equal(spielstand.kalamprio, 'bolo');
  assert.deepEqual(spielstand.kampfteam, ['bolo', 'mola', 'qalutu']); // höchstens 3, das erste kämpft
  assert.equal(spielstand.ort, 'lilaDorf');
  assert.equal(spielstand.position, null);
  assert.equal(spielstand.fangkristalle, 3);
});

test('Kaputter oder unpassender Spielstand wird nicht geladen', () => {
  for (const kaputt of ['{nicht json', 'null', JSON.stringify({ charakter: 'niemand', team: ['bolo'] }), JSON.stringify({ charakter: 'kala', team: [] })]) {
    const speicher = testSpeicher({ 'kalamprios-spielstand': kaputt });
    assert.equal(gespeichertesSpiel(speicher), false);
    assert.equal(laden(speicher), false);
  }
});

test('Neues Spiel löscht den Spielstand', () => {
  const speicher = testSpeicher({ 'kalamprios-spielstand': JSON.stringify({ charakter: 'kala', team: ['bolo'] }) });
  assert.equal(gespeichertesSpiel(speicher), true);
  neuesSpiel(speicher);
  assert.equal(gespeichertesSpiel(speicher), false);
});
