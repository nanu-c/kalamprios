// Der Lautsprecher des Spiels. Alle Töne werden hier im Browser ausgerechnet
// (mit Web Audio), es gibt keine Tondateien.
//
// Musik und Geräusche laufen getrennt, damit man sie verschieden laut
// machen kann (siehe daten/klaenge.js). Beides geht durch etwas Hall, so
// klingt es weicher. In der Mine ist der Hall länger, wie in einer Höhle.
//
// Browser spielen erst Töne, wenn man einmal getippt oder eine Taste
// gedrückt hat. Bis dahin bleibt es still.

import { KLAENGE } from '../daten/klaenge.js';

const SPEICHERNAME = 'kalamprios-ton';

let kontext = null;
let gesamt = null; // hier kommt alles zusammen, bevor es zu den Lautsprechern geht
let musikWeg = null;
let geraeuschWeg = null;
let hallMusik = null;
let hallGeraeusche = null;
let rauschBuffer = null;
let leiser = false; // true, solange vorgelesen wird

function gespeichertStumm() {
  try {
    return localStorage.getItem(SPEICHERNAME) === 'aus';
  } catch {
    return false;
  }
}

let stumm = gespeichertStumm();

// Ein Nachklang wie in einem großen Raum: Rauschen, das langsam leiser wird.
function hallBauen(sekunden) {
  const laenge = Math.floor(kontext.sampleRate * sekunden);
  const antwort = kontext.createBuffer(2, laenge, kontext.sampleRate);
  for (let kanal = 0; kanal < 2; kanal += 1) {
    const daten = antwort.getChannelData(kanal);
    for (let i = 0; i < laenge; i += 1) daten[i] = (Math.random() * 2 - 1) * (1 - i / laenge) ** 3;
  }
  const hall = kontext.createConvolver();
  hall.buffer = antwort;
  return hall;
}

function einrichten() {
  const Art = window.AudioContext ?? window.webkitAudioContext;
  if (!Art) return;
  kontext = new Art();

  // Ein Kompressor passt auf, dass es nie zu laut wird oder kratzt.
  const presse = kontext.createDynamicsCompressor();
  presse.threshold.value = -14;
  presse.ratio.value = 4;
  presse.connect(kontext.destination);

  gesamt = kontext.createGain();
  gesamt.gain.value = stumm ? 0 : 1;
  gesamt.connect(presse);

  const hall = hallBauen(2.2);
  hall.connect(gesamt);

  musikWeg = kontext.createGain();
  musikWeg.gain.value = KLAENGE.musik;
  musikWeg.connect(gesamt);
  hallMusik = kontext.createGain();
  hallMusik.gain.value = 0.3;
  musikWeg.connect(hallMusik).connect(hall);

  geraeuschWeg = kontext.createGain();
  geraeuschWeg.gain.value = KLAENGE.geraeusche;
  geraeuschWeg.connect(gesamt);
  hallGeraeusche = kontext.createGain();
  hallGeraeusche.gain.value = 0.15;
  geraeuschWeg.connect(hallGeraeusche).connect(hall);

  // Weißes Rauschen, aus dem Wind, Wasser, Schritte und Schlagzeug gemacht werden.
  rauschBuffer = kontext.createBuffer(1, kontext.sampleRate * 2, kontext.sampleRate);
  const daten = rauschBuffer.getChannelData(0);
  for (let i = 0; i < daten.length; i += 1) daten[i] = Math.random() * 2 - 1;
}

function aufwecken() {
  if (!kontext) einrichten();
  if (kontext?.state === 'suspended' && document.visibilityState === 'visible') kontext.resume().catch(() => {});
}
for (const art of ['pointerdown', 'keydown', 'touchend', 'click']) window.addEventListener(art, aufwecken);

// Ist das Fenster versteckt (anderer Tab, Handy aus), macht der Ton Pause.
document.addEventListener('visibilitychange', () => {
  if (!kontext) return;
  if (document.visibilityState === 'hidden') kontext.suspend().catch(() => {});
  else if (navigator.userActivation?.hasBeenActive !== false) kontext.resume().catch(() => {});
});

// true, sobald Töne wirklich zu hören sind.
export function bereit() {
  return kontext?.state === 'running';
}

export function jetzt() {
  return kontext?.currentTime ?? 0;
}

export function musikAusgang() {
  return musikWeg;
}

