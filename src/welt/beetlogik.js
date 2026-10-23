// Wie das Beet im Lila Dorf wächst. Hier wird nichts gemalt, nur gerechnet.
// Was man einstellen kann, steht in daten/beet.js, wie es aussieht, in
// szenen/beet.js.
//
// Gespeichert wird nur, was man eingesetzt hat und wann. Alles andere
// (wie groß jede Pflanze ist, wo die Ableger wachsen) rechnet beetWachsen
// jedes Mal neu aus, mit einem Würfel, der immer gleich würfelt. So wächst
// das Beet auch weiter, wenn man gerade nicht spielt.

// Die Plätze im Beet, an denen man einsetzen kann: spalten mal reihen.
export function beetPlaetze(beet, spalten = 6, reihen = 3) {
  const plaetze = [];
  for (let reihe = 0; reihe < reihen; reihe += 1) {
    for (let spalte = 0; spalte < spalten; spalte += 1) {
      plaetze.push({
        x: Math.round(beet.x - beet.breite / 2 + ((spalte + 0.5) * beet.breite) / spalten),
        y: Math.round(beet.y - beet.hoehe / 2 + ((reihe + 0.7) * beet.hoehe) / reihen),
      });
    }
  }
  return plaetze;
}

// Der erste freie Platz im Beet (oder -1, wenn alles voll ist).
export function freierBeetPlatz(gepflanzt, anzahlPlaetze) {
  for (let platz = 0; platz < anzahlPlaetze; platz += 1) {
    if (!gepflanzt.some((pflanze) => pflanze.platz === platz)) return platz;
  }
  return -1;
}

// So weit stehen Ableger mindestens von anderen Pflanzen weg (in Pixeln).
const ABSTAND = 85;

// Ein Würfel, der für denselben Namen immer dieselben Zahlen würfelt.
function wuerfelFuer(name) {
  let zustand = 7;
  for (const zeichen of name) zustand = (zustand * 31 + zeichen.charCodeAt(0)) % 2147483647;
  zustand = zustand || 1;
  return () => {
    zustand = (zustand * 16807) % 2147483647;
    return zustand / 2147483647;
  };
}

// Wie es einer Pflanze geht, die so viele Sekunden alt ist:
// 'keim', 'waechst', 'reif' oder 'wild', und wie groß sie ist (1 ist ganz groß).
export function stufe(alter, regeln) {
  if (alter < regeln.keimenSekunden) return { stufe: 'keim', groesse: 0.25 };
  if (alter < regeln.reifSekunden) {
    const anteil = (alter - regeln.keimenSekunden) / (regeln.reifSekunden - regeln.keimenSekunden);
    return { stufe: 'waechst', groesse: 0.3 + anteil * 0.7 };
  }
  const wild = alter - regeln.reifSekunden;
  if (wild < regeln.ausbreitenSekunden) return { stufe: 'reif', groesse: 1 };
  // Wild geworden: Sie wird immer noch ein bisschen größer.
  return { stufe: 'wild', groesse: 1 + Math.min(0.35, (wild / (regeln.ausbreitenSekunden * 8)) * 0.35) };
}

// Rechnet aus, was im Beet wächst.
//   gepflanzt: was man eingesetzt hat, eine Liste aus { art, platz, zeit }
//              (zeit in Millisekunden, wie Date.now() sie liefert)
//   jetzt:     wie spät es ist (Millisekunden)
//   beet:      { x, y, breite, hoehe } aus der Datei des Ortes
//   regeln:    BEET aus daten/beet.js
//   frei:      sagt für einen Punkt, ob dort ein Ableger wachsen darf
// Zurück kommt { pflanzen, wildheit }. Jede Pflanze hat id, art, x, y,
// stufe und groesse. wildheit geht von 0 (ordentlich) bis 1 (ganz wild).
export function beetWachsen({ gepflanzt, jetzt, beet, regeln, frei = () => true }) {
  const plaetze = beetPlaetze(beet);
  const arten = [...new Set(gepflanzt.map((pflanze) => pflanze.art))];
  const pflanzen = gepflanzt
    .filter((pflanze) => plaetze[pflanze.platz])
    .map((pflanze) => ({ id: `${pflanze.platz}`, art: pflanze.art, ...plaetze[pflanze.platz], geboren: pflanze.zeit }));

  // Wer wann einen Ableger streut. Die frühesten kommen zuerst dran.
  const warteschlange = [];
  const ablegerPlanen = (pflanze) => {
    for (let nummer = 1; nummer <= regeln.ablegerJePflanze; nummer += 1) {
      const zeit = pflanze.geboren + (regeln.reifSekunden + nummer * regeln.ausbreitenSekunden) * 1000;
      if (zeit <= jetzt) warteschlange.push({ zeit, mutter: pflanze, nummer });
    }
  };
  for (const pflanze of pflanzen) ablegerPlanen(pflanze);

  // Wo Ableger wachsen dürfen: rund um das Beet, aber nicht weiter als wildWeite.
  const drin = (punkt) =>
    Math.hypot((punkt.x - beet.x) / (beet.breite / 2 + regeln.wildWeite), (punkt.y - beet.y) / (beet.hoehe / 2 + regeln.wildWeite * 0.5)) <= 1;

  let ableger = 0;
  while (warteschlange.length > 0 && pflanzen.length < regeln.hoechstens) {
    warteschlange.sort((a, b) => a.zeit - b.zeit);
    const { zeit, mutter, nummer } = warteschlange.shift();
    const id = `${mutter.id}.${nummer}`;
    const zufall = wuerfelFuer(id);
    let platz = null;
    for (let versuch = 0; versuch < 10 && !platz; versuch += 1) {
      const winkel = zufall() * Math.PI * 2;
      const weite = 90 + zufall() * 150;
      const punkt = { x: Math.round(mutter.x + Math.cos(winkel) * weite), y: Math.round(mutter.y + Math.sin(winkel) * weite * 0.7) };
      // Ableger wachsen nicht direkt auf einer anderen Pflanze.
      const platzFrei = pflanzen.every((andere) => Math.hypot(andere.x - punkt.x, (andere.y - punkt.y) * 1.4) >= ABSTAND);
      if (drin(punkt) && frei(punkt) && platzFrei) platz = punkt;
    }
    if (!platz) continue;
    const andere = arten.length > 1 && zufall() < regeln.andereArt;
    const art = andere ? arten[Math.floor(zufall() * arten.length)] : mutter.art;
    const kind = { id, art, ...platz, geboren: zeit };
    pflanzen.push(kind);
    ableger += 1;
    ablegerPlanen(kind);
  }

  const platzFuerAbleger = Math.max(1, regeln.hoechstens - gepflanzt.length);
  return {
    pflanzen: pflanzen.map((pflanze) => ({ ...pflanze, ...stufe((jetzt - pflanze.geboren) / 1000, regeln) })),
    wildheit: Math.min(1, ableger / Math.min(platzFuerAbleger, 60)),
  };
}
