// Die Regeln der Rätsel im Geheimgang. Hier wird nichts gemalt, nur gerechnet.
// Wie die Rätsel aussehen, steht in szenen/geheimraetsel.js.
//
// "zufall" ist eine Funktion, die eine Zahl zwischen 0 und 1 würfelt.

// ------------------------------------------------------- Farben mischen

// Welche Farbe herauskommt, wenn man zwei Grundfarben mischt.
// Zweimal dieselbe Farbe bleibt diese Farbe.
const MISCHUNGEN = {
  'blau gelb': 'gruen',
  'gelb rot': 'orange',
  'blau rot': 'lila',
};

export function farbenMischen(a, b) {
  if (a === b) return a;
  return MISCHUNGEN[[a, b].sort().join(' ')] ?? 'braun';
}

// Welche zwei Grundfarben man für eine Mischfarbe braucht (null: keine Mischfarbe).
export function zutatenFuerFarbe(farbe) {
  const eintrag = Object.entries(MISCHUNGEN).find(([, ergebnis]) => ergebnis === farbe);
  return eintrag ? eintrag[0].split(' ') : null;
}

// ----------------------------------------------------------- Wer ruft da?

// Sucht für eine Runde ein Kalamprio aus, das ruft, und andere, die anders
// klingen. stimmeVon sagt für jeden Kurznamen, wie es klingt (zum Beispiel
// 'piepsen hoch'). Zurück kommt { gesucht, auswahl }: auswahl ist
// durcheinander und enthält das gesuchte.
export function stimmenRunde(kurznamen, stimmeVon, anzahl, zufall = Math.random) {
  const gemischt = durcheinanderListe(kurznamen, zufall);
  const gesucht = gemischt[0];
  const schonDa = new Set([stimmeVon(gesucht)]);
  const auswahl = [gesucht];
  for (const kurzname of gemischt.slice(1)) {
    if (auswahl.length >= anzahl) break;
    const stimme = stimmeVon(kurzname);
    // Nur Kalamprios, die man am Klang auseinanderhalten kann
    if (schonDa.has(stimme)) continue;
    schonDa.add(stimme);
    auswahl.push(kurzname);
  }
  return { gesucht, auswahl: durcheinanderListe(auswahl, zufall) };
}

// ------------------------------------------------------------ Bilderpaare

// Legt die Bilder für das Bilderpaare-Spiel: Jedes Bild kommt zweimal vor,
// alles gut gemischt. felder ist die Anzahl der Felder (eine gerade Zahl).
export function paareLegen(bilder, felder, zufall = Math.random) {
  const paare = durcheinanderListe(bilder, zufall).slice(0, felder / 2);
  return durcheinanderListe([...paare, ...paare], zufall);
}

// ------------------------------------------------------ Der geheime Weg

// Würfelt einen Weg über ein Raster von spalten mal reihen Feldern: Er
// beginnt irgendwo in der linken Spalte und endet in der rechten. Er geht
// nach rechts, oben oder unten, nie zurück und nie zweimal über dasselbe Feld.
// Zurück kommt eine Liste von Feldern { spalte, reihe } in der Reihenfolge des Weges.
export function wegWuerfeln(spalten, reihen, zufall = Math.random) {
  const weg = [{ spalte: 0, reihe: Math.floor(zufall() * reihen) }];
  const besucht = new Set([`0 ${weg[0].reihe}`]);
  let bisherHoch = 0; // so oft ist der Weg in dieser Spalte schon nach oben oder unten gegangen
  while (weg.at(-1).spalte < spalten - 1) {
    const { spalte, reihe } = weg.at(-1);
    const moeglich = [];
    for (const schritt of [-1, 1]) {
      const neu = reihe + schritt;
      if (neu >= 0 && neu < reihen && !besucht.has(`${spalte} ${neu}`) && bisherHoch < 2) moeglich.push({ spalte, reihe: neu });
    }
    // Nach rechts geht es immer. Hoch und runter kommt oft dran, damit der Weg Kurven hat.
    const rechts = { spalte: spalte + 1, reihe };
    const naechstes = moeglich.length > 0 && zufall() < 0.55 ? moeglich[Math.floor(zufall() * moeglich.length)] : rechts;
    bisherHoch = naechstes === rechts ? 0 : bisherHoch + 1;
    besucht.add(`${naechstes.spalte} ${naechstes.reihe}`);
    weg.push(naechstes);
  }
  return weg;
}

