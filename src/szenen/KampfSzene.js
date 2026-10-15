// Der Kampfbildschirm. Die Regeln selbst stehen in kampf/kampflogik.js,
// hier wird nur gezeigt, was dort passiert.

import Phaser from 'phaser';
import { ELEMENTE } from '../daten/elemente.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { ORTE } from '../daten/orte.js';
import {
  attackeAusfuehren,
  erfahrungBisNaechstesLevel,
  erfahrungFuerSieg,
  fangChance,
  fangen,
  gegnerWaehlt,
  istBereit,
  kaempferErstellen,
  levelAusErfahrung,
  levelFortschritt,
  rundeBeenden,
  werZuerst,
} from '../kampf/kampflogik.js';
import { REGELN } from '../daten/regeln.js';
import { erholtSichNoch, levelVon, spielstand } from '../spielstand.js';
import { attackeAnimieren } from './attackenEffekte.js';
import { feld, textKnopf } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { BREITE, FARBEN, HOEHE, farbeAlsText, schrift } from './stil.js';

const BODEN = 520; // auf dieser Höhe stehen die Kalamprios
const TIERHOEHE = 300;
const FELDBREITE = 420;
const FLUGHOEHE = 80; // so hoch schweben Kalamprios mit fliegt: true

function runden(anzahl) {
  return anzahl === 1 ? '1 Runde' : `${anzahl} Runden`;
}

export class KampfSzene extends Phaser.Scene {
  constructor() {
    super('Kampf');
  }

  // auswahl sagt, wer kämpft und was danach passiert:
  //   spieler, gegner: Kurznamen aus kalamprios.js. Die anderen Kalamprios
  //                    aus dem Team, die bereit sind, können eingewechselt werden.
  //   gegnerLevel:     wie stark der Gegner ist (1 bis 3)
  //   trainerin:       Name der Rivalin, falls der Gegner ihr gehört. Ohne
  //                    Trainerin ist der Gegner wild und man kann ihn fangen.
  //   nachKampf:       wird am Ende aufgerufen, mit true bei einem Sieg
  init(auswahl) {
    this.auswahl = auswahl;
  }

