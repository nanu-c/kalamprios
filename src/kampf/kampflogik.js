// Die Regeln des Kampfes. Hier wird nichts gemalt, nur gerechnet.
// Wie der Kampf aussieht, steht in szenen/KampfSzene.js.
//
// "zufall" ist eine Funktion, die eine Zahl zwischen 0 und 1 würfelt.

import { ATTACKEN } from '../daten/attacken.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { REGELN } from '../daten/regeln.js';

// Würfelt eine Zahl rund um 1. Bei staerke 0.3 liegt sie zwischen 0.7 und 1.3.
function schwankung(staerke, zufall) {
  return 1 + (zufall() * 2 - 1) * staerke;
}

// Das höchste Level, das ein eigenes Kalamprio erreichen kann.
export const MAX_LEVEL = REGELN.erfahrungFuerLevel.length;

// Welches Level ein Kalamprio mit so viel Erfahrung hat (siehe regeln.js).
export function levelAusErfahrung(erfahrung) {
  let level = 1;
  REGELN.erfahrungFuerLevel.forEach((noetig, nummer) => {
    if (erfahrung >= noetig) level = nummer + 1;
  });
  return level;
}

// Wie viel Erfahrung es noch braucht bis zum nächsten Level (null: schon ganz oben).
export function erfahrungBisNaechstesLevel(erfahrung) {
  const level = levelAusErfahrung(erfahrung);
  if (level >= MAX_LEVEL) return null;
  return REGELN.erfahrungFuerLevel[level] - erfahrung;
}

// Wie weit ein Kalamprio im Moment auf dem Weg zum nächsten Level ist:
// 0 heißt gerade aufgestiegen, 1 heißt fast da (oder schon ganz oben).
export function levelFortschritt(erfahrung) {
  const level = levelAusErfahrung(erfahrung);
  if (level >= MAX_LEVEL) return 1;
  const von = REGELN.erfahrungFuerLevel[level - 1];
  const bis = REGELN.erfahrungFuerLevel[level];
  return (erfahrung - von) / (bis - von);
}

// So viel Erfahrung bringt es, diesen Gegner zu besiegen: sein Level.
export function erfahrungFuerSieg(gegner) {
  return gegner.level;
}

// Macht aus einem Eintrag in kalamprios.js einen Kämpfer für einen Kampf:
// mit vollen Lebenspunkten und allen Attacken bereit. Mit jedem Level wird
// er stärker (staerkeJeLevel in regeln.js). Höher als MAX_LEVEL kommt nur das
// geheime Kalamprio. schwaecher: Lebenspunkte und Angriff noch einmal mal
// diese Zahl (für wilde Kalamprios mit Level 1, siehe wildeAufLevel1).
export function kaempferErstellen(kurzname, level = 1, schwaecher = 1) {
  const tier = KALAMPRIOS[kurzname];
  const stufe = Math.min(Math.max(level, 1), REGELN.staerkeJeLevel.length);
  const staerke = REGELN.staerkeJeLevel[stufe - 1] ?? 1;
  const mal = (wert, extra = 1) => Math.round(wert * staerke * extra);
  // Das Tempo wächst nur halb so viel, sonst ist ein hohes Level immer zuerst dran.
  const tempo = Math.round(tier.tempo * (1 + (staerke - 1) / 2));
  return {
    kurzname,
    name: tier.name,
    element: tier.element,
    blick: tier.blick,
    level: stufe,
    maxKp: mal(tier.kp, schwaecher),
    kp: mal(tier.kp, schwaecher),
    angriff: mal(tier.angriff, schwaecher),
    verteidigung: mal(tier.verteidigung),
    tempo,
    attacken: tier.attacken.map((attacke) => ({
      kurzname: attacke,
      ...ATTACKEN[attacke],
      bereitIn: 0, // so viele Runden Pause hat die Attacke noch
    })),
  };
}

export function istBereit(attacke) {
  return attacke.bereitIn === 0;
}

