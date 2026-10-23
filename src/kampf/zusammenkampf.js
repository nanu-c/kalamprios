// Die Regeln für Kämpfe zu zweit, auf zwei Geräten. Hier wird nichts
// gemalt, nur gerechnet. Wie es aussieht, steht in szenen/ZusammenKampfSzene.js.
//
// Es gibt zwei Arten:
//   'duell':    Freundschaftskampf, Team gegen Team. Wer anfängt, steht
//               links, die andere rechts.
//   'zusammen': Beide stehen links nebeneinander und kämpfen gemeinsam gegen
//               ein wildes Kalamprio rechts.
//
// Ein Kampf besteht aus Plätzen. Auf jedem Platz steht ein Team:
//   { wer, seite, team, aktiv, weg }
//   wer:   'a' (wer den Kampf angefangen hat), 'b' (die andere) oder 'wild'
//   seite: 'links' oder 'rechts'
//   team:  die Kämpfer (wie kaempferErstellen sie macht)
//   aktiv: welcher aus dem Team gerade kämpft
//   weg:   true, wenn die Verbindung zu diesem Gerät abgerissen ist
//
// Jede Runde wählt jede ihre Aktion. Gerät 'a' würfelt dann aus, was passiert
// (rundeAusrechnen), und schickt die Liste der Ereignisse an Gerät 'b'.
// Beide Geräte zeigen die Ereignisse nacheinander und wenden sie mit
// ereignisAnwenden auf ihren Kampf an. So sehen beide genau dasselbe.

import { angriffWuerfeln, essenGeben, fangen, istBereit, kaempferErstellen, rundeBeenden, teamWecken } from './kampflogik.js';
import { REGELN } from '../daten/regeln.js';

// Baut einen neuen Kampf.
//   art:    'duell' oder 'zusammen'
//   teamA, teamB: Listen aus { kurzname, level } (wer kämpft zuerst, steht vorne)
//   gegner: (nur bei 'zusammen') { kurzname, level }
//   wildStaerker: so viel mal mehr Lebenspunkte hat das wilde Kalamprio, weil
//           zwei gegen eines kämpfen
export function kampfErstellen({ art, teamA, teamB, gegner = null, wildStaerker = 1 }) {
  const kaempfer = (liste) => liste.map(({ kurzname, level }) => kaempferErstellen(kurzname, level));
  const plaetze = [
    { wer: 'a', seite: 'links', team: kaempfer(teamA), aktiv: 0, weg: false },
    { wer: 'b', seite: art === 'duell' ? 'rechts' : 'links', team: kaempfer(teamB), aktiv: 0, weg: false },
  ];
  if (art === 'zusammen') {
    const klein = gegner.level === 1 ? REGELN.wildeAufLevel1 : 1;
    const wild = kaempferErstellen(gegner.kurzname, gegner.level, klein);
    wild.maxKp = Math.round(wild.maxKp * wildStaerker);
    wild.kp = wild.maxKp;
    plaetze.push({ wer: 'wild', seite: 'rechts', team: [wild], aktiv: 0, weg: false });
  }
  return { art, plaetze, runde: 0, ende: null };
}

export function aktiver(platz) {
  return platz.team[platz.aktiv];
}

// Kann von diesem Platz niemand mehr kämpfen (oder ist das Gerät weg)?
export function istRaus(platz) {
  return platz.weg || platz.team.every((kaempfer) => kaempfer.kp <= 0);
}

export function platzVon(kampf, wer) {
  return kampf.plaetze.findIndex((platz) => platz.wer === wer);
}

// Die Plätze, die gerade eine Aktion wählen müssen: alle Spielerinnen, die
// noch kämpfen können (das wilde Kalamprio wählt der Computer).
export function werWaehlt(kampf) {
  return kampf.plaetze.map((platz, nummer) => ({ platz, nummer })).filter(({ platz }) => platz.wer !== 'wild' && !istRaus(platz)).map(({ nummer }) => nummer);
}

