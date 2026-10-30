// Hier startet das Spiel.

import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import Phaser from 'phaser';
import { CharakterSzene } from './szenen/CharakterSzene.js';
import { EndeSzene } from './szenen/EndeSzene.js';
import { GeschichteSzene } from './szenen/GeschichteSzene.js';
import { KampfSzene } from './szenen/KampfSzene.js';
import { LadeSzene, NachladeSzene } from './szenen/LadeSzene.js';
import { StartSzene } from './szenen/StartSzene.js';
import { WeltSzene } from './szenen/WeltSzene.js';
import { ZusammenKampfSzene } from './szenen/ZusammenKampfSzene.js';
import { BREITE, HOEHE } from './szenen/stil.js';
import { speichern } from './spielstand.js';
import { tonKnopfEinrichten } from './klang/tonKnopf.js';
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
  // Die Töne macht das Spiel selbst (Ordner klang), Phaser braucht dafür nichts.
  audio: { noAudio: true },
  // Die Bildschirme des Spiels. Der erste in der Liste wird zuerst gezeigt.
  scene: [LadeSzene, NachladeSzene, StartSzene, GeschichteSzene, CharakterSzene, WeltSzene, KampfSzene, ZusammenKampfSzene, EndeSzene],
});

vollbildKnopfEinrichten();
tonKnopfEinrichten();

// Alle paar Sekunden den Spielstand im Browser speichern, und auch dann,
// wenn das Fenster geschlossen oder versteckt wird.
setInterval(() => speichern(), 3000);
window.addEventListener('pagehide', () => speichern());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') speichern();
});
