// Die Welt: Hier spaziert man durch die Orte und trifft wilde Kalamprios
// und die Rivalin. Die Regeln fürs Laufen stehen in welt/weltlogik.js.
// Die Szene zeigt immer einen Ort, nämlich spielstand.ort.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { GESCHICHTE } from '../daten/geschichte.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { ORTE } from '../daten/orte.js';
import { REGELN } from '../daten/regeln.js';
import { spielstand } from '../spielstand.js';
import {
  abstand,
  ankunft,
  ausgangAmRand,
  hindernisseAmOrt,
  istImGras,
  richtungZu,
  schritt,
  weltGrenzen,
} from '../welt/weltlogik.js';
import { feld, textKnopf } from './bausteine.js';
import { ortAufbauen } from './landschaft.js';
import { BREITE, FARBEN, HOEHE, schrift } from './stil.js';

const SPIELER_RADIUS = 18;
const WILD_RADIUS = 30;
const RIVALIN_RADIUS = 56;
const KRISTALL_RADIUS = 30;
const FIGUR_HOEHE = 150; // so groß sind Kala und Pflanstaria im Wald
const WILD_HOEHE = 115;
const WILD_TEMPO = 55; // Pixel pro Sekunde
const WILD_REVIER = 140; // so weit entfernen sich wilde Kalamprios von ihrem Platz
const RUHE_NACH_KAMPF = 2500; // Millisekunden, in denen nach einem Kampf nichts angreift
const VORNE = 100000; // Tiefe für alles, was fest auf dem Bildschirm klebt

export class WeltSzene extends Phaser.Scene {
  constructor() {
    super('Welt');
  }

  create() {
    this.ortName = spielstand.ort;
    this.ort = ORTE[this.ortName];
    this.grenzen = weltGrenzen(this.ort);
    this.verdecker = ortAufbauen(this, this.ortName);
    this.hindernisse = hindernisseAmOrt(this.ort);

    this.gespraech = null; // die Teile des Textfelds, solange jemand spricht
    this.wechselt = false; // true, sobald es zum Kampf geht
    this.laufziel = null; // der Punkt, zu dem man getippt hat
    this.zeigerFuehrt = false; // true, solange Finger oder Maus die Figur führen
    this.festgesteckt = 0;
    this.grasStrecke = 0;

    // Die Rivalin wartet nur an einem Ort.
    if (this.ort.rivalin) {
      const platz = this.ort.rivalin;
      this.hindernisse.push({ ...platz, radius: RIVALIN_RADIUS });
      this.rivalin = this.figurBauen(`charakter-${spielstand.rivalin}`, FIGUR_HOEHE, platz);
      this.figurZeigen(this.rivalin, 0);
      this.add
        .text(platz.x, platz.y - FIGUR_HOEHE - 18, CHARAKTERE[spielstand.rivalin].name, schrift(20, '#f6f0ff'))
        .setOrigin(0.5)
        .setDepth(platz.y);
    }

    // Der dunkle Kristall: Solange man ihn noch nicht gehört hat, schimmert er.
    const dunkel = this.ort.dunklerKristall;
    if (dunkel && !spielstand.geschichteGehoert[this.ortName]) {
      this.schimmer = this.add.circle(dunkel.x, dunkel.y - 70, 60, 0xc9b8ff, 0.25).setDepth(dunkel.y + 1);
      this.tweens.add({ targets: this.schimmer, alpha: 0.05, scale: 1.4, duration: 1100, yoyo: true, repeat: -1 });
    }

    this.wilde = this.ort.wildeKalamprios.map((eintrag, nummer) => ({
      ...this.figurBauen(eintrag.art, WILD_HOEHE, eintrag),
      nummer,
      merkname: `${this.ortName}-${nummer}`, // so merkt sich der Spielstand, wer besiegt ist
      art: eintrag.art,
      heimat: { x: eintrag.x, y: eintrag.y },
      ziel: null,
      pauseBis: 0,
      da: true,
    }));

    this.spieler = this.figurBauen(
      `charakter-${spielstand.charakter}`,
      FIGUR_HOEHE,
      spielstand.position ?? this.ort.start,
    );
    // Wer nach einem Kampf neben der Rivalin oder dem Kristall steht, wird
    // nicht sofort wieder angesprochen.
    this.warBeiRivalin = this.istBeiRivalin();
    this.warBeimKristall = this.istBeimKristall();

    this.zielMarke = this.add.circle(0, 0, 14).setStrokeStyle(3, 0xf6f0ff, 0.8).setDepth(2);

    const kamera = this.cameras.main;
    kamera.setBounds(0, 0, this.ort.breite, this.ort.hoehe);
    kamera.startFollow(this.spieler.schatten, true, 0.12, 0.12);
    kamera.fadeIn(300, 23, 11, 44);

    const taste = Phaser.Input.Keyboard.KeyCodes;
    this.tasten = this.input.keyboard.addKeys({
      hoch: taste.UP,
      runter: taste.DOWN,
      links: taste.LEFT,
      rechts: taste.RIGHT,
      w: taste.W,
      a: taste.A,
      s: taste.S,
      d: taste.D,
    });

    // Ein Tipp in die Welt ist ein Laufziel, ein Tipp auf einen Knopf nicht.
    this.input.on('pointerdown', (zeiger, getroffen) => {
      this.zeigerFuehrt = getroffen.length === 0 && !this.gespraech && !this.wechselt;
      if (this.zeigerFuehrt) this.laufziel = { x: zeiger.worldX, y: zeiger.worldY };
    });
    this.input.on('pointerup', () => {
      this.zeigerFuehrt = false;
    });

    this.anzeigeBauen();
    if (spielstand.ortsnameZeigen) this.ortsnameZeigen();
  }

