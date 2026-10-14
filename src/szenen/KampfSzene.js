// Der Kampfbildschirm. Die Regeln selbst stehen in kampf/kampflogik.js,
// hier wird nur gezeigt, was dort passiert.

import Phaser from 'phaser';
import { ELEMENTE } from '../daten/elemente.js';
import { ORTE } from '../daten/orte.js';
import {
  attackeAusfuehren,
  gegnerWaehlt,
  istBereit,
  kaempferErstellen,
  rundeBeenden,
  werZuerst,
} from '../kampf/kampflogik.js';
import { spielstand } from '../spielstand.js';
import { feld, textKnopf } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, FARBEN, farbeAlsText, schrift } from './stil.js';

const BODEN = 520; // auf dieser Höhe stehen die Kalamprios
const TIERHOEHE = 300;
const FELDBREITE = 420;

function runden(anzahl) {
  return anzahl === 1 ? '1 Runde' : `${anzahl} Runden`;
}

export class KampfSzene extends Phaser.Scene {
  constructor() {
    super('Kampf');
  }

  // auswahl sagt, wer kämpft und was danach passiert:
  //   spieler, gegner: Kurznamen aus kalamprios.js
  //   trainerin:       Name der Rivalin, falls der Gegner ihr gehört
  //   nachKampf:       wird am Ende aufgerufen, mit true bei einem Sieg
  init(auswahl) {
    this.auswahl = auswahl;
  }

  create() {
    // Der Hintergrund passt zum Ort, an dem gekämpft wird.
    hintergrundMalen(this, ORTE[spielstand.ort].stil);
    this.cameras.main.fadeIn(300, 23, 11, 44);

    this.spieler = kaempferErstellen(this.auswahl.spieler);
    this.gegner = kaempferErstellen(this.auswahl.gegner);

    // Zu jedem Kämpfer merken wir uns, was von ihm auf dem Bildschirm zu sehen ist.
    this.anzeige = new Map();
    this.aufstellen(this.spieler, 'links');
    this.aufstellen(this.gegner, 'rechts');

    feld(this, 40, 570, 560, 130);
    this.meldung = this.add.text(
      64,
      590,
      '',
      schrift(26, '#ffffff', { wordWrap: { width: 512 }, lineSpacing: 6 }),
    );

    this.knoepfe = this.spieler.attacken.map((attacke, nummer) => this.knopfBauen(attacke, nummer));

    const { trainerin } = this.auswahl;
    const auftritt = trainerin
      ? `${trainerin} schickt ${this.gegner.name} in den Kampf!`
      : `${this.gegner.name} stellt sich dir in den Weg!`;
    this.sagen(`${auftritt}\nWas soll ${this.spieler.name} tun?`);
    this.knoepfeZeigen(true);
  }

  // ---------------------------------------------------------------- Aufbau

