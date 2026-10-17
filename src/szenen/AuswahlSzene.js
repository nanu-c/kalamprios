// Der zweite Bildschirm: Hier sucht man sich sein Kalamprio aus.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { ELEMENTE } from '../daten/elemente.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { ruf } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { karte, kartenreihe } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, HOEHE, farbeAlsText, schrift } from './stil.js';

export class AuswahlSzene extends Phaser.Scene {
  constructor() {
    super('Auswahl');
  }

  create() {
    hintergrundMalen(this);
    this.add.rectangle(0, 0, BREITE, HOEHE, 0x170b2c, 0.45).setOrigin(0);

    const charakter = CHARAKTERE[spielstand.charakter];
    this.add.text(BREITE / 2, 80, `Hallo ${charakter.name}!`, schrift(64, '#f6f0ff')).setOrigin(0.5);
    this.add.text(BREITE / 2, 152, 'Wähle dein Kalamprio', schrift(30, '#d9c9ff')).setOrigin(0.5);

    kartenreihe(BREITE, waehlbare(), (kurzname, x, breite) => {
      const tier = KALAMPRIOS[kurzname];
      const element = ELEMENTE[tier.element];
      karte(this, {
        x,
        y: 440,
        breite,
        bild: kurzname,
        name: tier.name,
        zusatz: element.name,
        zusatzFarbe: farbeAlsText(element.farbe),
        randFarbe: element.farbe,
        beimKlick: () => this.waehlen(kurzname),
        // Jedes Kalamprio ruft, wenn man es sich ansieht.
        beimZeigen: () => ruf(kurzname),
      });
    });
  }

  waehlen(kurzname) {
    ruf(kurzname);
    spielstand.kalamprio = kurzname;
    spielstand.team = [kurzname];
    spielstand.kampfteam = [kurzname];
    // Die Rivalin bekommt das erste Kalamprio, das man nicht gewählt hat.
    spielstand.rivalinKalamprio = waehlbare().find((anderes) => anderes !== kurzname);
    this.scene.start('Welt');
  }
}

// Die Kalamprios mit zumStart: true. Die anderen fängt man später.
function waehlbare() {
  return Object.keys(KALAMPRIOS).filter((kurzname) => KALAMPRIOS[kurzname].zumStart);
}
