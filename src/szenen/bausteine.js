// Bausteine, aus denen die Bildschirme zusammengesetzt sind:
// Textfelder, Knöpfe und Auswahlkarten.

import { FARBEN, schrift } from './stil.js';

// Der gemalte Schriftzug "Kalamprios", der sanft leuchtet und schwebt.
// x, y ist die Mitte, breite die Breite auf dem Bildschirm.
export function titel(szene, x, y, breite) {
  const bild = szene.add.image(x, y, 'titel');
  bild.setScale(breite / bild.width);
  szene.tweens.add({
    targets: bild,
    y: y - 6,
    scale: bild.scale * 1.02,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return bild;
}

// Ein dunkles Feld mit Rahmen. x und y sind die linke obere Ecke.
export function feld(szene, x, y, breite, hoehe) {
  return szene.add
    .rectangle(x, y, breite, hoehe, FARBEN.feld, 0.92)
    .setOrigin(0)
    .setRounded(18)
    .setStrokeStyle(3, FARBEN.rand);
}

// Ein Knopf mit einer Zeile Text. Gibt seine Teile zurück: [Fläche, Schrift].
export function textKnopf(szene, x, y, breite, hoehe, text, beimKlick) {
  const flaeche = szene.add
    .rectangle(x, y, breite, hoehe, FARBEN.knopf)
    .setOrigin(0)
    .setRounded(14)
    .setStrokeStyle(3, FARBEN.rand)
    .setInteractive({ useHandCursor: true });
  const beschriftung = szene.add
    .text(x + breite / 2, y + hoehe / 2, text, schrift(26))
    .setOrigin(0.5);
  flaeche.on('pointerdown', beimKlick);
  return [flaeche, beschriftung];
}

// Eine Karte zum Auswählen, mit Bild, Name und einer kleinen Zeile darunter.
export function karte(szene, { x, y, breite, bild, name, zusatz = '', zusatzFarbe = '#d9c9ff', randFarbe, beimKlick }) {
  const hoehe = 400;
  const flaeche = szene.add
    .rectangle(x, y, breite, hoehe, FARBEN.feld, 0.9)
    .setRounded(24)
    .setStrokeStyle(3, FARBEN.rand)
    .setInteractive({ useHandCursor: true });

  const figur = szene.add.image(x, y - 50, bild);
  figur.setScale(Math.min(250 / figur.height, (breite - 40) / figur.width));

  szene.add.text(x, y + 118, name, schrift(Math.min(34, breite / 5))).setOrigin(0.5);
  szene.add.text(x, y + 160, zusatz, schrift(22, zusatzFarbe)).setOrigin(0.5);

  flaeche.on('pointerover', () => flaeche.setStrokeStyle(6, randFarbe ?? 0xffffff));
  flaeche.on('pointerout', () => flaeche.setStrokeStyle(3, FARBEN.rand));
  flaeche.on('pointerdown', beimKlick);
}

// Verteilt Karten nebeneinander und ruft für jede baueKarte(eintrag, x, breite) auf.
export function kartenreihe(gesamtbreite, eintraege, baueKarte) {
  const abstand = Math.min(360, (gesamtbreite - 80) / eintraege.length);
  eintraege.forEach((eintrag, nummer) => {
    const x = gesamtbreite / 2 + (nummer - (eintraege.length - 1) / 2) * abstand;
    baueKarte(eintrag, x, abstand - 40);
  });
}