export function geraeuschAusgang() {
  return geraeuschWeg;
}

export function neuerKnoten(art) {
  return kontext[art]();
}

// ------------------------------------------------------- an und aus, leiser

export function istStumm() {
  return stumm;
}

export function stummSchalten(an) {
  stumm = an;
  try {
    localStorage.setItem(SPEICHERNAME, an ? 'aus' : 'an');
  } catch {
    // dann merkt es sich der Browser eben nicht
  }
  if (gesamt) gesamt.gain.setTargetAtTime(an ? 0 : 1, kontext.currentTime, 0.05);
}

// Während vorgelesen wird, ist die Musik leiser.
export function musikLeiser(an) {
  if (leiser === an) return;
  leiser = an;
  if (musikWeg) musikWeg.gain.setTargetAtTime(KLAENGE.musik * (an ? 0.3 : 1), kontext.currentTime, 0.25);
}

// In der Höhle hallt es mehr.
export function hallStaerke(art) {
  if (!kontext) return;
  const hoehle = art === 'hoehle';
  hallGeraeusche.gain.setTargetAtTime(hoehle ? 0.55 : 0.15, kontext.currentTime, 0.3);
  hallMusik.gain.setTargetAtTime(hoehle ? 0.5 : 0.3, kontext.currentTime, 0.3);
}

// ------------------------------------------------------------- Bausteine

// Ein Weg für ein einzelnes Geräusch: mit eigener Lautstärke, von links
// oder rechts (pan: -1 ganz links, 1 ganz rechts) und dumpfer, wenn es
// weit weg ist (dumpf: 0 klar, 1 ganz dumpf). Nach sekunden wird er abgebaut.
export function raumWeg({ lautstaerke = 1, pan = 0, dumpf = 0, sekunden = 2, ziel = geraeuschWeg } = {}) {
  if (!bereit()) return null;
  const eingang = kontext.createGain();
  eingang.gain.value = lautstaerke;
  let weiter = eingang;
  const teile = [eingang];
  if (dumpf > 0) {
    const filter = kontext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 9000 * (1 - dumpf) ** 2 + 500;
    weiter.connect(filter);
    weiter = filter;
    teile.push(filter);
  }
  if (pan !== 0 && kontext.createStereoPanner) {
    const seite = kontext.createStereoPanner();
    seite.pan.value = Math.max(-1, Math.min(1, pan));
    weiter.connect(seite);
    weiter = seite;
    teile.push(seite);
  }
  weiter.connect(ziel);
  setTimeout(() => teile.forEach((teil) => teil.disconnect()), sekunden * 1000 + 500);
  return eingang;
}

// Hüllkurve: schnell lauter (anschlag), dann halten und am Ende leise werden (ausklang).
function huelleSetzen(verstaerker, t, dauer, lautstaerke, anschlag, ausklang) {
  const g = verstaerker.gain;
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(Math.max(lautstaerke, 0.0002), t + anschlag);
  if (ausklang !== null) g.setValueAtTime(Math.max(lautstaerke, 0.0002), Math.max(t + anschlag, t + dauer - ausklang));
  g.exponentialRampToValueAtTime(0.0001, t + dauer);
}

function filterBauen(filter, t, dauer) {
  const knoten = kontext.createBiquadFilter();
  knoten.type = filter.art ?? 'lowpass';
  knoten.frequency.setValueAtTime(filter.frequenz, t);
  if (filter.zu) knoten.frequency.exponentialRampToValueAtTime(filter.zu, t + (filter.dauer ?? dauer));
  knoten.Q.value = filter.q ?? 1;
  return knoten;
}