  update(zeit, delta) {
    // Die Zeit seit dem letzten Bild in kleinen Häppchen abarbeiten. So läuft
    // die Figur auf langsamen Geräten gleich schnell und springt bei einem
    // Ruckler nicht durch einen Baum.
    for (let rest = Math.min(delta, 250); rest > 0 && !this.wechselt; rest -= 20) {
      const dt = Math.min(rest, 20) / 1000;
      if (this.gespraech) this.spieler.laeuft = false;
      else this.spielerBewegen(dt);
      this.wildeBewegen(dt, zeit);
      this.begegnungenPruefen();
    }

    this.figurZeigen(this.spieler, zeit);
    this.verdeckerLichten();
    this.zielMarke.setVisible(this.laufziel !== null);
    if (this.laufziel) this.zielMarke.setPosition(this.laufziel.x, this.laufziel.y);
    this.anzeigeAktualisieren();
  }

  // --------------------------------------------------------------- Figuren

  // Eine Figur besteht aus ihrem Ort (dort stehen die Füße), ihrem Bild
  // und einem Schatten.
  figurBauen(bildName, hoehe, ort) {
    const schatten = this.add
      .ellipse(ort.x, ort.y, hoehe * 0.55, hoehe * 0.16, 0x170b2c, 0.45)
      .setDepth(1);
    const bild = this.add.image(ort.x, ort.y, `${bildName}-klein`).setOrigin(0.5, 1);
    bild.setScale(Math.min(hoehe / bild.height, (hoehe * 1.2) / bild.width));
    return { ort: { x: ort.x, y: ort.y }, bild, schatten, laeuft: false };
  }

  // Setzt Bild und Schatten an den Ort der Figur. Wer läuft, hüpft und wippt.
  figurZeigen(figur, zeit) {
    const schwung = figur.laeuft ? Math.sin(zeit / 95) : 0;
    figur.schatten.setPosition(figur.ort.x, figur.ort.y);
    figur.bild.setPosition(figur.ort.x, figur.ort.y + 6 - Math.abs(schwung) * 8);
    figur.bild.setRotation(schwung * 0.05);
    figur.bild.setDepth(figur.ort.y);
  }

  // Steht die Figur hinter einer Baumkrone oder einem Haus, wird es
  // durchsichtig, damit man sie nicht aus den Augen verliert.
  verdeckerLichten() {
    const { x, y } = this.spieler.ort;
    for (const ding of this.verdecker) {
      const verdeckt = y < ding.y && y > ding.y - ding.hoehe && Math.abs(x - ding.x) < ding.halbeBreite;
      ding.bild.setAlpha(verdeckt ? 0.4 : 1);
    }
  }

  // ---------------------------------------------------------------- Laufen

  // Solange man den Finger oder die Maus gedrückt hält, läuft die Figur hinterher.
  laufzielVomZeiger() {
    const zeiger = this.input.activePointer;
    if (!this.zeigerFuehrt || !zeiger.isDown) return;
    zeiger.updateWorldPoint(this.cameras.main);
    this.laufziel = { x: zeiger.worldX, y: zeiger.worldY };
  }

