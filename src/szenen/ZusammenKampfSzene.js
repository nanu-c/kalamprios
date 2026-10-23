// Ein Kampf zu zweit, auf zwei Geräten. Er sieht aus wie ein normaler Kampf
// (darum benutzt er vieles aus KampfSzene.js), aber jede wählt auf ihrem
// eigenen Gerät. Die Regeln stehen in kampf/zusammenkampf.js.
//
// Beim Freundschaftskampf (duell) steht das eigene Kalamprio links und das
// der anderen rechts. Zu zweit gegen ein wildes Kalamprio (zusammen) stehen
// beide links: das eigene vorne, das der anderen etwas kleiner dahinter.
//
// Jede Runde wählen beide eine Aktion. Das Gerät, das den Kampf angefangen
// hat ('a'), würfelt aus, was passiert, und schickt es dem anderen ('b').
// Dann zeigen beide Geräte dasselbe.

import { allesEssen, herausnehmen } from '../beutel.js';
import { ORTE } from '../daten/orte.js';
import { REGELN } from '../daten/regeln.js';
import { fangChance, MAX_LEVEL } from '../kampf/kampflogik.js';
import { aktiver, ereignisAnwenden, istRaus, platzVon, rundeAusrechnen, sieger, werWaehlt } from '../kampf/zusammenkampf.js';
import { einwechseln, umfallen, wusch } from '../klang/geraeusche.js';
import { kampfmusikSpielen, melodieSpielen } from '../klang/musik.js';
import { mitnehmen, spielstand, zuerstKaempfen } from '../spielstand.js';
import { hoeren, senden } from '../zusammen/verbindung.js';
import { feld } from './bausteine.js';
import { hintergrundMalen } from './hintergrund.js';
import { KampfSzene } from './KampfSzene.js';
import { streifenAuf } from './animationen.js';
import { schrift } from './stil.js';

// Kämpfe, die die andere abgesagt hat, bevor dieser Bildschirm da war.
const abgesagt = new Set();
hoeren('kampfAus', ({ id }) => abgesagt.add(id));

export class ZusammenKampfSzene extends KampfSzene {
  constructor() {
    super('ZusammenKampf');
  }

  // auswahl:
  //   kampf:   der Kampf aus kampfErstellen (zusammenkampf.js)
  //   ich:     'a' oder 'b': welcher Platz einem selbst gehört
  //   id:      woran beide Geräte diesen Kampf erkennen
  //   partner: der Name der anderen Figur
  //   nachKampf: wird am Ende aufgerufen, mit true bei einem Sieg
  init(auswahl) {
    this.auswahl = auswahl;
  }

