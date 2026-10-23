// Prüft die Dateien im Ordner daten auf Tippfehler und erklärt sie auf Deutsch.
// Das Spiel zeigt diese Hinweise auf dem Bildschirm, statt einfach kaputtzugehen.

import { ATTACKEN } from './attacken.js';
import { CHARAKTERE } from './charaktere.js';
import { ELEMENTE } from './elemente.js';
import { GESCHICHTE } from './geschichte.js';
import { KALAMPRIOS } from './kalamprios.js';
import { HOEHEN, KLAENGE, STIMMEN } from './klaenge.js';
import { LIEDER } from '../klang/lieder.js';
import { ORTE, START_ORT } from './orte.js';
import { REGELN } from './regeln.js';

const ZAHLEN = ['kp', 'angriff', 'verteidigung', 'tempo'];
const BLICKE = ['vorne', 'links', 'rechts'];
const STILE = ['dorf', 'wald', 'mine', 'see', 'gang', 'haus', 'wasser', 'regenwald'];
const TUER_ARTEN = ['haustuer', 'treppe', 'pilzring', 'tauchplatz', 'portal'];
const SEITEN = ['links', 'rechts', 'oben', 'unten'];
// Wie Attacken außer den Elementen noch aussehen können (siehe attacken.js).
const AUSSEHEN = ['herz', 'strahl', 'traum', 'krallen', 'blitzschlag', 'biss', 'wirbel', 'faden', 'bombe', 'hieb', 'krone'];
const RAETSEL_ARTEN = ['suchen', 'reihenfolge', 'frage', 'farben', 'stimmen', 'paare', 'weg', 'spiegel', 'lichter'];
const GRUNDFARBEN = ['rot', 'gelb', 'blau'];
const MISCHFARBEN = ['orange', 'gruen', 'lila'];
// Die Farben aus szenen/raetsel.js
const RAETSEL_FARBEN = ['rot', 'gelb', 'blau', 'gruen', 'lila', 'weiss'];

