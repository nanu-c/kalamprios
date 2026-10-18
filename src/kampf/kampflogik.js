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

// Das höchste Level, das es gibt.
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
// er ein bisschen stärker (staerkerProLevel in regeln.js).
export function kaempferErstellen(kurzname, level = 1) {
  const tier = KALAMPRIOS[kurzname];
  const stufe = Math.min(Math.max(level, 1), MAX_LEVEL);
  const mal = (wert) => Math.round(wert * (1 + (stufe - 1) * REGELN.staerkerProLevel));
  return {
    kurzname,
    name: tier.name,
    element: tier.element,
    blick: tier.blick,
    level: stufe,
    maxKp: mal(tier.kp),
    kp: mal(tier.kp),
    angriff: mal(tier.angriff),
    verteidigung: mal(tier.verteidigung),
    tempo: mal(tier.tempo),
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

// Schaden = Stärke der Attacke, mal Angriff, geteilt durch Verteidigung.
// Dazu kommt Zufall, damit nicht jeder Treffer gleich ist. Wie viel Zufall,
// steht in regeln.js bei schadenZufall.
export function schadenBerechnen(angreifer, verteidiger, attacke, zufall = Math.random) {
  const grundschaden = (attacke.staerke * angreifer.angriff) / verteidiger.verteidigung;
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
