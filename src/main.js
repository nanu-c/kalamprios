// Hier startet das Spiel.

import Phaser from 'phaser';
import { AuswahlSzene } from './szenen/AuswahlSzene.js';
import { CharakterSzene } from './szenen/CharakterSzene.js';
import { KampfSzene } from './szenen/KampfSzene.js';
import { LadeSzene } from './szenen/LadeSzene.js';
import { WeltSzene } from './szenen/WeltSzene.js';
import { BREITE, HOEHE } from './szenen/stil.js';

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
  scene: [LadeSzene, CharakterSzene, AuswahlSzene, WeltSzene, KampfSzene],
});