  create() {
    hintergrundMalen(this, ORTE[spielstand.ort].stil);
    this.kampf = this.auswahl.kampf;
    this.duell = this.kampf.art === 'duell';
    this.leitung = this.auswahl.ich === 'a';
    this.meinPlatz = platzVon(this.kampf, this.auswahl.ich);
    this.ihrPlatz = platzVon(this.kampf, this.leitung ? 'b' : 'a');
    this.partner = this.auswahl.partner;
    streifenAuf(this, this.duell ? 'Freundschaftskampf!' : 'Zu zweit!');
    kampfmusikSpielen();

    this.wahlen = {}; // nur bei 'a': was auf jedem Platz gewählt wurde
    this.warteschlange = []; // Runden, die noch gezeigt werden müssen
    this.spielt = false; // true, solange eine Runde gezeigt wird
    this.vorbei = false;
    this.geheim = false;
    this.zuStark = false;

    // Wo jeder Platz auf dem Bildschirm steht.
    this.orte = this.kampf.plaetze.map((platz, nummer) => {
      if (nummer === this.meinPlatz) return { seite: 'links', x: this.duell ? 330 : 440, eigen: true };
      if (this.duell) return { seite: 'rechts', wem: this.partner, eigen: false };
      if (platz.wer === 'wild') return { seite: 'rechts', eigen: false };
      return { seite: 'links', x: 175, feldY: 146, klein: true, wem: this.partner, eigen: false };
    });

    this.anzeige = new Map();
    this.knoepfe = [];
    // Das Kalamprio der anderen steht hinten: Es kommt zuerst auf den Bildschirm.
    const reihenfolge = this.kampf.plaetze.map((_, nummer) => nummer).sort((a, b) => Number(a === this.meinPlatz) - Number(b === this.meinPlatz));
    for (const nummer of reihenfolge) this.aufstellen(aktiver(this.kampf.plaetze[nummer]), this.orte[nummer].seite, this.orte[nummer]);
    this.spieler = aktiver(this.kampf.plaetze[this.meinPlatz]);
    this.team = this.kampf.plaetze[this.meinPlatz].team;
    this.gegner = this.gegnerKaempfer();
    this.auswahl.gegner = this.gegner.kurzname; // für den Foto-Knopf

    feld(this, 40, 570, 560, 130);
    this.meldung = this.add.text(64, 590, '', schrift(26, '#ffffff', { wordWrap: { width: 512 }, lineSpacing: 6 }));

    this.attackenKnoepfeBauen();
    this.beutelKnopf = this.beutelKnopfBauen();
    if (this.duell) this.fotoKnopf = [];
    else this.fotoKnopfBauen();
    this.tauschKnopf = this.tauschKnopfBauen();

    const ab = [
      hoeren('kampfAus', ({ id }) => id === this.auswahl.id && this.abbrechen(`${this.partner} kann gerade doch nicht. Der Kampf ist aus.`)),
      hoeren('getrennt', () => this.partnerWeg()),
    ];
    if (this.leitung) {
      ab.push(
        hoeren('kampfWahl', ({ id, wahl }) => {
          if (id !== this.auswahl.id) return;
          this.wahlen[this.ihrPlatz] = wahl;
          this.rundeVersuchen();
        }),
      );
    } else {
      ab.push(
        hoeren('kampfRunde', ({ id, ereignisse }) => {
          if (id !== this.auswahl.id) return;
          this.warteschlange.push(ereignisse);
          this.abspielen();
        }),
      );
    }
    this.events.once('shutdown', () => ab.forEach((aufhoeren) => aufhoeren()));

    const gegner = this.kampf.plaetze.find((platz) => platz.seite === 'rechts');
    this.sagen(this.duell ? `${this.partner} schickt ${aktiver(gegner).name} in den Kampf!` : `${this.gegner.name} stellt sich euch in den Weg!`);
    this.knoepfeZeigen(false);
    this.kampf.plaetze.forEach((platz, nummer) => {
      const seite = this.orte[nummer].seite === 'links' ? -1 : 1;
      this.auftreten(aktiver(platz), seite, nummer === this.meinPlatz ? 650 : 150 + nummer * 200);
    });
    this.time.delayedCall(1300, () => {
      if (abgesagt.has(this.auswahl.id)) this.abbrechen(`${this.partner} kann gerade doch nicht. Der Kampf ist aus.`);
      else this.wahlAnfangen();
    });
  }

  // Gegen wen man kämpft: beim Duell das Kalamprio der anderen, sonst das wilde.
  gegnerKaempfer() {
    const platz = this.kampf.plaetze.find((anderer) => anderer.seite !== this.kampf.plaetze[this.meinPlatz].seite);
    return aktiver(platz);
  }

  // ------------------------------------------------------------ Wählen

  wahlAnfangen() {
    if (this.vorbei) return;
    if (istRaus(this.kampf.plaetze[this.meinPlatz])) {
      this.knoepfeZeigen(false);
      this.sagen(`Dein Team kann nicht mehr kämpfen.\n${this.partner} kämpft weiter!`);
      this.rundeVersuchen();
      return;
    }
    this.sagen(`Was soll ${this.spieler.name} tun?`);
    this.knoepfeZeigen(true);
  }