export function datenPruefen() {
  const fehler = [];

  for (const [kurzname, attacke] of Object.entries(ATTACKEN)) {
    if (!(attacke.staerke > 0)) {
      fehler.push(`Attacke "${kurzname}": staerke muss eine Zahl größer als 0 sein.`);
    }
    if (!Number.isInteger(attacke.pause) || attacke.pause < 0) {
      fehler.push(`Attacke "${kurzname}": pause muss 0 oder eine ganze Zahl sein.`);
    }
    if (attacke.effekt !== undefined && !ELEMENTE[attacke.effekt] && !AUSSEHEN.includes(attacke.effekt)) {
      fehler.push(`Attacke "${kurzname}": Den effekt "${attacke.effekt}" gibt es nicht. Nimm einen Kurznamen aus elemente.js oder einen von oben aus attacken.js.`);
    }
  }

  for (const tier of Object.values(KALAMPRIOS)) {
    if (!ELEMENTE[tier.element]) {
      fehler.push(`${tier.name}: Das Element "${tier.element}" steht nicht in elemente.js.`);
    }
    if (!BLICKE.includes(tier.blick)) {
      fehler.push(`${tier.name}: blick muss 'vorne', 'links' oder 'rechts' sein.`);
    }
    for (const wert of ZAHLEN) {
      if (!(tier[wert] > 0)) {
        fehler.push(`${tier.name}: ${wert} muss eine Zahl größer als 0 sein.`);
      }
    }

    const attacken = tier.attacken ?? [];
    const unbekannt = attacken.filter((attacke) => !ATTACKEN[attacke]);
    for (const attacke of unbekannt) {
      fehler.push(`${tier.name}: Die Attacke "${attacke}" steht nicht in attacken.js.`);
    }
    if (unbekannt.length === 0 && !attacken.some((attacke) => ATTACKEN[attacke].pause === 0)) {
      fehler.push(`${tier.name} braucht mindestens eine Attacke mit pause: 0.`);
    }
  }

  if (Object.keys(KALAMPRIOS).length < 2) {
    fehler.push('Für einen Kampf braucht es mindestens zwei Kalamprios in kalamprios.js.');
  }
  if (Object.keys(CHARAKTERE).length < 2) {
    fehler.push('Es braucht mindestens zwei Figuren in charaktere.js: eine zum Spielen und eine Rivalin.');
  }

  for (const name of ['fangChanceGesund', 'fangChanceSchwach']) {
    if (!(REGELN[name] >= 0 && REGELN[name] <= 1)) {
      fehler.push(`regeln.js: ${name} muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.5.`);
    }
  }
  if (!(Number.isInteger(REGELN.fangkristalleAmAnfang) && REGELN.fangkristalleAmAnfang >= 0)) {
    fehler.push('regeln.js: fangkristalleAmAnfang muss 0 oder eine ganze Zahl sein.');
  }

  const stufen = REGELN.erfahrungFuerLevel;
  const aufsteigend = Array.isArray(stufen) && stufen.every((noetig, nummer) => Number.isInteger(noetig) && (nummer === 0 ? noetig === 0 : noetig > stufen[nummer - 1]));
  if (!aufsteigend || stufen.length === 0) {
    fehler.push('regeln.js: erfahrungFuerLevel muss mit 0 anfangen und dann immer größer werden, zum Beispiel [0, 5, 15].');
  }
  const staerken = REGELN.staerkeJeLevel;
  if (!(Array.isArray(staerken) && staerken.length >= (stufen?.length ?? 0) && staerken.every((staerke) => staerke > 0))) {
    fehler.push('regeln.js: staerkeJeLevel braucht für jedes Level eine Zahl größer als 0, mindestens so viele wie bei erfahrungFuerLevel, zum Beispiel [1, 1.35, 1.75, 2, 2.3].');
  } else if (!(Number.isInteger(REGELN.geheimesLevel) && REGELN.geheimesLevel >= 1 && REGELN.geheimesLevel <= staerken.length)) {
    fehler.push(`regeln.js: geheimesLevel muss eine ganze Zahl von 1 bis ${staerken.length} sein. Für jedes Level braucht es eine Zahl bei staerkeJeLevel.`);
  }
  if (!(Number.isInteger(REGELN.levelFuerGeheimes) && REGELN.levelFuerGeheimes >= 1 && REGELN.levelFuerGeheimes <= (stufen?.length ?? 1))) {
    fehler.push(`regeln.js: levelFuerGeheimes muss eine ganze Zahl von 1 bis ${stufen?.length ?? 1} sein, sonst kann man das geheime Kalamprio nie besiegen.`);
  }

  if (!(REGELN.schadenMal > 0)) {
    fehler.push('regeln.js: schadenMal muss eine Zahl größer als 0 sein, zum Beispiel 1.6.');
  }
  if (!(REGELN.wildeAufLevel1 > 0 && REGELN.wildeAufLevel1 <= 2)) {
    fehler.push('regeln.js: wildeAufLevel1 muss eine Zahl größer als 0 sein, zum Beispiel 0.9.');
  }
  for (const name of ['danebenChance', 'ausweichChance', 'abwehrChance', 'abgewehrtSchaden']) {
    if (!(REGELN[name] >= 0 && REGELN[name] <= 1)) {
      fehler.push(`regeln.js: ${name} muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.1.`);
    }
  }
  if (REGELN.danebenChance + REGELN.ausweichChance * 2 + REGELN.abwehrChance > 0.9) {
    fehler.push('regeln.js: danebenChance, ausweichChance und abwehrChance sind zusammen zu groß. Dann trifft fast nie eine Attacke.');
  }

  for (const name of ['schadenZufall', 'tempoZufall']) {
    if (!(REGELN[name] >= 0 && REGELN[name] < 1)) {
      fehler.push(`regeln.js: ${name} muss eine Zahl von 0 bis knapp unter 1 sein, zum Beispiel 0.3.`);
    }
  }

  if (Object.values(KALAMPRIOS).filter((tier) => tier.zumStart).length < 2) {
    fehler.push('Es braucht mindestens zwei Kalamprios mit zumStart: true: eins für dich und eins für die Rivalin.');
  }

  if (!ORTE[START_ORT]?.start) {
    fehler.push(`orte.js: Der Startort "${START_ORT}" braucht einen start-Punkt.`);
  }
  if (!Object.values(ORTE).some((ort) => ort.rivalin)) {
    fehler.push('Irgendein Ort braucht einen rivalin-Punkt, damit die Rivalin wartet.');
  }
  for (const [kurzname, ort] of Object.entries(ORTE)) fehler.push(...ortPruefen(kurzname, ort));

  if (!(GESCHICHTE.anfang?.length > 0)) {
    fehler.push('geschichte.js: Bei anfang braucht es mindestens einen Satz.');
  }
  if (!(GESCHICHTE.ende?.length > 0)) {
    fehler.push('geschichte.js: Bei ende braucht es mindestens einen Satz.');
  }
  if (!(Number.isInteger(REGELN.imKampfHoechstens) && REGELN.imKampfHoechstens >= 1)) {
    fehler.push('regeln.js: imKampfHoechstens muss eine ganze Zahl ab 1 sein, zum Beispiel 3.');
  } else if (REGELN.teamFuerGeheimes > REGELN.imKampfHoechstens) {
    fehler.push('regeln.js: teamFuerGeheimes darf nicht größer sein als imKampfHoechstens, sonst kann man das geheime Kalamprio nie besiegen.');
  }
  if (!(Number.isInteger(REGELN.teamFuerRivalin) && REGELN.teamFuerRivalin >= 1 && REGELN.teamFuerRivalin <= REGELN.imKampfHoechstens)) {
    fehler.push('regeln.js: teamFuerRivalin muss eine ganze Zahl ab 1 sein und darf nicht größer sein als imKampfHoechstens.');
  }
  if (!(Number.isInteger(REGELN.teamFuerGeheimes) && REGELN.teamFuerGeheimes >= 1)) {
    fehler.push('regeln.js: teamFuerGeheimes muss eine ganze Zahl ab 1 sein, zum Beispiel 3.');
  }
  for (const [kurzname, saetze] of Object.entries(GESCHICHTE.orte ?? {})) {
    if (!ORTE[kurzname]) {
      fehler.push(`geschichte.js: Den Ort "${kurzname}" gibt es nicht in orte.js.`);
    } else if (!ORTE[kurzname].dunklerKristall) {
      fehler.push(`${ORTE[kurzname].name} braucht einen dunklerKristall, der die Geschichte erzählt.`);
    } else if (!(saetze.length > 0)) {
      fehler.push(`geschichte.js: Bei ${kurzname} braucht es mindestens einen Satz.`);
    }
  }
  fehler.push(...klaengePruefen());
  return fehler;
}

