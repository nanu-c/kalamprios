// Die Welt: Hier spaziert man durch die Orte und trifft wilde Kalamprios
// und die Rivalin. Die Regeln fürs Laufen stehen in welt/weltlogik.js.
// Die Szene zeigt immer einen Ort, nämlich spielstand.ort.

import Phaser from 'phaser';
import { allesEssen, anzahl, beutelInhalt, einpacken, herausnehmen, sammelZutaten, sachenImBeutel, zutatInfo } from '../beutel.js';
import { CHARAKTERE } from '../daten/charaktere.js';
import { ELEMENTE } from '../daten/elemente.js';
import { GESCHICHTE } from '../daten/geschichte.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { KLAENGE } from '../daten/klaenge.js';
import { ORTE } from '../daten/orte.js';
import { REGELN } from '../daten/regeln.js';
import { erfahrungBisNaechstesLevel, levelFortschritt } from '../kampf/kampflogik.js';
import { aufsammeln, funkeln, geroell, kampfBeginnt, klick, kristallSummen, ortWechsel, ruf, schritt as schrittGeraeusch, umgebung } from '../klang/geraeusche.js';
import { hallStaerke } from '../klang/klang.js';
import { musikSpielen } from '../klang/musik.js';
import { erholtSichNoch, levelVon, mitnehmen, spielstand, weglassen, zuerstKaempfen } from '../spielstand.js';
import { verstummen, vorlesen } from '../vorlesen.js';
import {
  abstand,
  ankunft,
  ausgangAmRand,
  freierPlatz,
  grasBegegnung,
  hindernisseAmOrt,
  istImGras,
  richtungZu,
  schritt,
  tuerAmOrt,
  wegSperre,
  weltGrenzen,
} from '../welt/weltlogik.js';
import { feld, textKnopf } from './bausteine.js';
import { DUNKEL_TIEFE, LICHT_TIEFE, lichtschein, ortAufbauen, wegFreimachen } from './landschaft.js';
import { belohnungZeigen, streifenZu } from './animationen.js';
import { albumVollSatz, albumZeigen, fotoAnzahl, fotografieren, pflanzenFotoZeigen } from './kamera.js';
import { sucherOeffnen } from './sucher.js';
import { Kochen } from './kochen.js';
import { MuellQuest } from './muellQuest.js';
import { scheinwerferAuswahl } from './scheinwerfer.js';
import { Raetsel } from './raetsel.js';
import { Schatz } from './schatz.js';
import { vorDemTor, ZuZweit } from './zuZweit.js';
import { Beet, Saatgut } from './beet.js';
import { Statue } from './statue.js';
import { Flaschenpost } from './flaschenpost.js';
import { Werkbank } from './erfindung.js';
import { istVerbunden } from '../zusammen/verbindung.js';
import { BREITE, FARBEN, HOEHE, farbeAlsText, schrift } from './stil.js';

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
const SCHRITT_WEITE = 70; // nach so vielen Pixeln hört man einen Schritt
const MEHR_LICHT = 1.6;
const LEISTE = { x: 18, y: 18, hoehe: 60 }; // die Knöpfe oben links // so viel weiter scheint das Licht, wenn ein Rätsel mehrLicht gebracht hat

export class WeltSzene extends Phaser.Scene {
  // Was jemand gleich nach einem Kampf sagen soll (zum Beispiel die Rivalin):
  // ein Satz oder eine Liste von Sätzen, die nacheinander kommen.
  static nachricht = null;

  constructor() {
    super('Welt');
  }

  create() {
    // Hinter dem Freundschaftstor kann man nur zu zweit sein. Wer dort ohne die
    // andere weiterspielt (zum Beispiel nach dem Neuladen), steht wieder davor.
    if (ORTE[spielstand.ort].nurZuZweit && !istVerbunden()) {
      spielstand.ort = ORTE[spielstand.ort].zurueckNach;
      spielstand.position = vorDemTor(spielstand.ort);
    }
    this.ortName = spielstand.ort;
    this.ort = ORTE[this.ortName];
    this.grenzen = weltGrenzen(this.ort);
    // Manche Ausgänge sind verschüttet, bis das Rätsel des Ortes gelöst ist.
    const { verdecker, verschuettet } = ortAufbauen(this, this.ortName, (ausgang) => !ausgang.erstNachRaetsel || this.ausgangOffen(ausgang));
    this.verdecker = verdecker;
    this.verschuettet = verschuettet;
    this.hindernisse = [...hindernisseAmOrt(this.ort), ...verschuettet.flatMap((weg) => weg.hindernisse)];

    this.gespraech = null; // die Teile des Textfelds, solange jemand spricht
    this.wechselt = false; // true, sobald es zum Kampf geht
    this.laufziel = null; // der Punkt, zu dem man getippt hat
    this.zeigerFuehrt = false; // true, solange Finger oder Maus die Figur führen
    this.festgesteckt = 0;
    this.grasStrecke = 0;
    this.schrittStrecke = 0;
    // Phaser benutzt die Szene beim Ortswechsel weiter: Was der vorige Ort
    // hatte, muss hier wieder weg.
    this.summen = null;
    this.schimmer = null;

    // Jeder Ort hat seine eigene Musik. In der Mine und im Geheimgang hallt es
    // wie in einer Höhle. In der Rufkammer ist die Musik leiser, damit man
    // die Rufe gut hört.
    musikSpielen(this.ort.stil, this.ort.raetsel?.art === 'stimmen' ? KLAENGE.musikImRufraetsel : 1);
    hallStaerke(['mine', 'gang', 'wasser'].includes(this.ort.stil) ? 'hoehle' : 'normal');
    // Unter Wasser schwebt man: Figuren und Kalamprios bewegen sich auf und ab.
    this.unterWasser = this.ort.stil === 'wasser';

    // Die Rivalin wartet nur an einem Ort.
    // Bewacht sie einen Weg, steht sie mitten darin und sperrt ihn ganz.
    // Wer sie besiegt hat, dem macht sie Platz (rivalinNachSieg).
    // Am Anfang wartet sie im Lila Dorf am Weg zum Kristallwald und hat Hunger
    // (rivalinAmAnfang). Hat sie einem das erste Kalamprio geschenkt, ist sie weg.
    const amAnfang = this.ort.rivalinAmAnfang && spielstand.team.length === 0 ? this.ort.rivalinAmAnfang : null;
    this.rivalinWartetAufEssen = Boolean(amAnfang);
    if (this.ort.rivalin || amAnfang) {
      const bewacht = this.ort.ausgaenge.filter((ausgang) => (ausgang.erstNachRivalin || ausgang.erstNachGeschenk) && !this.ausgangOffen(ausgang));
      const platz = amAnfang ?? (bewacht.length > 0 ? this.ort.rivalin : this.ort.rivalinNachSieg ?? this.ort.rivalin);
      this.rivalinPlatz = platz;
      this.rivalinBewacht = bewacht.length > 0;
      this.rivalinSperren = [...bewacht.flatMap((ausgang) => wegSperre(ausgang, this.grenzen)), { ...platz, radius: RIVALIN_RADIUS }];
      this.hindernisse.push(...this.rivalinSperren);
      this.rivalin = this.figurBauen(`charakter-${spielstand.rivalin}`, FIGUR_HOEHE, platz);
      this.figurZeigen(this.rivalin, 0);
      this.rivalinName = this.add
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
    // Der dunkle Kristall summt. Je näher man kommt, desto lauter.
    if (dunkel) {
      this.summen = kristallSummen();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.summen?.beenden());
    }

    this.fangkristalleAufstellen();
    this.zutatenAufstellen();
    this.rezeptbuecherAufstellen();
    this.besonderesAufstellen();

    // Das Rätsel an diesem Ort (steht in der Datei des Ortes bei raetsel).
    this.raetsel = this.ort.raetsel ? new Raetsel(this) : null;

    this.wilde = this.ort.wildeKalamprios.map((eintrag, nummer) => ({
      ...this.figurBauen(eintrag.art, WILD_HOEHE, eintrag, KALAMPRIOS[eintrag.art].fliegt || this.unterWasser),
      ring: this.ringBauen(eintrag, ELEMENTE[KALAMPRIOS[eintrag.art].element].farbe),
      nummer,
      merkname: `${this.ortName}-${nummer}`, // so merkt sich der Spielstand, wer besiegt ist
      art: eintrag.art,
      heimat: { x: eintrag.x, y: eintrag.y },
      ziel: null,
      pauseBis: 0,
      naechsterRuf: this.time.now + 600 + Math.random() * 2500,
      da: true,
    }));

    this.spieler = this.figurBauen(
      `charakter-${spielstand.charakter}`,
      FIGUR_HOEHE,
      spielstand.position ?? this.ort.start,
      this.unterWasser,
    );
    if (this.unterWasser) this.blasenSteigen();
    // Wer nach einem Kampf neben der Rivalin oder dem Kristall steht, wird
    // nicht sofort wieder angesprochen.
    this.warBeiRivalin = this.istBeiRivalin();
    this.warBeimKristall = this.istBeimKristall();
    this.raetsel?.merken();
    this.warAnTuer = tuerAmOrt(this.ort, this.spieler.ort) !== null;

    // In der Küche kann man kochen, in der Schatzkammer steht die Truhe.
    this.kochen = this.ort.kueche ? new Kochen(this) : null;
    this.schatz = this.ort.schatz ? new Schatz(this) : null;
    this.muellQuest = this.ort.muellQuest ? new MuellQuest(this) : null;
    // Saatgut zum Aufsammeln, und im Lila Dorf das Beet (beet.js)
    this.saatgut = new Saatgut(this);
    this.beet = this.ort.beet ? new Beet(this) : null;
    // Eine verschollene Statue taucht auf, wenn das Rätsel gelöst ist (statue.js).
    this.statue = this.ort.statue ? new Statue(this) : null;
    // Am Mondsee: die Flaschenpost vom letzten Mondfisch (flaschenpost.js)
    this.flaschenpost = this.ort.flaschenpost ? new Flaschenpost(this) : null;
    // Das alte Bootshaus mit der Werkbank und den Bauplänen (erfindung.js)
    this.werkbank = this.ort.werkbank ? new Werkbank(this) : null;

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
    this.umgebungPlanen();
    this.anzeigeBauen();
    // Zu zweit spielen: der Knopf oben rechts und die Figur der anderen (zuZweit.js)
    this.zuZweit = new ZuZweit(this);
    if (spielstand.ortsnameZeigen) this.ortsnameZeigen();

    // Gerade die Rivalin zum ersten Mal besiegt? Dann sagt sie etwas dazu.
    const nachricht = WeltSzene.nachricht;
    WeltSzene.nachricht = null;
    if (nachricht) this.time.delayedCall(500, () => this.saetzeNacheinander([nachricht].flat()));

    // Im Regenwald: Beim ersten Mal ist die Figur verwirrt, und das Pflanzenalbum liegt am Boden.
    if (this.ort.pflanzen) this.regenwaldAufbauen();
    // Hinter dem Freundschaftstor wird beim ersten Mal erzählt, wo man ist (ankommen beim Ort).
    else if (this.ort.ankommen && !spielstand.angekommen[this.ortName]) {
      spielstand.angekommen[this.ortName] = true;
      const name = CHARAKTERE[spielstand.charakter].name;
      this.time.delayedCall(900, () => this.saetzeNacheinander(this.ort.ankommen.map((satz) => satz.replace('{name}', name)), null, 'Los geht’s!'));
    }

    // Im Kinderzimmer wird man beim ersten Aufwachen begrüßt.
    if (this.ort.begruessung && !spielstand.begruesst) {
      spielstand.begruesst = true;
      const namen = (satz) => satz.replace('{name}', CHARAKTERE[spielstand.charakter].name).replace('{rivalin}', CHARAKTERE[spielstand.rivalin].name);
      this.time.delayedCall(700, () => this.saetzeNacheinander(this.ort.begruessung.map(namen)));
    }
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
      this.zutatenPfluecken();
      this.saatgut.pruefen();
      this.beet?.pruefen();
      this.statue?.pruefen();
      this.flaschenpost?.pruefen(dt);
      this.werkbank?.pruefen();
      this.rezeptbuecherFinden();
      this.besonderesFinden();
      this.muellQuest?.pruefen();
      if (this.ort.pflanzen) this.regenwaldPruefen();
      this.raetsel?.pruefen();
      this.kochen?.pruefen();
      this.schatz?.pruefen();
      this.begegnungenPruefen();
    }

