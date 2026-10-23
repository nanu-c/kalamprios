import assert from 'node:assert/strict';
import { test } from 'node:test';

import { datenPruefen } from '../src/daten/pruefen.js';
import { ORTE } from '../src/daten/orte.js';
import {
  abstand,
  ankunft,
  ausgangAmRand,
  freierPlatz,
  grasBegegnung,
  hinterDemAusgang,
  hindernisseAmOrt,
  istImGras,
  richtungZu,
  schritt,
  tuerAmOrt,
  wegSperre,
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

test('aus einem See wird man hinausgeschoben', () => {
  const see = { x: 500, y: 500, radiusX: 200, radiusY: 100 };
  const ort = schritt({ x: 500, y: 395 }, { x: 0, y: 30 }, 18, [see], GRENZEN);
  const drin = Math.hypot((ort.x - 500) / 218, (ort.y - 500) / 118);
  assert.ok(drin >= 1 - 1e-9, `noch ${drin} im See`);
  assert.ok(ort.y < 400);
});

test('ein Ausgang wirkt nur am Rand und nur auf dem Weg', () => {
  const ort = { breite: 1000, hoehe: 800, ausgaenge: [{ nach: 'x', seite: 'rechts', mitte: 400 }] };
  const grenzen = weltGrenzen(ort);
  assert.equal(ausgangAmRand(ort, { x: grenzen.rechts, y: 420 }, grenzen)?.nach, 'x');
  assert.equal(ausgangAmRand(ort, { x: grenzen.rechts - 30, y: 420 }, grenzen), null);
  assert.equal(ausgangAmRand(ort, { x: grenzen.rechts, y: 650 }, grenzen), null);
});

test('in den Daten findet die Prüfung keinen Fehler', () => {
  assert.deepEqual(datenPruefen(), []);
});

// Die Orte selbst: Niemand soll in einem Baum oder im See starten.
for (const [kurzname, ort] of Object.entries(ORTE)) {
  test(`${ort.name}: alle wichtigen Plätze stehen frei und im Ort`, () => {
    const hindernisse = hindernisseAmOrt(ort);
    const grenzen = weltGrenzen(ort);
    const punkte = [
      ort.start,
      ort.rivalin,
      ort.rivalinNachSieg,
      ...ort.wildeKalamprios,
      ...ort.ausgaenge.map((ausgang) => ankunft(ort, ausgang.nach)),
    ].filter(Boolean);

    for (const punkt of punkte) {
      const wo = `(${punkt.x}, ${punkt.y})`;
      assert.ok(punkt.x >= grenzen.links && punkt.x <= grenzen.rechts, `${wo} liegt außerhalb`);
      assert.ok(punkt.y >= grenzen.oben && punkt.y <= grenzen.unten, `${wo} liegt außerhalb`);
      for (const hindernis of hindernisse) {
        const frei = hindernis.radiusX
          ? Math.hypot((punkt.x - hindernis.x) / (hindernis.radiusX + 60), (punkt.y - hindernis.y) / (hindernis.radiusY + 60)) > 1
          : abstand(punkt, hindernis) > hindernis.radius + 60;
        assert.ok(frei, `${wo} steht zu nah an einem Hindernis bei (${hindernis.x}, ${hindernis.y})`);
      }
    }
  });

  test(`${ort.name}: zwischen allem passt die Figur hindurch`, () => {
    const kreise = hindernisseAmOrt(ort).filter((hindernis) => !hindernis.radiusX);
    for (const a of kreise) {
      for (const b of kreise) {
        // Die drei Kreise eines Hauses dürfen sich berühren.
        if (a === b || (a.y === b.y && abstand(a, b) <= 120)) continue;
        assert.ok(
          abstand(a, b) - a.radius - b.radius > 2 * 18 + 10,
          `zu eng zwischen (${a.x}, ${a.y}) und (${b.x}, ${b.y})`,
        );
      }
    }
  });

  test(`${ort.name}: alle Grasflächen liegen im Ort`, () => {
    for (const gras of ort.hohesGras) {
      assert.ok(gras.links >= 0 && gras.links + gras.breite <= ort.breite);
      assert.ok(gras.oben >= 0 && gras.oben + gras.hoehe <= ort.hoehe);
    }
  });

  test(`${ort.name}: jeder Ausgang führt hin und wieder zurück`, () => {
    for (const ausgang of ort.ausgaenge) {
      const dort = ankunft(ORTE[ausgang.nach], kurzname);
      const ziel = ORTE[ausgang.nach];
      const zurueck = [...ziel.ausgaenge, ...(ziel.tueren ?? [])].find((a) => a.nach === kurzname || (a.zurueckVon ?? []).includes(kurzname));
      assert.ok(zurueck, `${ausgang.nach} hat keinen Weg zurück`);
      // Wer ankommt, steht nicht gleich wieder im Ausgang.
      assert.equal(ausgangAmRand(ORTE[ausgang.nach], dort, weltGrenzen(ORTE[ausgang.nach])), null);
    }
  });
}

for (const [kurzname, ort] of Object.entries(ORTE)) {
  for (const tuer of ort.tueren ?? []) {
    test(`${ort.name}: Wer durch die Tür nach ${tuer.nach} zurückkommt, steht davor im Ort`, () => {
      const dort = ankunft(ort, tuer.nach);
      const grenzen = weltGrenzen(ort);
      assert.ok(dort.x >= grenzen.links && dort.x <= grenzen.rechts && dort.y >= grenzen.oben && dort.y <= grenzen.unten);
      // nicht gleich wieder in der Tür
      assert.equal(tuerAmOrt(ort, dort), null);
      // und nicht in einem Hindernis
      for (const hindernis of hindernisseAmOrt(ort).filter((h) => !h.radiusX)) {
        assert.ok(abstand(dort, hindernis) > hindernis.radius, `steht in (${hindernis.x}, ${hindernis.y})`);
      }
    });
  }
}

test('im Schilf kommt das geheime Kalamprio spätestens nach ein paar anderen', () => {
  const see = ORTE.mondsee;
  const nie = () => 0.99; // ein Würfel, der nie das geheime würfelt
  const grenze = see.geheimesImGras.spaetestensNach;
  for (let bisher = 0; bisher < grenze; bisher += 1) {
    assert.equal(grasBegegnung(see, bisher, nie).geheim, false);
  }
  assert.deepEqual(grasBegegnung(see, grenze, nie), { art: see.geheimesImGras.art, geheim: true });
  assert.equal(grasBegegnung(see, 0, () => 0).geheim, true);
});

test('im Wald gibt es kein geheimes Kalamprio im Gras', () => {
  assert.equal(grasBegegnung(ORTE.kristallwald, 100, () => 0).geheim, false);
});

test('an einem Weg, den die Rivalin bewacht, kommt niemand vorbei', () => {
  for (const ort of Object.values(ORTE)) {
    const grenzen = weltGrenzen(ort);
    for (const ausgang of ort.ausgaenge.filter((weg) => weg.erstNachRivalin)) {
      const hindernisse = [...hindernisseAmOrt(ort), ...wegSperre(ausgang, grenzen), { ...ort.rivalin, radius: 56 }];
      // Von vielen Stellen aus geradewegs auf den Ausgang zu laufen, auch schräg von oben und unten.
      for (let seitlich = -400; seitlich <= 400; seitlich += 40) {
        const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
        const start = hinterDemAusgang(ausgang, grenzen, 400);
        let wo = { x: start.x + (quer ? 0 : seitlich), y: start.y + (quer ? seitlich : 0) };
        const ziel = hinterDemAusgang(ausgang, grenzen, -50);
        for (let i = 0; i < 400; i += 1) {
          const { richtung } = richtungZu(wo, ziel);
          wo = schritt(wo, { x: richtung.x * 5, y: richtung.y * 5 }, 18, hindernisse, grenzen);
          assert.equal(ausgangAmRand(ort, wo, grenzen), null, `von ${seitlich} aus kommt man bei (${wo.x}, ${wo.y}) hinaus`);
        }
      }
    }
  }
});

for (const [, ort] of Object.entries(ORTE)) {
  if (!(ort.fangkristalle?.length || ort.zutaten?.length)) continue;
  test(`${ort.name}: Fangkristalle und Zutaten finden immer einen neuen freien Platz`, () => {
    const grenzen = weltGrenzen(ort);
    for (let versuch = 0; versuch < 60; versuch += 1) {
      const platz = freierPlatz(ort);
      assert.ok(platz, 'kein freier Platz gefunden');
      assert.ok(platz.x > grenzen.links && platz.x < grenzen.rechts && platz.y > grenzen.oben && platz.y < grenzen.unten);
      for (const h of hindernisseAmOrt(ort)) {
        if (h.radiusX) assert.ok(Math.hypot((platz.x - h.x) / h.radiusX, (platz.y - h.y) / h.radiusY) >= 1, 'im See');
        else assert.ok(abstand(platz, h) >= h.radius + 18, `zu nah an (${h.x}, ${h.y})`);
      }
      for (const ausgang of ort.ausgaenge) assert.equal(ausgangAmRand(ort, platz, grenzen), null);
    }
  });
}