  // Wohin soll es gehen? Tasten haben Vorrang vor dem getippten Ziel.
  eingabeRichtung() {
    const t = this.tasten;
    const x = (t.rechts.isDown || t.d.isDown ? 1 : 0) - (t.links.isDown || t.a.isDown ? 1 : 0);
    const y = (t.runter.isDown || t.s.isDown ? 1 : 0) - (t.hoch.isDown || t.w.isDown ? 1 : 0);
    if (x !== 0 || y !== 0) {
      this.laufziel = null;
      const laenge = Math.hypot(x, y);
      return { x: x / laenge, y: y / laenge };
    }

    if (!this.laufziel) return null;
    const { richtung, entfernung } = richtungZu(this.spieler.ort, this.laufziel);
    if (entfernung < 8) {
      this.laufziel = null;
      return null;
    }
    return richtung;
  }

  spielerBewegen(dt) {
    this.laufzielVomZeiger();
    const richtung = this.eingabeRichtung();
    this.spieler.laeuft = richtung !== null;
    if (!richtung) return;

    const weite = REGELN.lauftempo * dt;
    const vorher = this.spieler.ort;
    this.spieler.ort = schritt(
      vorher,
      { x: richtung.x * weite, y: richtung.y * weite },
      SPIELER_RADIUS,
      this.hindernisse,
      this.grenzen,
    );
    const gelaufen = abstand(vorher, this.spieler.ort);

    const ausgang = ausgangAmRand(this.ort, this.spieler.ort, this.grenzen);
    if (ausgang) {
      this.ortWechseln(ausgang.nach);
      return;
    }

    // Kommt die Figur auf dem Weg zum getippten Ziel nicht weiter, gibt sie auf.
    if (this.laufziel) {
      this.festgesteckt = gelaufen < weite * 0.3 ? this.festgesteckt + dt : 0;
      if (this.festgesteckt > 0.4) this.laufziel = null;
    }

    if (istImGras(this.spieler.ort, this.ort.hohesGras)) this.imGrasGelaufen(gelaufen);
  }

  // Im hohen Gras wird alle paar Schritte gewürfelt, ob ein Kalamprio auftaucht.
  imGrasGelaufen(strecke) {
    if (!this.kampfbereit()) return;
    this.grasStrecke += strecke;
    if (this.grasStrecke < REGELN.grasSchritt) return;
    this.grasStrecke = 0;
    if (Math.random() >= REGELN.grasChance) return;

    // Ganz selten ist es das geheime Kalamprio.
    const geheimes = this.ort.geheimesImGras;
    const gegner =
      geheimes && Math.random() < geheimes.chance
        ? geheimes.art
        : Phaser.Utils.Array.GetRandom(this.ort.tiereImGras);
    this.kampfBeginnen({ gegner });
  }

