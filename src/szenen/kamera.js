// Die Kamera und das Fotoalbum. Die Kamera schenkt einem die Rivalin, wenn
// man sie besiegt hat. Damit fotografiert man Kalamprios: draußen das wilde
// Kalamprio, das am nächsten ist (WeltSzene), im Kampf den Gegner
// (KampfSzene). Jedes Foto kommt ins Fotoalbum. Ist das Album voll, gibt es
// eine Belohnung (albumVollFangkristalle in regeln.js).

import Phaser from 'phaser';
import { ELEMENTE } from '../daten/elemente.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { ORTE } from '../daten/orte.js';
import { REGELN } from '../daten/regeln.js';
import { ausloeser, klick, sternchen } from '../klang/geraeusche.js';
import { melodieSpielen } from '../klang/musik.js';
import { spielstand } from '../spielstand.js';
import { feld, textKnopf } from './bausteine.js';
import { wuerfel } from './raetsel.js';
import { BREITE, HOEHE, schrift } from './stil.js';

const VORNE = 100000;
const FOTO = { breite: 220, hoehe: 260, bild: 170 }; // so groß ist ein Foto im Album

// Alle Kalamprios, die ins Album kommen, in der Reihenfolge aus kalamprios.js
export function albumKalamprios() {
  return Object.keys(KALAMPRIOS);
}

export function fotoAnzahl() {
  return albumKalamprios().filter((kurzname) => spielstand.fotos[kurzname]).length;
}

// Malt ein Foto: ein weißer Rahmen wie bei einem Sofortbild, darin das
// Kalamprio vor einem Himmel in der Farbe seines Elements, darunter der
// Name. Gibt es noch kein Foto, ist nur ein dunkler Schatten zu sehen.
// Zurück kommt ein Container, dessen Mitte (x, y) ist.
export function fotoBauen(szene, x, y, kurzname, { schatten = false, groesse = 1 } = {}) {
  const tier = KALAMPRIOS[kurzname];
  const farbe = ELEMENTE[tier.element]?.farbe ?? 0xc9b8ff;
  const ort = spielstand.fotos[kurzname];
  return sofortbild(szene, x, y, {
    bild: kurzname,
    name: tier.name,
    unterzeile: ORTE[ort]?.name ?? '',
    himmel: Phaser.Display.Color.ValueToColor(farbe).lighten(15).color,
    schatten,
    groesse,
  });
}

// Ein Foto von einer Pflanze aus dem Regenwald (art und name wie in regenwald.js).
export function pflanzenFotoBauen(szene, x, y, pflanze, { schatten = false, groesse = 1 } = {}) {
  return sofortbild(szene, x, y, { bild: `pflanze-${pflanze.art}`, name: pflanze.name, unterzeile: 'Regenwald', himmel: 0xbfe6b0, schatten, groesse });
}

// Ein Sofortbild: weißer Rahmen, darin das Bild vor einem farbigen Himmel,
// darunter Name und Unterzeile. Mit schatten ist nur ein dunkler Umriss da.
function sofortbild(szene, x, y, { bild: bildName, name, unterzeile, himmel, schatten, groesse }) {
  const { breite, hoehe } = FOTO;
  const teile = [
    szene.add.rectangle(3, 5, breite, hoehe, 0x170b2c, 0.35),
    szene.add.rectangle(0, 0, breite, hoehe, 0xfffaf0).setStrokeStyle(3, 0x6a5a8a),
    szene.add.rectangle(0, -22, breite - 24, FOTO.bild, schatten ? 0x2a2040 : himmel),
  ];
  const bild = szene.add.image(0, -22 + FOTO.bild / 2 - 6, bildName).setOrigin(0.5, 1);
  bild.setScale(Math.min((FOTO.bild - 20) / bild.height, (breite - 44) / bild.width));
  if (schatten) bild.setTint(0x120a24).setTintMode(Phaser.TintModes.FILL).setAlpha(0.85);
  teile.push(bild);
  teile.push(szene.add.text(0, hoehe / 2 - 52, schatten ? '???' : name, schrift(22, '#3a2a5a', { fontStyle: '600' })).setOrigin(0.5, 0));
  if (!schatten && unterzeile) teile.push(szene.add.text(0, hoehe / 2 - 24, unterzeile, schrift(14, '#7a6a9a')).setOrigin(0.5, 0));
  return szene.add.container(x, y, teile).setScale(groesse);
}