// ------------------------------------------------------- Der Lichtstrahl

// Die Richtungen, in die der Strahl laufen kann.
export const RICHTUNGEN = {
  rechts: { x: 1, y: 0 },
  links: { x: -1, y: 0 },
  oben: { x: 0, y: -1 },
  unten: { x: 0, y: 1 },
};

// Wie ein Spiegel den Strahl umlenkt. '/' und '\' sind die zwei Stellungen.
const UMLENKEN = {
  '/': { rechts: 'oben', oben: 'rechts', links: 'unten', unten: 'links' },
  '\\': { rechts: 'unten', unten: 'rechts', links: 'oben', oben: 'links' },
};

// Verfolgt den Lichtstrahl durch das Raster. start ist das erste Feld mit
// der Richtung, in die der Strahl läuft. spiegel ist eine Liste von
// { spalte, reihe, stellung }. Zurück kommt der Weg des Strahls (die Felder,
// durch die er läuft) und wo er das Raster verlässt: { spalte, reihe, richtung }
// des letzten Feldes. Läuft er im Kreis, hört er auf.
export function strahlVerfolgen(spalten, reihen, start, spiegel) {
  const spiegelBei = new Map(spiegel.map((s) => [`${s.spalte} ${s.reihe}`, s]));
  const felder = [];
  let { spalte, reihe, richtung } = start;
  const gesehen = new Set();
  while (spalte >= 0 && spalte < spalten && reihe >= 0 && reihe < reihen) {
    const merk = `${spalte} ${reihe} ${richtung}`;
    if (gesehen.has(merk)) break;
    gesehen.add(merk);
    const hier = spiegelBei.get(`${spalte} ${reihe}`);
    const vorher = richtung;
    if (hier) richtung = UMLENKEN[hier.stellung][richtung];
    felder.push({ spalte, reihe, rein: vorher, raus: richtung });
    spalte += RICHTUNGEN[richtung].x;
    reihe += RICHTUNGEN[richtung].y;
  }
  const letztes = felder.at(-1);
  return { felder, ende: letztes ? { spalte: letztes.spalte, reihe: letztes.reihe, richtung: letztes.raus } : null };
}

export function spiegelDrehen(stellung) {
  return stellung === '/' ? '\\' : '/';
}

// --------------------------------------------------------- Alle Lichter an

// Tritt man auf ein Feld, wechseln dieses Feld und seine vier Nachbarn
// (oben, unten, links, rechts): Was an war, geht aus, und umgekehrt.
// felder ist eine Liste aus true (an) und false (aus), Reihe für Reihe.
export function lichterTreten(felder, spalten, nummer) {
  const neu = [...felder];
  const spalte = nummer % spalten;
  const reihe = Math.floor(nummer / spalten);
  const reihen = felder.length / spalten;
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = spalte + dx;
    const y = reihe + dy;
    if (x >= 0 && x < spalten && y >= 0 && y < reihen) neu[y * spalten + x] = !neu[y * spalten + x];
  }
  return neu;
}

// Würfelt, wie die Lichter am Anfang stehen: Von "alle an" aus wird auf
// tritte verschiedene Felder getreten. So kann man es immer schaffen, indem
// man genau auf diese Felder tritt. Nie sind am Anfang schon alle an.
export function lichterWuerfeln(spalten, reihen, tritte, zufall = Math.random) {
  for (;;) {
    let felder = Array(spalten * reihen).fill(true);
    for (const nummer of durcheinanderListe([...felder.keys()], zufall).slice(0, tritte)) {
      felder = lichterTreten(felder, spalten, nummer);
    }
    if (!felder.every(Boolean)) return felder;
  }
}

// ---------------------------------------------------------------- Helfer

// Gibt die Liste gut gemischt zurück (die Liste selbst bleibt, wie sie ist).
export function durcheinanderListe(liste, zufall = Math.random) {
  const neu = [...liste];
  for (let i = neu.length - 1; i > 0; i -= 1) {
    const j = Math.floor(zufall() * (i + 1));
    [neu[i], neu[j]] = [neu[j], neu[i]];
  }
  return neu;
}