// Schaden = Stärke der Attacke, mal Angriff, geteilt durch Verteidigung,
// und das noch mal schadenMal aus regeln.js. Dazu kommt Zufall, damit nicht
// jeder Treffer gleich ist. Wie viel Zufall, steht bei schadenZufall.
export function schadenBerechnen(angreifer, verteidiger, attacke, zufall = Math.random) {
  const grundschaden = ((attacke.staerke * angreifer.angriff) / verteidiger.verteidigung) * (REGELN.schadenMal ?? 1);
  return Math.max(1, Math.round(grundschaden * schwankung(REGELN.schadenZufall, zufall)));
}

// Führt eine Attacke aus und gibt zurück, wie viel Schaden sie gemacht hat.
// anteil: so viel vom Schaden kommt an (1 ist alles, 0.5 die Hälfte).
export function attackeAusfuehren(angreifer, verteidiger, attacke, zufall = Math.random, anteil = 1) {
  const voll = schadenBerechnen(angreifer, verteidiger, attacke, zufall);
  const schaden = Math.min(verteidiger.kp, Math.max(1, Math.round(voll * anteil)));
  verteidiger.kp -= schaden;
  // +1, weil rundeBeenden am Ende dieser Runde gleich wieder 1 abzieht.
  attacke.bereitIn = attacke.pause + 1;
  return schaden;
}

// Wie die Attacke ausgeht: 'treffer', 'daneben' (der Angreifer haut
// daneben), 'ausgewichen' (der Gegner springt zur Seite) oder 'abgewehrt'
// (der Gegner bekommt nur einen Teil ab). Die Chancen stehen in regeln.js.
export function ausgangWuerfeln(angreifer, verteidiger, zufall = Math.random) {
  const schneller = Math.min(2, Math.max(0.5, verteidiger.tempo / angreifer.tempo));
  const wurf = zufall();
  let grenze = REGELN.danebenChance;
  if (wurf < grenze) return 'daneben';
  grenze += REGELN.ausweichChance * schneller;
  if (wurf < grenze) return 'ausgewichen';
  grenze += REGELN.abwehrChance;
  if (wurf < grenze) return 'abgewehrt';
  return 'treffer';
}

// Ein ganzer Angriff: Erst wird gewürfelt, wie er ausgeht, dann gibt es
// Schaden. Zurück kommt { ausgang, schaden }. Auch wer danebenhaut, muss
// danach die Pause der Attacke abwarten.
export function angreifen(angreifer, verteidiger, attacke, zufall = Math.random) {
  const ausgang = ausgangWuerfeln(angreifer, verteidiger, zufall);
  if (ausgang === 'daneben' || ausgang === 'ausgewichen') {
    attacke.bereitIn = attacke.pause + 1;
    return { ausgang, schaden: 0 };
  }
  const anteil = ausgang === 'abgewehrt' ? REGELN.abgewehrtSchaden : 1;
  return { ausgang, schaden: attackeAusfuehren(angreifer, verteidiger, attacke, zufall, anteil) };
}

// Würfelt einen Angriff aus wie angreifen, ändert aber noch nichts: Zurück
// kommt nur { ausgang, schaden }. So kann ein Gerät beim Spielen zu zweit
// ausrechnen, was passiert, und es dem anderen schicken (zusammenkampf.js).
export function angriffWuerfeln(angreifer, verteidiger, attacke, zufall = Math.random) {
  const probe = { ...attacke };
  const ziel = { ...verteidiger };
  return angreifen(angreifer, ziel, probe, zufall);
}

// Am Ende jeder Runde rückt jede Pause um eine Runde näher ans Ende.
export function rundeBeenden(alleKaempfer) {
  for (const kaempfer of alleKaempfer) {
    for (const attacke of kaempfer.attacken) {
      if (attacke.bereitIn > 0) attacke.bereitIn -= 1;
    }
  }
}

