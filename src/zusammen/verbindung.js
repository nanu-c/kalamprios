// Die Verbindung zwischen zwei Geräten. Die Geräte schicken sich ihre
// Nachrichten direkt (mit PeerJS, das ist kostenlos und braucht kein Konto).
// Nur zum Finden fragen sie einmal einen Vermittler im Internet: Unter dem
// Code meldet sich das eine Gerät an, und das andere fragt nach diesem Code.
//
// So benutzt man es:
//   spielOeffnen()        zeigt einen neuen Code (in zuZweit.code)
//   beitreten(code)       verbindet sich mit dem Gerät, das diesen Code zeigt
//   trennen()             beendet alles
//   senden(typ, daten)    schickt eine Nachricht an das andere Gerät
//   hoeren(typ, wasTun)   wasTun wird bei jeder Nachricht dieses Typs
//                         aufgerufen. Zurück kommt eine Funktion zum Aufhören.
//   ichMelden(was)        was das andere Gerät über einen wissen soll (wo man
//                         ist, wer man ist). Es kommt dort in zuZweit.partner an.
//
// Außer den eigenen Nachrichten gibt es diese: 'zustand' (zuZweit.zustand hat
// sich geändert), 'verbunden' und 'getrennt'.

import { Peer } from 'peerjs';
import { codeWuerfeln } from './zusammenlogik.js';
import { ZUSAMMEN } from '../daten/zusammen.js';

const VORSILBE = 'kalamprios-zu-zweit-';
const PULS = 1000; // so oft (Millisekunden) sagt jedes Gerät mindestens, dass es noch da ist
const OFT = 90; // so oft höchstens, wenn sich etwas ändert (zum Beispiel beim Laufen)
const STILLE = 8000; // so lange ohne Nachricht, dann ist die Verbindung weg
const GEDULD = 15000; // so lange wird beim Beitreten gewartet

export const zuZweit = {
  zustand: 'aus', // 'aus', 'wartet' (der Code wird gezeigt), 'verbindet' oder 'verbunden'
  code: null, // Liste von Nummern (siehe codeBilder in daten/zusammen.js)
  gastgeberin: false, // true auf dem Gerät, das den Code zeigt
  partner: null, // was das andere Gerät zuletzt über sich gemeldet hat
  fehler: null, // was zuletzt schiefging, als Satz
};

let peer = null;
let leitung = null;
let zuletztGehoert = 0;
let zuletztGesendet = 0;
let ich = {};
let geaendert = false;
let geduld = null;
const hoerer = new Map();

function melden(typ, daten = {}) {
  for (const wasTun of [...(hoerer.get(typ) ?? [])]) wasTun(daten);
}

export function hoeren(typ, wasTun) {
  if (!hoerer.has(typ)) hoerer.set(typ, new Set());
  hoerer.get(typ).add(wasTun);
  return () => hoerer.get(typ).delete(wasTun);
}

export function senden(typ, daten = {}) {
  if (!leitung?.open) return;
  try {
    leitung.send({ ...daten, typ });
  } catch {
    verloren();
  }
}

export function istVerbunden() {
  return zuZweit.zustand === 'verbunden';
}

export function ichMelden(was) {
  for (const [name, wert] of Object.entries(was)) {
    if (JSON.stringify(ich[name]) !== JSON.stringify(wert)) geaendert = true;
  }
  ich = { ...ich, ...was };
}

function zustandSetzen(zustand) {
  zuZweit.zustand = zustand;
  melden('zustand');
}

// Öffnet ein Spiel: Das Gerät meldet sich unter einem neuen Code an und
// wartet, bis sich ein anderes damit verbindet.
export function spielOeffnen() {
  trennen();
  const code = codeWuerfeln(ZUSAMMEN.codeBilder.length, ZUSAMMEN.codeLaenge);
  zuZweit.code = code;
  zuZweit.gastgeberin = true;
  zuZweit.fehler = null;
  const meins = new Peer(VORSILBE + code.join(''));
  peer = meins;
  meins.on('connection', (neue) => {
    // Es kann immer nur eine mitspielen.
    if (leitung) {
      neue.on('open', () => neue.close());
      return;
    }
    leitungEinrichten(neue);
  });
  meins.on('error', (fehler) => {
    if (peer !== meins) return;
    // Den Code hat gerade jemand anderes: dann eben ein neuer.
    if (fehler.type === 'unavailable-id') spielOeffnen();
    else fehlerMelden(fehler);
  });
  // Verliert der Vermittler den Kontakt, meldet man sich wieder an. Eine
  // Verbindung, die schon steht, läuft ohne ihn weiter.
  meins.on('disconnected', () => {
    if (peer === meins && !meins.destroyed) setTimeout(() => peer === meins && !meins.destroyed && meins.reconnect(), 2000);
  });
  zustandSetzen('wartet');
}

