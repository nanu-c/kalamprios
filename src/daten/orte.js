// Alle Orte der Welt von Kalamprios. Jeder Ort hat eine eigene Datei im
// Ordner orte. Was in so einer Datei steht, ist in orte/kristallwald.js erklärt.

import {
  GEHEIMGANG_FARBEN,
  GEHEIMGANG_LICHTER,
  GEHEIMGANG_PAARE,
  GEHEIMGANG_SPIEGEL,
  GEHEIMGANG_STIMMEN,
  GEHEIMGANG_WEG,
  SCHATZKAMMER,
} from './orte/geheimgang.js';
import { KINDERZIMMER, KUECHE } from './orte/haus.js';
import { KRISTALLWALD } from './orte/kristallwald.js';
import { REGENWALD } from './orte/regenwald.js';
import { UNTERWASSER } from './orte/unterwasser.js';
import { LILA_DORF } from './orte/lilaDorf.js';
import { MONDSEE } from './orte/mondsee.js';
import { PRISMASTAHL_MINE } from './orte/prismastahlMine.js';

// Der Kurzname links benutzt man bei den Ausgängen (nach: 'kristallwald').
export const ORTE = {
  lilaDorf: LILA_DORF,
  kristallwald: KRISTALLWALD,
  prismastahlMine: PRISMASTAHL_MINE,
  mondsee: MONDSEE,
  // Unter Wasser im Mondsee (Tauchplatz am Ufer, nur mit Lungenkraut)
  unterwasser: UNTERWASSER,
  // Der Regenwald hinter dem geheimen Portal im Kristallwald
  regenwald: REGENWALD,
  // Das Kinderzimmer im gemalten Haus und die Küche im Haus mit dem blauen
  // Dach (Türen im Lila Dorf)
  kinderzimmer: KINDERZIMMER,
  kueche: KUECHE,
  // Der Geheimgang unter dem Kristallwald (Pilzring im Kristallwald)
  geheimgangFarben: GEHEIMGANG_FARBEN,
  geheimgangStimmen: GEHEIMGANG_STIMMEN,
  geheimgangPaare: GEHEIMGANG_PAARE,
  geheimgangWeg: GEHEIMGANG_WEG,
  geheimgangSpiegel: GEHEIMGANG_SPIEGEL,
  geheimgangLichter: GEHEIMGANG_LICHTER,
  schatzkammer: SCHATZKAMMER,
};

// Hier beginnt das Spiel: im Kinderzimmer.
export const START_ORT = 'kinderzimmer';
