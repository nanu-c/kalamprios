// Liest Sätze laut vor.
//
// Gibt es für einen Satz eine Aufnahme in public/stimme (gemacht mit
// `npm run stimmen`), wird sie abgespielt. Sonst liest die Stimme vor, die im
// Browser eingebaut ist. Wo der Browser nicht vorlesen kann, bleibt es still.
// Solange vorgelesen wird, ist die Musik leiser.

import { musikLeiser } from './klang/klang.js';

const sprache = window.speechSynthesis;
const ORDNER = `${import.meta.env.BASE_URL}stimme/`;

// Welcher Satz in welcher Datei steckt. Kommt aus public/stimme/stimmen.json.
let aufnahmen = {};
fetch(`${ORDNER}stimmen.json`)
  .then((antwort) => (antwort.ok ? antwort.json() : {}))
  .then((liste) => {
    aufnahmen = liste;
  })
  .catch(() => {});

let ton = null;

// Browser lesen erst vor, wenn man einmal getippt oder eine Taste gedrückt hat.
// Bis dahin merken wir uns den Satz und lesen ihn beim ersten Tippen vor.
let wartet = null;

function deutscheStimme() {
  const stimmen = sprache.getVoices().filter((stimme) => stimme.lang.toLowerCase().startsWith('de'));
  return stimmen.find((stimme) => stimme.localService) ?? stimmen[0] ?? null;
}

function browserSprechen(text) {
  if (!sprache) return;
  // Die Anführungszeichen sollen nicht mitgelesen werden.
  const satz = new SpeechSynthesisUtterance(text.replace(/[„“"]/g, ''));
  satz.lang = 'de-DE';
  satz.voice = deutscheStimme();
  satz.rate = 0.9; // etwas langsamer als normal
  satz.onstart = () => musikLeiser(true);
  satz.onend = () => musikLeiser(false);
  satz.onerror = (fehler) => {
    musikLeiser(false);
    if (fehler.error === 'not-allowed') wartet = text;
  };
  sprache.speak(satz);
}

function sprechen(text) {
  verstummen();
  const datei = aufnahmen[text];
  if (!datei) {
    browserSprechen(text);
    return;
  }
  ton = new Audio(`${ORDNER}${datei}`);
  ton.onplaying = () => musikLeiser(true);
  ton.onended = () => musikLeiser(false);
  ton.play().catch((fehler) => {
    if (fehler.name === 'NotAllowedError') wartet = text;
    else if (fehler.name !== 'AbortError') browserSprechen(text);
  });
}

export function vorlesen(text) {
  wartet = navigator.userActivation?.hasBeenActive === false ? text : null;
  if (wartet) return;
  sprechen(text);
}

export function verstummen() {
  wartet = null;
  sprache?.cancel();
  ton?.pause();
  ton = null;
  musikLeiser(false);
}

const nachholen = () => {
  if (!wartet) return;
  const text = wartet;
  wartet = null;
  sprechen(text);
};
// Nach dem Klick erst kurz warten: Wenn der Klick „Weiter“ war, kommt
// schon der nächste Satz, dann soll nicht der alte vorgelesen werden.
window.addEventListener('pointerdown', () => setTimeout(nachholen, 0));
window.addEventListener('keydown', () => setTimeout(nachholen, 0));
