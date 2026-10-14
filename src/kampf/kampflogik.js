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

// Macht aus einem Eintrag in kalamprios.js einen Kämpfer für einen Kampf:
// mit vollen Lebenspunkten und allen Attacken bereit.
export function kaempferErstellen(kurzname) {
  const tier = KALAMPRIOS[kurzname];
  return {
    kurzname,
    name: tier.name,
    element: tier.element,
    blick: tier.blick,
    maxKp: tier.kp,
    kp: tier.kp,
    angriff: tier.angriff,
    verteidigung: tier.verteidigung,
    tempo: tier.tempo,
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
export function attackeAusfuehren(angreifer, verteidiger, attacke, zufall = Math.random) {
  const schaden = Math.min(verteidiger.kp, schadenBerechnen(angreifer, verteidiger, attacke, zufall));
  verteidiger.kp -= schaden;
  // +1, weil rundeBeenden am Ende dieser Runde gleich wieder 1 abzieht.
  attacke.bereitIn = attacke.pause + 1;
  return schaden;
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
