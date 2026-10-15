// Die Welt: Hier spaziert man durch die Orte und trifft wilde Kalamprios
// und die Rivalin. Die Regeln fürs Laufen stehen in welt/weltlogik.js.
// Die Szene zeigt immer einen Ort, nämlich spielstand.ort.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { GESCHICHTE } from '../daten/geschichte.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { ORTE } from '../daten/orte.js';
import { REGELN } from '../daten/regeln.js';
import { siegeBisNaechstesLevel } from '../kampf/kampflogik.js';
import { erholtSichNoch, levelVon, spielstand } from '../spielstand.js';
import { verstummen, vorlesen } from '../vorlesen.js';
import {
  abstand,
  ankunft,
  ausgangAmRand,
  grasBegegnung,
  hindernisseAmOrt,
  istImGras,
  richtungZu,
  schritt,
  weltGrenzen,
} from '../welt/weltlogik.js';
import { feld, textKnopf } from './bausteine.js';
import { DUNKEL_TIEFE, LICHT_TIEFE, lichtschein, ortAufbauen } from './landschaft.js';
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
const SCHWEBEN = 38; // so hoch über dem Boden fliegen Kalamprios mit fliegt: true
const FANGKRISTALL_HOEHE = 46;
const AUFSAMMELN_ABSTAND = 46;
const LICHT_RADIUS = 170; // so weit ist es um die Figur herum hell, wenn es dunkel ist

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

    this.fangkristalleAufstellen();

    this.wilde = this.ort.wildeKalamprios.map((eintrag, nummer) => ({
      ...this.figurBauen(eintrag.art, WILD_HOEHE, eintrag, KALAMPRIOS[eintrag.art].fliegt),
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

    if (this.ort.dunkel) this.dunkelheitBauen();
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
      this.fangkristalleAufsammeln();
      this.begegnungenPruefen();
    }

    this.figurZeigen(this.spieler, zeit);
    this.dunkelheit?.setPosition(this.spieler.ort.x, this.spieler.ort.y - FIGUR_HOEHE / 2);
    this.verdeckerLichten();
    this.zielMarke.setVisible(this.laufziel !== null);
    if (this.laufziel) this.zielMarke.setPosition(this.laufziel.x, this.laufziel.y);
    this.anzeigeAktualisieren();
  }

  // --------------------------------------------------------------- Figuren

  // Eine Figur besteht aus ihrem Ort (dort stehen die Füße), ihrem Bild
  // und einem Schatten. Wer fliegt, schwebt über seinem Schatten.
  figurBauen(bildName, hoehe, ort, fliegt = false) {
    const schatten = this.add
      .ellipse(ort.x, ort.y, hoehe * 0.55, hoehe * 0.16, 0x170b2c, 0.45)
      .setDepth(1);
    const bild = this.add.image(ort.x, ort.y, `${bildName}-klein`).setOrigin(0.5, 1);
    bild.setScale(Math.min(hoehe / bild.height, (hoehe * 1.2) / bild.width));
    return { ort: { x: ort.x, y: ort.y }, bild, schatten, laeuft: false, fliegt };
  }

  // Setzt Bild und Schatten an den Ort der Figur. Wer läuft, hüpft und wippt.
  // Wer fliegt, schwebt auf und ab, und sein Schatten wird dabei kleiner und größer.
  figurZeigen(figur, zeit) {
    const schwung = figur.laeuft ? Math.sin(zeit / 95) : 0;
    figur.schatten.setPosition(figur.ort.x, figur.ort.y);
    if (figur.fliegt) {
      const auf = Math.sin(zeit / 280);
      figur.bild.setPosition(figur.ort.x, figur.ort.y - SCHWEBEN - auf * 8);
      figur.schatten.setScale(0.75 - auf * 0.08).setAlpha(0.3);
    } else {
      figur.bild.setPosition(figur.ort.x, figur.ort.y + 6 - Math.abs(schwung) * 8);
    }
    figur.bild.setRotation(schwung * 0.05);
    figur.bild.setDepth(figur.ort.y);
  }

  // ------------------------------------------------------ Licht und Dunkel

  // Ein großes dunkles Tuch mit einem hellen Loch in der Mitte. Das Loch
  // wandert mit der Figur mit, so ist es nur rund um sie herum hell.
  dunkelheitBauen() {
    const name = 'dunkelheit';
    if (!this.textures.exists(name)) {
      const breite = BREITE * 2 + 200;
      const hoehe = HOEHE * 2 + 200;
      const tuch = this.textures.createCanvas(name, breite, hoehe);
      const stift = tuch.context;
      const verlauf = stift.createRadialGradient(breite / 2, hoehe / 2, LICHT_RADIUS * 0.45, breite / 2, hoehe / 2, LICHT_RADIUS * 2.4);
      verlauf.addColorStop(0, 'rgba(8, 4, 18, 0)');
      verlauf.addColorStop(0.35, 'rgba(8, 4, 18, 0.45)');
      verlauf.addColorStop(1, 'rgba(8, 4, 18, 1)');
      stift.fillStyle = verlauf;
      stift.fillRect(0, 0, breite, hoehe);
      tuch.refresh();
    }
    this.dunkelheit = this.add.image(0, 0, name).setAlpha(this.ort.dunkel).setDepth(DUNKEL_TIEFE);
    // Das Licht flackert ein kleines bisschen, wie von einer Laterne.
    this.tweens.add({ targets: this.dunkelheit, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // --------------------------------------------------------- Fangkristalle

  // Fangkristalle liegen zum Aufsammeln herum. Ist einer aufgesammelt, liegt
  // nach einer Weile wieder einer da.
  fangkristalleAufstellen() {
    this.fangkristalle = (this.ort.fangkristalle ?? []).map((punkt, nummer) => {
      const bild = this.add.image(punkt.x, punkt.y, 'fangkristall').setOrigin(0.5, 1);
      bild.setScale(FANGKRISTALL_HOEHE / bild.height).setDepth(this.ort.dunkel ? LICHT_TIEFE : punkt.y);
      this.tweens.add({ targets: bild, y: punkt.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const schein = lichtschein(this, punkt.x, punkt.y - 20, 130, 100, 0xb99cf0)
        .setAlpha(0.7)
        .setDepth(this.ort.dunkel ? LICHT_TIEFE : punkt.y - 1);
      this.tweens.add({ targets: schein, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
      return { punkt, bild, schein, merkname: `${this.ortName}-${nummer}` };
    });
  }

  fangkristalleAufsammeln() {
    const jetzt = Date.now();
    for (const kristall of this.fangkristalle) {
      const da = jetzt >= (spielstand.fangkristallWiederDa[kristall.merkname] ?? 0);
      kristall.bild.setVisible(da);
      kristall.schein.setVisible(da);
      if (!da || abstand(this.spieler.ort, kristall.punkt) > AUFSAMMELN_ABSTAND) continue;

      spielstand.fangkristalle += 1;
      spielstand.fangkristallWiederDa[kristall.merkname] = jetzt + REGELN.fangkristallWaechstNachSekunden * 1000;
      const plus = this.add
        .text(kristall.punkt.x, kristall.punkt.y - 70, '+1 Fangkristall', schrift(24, '#f6f0ff', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 6)
        .setDepth(VORNE - 1);
      this.tweens.add({ targets: plus, y: plus.y - 50, alpha: 0, duration: 1300, onComplete: () => plus.destroy() });
    }
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

    // Selten ist es das geheime Kalamprio, und spätestens nach ein paar
    // anderen kommt es sicher (spaetestensNach beim Ort).
    const bisher = spielstand.grasOhneGeheimes[this.ortName] ?? 0;
    const { art, geheim } = grasBegegnung(this.ort, bisher);
    spielstand.grasOhneGeheimes[this.ortName] = geheim ? 0 : bisher + 1;
    this.kampfBeginnen({ gegner: art });
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
    return erholtSichNoch(spielstand.kalamprio) === 0 && Date.now() >= spielstand.ruheBis;
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

    if (erholtSichNoch(spielstand.kalamprio) > 0) {
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
            // Die Rivalin trainiert mit: Ihr Kalamprio ist so stark wie dein stärkstes.
            gegnerLevel: Math.max(...spielstand.team.map(levelVon)),
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
      vorlesen(saetze[nummer]);
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

  // Blendet aus und wechselt zum Kampf. beiSieg wird nur nach einem Sieg
  // aufgerufen (auch wenn man das wilde Kalamprio gefangen hat).
  // gegnerLevel: ohne Angabe das Level der wilden Kalamprios an diesem Ort.
  kampfBeginnen({ gegner, gegnerLevel = this.ort.wildesLevel ?? 1, trainerin = null, beiSieg }) {
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
        gegnerLevel,
        trainerin,
        // Wer im Kampf nicht mehr konnte, erholt sich schon (das merkt sich der Kampf).
        nachKampf: (gewonnen) => {
          spielstand.ruheBis = Date.now() + RUHE_NACH_KAMPF;
          if (gewonnen) beiSieg?.();
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
    this.wer = this.add.text(52, 36, '', schrift(24));
    this.zustand = this.add.text(52, 72, '', schrift(18, '#d9c9ff'));
    this.erholung = this.add.rectangle(52, 100, 356, 6, FARBEN.kpMittel).setOrigin(0, 0.5);
    this.kristallZahl = this.add.text(336, 150, '', schrift(26)).setOrigin(0, 0.5);
    const kristallBild = this.add.image(300, 150, 'fangkristall');
    kristallBild.setScale(34 / kristallBild.height);
    this.festkleben(
      [
        feld(this, 30, 24, 400, 90),
        this.wer,
        this.zustand,
        this.erholung,
        ...textKnopf(this, 30, 124, 230, 52, `Team`, () => this.teamZeigen()),
        feld(this, 270, 124, 160, 52),
        kristallBild,
        this.kristallZahl,
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
    const rest = erholtSichNoch(spielstand.kalamprio);
    this.wer.setText(`${CHARAKTERE[spielstand.charakter].name} und ${tier.name} (Level ${levelVon(spielstand.kalamprio)})`);
    this.kristallZahl.setText(`× ${spielstand.fangkristalle}`);
    this.erholung.setVisible(rest > 0);
    if (rest > 0) {
      // Hat man ein anderes Kalamprio, das bereit ist, darf man tauschen.
      const tauschen = spielstand.team.some((anderes) => erholtSichNoch(anderes) === 0);
      this.zustand.setText(
        tauschen
          ? `${tier.name} erholt sich. Tausche im Team!`
          : `${tier.name} erholt sich, noch ${Math.ceil(rest / 1000)} Sekunden`,
      );
      this.erholung.scaleX = Math.min(1, rest / (REGELN.erholungSekunden * 1000));
    } else {
      this.zustand.setText(`${tier.name} ist bereit`);
    }
  }

  // Zeigt alle Kalamprios im Team. Wer angetippt wird, kämpft ab jetzt.
  teamZeigen() {
    if (this.gespraech || this.wechselt) return;
    this.laufziel = null;
    this.zeigerFuehrt = false;

    const team = spielstand.team;
    const teile = [
      this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(this, 100, 90, BREITE - 200, 540),
      this.add.text(BREITE / 2, 130, 'Dein Team', schrift(40, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
      this.add
        .text(BREITE / 2, 178, 'Tippe auf ein Kalamprio, dann kämpft es für dich.', schrift(22, '#d9c9ff'))
        .setOrigin(0.5),
    ];

    const abstandX = Math.min(220, (BREITE - 260) / team.length);
    team.forEach((kurzname, nummer) => {
      const x = BREITE / 2 + (nummer - (team.length - 1) / 2) * abstandX;
      const tier = KALAMPRIOS[kurzname];
      const aktiv = kurzname === spielstand.kalamprio;
      const rest = erholtSichNoch(kurzname);
      const karte = this.add
        .rectangle(x, 386, abstandX - 20, 316, FARBEN.knopf, aktiv ? 1 : 0.6)
        .setRounded(18)
        .setStrokeStyle(aktiv ? 6 : 3, aktiv ? 0xffffff : FARBEN.rand)
        .setInteractive({ useHandCursor: true });
      karte.on('pointerdown', () => {
        spielstand.kalamprio = kurzname;
        this.gespraechSchliessen();
        this.teamZeigen();
      });
      const bild = this.add.image(x, 420, kurzname).setOrigin(0.5, 1);
      bild.setScale(Math.min(170 / bild.height, (abstandX - 50) / bild.width));
      const zustand = aktiv ? 'kämpft' : rest > 0 ? `erholt sich (${Math.ceil(rest / 1000)} s)` : 'bereit';
      const fehlen = siegeBisNaechstesLevel(spielstand.siege[kurzname] ?? 0);
      const naechstes = fehlen === null ? 'höchstes Level' : `noch ${fehlen} ${fehlen === 1 ? 'Sieg' : 'Siege'} bis Level ${levelVon(kurzname) + 1}`;
      teile.push(
        karte,
        bild,
        this.add.text(x, 448, tier.name, schrift(26)).setOrigin(0.5),
        this.add.text(x, 478, `Level ${levelVon(kurzname)}`, schrift(20, '#ffd166')).setOrigin(0.5),
        this.add.text(x, 502, naechstes, schrift(14, '#d9c9ff')).setOrigin(0.5),
        this.add.text(x, 524, zustand, schrift(16, rest > 0 ? '#ffd166' : '#d9c9ff')).setOrigin(0.5),
      );
    });

    teile.push(...textKnopf(this, BREITE / 2 - 120, 552, 240, 56, 'Fertig', () => this.gespraechSchliessen()));
    this.festkleben(teile, VORNE + 100);
    this.gespraech = teile;
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
    verstummen();
    for (const teil of this.gespraech) teil.destroy();
    this.gespraech = null;
  }
}
