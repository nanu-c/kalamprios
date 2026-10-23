// Der Beutel: Hier steckt alles, was man dabeihat: die Fangkristalle, das
// Essen aus der Küche und die Zutaten, die man draußen gesammelt hat.
// Fangkristalle und Essen kann man im Kampf benutzen (KampfSzene), Zutaten
// braucht man zum Kochen (kochen.js). Draußen kann man hineinschauen
// (WeltSzene). Was es zu essen gibt und was es im Kampf bewirkt, steht bei
// den Rezepten in daten/orte/haus.js.

import { ORTE } from './daten/orte.js';
import { spielstand } from './spielstand.js';

export const FANGKRISTALL = {
  kurzname: 'fangkristall',
  name: 'Fangkristall',
  bild: 'fangkristall',
  info: 'Wirf ihn auf ein wildes Kalamprio, um es zu fangen.',
};

// Alles Essen, das man kochen kann
export function allesEssen() {
  return Object.values(ORTE).flatMap((ort) => ort.kueche?.rezepte ?? []);
}

// Kennt man dieses Rezept? Rezepte mit fundort muss man erst finden.
export function rezeptBekannt(rezept) {
  return !rezept.fundort || spielstand.rezepteGefunden[rezept.kurzname] === true;
}

// Name und Bild einer Zutat für ein Rezept. Eine Zutat kann auch Essen sein,
// das man vorher gekocht hat. woher sagt, wo man sie bekommt:
// 'kueche' (liegt in der Küche), 'draussen' (wächst draußen) oder 'kochen'.
export function zutatInfo(kurzname) {
  for (const ort of Object.values(ORTE)) {
    const zutat = ort.kueche?.zutaten?.[kurzname];
    if (zutat) return { name: zutat.name, bild: zutat.bild, woher: zutat.wo ? 'draussen' : 'kueche', wo: zutat.wo };
  }
  const essen = allesEssen().find((rezept) => rezept.kurzname === kurzname);
  if (essen) return { name: essen.name, bild: essen.bild, woher: 'kochen' };
  return null;
}

// Alle Zutaten, die draußen wachsen (in haus.js die mit wo)
export function sammelZutaten() {
  return Object.values(ORTE).flatMap((ort) =>
    Object.entries(ort.kueche?.zutaten ?? {})
      .filter(([, zutat]) => zutat.wo)
      .map(([kurzname, zutat]) => ({ kurzname, name: zutat.name, bild: zutat.bild, info: `Zum Kochen. Wächst ${zutat.wo}.`, zutat: true })),
  );
}

// Besondere Dinge, die man nur einmal findet (besonderes beim Ort), zum
// Beispiel das Lungenkraut.
export function besondereDinge() {
  return Object.values(ORTE).flatMap((ort) =>
    (ort.besonderes ?? []).map((ding) => ({ kurzname: ding.art, name: ding.name, bild: ding.art, info: ding.info, besonders: true })),
  );
}

// Wie viele man von einer Sache hat. Die Fangkristalle zählt der Spielstand
// schon immer extra, darum stehen sie nicht in spielstand.beutel.
export function anzahl(kurzname) {
  if (kurzname === FANGKRISTALL.kurzname) return spielstand.fangkristalle;
  if (besondereDinge().some((ding) => ding.kurzname === kurzname)) return spielstand.gefunden[kurzname] ? 1 : 0;
  return spielstand.beutel[kurzname] ?? 0;
}

// Was im Beutel ist: erst die Fangkristalle, dann jedes Essen und jede
// Zutat, die man hat. Mit imKampf: true nur das, was man im Kampf benutzen kann.
export function beutelInhalt(imKampf = false) {
  return [FANGKRISTALL, ...allesEssen(), ...(imKampf ? [] : [...sammelZutaten(), ...besondereDinge()])]
    .map((sache) => ({ ...sache, anzahl: anzahl(sache.kurzname) }))
    .filter((sache) => sache.anzahl > 0);
}

// Wie viele Sachen zusammen im Beutel sind
export function sachenImBeutel(imKampf = false) {
  return beutelInhalt(imKampf).reduce((summe, sache) => summe + sache.anzahl, 0);
}

export function einpacken(kurzname, wieViele = 1) {
  if (kurzname === FANGKRISTALL.kurzname) spielstand.fangkristalle += wieViele;
  else spielstand.beutel[kurzname] = anzahl(kurzname) + wieViele;
}

export function herausnehmen(kurzname) {
  if (anzahl(kurzname) <= 0) return false;
  if (kurzname === FANGKRISTALL.kurzname) spielstand.fangkristalle -= 1;
  else spielstand.beutel[kurzname] -= 1;
  return true;
}
