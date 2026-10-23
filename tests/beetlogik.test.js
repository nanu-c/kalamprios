import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BEET } from '../src/daten/beet.js';
import { ORTE } from '../src/daten/orte.js';
import { abstand, hindernisseAmOrt } from '../src/welt/weltlogik.js';
import { beetPlaetze, beetWachsen, freierBeetPlatz, stufe } from '../src/welt/beetlogik.js';

const beet = { x: 1000, y: 1000, breite: 600, hoehe: 260 };
const sekunden = (wieViele) => wieViele * 1000;
// Wann der wievielte Ableger der ersten Pflanze kommt (in Millisekunden)
const ableger = (nummer) => sekunden(BEET.reifSekunden + nummer * BEET.ausbreitenSekunden);

test('Im Beet gibt es Plätze zum Einsetzen, alle im Beet', () => {
  const plaetze = beetPlaetze(beet);
  assert.equal(plaetze.length, 18);
  for (const platz of plaetze) {
    assert.ok(Math.abs(platz.x - beet.x) <= beet.breite / 2);
    assert.ok(Math.abs(platz.y - beet.y) <= beet.hoehe / 2);
  }
  assert.equal(freierBeetPlatz([{ platz: 0 }, { platz: 1 }], 18), 2);
  assert.equal(freierBeetPlatz(plaetze.map((_, platz) => ({ platz })), 18), -1);
});

test('Erst Keimling, dann wächst es, dann ist es groß, dann wird es wild', () => {
  assert.equal(stufe(5, BEET).stufe, 'keim');
  assert.equal(stufe(BEET.keimenSekunden + 10, BEET).stufe, 'waechst');
  assert.equal(stufe(BEET.reifSekunden + 1, BEET).stufe, 'reif');
  assert.equal(stufe(BEET.reifSekunden, BEET).groesse, 1);
  const wild = stufe(BEET.reifSekunden + BEET.ausbreitenSekunden + 1, BEET);
  assert.equal(wild.stufe, 'wild');
  assert.ok(wild.groesse >= 1 && stufe(99999, BEET).groesse <= 1.35);
});

test('Am Anfang ist das Beet ordentlich, nach langer Zeit ganz wild', () => {
  const gepflanzt = [{ art: 'pilzsporen', platz: 3, zeit: 0 }];
  const frisch = beetWachsen({ gepflanzt, jetzt: sekunden(BEET.keimenSekunden + 60), beet, regeln: BEET });
  assert.equal(frisch.pflanzen.length, 1);
  assert.equal(frisch.wildheit, 0);

  const spaeter = beetWachsen({ gepflanzt, jetzt: ableger(2) + 1, beet, regeln: BEET });
  assert.ok(spaeter.pflanzen.length > 1, 'es gibt Ableger');
  assert.ok(spaeter.wildheit > 0);

  const vielSpaeter = beetWachsen({ gepflanzt, jetzt: ableger(200), beet, regeln: BEET });
  assert.ok(vielSpaeter.pflanzen.length <= BEET.hoechstens);
  assert.ok(vielSpaeter.wildheit > spaeter.wildheit);
  assert.equal(vielSpaeter.wildheit, 1);
});

test('Das Beet wächst jedes Mal gleich, und Ableger bleiben in der Nähe', () => {
  const gepflanzt = [
    { art: 'pilzsporen', platz: 0, zeit: 0 },
    { art: 'orchideensamen', platz: 7, zeit: sekunden(BEET.keimenSekunden) },
  ];
  const einmal = beetWachsen({ gepflanzt, jetzt: ableger(12), beet, regeln: BEET });
  const nochmal = beetWachsen({ gepflanzt, jetzt: ableger(12), beet, regeln: BEET });
  assert.deepEqual(einmal, nochmal);
  for (const pflanze of einmal.pflanzen) {
    assert.ok(Math.abs(pflanze.x - beet.x) <= beet.breite / 2 + BEET.wildWeite);
    assert.ok(new Set(gepflanzt.map((p) => p.art)).has(pflanze.art), 'nur Arten aus dem Beet');
  }
  // Was später gewachsen ist, ist früher noch nicht da, aber alles von früher bleibt.
  const frueher = beetWachsen({ gepflanzt, jetzt: ableger(5), beet, regeln: BEET });
  const ids = new Set(einmal.pflanzen.map((pflanze) => pflanze.id));
  assert.ok(frueher.pflanzen.every((pflanze) => ids.has(pflanze.id)));
});

test('Wo nichts wachsen darf, wächst auch nichts', () => {
  const gepflanzt = [{ art: 'pilzsporen', platz: 3, zeit: 0 }];
  const { pflanzen } = beetWachsen({ gepflanzt, jetzt: ableger(40), beet, regeln: BEET, frei: (punkt) => punkt.y > beet.y });
  assert.ok(pflanzen.slice(1).every((pflanze) => pflanze.y > beet.y));
});

test('Saatgut liegt überall so, dass man es aufsammeln kann', () => {
  for (const ort of Object.values(ORTE)) {
    for (const punkt of ort.saatgut ?? []) {
      for (const hindernis of hindernisseAmOrt(ort)) {
        if (hindernis.radiusX) continue;
        assert.ok(abstand(punkt, hindernis) > hindernis.radius + 10, `${ort.name}: ${punkt.art} liegt in einem Hindernis`);
      }
    }
  }
});
