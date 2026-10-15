// Hier startet das Spiel.

import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import Phaser from 'phaser';
import { AuswahlSzene } from './szenen/AuswahlSzene.js';
import { CharakterSzene } from './szenen/CharakterSzene.js';
import { EndeSzene } from './szenen/EndeSzene.js';
import { GeschichteSzene } from './szenen/GeschichteSzene.js';
import { KampfSzene } from './szenen/KampfSzene.js';
import { LadeSzene } from './szenen/LadeSzene.js';
import { StartSzene } from './szenen/StartSzene.js';
import { WeltSzene } from './szenen/WeltSzene.js';
import { BREITE, HOEHE } from './szenen/stil.js';
import { vollbildKnopfEinrichten } from './vollbild.js';

export const spiel = new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: '#170b2c',
  scale: {
    parent: 'spiel',
    mode: Phaser.Scale.FIT, // passt das Spiel an jede Bildschirmgröße an
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BREITE,
    height: HOEHE,
  },
  // Die Bildschirme des Spiels. Der erste in der Liste wird zuerst gezeigt.
  scene: [LadeSzene, StartSzene, GeschichteSzene, CharakterSzene, AuswahlSzene, WeltSzene, KampfSzene, EndeSzene],
});

vollbildKnopfEinrichten();