  create() {
    // Der Hintergrund passt zum Ort, an dem gekämpft wird.
    hintergrundMalen(this, ORTE[spielstand.ort].stil);
    this.cameras.main.fadeIn(300, 23, 11, 44);

    // Das ganze Team, das bereit ist. Wer kämpft, steht vorne in der Liste.
    const bereit = spielstand.team.filter((kurzname) => kurzname !== this.auswahl.spieler && erholtSichNoch(kurzname) === 0);
    this.team = [this.auswahl.spieler, ...bereit].map((kurzname) => kaempferErstellen(kurzname, levelVon(kurzname)));
    this.spieler = this.team[0];
    this.gegner = kaempferErstellen(this.auswahl.gegner, this.auswahl.gegnerLevel ?? 1);
    // Das geheime Kalamprio ist nur mit einem großen Team zu besiegen (regeln.js).
    this.geheim = Boolean(KALAMPRIOS[this.gegner.kurzname].geheim);
    this.zuStark = this.geheim && spielstand.team.length < REGELN.teamFuerGeheimes;

    // Zu jedem Kämpfer merken wir uns, was von ihm auf dem Bildschirm zu sehen ist.
    this.anzeige = new Map();
    this.aufstellen(this.spieler, 'links');
    this.aufstellen(this.gegner, 'rechts');
    this.knoepfe = [];

    feld(this, 40, 570, 560, 130);
    this.meldung = this.add.text(
      64,
      590,
      '',
      schrift(26, '#ffffff', { wordWrap: { width: 512 }, lineSpacing: 6 }),
    );

    this.attackenKnoepfeBauen();
    this.fangKnopf = this.auswahl.trainerin ? null : this.fangKnopfBauen();
    this.tauschKnopf = this.tauschKnopfBauen();

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

    // Wer fliegt, schwebt über seinem Schatten. Der Schatten ist dann kleiner.
    const fliegt = KALAMPRIOS[kaempfer.kurzname].fliegt;
    const schatten = this.add.ellipse(x, BODEN, fliegt ? 250 : 360, fliegt ? 44 : 64, 0x170b2c, 0.5);
    const bild = this.add.image(x, BODEN + 10 - (fliegt ? FLUGHOEHE : 0), kaempfer.kurzname).setOrigin(0.5, 1);
    bild.setScale(Math.min(TIERHOEHE / bild.height, 380 / bild.width));
    // Schaut das Tier auf seinem Bild vom Gegner weg, wird es gespiegelt.
    bild.setFlipX(kaempfer.blick === (links ? 'links' : 'rechts'));

    const feldX = links ? 40 : BREITE - 40 - FELDBREITE;
    const element = ELEMENTE[kaempfer.element];
    const balken = this.add.rectangle(feldX + 24, 104, 250, 18, FARBEN.kpGut).setOrigin(0, 0.5);
    const kpText = this.add
      .text(feldX + FELDBREITE - 24, 104, '', schrift(18, '#d9c9ff'))
      .setOrigin(1, 0.5);
    // Alles, was zu diesem Kämpfer gehört. Beim Tauschen verschwindet es.
    const rahmen = feld(this, feldX, 30, FELDBREITE, 106);
    const name = this.add.text(feldX + 24, 42, kaempfer.name, schrift(30));
    const levelText = this.add.text(name.x + name.width + 12, 52, `Level ${kaempfer.level}`, schrift(18, '#ffd166'));
    const teile = [
      schatten,
      bild,
      rahmen,
      name,
      levelText,
      this.add.text(feldX + FELDBREITE - 24, 50, element.name, schrift(20, farbeAlsText(element.farbe))).setOrigin(1, 0),
      this.add.rectangle(feldX + 24, 104, 250, 18, 0x170b2c).setOrigin(0, 0.5),
    ];
    balken.setDepth(1);
    kpText.setDepth(1);
    teile.push(balken, kpText);

    // Beim eigenen Kalamprio: ein goldener Balken für die Erfahrung. Ist er
    // voll, kommt das nächste Level.
    let erfahrungBalken = null;
    if (links) {
      const erfahrung = spielstand.erfahrung[kaempfer.kurzname] ?? 0;
      teile.push(this.add.rectangle(feldX + 24, 124, 250, 6, 0x170b2c).setOrigin(0, 0.5));
      erfahrungBalken = this.add.rectangle(feldX + 24, 124, 250, 6, 0xffd166).setOrigin(0, 0.5).setDepth(1);
      erfahrungBalken.scaleX = levelFortschritt(erfahrung);
      teile.push(erfahrungBalken, this.add.text(feldX + 284, 124, 'Erfahrung', schrift(13, '#ffd166')).setOrigin(0, 0.5));
    }

    this.anzeige.set(kaempfer, {
      teile,
      erfahrungBalken,
      levelText,
      bild,
      schatten,
      balken,
      kpText,
      richtung: links ? 1 : -1,
      fliegt,
      grund: { y: bild.y, scale: bild.scaleX },
      tempo: links ? 1100 : 1300,
    });
    this.kpZeigen(kaempfer, kaempfer.kp);
    this.lebendig(kaempfer);
  }

