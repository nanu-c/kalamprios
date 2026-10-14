// Die Regeln fürs Herumlaufen. Hier wird nichts gemalt, nur gerechnet.
//
// Alles, was im Weg stehen kann, ist für die Rechnung ein Kreis:
// ein Punkt (x, y) mit einem radius. Seen sind Ellipsen: ein Punkt mit
// radiusX (halbe Breite) und radiusY (halbe Höhe).

export function abstand(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// In welche Richtung es von einem Punkt zum anderen geht und wie weit es ist.
// Die Richtung hat immer die Länge 1.
export function richtungZu(von, nach) {
  const entfernung = abstand(von, nach);
  if (entfernung === 0) return { richtung: { x: 0, y: 0 }, entfernung };
  return {
    richtung: { x: (nach.x - von.x) / entfernung, y: (nach.y - von.y) / entfernung },
    entfernung,
  };
}

// Macht einen Schritt und gibt zurück, wo man danach steht.
// Wer in ein Hindernis läuft, wird sanft daran vorbeigeschoben.
// grenzen sagt, wo die Welt aufhört: { links, oben, rechts, unten }.
export function schritt(ort, bewegung, radius, hindernisse, grenzen) {
  let x = ort.x + bewegung.x;
  let y = ort.y + bewegung.y;

  // Zweimal prüfen, falls man zwischen zwei Hindernissen steckt.
  for (let durchgang = 0; durchgang < 2; durchgang += 1) {
    for (const hindernis of hindernisse) {
      if (hindernis.radiusX) {
        ({ x, y } = ausEllipseSchieben({ x, y }, radius, hindernis));
        continue;
      }
      const mindestens = radius + hindernis.radius;
      const entfernung = Math.hypot(x - hindernis.x, y - hindernis.y);
      if (entfernung >= mindestens) continue;

      if (entfernung === 0) {
        x += mindestens;
      } else {
        x = hindernis.x + ((x - hindernis.x) / entfernung) * mindestens;
        y = hindernis.y + ((y - hindernis.y) / entfernung) * mindestens;
      }
    }
  }

  return {
    x: Math.min(Math.max(x, grenzen.links), grenzen.rechts),
    y: Math.min(Math.max(y, grenzen.oben), grenzen.unten),
  };
}

// Wer in einer Ellipse steht, wird von ihrer Mitte aus nach außen geschoben.
function ausEllipseSchieben(ort, radius, ellipse) {
  const breit = ellipse.radiusX + radius;
  const hoch = ellipse.radiusY + radius;
  const dx = ort.x - ellipse.x;
  const dy = ort.y - ellipse.y;
  const wieWeitDrin = Math.hypot(dx / breit, dy / hoch); // unter 1 heißt: drin
  if (wieWeitDrin >= 1) return ort;
  if (wieWeitDrin === 0) return { x: ellipse.x + breit, y: ort.y };
  return { x: ellipse.x + dx / wieWeitDrin, y: ellipse.y + dy / wieWeitDrin };
}

export function istImGras(ort, grasflaechen) {
  return grasflaechen.some(
    (gras) =>
      ort.x >= gras.links &&
      ort.x <= gras.links + gras.breite &&
      ort.y >= gras.oben &&
      ort.y <= gras.oben + gras.hoehe,
  );
}

// So weit darf man laufen. Am Rand stehen dichte Bäume oder Felsen, davor ist Schluss.
export function weltGrenzen(ort) {
  return { links: 90, oben: 180, rechts: ort.breite - 90, unten: ort.hoehe - 50 };
}

// Macht aus allem, was an einem Ort steht, Kreise, die im Weg sind.
// Der Kreis sitzt am Fuß: Hinter einer Baumkrone oder einem Dach kann man durchlaufen.
export function hindernisseAmOrt(ort) {
  const liste = (name) => ort[name] ?? [];
  return [
    ...liste('baeume').map((baum) => ({ x: baum.x, y: baum.y - 6, radius: 22 })),
    ...liste('kristalle').map((kristall) => ({ x: kristall.x, y: kristall.y - 8, radius: 30 })),
    ...liste('prismastahl').map((stahl) => ({ x: stahl.x, y: stahl.y - 8, radius: 30 })),
    ...liste('felsen').map((fels) => ({ x: fels.x, y: fels.y - 14, radius: 44 })),
    // Ein Haus ist breit: drei Kreise nebeneinander.
    ...liste('haeuser').flatMap((haus) =>
      [-80, 0, 80].map((dx) => ({ x: haus.x + dx, y: haus.y - 30, radius: 46 })),
    ),
    ...liste('seen').map((see) => ({
      x: see.x,
      y: see.y,
      radiusX: see.breite / 2,
      radiusY: see.hoehe / 2,
    })),
  ];
}

// --------------------------------------------------------------- Ausgänge

export const AUSGANG_BREITE = 200; // so breit ist der Weg hinaus

// Steht man am Rand genau dort, wo ein Weg hinausführt? Dann kommt der Ausgang
// zurück, sonst null.
export function ausgangAmRand(ort, position, grenzen) {
  for (const ausgang of ort.ausgaenge ?? []) {
    const amRand = {
      links: position.x <= grenzen.links + 1,
      rechts: position.x >= grenzen.rechts - 1,
      oben: position.y <= grenzen.oben + 1,
      unten: position.y >= grenzen.unten - 1,
    }[ausgang.seite];
    const entlang = ausgang.seite === 'links' || ausgang.seite === 'rechts' ? position.y : position.x;
    if (amRand && Math.abs(entlang - ausgang.mitte) < AUSGANG_BREITE / 2) return ausgang;
  }
  return null;
}

// Wo man ein Stück hinter einem Ausgang steht, also gerade angekommen ist.
export function hinterDemAusgang(ausgang, grenzen, weite = 70) {
  switch (ausgang.seite) {
    case 'links':
      return { x: grenzen.links + weite, y: ausgang.mitte };
    case 'rechts':
      return { x: grenzen.rechts - weite, y: ausgang.mitte };
    case 'oben':
      return { x: ausgang.mitte, y: grenzen.oben + weite };
    default:
      return { x: ausgang.mitte, y: grenzen.unten - weite };
  }
}

// Wo man ankommt, wenn man von vonOrt (Kurzname) nach ort kommt:
// am Ausgang, der zurück zu vonOrt führt.
export function ankunft(ort, vonOrt) {
  const zurueck = (ort.ausgaenge ?? []).find((ausgang) => ausgang.nach === vonOrt);
  if (!zurueck) return ort.start ?? { x: ort.breite / 2, y: ort.hoehe / 2 };
  return hinterDemAusgang(zurueck, weltGrenzen(ort));
}