function klaengePruefen() {
  const fehler = [];
  for (const name of ['musik', 'musikImKampf', 'geraeusche']) {
    if (!(KLAENGE[name] >= 0 && KLAENGE[name] <= 1)) {
      fehler.push(`klaenge.js: ${name} muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.5.`);
    }
  }
  const kampflieder = KLAENGE.kampflieder;
  if (!(Array.isArray(kampflieder) && kampflieder.length > 0)) {
    fehler.push("klaenge.js: Bei kampflieder muss mindestens ein Lied stehen, zum Beispiel ['kampf'].");
  }
  for (const lied of kampflieder ?? []) {
    if (!LIEDER[lied]) fehler.push(`klaenge.js: Das Kampflied "${lied}" steht nicht in src/klang/lieder.js.`);
  }
  if (!(KLAENGE.hoerweite > 0)) {
    fehler.push('klaenge.js: hoerweite muss eine Zahl größer als 0 sein, zum Beispiel 650.');
  }
  for (const [kurzname, ruf] of Object.entries(KLAENGE.rufe ?? {})) {
    if (!KALAMPRIOS[kurzname]) {
      fehler.push(`klaenge.js: Das Kalamprio "${kurzname}" steht nicht in kalamprios.js.`);
      continue;
    }
    const name = KALAMPRIOS[kurzname].name;
    if (!STIMMEN.includes(ruf.stimme)) {
      fehler.push(`klaenge.js: Die stimme "${ruf.stimme}" bei ${name} gibt es nicht. Oben in klaenge.js steht, welche es gibt.`);
    }
    if (!(ruf.hoehe in HOEHEN)) {
      fehler.push(`klaenge.js: hoehe bei ${name} muss 'tief', 'mittel', 'hoch' oder 'ganz hoch' sein.`);
    }
    if (!(Number.isInteger(ruf.silben) && ruf.silben >= 1 && ruf.silben <= 6)) {
      fehler.push(`klaenge.js: silben bei ${name} muss eine ganze Zahl von 1 bis 6 sein.`);
    }
  }
  return fehler;
}