// Wer von diesem Platz aus angegriffen werden kann: die Plätze auf der
// anderen Seite, die noch kämpfen können.
export function gegnerPlaetze(kampf, nummer) {
  const seite = kampf.plaetze[nummer].seite;
  return kampf.plaetze.map((platz, n) => ({ platz, n })).filter(({ platz }) => platz.seite !== seite && !istRaus(platz)).map(({ n }) => n);
}

// Ist eine Seite ganz raus? Dann hat die andere gewonnen. Zurück kommt die
// Seite, die gewonnen hat, oder null.
export function sieger(kampf) {
  const raus = (seite) => kampf.plaetze.filter((platz) => platz.seite === seite).every(istRaus);
  if (raus('rechts')) return 'links';
  if (raus('links')) return 'rechts';
  return null;
}

// Der nächste aus dem Team, der noch kämpfen kann (oder -1).
export function naechsterBereit(platz) {
  return platz.team.findIndex((kaempfer, nummer) => nummer !== platz.aktiv && kaempfer.kp > 0);
}

// In welcher Reihenfolge die Plätze angreifen: Wer schneller ist, ist
// meistens zuerst dran. Wie bei werZuerst wird das Tempo jede Runde neu
// gewürfelt (tempoZufall in regeln.js).
export function angriffsReihenfolge(kampf, nummern, zufall = Math.random) {
  const tempo = new Map(
    nummern.map((nummer) => [nummer, aktiver(kampf.plaetze[nummer]).tempo * (1 + (zufall() * 2 - 1) * REGELN.tempoZufall) + zufall() * 0.001]),
  );
  return [...nummern].sort((a, b) => tempo.get(b) - tempo.get(a));
}

// Würfelt eine Runde aus. wahlen sagt für jeden Platz, was dort gewählt wurde:
//   { art: 'attacke', nummer }   eine Attacke (Nummer in der Liste des Kämpfers)
//   { art: 'tauschen', zu }      ein anderes Kalamprio aus dem Team kommt
//   { art: 'essen', sache, imKampf } Essen aus dem Beutel (imKampf vom Rezept)
//   { art: 'fangen' }            einen Fangkristall werfen (nur gegen wilde)
// Das wilde Kalamprio wählt selbst. Der Kampf wird dabei nicht verändert.
// Zurück kommt die Liste der Ereignisse.
export function rundeAusrechnen(kampf, wahlen, zufall = Math.random) {
  const probe = structuredClone(kampf);
  const ereignisse = [];
  const passiert = (ereignis) => {
    ereignisse.push(ereignis);
    ereignisAnwenden(probe, ereignis);
  };

  // Erst tauschen, essen und fangen. Das geht schneller als jede Attacke.
  for (const nummer of werWaehlt(probe)) {
    const wahl = wahlen[nummer];
    const platz = probe.plaetze[nummer];
    if (wahl?.art === 'tauschen' && platz.team[wahl.zu]?.kp > 0 && wahl.zu !== platz.aktiv) {
      passiert({ art: 'tauschen', platz: nummer, zu: wahl.zu });
    } else if (wahl?.art === 'essen' && wahl.imKampf) {
      passiert({ art: 'essen', platz: nummer, sache: wahl.sache, imKampf: wahl.imKampf });
    } else if (wahl?.art === 'fangen') {
      const wild = probe.plaetze.findIndex((anderer) => anderer.wer === 'wild');
      if (wild < 0) continue;
      const gefangen = fangen(aktiver(probe.plaetze[wild]), zufall);
      passiert({ art: 'fangen', platz: nummer, gefangen, wackler: gefangen ? 3 : 1 + Math.floor(zufall() * 2) });
      if (gefangen) {
        passiert({ art: 'ende', sieger: platz.seite, gefangenVon: nummer });
        return ereignisse;
      }
    }
  }

  // Dann greifen alle an, die eine Attacke gewählt haben, und das wilde Kalamprio.
  const angreifer = probe.plaetze
    .map((platz, nummer) => ({ platz, nummer }))
    .filter(({ platz, nummer }) => !istRaus(platz) && (platz.wer === 'wild' || wahlen[nummer]?.art === 'attacke'))
    .map(({ nummer }) => nummer);
  const amAnfang = new Map(angreifer.map((nummer) => [nummer, probe.plaetze[nummer].aktiv]));

  for (const von of angriffsReihenfolge(probe, angreifer, zufall)) {
    const platz = probe.plaetze[von];
    // Wer in dieser Runde umgefallen ist, greift nicht mehr an, und wer gerade
    // erst eingewechselt wurde, auch nicht.
    if (istRaus(platz) || platz.aktiv !== amAnfang.get(von) || aktiver(platz).kp <= 0) continue;
    const ziele = gegnerPlaetze(probe, von);
    if (ziele.length === 0) break;
    const auf = ziele[Math.floor(zufall() * ziele.length)];
    const kaempfer = aktiver(platz);
    let attacke;
    if (platz.wer === 'wild') attacke = wildWaehlt(kaempfer, zufall);
    else attacke = wahlen[von].nummer;
    if (!istBereit(kaempfer.attacken[attacke])) continue;

    const { ausgang, schaden } = angriffWuerfeln(kaempfer, aktiver(probe.plaetze[auf]), kaempfer.attacken[attacke], zufall);
    passiert({ art: 'angriff', von, auf, attacke, ausgang, schaden });

    const getroffen = probe.plaetze[auf];
    if (aktiver(getroffen).kp > 0) continue;
    passiert({ art: 'umgefallen', platz: auf });
    const naechster = naechsterBereit(getroffen);
    if (naechster >= 0) passiert({ art: 'einwechseln', platz: auf, zu: naechster });
    const gewonnen = sieger(probe);
    if (gewonnen) {
      passiert({ art: 'ende', sieger: gewonnen });
      return ereignisse;
    }
  }

  passiert({ art: 'rundeEnde' });
  return ereignisse;
}

