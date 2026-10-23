import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ORTE } from '../src/daten/orte.js';
import { abstand, hindernisseAmOrt } from '../src/welt/weltlogik.js';

// Liegt der Punkt so, dass die Figur hinkommt (nicht im See, nicht im Baum)?
function erreichbar(ort, punkt) {
  return hindernisseAmOrt(ort).every((h) =>
    h.radiusX ? Math.hypot((punkt.x - h.x) / (h.radiusX + 18), (punkt.y - h.y) / (h.radiusY + 18)) >= 1 : abstand(punkt, h) > h.radius + 18,
  );
}

test('Flasche, Frösche, Froschbucht und Wasserrad am Mondsee sind erreichbar', () => {
  const post = ORTE.mondsee.flaschenpost;
  assert.ok(erreichbar(ORTE.mondsee, post.flasche), 'die Flasche');
  assert.ok(erreichbar(ORTE.mondsee, post.bucht), 'die Froschbucht');
  assert.ok(erreichbar(ORTE.mondsee, { x: post.wasserrad.x - 100, y: post.wasserrad.y }), 'neben dem Wasserrad');
  for (const frosch of post.froesche) assert.ok(erreichbar(ORTE.mondsee, frosch), `der Frosch bei ${frosch.x}, ${frosch.y}`);
});

test('Das Ölkännchen für das Wasserrad liegt in der Mine, wo man hinkommt', () => {
  const kanne = ORTE.prismastahlMine.besonderes.find((ding) => ding.art === ORTE.mondsee.flaschenpost.braucht);
  assert.ok(kanne);
  assert.ok(erreichbar(ORTE.prismastahlMine, kanne));
});

test('Vor der Werkbank am Mondsee kann man stehen', () => {
  const { werkbank } = ORTE.mondsee;
  assert.ok(erreichbar(ORTE.mondsee, { x: werkbank.x, y: werkbank.y + 80 }));
});