    // Wo die Figur steht, kommt mit in den gespeicherten Spielstand.
    if (!this.wechselt) spielstand.position = { x: this.spieler.ort.x, y: this.spieler.ort.y };
    this.figurZeigen(this.spieler, zeit);
    this.zuZweit.update(zeit, Math.min(delta, 250) / 1000);
    this.dunkelheit?.setPosition(this.spieler.ort.x, this.spieler.ort.y - FIGUR_HOEHE / 2);
    this.verdeckerLichten();
    this.kristallSummenAnpassen();
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

  // Ein leuchtender Ring am Boden in der Farbe des Elements. Daran erkennt
  // man wilde Kalamprios schon von weitem.
  ringBauen(ort, farbe) {
    const breite = WILD_HOEHE * 0.85;
    const ring = this.add.container(ort.x, ort.y, [
      this.add.ellipse(0, 0, breite, breite * 0.3, farbe, 0.22),
      this.add.ellipse(0, 0, breite, breite * 0.3).setStrokeStyle(4, farbe, 0.95),
    ]);
    ring.setDepth(1);
    this.tweens.add({ targets: ring, alpha: 0.45, scale: 1.12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return ring;
  }

  // Setzt Bild und Schatten an den Ort der Figur. Wer läuft, hüpft und wippt.
  // Wer fliegt, schwebt auf und ab, und sein Schatten wird dabei kleiner und größer.
  figurZeigen(figur, zeit) {
    const schwung = figur.laeuft ? Math.sin(zeit / 95) : 0;
    figur.schatten.setPosition(figur.ort.x, figur.ort.y);
    figur.ring?.setPosition(figur.ort.x, figur.ort.y);
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
  // Rund um das Tuch liegen noch vier riesige dunkle Flächen. So bleibt es
  // auch dunkel, wenn die Kamera nicht bei der Figur ist (am Rand des Ortes
  // oder wenn sie zu einem Ausgang schaut).
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
    const tuch = this.add.image(0, 0, name);
    const breite = tuch.width / 2;
    const hoehe = tuch.height / 2;
    const weit = 20000;
    const rand = (x, y, w, h) => this.add.rectangle(x, y, w, h, 0x080412).setOrigin(0);
    this.dunkelheit = this.add
      .container(0, 0, [
        tuch,
        rand(-breite - weit, -hoehe - weit, weit, hoehe * 2 + weit * 2), // links
        rand(breite, -hoehe - weit, weit, hoehe * 2 + weit * 2), // rechts
        rand(-breite, -hoehe - weit, breite * 2, weit), // oben
        rand(-breite, hoehe, breite * 2, weit), // unten
      ])
      .setAlpha(this.ort.dunkel)
      .setDepth(DUNKEL_TIEFE);
    this.lichtFlackern(this.raetsel?.mehrLicht() ? MEHR_LICHT : this.ort.licht ?? 1);
  }

  // Das Licht flackert ein kleines bisschen, wie von einer Laterne.
  lichtFlackern(groesse) {
    this.tweens.killTweensOf(this.dunkelheit);
    this.dunkelheit.setScale(groesse);
    this.tweens.add({ targets: this.dunkelheit, scale: groesse * 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Ein gelöstes Rätsel bringt mehr Licht: Das helle Loch wird langsam größer.
  lichtVergroessern() {
    if (!this.dunkelheit) return;
    this.tweens.killTweensOf(this.dunkelheit);
    this.tweens.add({
      targets: this.dunkelheit,
      scale: MEHR_LICHT,
      duration: 1500,
      ease: 'Sine.easeOut',
      onComplete: () => this.lichtFlackern(MEHR_LICHT),
    });
  }

  // --------------------------------------------------------- Fangkristalle

  // Fangkristalle liegen zum Aufsammeln herum. Ist einer aufgesammelt, liegt
  // nach einer Weile wieder einer da.
  // Fangkristalle und Zutaten wachsen nicht immer an derselben Stelle nach:
  // Wer eins aufsammelt, findet das nächste woanders im Ort. Wo es als
  // Nächstes liegt, merkt sich der Spielstand (dropOrte). Am Anfang liegt
  // es dort, wo es in der Datei des Ortes steht.
  dropPlatz(merkname, punkt) {
    return spielstand.dropOrte[merkname] ?? { x: punkt.x, y: punkt.y };
  }

  // Würfelt den Platz, an dem es als Nächstes liegt, und stellt es dorthin.
  dropWandern(ding, hinstellen) {
    const platz = freierPlatz(this.ort);
    if (!platz) return;
    spielstand.dropOrte[ding.dropName] = platz;
    hinstellen(ding, platz);
  }

  fangkristalleAufstellen() {
    this.fangkristalle = (this.ort.fangkristalle ?? []).map((punkt, nummer) => {
      const merkname = `${this.ortName}-${nummer}`;
      const kristall = {
        merkname,
        dropName: `fangkristall-${merkname}`,
        bild: this.add.image(0, 0, 'fangkristall').setOrigin(0.5, 1),
        schein: lichtschein(this, 0, 0, 130, 100, 0xb99cf0),
      };
      kristall.bild.setScale(FANGKRISTALL_HOEHE / kristall.bild.height);
      this.kristallHinstellen(kristall, this.dropPlatz(kristall.dropName, punkt));
      return kristall;
    });
  }

  kristallHinstellen(kristall, punkt) {
    const { bild, schein } = kristall;
    kristall.punkt = punkt;
    this.tweens.killTweensOf([bild, schein]);
    bild.setPosition(punkt.x, punkt.y).setDepth(this.ort.dunkel ? LICHT_TIEFE : punkt.y);
    schein.setPosition(punkt.x, punkt.y - 20).setAlpha(0.7).setDepth(this.ort.dunkel ? LICHT_TIEFE : punkt.y - 1);
    this.tweens.add({ targets: bild, y: punkt.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: schein, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
  }

  fangkristalleAufsammeln() {
    const jetzt = Date.now();
    for (const kristall of this.fangkristalle) {
      const da = jetzt >= (spielstand.fangkristallWiederDa[kristall.merkname] ?? 0);
      kristall.bild.setVisible(da);
      kristall.schein.setVisible(da);
      if (!da || abstand(this.spieler.ort, kristall.punkt) > AUFSAMMELN_ABSTAND) continue;

      spielstand.fangkristalle += 1;
      aufsammeln();
      spielstand.fangkristallWiederDa[kristall.merkname] = jetzt + REGELN.fangkristallWaechstNachSekunden * 1000;
      const plus = this.add
        .text(kristall.punkt.x, kristall.punkt.y - 70, '+1 Fangkristall', schrift(24, '#f6f0ff', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 6)
        .setDepth(VORNE - 1);
      this.tweens.add({ targets: plus, y: plus.y - 50, alpha: 0, duration: 1300, onComplete: () => plus.destroy() });
      kristall.bild.setVisible(false);
      kristall.schein.setVisible(false);
      this.dropWandern(kristall, (k, platz) => this.kristallHinstellen(k, platz));
    }
  }

  // ---------------------------------------------------------------- Zutaten

  // Draußen wachsen Zutaten zum Kochen (zutaten beim Ort). Wer hinläuft,
  // pflückt sie, und sie kommen in den Beutel. Nach einer Weile wächst
  // wieder eine nach (zutatenWachsenNachSekunden in regeln.js).
  zutatenAufstellen() {
    const alle = Object.fromEntries(sammelZutaten().map((zutat) => [zutat.kurzname, zutat]));
    this.zutaten = (this.ort.zutaten ?? []).map((punkt, nummer) => {
      const merkname = `${this.ortName}-${nummer}`;
      const zutat = alle[punkt.art];
      const z = {
        zutat,
        nummer,
        merkname,
        dropName: `zutat-${merkname}`,
        bild: this.add.image(0, 0, zutat.bild).setOrigin(0.5, 1),
        schein: lichtschein(this, 0, 0, 110, 80, 0xfff3c4),
      };
      z.bild.setScale(44 / Math.max(z.bild.height, z.bild.width * 0.8));
      this.zutatHinstellen(z, this.dropPlatz(z.dropName, punkt));
      return z;
    });
  }

  zutatHinstellen(z, punkt) {
    const { bild, schein } = z;
    z.punkt = punkt;
    this.tweens.killTweensOf([bild, schein]);
    bild.setPosition(punkt.x, punkt.y).setAngle(0).setDepth(this.ort.dunkel ? LICHT_TIEFE : punkt.y);
    schein.setPosition(punkt.x, punkt.y - 20).setAlpha(0.55).setDepth(this.ort.dunkel ? LICHT_TIEFE : punkt.y - 1);
    this.tweens.add({ targets: bild, angle: { from: -6, to: 6 }, duration: 1100 + z.nummer * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: schein, alpha: 0.25, duration: 1000, yoyo: true, repeat: -1 });
  }

  zutatenPfluecken() {
    const jetzt = Date.now();
    for (const z of this.zutaten) {
      const da = jetzt >= (spielstand.zutatWiederDa[z.merkname] ?? 0);
      z.bild.setVisible(da);
      z.schein.setVisible(da);
      if (!da || abstand(this.spieler.ort, z.punkt) > AUFSAMMELN_ABSTAND) continue;

      einpacken(z.zutat.kurzname);
      spielstand.zutatWiederDa[z.merkname] = jetzt + REGELN.zutatenWachsenNachSekunden * 1000;
      this.beutelHuepfen();
      const plus = this.add
        .text(z.punkt.x, z.punkt.y - 70, `+1 ${z.zutat.name}`, schrift(24, '#fff3c4', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#3a2410', 6)
        .setDepth(VORNE - 1);
      this.tweens.add({ targets: plus, y: plus.y - 50, alpha: 0, duration: 1300, onComplete: () => plus.destroy() });
      z.bild.setVisible(false);
      z.schein.setVisible(false);
      this.dropWandern(z, (ding, platz) => this.zutatHinstellen(ding, platz));
    }
  }

  // --------------------------------------------------------- Unter Wasser

  // Aus der Figur steigen Luftblasen auf, und vom Boden blubbert es.
  blasenSteigen() {
    const blase = (x, y, groesse) => {
      const b = this.add.circle(x, y, groesse).setStrokeStyle(2, 0xe8f6ff, 0.85).setFillStyle(0xffffff, 0.12).setDepth(VORNE - 30);
      const hoch = Math.max(60, y - 80);
      this.tweens.add({ targets: b, y: y - hoch, x: x + (Math.random() - 0.5) * 60, alpha: 0, duration: hoch * 6, ease: 'Sine.easeOut', onComplete: () => b.destroy() });
    };
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const kopf = { x: this.spieler.ort.x + 10, y: this.spieler.bild.y - this.spieler.bild.displayHeight + 20 };
        for (let i = 0; i < 2; i += 1) this.time.delayedCall(i * 160, () => blase(kopf.x, kopf.y, 4 + Math.random() * 4));
      },
    });
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => blase(Math.random() * this.ort.breite, this.ort.hoehe - 140, 3 + Math.random() * 6),
    });
  }

  // ------------------------------------------------------- Besondere Dinge

  // Dinge, die man nur einmal findet (besonderes beim Ort), zum Beispiel das
  // Lungenkraut. Sie leuchten, bis man sie aufhebt, und kommen in den Beutel.
  besonderesAufstellen() {
    this.besondere = (this.ort.besonderes ?? [])
      .filter((ding) => !spielstand.gefunden[ding.art])
      .map((ding) => {
        const schein = lichtschein(this, ding.x, ding.y - 30, 160, 130, 0x9ad8ff).setAlpha(0.6).setDepth(ding.y - 1);
        const bild = this.add.image(ding.x, ding.y, ding.art).setOrigin(0.5, 1).setDepth(ding.y);
        bild.setScale(64 / Math.max(bild.height, bild.width));
        this.tweens.add({ targets: bild, angle: { from: -5, to: 5 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: schein, alpha: 0.25, scale: schein.scale * 1.2, duration: 1100, yoyo: true, repeat: -1 });
        return { ding, bild, schein };
      });
  }

  besonderesFinden() {
    for (const fund of this.besondere) {
      if (fund.weg || abstand(this.spieler.ort, fund.ding) > AUFSAMMELN_ABSTAND + 10) continue;
      fund.weg = true;
      spielstand.gefunden[fund.ding.art] = true;
      fund.bild.destroy();
      fund.schein.destroy();
      this.laufziel = null;
      belohnungZeigen(this, fund.ding, { bild: fund.ding.art, text: fund.ding.name });
      this.saetzeNacheinander([fund.ding.satz], null, 'Toll!');
    }
  }

  // --------------------------------------------------------------- Rezepte

  // Manche Rezepte liegen als Rezeptbuch irgendwo in der Welt (fundort beim
  // Rezept in haus.js). Wer eins aufhebt, kann das Rezept in der Küche kochen.
  rezeptbuecherAufstellen() {
    this.rezeptbuecher = allesEssen()
      .filter((rezept) => rezept.fundort?.ort === this.ortName && !spielstand.rezepteGefunden[rezept.kurzname])
      .map((rezept) => {
        const { x, y } = rezept.fundort;
        const tiefe = this.ort.dunkel ? LICHT_TIEFE : y;
        const schein = lichtschein(this, x, y - 30, 170, 130, 0xffd166).setAlpha(0.7).setDepth(this.ort.dunkel ? LICHT_TIEFE : y - 1);
        const bild = this.add.image(x, y, 'kochbuch').setOrigin(0.5, 1).setDepth(tiefe);
        bild.setScale(52 / bild.height);
        this.tweens.add({ targets: bild, y: y - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: schein, alpha: 0.3, scale: schein.scale * 1.15, duration: 1000, yoyo: true, repeat: -1 });
        return { rezept, bild, schein, punkt: { x, y } };
      });
  }

  rezeptbuecherFinden() {
    for (const buch of this.rezeptbuecher) {
      if (buch.gefunden || abstand(this.spieler.ort, buch.punkt) > AUFSAMMELN_ABSTAND + 10) continue;
      buch.gefunden = true;
      const { rezept } = buch;
      spielstand.rezepteGefunden[rezept.kurzname] = true;
      aufsammeln();
      this.tweens.killTweensOf([buch.bild, buch.schein]);
      this.tweens.add({ targets: [buch.bild, buch.schein], y: '-=80', alpha: 0, duration: 700, onComplete: () => [buch.bild, buch.schein].forEach((t) => t.destroy()) });
      const zutaten = rezept.zutaten.map((art) => zutatInfo(art).name);
      const liste = `${zutaten.slice(0, -1).join(', ')} und ${zutaten.at(-1)}`;
      const satz = ORTE.kueche.kueche.gefunden.replace('{rezept}', rezept.name).replace('{zutaten}', liste);
      this.laufziel = null;
      vorlesen(satz);
      this.gespraechZeigen(satz, [['Toll!', () => this.gespraechSchliessen()]]);
    }
  }

  // ---------------------------------------------------------------- Kamera

  // Macht ein Foto vom wilden Kalamprio, das am nächsten ist. Es muss auf
  // dem Bildschirm sein und nah genug (fotoWeite in regeln.js).
  fotoMachen() {
    if (this.gespraech || this.wechselt || this.fotografiert) return;
    // Im Regenwald fotografiert man Pflanzen, durch den Sucher.
    if (this.ort.pflanzen) {
      this.pflanzeFotografieren();
      return;
    }
    const sicht = this.cameras.main.worldView;
    const nah = this.wilde
      .filter((wild) => wild.da && sicht.contains(wild.ort.x, wild.ort.y - 40))
      .map((wild) => ({ wild, weit: abstand(this.spieler.ort, wild.ort) }))
      .filter(({ weit }) => weit <= REGELN.fotoWeite)
      .sort((a, b) => a.weit - b.weit)[0];
    if (!nah) {
      klick();
      const hinweis = this.add
        .text(this.spieler.ort.x, this.spieler.ort.y - FIGUR_HOEHE - 30, 'Kein Kalamprio in der Nähe. Geh näher heran!', schrift(22, '#f6f0ff', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 6)
        .setDepth(VORNE - 1);
      this.tweens.add({ targets: hinweis, y: hinweis.y - 40, alpha: 0, delay: 900, duration: 900, onComplete: () => hinweis.destroy() });
      return;
    }
    this.fotografiert = true;
    this.laufziel = null;
    const { wild } = nah;
    ruf(wild.art, { ort: this.hoerOrt(wild.ort) ?? {} });
    this.tweens.add({ targets: wild.bild, scaleY: wild.bild.scaleY * 1.1, duration: 150, yoyo: true });
    fotografieren(this, wild.art, wild.bild, { x: this.albumKnopf.x + 30, y: this.albumKnopf.y + 30 }).then(({ voll }) => {
      this.fotografiert = false;
      this.albumHuepfen();
      if (!voll) return;
      belohnungZeigen(this, this.spieler.ort, { bild: 'fangkristall', anzahl: REGELN.albumVollFangkristalle, text: `+${REGELN.albumVollFangkristalle} Fangkristalle` });
      this.saetzeNacheinander([albumVollSatz()]);
    });
  }

  albumHuepfen() {
    this.tweens.add({ targets: this.albumBild, scale: this.albumBild.scale * 1.35, duration: 140, yoyo: true });
  }

  // Hat man das Pflanzenalbum gefunden, fragt das Spiel, welches Album man ansehen will.
  albumOeffnen(welches = null) {
    if (this.gespraech || this.wechselt) return;
    this.laufziel = null;
    this.zeigerFuehrt = false;
    if (spielstand.pflanzenalbum && welches === null) {
      this.gespraechZeigen('Welches Album möchtest du ansehen?', [
        ['Kalamprios', () => this.anderesAlbum('kalamprios')],
        ['Pflanzen', () => this.anderesAlbum('pflanzen')],
      ]);
      return;
    }
    const pflanzen = welches === 'pflanzen' ? ORTE.regenwald.pflanzen : null;
    const { teile } = albumZeigen(this, () => this.gespraechSchliessen(), pflanzen);
    this.gespraech = teile;
  }

  anderesAlbum(welches) {
    this.gespraechSchliessen();
    this.albumOeffnen(welches);
  }

  // ------------------------------------------------------------ Regenwald

  regenwaldAufbauen() {
    const name = CHARAKTERE[spielstand.charakter].name;
    const ersetzen = (satz) => satz.replace('{name}', name);
    // Das Pflanzenalbum liegt im Moos, bis man es aufhebt.
    const album = this.ort.album;
    if (!spielstand.pflanzenalbum) {
      this.albumSchein = lichtschein(this, album.x, album.y - 20, 160, 110, 0xd9ffb0).setAlpha(0.6).setDepth(album.y - 1);
      this.albumImMoos = this.add.image(album.x, album.y, 'fotoalbum').setOrigin(0.5, 1).setDepth(album.y).setTint(0xa8e0a0).setAngle(-12);
      this.albumImMoos.setScale(60 / this.albumImMoos.height);
      this.tweens.add({ targets: this.albumSchein, alpha: 0.2, duration: 1100, yoyo: true, repeat: -1 });
    }
    // Beim ersten Mal ist die Figur verwirrt: Fragezeichen über dem Kopf, dann wundert sie sich.
    if (!spielstand.angekommen[this.ortName]) {
      spielstand.angekommen[this.ortName] = true;
      for (let i = 0; i < 3; i += 1) {
        this.time.delayedCall(300 + i * 350, () => {
          const frage = this.add
            .text(this.spieler.ort.x + (i - 1) * 34, this.spieler.ort.y - FIGUR_HOEHE - 10, '?', schrift(48, '#ffd166', { fontStyle: 'bold' }))
            .setOrigin(0.5)
            .setStroke('#1a3a1a', 8)
            .setDepth(VORNE - 1);
          this.tweens.add({ targets: frage, y: frage.y - 60, angle: (i - 1) * 20, alpha: 0, duration: 1600, onComplete: () => frage.destroy() });
        });
      }
      this.tweens.add({ targets: this.spieler.bild, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 3 });
      const saetze = [...this.ort.ankommen];
      if (!spielstand.kamera) saetze.push(this.ort.ohneKamera);
      this.time.delayedCall(1400, () => this.saetzeNacheinander(saetze.map(ersetzen), null, 'Los geht’s!'));
    }
  }

  regenwaldPruefen() {
    if (!this.albumImMoos || spielstand.pflanzenalbum) return;
    if (abstand(this.spieler.ort, this.ort.album) > AUFSAMMELN_ABSTAND + 10 || this.gespraech) return;
    spielstand.pflanzenalbum = true;
    this.albumImMoos.destroy();
    this.albumSchein.destroy();
    this.laufziel = null;
    belohnungZeigen(this, this.ort.album, { bild: 'fotoalbum', text: 'Pflanzenalbum', ziel: { x: this.albumKnopf.x + 30, y: this.albumKnopf.y + 30 } });
    this.saetzeNacheinander([this.ort.albumGefunden], null, 'Toll!');
  }

  // Die Pflanze, die am nächsten ist, kommt in den Sucher. Wie weit sie weg
  // ist, bestimmt, wie man scharf stellen muss.
  pflanzeFotografieren() {
    const sicht = this.cameras.main.worldView;
    const nah = this.ort.pflanzen
      .filter((pflanze) => sicht.contains(pflanze.x, pflanze.y - 40))
      .map((pflanze) => ({ pflanze, weit: abstand(this.spieler.ort, pflanze) }))
      .filter(({ weit }) => weit <= REGELN.fotoWeite)
      .sort((a, b) => a.weit - b.weit)[0];
    if (!nah) {
      klick();
      const hinweis = this.add
        .text(this.spieler.ort.x, this.spieler.ort.y - FIGUR_HOEHE - 30, 'Keine Pflanze in der Nähe. Geh näher heran!', schrift(22, '#f6f0ff', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#1a3a1a', 6)
        .setDepth(VORNE - 1);
      this.tweens.add({ targets: hinweis, y: hinweis.y - 40, alpha: 0, delay: 900, duration: 900, onComplete: () => hinweis.destroy() });
      return;
    }
    const { pflanze, weit } = nah;
    this.laufziel = null;
    this.zeigerFuehrt = false;
    this.gespraech = []; // solange man durch den Sucher schaut, läuft die Figur nicht
    sucherOeffnen(this, `pflanze-${pflanze.art}`, weit / REGELN.fotoWeite).then((gelungen) => {
      this.gespraech = null;
      if (!gelungen) return;
      const neu = !spielstand.pflanzenFotos[pflanze.art];
      spielstand.pflanzenFotos[pflanze.art] = true;
      const blitz = this.add.rectangle(0, 0, BREITE, HOEHE, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(VORNE + 300);
      this.tweens.add({ targets: blitz, alpha: 0, duration: 450, onComplete: () => blitz.destroy() });
      this.fotografiert = true;
      pflanzenFotoZeigen(this, pflanze, neu, { x: this.albumKnopf.x + 30, y: this.albumKnopf.y + 30 }).then(() => {
        this.fotografiert = false;
        this.albumHuepfen();
        const saetze = [];
        if (neu) saetze.push(`Notiz: ${pflanze.notiz}`);
        if (!spielstand.pflanzenalbum) saetze.push('Wohin mit dem Foto? Irgendwo hier muss doch ein Album liegen …');
        const alle = this.ort.pflanzen.every((p) => spielstand.pflanzenFotos[p.art]);
        if (alle && spielstand.pflanzenalbum && !spielstand.pflanzenalbumVoll) {
          spielstand.pflanzenalbumVoll = true;
          const kristalle = this.ort.belohnung?.fangkristalle ?? 0;
          spielstand.fangkristalle += kristalle;
          saetze.push(this.ort.albumVoll.replace('{anzahl}', this.ort.pflanzen.length).replace('{belohnung}', kristalle));
          belohnungZeigen(this, this.spieler.ort, { anzahl: kristalle, text: `+${kristalle} Fangkristalle` });
        }
        if (saetze.length > 0) this.saetzeNacheinander(saetze, null, 'Weiter forschen!');
      });
    });
  }

  // Zeigt Sätze nacheinander, beim letzten steht „Danke!“ auf dem Knopf.
  // Nach dem letzten passiert danach() (wenn es das gibt). Jeder Satz wird vorgelesen.
  saetzeNacheinander(saetze, danach = null, ende = 'Danke!') {
    const zeigen = (nummer) => {
      this.gespraechSchliessen();
      const letzter = nummer === saetze.length - 1;
      vorlesen(saetze[nummer]);
      this.gespraechZeigen(saetze[nummer], [
        [
          letzter ? ende : 'Weiter',
          () => {
            if (!letzter) {
              zeigen(nummer + 1);
              return;
            }
            this.gespraechSchliessen();
            danach?.();
          },
        ],
      ]);
    };
    zeigen(0);
  }

  // ------------------------------------------------- Das erste Kalamprio

  // Am Anfang hat die Rivalin Hunger. Bringt man ihr, was sie sich wünscht,
  // schenkt sie einem zum Dank das erste Kalamprio.
  rivalinHatHunger() {
    const rivalin = CHARAKTERE[spielstand.rivalin];
    const wunsch = this.ort.rivalinAmAnfang.wuenscht;
    if (anzahl(wunsch) > 0) {
      this.saetzeNacheinander([`${rivalin.name}: „${rivalin.danke}“`], () => this.geschenkAuswahl(), 'Zeig sie mir!');
      return;
    }
    this.saetzeNacheinander([`${rivalin.name}: „${rivalin.hunger}“`], null, 'Mach ich!');
  }

  // Die Kalamprios mit zumStart stehen im Scheinwerferlicht, man sucht sich eins aus.
  geschenkAuswahl() {
    const waehlbare = Object.keys(KALAMPRIOS).filter((kurzname) => KALAMPRIOS[kurzname].zumStart);
    this.laufziel = null;
    this.zeigerFuehrt = false;
    const teile = [
      this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.88).setOrigin(0).setInteractive(),
      this.add.text(BREITE / 2, 56, 'Welches Kalamprio möchtest du?', schrift(38, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
    ];
    teile.push(
      ...scheinwerferAuswahl(
        this,
        waehlbare.map((kurzname) => {
          const element = ELEMENTE[KALAMPRIOS[kurzname].element];
          return { bild: kurzname, name: KALAMPRIOS[kurzname].name, zusatz: element.name, zusatzFarbe: farbeAlsText(element.farbe), beimZeigen: () => ruf(kurzname) };
        }),
        (nummer) => {
          this.gespraechSchliessen();
          this.geschenkNehmen(waehlbare[nummer], waehlbare);
        },
        { boden: 540, groesse: 300 },
      ),
    );
    this.festkleben(teile, VORNE + 100);
    this.gespraech = teile;
  }

  geschenkNehmen(kurzname, waehlbare) {
    const rivalin = CHARAKTERE[spielstand.rivalin];
    herausnehmen(this.ort.rivalinAmAnfang.wuenscht);
    spielstand.kalamprio = kurzname;
    spielstand.team = [kurzname];
    spielstand.kampfteam = [kurzname];
    // Die Rivalin behält das andere.
    spielstand.rivalinKalamprio = waehlbare.find((anderes) => anderes !== kurzname);
    this.rivalinWartetAufEssen = false;
    ruf(kurzname);
    // Das Kalamprio erscheint groß und fliegt oben links ins Kampfteam.
    const platz = this.kampfteamPlaetze[0].rahmen;
    belohnungZeigen(this, this.rivalinPlatz, {
      bild: kurzname,
      text: `${KALAMPRIOS[kurzname].name} gehört jetzt dir!`,
      ziel: { x: platz.x + platz.width / 2, y: platz.y + platz.height / 2 },
    }).then(() => this.saetzeNacheinander([`${rivalin.name}: „${rivalin.bisGleich}“`], () => this.rivalinGehtWeg(), 'Bis gleich!'));
  }

  // Die Rivalin geht durch den Ausgang davon, und der Weg ist frei.
  rivalinGehtWeg() {
    const teile = [this.rivalin.bild, this.rivalin.schatten, this.rivalinName];
    this.tweens.add({ targets: teile, x: '+=420', alpha: 0, duration: 1600, ease: 'Sine.easeIn', onComplete: () => teile.forEach((teil) => teil.destroy()) });
    this.hindernisse = this.hindernisse.filter((hindernis) => !this.rivalinSperren.includes(hindernis));
    this.rivalin = null;
    this.rivalinBewacht = false;
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

    const weite = REGELN.lauftempo * dt * (this.unterWasser ? REGELN.schwimmTempo : 1);
    const vorher = this.spieler.ort;
    this.spieler.ort = schritt(
      vorher,
      { x: richtung.x * weite, y: richtung.y * weite },
      SPIELER_RADIUS,
      this.hindernisse,
      this.grenzen,
    );
    const gelaufen = abstand(vorher, this.spieler.ort);

    const offen = { ausgaenge: this.ort.ausgaenge.filter((weg) => this.ausgangOffen(weg)) };
    const ausgang = ausgangAmRand(offen, this.spieler.ort, this.grenzen);
    if (ausgang) {
      this.ortWechseln(ausgang.nach);
      return;
    }
    // Eine Tür mitten im Ort: Haustür, Treppe oder Pilzring
    const tuer = tuerAmOrt(this.ort, this.spieler.ort);
    const neueTuer = tuer && !this.warAnTuer;
    this.warAnTuer = tuer !== null;
    if (neueTuer && !this.gespraech) {
      this.durchDieTuer(tuer);
      return;
    }
    // Wer an einem Weg steht, den die Rivalin bewacht, wird von ihr angesprochen.
    const amWeg = ausgangAmRand(this.ort, this.spieler.ort, this.grenzen);
    const bewacht = Boolean(this.rivalin && (amWeg?.erstNachRivalin || amWeg?.erstNachGeschenk));
    if (bewacht && !this.warAmBewachtenWeg && !this.gespraech) this.rivalinSpricht();
    this.warAmBewachtenWeg = bewacht;

    // Kommt die Figur auf dem Weg zum getippten Ziel nicht weiter, gibt sie auf.
    if (this.laufziel) {
      this.festgesteckt = gelaufen < weite * 0.3 ? this.festgesteckt + dt : 0;
      if (this.festgesteckt > 0.4) this.laufziel = null;
    }

    const imGras = istImGras(this.spieler.ort, this.ort.hohesGras);
    this.schrittStrecke += gelaufen;
    if (this.schrittStrecke >= SCHRITT_WEITE) {
      this.schrittStrecke = 0;
      const boden = { mine: 'stein', gang: 'stein', haus: 'holz', wasser: 'wasser', regenwald: 'gras', himmel: 'gras', garten: 'gras' }[this.ort.stil] ?? 'erde';
      schrittGeraeusch(imGras ? 'gras' : boden);
    }
    if (imGras) this.imGrasGelaufen(gelaufen);
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
    // Wer das geheime Kalamprio schon gefangen hat, trifft es nicht noch einmal.
    const bisher = spielstand.grasOhneGeheimes[this.ortName] ?? 0;
    const schonGefangen = spielstand.team.includes(this.ort.geheimesImGras?.art);
    const { art, geheim } = grasBegegnung(schonGefangen ? { ...this.ort, geheimesImGras: null } : this.ort, bisher);
    spielstand.grasOhneGeheimes[this.ortName] = geheim ? 0 : bisher + 1;
    // Das geheime Kalamprio ist der Endgegner und hat ein eigenes Level (regeln.js).
    this.kampfBeginnen({ gegner: art, gegnerLevel: geheim ? REGELN.geheimesLevel : undefined });
  }

  // Ein Ausgang mit erstNachRaetsel ist erst offen, wenn das Rätsel gelöst
  // ist, einer mit erstNachRivalin erst, wenn man die Rivalin besiegt hat.
  ausgangOffen(ausgang) {
    if (ausgang.erstNachRivalin && !spielstand.rivalinBesiegt) return false;
    if (ausgang.erstNachGeschenk && spielstand.team.length === 0) return false;
    return !ausgang.erstNachRaetsel || spielstand.raetselGeloest[this.ortName] === true;
  }

  // Das Rätsel ist gelöst: Verschüttete Wege werden frei. Die Kamera schaut
  // kurz hin, damit man sieht, wo es weitergeht.
  raetselGeloest() {
    this.statue?.auftauchen();
    const wege = this.verschuettet;
    this.verschuettet = [];
    if (wege.length === 0) return;
    const kamera = this.cameras.main;
    this.time.delayedCall(600, () => {
      kamera.stopFollow();
      kamera.pan(wege[0].mitte.x, wege[0].mitte.y, 1200, 'Sine.easeInOut');
    });
    this.time.delayedCall(1700, () => {
      geroell();
      kamera.shake(900, 0.006);
      for (const weg of wege) {
        wegFreimachen(this, weg);
        this.hindernisse = this.hindernisse.filter((hindernis) => !weg.hindernisse.includes(hindernis));
        // Ein Lichtblitz, den man auch im Dunkeln sieht
        const blitz = lichtschein(this, weg.mitte.x, weg.mitte.y - 60, 500, 500, 0xe8e0ff).setDepth(LICHT_TIEFE).setAlpha(0);
        this.tweens.add({ targets: blitz, alpha: 0.9, duration: 500, yoyo: true, hold: 600, onComplete: () => blitz.destroy() });
      }
    });
    this.time.delayedCall(4000, () => {
      kamera.pan(this.spieler.ort.x, this.spieler.ort.y, 900, 'Sine.easeInOut', false, (_, fertig) => {
        if (fertig === 1) kamera.startFollow(this.spieler.schatten, true, 0.12, 0.12);
      });
    });
  }

  // Durch eine Tür gehen. Hat die Tür einen satz (wie der Pilzring), wird er
  // beim ersten Mal erzählt, und man kann sich noch überlegen, ob man hineingeht.
  durchDieTuer(tuer) {
    // Manche Türen gehen erst auf, wenn das Rätsel des Ortes gelöst ist
    // (die Wolkentreppe im Garten der Mondrosen).
    if (tuer.erstNachRaetsel && !spielstand.raetselGeloest[this.ortName]) {
      this.saetzeNacheinander([tuer.ohne ?? 'Hier kommst du noch nicht weiter.'], null, 'Okay');
      return;
    }
    // Durch das Freundschaftstor kommt man nur zu zweit (zuZweit.js).
    if (tuer.zuZweit) {
      const { geht, satz } = this.zuZweit.durchsTor(tuer);
      if (!geht) {
        this.saetzeNacheinander([satz], null, 'Okay');
        return;
      }
    }
    // Manche Türen gehen nur mit einem besonderen Ding (zum Beispiel tauchen
    // nur mit dem Lungenkraut).
    if (tuer.braucht && !spielstand.gefunden[tuer.braucht]) {
      this.saetzeNacheinander([tuer.ohne ?? 'Hier kommst du noch nicht weiter.'], null, 'Okay');
      return;
    }
    const merkname = `${this.ortName}-${this.ort.tueren.indexOf(tuer)}`;
    if (!tuer.satz || spielstand.tuerenGefunden[merkname]) {
      this.ortWechseln(tuer.nach);
      return;
    }
    vorlesen(tuer.satz);
    this.gespraechZeigen(tuer.satz, [
      [
        'Hinein!',
        () => {
          spielstand.tuerenGefunden[merkname] = true;
          this.gespraechSchliessen();
          this.ortWechseln(tuer.nach);
        },
      ],
      ['Lieber nicht', () => this.gespraechSchliessen()],
    ]);
  }

  // Geht durch einen Ausgang zum nächsten Ort.
  // wohin: (optional) wo man ankommt, zum Beispiel am Lagerfeuer (zuZweit.js)
  ortWechseln(nach, wohin = null) {
    if (this.wechselt) return;
    this.wechselt = true;
    this.spieler.laeuft = false;
    this.laufziel = null;
    const vonOrt = this.ortName;
    ortWechsel();

    const kamera = this.cameras.main;
    kamera.fadeOut(300, 23, 11, 44);
    kamera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      spielstand.ort = nach;
      spielstand.position = wohin ?? ankunft(ORTE[nach], vonOrt);
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
      wild.ring.setVisible(wild.da);
      if (!wild.da) {
        wild.ort = { ...wild.heimat };
        wild.ziel = null;
        continue;
      }
      this.wildRuft(wild, zeit);

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

  // ------------------------------------------------------------- Hören

  // Wie man etwas an diesem Punkt hört: aus der Nähe laut und klar, von
  // weiter weg leiser und dumpfer, und von links oder rechts, je nachdem, wo
  // es ist. Weiter weg als KLAENGE.hoerweite hört man nichts (dann null).
  hoerOrt(punkt) {
    const entfernung = abstand(this.spieler.ort, punkt);
    if (entfernung >= KLAENGE.hoerweite) return null;
    const naehe = 1 - entfernung / KLAENGE.hoerweite;
    return {
      lautstaerke: naehe ** 2,
      pan: Phaser.Math.Clamp((punkt.x - this.spieler.ort.x) / 600, -1, 1) * 0.9,
      dumpf: (1 - naehe) * 0.8,
    };
  }

  // Wilde Kalamprios rufen ab und zu. Wer nah dran ist, hört sie öfter.
  wildRuft(wild, zeit) {
    if (zeit < wild.naechsterRuf) return;
    const ort = this.hoerOrt(wild.ort);
    wild.naechsterRuf = zeit + 2000 + Math.random() * 3000 + (1 - (ort?.lautstaerke ?? 0)) * 3000;
    if (!ort || this.wechselt) return;
    ruf(wild.art, { ort });
    this.notenZeigen(wild);
  }

  // Kleine Noten steigen auf, wenn ein Kalamprio ruft.
  notenZeigen(wild) {
    const farbe = farbeAlsText(ELEMENTE[KALAMPRIOS[wild.art].element].farbe);
    for (let i = 0; i < 2; i += 1) {
      const note = this.add
        .text(wild.ort.x + (i ? 22 : -14), wild.bild.y - wild.bild.displayHeight - 4, i ? '♫' : '♪', schrift(30, farbe, { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#2a1650', 5)
        .setDepth(wild.ort.y + 1)
        .setAlpha(0);
      this.tweens.add({
        targets: note,
        y: note.y - 60,
        x: note.x + (i ? 14 : -10),
        alpha: { from: 1, to: 0 },
        delay: i * 180,
        duration: 1300,
        onComplete: () => note.destroy(),
      });
    }
  }

  // Der dunkle Kristall wird lauter, je näher man kommt. Hat man ihn schon
  // gehört, summt er nur noch ganz leise.
  kristallSummenAnpassen() {
    if (!this.summen) return;
    const ort = this.hoerOrt(this.ort.dunklerKristall);
    const leise = spielstand.geschichteGehoert[this.ortName] ? 0.25 : 1;
    this.summen.setzen(ort ? ort.lautstaerke * 0.7 * leise : 0, ort?.pan ?? 0);
  }

  // Ab und zu hört man den Ort: Vögel im Dorf, ein Windspiel aus Kristallen
  // im Wald, Tropfen in der Mine, Wellen am See. Fangkristalle in der Nähe funkeln.
  umgebungPlanen() {
    // Im Regenwald ist viel mehr los: Vögel, Frösche und Zikaden.
    const pause = this.ort.stil === 'regenwald' ? 400 + Math.random() * 900 : 1500 + Math.random() * 3500;
    this.time.delayedCall(pause, () => {
      if (!this.wechselt) {
        umgebung(this.ort.stil, { pan: Math.random() * 1.6 - 0.8, lautstaerke: 0.6 + Math.random() * 0.4 });
        for (const kristall of this.fangkristalle) {
          const ort = kristall.bild.visible ? this.hoerOrt(kristall.punkt) : null;
          if (ort) funkeln(ort);
        }
      }
      this.umgebungPlanen();
    });
  }

  // ----------------------------------------------------------- Begegnungen

  // Nach einer Niederlage und kurz nach jedem Kampf greift niemand an.
  kampfbereit() {
    if (!spielstand.kalamprio) return false; // ohne Kalamprio kein Kampf
    return erholtSichNoch(spielstand.kalamprio) === 0 && Date.now() >= spielstand.ruheBis;
  }

  istBeiRivalin() {
    if (!this.rivalin) return false;
    // Bewacht sie einen Weg, spricht sie einen schon an, wenn man in die Nähe kommt.
    const nah = this.rivalinBewacht ? 170 : SPIELER_RADIUS + RIVALIN_RADIUS + 14;
    return abstand(this.spieler.ort, this.rivalinPlatz) < nah;
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
          merkname,
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
    if (this.rivalinWartetAufEssen) {
      this.rivalinHatHunger();
      return;
    }
    const rivalin = CHARAKTERE[spielstand.rivalin];
    const meinTier = KALAMPRIOS[spielstand.kalamprio].name;

    if (erholtSichNoch(spielstand.kalamprio) > 0) {
      this.gespraechZeigen(
        `${rivalin.name}: „${meinTier} sieht müde aus. Komm wieder, wenn es sich erholt hat!“`,
        [['Okay', () => this.gespraechSchliessen()]],
      );
      return;
    }

    // Mit zu wenigen Kalamprios kämpft sie gar nicht erst (teamFuerRivalin in regeln.js).
    const noetig = REGELN.teamFuerRivalin;
    if (!spielstand.rivalinBesiegt && spielstand.kampfteam.length < noetig) {
      const tipp =
        spielstand.team.length >= noetig ? ` Tippe auf „Team“ und nimm ${noetig} mit.` : ' Fang erst noch Kalamprios im hohen Gras!';
      this.gespraechZeigen(`${rivalin.name}: „${rivalin.zuWenige.replace('{anzahl}', noetig)}“${tipp}`, [
        ['Okay', () => this.gespraechSchliessen()],
      ]);
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
              // Beim ersten Sieg schenkt sie einem ihre Kamera.
              if (!spielstand.rivalinBesiegt) WeltSzene.nachricht = [`${rivalin.name}: „${rivalin.besiegt}“`, `${rivalin.name}: „${rivalin.kamera}“`];
              spielstand.rivalinBesiegt = true;
              spielstand.kamera = true;
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
  // merkname: (bei sichtbaren wilden Kalamprios) so merkt sich der Spielstand, wer besiegt ist.
  // Steht die andere beim Spielen zu zweit in der Nähe, kämpft sie gegen ein
  // wildes Kalamprio mit (zuZweit.js). Gegen die Rivalin und das geheime
  // Kalamprio kämpft man immer allein.
  kampfBeginnen({ gegner, gegnerLevel = this.ort.wildesLevel ?? 1, trainerin = null, merkname = null, beiSieg }) {
    if (this.wechselt) return;
    const allein = trainerin || KALAMPRIOS[gegner].geheim;
    const hilfe = allein ? null : this.zuZweit.hilfeHolen({ gegner, gegnerLevel, merkname });
    const nachKampf = (gewonnen) => {
      spielstand.ruheBis = Date.now() + RUHE_NACH_KAMPF;
      if (gewonnen) beiSieg?.();
    };
    this.kampfAnfangen().then(async () => {
      const zuZweit = await hilfe;
      if (zuZweit) {
        this.scene.start('ZusammenKampf', { ...zuZweit, nachKampf });
        return;
      }
      this.scene.start('Kampf', {
        spieler: spielstand.kalamprio,
        gegner,
        gegnerLevel,
        trainerin,
        // Wer im Kampf nicht mehr konnte, erholt sich schon (das merkt sich der Kampf).
        nachKampf,
      });
    });
  }

  // Ein Kampf zu zweit, den die andere angefangen hat, oder ein
  // Freundschaftskampf (zuZweit.js). auswahl steht in ZusammenKampfSzene.js.
  zuZweitKaempfen(auswahl) {
    if (this.wechselt) return;
    this.kampfAnfangen().then(() =>
      this.scene.start('ZusammenKampf', {
        ...auswahl,
        nachKampf: (gewonnen) => {
          spielstand.ruheBis = Date.now() + RUHE_NACH_KAMPF;
          auswahl.nachKampf?.(gewonnen);
        },
      }),
    );
  }

  // Ein Kampf beginnt: Über der Figur springt ein „!“ auf, alles wackelt,
  // und dann schieben sich Streifen über den Bildschirm. Das Versprechen ist
  // erfüllt, wenn der Bildschirm zu ist.
  kampfAnfangen() {
    this.wechselt = true;
    this.gespraechSchliessen();
    this.spieler.laeuft = false;
    this.laufziel = null;
    spielstand.position = { ...this.spieler.ort };

    kampfBeginnt();
    const kopf = { x: this.spieler.ort.x, y: this.spieler.ort.y - FIGUR_HOEHE - 20 };
    const ausruf = this.add
      .text(kopf.x, kopf.y, '!', schrift(80, '#ffd166', { fontStyle: 'bold' }))
      .setOrigin(0.5, 1)
      .setStroke('#2a1650', 10)
      .setDepth(VORNE + 400)
      .setScale(0);
    this.tweens.add({ targets: ausruf, scale: 1, y: kopf.y - 20, duration: 260, ease: 'Back.easeOut' });
    this.cameras.main.shake(380, 0.008);
    return new Promise((fertig) => this.time.delayedCall(420, () => streifenZu(this).then(fertig)));
  }

  // ------------------------------------------------- Anzeige und Gespräche

  // Klebt Teile fest auf den Bildschirm, damit sie nicht mit der Welt wegrollen.
  festkleben(teile, tiefe) {
    teile.forEach((teil, nummer) => teil.setScrollFactor(0).setDepth(tiefe + nummer));
  }

  anzeigeBauen() {
    // Oben links in einer Reihe: die Kalamprios, die mit in den Kampf kommen
    // (antippen öffnet das Team), dann Beutel, Kamera und Fotoalbum.
    const kampfteamFeld = feld(this, LEISTE.x, LEISTE.y, REGELN.imKampfHoechstens * 68 + 6, LEISTE.hoehe).setInteractive({ useHandCursor: true });
    kampfteamFeld.on('pointerdown', () => {
      klick();
      this.teamZeigen();
    });
    this.kampfteamPlaetze = Array.from({ length: REGELN.imKampfHoechstens }, (_, nummer) => this.kampfteamPlatzBauen(nummer));
    // Der Beutel: Wer draufdrückt, sieht, was drin ist.
    let x = LEISTE.x + REGELN.imKampfHoechstens * 68 + 14;
    const beutel = this.leistenKnopf(x, 'beutel', () => this.beutelZeigen(), true);
    this.beutelBild = beutel.bild;
    this.beutelZahl = beutel.zahl;
    x += 66;
    const kamera = this.leistenKnopf(x, 'kamera', () => this.fotoMachen());
    x += 66;
    const album = this.leistenKnopf(x, 'fotoalbum', () => this.albumOeffnen(), true);
    this.albumKnopf = album.flaeche;
    this.albumBild = album.bild;
    this.albumZahl = album.zahl;
    // Die Kamera ist erst da, wenn man sie von der Rivalin bekommen hat, das
    // Album dann auch (oder wenn man das Pflanzenalbum gefunden hat).
    this.kameraKnopfTeile = kamera.teile;
    this.albumTeile = album.teile;
    this.kameraTeile = [...kamera.teile, ...album.teile];
    this.festkleben(
      [
        kampfteamFeld,
        ...this.kampfteamPlaetze.flatMap((platz) => platz.teile),
        ...beutel.teile,
        ...this.kameraTeile,
        feld(this, BREITE - LEISTE.x - 230, LEISTE.y, 230, LEISTE.hoehe),
        this.add.text(BREITE - LEISTE.x - 115, LEISTE.y + LEISTE.hoehe / 2, this.ort.name, schrift(22, '#d9c9ff')).setOrigin(0.5),
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

  // Ein Platz oben links für ein Kalamprio aus dem Kampfteam: sein Bild, sein
  // Level und ob es sich gerade erholt. Wer zuerst kämpft, hat einen goldenen Rand.
  kampfteamPlatzBauen(nummer) {
    const x = LEISTE.x + 6 + nummer * 68;
    const y = LEISTE.y + 6;
    const mitte = { x: x + 32, y: y + 24 };
    const rahmen = this.add.rectangle(x, y, 64, 48, 0x170b2c, 0.55).setOrigin(0).setRounded(10).setStrokeStyle(2, FARBEN.rand, 0.6);
    const bild = this.add.image(mitte.x, y + 46, 'kalampria-klein').setOrigin(0.5, 1);
    const level = this.add.text(x + 62, y, '', schrift(12, '#ffd166', { fontStyle: '600' })).setOrigin(1, 0).setStroke('#170b2c', 4);
    // Wer sich erholt: ein rotes Kreuz, die Sekunden und ein Balken, der kürzer wird
    const kreuz = this.add.text(x + 3, y - 2, '✕', schrift(17, '#ff6b8b', { fontStyle: 'bold' })).setStroke('#170b2c', 4);
    const sekunden = this.add.text(mitte.x, mitte.y + 2, '', schrift(15, '#ffffff', { fontStyle: '600' })).setOrigin(0.5).setStroke('#170b2c', 4);
    const balken = this.add.rectangle(x + 4, y + 44, 56, 4, FARBEN.kpWenig).setOrigin(0, 0.5);
    return { kurzname: null, rahmen, bild, level, kreuz, sekunden, balken, teile: [rahmen, bild, level, kreuz, sekunden, balken] };
  }

  kampfteamZeigen() {
    this.kampfteamPlaetze.forEach((platz, nummer) => {
      const kurzname = spielstand.kampfteam[nummer] ?? null;
      if (kurzname !== platz.kurzname) {
        platz.kurzname = kurzname;
        if (kurzname) {
          platz.bild.setTexture(`${kurzname}-klein`);
          platz.bild.setScale(Math.min(40 / platz.bild.height, 58 / platz.bild.width));
        }
      }
      platz.rahmen.setStrokeStyle(nummer === 0 && kurzname ? 4 : 2, nummer === 0 && kurzname ? 0xffd166 : FARBEN.rand, kurzname ? 1 : 0.35);
      platz.bild.setVisible(Boolean(kurzname));
      platz.level.setText(kurzname ? `Lv ${levelVon(kurzname)}` : '');
      const rest = kurzname ? erholtSichNoch(kurzname) : 0;
      const erholt = rest > 0;
      platz.bild.setAlpha(erholt ? 0.35 : 1);
      if (erholt) platz.bild.setTint(0x8a8a9a);
      else platz.bild.clearTint();
      platz.kreuz.setVisible(erholt);
      platz.sekunden.setVisible(erholt).setText(`${Math.ceil(rest / 1000)} s`);
      platz.balken.setVisible(erholt);
      platz.balken.scaleX = Math.min(1, rest / (REGELN.erholungSekunden * 1000));
    });
  }

  anzeigeAktualisieren() {
    this.kampfteamZeigen();
    const albumDa = spielstand.kamera || spielstand.pflanzenalbum;
    for (const teil of this.kameraKnopfTeile) teil.setVisible(spielstand.kamera);
    for (const teil of this.albumTeile) teil.setVisible(albumDa);
    this.zahlZeigen(this.beutelZahl, sachenImBeutel());
    // Im Regenwald zählt das Abzeichen am Album die Pflanzenfotos.
    const pflanzenFotos = this.ort.pflanzen ? this.ort.pflanzen.filter((p) => spielstand.pflanzenFotos[p.art]).length : null;
    this.zahlZeigen(this.albumZahl, pflanzenFotos ?? fotoAnzahl(), albumDa);
  }

  // Zeigt alle Kalamprios im Team. Wer angetippt wird, kommt mit in den
  // Kampf (höchstens REGELN.imKampfHoechstens). Wer schon mitkommt und
  // angetippt wird, kämpft zuerst. Mit dem × bleibt eines da.
  teamZeigen(meldung = '') {
    if (this.gespraech || this.wechselt) return;
    if (spielstand.team.length === 0) {
      this.saetzeNacheinander(['Du hast noch kein Kalamprio. Bring der Rivalin im Dorf Sternenpfannkuchen, dann schenkt sie dir eins!'], null, 'Okay');
      return;
    }
    this.laufziel = null;
    this.zeigerFuehrt = false;
    const neuZeigen = (neueMeldung) => {
      this.gespraechSchliessen();
      this.teamZeigen(neueMeldung);
    };

    const team = spielstand.team;
    const hoechstens = REGELN.imKampfHoechstens;
    const teile = [
      this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(this, 60, 36, BREITE - 120, 652),
      this.add.text(BREITE / 2, 78, 'Dein Team', schrift(38, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
      this.add
        .text(BREITE / 2, 122, `Tippe an, wer mit in den Kampf kommt (höchstens ${hoechstens}). Die 1 kämpft zuerst.`, schrift(20, '#d9c9ff'))
        .setOrigin(0.5),
      this.add.text(BREITE / 2, 154, meldung, schrift(20, '#ffd166')).setOrigin(0.5),
    ];

    // Ab 6 Kalamprios kommen sie in zwei Reihen, mit kleineren Karten.
    const reihen = team.length > 5 ? 2 : 1;
    const proReihe = Math.ceil(team.length / reihen);
    const abstandX = Math.min(220, (BREITE - 180) / proReihe);
    const breite = abstandX - 20;
    const gross = reihen === 1;
    const hoehe = gross ? 330 : 205;
    // So weit unter der Mitte der Karte steht jede Zeile (bild: Unterkante des Bildes).
    const zeile = gross
      ? { bild: 34, bildHoehe: 170, name: 60, level: 88, balken: 110, naechstes: 128, zustand: 148 }
      : { bild: -2, bildHoehe: 82, name: 18, level: 40, balken: 56, naechstes: 70, zustand: 87 };
    const schriften = gross ? [26, 20, 14, 16] : [22, 17, 13, 15];

    team.forEach((kurzname, nummer) => {
      const reihe = Math.floor(nummer / proReihe);
      const inDerReihe = reihe === reihen - 1 ? team.length - reihe * proReihe : proReihe;
      const x = BREITE / 2 + ((nummer % proReihe) - (inDerReihe - 1) / 2) * abstandX;
      const y = gross ? 400 : 282 + reihe * 214;
      const oben = y - hoehe / 2;

      const tier = KALAMPRIOS[kurzname];
      const platz = spielstand.kampfteam.indexOf(kurzname); // -1: bleibt da
      const dabei = platz >= 0;
      const rest = erholtSichNoch(kurzname);
      const karte = this.add
        .rectangle(x, y, breite, hoehe, FARBEN.knopf, dabei ? 1 : 0.45)
        .setRounded(18)
        .setStrokeStyle(platz === 0 ? 6 : dabei ? 4 : 2, platz === 0 ? 0xffffff : dabei ? 0xffd166 : FARBEN.rand)
        .setInteractive({ useHandCursor: true });
      karte.on('pointerdown', () => {
        ruf(kurzname);
        if (dabei) zuerstKaempfen(kurzname);
        else if (!mitnehmen(kurzname)) {
          neuZeigen(`Es sind schon ${hoechstens} dabei. Tippe erst bei einem auf das ×.`);
          return;
        }
        neuZeigen();
      });
      const bild = this.add.image(x, y + zeile.bild, kurzname).setOrigin(0.5, 1).setAlpha(dabei ? 1 : 0.7);
      bild.setScale(Math.min(zeile.bildHoehe / bild.height, (breite - 30) / bild.width));

      let zustand = platz === 0 ? 'kämpft zuerst' : dabei ? 'kommt mit' : 'bleibt da';
      if (rest > 0) zustand = `erholt sich (${Math.ceil(rest / 1000)} s)`;
      const erfahrung = spielstand.erfahrung[kurzname] ?? 0;
      const fehlen = erfahrungBisNaechstesLevel(erfahrung);
      const naechstes = fehlen === null ? 'höchstes Level' : `noch ${fehlen} bis Level ${levelVon(kurzname) + 1}`;
      // Der goldene Erfahrungsbalken: Ist er voll, kommt das nächste Level.
      const balkenBreite = Math.min(160, breite - 40);
      const balken = this.add.rectangle(x - balkenBreite / 2, y + zeile.balken, balkenBreite, 10, 0xffd166).setOrigin(0, 0.5);
      balken.scaleX = levelFortschritt(erfahrung);
      const [nameGroesse, levelGroesse, naechstesGroesse, zustandGroesse] = schriften;
      teile.push(
        karte,
        bild,
        this.add.text(x, y + zeile.name, tier.name, schrift(nameGroesse)).setOrigin(0.5),
        this.add.text(x, y + zeile.level, `Level ${levelVon(kurzname)}`, schrift(levelGroesse, '#ffd166')).setOrigin(0.5),
        this.add.rectangle(x - balkenBreite / 2, y + zeile.balken, balkenBreite, 10, 0x170b2c).setOrigin(0, 0.5).setStrokeStyle(1, 0xffd166, 0.6),
        balken,
        this.add.text(x, y + zeile.naechstes, naechstes, schrift(naechstesGroesse, '#d9c9ff')).setOrigin(0.5),
        this.add.text(x, y + zeile.zustand, zustand, schrift(zustandGroesse, rest > 0 ? '#ffd166' : '#d9c9ff')).setOrigin(0.5),
      );

      if (!dabei) return;
      // Oben links die Nummer: In dieser Reihenfolge kommen sie in den Kampf.
      teile.push(
        this.add.circle(x - breite / 2 + 24, oben + 24, 17, 0xffd166),
        this.add.text(x - breite / 2 + 24, oben + 24, `${platz + 1}`, schrift(22, '#2a1650', { fontStyle: '600' })).setOrigin(0.5),
      );
      // Oben rechts das ×: Dann bleibt es beim nächsten Kampf da.
      const weg = this.add
        .circle(x + breite / 2 - 24, oben + 24, 17, 0x6b2a5a)
        .setStrokeStyle(2, FARBEN.rand)
        .setInteractive({ useHandCursor: true });
      weg.on('pointerdown', () => {
        klick();
        neuZeigen(weglassen(kurzname) ? '' : 'Eines muss mitkommen.');
      });
      teile.push(weg, this.add.text(x + breite / 2 - 24, oben + 22, '×', schrift(26)).setOrigin(0.5));
    });

    teile.push(...textKnopf(this, BREITE / 2 - 120, 620, 240, 54, 'Fertig', () => this.gespraechSchliessen()));
    this.festkleben(teile, VORNE + 100);
    this.gespraech = teile;
  }

  // Kamera und Album: zwei kleine Knöpfe neben dem Beutel. Sie sind erst da,
  // wenn man die Kamera von der Rivalin bekommen hat.
  // Ein kleiner, quadratischer Knopf in der Leiste oben links, mit einem Bild.
  // mitZahl: Oben rechts zeigt ein goldenes Abzeichen eine Zahl (zahlZeigen).
  leistenKnopf(x, bildName, beimKlick, mitZahl = false) {
    const flaeche = this.add
      .rectangle(x, LEISTE.y, 60, LEISTE.hoehe, FARBEN.knopf)
      .setOrigin(0)
      .setRounded(14)
      .setStrokeStyle(3, FARBEN.rand)
      .setInteractive({ useHandCursor: true });
    flaeche.on('pointerdown', () => {
      klick();
      beimKlick();
    });
    const bild = this.add.image(x + 30, LEISTE.y + LEISTE.hoehe / 2, bildName);
    bild.setScale(Math.min(42 / bild.height, 46 / bild.width));
    const teile = [flaeche, bild];
    let zahl = null;
    if (mitZahl) {
      const kreis = this.add.circle(x + 56, LEISTE.y + 4, 13, 0xffd166).setStrokeStyle(2, 0x2a1650);
      const text = this.add.text(x + 56, LEISTE.y + 4, '', schrift(14, '#2a1650', { fontStyle: '600' })).setOrigin(0.5);
      zahl = { kreis, text };
      teile.push(kreis, text);
    }
    return { flaeche, bild, zahl, teile };
  }

  // Die Zahl im Abzeichen. Bei 0 (oder wenn der Knopf noch fehlt) ist das
  // Abzeichen nicht zu sehen.
  zahlZeigen(zahl, wert, knopfDa = true) {
    zahl.text.setText(`${wert}`);
    zahl.kreis.setVisible(knopfDa && wert > 0);
    zahl.text.setVisible(knopfDa && wert > 0);
  }

  // Wo der Beutel oben links gerade in der Welt ist (damit etwas hineinfliegen kann).
  beutelOrt() {
    const kamera = this.cameras.main;
    return { x: kamera.scrollX + this.beutelBild.x, y: kamera.scrollY + this.beutelBild.y };
  }

  // Der Beutel hüpft kurz, wenn etwas hineinkommt.
  beutelHuepfen() {
    aufsammeln();
    const groesse = this.beutelBild.scale;
    this.tweens.add({ targets: this.beutelBild, scale: groesse * 1.35, duration: 140, yoyo: true, onComplete: () => this.beutelBild.setScale(groesse) });
  }

  // Zeigt, was im Beutel ist. Benutzen kann man die Sachen im Kampf.
  beutelZeigen() {
    if (this.gespraech || this.wechselt) return;
    this.laufziel = null;
    this.zeigerFuehrt = false;
    const inhalt = beutelInhalt();
    const teile = [
      this.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(this, 60, 36, BREITE - 120, 652),
      this.add.text(BREITE / 2, 78, 'Dein Beutel', schrift(38, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
      this.add
        .text(BREITE / 2, 122, inhalt.length > 0 ? 'Im Kampf tippst du auf „Beutel“, um etwas davon zu benutzen.' : 'Der Beutel ist leer. Sammle Fangkristalle, oder koch etwas in der Küche!', schrift(20, '#d9c9ff'))
        .setOrigin(0.5),
    ];
    // Bis zu fünf Sachen in einer Reihe, sonst zwei Reihen mit kleineren Karten.
    const reihen = inhalt.length > 5 ? 2 : 1;
    const proReihe = Math.ceil(inhalt.length / reihen);
    const abstandX = Math.min(240, (BREITE - 180) / Math.max(1, proReihe));
    const hoehe = reihen === 1 ? 360 : 222;
    inhalt.forEach((sache, nummer) => {
      const reihe = Math.floor(nummer / proReihe);
      const inDerReihe = reihe === reihen - 1 ? inhalt.length - reihe * proReihe : proReihe;
      const x = BREITE / 2 + ((nummer % proReihe) - (inDerReihe - 1) / 2) * abstandX;
      const y = reihen === 1 ? 380 : 270 + reihe * 236;
      const oben = y - hoehe / 2;
      const bild = this.add.image(x, oben + (reihen === 1 ? 140 : 84), sache.bild).setOrigin(0.5, 1);
      bild.setScale(Math.min((reihen === 1 ? 120 : 70) / bild.height, (abstandX - 60) / bild.width));
      teile.push(
        this.add.rectangle(x, y, abstandX - 16, hoehe, FARBEN.knopf).setRounded(18).setStrokeStyle(3, FARBEN.rand),
        bild,
        this.add.text(x, oben + (reihen === 1 ? 168 : 100), `${sache.name}  × ${sache.anzahl}`, schrift(reihen === 1 ? 23 : 19)).setOrigin(0.5),
        this.add
          .text(x, oben + (reihen === 1 ? 200 : 122), sache.info, schrift(reihen === 1 ? 17 : 14, '#d9c9ff', { wordWrap: { width: abstandX - 40 }, align: 'center' }))
          .setOrigin(0.5, 0),
      );
    });
    teile.push(...textKnopf(this, BREITE / 2 - 120, 620, 240, 54, 'Fertig', () => this.gespraechSchliessen()));
    this.festkleben(teile, VORNE + 100);
    this.gespraech = teile;
  }

  // Zeigt unten ein Textfeld mit Knöpfen. knoepfe ist eine Liste aus
  // [Beschriftung, was beim Klick passiert].
  gespraechZeigen(text, knoepfe) {
    this.laufziel = null;
    this.zeigerFuehrt = false;

    // Bei langem Text wird das Feld nach oben größer, damit der Text nicht
    // unter die Knöpfe rutscht.
    const schriftzug = this.add.text(70, 0, text, schrift(26, '#ffffff', { wordWrap: { width: 1140 } }));
    const oben = Math.min(530, 586 - schriftzug.height);
    schriftzug.setY(oben + 22);
    const teile = [feld(this, 40, oben, 1200, 690 - oben), schriftzug];
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