// Macht ein Foto von einem Kalamprio. bild ist sein Bild auf dem Bildschirm,
// zu ihm springt der Sucher. Danach zeigt sich das Foto groß und fliegt ins
// Album (ins ziel, ein Punkt auf dem Bildschirm, oder in die Mitte nach oben).
// Gibt ein Promise zurück, das fertig ist, wenn das Foto im Album ist.
export function fotografieren(szene, kurzname, bild, ziel = null) {
  const neu = !spielstand.fotos[kurzname];
  if (neu) spielstand.fotos[kurzname] = spielstand.ort;
  return new Promise((fertig) => {
    sucherZoomen(szene, bild, () => fotoZeigen(szene, kurzname, neu, ziel, fertig));
  });
}

// Der Sucher springt zum Bild: vier Ecken ziehen sich zusammen, dann Klick und Blitz.
function sucherZoomen(szene, bild, danach) {
  const kamera = szene.cameras.main;
  const aufDemSchirm = { x: bild.x - kamera.scrollX, y: bild.y - bild.displayHeight / 2 - kamera.scrollY };

  // Der Sucher: vier Ecken um das Kalamprio, die sich zusammenziehen
  const sucher = szene.add.graphics().setScrollFactor(0).setDepth(VORNE + 300);
  const groesse = Math.max(bild.displayWidth, bild.displayHeight) * 0.75 + 30;
  const ecken = (g) => {
    sucher.clear();
    sucher.lineStyle(5, 0xffffff, 1);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const ex = aufDemSchirm.x + dx * g;
      const ey = aufDemSchirm.y + dy * g;
      sucher.lineBetween(ex, ey, ex - dx * 26, ey);
      sucher.lineBetween(ex, ey, ex, ey - dy * 26);
    }
  };
  const zoom = { g: groesse * 1.6 };
  ecken(zoom.g);
  szene.tweens.add({
    targets: zoom,
    g: groesse,
    duration: 350,
    ease: 'Cubic.easeOut',
    onUpdate: () => ecken(zoom.g),
    onComplete: () => {
      // Klick! Ein weißer Blitz über den ganzen Bildschirm
      ausloeser();
      const blitz = szene.add.rectangle(0, 0, BREITE, HOEHE, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(VORNE + 301);
      szene.tweens.add({ targets: blitz, alpha: 0, duration: 450, onComplete: () => blitz.destroy() });
      sucher.destroy();
      danach();
    },
  });
}

// Ein Pflanzenfoto erscheint groß und fliegt ins Pflanzenalbum (ziel).
// Gibt ein Promise zurück, das fertig ist, wenn es angekommen ist.
export function pflanzenFotoZeigen(szene, pflanze, neu, ziel) {
  return new Promise((fertig) => {
    const foto = pflanzenFotoBauen(szene, BREITE / 2, HOEHE / 2 - 30, pflanze).setScrollFactor(0).setDepth(VORNE + 302).setScale(0.2).setAngle(-20);
    const text = szene.add
      .text(BREITE / 2, HOEHE / 2 + 130, neu ? `Neu im Pflanzenalbum: ${pflanze.name}!` : `${pflanze.name} hast du schon.`, schrift(30, '#f6f0ff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#1a3a1a', 8)
      .setScrollFactor(0)
      .setDepth(VORNE + 302);
    if (neu) sternchen();
    szene.tweens.add({ targets: foto, scale: 1.2, angle: -4, duration: 450, ease: 'Back.easeOut' });
    szene.time.delayedCall(1800, () => {
      szene.tweens.add({ targets: text, alpha: 0, duration: 300, onComplete: () => text.destroy() });
      szene.tweens.add({
        targets: foto,
        x: ziel.x,
        y: ziel.y,
        scale: 0.12,
        angle: 20,
        duration: 600,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          foto.destroy();
          fertig();
        },
      });
    });
  });
}