  // Die Knöpfe aus KampfSzene rufen diese vier auf. Hier wird nur gewählt,
  // was passiert, zeigt sich, wenn beide gewählt haben.
  rundeSpielen(attacke) {
    this.waehlen({ art: 'attacke', nummer: this.spieler.attacken.indexOf(attacke) });
  }

  tauschen(neues) {
    this.waehlen({ art: 'tauschen', zu: this.team.indexOf(neues) });
  }

  essenBenutzen(sache) {
    this.waehlen({ art: 'essen', sache: sache.kurzname, imKampf: sache.imKampf });
  }

  fangVersuch() {
    this.waehlen({ art: 'fangen' });
  }

  waehlen(wahl) {
    this.knoepfeZeigen(false);
    const andere = istRaus(this.kampf.plaetze[this.ihrPlatz]) ? '' : `\nWarte auf ${this.partner} …`;
    this.sagen(`${this.spieler.name} ist bereit.${andere}`);
    if (this.leitung) {
      this.wahlen[this.meinPlatz] = wahl;
      this.rundeVersuchen();
    } else {
      senden('kampfWahl', { id: this.auswahl.id, wahl });
    }
  }

  // Nur bei 'a': Haben alle gewählt, wird die Runde ausgewürfelt und an das
  // andere Gerät geschickt.
  rundeVersuchen() {
    if (!this.leitung || this.spielt || this.vorbei || this.kampf.ende) return;
    const noetig = werWaehlt(this.kampf);
    if (noetig.length === 0) {
      const gewonnen = sieger(this.kampf);
      if (gewonnen) this.verteilen([{ art: 'ende', sieger: gewonnen }]);
      return;
    }
    if (!noetig.every((nummer) => this.wahlen[nummer])) return;
    const ereignisse = rundeAusrechnen(this.kampf, this.wahlen);
    this.wahlen = {};
    this.verteilen(ereignisse);
  }

  verteilen(ereignisse) {
    senden('kampfRunde', { id: this.auswahl.id, ereignisse });
    this.warteschlange.push(ereignisse);
    this.abspielen();
  }

  // Zeigt die Runden aus der Warteschlange nacheinander.
  async abspielen() {
    if (this.spielt || this.vorbei) return;
    this.spielt = true;
    while (this.warteschlange.length > 0 && !this.kampf.ende && !this.vorbei) {
      for (const ereignis of this.warteschlange.shift()) {
        if (this.vorbei) return;
        await this.ereignisZeigen(ereignis);
        if (this.kampf.ende) break;
      }
    }
    this.spielt = false;
    if (this.vorbei) return;
    if (this.kampf.ende) await this.kampfBeenden(this.kampf.ende);
    else this.wahlAnfangen();
  }

  // ------------------------------------------------------------ Zeigen

  istMeins(nummer) {
    return nummer === this.meinPlatz;
  }