// Ein einzelner Ton.
//   frequenz:  wie hoch (in Hertz). gleitenZu: dorthin rutscht der Ton.
//   art:       'sine' (weich), 'triangle', 'square' (piepsig), 'sawtooth' (scharf)
//   start:     in wie vielen Sekunden er anfängt (oder zeit: genau wann)
//   ausklang:  ohne Angabe klingt er die ganze Zeit aus (wie eine Glocke),
//              mit Angabe bleibt er laut und wird erst am Ende leiser (wie eine Flöte)
//   vibrato:   { tempo, tiefe } lässt ihn zittern
export function ton({
  frequenz,
  art = 'sine',
  start = 0,
  zeit,
  dauer = 0.3,
  lautstaerke = 0.3,
  anschlag = 0.005,
  ausklang = null,
  gleitenZu,
  gleitDauer,
  vibrato,
  filter,
  ziel = geraeuschWeg,
}) {
  if (!bereit() || !ziel) return;
  const t = zeit ?? kontext.currentTime + start;
  const welle = kontext.createOscillator();
  welle.type = art;
  welle.frequency.setValueAtTime(frequenz, t);
  if (gleitenZu) welle.frequency.exponentialRampToValueAtTime(gleitenZu, t + (gleitDauer ?? dauer));

  const verstaerker = kontext.createGain();
  huelleSetzen(verstaerker, t, dauer, lautstaerke, anschlag, ausklang);

  let zitter = null;
  if (vibrato) {
    zitter = kontext.createOscillator();
    zitter.frequency.value = vibrato.tempo;
    const tiefe = kontext.createGain();
    tiefe.gain.value = frequenz * vibrato.tiefe;
    zitter.connect(tiefe).connect(welle.frequency);
    zitter.start(t);
    zitter.stop(t + dauer + 0.05);
  }

  if (filter) welle.connect(filterBauen(filter, t, dauer)).connect(verstaerker);
  else welle.connect(verstaerker);
  verstaerker.connect(ziel);
  welle.start(t);
  welle.stop(t + dauer + 0.05);
  welle.onended = () => verstaerker.disconnect();
}

// Rauschen, durch einen Filter geschickt: Daraus werden Wind, Wasser,
// Schritte, Knistern und das Schlagzeug.
export function rauschen({ start = 0, zeit, dauer = 0.2, lautstaerke = 0.3, anschlag = 0.005, ausklang = null, filter, zittern, ziel = geraeuschWeg }) {
  if (!bereit() || !ziel) return;
  const t = zeit ?? kontext.currentTime + start;
  const quelle = kontext.createBufferSource();
  quelle.buffer = rauschBuffer;
  quelle.loop = true;
  const verstaerker = kontext.createGain();
  huelleSetzen(verstaerker, t, dauer, lautstaerke, anschlag, ausklang);

  // zittern lässt die Lautstärke schnell flattern (zum Beispiel für Rascheln).
  let flattern = null;
  if (zittern) {
    flattern = kontext.createOscillator();
    flattern.frequency.value = zittern;
    const tiefe = kontext.createGain();
    tiefe.gain.value = lautstaerke * 0.8;
    flattern.connect(tiefe).connect(verstaerker.gain);
    flattern.start(t);
    flattern.stop(t + dauer + 0.05);
  }

  const weg = filter ? filterBauen(filter, t, dauer) : null;
  if (weg) quelle.connect(weg).connect(verstaerker);
  else quelle.connect(verstaerker);
  verstaerker.connect(ziel);
  quelle.start(t, Math.random() * 1.5);
  quelle.stop(t + dauer + 0.05);
  quelle.onended = () => verstaerker.disconnect();
}

// Ein Ton, der so lange klingt, bis man ihn abschaltet. Man kann ihn
// leiser und lauter machen und von links nach rechts schieben, zum Beispiel
// je nachdem, wie nah man an etwas dran ist.
export function dauerton(baue) {
  if (!kontext) return null;
  const lautstaerke = kontext.createGain();
  lautstaerke.gain.value = 0;
  const seite = kontext.createStereoPanner ? kontext.createStereoPanner() : null;
  if (seite) lautstaerke.connect(seite).connect(geraeuschWeg);
  else lautstaerke.connect(geraeuschWeg);
  const quellen = baue(kontext, lautstaerke);
  let aus = false;
  return {
    setzen(wert, pan = 0) {
      if (aus) return;
      lautstaerke.gain.setTargetAtTime(wert, kontext.currentTime, 0.15);
      if (seite) seite.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), kontext.currentTime, 0.15);
    },
    beenden() {
      if (aus) return;
      aus = true;
      lautstaerke.gain.setTargetAtTime(0, kontext.currentTime, 0.1);
      setTimeout(() => {
        for (const quelle of quellen) quelle.stop();
        lautstaerke.disconnect();
        seite?.disconnect();
      }, 600);
    },
  };
}

// Wandelt eine Notennummer (60 ist das mittlere C) in Hertz um.
export function hertz(note) {
  return 440 * 2 ** ((note - 69) / 12);
}