// Das Foto erscheint groß in der Mitte und fliegt dann ins Album.
function fotoZeigen(szene, kurzname, neu, ziel, fertig) {
  const foto = fotoBauen(szene, BREITE / 2, HOEHE / 2 - 30, kurzname).setScrollFactor(0).setDepth(VORNE + 302).setScale(0.2).setAngle(-20);
  const text = szene.add
    .text(BREITE / 2, HOEHE / 2 + 130, neu ? `Neu im Album: ${KALAMPRIOS[kurzname].name}!` : `${KALAMPRIOS[kurzname].name} ist schon im Album.`, schrift(30, '#f6f0ff', { fontStyle: '600' }))
    .setOrigin(0.5)
    .setStroke('#2a1650', 8)
    .setScrollFactor(0)
    .setDepth(VORNE + 302);
  if (neu) sternchen();
  szene.tweens.add({ targets: foto, scale: 1.2, angle: -4, duration: 450, ease: 'Back.easeOut' });
  szene.time.delayedCall(1800, () => {
    szene.tweens.add({ targets: text, alpha: 0, duration: 300, onComplete: () => text.destroy() });
    szene.tweens.add({
      targets: foto,
      x: ziel?.x ?? BREITE / 2,
      y: ziel?.y ?? -100,
      scale: 0.12,
      angle: 20,
      duration: 600,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        foto.destroy();
        fertig({ neu, voll: neu && albumGeradeVoll() });
      },
    });
  });
}

// Ist das Album gerade voll geworden? Dann gibt es einmal die Belohnung.
function albumGeradeVoll() {
  if (spielstand.albumVoll || fotoAnzahl() < albumKalamprios().length) return false;
  spielstand.albumVoll = true;
  spielstand.fangkristalle += REGELN.albumVollFangkristalle;
  melodieSpielen('sieg');
  return true;
}

export function albumVollSatz() {
  return `Dein Fotoalbum ist voll! Du hast alle ${albumKalamprios().length} Kalamprios fotografiert. Als Belohnung bekommst du ${REGELN.albumVollFangkristalle} Fangkristalle.`;
}

// ------------------------------------------------------------ Das Album