function ortPruefen(kurzname, ort) {
  const fehler = [];
  const liste = (feld) => ort[feld] ?? [];
  const name = ort.name ?? kurzname;
  if (!STILE.includes(ort.stil)) {
    fehler.push(`${name}: stil muss 'dorf', 'wald', 'mine', 'see', 'gang', 'haus', 'wasser' oder 'regenwald' sein.`);
  }

  const geheimes = ort.geheimesImGras;
  const tiere = [
    ...ort.wildeKalamprios.map((wild) => wild.art),
    ...ort.tiereImGras,
    ...(geheimes ? [geheimes.art] : []),
  ];
  for (const art of new Set(tiere)) {
    if (!KALAMPRIOS[art]) {
      fehler.push(`${name}: Das Kalamprio "${art}" steht nicht in kalamprios.js.`);
    }
  }
  if (ort.hohesGras.length > 0 && ort.tiereImGras.length === 0) {
    fehler.push(`${name}: Im hohen Gras wohnt niemand. Trag Tiere bei tiereImGras ein.`);
  }
  const hoechstes = REGELN.erfahrungFuerLevel?.length ?? 1;
  if (ort.wildesLevel !== undefined && !(Number.isInteger(ort.wildesLevel) && ort.wildesLevel >= 1 && ort.wildesLevel <= hoechstes)) {
    fehler.push(`${name}: wildesLevel muss eine ganze Zahl von 1 bis ${hoechstes} sein.`);
  }
  if (geheimes?.spaetestensNach !== undefined && !(Number.isInteger(geheimes.spaetestensNach) && geheimes.spaetestensNach >= 0)) {
    fehler.push(`${name}: spaetestensNach beim geheimen Kalamprio muss 0 oder eine ganze Zahl sein, zum Beispiel 3.`);
  }
  if (ort.dunkel !== undefined && !(ort.dunkel >= 0 && ort.dunkel <= 1)) {
    fehler.push(`${name}: dunkel muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.8.`);
  }
  if (ort.nebel !== undefined && !(ort.nebel >= 0 && ort.nebel <= 1)) {
    fehler.push(`${name}: nebel muss eine Zahl von 0 bis 1 sein, zum Beispiel 0.5.`);
  }
  if (ort.licht !== undefined && !(ort.licht > 0)) {
    fehler.push(`${name}: licht muss eine Zahl größer als 0 sein, zum Beispiel 0.7.`);
  }
  for (const see of liste('seen')) {
    if (see.bild !== undefined && see.bild !== 'mondsee') {
      fehler.push(`${name}: Ein See-Bild "${see.bild}" gibt es nicht. Nimm 'mondsee' oder lass bild weg.`);
    }
  }
  if (geheimes && !(geheimes.chance >= 0 && geheimes.chance <= 1)) {
    fehler.push(`${name}: Die chance beim geheimen Kalamprio muss von 0 bis 1 gehen, zum Beispiel 0.04.`);
  }

  for (const ausgang of ort.ausgaenge ?? []) {
    const ziel = ORTE[ausgang.nach];
    if (!ziel) {
      fehler.push(`${name}: Der Ausgang führt nach "${ausgang.nach}", aber diesen Ort gibt es nicht in orte.js.`);
      continue;
    }
    if (!SEITEN.includes(ausgang.seite)) {
      fehler.push(`${name}: Beim Ausgang nach ${ziel.name} muss seite 'links', 'rechts', 'oben' oder 'unten' sein.`);
    }
    const laenge = ausgang.seite === 'links' || ausgang.seite === 'rechts' ? ort.hoehe : ort.breite;
    if (!(ausgang.mitte >= 0 && ausgang.mitte <= laenge)) {
      fehler.push(`${name}: Beim Ausgang nach ${ziel.name} liegt mitte außerhalb des Ortes.`);
    }
    if (ausgang.erstNachRivalin && !ort.rivalin) {
      fehler.push(`${name}: Den Ausgang nach ${ziel.name} soll die Rivalin bewachen, aber hier gibt es keinen rivalin-Punkt.`);
    }
    if (ausgang.erstNachRaetsel && !ort.raetsel) {
      fehler.push(`${name}: Der Ausgang nach ${ziel.name} soll erst nach dem Rätsel frei werden, aber hier gibt es kein Rätsel.`);
    }
    const zurueck = [...(ziel.ausgaenge ?? []), ...(ziel.tueren ?? [])].some(
      (weg) => weg.nach === kurzname || (weg.zurueckVon ?? []).includes(kurzname),
    );
    if (!zurueck) fehler.push(`${ziel.name} braucht einen Ausgang oder eine Tür zurück nach "${kurzname}".`);
  }

  if (ort.rivalinAmAnfang) {
    const essen = Object.values(ORTE).flatMap((anderer) => anderer.kueche?.rezepte ?? []);
    if (!essen.some((rezept) => rezept.kurzname === ort.rivalinAmAnfang.wuenscht)) {
      fehler.push(`${name}: Bei rivalinAmAnfang wünscht sie sich "${ort.rivalinAmAnfang.wuenscht}", aber so ein Rezept gibt es nicht in haus.js.`);
    }
  }
  for (const tuer of ort.tueren ?? []) {
    const ziel = ORTE[tuer.nach];
    if (!ziel) {
      fehler.push(`${name}: Eine Tür führt nach "${tuer.nach}", aber diesen Ort gibt es nicht in orte.js.`);
      continue;
    }
    if (!TUER_ARTEN.includes(tuer.art)) {
      fehler.push(`${name}: Bei der Tür nach ${ziel.name} muss art 'haustuer', 'treppe', 'pilzring', 'tauchplatz' oder 'portal' sein.`);
    }
    const besondere = Object.values(ORTE).flatMap((anderer) => (anderer.besonderes ?? []).map((ding) => ding.art));
    if (tuer.braucht && !besondere.includes(tuer.braucht)) {
      fehler.push(`${name}: Die Tür nach ${ziel.name} braucht "${tuer.braucht}", aber so ein besonderes Ding gibt es nirgends (besonderes).`);
    }
    const zurueck = [...(ziel.ausgaenge ?? []), ...(ziel.tueren ?? [])].some(
      (weg) => weg.nach === kurzname || (weg.zurueckVon ?? []).includes(kurzname),
    );
    if (!zurueck) fehler.push(`${ziel.name} braucht einen Ausgang oder eine Tür zurück nach "${kurzname}".`);
  }
  for (const [art, zutat] of Object.entries(ort.kueche?.zutaten ?? {})) {
    if (!(zutat.name && zutat.bild)) fehler.push(`${name}: Die Zutat "${art}" braucht einen name und ein bild.`);
    if (zutat.wo === undefined && !(Number.isFinite(zutat.x) && Number.isFinite(zutat.y))) {
      fehler.push(`${name}: Die Zutat "${art}" braucht x und y (dann liegt sie in der Küche) oder wo (dann wächst sie draußen).`);
    }
  }
  const draussen = Object.values(ORTE).flatMap((anderer) => Object.entries(anderer.kueche?.zutaten ?? {}).filter(([, zutat]) => zutat.wo).map(([art]) => art));
  for (const punkt of liste('zutaten')) {
    if (!draussen.includes(punkt.art)) {
      fehler.push(`${name}: Die Zutat "${punkt.art}" gibt es nicht. Nimm eine aus haus.js, die draußen wächst: ${draussen.join(', ')}.`);
    }
  }
  const rezepte = ort.kueche?.rezepte ?? [];
  const rezeptMit = (kurzname) => rezepte.find((anderes) => anderes.kurzname === kurzname);
  // Braucht ein Rezept (über andere Rezepte) am Ende sich selbst? Dann kann man es nie kochen.
  const imKreis = (rezept, unterwegs = []) =>
    unterwegs.includes(rezept.kurzname) ||
    rezept.zutaten.some((art) => rezeptMit(art) && imKreis(rezeptMit(art), [...unterwegs, rezept.kurzname]));
  for (const rezept of rezepte) {
    for (const art of rezept.zutaten ?? []) {
      if (!ort.kueche.zutaten?.[art] && !rezeptMit(art)) {
        fehler.push(`${name}: Für ${rezept.name} braucht es "${art}", aber das steht weder bei zutaten noch bei den Rezepten.`);
      }
    }
    if (rezept.zutaten?.length > 0 && imKreis(rezept)) {
      fehler.push(`${name}: ${rezept.name} braucht am Ende sich selbst als Zutat. So kann man es nie kochen.`);
    }
    if (rezept.fundort) {
      const fundort = ORTE[rezept.fundort.ort];
      if (!fundort) fehler.push(`${name}: Das Rezept ${rezept.name} liegt bei fundort in "${rezept.fundort.ort}", aber diesen Ort gibt es nicht.`);
      else if (!(rezept.fundort.x >= 0 && rezept.fundort.x <= fundort.breite && rezept.fundort.y >= 0 && rezept.fundort.y <= fundort.hoehe)) {
        fehler.push(`${name}: Das Rezept ${rezept.name} liegt außerhalb von ${fundort.name}.`);
      }
    }
    if (!(rezept.zutaten?.length > 0)) fehler.push(`${name}: Das Rezept ${rezept.name} braucht mindestens eine Zutat.`);
    if (!/^[a-z]+$/.test(rezept.kurzname ?? '')) fehler.push(`${name}: Das Rezept ${rezept.name} braucht einen kurznamen aus Kleinbuchstaben, zum Beispiel 'mondsuppe'.`);
    const { heilen, staerker, wecken } = rezept.imKampf ?? {};
    if (!((heilen > 0 && heilen <= 1) || staerker > 1 || (wecken > 0 && wecken <= 1))) {
      fehler.push(
        `${name}: Beim Rezept ${rezept.name} braucht imKampf heilen (von 0 bis 1, zum Beispiel 0.5), staerker (größer als 1, zum Beispiel 1.5) oder wecken (von 0 bis 1).`,
      );
    }
  }

  const punkte = [
    ['start', ort.start],
    ['rivalin', ort.rivalin],
    ['rivalinNachSieg', ort.rivalinNachSieg],
    ['dunklerKristall', ort.dunklerKristall],
    ...ort.wildeKalamprios.map((wild) => [`das wilde Kalamprio "${wild.art}"`, wild]),
    ...liste('baeume').map((punkt) => ['ein Baum', punkt]),
    ...liste('kristalle').map((punkt) => ['ein Kristall', punkt]),
    ...liste('pilze').map((punkt) => ['ein Pilz', punkt]),
    ...liste('felsen').map((punkt) => ['ein Felsen', punkt]),
    ...liste('prismastahl').map((punkt) => ['ein Prismastahl', punkt]),
    ...liste('haeuser').map((punkt) => ['ein Haus', punkt]),
    ...liste('gold').map((punkt) => ['ein Gold', punkt]),
    ...liste('fangkristalle').map((punkt) => ['ein Fangkristall', punkt]),
    ...liste('tueren').map((punkt) => [`die Tür nach "${punkt.nach}"`, punkt]),
    ...liste('besonderes').map((punkt) => [`das besondere Ding "${punkt.art}"`, punkt]),
    ...liste('pflanzen').map((punkt) => [`die Pflanze "${punkt.name}"`, punkt]),
    ...(ort.album ? [['das Pflanzenalbum', ort.album]] : []),
    ...(ort.muellQuest ? [['die Muschel', ort.muellQuest.muschel], ...ort.muellQuest.muell.map((punkt) => [`der Müll "${punkt.art}"`, punkt])] : []),
    ...Object.values(ort.kueche?.zutaten ?? {}).filter((punkt) => punkt.wo === undefined).map((punkt) => [`die Zutat ${punkt.name}`, punkt]),
    ...liste('zutaten').map((punkt) => [`die Zutat "${punkt.art}"`, punkt]),
    ...(ort.kueche ? [['der Herd', ort.kueche.herd]] : []),
    ...(ort.schatz ? [['die Schatztruhe', ort.schatz]] : []),
    ...liste('seen').map((punkt) => ['ein See', punkt]),
    ...(ort.raetsel ? [['der Rätselstein', ort.raetsel]] : []),
    ...(ort.raetsel?.dinge ?? []).map((punkt) => ['ein Ding beim Rätsel', punkt]),
    ...(ort.raetsel?.steine ?? []).map((punkt) => ['ein Klangstein beim Rätsel', punkt]),
  ].filter(([, punkt]) => punkt);
  if (ort.raetsel) fehler.push(...raetselPruefen(name, ort.raetsel));

  for (const [was, punkt] of punkte) {
    const drin = punkt.x >= 0 && punkt.x <= ort.breite && punkt.y >= 0 && punkt.y <= ort.hoehe;
    if (!drin) {
      fehler.push(`${name}: ${was} liegt bei x ${punkt.x}, y ${punkt.y} und damit außerhalb des Ortes.`);
    }
  }
  return fehler;
}

