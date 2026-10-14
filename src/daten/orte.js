// Alle Orte der Welt von Kalamprios. Jeder Ort hat eine eigene Datei im
// Ordner orte. Was in so einer Datei steht, ist in orte/kristallwald.js erklärt.

import { KRISTALLWALD } from './orte/kristallwald.js';
import { LILA_DORF } from './orte/lilaDorf.js';
import { MONDSEE } from './orte/mondsee.js';
import { PRISMASTAHL_MINE } from './orte/prismastahlMine.js';

// Der Kurzname links benutzt man bei den Ausgängen (nach: 'kristallwald').
export const ORTE = {
  lilaDorf: LILA_DORF,
  kristallwald: KRISTALLWALD,
  prismastahlMine: PRISMASTAHL_MINE,
  mondsee: MONDSEE,
};

// Hier beginnt das Spiel.
export const START_ORT = 'lilaDorf';