// Wer in dieser Runde schneller ist, ist zuerst dran. Mehr Tempo hilft, aber
// jede Runde wird neu gewürfelt (tempoZufall in regeln.js). Bei Gleichstand
// entscheidet eine Münze.
export function werZuerst(a, b, zufall = Math.random) {
  const tempoA = a.tempo * schwankung(REGELN.tempoZufall, zufall);
  const tempoB = b.tempo * schwankung(REGELN.tempoZufall, zufall);
  if (tempoA !== tempoB) return tempoA > tempoB ? [a, b] : [b, a];
  return zufall() < 0.5 ? [a, b] : [b, a];
}

// Wie groß die Chance ist, ein wildes Kalamprio mit dem Fangkristall zu fangen:
// je weniger Lebenspunkte es noch hat, desto größer. Die Zahlen stehen in
// regeln.js. Das geheime Kalamprio ist doppelt so schwer zu fangen.
export function fangChance(gegner) {
  const schwach = 1 - gegner.kp / gegner.maxKp;
  const chance = REGELN.fangChanceGesund + (REGELN.fangChanceSchwach - REGELN.fangChanceGesund) * schwach;
  return KALAMPRIOS[gegner.kurzname].geheim ? chance / 2 : chance;
}

// Essen aus dem Beutel im Kampf. imKampf steht beim Rezept in orte/haus.js:
//   heilen:   so viel von den Lebenspunkten kommt zurück (1 ist alles)
//   staerker: der Angriff wird so viel mal stärker, bis der Kampf vorbei ist
// Zurück kommt, wie viele Lebenspunkte dazugekommen sind.
export function essenGeben(kaempfer, imKampf) {
  const vorher = kaempfer.kp;
  if (imKampf.heilen) kaempfer.kp = Math.min(kaempfer.maxKp, kaempfer.kp + Math.round(kaempfer.maxKp * imKampf.heilen));
  if (imKampf.staerker && !kaempfer.gestaerkt) {
    kaempfer.angriff = Math.round(kaempfer.angriff * imKampf.staerker);
    kaempfer.gestaerkt = true;
  }
  return kaempfer.kp - vorher;
}

// Weckt alle aus dem Team auf, die nicht mehr kämpfen konnten: Sie bekommen
// so viel von ihren Lebenspunkten zurück (wecken beim Rezept, 0.5 ist die
// Hälfte). Zurück kommen die, die aufgewacht sind.
export function teamWecken(team, anteil) {
  const geweckt = team.filter((kaempfer) => kaempfer.kp <= 0);
  for (const kaempfer of geweckt) kaempfer.kp = Math.max(1, Math.round(kaempfer.maxKp * anteil));
  return geweckt;
}

// Hilft das Essen gerade? Wer alle Lebenspunkte hat, braucht kein Heilen,
// stärker wird man in einem Kampf nur einmal, und wecken kann man nur, wenn
// jemand im Team (team) nicht mehr kämpfen kann.
export function essenHilft(kaempfer, imKampf, team = []) {
  return Boolean(
    (imKampf.heilen && kaempfer.kp < kaempfer.maxKp) ||
      (imKampf.staerker && !kaempfer.gestaerkt) ||
      (imKampf.wecken && team.some((anderer) => anderer.kp <= 0)),
  );
}

// Wirft einen Fangkristall. true heißt: gefangen!
export function fangen(gegner, zufall = Math.random) {
  return zufall() < fangChance(gegner);
}

// So entscheidet der Computer: meistens die stärkste Attacke, die gerade
// bereit ist, manchmal eine andere.
export function gegnerWaehlt(kaempfer, zufall = Math.random) {
  const bereit = kaempfer.attacken.filter(istBereit);
  const staerkste = bereit.reduce((bisher, attacke) =>
    attacke.staerke > bisher.staerke ? attacke : bisher,
  );
  if (zufall() < 0.7) return staerkste;
  return bereit[Math.floor(zufall() * bereit.length)];
}
