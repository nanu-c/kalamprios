// Lässt die Sätze aus src/daten/geschichte.js von einer OpenAI-Stimme sprechen
// und legt sie als MP3 in public/stimme ab. Das Spiel spielt sie dann ab.
//
// Starten im Terminal:  npm run stimmen
//
// Der Schlüssel steht in der Datei .env (sie wird nicht hochgeladen).
// Es werden nur Sätze neu gesprochen, die sich geändert haben oder neu sind.
// Sätze ohne Aufnahme liest das Spiel mit der Stimme des Browsers vor.
// Neue Sätze werden etwas zügiger gesprochen (ZUEGIG). Alte Aufnahmen bleiben, wie sie sind.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { GESCHICHTE } from '../src/daten/geschichte.js';
import { ORTE } from '../src/daten/orte.js';

const MODELL = 'gpt-4o-mini-tts';
const STIMME = 'coral';
const ERZAEHLERIN =
  'Du bist eine warme, ruhige Märchenerzählerin für Kinder und sprichst Deutsch. ' +
  'Erzähle langsam, deutlich und ein bisschen geheimnisvoll.';
const KRISTALL =
  ERZAEHLERIN +
  ' Was in Anführungszeichen steht, sagt ein kleiner verzauberter Kristall, der sein Licht verloren hat: ' +
  'leise, flüsternd und ein wenig ängstlich.';

const RAETSELSTEIN =
  ERZAEHLERIN +
  ' Was in Anführungszeichen steht, sagt ein alter, freundlicher Rätselstein: ' +
  'tief, gemütlich und ein bisschen verschmitzt, wie ein lieber Großvater.';

// Kommt bei neuen Sätzen zur Anweisung dazu.
const ZUEGIG = ' Sprich dabei etwas zügiger als sonst, aber immer noch deutlich.';

const ORDNER = new URL('../public/stimme/', import.meta.url);
const LISTE = new URL('stimmen.json', ORDNER);

function schluesselLesen() {
  const env = new URL('../.env', import.meta.url);
  if (!existsSync(env)) throw new Error('Die Datei .env fehlt.');
  for (const zeile of readFileSync(env, 'utf8').split('\n')) {
    const text = zeile.trim();
    // Erlaubt ist "OPENAI_API_KEY=sk-..." oder nur der Schlüssel allein.
    const wert = text.includes('=') ? text.slice(text.indexOf('=') + 1).trim() : text;
    if (wert.startsWith('sk-')) return wert.replace(/^["']|["']$/g, '');
  }
  throw new Error('In .env steht kein OpenAI-Schlüssel (er beginnt mit sk-).');
}

function dateiname(text, anweisung) {
  return `${createHash('sha1').update(`${MODELL}|${STIMME}|${anweisung}|${text}`).digest('hex').slice(0, 12)}.mp3`;
}

async function sprechen(schluessel, text, anweisung) {
  const antwort = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${schluessel}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODELL, voice: STIMME, input: text, instructions: anweisung, response_format: 'mp3' }),
  });
  if (!antwort.ok) throw new Error(`OpenAI sagt ${antwort.status}: ${await antwort.text()}`);
  return Buffer.from(await antwort.arrayBuffer());
}

const saetze = [
  ...GESCHICHTE.anfang.map((text) => [text, ERZAEHLERIN]),
  ...GESCHICHTE.ende.map((text) => [text, ERZAEHLERIN]),
  ...Object.values(GESCHICHTE.orte).flat().map((text) => [text, KRISTALL]),
  // Was die Rätselsteine sagen
  ...Object.values(ORTE)
    .map((ort) => ort.raetsel)
    .filter(Boolean)
    .flatMap((raetsel) => [...raetsel.aufgabe, raetsel.geschafft, ...(raetsel.fragen ?? []).map((frage) => frage.frage)])
    .map((text) => [text, RAETSELSTEIN]),
  // Was die Rätselsteine zwischendurch sagen. {fehlen} kann jede Zahl sein,
  // die beim Suchen noch fehlen kann.
  ...Object.entries(GESCHICHTE.raetsel ?? {}).flatMap(([name, text]) => {
    if (name !== 'suchWeiter') return [[text, RAETSELSTEIN]];
    const meiste = Math.max(0, ...Object.values(ORTE).map((ort) => ort.raetsel?.dinge?.length ?? 0));
    return Array.from({ length: Math.max(0, meiste - 1) }, (_, i) => [text.replace('{fehlen}', i + 2), RAETSELSTEIN]);
  }),
];

const schluessel = schluesselLesen();
mkdirSync(ORDNER, { recursive: true });
const liste = {};
let neu = 0;
for (const [text, langsam] of saetze) {
  // Gibt es schon eine Aufnahme (noch in der alten, ruhigeren Art)? Dann bleibt sie.
  if (existsSync(new URL(dateiname(text, langsam), ORDNER))) {
    liste[text] = dateiname(text, langsam);
    continue;
  }
  const anweisung = langsam + ZUEGIG;
  const name = dateiname(text, anweisung);
  liste[text] = name;
  if (existsSync(new URL(name, ORDNER))) continue;
  console.log(`Spreche: ${text}`);
  writeFileSync(new URL(name, ORDNER), await sprechen(schluessel, text, anweisung));
  neu += 1;
}

// Alte Aufnahmen von Sätzen, die es nicht mehr gibt, wegräumen.
const gebraucht = new Set(Object.values(liste));
for (const datei of readdirSync(ORDNER)) {
  if (datei.endsWith('.mp3') && !gebraucht.has(datei)) rmSync(new URL(datei, ORDNER));
}

writeFileSync(LISTE, `${JSON.stringify(liste, null, 2)}\n`);
console.log(`Fertig: ${neu} neu gesprochen, ${saetze.length} Sätze insgesamt.`);