  aufstellen(kaempfer, seite) {
    const links = seite === 'links';
    const x = links ? 330 : 950;

    this.add.ellipse(x, BODEN, 360, 64, 0x170b2c, 0.5);
    const bild = this.add.image(x, BODEN + 10, kaempfer.kurzname).setOrigin(0.5, 1);
    bild.setScale(Math.min(TIERHOEHE / bild.height, 380 / bild.width));
    // Schaut das Tier auf seinem Bild vom Gegner weg, wird es gespiegelt.
    bild.setFlipX(kaempfer.blick === (links ? 'links' : 'rechts'));
    // Atmen
    this.tweens.add({
      targets: bild,
      scaleY: bild.scaleY * 1.03,
      duration: links ? 1100 : 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const feldX = links ? 40 : BREITE - 40 - FELDBREITE;
    const element = ELEMENTE[kaempfer.element];
    feld(this, feldX, 30, FELDBREITE, 106);
    this.add.text(feldX + 24, 42, kaempfer.name, schrift(30));
    this.add
      .text(feldX + FELDBREITE - 24, 50, element.name, schrift(20, farbeAlsText(element.farbe)))
      .setOrigin(1, 0);
    this.add.rectangle(feldX + 24, 104, 250, 18, 0x170b2c).setOrigin(0, 0.5);
    const balken = this.add.rectangle(feldX + 24, 104, 250, 18, FARBEN.kpGut).setOrigin(0, 0.5);
    const kpText = this.add
      .text(feldX + FELDBREITE - 24, 104, '', schrift(18, '#d9c9ff'))
      .setOrigin(1, 0.5);

    this.anzeige.set(kaempfer, { bild, balken, kpText, richtung: links ? 1 : -1 });
    this.kpZeigen(kaempfer, kaempfer.kp);
  }

  knopfBauen(attacke, nummer) {
    const x = 620 + (nummer % 2) * 320;
    const y = 570 + Math.floor(nummer / 2) * 68;

    const flaeche = this.add
      .rectangle(x, y, 300, 62, FARBEN.knopf)
      .setOrigin(0)
      .setRounded(14)
      .setStrokeStyle(3, FARBEN.rand);
    const name = this.add.text(x + 18, y + 9, attacke.name, schrift(23));
    const hinweis = this.add.text(x + 18, y + 38, '', schrift(15, '#d9c9ff'));

    flaeche.on('pointerdown', () => this.rundeSpielen(attacke));
    return { attacke, teile: [flaeche, name, hinweis], flaeche, hinweis };
  }

  // --------------------------------------------------------------- Anzeige

  sagen(text) {
    this.meldung.setText(text);
  }

  kpZeigen(kaempfer, kp) {
    const { balken, kpText } = this.anzeige.get(kaempfer);
    const anteil = kp / kaempfer.maxKp;
    balken.scaleX = anteil;
    balken.setFillStyle(
      anteil > 0.5 ? FARBEN.kpGut : anteil > 0.2 ? FARBEN.kpMittel : FARBEN.kpWenig,
    );
    kpText.setText(`${Math.round(kp)} / ${kaempfer.maxKp} KP`);
  }

  // Zeigt bei jedem Knopf, ob die Attacke bereit ist oder noch Pause hat.
  knoepfeZeigen(spielerIstDran) {
    for (const { attacke, teile, flaeche, hinweis } of this.knoepfe) {
      const bereit = istBereit(attacke);
      const klickbar = spielerIstDran && bereit;

      if (klickbar) flaeche.setInteractive({ useHandCursor: true });
      else flaeche.disableInteractive();
      for (const teil of teile) teil.setAlpha(klickbar ? 1 : 0.45);

      if (!bereit) hinweis.setText(`Pause: noch ${runden(attacke.bereitIn)}`);
      else if (attacke.pause > 0) hinweis.setText(`Stärke ${attacke.staerke} · danach ${runden(attacke.pause)} Pause`);
      else hinweis.setText(`Stärke ${attacke.staerke} · ohne Pause`);
    }
  }

  schadenZeigen(bild, schaden) {
    const zahl = this.add
      .text(bild.x, bild.y - bild.displayHeight - 10, `-${schaden}`, schrift(44, '#ff8fa3', { fontStyle: 'bold' }))
      .setOrigin(0.5);
    this.tweens.add({
      targets: zahl,
      y: zahl.y - 60,
      alpha: 0,
      duration: 900,
      onComplete: () => zahl.destroy(),
    });
  }

  // Zwei kleine Helfer, damit der Ablauf unten Schritt für Schritt lesbar ist:
  // "await" wartet, bis die Bewegung oder die Pause vorbei ist.
  bewegen(einstellungen) {
    return new Promise((fertig) => this.tweens.add({ ...einstellungen, onComplete: fertig }));
  }

  warten(millisekunden) {
    return new Promise((fertig) => this.time.delayedCall(millisekunden, fertig));
  }

  // ---------------------------------------------------------------- Ablauf

  async rundeSpielen(spielerAttacke) {
    this.knoepfeZeigen(false);
    const gegnerAttacke = gegnerWaehlt(this.gegner);

    for (const angreifer of werZuerst(this.spieler, this.gegner)) {
      const istSpieler = angreifer === this.spieler;
      const verteidiger = istSpieler ? this.gegner : this.spieler;
      await this.angriffZeigen(angreifer, verteidiger, istSpieler ? spielerAttacke : gegnerAttacke);

      if (verteidiger.kp === 0) {
        await this.kampfBeenden(angreifer, verteidiger);
        return;
      }
    }

    rundeBeenden([this.spieler, this.gegner]);
    this.sagen(`Was soll ${this.spieler.name} tun?`);
    this.knoepfeZeigen(true);
  }

  async angriffZeigen(angreifer, verteidiger, attacke) {
    const kpVorher = verteidiger.kp;
    const schaden = attackeAusfuehren(angreifer, verteidiger, attacke);
    const vonAngreifer = this.anzeige.get(angreifer);
    const vonVerteidiger = this.anzeige.get(verteidiger);

    this.sagen(`${angreifer.name} setzt ${attacke.name} ein!`);
    await this.warten(500);

    // Anlauf: kurz auf den Gegner zuspringen und zurück
    await this.bewegen({
      targets: vonAngreifer.bild,
      x: vonAngreifer.bild.x + vonAngreifer.richtung * 90,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Treffer: wackeln, blinken, Schadenszahl, Lebensbalken schrumpft
    this.cameras.main.shake(180, 0.006);
    this.schadenZeigen(vonVerteidiger.bild, schaden);
    this.tweens.add({ targets: vonVerteidiger.bild, alpha: 0.25, duration: 70, yoyo: true, repeat: 2 });
    await this.bewegen({
      targets: { kp: kpVorher },
      kp: verteidiger.kp,
      duration: 450,
      onUpdate: (tween, zaehler) => this.kpZeigen(verteidiger, zaehler.kp),
    });

    this.sagen(`${verteidiger.name} verliert ${schaden} Lebenspunkte.`);
    await this.warten(900);
  }

  async kampfBeenden(sieger, verlierer) {
    const { bild } = this.anzeige.get(verlierer);
    this.tweens.killTweensOf(bild);
    this.sagen(`${verlierer.name} kann nicht mehr kämpfen.`);
    await this.bewegen({ targets: bild, alpha: 0, y: bild.y + 40, duration: 600 });
    await this.warten(400);

    const gewonnen = sieger === this.spieler;
    if (gewonnen) this.sagen(`Du hast gewonnen!\n${sieger.name} freut sich.`);
    else this.sagen(`${verlierer.name} ist erschöpft.\nEs muss sich kurz erholen.`);

    for (const knopf of this.knoepfe) {
      for (const teil of knopf.teile) teil.setVisible(false);
    }
    textKnopf(this, 620, 570, 620, 62, 'Weiter', () => {
      this.auswahl.nachKampf?.(gewonnen);
      this.scene.start('Welt');
    });
  }
}