  async ereignisZeigen(ereignis) {
    const platz = this.kampf.plaetze[ereignis.platz];
    switch (ereignis.art) {
      case 'angriff': {
        const angreifer = aktiver(this.kampf.plaetze[ereignis.von]);
        const verteidiger = aktiver(this.kampf.plaetze[ereignis.auf]);
        const kpVorher = verteidiger.kp;
        ereignisAnwenden(this.kampf, ereignis);
        await this.angriffAnimieren(angreifer, verteidiger, angreifer.attacken[ereignis.attacke], ereignis.ausgang, ereignis.schaden, kpVorher);
        return;
      }
      case 'umgefallen': {
        const kaempfer = aktiver(platz);
        this.sagen(`${kaempfer.name} kann nicht mehr kämpfen.`);
        // Beim Freundschaftskampf muss sich niemand erholen.
        if (this.istMeins(ereignis.platz) && !this.duell) spielstand.erschoepftBis[kaempfer.kurzname] = Date.now() + REGELN.erholungSekunden * 1000;
        await this.umfallenZeigen(kaempfer);
        return;
      }
      case 'einwechseln':
      case 'tauschen': {
        const altes = aktiver(platz);
        ereignisAnwenden(this.kampf, ereignis);
        const neues = aktiver(platz);
        this.sagen(ereignis.art === 'tauschen' ? `Komm zurück, ${altes.name}! Los, ${neues.name}!` : `Los, ${neues.name}! Du bist dran!`);
        await this.platzWechseln(ereignis.platz, altes, neues, ereignis.art === 'einwechseln');
        await this.warten(500);
        return;
      }
      case 'essen': {
        const kaempfer = aktiver(platz);
        const sache = allesEssen().find((rezept) => rezept.kurzname === ereignis.sache) ?? { name: 'etwas', bild: 'beutel', imKampf: ereignis.imKampf };
        if (this.istMeins(ereignis.platz)) herausnehmen(ereignis.sache);
        const geweckt = await this.essenZeigen(kaempfer, sache, () => ereignisAnwenden(this.kampf, ereignis));
        if (this.istMeins(ereignis.platz)) for (const wach of geweckt) delete spielstand.erschoepftBis[wach.kurzname];
        await this.warten(900);
        return;
      }
      case 'fangen':
        await this.fangenZeigen(ereignis);
        return;
      default:
        ereignisAnwenden(this.kampf, ereignis);
    }
  }

  // Auf einem Platz geht ein Kalamprio und ein anderes kommt. War das alte
  // umgefallen, ist es schon nicht mehr zu sehen.
  async platzWechseln(nummer, altes, neues, umgefallen) {
    const ort = this.orte[nummer];
    const weg = ort.seite === 'links' ? -200 : 200;
    const alt = this.anzeige.get(altes);
    if (alt) {
      this.tweens.killTweensOf([alt.bild, alt.schatten]);
      if (!umgefallen) {
        wusch(0.2);
        await this.bewegen({ targets: [alt.bild, alt.schatten], x: `+=${weg}`, alpha: 0, duration: 350, ease: 'Quad.easeIn' });
      }
      for (const teil of alt.teile) teil.destroy();
      this.anzeige.delete(altes);
    }
    this.aufstellen(neues, ort.seite, ort);
    const { bild, schatten } = this.anzeige.get(neues);
    for (const teil of [bild, schatten]) {
      this.tweens.add({ targets: teil, x: { from: teil.x + weg, to: teil.x }, alpha: { from: 0, to: teil.alpha }, duration: 400, ease: 'Back.easeOut' });
    }
    this.blitz(bild.x, bild.y - bild.displayHeight / 2, 0xd9c9ff);
    einwechseln();
    if (this.istMeins(nummer)) {
      this.spieler = neues;
      zuerstKaempfen(neues.kurzname); // nach dem Kampf ist es weiter vorne
      this.attackenKnoepfeBauen();
      this.knoepfeZeigen(false);
    }
    this.gegner = this.gegnerKaempfer();
    await this.warten(450);
  }

  // Jemand wirft einen Fangkristall auf das wilde Kalamprio.
  async fangenZeigen(ereignis) {
    const meins = this.istMeins(ereignis.platz);
    const werfer = this.anzeige.get(aktiver(this.kampf.plaetze[ereignis.platz])).bild;
    if (meins) spielstand.fangkristalle -= 1;
    this.sagen(meins ? 'Du wirfst einen Fangkristall!' : `${this.partner} wirft einen Fangkristall!`);
    const kristall = await this.fangZeigen(werfer, ereignis.wackler);
    if (!ereignis.gefangen) {
      await this.befreitZeigen(kristall);
      return;
    }
    this.gefangenFunkeln(kristall);
    const { gegner } = this;
    if (meins && !spielstand.team.includes(gegner.kurzname)) {
      spielstand.team.push(gegner.kurzname);
      mitnehmen(gegner.kurzname);
      spielstand.erfahrung[gegner.kurzname] = REGELN.erfahrungFuerLevel[Math.min(gegner.level, MAX_LEVEL) - 1];
      this.sagen(`Juhu! Du hast ${gegner.name} gefangen!\n${gegner.name} ist jetzt in deinem Team.`);
    } else {
      this.sagen(`${this.partner} hat ${gegner.name} gefangen!`);
    }
    await this.warten(1800);
  }