  // Atmen, und wer fliegt, schwebt auf und ab.
  lebendig(kaempfer) {
    const { bild, schatten, fliegt, grund, tempo } = this.anzeige.get(kaempfer);
    bild.setPosition(bild.x, grund.y).setScale(grund.scale);
    this.tweens.add({
      targets: bild,
      scaleY: grund.scale * 1.03,
      duration: tempo,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    if (fliegt) {
      this.tweens.add({ targets: bild, y: grund.y - 16, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: schatten, scale: 0.82, alpha: 0.32, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // Die Knöpfe für die Attacken des Kalamprios, das gerade kämpft.
  attackenKnoepfeBauen() {
    for (const knopf of this.knoepfe) for (const teil of knopf.teile) teil.destroy();
    this.knoepfe = this.spieler.attacken.map((attacke, nummer) => this.knopfBauen(attacke, nummer));
  }

  // Ein Knopf mit Bild in der zweiten Reihe (Fangkristall und Tauschen).
  bildKnopf(x, bildName, text, beimKlick) {
    const y = 638;
    const flaeche = this.add.rectangle(x, y, 300, 62, 0x5b3aa8).setOrigin(0).setRounded(14).setStrokeStyle(3, 0xd9c9ff);
    const bild = this.add.image(x + 36, y + 31, bildName);
    bild.setScale(Math.min(44 / bild.height, 52 / bild.width));
    const name = this.add.text(x + 72, y + 9, text, schrift(23));
    const hinweis = this.add.text(x + 72, y + 38, '', schrift(15, '#d9c9ff'));
    flaeche.on('pointerdown', beimKlick);
    return { teile: [flaeche, bild, name, hinweis], flaeche, hinweis, bild };
  }

  // Der Knopf für den Fangkristall, nur im Kampf gegen wilde Kalamprios.
  fangKnopfBauen() {
    return this.bildKnopf(620, 'fangkristall', 'Fangkristall', () => this.fangVersuch());
  }

  // Der Knopf zum Tauschen. Sein Bild zeigt das nächste Kalamprio im Team.
  tauschKnopfBauen() {
    return this.bildKnopf(940, this.team[1]?.kurzname ?? this.spieler.kurzname, 'Tauschen', () => this.tauschAuswahlZeigen());
  }

  knopfZeigen(knopf, klickbar, hinweis) {
    if (klickbar) knopf.flaeche.setInteractive({ useHandCursor: true });
    else knopf.flaeche.disableInteractive();
    for (const teil of knopf.teile) teil.setAlpha(klickbar ? 1 : 0.45);
    knopf.hinweis.setText(hinweis);
  }

  // Wer aus dem Team noch kämpfen kann, außer dem, der gerade kämpft.
  verfuegbare() {
    return this.team.filter((kaempfer) => kaempfer !== this.spieler && kaempfer.kp > 0);
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

    const andere = this.verfuegbare().length;
    this.knopfZeigen(
      this.tauschKnopf,
      spielerIstDran && andere > 0,
      andere > 0 ? `${andere} im Team bereit` : 'Sonst ist niemand bereit',
    );

    if (!this.fangKnopf) return;
    const schonDa = spielstand.team.includes(this.gegner.kurzname);
    const anzahl = spielstand.fangkristalle;
    let hinweis = `Noch ${anzahl} · Chance ${Math.round(fangChance(this.gegner) * 100)} von 100`;
    if (schonDa) hinweis = 'Schon in deinem Team';
    else if (this.zuStark) hinweis = `Zu stark! Erst mit ${REGELN.teamFuerGeheimes} im Team`;
    else if (anzahl === 0) hinweis = 'Keine mehr dabei';
    this.knopfZeigen(this.fangKnopf, spielerIstDran && !schonDa && !this.zuStark && anzahl > 0, hinweis);
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
      if (istSpieler && this.zuStark) {
        await this.schildZeigen(spielerAttacke);
        return;
      }
      await this.angriffZeigen(angreifer, verteidiger, istSpieler ? spielerAttacke : gegnerAttacke);
      if (await this.umgefallen(verteidiger)) return;
    }
    this.naechsteRunde();
  }

  naechsteRunde() {
    rundeBeenden([...this.team, this.gegner]);
    this.sagen(`Was soll ${this.spieler.name} tun?`);
    this.knoepfeZeigen(true);
  }

  // Das Kalamprio des Gegners greift an, zum Beispiel nach dem Tauschen
  // oder wenn sich ein wildes Kalamprio aus dem Fangkristall befreit hat.
  async gegnerIstDran() {
    await this.angriffZeigen(this.gegner, this.spieler, gegnerWaehlt(this.gegner));
    if (await this.umgefallen(this.spieler)) return;
    this.naechsteRunde();
  }

  // Das geheime Kalamprio ist zu stark: Ein Schild aus Licht hält die Attacke
  // auf, dann verschwindet es wieder.
  async schildZeigen(attacke) {
    const von = this.anzeige.get(this.spieler);
    const { bild, schatten } = this.anzeige.get(this.gegner);
    this.sagen(`${this.spieler.name} setzt ${attacke.name} ein!`);
    await this.warten(300);
    await attackeAnimieren(this, attacke.effekt ?? this.spieler.element, this.spieler.element, von.bild, bild, attacke.pause > 0, von.richtung);

    const mitte = { x: bild.x, y: bild.y - bild.displayHeight / 2 };
    const schild = this.add
      .circle(mitte.x, mitte.y, 190, 0xd9c9ff, 0.25)
      .setStrokeStyle(6, 0xffffff, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(999)
      .setScale(0.3);
    await this.bewegen({ targets: schild, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.sagen(`Ein Schild aus Licht schützt ${this.gegner.name}! Die Attacke prallt ab.`);
    await this.warten(1600);

    this.sagen(`${this.gegner.name} ist viel zu stark. Mit ${REGELN.teamFuerGeheimes} Kalamprios im Team kannst du es besiegen!`);
    this.tweens.killTweensOf([bild, schatten]);
    await this.bewegen({ targets: [bild, schild], y: '-=260', alpha: 0, duration: 1200, ease: 'Cubic.easeIn' });
    schatten.setVisible(false);
    this.weiterZeigen(false);
  }

  // Nach einem Treffer: Kann jemand nicht mehr? Ist es der Gegner, hat man
  // gewonnen. Ist es das eigene Kalamprio, muss es sich erholen, und das
  // nächste aus dem Team kommt. Ist keins mehr da, hat man verloren.
  // Gibt true zurück, wenn es danach nicht normal weitergeht.
  async umgefallen(verteidiger) {
    if (verteidiger.kp > 0) return false;
    if (verteidiger === this.gegner) {
      await this.kampfBeenden(this.spieler, this.gegner);
      return true;
    }

    spielstand.erschoepftBis[verteidiger.kurzname] = Date.now() + REGELN.erholungSekunden * 1000;
    const naechstes = this.verfuegbare()[0];
    if (!naechstes) {
      await this.kampfBeenden(this.gegner, verteidiger);
      return true;
    }

    const { bild } = this.anzeige.get(verteidiger);
    this.tweens.killTweensOf(bild);
    this.sagen(`${verteidiger.name} kann nicht mehr kämpfen.`);
    await this.bewegen({ targets: bild, alpha: 0, y: bild.y + 40, duration: 600 });
    this.sagen(`Los, ${naechstes.name}! Du bist dran!`);
    await this.einwechseln(naechstes);
    await this.warten(700);
    this.naechsteRunde();
    return true;
  }

  // ---------------------------------------------------------- Tauschen

  // Das Kalamprio, das gerade kämpft, geht zurück, und ein anderes kommt.
  async einwechseln(neues) {
    const altes = this.anzeige.get(this.spieler);
    this.tweens.killTweensOf([altes.bild, altes.schatten]);
    await this.bewegen({ targets: [altes.bild, altes.schatten], x: '-=200', alpha: 0, duration: 350, ease: 'Quad.easeIn' });
    for (const teil of altes.teile) teil.destroy();
    this.anzeige.delete(this.spieler);

    this.spieler = neues;
    spielstand.kalamprio = neues.kurzname; // nach dem Kampf ist es weiter vorne
    this.aufstellen(neues, 'links');
    this.attackenKnoepfeBauen();
    this.knoepfeZeigen(false);
    const { bild, schatten } = this.anzeige.get(neues);
    for (const teil of [bild, schatten]) {
      this.tweens.add({ targets: teil, x: { from: teil.x - 200, to: teil.x }, alpha: { from: 0, to: teil.alpha }, duration: 400, ease: 'Back.easeOut' });
    }
    this.blitz(bild.x, bild.y - bild.displayHeight / 2, 0xd9c9ff);
    await this.warten(450);
  }

  // Zeigt, wer aus dem Team bereit ist. Wer angetippt wird, kommt in den Kampf.
  tauschAuswahlZeigen() {
    this.knoepfeZeigen(false);
    const andere = this.verfuegbare();
    const teile = [
      this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.55).setOrigin(0).setInteractive().setDepth(2000),
      feld(this, 200, 150, BREITE - 400, 400).setDepth(2000),
      this.add.text(BREITE / 2, 190, 'Wer soll kämpfen?', schrift(34, '#f6f0ff')).setOrigin(0.5).setDepth(2000),
    ];
    const schliessen = () => {
      for (const teil of teile) teil.destroy();
    };

    const abstandX = Math.min(220, (BREITE - 460) / andere.length);
    andere.forEach((kaempfer, nummer) => {
      const x = BREITE / 2 + (nummer - (andere.length - 1) / 2) * abstandX;
      const karte = this.add
        .rectangle(x, 340, abstandX - 20, 220, FARBEN.knopf)
        .setRounded(16)
        .setStrokeStyle(3, FARBEN.rand)
        .setInteractive({ useHandCursor: true })
        .setDepth(2000);
      karte.on('pointerover', () => karte.setStrokeStyle(5, 0xffffff));
      karte.on('pointerout', () => karte.setStrokeStyle(3, FARBEN.rand));
      karte.on('pointerdown', () => {
        schliessen();
        this.tauschen(kaempfer);
      });
      const bild = this.add.image(x, 380, kaempfer.kurzname).setOrigin(0.5, 1).setDepth(2000);
      bild.setScale(Math.min(140 / bild.height, (abstandX - 50) / bild.width));
      teile.push(
        karte,
        bild,
        this.add.text(x, 405, kaempfer.name, schrift(24)).setOrigin(0.5).setDepth(2000),
        this.add.text(x, 432, `${kaempfer.kp} / ${kaempfer.maxKp} KP`, schrift(16, '#d9c9ff')).setOrigin(0.5).setDepth(2000),
      );
    });

    const zurueck = textKnopf(this, BREITE / 2 - 110, 476, 220, 56, 'Zurück', () => {
      schliessen();
      this.knoepfeZeigen(true);
    });
    for (const teil of zurueck) teil.setDepth(2001);
    teile.push(...zurueck);
  }

  // Tauschen kostet einen Zug: Danach greift der Gegner an.
  async tauschen(neues) {
    this.knoepfeZeigen(false);
    this.sagen(`Komm zurück, ${this.spieler.name}! Los, ${neues.name}!`);
    await this.einwechseln(neues);
    await this.warten(400);
    await this.gegnerIstDran();
  }

  async angriffZeigen(angreifer, verteidiger, attacke) {
    const kpVorher = verteidiger.kp;
    const schaden = attackeAusfuehren(angreifer, verteidiger, attacke);
    const vonAngreifer = this.anzeige.get(angreifer);
    const vonVerteidiger = this.anzeige.get(verteidiger);

    this.sagen(`${angreifer.name} setzt ${attacke.name} ein!`);
    await this.warten(300);

    // Die Animation der Attacke: aufladen, zum Gegner fliegen, treffen
    // (siehe attackenEffekte.js).
    await attackeAnimieren(
      this,
      attacke.effekt ?? angreifer.element,
      angreifer.element,
      vonAngreifer.bild,
      vonVerteidiger.bild,
      attacke.pause > 0,
      vonAngreifer.richtung,
    );

    // Schadenszahl, Lebensbalken schrumpft
    this.schadenZeigen(vonVerteidiger.bild, schaden);
    await this.bewegen({
      targets: { kp: kpVorher },
      kp: verteidiger.kp,
      duration: 450,
      onUpdate: (tween, zaehler) => this.kpZeigen(verteidiger, zaehler.kp),
    });

    this.sagen(`${verteidiger.name} verliert ${schaden} Lebenspunkte.`);
    await this.warten(900);
  }

  // ----------------------------------------------------------- Fangen

  // Der Fangkristall fliegt zum wilden Kalamprio und zieht es hinein. Dann
  // wackelt er. Wackelt er dreimal und bleibt ganz, ist es gefangen. Sonst
  // befreit es sich, und es ist dran.
  async fangVersuch() {
    this.knoepfeZeigen(false);
    spielstand.fangkristalle -= 1;
    const gefangen = fangen(this.gegner);
    const { bild, schatten } = this.anzeige.get(this.gegner);
    const werfer = this.anzeige.get(this.spieler).bild;
    this.sagen('Du wirfst einen Fangkristall!');

    // Im Bogen zum Kalamprio fliegen und sich dabei drehen
    const kristall = this.add.image(werfer.x + 60, werfer.y - 160, 'fangkristall').setDepth(1000);
    kristall.setScale(70 / kristall.height);
    const von = { x: kristall.x, y: kristall.y };
    const nach = { x: bild.x, y: bild.y - bild.displayHeight / 2 };
    await this.bewegen({
      targets: { t: 0 },
      t: 1,
      duration: 700,
      onUpdate: (tween, { t }) => {
        kristall.setPosition(von.x + (nach.x - von.x) * t, von.y + (nach.y - von.y) * t - Math.sin(t * Math.PI) * 180);
        kristall.setAngle(t * 540);
      },
    });
    kristall.setAngle(0);

    // Ein Lichtblitz, und das Kalamprio wird zu Licht und schlüpft hinein.
    this.blitz(nach.x, nach.y, 0xd9c9ff);
    this.tweens.killTweensOf([bild, schatten]);
    bild.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    await this.bewegen({ targets: bild, scale: 0, y: nach.y + 40, duration: 420, ease: 'Back.easeIn' });
    schatten.setVisible(false);

    // Der Kristall fällt auf den Boden.
    await this.bewegen({ targets: kristall, y: BODEN - 20, duration: 380, ease: 'Bounce.easeOut' });

    // Wackeln: Bei einem Fang dreimal, sonst ein- oder zweimal und dann bricht er auf.
    const wackeln = gefangen ? 3 : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < wackeln; i += 1) {
      this.sagen(`${'.  '.repeat(i + 1)}`);
      await this.warten(350);
      await this.bewegen({ targets: kristall, angle: i % 2 ? 18 : -18, duration: 140, yoyo: true, ease: 'Sine.easeInOut' });
      await this.warten(250);
    }

    if (gefangen) {
      await this.gefangen(kristall);
      return;
    }

    // Befreit! Der Kristall zerspringt und das Kalamprio ist wieder da.
    this.blitz(kristall.x, kristall.y - 20, 0xffffff);
    this.tweens.add({ targets: kristall, scale: kristall.scale * 1.8, alpha: 0, duration: 300, onComplete: () => kristall.destroy() });
    const { grund } = this.anzeige.get(this.gegner);
    bild.setPosition(bild.x, grund.y).setScale(0);
    schatten.setVisible(true);
    await this.bewegen({ targets: bild, scale: grund.scale, duration: 350, ease: 'Back.easeOut' });
    bild.clearTint();
    this.lebendig(this.gegner);
    this.sagen(`Oh nein! ${this.gegner.name} hat sich befreit!`);
    await this.warten(1100);

    // Jetzt ist das wilde Kalamprio dran.
    await this.gegnerIstDran();
  }

  async gefangen(kristall) {
    // Funkeln in alle Richtungen
    for (let i = 0; i < 16; i += 1) {
      const winkel = (i / 16) * Math.PI * 2;
      const stern = this.add
        .image(kristall.x, kristall.y - 20, 'funkel')
        .setTint([0xffffff, 0xd9c9ff, 0x9cc0f2, 0xff9ad5][i % 4])
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1001);
      this.tweens.add({
        targets: stern,
        x: stern.x + Math.cos(winkel) * 160,
        y: stern.y + Math.sin(winkel) * 120,
        angle: 180,
        scale: 0.3,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => stern.destroy(),
      });
    }
    this.blitz(kristall.x, kristall.y - 20, 0xffffff);
    this.tweens.add({ targets: kristall, y: kristall.y - 30, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    spielstand.team.push(this.gegner.kurzname);
    // Es behält sein Level: Es bekommt so viel Erfahrung, wie man dafür braucht.
    spielstand.erfahrung[this.gegner.kurzname] = REGELN.erfahrungFuerLevel[this.gegner.level - 1];
    this.sagen(`Juhu! Du hast ${this.gegner.name} gefangen!\n${this.gegner.name} ist jetzt in deinem Team.`);
    this.weiterZeigen(true);
  }

  // Ein runder Lichtblitz, der schnell größer wird und verblasst.
  blitz(x, y, farbe) {
    const licht = this.add.circle(x, y, 40, farbe, 0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(999);
    this.tweens.add({ targets: licht, scale: 4, alpha: 0, duration: 450, onComplete: () => licht.destroy() });
  }

  async kampfBeenden(sieger, verlierer) {
    const { bild } = this.anzeige.get(verlierer);
    this.tweens.killTweensOf(bild);
    this.sagen(`${verlierer.name} kann nicht mehr kämpfen.`);
    await this.bewegen({ targets: bild, alpha: 0, y: bild.y + 40, duration: 600 });
    await this.warten(400);

    const gewonnen = sieger === this.spieler;
    if (gewonnen) {
      this.sagen(`Du hast gewonnen!\n${sieger.name} freut sich.`);
      await this.warten(1000);
      await this.erfahrungBekommen(sieger);
    } else if (this.team.length > 1) this.sagen('Dein ganzes Team ist erschöpft.\nEs muss sich kurz erholen.');
    else this.sagen(`${verlierer.name} ist erschöpft.\nEs muss sich kurz erholen.`);

    this.weiterZeigen(gewonnen);
  }

  // Das Kalamprio, das am Ende noch steht, bekommt Erfahrung: so viel, wie
  // das Level des Gegners. Der goldene Balken füllt sich, und man sieht, wie
  // viel noch bis zum nächsten Level fehlt (erfahrungFuerLevel in regeln.js).
  async erfahrungBekommen(sieger) {
    const vorher = spielstand.erfahrung[sieger.kurzname] ?? 0;
    const dazu = erfahrungFuerSieg(this.gegner);
    const nachher = vorher + dazu;
    spielstand.erfahrung[sieger.kurzname] = nachher;
    const levelVorher = levelAusErfahrung(vorher);
    const levelNachher = levelAusErfahrung(nachher);
    const { bild, erfahrungBalken } = this.anzeige.get(sieger);

    // "+3 Erfahrung" steigt über dem Kalamprio auf.
    const plus = this.add
      .text(bild.x, bild.y - bild.displayHeight - 10, `+${dazu} Erfahrung`, schrift(36, '#ffd166', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 8)
      .setDepth(1001);
    this.tweens.add({ targets: plus, y: plus.y - 70, alpha: 0, delay: 900, duration: 900, onComplete: () => plus.destroy() });
    this.sagen(`${sieger.name} bekommt ${dazu} Erfahrung.`);

    if (levelNachher > levelVorher) {
      await this.bewegen({ targets: erfahrungBalken, scaleX: 1, duration: 600 });
      await this.levelAufstieg(sieger, levelNachher);
      erfahrungBalken.scaleX = 0;
    }
    await this.bewegen({ targets: erfahrungBalken, scaleX: levelFortschritt(nachher), duration: 600 });

    const fehlen = erfahrungBisNaechstesLevel(nachher);
    const wieWeiter =
      fehlen === null
        ? `${sieger.name} hat das höchste Level.`
        : `Noch ${fehlen} Erfahrung bis Level ${levelNachher + 1}.`;
    this.sagen(`${sieger.name} bekommt ${dazu} Erfahrung.\n${wieWeiter}`);
  }

  // Funkeln, ein goldener Blitz und eine Nachricht: ein Level höher!
  async levelAufstieg(sieger, level) {
    const { bild, levelText } = this.anzeige.get(sieger);
    levelText.setText(`Level ${level}`);
    this.tweens.add({ targets: levelText, scale: 1.4, duration: 250, yoyo: true, repeat: 1 });
    this.blitz(bild.x, bild.y - bild.displayHeight / 2, 0xffd166);
    for (let i = 0; i < 14; i += 1) {
      const winkel = (i / 14) * Math.PI * 2;
      const stern = this.add
        .image(bild.x, bild.y - bild.displayHeight / 2, 'funkel')
        .setTint(i % 2 ? 0xffd166 : 0xffffff)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1001);
      this.tweens.add({
        targets: stern,
        x: stern.x + Math.cos(winkel) * 170,
        y: stern.y + Math.sin(winkel) * 140,
        angle: 180,
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => stern.destroy(),
      });
    }
    this.sagen(`${sieger.name} ist jetzt Level ${level}!\nEs ist ein bisschen stärker geworden.`);
    await this.warten(2200);
  }

  // Versteckt die Knöpfe und zeigt nur noch "Weiter". gewonnen ist auch true,
  // wenn man das Kalamprio gefangen hat: Dann ist es aus der Welt verschwunden.
  // Wer das geheime Kalamprio besiegt oder gefangen hat, kommt zur Party.
  weiterZeigen(gewonnen) {
    for (const knopf of [...this.knoepfe, this.fangKnopf, this.tauschKnopf].filter(Boolean)) {
      for (const teil of knopf.teile) teil.setVisible(false);
    }
    const party = gewonnen && this.geheim;
    textKnopf(this, 620, 570, 620, 62, party ? 'Zur Party!' : 'Weiter', () => {
      this.auswahl.nachKampf?.(gewonnen);
      this.cameras.main.fadeOut(500, 23, 11, 44);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(party ? 'Ende' : 'Welt'));
    });
  }
}