// Verbindet sich mit dem Gerät, das diesen Code zeigt.
export function beitreten(code) {
  trennen();
  zuZweit.code = code;
  zuZweit.gastgeberin = false;
  zuZweit.fehler = null;
  const meins = new Peer();
  peer = meins;
  meins.on('open', () => {
    if (peer === meins) leitungEinrichten(meins.connect(VORSILBE + code.join(''), { reliable: true }));
  });
  meins.on('error', (fehler) => {
    if (peer === meins) fehlerMelden(fehler);
  });
  geduld = setTimeout(() => {
    if (peer === meins && zuZweit.zustand === 'verbindet') fehlerMelden({ type: 'zeit' });
  }, GEDULD);
  zustandSetzen('verbindet');
}

function leitungEinrichten(neue) {
  leitung = neue;
  neue.on('open', () => {
    if (leitung !== neue) return;
    clearTimeout(geduld);
    zuletztGehoert = Date.now();
    geaendert = true;
    zustandSetzen('verbunden');
    melden('verbunden');
  });
  neue.on('data', (nachricht) => {
    if (leitung !== neue || !nachricht || typeof nachricht.typ !== 'string') return;
    zuletztGehoert = Date.now();
    if (nachricht.typ === 'hier') zuZweit.partner = { ...nachricht, zeit: Date.now() };
    melden(nachricht.typ, nachricht);
  });
  neue.on('close', () => leitung === neue && verloren());
  neue.on('error', () => leitung === neue && verloren());
}

// Die Verbindung ist abgerissen. Wer den Code zeigt, wartet weiter: Die
// andere kann sich mit demselben Code wieder verbinden.
function verloren() {
  if (!leitung) return;
  const alte = leitung;
  leitung = null;
  const name = zuZweit.partner?.name ?? 'die andere';
  const warVerbunden = zuZweit.zustand === 'verbunden';
  zuZweit.partner = null;
  try {
    alte.close();
  } catch {
    // schon zu
  }
  if (zuZweit.gastgeberin && peer && !peer.destroyed) zustandSetzen('wartet');
  else {
    peer?.destroy();
    peer = null;
    zustandSetzen('aus');
  }
  if (warVerbunden) melden('getrennt', { name });
}

function fehlerMelden(fehler) {
  const saetze = {
    'peer-unavailable': 'Diesen Code gibt es gerade nicht. Stimmen die vier Kalamprios?',
    zeit: 'Das andere Gerät antwortet nicht. Ist es noch im Spiel?',
    network: 'Das Internet ist gerade nicht zu erreichen.',
    'server-error': 'Das Internet ist gerade nicht zu erreichen.',
    'socket-error': 'Das Internet ist gerade nicht zu erreichen.',
    'browser-incompatible': 'Dieser Browser kann das leider nicht.',
    webrtc: 'Die Geräte finden sich nicht. Probiert es im selben WLAN!',
  };
  const satz = saetze[fehler?.type] ?? 'Das hat leider nicht geklappt. Versuch es noch einmal!';
  if (leitung) verloren();
  trennen();
  zuZweit.fehler = satz;
  melden('zustand');
}

export function trennen() {
  clearTimeout(geduld);
  const alte = leitung;
  leitung = null;
  try {
    alte?.close();
  } catch {
    // schon zu
  }
  peer?.destroy();
  peer = null;
  zuZweit.code = null;
  zuZweit.partner = null;
  zuZweit.gastgeberin = false;
  if (zuZweit.zustand !== 'aus') zustandSetzen('aus');
}

// Jeden Augenblick: sagen, wo man ist (wenn sich etwas geändert hat, oder
// sonst einmal pro Sekunde), und merken, wenn die andere nichts mehr sagt.
setInterval(() => {
  if (!leitung?.open) return;
  const jetzt = Date.now();
  if (jetzt - zuletztGehoert > STILLE) {
    verloren();
    return;
  }
  if ((geaendert && jetzt - zuletztGesendet >= OFT) || jetzt - zuletztGesendet >= PULS) {
    geaendert = false;
    zuletztGesendet = jetzt;
    senden('hier', ich);
  }
}, 45);

// Wer die Seite schließt, verabschiedet sich, damit die andere es gleich merkt.
globalThis.addEventListener?.('pagehide', () => leitung?.close());