function raetselPruefen(name, raetsel) {
  const fehler = [];
  const satzListe = (saetze) => Array.isArray(saetze) && saetze.length > 0 && saetze.every((satz) => typeof satz === 'string');
  if (!RAETSEL_ARTEN.includes(raetsel.art)) {
    fehler.push(`${name}: Beim Rätsel muss art 'suchen', 'reihenfolge' oder 'frage' sein.`);
  }
  if (!satzListe(raetsel.aufgabe)) {
    fehler.push(`${name}: Beim Rätsel braucht aufgabe mindestens einen Satz in Anführungszeichen.`);
  }
  if (typeof raetsel.geschafft !== 'string') {
    fehler.push(`${name}: Beim Rätsel braucht geschafft einen Satz in Anführungszeichen.`);
  }
  const kristalle = raetsel.belohnung?.fangkristalle;
  if (kristalle !== undefined && !(Number.isInteger(kristalle) && kristalle >= 0)) {
    fehler.push(`${name}: Bei der Belohnung vom Rätsel muss fangkristalle 0 oder eine ganze Zahl sein.`);
  }

  if (raetsel.art === 'suchen') {
    if (!(raetsel.dinge?.length > 0)) fehler.push(`${name}: Beim Such-Rätsel braucht es mindestens ein Ding bei dinge.`);
    if (raetsel.farbe !== undefined && !RAETSEL_FARBEN.includes(raetsel.farbe)) {
      fehler.push(`${name}: Die Farbe "${raetsel.farbe}" beim Rätsel gibt es nicht. Nimm ${RAETSEL_FARBEN.join(', ')}.`);
    }
  }
  if (raetsel.art === 'reihenfolge') {
    if (!(raetsel.steine?.length >= 2)) fehler.push(`${name}: Beim Reihenfolge-Rätsel braucht es mindestens zwei Klangsteine bei steine.`);
    const runden = raetsel.runden ?? [raetsel.steine?.length ?? 0];
    if (!(Array.isArray(runden) && runden.length > 0 && runden.every((anzahl) => Number.isInteger(anzahl) && anzahl >= 1))) {
      fehler.push(`${name}: Beim Reihenfolge-Rätsel muss runden eine Liste mit ganzen Zahlen sein, zum Beispiel [3, 4, 5].`);
    }
    for (const stein of raetsel.steine ?? []) {
      if (!RAETSEL_FARBEN.includes(stein.farbe)) {
        fehler.push(`${name}: Die Farbe "${stein.farbe}" bei einem Klangstein gibt es nicht. Nimm ${RAETSEL_FARBEN.join(', ')}.`);
      }
    }
  }
  if (raetsel.art === 'farben') {
    if (!raetsel.kessel) fehler.push(`${name}: Beim Farben-Rätsel braucht es einen kessel.`);
    if (!(raetsel.toepfe?.length > 0 && raetsel.toepfe.every((topf) => GRUNDFARBEN.includes(topf.farbe)))) {
      fehler.push(`${name}: Beim Farben-Rätsel braucht jeder Farbtopf bei toepfe eine farbe: 'rot', 'gelb' oder 'blau'.`);
    }
    if (!(raetsel.runden?.length > 0 && raetsel.runden.every((farbe) => MISCHFARBEN.includes(farbe)))) {
      fehler.push(`${name}: Beim Farben-Rätsel stehen bei runden Mischfarben: 'orange', 'gruen' oder 'lila'.`);
    }
  }
  if (raetsel.art === 'stimmen') {
    if (!raetsel.muschel) fehler.push(`${name}: Beim Rufe-Rätsel braucht es eine muschel.`);
    if (!(raetsel.platten?.length >= 2)) fehler.push(`${name}: Beim Rufe-Rätsel braucht es mindestens zwei platten.`);
    if (!(Number.isInteger(raetsel.runden) && raetsel.runden >= 1)) fehler.push(`${name}: Beim Rufe-Rätsel muss runden eine ganze Zahl ab 1 sein.`);
  }
  if (raetsel.art === 'paare') {
    const anzahl = raetsel.spalten * raetsel.reihen;
    const tiere = Object.values(KALAMPRIOS).filter((tier) => !tier.geheim).length;
    if (!(Number.isInteger(anzahl) && anzahl >= 2 && anzahl % 2 === 0 && anzahl / 2 <= tiere)) {
      fehler.push(`${name}: Beim Bilderpaare-Rätsel muss spalten mal reihen eine gerade Zahl sein, höchstens ${tiere * 2}.`);
    }
  }
  if (raetsel.art === 'weg' || raetsel.art === 'spiegel') {
    if (!(raetsel.spalten >= 2 && raetsel.reihen >= 2 && raetsel.groesse > 0)) {
      fehler.push(`${name}: Beim Rätsel braucht es spalten, reihen (jeweils mindestens 2) und eine groesse.`);
    }
  }
  if (raetsel.art === 'spiegel') {
    for (const spiegel of raetsel.spiegel ?? []) {
      if (!['/', '\\'].includes(spiegel.stellung)) fehler.push(`${name}: Ein Spiegel braucht bei stellung '/' oder '\\\\'.`);
      if (!(spiegel.spalte >= 0 && spiegel.spalte < raetsel.spalten && spiegel.reihe >= 0 && spiegel.reihe < raetsel.reihen)) {
        fehler.push(`${name}: Ein Spiegel steht bei spalte ${spiegel.spalte}, reihe ${spiegel.reihe}, das ist außerhalb des Rasters.`);
      }
    }
    for (const reihe of [raetsel.startReihe, raetsel.zielReihe]) {
      if (!(Number.isInteger(reihe) && reihe >= 0 && reihe < raetsel.reihen)) fehler.push(`${name}: startReihe und zielReihe müssen Reihen im Raster sein.`);
    }
  }
  if (raetsel.art === 'lichter') {
    if (!raetsel.neustart) fehler.push(`${name}: Beim Lichter-Rätsel braucht es einen neustart-Stein.`);
    if (!(raetsel.runden?.length > 0 && raetsel.runden.every((tritte) => Number.isInteger(tritte) && tritte >= 1 && tritte <= 9))) {
      fehler.push(`${name}: Beim Lichter-Rätsel muss runden eine Liste mit Zahlen von 1 bis 9 sein, zum Beispiel [3, 5].`);
    }
  }
  if (raetsel.art === 'frage') {
    if (!(raetsel.fragen?.length > 0)) fehler.push(`${name}: Beim Frage-Rätsel braucht es mindestens eine Frage bei fragen.`);
    const wieViele = raetsel.wieViele ?? raetsel.fragen?.length;
    if (!(Number.isInteger(wieViele) && wieViele >= 1 && wieViele <= (raetsel.fragen?.length ?? 0))) {
      fehler.push(`${name}: Beim Frage-Rätsel muss wieViele eine ganze Zahl ab 1 sein und darf nicht größer sein, als es Fragen gibt.`);
    }
    for (const frage of raetsel.fragen ?? []) {
      const antworten = frage.antworten ?? [];
      if (typeof frage.frage !== 'string') fehler.push(`${name}: Bei einer Rätselfrage fehlt der Satz bei frage.`);
      if (!(antworten.length >= 2 && antworten.length <= 4)) {
        fehler.push(`${name}: Die Rätselfrage „${frage.frage}“ braucht zwei bis vier antworten.`);
      } else if (!antworten.includes(frage.richtig)) {
        fehler.push(`${name}: Bei der Rätselfrage „${frage.frage}“ steht bei richtig etwas, das nicht bei antworten steht.`);
      }
    }
  }
  return fehler;
}