// Das Fotoalbum: ein Buch mit zwei Seiten nebeneinander, auf jeder Seite
// zwei Fotos. Mit den Pfeilen blättert man um. Gibt die Teile zurück, damit
// die Szene sie wieder wegräumen kann. schliessen wird beim „Fertig“ aufgerufen.
// pflanzen: Statt der Kalamprios die Pflanzen aus dem Regenwald. Dann ist
// auf jeder Seite ein Foto, und darunter steht die Notiz der Biologin.
export function albumZeigen(szene, schliessen, pflanzen = null) {
  const alle = pflanzen ?? albumKalamprios();
  const hat = (eintrag) => (pflanzen ? spielstand.pflanzenFotos[eintrag.art] : spielstand.fotos[eintrag]);
  const jeSeite = pflanzen ? 2 : REGELN.fotosJeSeite;
  const seiten = Math.max(1, Math.ceil(alle.length / jeSeite));
  const anzahl = alle.filter(hat).length;
  const titelText = pflanzen ? `Pflanzenalbum · ${anzahl} von ${alle.length}` : `Fotoalbum · ${anzahl} von ${alle.length}`;
  const teile = [
    szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.65).setOrigin(0).setInteractive(),
    // Der Einband (beim Pflanzenalbum grün) und die zwei hellen Buchseiten
    szene.add.rectangle(BREITE / 2, 360, 1120, 580, pflanzen ? 0x3f7a3a : 0x6b3fa0).setStrokeStyle(6, 0x2a1650),
    szene.add.rectangle(BREITE / 2 - 272, 365, 532, 540, 0xf6efe0).setStrokeStyle(2, 0xcab8a0),
    szene.add.rectangle(BREITE / 2 + 272, 365, 532, 540, 0xf6efe0).setStrokeStyle(2, 0xcab8a0),
    szene.add.rectangle(BREITE / 2, 365, 14, 540, 0xcab8a0),
    feld(szene, BREITE / 2 - 260, 14, 520, 60),
    szene.add.text(BREITE / 2, 44, titelText, schrift(30, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
  ];
  const seitenText = szene.add.text(BREITE / 2, 690, '', schrift(20, '#f6f0ff')).setOrigin(0.5);
  teile.push(seitenText);

  let seite = 0;
  let fotos = [];
  const zufall = wuerfel(5);
  const winkel = alle.map(() => (zufall() - 0.5) * 7); // jedes Foto ist ein bisschen schief eingeklebt
  const blaettern = (wohin) => {
    for (const foto of fotos) foto.destroy();
    seite = Phaser.Math.Clamp(wohin, 0, seiten - 1);
    const plaetze = pflanzen
      ? [
          [BREITE / 2 - 272, 250],
          [BREITE / 2 + 272, 250],
        ]
      : [
          [BREITE / 2 - 400, 365],
          [BREITE / 2 - 144, 365],
          [BREITE / 2 + 144, 365],
          [BREITE / 2 + 400, 365],
        ];
    fotos = alle.slice(seite * jeSeite, (seite + 1) * jeSeite).flatMap((eintrag, nummer) => {
      const [x, y] = plaetze[nummer % plaetze.length];
      const schatten = !hat(eintrag);
      const foto = pflanzen
        ? pflanzenFotoBauen(szene, x, y, eintrag, { schatten, groesse: 0.9 })
        : fotoBauen(szene, x, y, eintrag, { schatten, groesse: 0.98 });
      foto.setAngle(winkel[seite * jeSeite + nummer]);
      // Die Fotos klappen beim Umblättern auf.
      szene.tweens.add({ targets: foto, scaleX: { from: 0, to: foto.scaleX }, duration: 220, delay: nummer * 60, ease: 'Sine.easeOut' });
      const dazu = [foto];
      // Im Pflanzenalbum steht unter dem Foto die Notiz, wie mit Bleistift geschrieben.
      if (pflanzen) {
        dazu.push(
          szene.add
            .text(x, y + 135, schatten ? 'Diese Pflanze hast du noch nicht fotografiert.' : eintrag.notiz.replace(`${eintrag.name}: `, ''), schrift(19, '#3a4a2a', { wordWrap: { width: 460 }, align: 'center', fontStyle: 'italic' }))
            .setOrigin(0.5, 0),
        );
      }
      szene.festkleben?.(dazu, VORNE + 110);
      return dazu;
    });
    seitenText.setText(`Seite ${seite + 1} von ${seiten}`);
    zurueck.forEach((teil) => teil.setAlpha(seite > 0 ? 1 : 0.35));
    vor.forEach((teil) => teil.setAlpha(seite < seiten - 1 ? 1 : 0.35));
  };
  const zurueck = textKnopf(szene, 70, 662, 150, 56, '◀', () => blaettern(seite - 1));
  const vor = textKnopf(szene, BREITE - 220, 662, 150, 56, '▶', () => blaettern(seite + 1));
  const fertigKnopf = textKnopf(szene, BREITE / 2 + 100, 662, 170, 56, 'Fertig', () => {
    for (const foto of fotos) foto.destroy();
    schliessen();
  });
  teile.push(...zurueck, ...vor, ...fertigKnopf);
  szene.festkleben?.(teile, VORNE + 100);
  seitenText.setX(BREITE / 2 - 90);
  blaettern(0);
  klick();
  return { teile, fotosWeg: () => fotos.forEach((foto) => foto.destroy()) };
}
