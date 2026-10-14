// Die Regeln fürs Herumlaufen. Hier wird nichts gemalt, nur gerechnet.
//
// Alles, was im Weg stehen kann, ist für die Rechnung ein Kreis:
// ein Punkt (x, y) mit einem radius.

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

export function istImGras(ort, grasflaechen) {
  return grasflaechen.some(
    (gras) =>
      ort.x >= gras.links &&
      ort.x <= gras.links + gras.breite &&
      ort.y >= gras.oben &&
      ort.y <= gras.oben + gras.hoehe,
  );
}

// So weit darf man laufen. Am Rand der Welt stehen dichte Bäume, davor ist Schluss.
export function weltGrenzen(wald) {
  return { links: 90, oben: 180, rechts: wald.breite - 90, unten: wald.hoehe - 50 };
}

// Macht aus den Bäumen und Kristallen des Waldes Kreise, die im Weg stehen.
// Der Kreis sitzt am Fuß: Hinter einer Baumkrone kann man durchlaufen.
export function hindernisseImWald(wald) {
  return [
    ...wald.baeume.map((baum) => ({ x: baum.x, y: baum.y - 6, radius: 22 })),
    ...wald.kristalle.map((kristall) => ({ x: kristall.x, y: kristall.y - 8, radius: 30 })),
  ];
}