  // Geht durch einen Ausgang zum nächsten Ort.
  ortWechseln(nach) {
    if (this.wechselt) return;
    this.wechselt = true;
    this.spieler.laeuft = false;
    this.laufziel = null;
    const vonOrt = this.ortName;

    const kamera = this.cameras.main;
    kamera.fadeOut(300, 23, 11, 44);
    kamera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      spielstand.ort = nach;
      spielstand.position = ankunft(ORTE[nach], vonOrt);
      spielstand.ortsnameZeigen = true;
      // Kurz durchatmen, bevor im neuen Ort etwas angreift.
      spielstand.ruheBis = Math.max(spielstand.ruheBis, Date.now() + RUHE_NACH_KAMPF);
      this.scene.restart();
    });
  }

  // Wilde Kalamprios schlendern um ihren Platz herum und machen dazwischen Pause.
  wildeBewegen(dt, zeit) {
    for (const wild of this.wilde) {
      wild.da = Date.now() >= (spielstand.wildeWiederDa[wild.merkname] ?? 0);
      wild.bild.setVisible(wild.da);
      wild.schatten.setVisible(wild.da);
      if (!wild.da) {
        wild.ort = { ...wild.heimat };
        wild.ziel = null;
        continue;
      }

      if (!wild.ziel && zeit >= wild.pauseBis) {
        const winkel = Math.random() * Math.PI * 2;
        const weite = Math.random() * WILD_REVIER;
        wild.ziel = {
          x: wild.heimat.x + Math.cos(winkel) * weite,
          y: wild.heimat.y + Math.sin(winkel) * weite,
        };
      }

      wild.laeuft = wild.ziel !== null;
      if (wild.ziel) {
        const { richtung, entfernung } = richtungZu(wild.ort, wild.ziel);
        const weite = Math.min(WILD_TEMPO * dt, entfernung);
        const vorher = wild.ort;
        wild.ort = schritt(
          vorher,
          { x: richtung.x * weite, y: richtung.y * weite },
          WILD_RADIUS,
          this.hindernisse,
          this.grenzen,
        );

        // In Laufrichtung schauen
        const blick = KALAMPRIOS[wild.art].blick;
        if (richtung.x > 0.2) wild.bild.setFlipX(blick === 'links');
        if (richtung.x < -0.2) wild.bild.setFlipX(blick === 'rechts');

        // Angekommen oder hängen geblieben: erst einmal ausruhen
        if (entfernung < 4 || abstand(vorher, wild.ort) < weite * 0.3) {
          wild.ziel = null;
          wild.pauseBis = zeit + 800 + Math.random() * 2200;
        }
      }
      this.figurZeigen(wild, zeit + wild.nummer * 400);
    }
  }

  // ----------------------------------------------------------- Begegnungen

  // Nach einer Niederlage und kurz nach jedem Kampf greift niemand an.
  kampfbereit() {
    const jetzt = Date.now();
    return jetzt >= spielstand.erschoepftBis && jetzt >= spielstand.ruheBis;
  }

  istBeiRivalin() {
    if (!this.ort.rivalin) return false;
    return abstand(this.spieler.ort, this.ort.rivalin) < SPIELER_RADIUS + RIVALIN_RADIUS + 14;
  }

  istBeimKristall() {
    const dunkel = this.ort.dunklerKristall;
    if (!dunkel || !GESCHICHTE.orte[this.ortName]) return false;
    return abstand(this.spieler.ort, dunkel) < SPIELER_RADIUS + KRISTALL_RADIUS + 22;
  }

  begegnungenPruefen() {
    const beiRivalin = this.istBeiRivalin();
    if (beiRivalin && !this.warBeiRivalin) this.rivalinSpricht();
    this.warBeiRivalin = beiRivalin;

    const beimKristall = this.istBeimKristall();
    if (beimKristall && !this.warBeimKristall && !this.gespraech) this.kristallErzaehlt();
    this.warBeimKristall = beimKristall;

    if (this.gespraech || !this.kampfbereit()) return;
    for (const wild of this.wilde) {
      if (wild.da && abstand(this.spieler.ort, wild.ort) < SPIELER_RADIUS + WILD_RADIUS) {
        const { merkname } = wild;
        this.kampfBeginnen({
          gegner: wild.art,
          beiSieg: () => {
            spielstand.wildeWiederDa[merkname] =
              Date.now() + REGELN.wildeKommenWiederSekunden * 1000;
          },
        });
        return;
      }
    }
  }

  rivalinSpricht() {
    const rivalin = CHARAKTERE[spielstand.rivalin];
    const meinTier = KALAMPRIOS[spielstand.kalamprio].name;

    if (Date.now() < spielstand.erschoepftBis) {
      this.gespraechZeigen(
        `${rivalin.name}: „${meinTier} sieht müde aus. Komm wieder, wenn es sich erholt hat!“`,
        [['Okay', () => this.gespraechSchliessen()]],
      );
      return;
    }

    const satz = spielstand.rivalinBesiegt ? rivalin.revanche : rivalin.gruss;
    this.gespraechZeigen(`${rivalin.name}: „${satz}“`, [
      [
        'Kämpfen',
        () =>
          this.kampfBeginnen({
            gegner: spielstand.rivalinKalamprio,
            trainerin: rivalin.name,
            beiSieg: () => {
              spielstand.rivalinBesiegt = true;
            },
          }),
      ],
      ['Lieber nicht', () => this.gespraechSchliessen()],
    ]);
  }

  // Der dunkle Kristall erzählt seine Sätze aus geschichte.js, einen nach dem anderen.
  kristallErzaehlt() {
    const saetze = GESCHICHTE.orte[this.ortName];
    const zeigen = (nummer) => {
      this.gespraechSchliessen();
      const letzter = nummer === saetze.length - 1;
      this.gespraechZeigen(saetze[nummer], [
        [
          letzter ? 'Danke!' : 'Weiter',
          () => {
            if (!letzter) {
              zeigen(nummer + 1);
              return;
            }
            this.gespraechSchliessen();
            spielstand.geschichteGehoert[this.ortName] = true;
            this.schimmer?.destroy();
            this.schimmer = null;
          },
        ],
      ]);
    };
    zeigen(0);
  }

  // Blendet aus und wechselt zum Kampf. beiSieg wird nur nach einem Sieg aufgerufen.
  kampfBeginnen({ gegner, trainerin = null, beiSieg }) {
    if (this.wechselt) return;
    this.wechselt = true;
    this.gespraechSchliessen();
    this.spieler.laeuft = false;
    this.laufziel = null;
    spielstand.position = { ...this.spieler.ort };

    const kamera = this.cameras.main;
    kamera.fadeOut(350, 23, 11, 44);
    kamera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Kampf', {
        spieler: spielstand.kalamprio,
        gegner,
        trainerin,
        nachKampf: (gewonnen) => {
          const jetzt = Date.now();
          spielstand.ruheBis = jetzt + RUHE_NACH_KAMPF;
          if (gewonnen) beiSieg?.();
          else spielstand.erschoepftBis = jetzt + REGELN.erholungSekunden * 1000;
        },
      });
    });
  }

  // ------------------------------------------------- Anzeige und Gespräche

  // Klebt Teile fest auf den Bildschirm, damit sie nicht mit der Welt wegrollen.
  festkleben(teile, tiefe) {
    teile.forEach((teil, nummer) => teil.setScrollFactor(0).setDepth(tiefe + nummer));
  }

  anzeigeBauen() {
    const charakter = CHARAKTERE[spielstand.charakter];
    const tier = KALAMPRIOS[spielstand.kalamprio];

    this.zustand = this.add.text(52, 72, '', schrift(18, '#d9c9ff'));
    this.erholung = this.add.rectangle(52, 100, 356, 6, FARBEN.kpMittel).setOrigin(0, 0.5);
    this.festkleben(
      [
        feld(this, 30, 24, 400, 90),
        this.add.text(52, 36, `${charakter.name} und ${tier.name}`, schrift(24)),
        this.zustand,
        this.erholung,
        feld(this, BREITE - 30 - 230, 24, 230, 52),
        this.add.text(BREITE - 30 - 115, 50, this.ort.name, schrift(22, '#d9c9ff')).setOrigin(0.5),
      ],
      VORNE,
    );

    if (!spielstand.hinweisGesehen) {
      spielstand.hinweisGesehen = true;
      const hinweis = [
        feld(this, BREITE / 2 - 290, 640, 580, 54),
        this.add
          .text(BREITE / 2, 667, 'Laufen: Pfeiltasten oder dorthin tippen', schrift(22))
          .setOrigin(0.5),
      ];
      this.festkleben(hinweis, VORNE);
      this.tweens.add({
        targets: hinweis,
        alpha: 0,
        delay: 6000,
        duration: 600,
        onComplete: () => hinweis.forEach((teil) => teil.destroy()),
      });
    }
  }

  // Zeigt beim Ankommen groß den Namen des Ortes.
  ortsnameZeigen() {
    spielstand.ortsnameZeigen = false;
    const name = this.add
      .text(BREITE / 2, HOEHE / 2 - 120, this.ort.name, schrift(64, '#f6f0ff', { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 10);
    this.festkleben([name], VORNE + 50);
    this.tweens.add({
      targets: name,
      alpha: 0,
      delay: 1400,
      duration: 700,
      onComplete: () => name.destroy(),
    });
  }

  anzeigeAktualisieren() {
    const tier = KALAMPRIOS[spielstand.kalamprio];
    const rest = spielstand.erschoepftBis - Date.now();
    this.erholung.setVisible(rest > 0);
    if (rest > 0) {
      this.zustand.setText(`${tier.name} erholt sich, noch ${Math.ceil(rest / 1000)} Sekunden`);
      this.erholung.scaleX = Math.min(1, rest / (REGELN.erholungSekunden * 1000));
    } else {
      this.zustand.setText(`${tier.name} ist bereit`);
    }
  }

  // Zeigt unten ein Textfeld mit Knöpfen. knoepfe ist eine Liste aus
  // [Beschriftung, was beim Klick passiert].
  gespraechZeigen(text, knoepfe) {
    this.laufziel = null;
    this.zeigerFuehrt = false;

    const teile = [
      feld(this, 40, 530, 1200, 160),
      this.add.text(70, 552, text, schrift(26, '#ffffff', { wordWrap: { width: 1140 } })),
    ];
    knoepfe.forEach(([beschriftung, beimKlick], nummer) => {
      const x = 1230 - (knoepfe.length - nummer) * 250;
      teile.push(...textKnopf(this, x, 618, 230, 56, beschriftung, beimKlick));
    });
    this.festkleben(teile, VORNE + 100);
    this.gespraech = teile;
  }

  gespraechSchliessen() {
    if (!this.gespraech) return;
    for (const teil of this.gespraech) teil.destroy();
    this.gespraech = null;
  }
}