// Wie der Computer für das wilde Kalamprio wählt (wie gegnerWaehlt in
// kampflogik.js). Zurück kommt die Nummer der Attacke.
function wildWaehlt(kaempfer, zufall) {
  const bereit = kaempfer.attacken.map((attacke, nummer) => ({ attacke, nummer })).filter(({ attacke }) => istBereit(attacke));
  const staerkste = bereit.reduce((bisher, eine) => (eine.attacke.staerke > bisher.attacke.staerke ? eine : bisher));
  if (zufall() < 0.7) return staerkste.nummer;
  return bereit[Math.floor(zufall() * bereit.length)].nummer;
}

// Wendet ein Ereignis auf den Kampf an. Beide Geräte machen das mit jedem
// Ereignis, das gezeigt wird. Zurück kommt, was dabei passiert ist (für die
// Anzeige): beim Essen { geheilt, geweckt }.
export function ereignisAnwenden(kampf, ereignis) {
  const platz = kampf.plaetze[ereignis.platz];
  switch (ereignis.art) {
    case 'tauschen':
    case 'einwechseln':
      platz.aktiv = ereignis.zu;
      return {};
    case 'essen': {
      const geheilt = essenGeben(aktiver(platz), ereignis.imKampf);
      const geweckt = ereignis.imKampf.wecken ? teamWecken(platz.team, ereignis.imKampf.wecken) : [];
      return { geheilt, geweckt };
    }
    case 'angriff': {
      const angreifer = aktiver(kampf.plaetze[ereignis.von]);
      const verteidiger = aktiver(kampf.plaetze[ereignis.auf]);
      const attacke = angreifer.attacken[ereignis.attacke];
      verteidiger.kp = Math.max(0, verteidiger.kp - ereignis.schaden);
      // +1, weil rundeBeenden am Ende dieser Runde gleich wieder 1 abzieht.
      attacke.bereitIn = attacke.pause + 1;
      return {};
    }
    case 'rundeEnde':
      rundeBeenden(kampf.plaetze.flatMap((anderer) => anderer.team));
      kampf.runde += 1;
      return {};
    case 'ende':
      kampf.ende = ereignis;
      return {};
    default:
      return {};
  }
}
