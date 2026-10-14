import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KRISTALLWALD } from '../src/daten/kristallwald.js';
import {
  abstand,
  hindernisseImWald,
  istImGras,
  richtungZu,
  schritt,
  weltGrenzen,
} from '../src/welt/weltlogik.js';

const GRENZEN = { links: 0, oben: 0, rechts: 1000, unten: 1000 };
const BAUM = { x: 500, y: 500, radius: 20 };

test('ohne Hindernis kommt man genau so weit, wie man läuft', () => {
  assert.deepEqual(schritt({ x: 100, y: 100 }, { x: 10, y: -5 }, 18, [], GRENZEN), { x: 110, y: 95 });
});

test('man kann nicht in ein Hindernis hineinlaufen', () => {
  let ort = { x: 400, y: 500 };
  for (let i = 0; i < 100; i += 1) ort = schritt(ort, { x: 5, y: 0 }, 18, [BAUM], GRENZEN);
  assert.ok(abstand(ort, BAUM) >= 18 + 20 - 1e-9);
  assert.ok(ort.x < BAUM.x);
});

test('wer schräg auf ein Hindernis trifft, rutscht daran vorbei', () => {
  let ort = { x: 400, y: 490 };
  for (let i = 0; i < 100; i += 1) ort = schritt(ort, { x: 5, y: 0 }, 18, [BAUM], GRENZEN);
  assert.ok(ort.x > BAUM.x + 38, `x ist nur ${ort.x}`);
  assert.ok(abstand(ort, BAUM) >= 38 - 1e-9);
});

test('zwischen zwei Hindernissen bleibt man draußen', () => {
  const enge = [
    { x: 500, y: 480, radius: 20 },
    { x: 500, y: 520, radius: 20 },
  ];
  let ort = { x: 400, y: 500 };
  for (let i = 0; i < 100; i += 1) ort = schritt(ort, { x: 5, y: 0 }, 18, enge, GRENZEN);
  assert.ok(ort.x < 500);
});

test('am Rand der Welt ist Schluss', () => {
  assert.deepEqual(schritt({ x: 5, y: 5 }, { x: -50, y: -50 }, 18, [], GRENZEN), { x: 0, y: 0 });
  assert.deepEqual(schritt({ x: 995, y: 995 }, { x: 50, y: 50 }, 18, [], GRENZEN), { x: 1000, y: 1000 });
});

test('richtungZu liefert eine Richtung der Länge 1 und die Entfernung', () => {
  const { richtung, entfernung } = richtungZu({ x: 0, y: 0 }, { x: 30, y: 40 });
  assert.equal(entfernung, 50);
  assert.ok(Math.abs(richtung.x - 0.6) < 1e-12 && Math.abs(richtung.y - 0.8) < 1e-12);
  assert.deepEqual(richtungZu({ x: 7, y: 7 }, { x: 7, y: 7 }).richtung, { x: 0, y: 0 });
});

test('istImGras erkennt, ob man in einer Grasfläche steht', () => {
  const gras = [{ links: 100, oben: 200, breite: 50, hoehe: 80 }];
  assert.equal(istImGras({ x: 120, y: 250 }, gras), true);
  assert.equal(istImGras({ x: 99, y: 250 }, gras), false);
  assert.equal(istImGras({ x: 120, y: 281 }, gras), false);
});

// Der Kristallwald selbst: Niemand soll in einem Baum starten.
test('Start, Rivalin und wilde Kalamprios stehen frei und in der Welt', () => {
  const hindernisse = hindernisseImWald(KRISTALLWALD);
  const grenzen = weltGrenzen(KRISTALLWALD);
  const punkte = [KRISTALLWALD.start, KRISTALLWALD.rivalin, ...KRISTALLWALD.wildeKalamprios];

  for (const punkt of punkte) {
    assert.ok(punkt.x >= grenzen.links && punkt.x <= grenzen.rechts, `x ${punkt.x} liegt außerhalb`);
    assert.ok(punkt.y >= grenzen.oben && punkt.y <= grenzen.unten, `y ${punkt.y} liegt außerhalb`);
    for (const hindernis of hindernisse) {
      assert.ok(
        abstand(punkt, hindernis) > hindernis.radius + 60,
        `(${punkt.x}, ${punkt.y}) steht zu nah an einem Hindernis`,
      );
    }
  }
});

test('zwischen allen Bäumen und Kristallen passt die Figur hindurch', () => {
  const hindernisse = hindernisseImWald(KRISTALLWALD);
  for (const a of hindernisse) {
    for (const b of hindernisse) {
      if (a !== b) assert.ok(abstand(a, b) - a.radius - b.radius > 2 * 18 + 10);
    }
  }
});

test('alle Grasflächen liegen in der Welt', () => {
  for (const gras of KRISTALLWALD.hohesGras) {
    assert.ok(gras.links >= 0 && gras.links + gras.breite <= KRISTALLWALD.breite);
    assert.ok(gras.oben >= 0 && gras.oben + gras.hoehe <= KRISTALLWALD.hoehe);
  }
});
