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

// Wer taucht im hohen Gras auf? Ganz selten das geheime Kalamprio, und ganz
// sicher, wenn schon so viele andere da waren, wie bei spaetestensNach steht.
// bisher: wie viele andere seit dem letzten geheimen schon aufgetaucht sind.
export function grasBegegnung(ort, bisher, zufall = Math.random) {
  const geheimes = ort.geheimesImGras;
  if (geheimes && (bisher >= (geheimes.spaetestensNach ?? Infinity) || zufall() < geheimes.chance)) {
    return { art: geheimes.art, geheim: true };
  }
  return { art: ort.tiereImGras[Math.floor(zufall() * ort.tiereImGras.length)], geheim: false };
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
    ...(ort.dunklerKristall ? [{ x: ort.dunklerKristall.x, y: ort.dunklerKristall.y - 8, radius: 30 }] : []),
    ...liste('prismastahl').map((stahl) => ({ x: stahl.x, y: stahl.y - 8, radius: 30 })),
    ...liste('gold').map((gold) => ({ x: gold.x, y: gold.y - 10, radius: 34 })),
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

// Eine unsichtbare Sperre quer über einen Weg hinaus, direkt am Rand: eine
// Reihe von Kreisen, durch die niemand hindurchpasst. So kommt man nicht an
// der Rivalin vorbei, solange sie den Weg bewacht.
export function wegSperre(ausgang, grenzen) {
  const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
  const kreise = [];
  for (let seitlich = -AUSGANG_BREITE; seitlich <= AUSGANG_BREITE; seitlich += 30) {
    const punkt = hinterDemAusgang(ausgang, grenzen, 30);
    kreise.push({
      x: punkt.x + (quer ? 0 : seitlich),
      y: punkt.y + (quer ? seitlich : 0),
      radius: 30,
    });
  }
  return kreise;
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

// ----------------------------------------------------------------- Rätsel

// Würfelt, in welcher Reihenfolge die Klangsteine aufleuchten: laenge
// Nummern von 0 bis anzahl - 1. Derselbe Stein kommt nie zweimal hintereinander.
export function reihenfolgeWuerfeln(anzahl, laenge, zufall = Math.random) {
  const folge = [];
  while (folge.length < laenge) {
    const nummer = Math.floor(zufall() * anzahl);
    if (anzahl < 2 || nummer !== folge.at(-1)) folge.push(nummer);
  }
  return folge;
}

// Beim Rätsel mit der Reihenfolge: Man ist auf den Stein mit der Nummer
// nummer getreten. folge sagt, in welcher Reihenfolge die Steine dran sind,
// geschafft, wie viele davon schon richtig waren.
// Zurück kommt, wie viele es jetzt sind, und was passiert ist:
// 'schon' (das ist der Stein, auf dem man gerade richtig war), 'richtig',
// 'falsch' (dann geht es von vorn los) oder 'fertig' (alle richtig).
export function reihenfolgeTreten(geschafft, nummer, folge) {
  if (geschafft > 0 && nummer === folge[geschafft - 1]) return { geschafft, ergebnis: 'schon' };
  if (nummer !== folge[geschafft]) return { geschafft: 0, ergebnis: 'falsch' };
  const jetzt = geschafft + 1;
  return { geschafft: jetzt, ergebnis: jetzt === folge.length ? 'fertig' : 'richtig' };
}

// Beim Frage-Rätsel: Bringt die Fragen durcheinander (gibt die Nummern zurück).
export function durcheinander(anzahl, zufall = Math.random) {
  const nummern = Array.from({ length: anzahl }, (_, nummer) => nummer);
  for (let i = nummern.length - 1; i > 0; i -= 1) {
    const j = Math.floor(zufall() * (i + 1));
    [nummern[i], nummern[j]] = [nummern[j], nummern[i]];
  }
  return nummern;
}