  // Fangkristalle gehen nur gegen wilde Kalamprios.
  sacheGeht(sache) {
    if (sache.kurzname !== 'fangkristall') return super.sacheGeht(sache);
    if (this.duell) return { geht: false, hinweis: 'Nur bei wilden Kalamprios' };
    if (spielstand.team.includes(this.gegner.kurzname)) return { geht: false, hinweis: 'Schon in deinem Team' };
    return { geht: true, hinweis: `Chance ${Math.round(fangChance(this.gegner) * 100)} von 100` };
  }

  // ------------------------------------------------------------ Ende

  async kampfBeenden(ende) {
    this.vorbei = true;
    this.knoepfeZeigen(false);
    const mein = this.kampf.plaetze[this.meinPlatz];
    const gewonnen = ende.sieger === mein.seite;
    if (ende.gefangenVon !== undefined) {
      this.weiterZeigen(true);
      return;
    }
    await this.warten(400);
    melodieSpielen(gewonnen ? 'sieg' : 'niederlage');

    // Wer gewonnen hat und noch steht, hüpft vor Freude.
    const gewinner = this.kampf.plaetze.filter((platz) => platz.seite === ende.sieger && !istRaus(platz));
    for (const platz of gewinner) if (this.anzeige.has(aktiver(platz))) this.jubeln(aktiver(platz));

    if (gewonnen && !istRaus(mein)) {
      this.sagen(this.duell ? `Du hast gewonnen!\n${this.spieler.name} freut sich.` : `Ihr habt gewonnen!\n${this.spieler.name} freut sich.`);
      await this.warten(1000);
      // Erfahrung gibt es für den Gegner, der zuletzt umgefallen ist.
      this.gegner = this.gegnerKaempfer();
      await this.erfahrungBekommen(this.spieler);
    } else if (gewonnen) {
      this.sagen(`Ihr habt gewonnen!\n${this.partner} hat es geschafft.`);
    } else if (this.duell) {
      this.sagen(`${this.partner} hat gewonnen!\nDas war ein toller Kampf.`);
    } else {
      this.sagen('Euer Team ist erschöpft.\nEs muss sich kurz erholen.');
    }
    this.weiterZeigen(gewonnen);
  }

  // Der Kampf hört mittendrin auf (zum Beispiel, weil die Verbindung weg ist).
  abbrechen(satz) {
    if (this.vorbei) return;
    this.vorbei = true;
    this.sagen(satz);
    this.weiterZeigen(false);
  }

  // Die Verbindung zur anderen ist abgerissen. Beim Duell und auf Gerät 'b'
  // ist der Kampf dann aus. Auf Gerät 'a' kämpft man gegen das wilde
  // Kalamprio allein weiter.
  partnerWeg() {
    if (this.vorbei) return;
    if (this.duell || !this.leitung) {
      this.abbrechen(`Die Verbindung zu ${this.partner} ist weg.\nDer Kampf ist aus.`);
      return;
    }
    const platz = this.kampf.plaetze[this.ihrPlatz];
    platz.weg = true;
    const teile = this.anzeige.get(aktiver(platz))?.teile ?? [];
    umfallen();
    this.tweens.add({ targets: teile, alpha: 0, duration: 600 });
    delete this.wahlen[this.ihrPlatz];
    if (!this.spielt) this.sagen(`${this.partner} ist weg. Du kämpfst allein weiter!`);
    // Wer schon gewählt hat, muss nicht noch einmal wählen.
    const schonGewaehlt = this.wahlen[this.meinPlatz] || istRaus(this.kampf.plaetze[this.meinPlatz]);
    if (!this.spielt) this.time.delayedCall(1200, () => (schonGewaehlt ? this.rundeVersuchen() : this.wahlAnfangen()));
  }
}
