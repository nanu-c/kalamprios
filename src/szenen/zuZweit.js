// Zu zweit spielen, in der Welt (WeltSzene.js). Hier steht:
//   - der Knopf „Zu zweit“ oben rechts (nur am Lagerfeuer) und was er
//     zeigt: einen Code zum Verbinden oder die Felder, um einen Code einzutippen.
//     Wer verbunden ist, sieht dort überall, mit wem und wo die andere ist.
//   - die Figur der anderen, wenn sie am selben Ort ist. Tippt man sie an,
//     kann man sie zum Kampf herausfordern oder mit ihr tauschen.
//   - der Kampf zu zweit gegen wilde Kalamprios: Steht die andere in der
//     Nähe, hilft sie mit
//   - das Freundschaftstor, durch das man nur zu zweit kommt
//   - das Lagerfeuer im Lila Dorf, der Treffpunkt: Nur dort kann man sich
//     verbinden oder die Verbindung trennen
// Die Verbindung selbst steht in zusammen/verbindung.js, was das Spiel sagt
// und wie nah man sein muss, in daten/zusammen.js.

import Phaser from 'phaser';
import { CHARAKTERE } from '../daten/charaktere.js';
import { KALAMPRIOS } from '../daten/kalamprios.js';
import { ORTE } from '../daten/orte.js';
import { REGELN } from '../daten/regeln.js';
import { ZUSAMMEN } from '../daten/zusammen.js';
import { levelAusErfahrung } from '../kampf/kampflogik.js';
import { kampfErstellen } from '../kampf/zusammenkampf.js';
import { klick, pling } from '../klang/geraeusche.js';
import { melodieSpielen } from '../klang/musik.js';
import { erholtSichNoch, levelVon, spielstand } from '../spielstand.js';
import { abstand, ankunft } from '../welt/weltlogik.js';
import { beitreten, hoeren, ichMelden, istVerbunden, senden, spielOeffnen, trennen, zuZweit } from '../zusammen/verbindung.js';
import { anbietbar, tauschen, tauschPasst, teamFuerZuZweit } from '../zusammen/zusammenlogik.js';
import { feld, textKnopf } from './bausteine.js';
import { BREITE, FARBEN, HOEHE, schrift } from './stil.js';

const VORNE = 100000; // wie in WeltSzene.js
const FIGUR_HOEHE = 150; // so groß wie die eigene Figur (WeltSzene.js)
const FRISCH = 4000; // so lange (Millisekunden) gilt, was die andere zuletzt gemeldet hat
const RING_FARBE = 0xff9ad5; // der Ring unter der Figur der anderen
const KNOPF = { x: BREITE - 18 - 230, y: 86, breite: 230, hoehe: 46 };
const AM_FEUER = 130; // so nah am Lagerfeuer zählt man als dort
const S = ZUSAMMEN.saetze;

// Wo man vor dem Freundschaftstor steht (der Tür mit zuZweit an diesem Ort).
export function vorDemTor(ortName) {
  const ort = ORTE[ortName];
  const tor = (ort.tueren ?? []).find((tuer) => tuer.zuZweit);
  return tor ? ankunft(ort, tor.nach) : ankunft(ort, null);
}

// Die andere, wenn man verbunden ist und sie sich vor Kurzem gemeldet hat.
export function partnerDa() {
  const partner = zuZweit.partner;
  if (!istVerbunden() || !partner || Date.now() - partner.zeit > FRISCH) return null;
  return partner;
}

const mitName = (satz, name) => satz.replaceAll('{name}', name ?? 'die andere');

// Jede Verbindung wird nur einmal begrüßt.
let begruesst = false;
hoeren('verbunden', () => {
  begruesst = false;
});

// Woran beide Geräte eine Frage oder einen Kampf erkennen
function neueId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// Wer aus dem eigenen Kampfteam in einen Kampf zu zweit mitkommt.
function meinTeam() {
  return teamFuerZuZweit(spielstand, erholtSichNoch, ZUSAMMEN.zuZweitImKampf);
}

export class ZuZweit {
  constructor(szene) {
    this.szene = szene;
    this.figur = null; // die Figur der anderen, wenn sie am selben Ort ist
    this.frage = null; // { art, id }: was man die andere gerade fragt
    this.gefragt = null; // die id der Frage, die die andere einem gerade stellt
    this.zugesagt = null; // die id des Freundschaftskampfs, zu dem man Ja gesagt hat
    this.hilfe = null; // wenn man die andere gerade um Hilfe im Kampf bittet
    this.tausch = null; // solange getauscht wird
    this.panel = null; // die Teile des Fensters vom Knopf „Zu zweit“
    this.code = []; // die Kalamprios, die man beim Code schon angetippt hat
    this.knopfStand = '';
    this.warAmFeuer = this.amFeuer();

    this.knopfBauen();
    const aufhoeren = [
      hoeren('zustand', () => this.zustandGeaendert()),
      hoeren('getrennt', ({ name }) => this.getrennt(name)),
      hoeren('hier', () => this.gemeldet()),
      hoeren('frage', (nachricht) => this.wirdGefragt(nachricht)),
      hoeren('frageWeg', ({ id }) => this.frageZurueck(id)),
      hoeren('antwort', (nachricht) => this.antwortKommt(nachricht)),
      hoeren('kampfStart', (nachricht) => this.kampfStart(nachricht)),
      hoeren('kampfDa', ({ id }) => this.hilfeAntwort(id, true)),
      hoeren('kampfAbsage', ({ id }) => this.hilfeAntwort(id, false)),
      hoeren('tauschAngebot', (nachricht) => this.tauschAngebot(nachricht)),
      hoeren('tauschBereit', (nachricht) => this.tauschBereit(nachricht)),
      hoeren('tauschJetzt', (nachricht) => this.tauschJetzt(nachricht)),
      hoeren('tauschEnde', () => this.tauschAbgebrochen()),
    ];
    szene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => aufhoeren.forEach((ab) => ab()));
  }

  get name() {
    return partnerDa()?.name ?? zuZweit.partner?.name ?? 'die andere';
  }

  // Ist man gerade frei für eine Frage oder einen Kampf zu zweit?
  frei() {
    return !this.szene.gespraech && !this.szene.wechselt;
  }

  // ------------------------------------------------------- Jeden Augenblick

  update(zeit, sekunden) {
    const szene = this.szene;
    ichMelden({
      ort: szene.ortName,
      x: Math.round(szene.spieler.ort.x),
      y: Math.round(szene.spieler.ort.y),
      laeuft: szene.spieler.laeuft,
      charakter: spielstand.charakter,
      name: CHARAKTERE[spielstand.charakter].name,
      frei: this.frei(),
      kampfbereit: szene.kampfbereit(),
      team: spielstand.team,
      kampfteam: meinTeam(),
    });

    const partner = partnerDa();
    const hier = partner && partner.ort === szene.ortName && CHARAKTERE[partner.charakter] ? partner : null;
    if (this.figur && (!hier || this.figur.charakter !== hier.charakter)) this.figurWeg();
    if (hier && !this.figur) this.figurBauen(hier);
    if (this.figur) this.figurBewegen(hier, zeit, sekunden);
    this.knopfZeigen(partner);
    this.feuerPruefen(partner);
  }

  // Das Lagerfeuer an diesem Ort, wenn es eins gibt (lagerfeuer beim Ort)
  amFeuer() {
    const feuer = this.szene.ort.lagerfeuer;
    return Boolean(feuer) && abstand(this.szene.spieler.ort, feuer) < AM_FEUER;
  }

  // Wer ans Lagerfeuer kommt und noch nicht verbunden ist, sieht gleich das
  // Fenster zum Verbinden. Wer verbunden ist, wartet hier auf die andere.
  feuerPruefen(partner) {
    const da = this.amFeuer();
    const neu = da && !this.warAmFeuer;
    this.warAmFeuer = da;
    if (!neu || !this.frei()) return;
    if (zuZweit.zustand === 'aus') this.fensterZeigen();
    else if (partner && partner.ort !== this.szene.ortName) this.nachricht(mitName(S.amFeuer, partner.name));
  }

  figurBauen(partner) {
    const szene = this.szene;
    const figur = szene.figurBauen(`charakter-${partner.charakter}`, FIGUR_HOEHE, partner, szene.unterWasser);
    figur.charakter = partner.charakter;
    figur.ring = szene.add.ellipse(partner.x, partner.y, 96, 30).setStrokeStyle(4, RING_FARBE, 0.9).setDepth(1);
    szene.tweens.add({ targets: figur.ring, alpha: 0.45, scale: 1.12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    figur.schild = szene.add
      .text(partner.x, partner.y - FIGUR_HOEHE - 18, partner.name, schrift(20, '#ffd6f0', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 5);
    figur.bild.setInteractive({ useHandCursor: true });
    figur.bild.on('pointerdown', () => this.angetippt());
    this.figur = figur;
  }

  figurWeg() {
    const { bild, schatten, ring, schild } = this.figur;
    for (const teil of [bild, schatten, ring, schild]) teil.destroy();
    this.figur = null;
  }

  // Die Figur gleitet dorthin, wo die andere zuletzt war. Ist sie weit weg
  // (zum Beispiel gerade angekommen), springt sie gleich hin.
  figurBewegen(partner, zeit, sekunden) {
    const figur = this.figur;
    const dx = partner.x - figur.ort.x;
    const dy = partner.y - figur.ort.y;
    const weit = Math.hypot(dx, dy);
    if (weit > 400) figur.ort = { x: partner.x, y: partner.y };
    else {
      const anteil = Math.min(1, sekunden * 12);
      figur.ort = { x: figur.ort.x + dx * anteil, y: figur.ort.y + dy * anteil };
    }
    figur.laeuft = partner.laeuft || weit > 6;
    this.szene.figurZeigen(figur, zeit);
    figur.schild.setPosition(figur.ort.x, figur.ort.y - FIGUR_HOEHE - 18).setDepth(figur.ort.y + 1);
  }

  // ------------------------------------------------------- Knopf und Fenster

  knopfBauen() {
    const szene = this.szene;
    const { x, y, breite, hoehe } = KNOPF;
    const flaeche = szene.add.rectangle(x, y, breite, hoehe, FARBEN.knopf).setOrigin(0).setRounded(14).setStrokeStyle(3, FARBEN.rand).setInteractive({ useHandCursor: true });
    flaeche.on('pointerdown', () => {
      klick();
      this.fensterZeigen();
    });
    this.knopfFlaeche = flaeche;
    this.punkt = szene.add.circle(x + 22, y + hoehe / 2, 7, 0x7be08a);
    this.knopfText = szene.add.text(x + breite / 2 + 8, y + hoehe / 2, '', schrift(20)).setOrigin(0.5);
    this.woText = szene.add.text(x + breite / 2, y + hoehe + 18, '', schrift(17, '#f6f0ff')).setOrigin(0.5).setStroke('#170b2c', 5);
    szene.festkleben([flaeche, this.punkt, this.knopfText, this.woText], VORNE);
  }

  // Den Knopf gibt es nur am Lagerfeuer. Wer verbunden ist, sieht überall
  // oben rechts, mit wem und wo die andere gerade ist.
  knopfZeigen(partner) {
    const zustand = zuZweit.zustand;
    const amFeuer = this.amFeuer() || this.fensterOffen();
    let text = 'Zu zweit';
    if (zustand === 'verbunden') text = partner ? `Mit ${partner.name}` : 'Verbunden';
    if (zustand === 'wartet') text = 'Wartet …';
    if (zustand === 'verbindet') text = 'Verbinde …';
    let wo = '';
    if (zustand === 'verbunden' && partner) {
      wo = partner.ort === this.szene.ortName ? `Mit ${partner.name}` : `${partner.name}: ${ORTE[partner.ort]?.name ?? '?'}`;
      if (amFeuer && partner.ort === this.szene.ortName) wo = '';
    }
    const stand = `${zustand}|${text}|${wo}|${amFeuer}`;
    if (stand === this.knopfStand) return;
    this.knopfStand = stand;
    this.knopfText.setText(text).setVisible(amFeuer);
    this.knopfFlaeche.setVisible(amFeuer);
    if (amFeuer) this.knopfFlaeche.setInteractive({ useHandCursor: true });
    else this.knopfFlaeche.disableInteractive();
    this.punkt.setVisible(amFeuer && (zustand === 'verbunden' || zustand === 'wartet'));
    this.punkt.setFillStyle(zustand === 'verbunden' ? 0x7be08a : 0xffd166);
    // Ohne Knopf rückt die Zeile hoch an seinen Platz.
    this.woText.setText(wo).setY(amFeuer ? KNOPF.y + KNOPF.hoehe + 18 : KNOPF.y + 16);
  }


  fensterOffen() {
    return Boolean(this.panel) && this.szene.gespraech === this.panel;
  }

  // Das Fenster vom Knopf „Zu zweit“. Was es zeigt, hängt davon ab, ob man
  // verbunden ist. ansicht 'eingeben': die Felder, um einen Code einzutippen.
  fensterZeigen(ansicht = null) {
    const szene = this.szene;
    if (szene.wechselt || (szene.gespraech && !this.fensterOffen())) return;
    szene.gespraechSchliessen();
    szene.laufziel = null;
    szene.zeigerFuehrt = false;
    this.ansicht = ansicht;

    const teile = [
      szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(szene, 160, 50, BREITE - 320, 620),
      szene.add.text(BREITE / 2, 96, 'Zu zweit spielen', schrift(38, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
    ];
    const text = (y, inhalt, farbe = '#d9c9ff', groesse = 22) =>
      teile.push(szene.add.text(BREITE / 2, y, inhalt, schrift(groesse, farbe, { align: 'center', wordWrap: { width: 860 }, lineSpacing: 6 })).setOrigin(0.5, 0));
    const knopf = (x, y, breite, beschriftung, beimKlick) => teile.push(...textKnopf(szene, x, y, breite, 60, beschriftung, beimKlick));
    const schliessen = () => {
      this.panel = null;
      szene.gespraechSchliessen();
    };
    const unten = 580;

    const zustand = ansicht ?? zuZweit.zustand;
    if (zustand === 'aus') {
      text(150, 'Spielt zusammen auf zwei Geräten! Eine öffnet ein Spiel und bekommt einen Code aus vier Kalamprios. Die andere tippt diesen Code auf ihrem Gerät ein. Danach trefft ihr euch am Lagerfeuer im Lila Dorf.');
      text(262, 'Jede spielt mit ihrem eigenen Spielstand. Ihr seht euch in der Welt, könnt gegeneinander kämpfen, zusammen gegen wilde Kalamprios kämpfen und tauschen.');
      if (zuZweit.fehler) text(390, zuZweit.fehler, '#ffd166');
      knopf(BREITE / 2 - 330, 460, 310, 'Spiel öffnen', () => spielOeffnen());
      knopf(BREITE / 2 + 20, 460, 310, 'Code eingeben', () => {
        this.code = [];
        this.fensterZeigen('eingeben');
      });
      knopf(BREITE / 2 - 120, unten, 240, 'Zurück', schliessen);
    } else if (zustand === 'wartet') {
      text(150, 'Dein Code:', '#f6f0ff', 26);
      teile.push(...this.codeZeigen(zuZweit.code ?? [], 280, 130));
      text(380, 'Auf dem anderen Gerät geht man auch zum Lagerfeuer, tippt oben rechts auf „Zu zweit“, dann auf „Code eingeben“, und dann diese vier Kalamprios der Reihe nach.');
      knopf(BREITE / 2 - 330, unten, 310, 'Schließen', schliessen);
      knopf(BREITE / 2 + 20, unten, 310, 'Aufhören', () => trennen());
    } else if (zustand === 'eingeben') {
      text(140, 'Tippe die vier Kalamprios vom anderen Gerät der Reihe nach an:');
      teile.push(...this.codeZeigen(this.code, 245, 100, true));
      ZUSAMMEN.codeBilder.forEach((kurzname, nummer) => {
        const spalte = nummer % 4;
        const reihe = Math.floor(nummer / 4);
        const x = BREITE / 2 + (spalte - 1.5) * 140;
        const y = 360 + reihe * 100;
        const karte = szene.add.rectangle(x, y, 124, 88, FARBEN.knopf).setRounded(14).setStrokeStyle(3, FARBEN.rand).setInteractive({ useHandCursor: true });
        karte.on('pointerdown', () => {
          klick();
          if (this.code.length >= ZUSAMMEN.codeLaenge) return;
          this.code.push(nummer);
          if (this.code.length === ZUSAMMEN.codeLaenge) beitreten([...this.code]);
          else this.fensterZeigen('eingeben');
        });
        teile.push(karte, this.kalamprioBild(kurzname, x, y + 38, 74, 104));
      });
      knopf(BREITE / 2 - 390, unten, 240, 'Zurück', () => this.fensterZeigen('aus'));
      knopf(BREITE / 2 + 150, unten, 240, '← Löschen', () => {
        this.code.pop();
        this.fensterZeigen('eingeben');
      });
    } else if (zustand === 'verbindet') {
      text(160, 'Verbinde …', '#f6f0ff', 30);
      teile.push(...this.codeZeigen(zuZweit.code ?? [], 300, 110));
      knopf(BREITE / 2 - 120, unten, 240, 'Abbrechen', () => trennen());
    } else {
      const partner = partnerDa();
      text(150, partner ? `Du spielst mit ${partner.name} zusammen.` : 'Verbunden!', '#f6f0ff', 30);
      if (partner) text(205, mitName(S.woanders, partner.name).replace('{ort}', ORTE[partner.ort]?.name ?? '?'));
      text(
        275,
        'Trefft euch am Lagerfeuer im Lila Dorf! Tippt dort die andere Figur an: Dann könnt ihr gegeneinander kämpfen oder Kalamprios tauschen. Trefft ihr zusammen auf ein wildes Kalamprio, kämpft ihr zu zweit. Und gleich neben dem Feuer steht das Freundschaftstor …',
      );
      knopf(BREITE / 2 - 330, unten, 310, 'Fertig', schliessen);
      knopf(BREITE / 2 + 20, unten, 310, 'Trennen', () => trennen());
    }
    szene.festkleben(teile, VORNE + 100);
    szene.gespraech = teile;
    this.panel = teile;
  }

  // Ein Kalamprio-Bild, das in ein Kästchen passt (Fuß bei y).
  kalamprioBild(kurzname, x, y, hoehe, breite) {
    const bild = this.szene.add.image(x, y, `${kurzname}-klein`).setOrigin(0.5, 1);
    bild.setScale(Math.min(hoehe / bild.height, breite / bild.width));
    return bild;
  }

  // Der Code als Reihe von Kalamprio-Bildern. leer: Für noch fehlende
  // Kalamprios gibt es ein leeres Kästchen.
  codeZeigen(code, y, groesse, leer = false) {
    const szene = this.szene;
    const teile = [];
    const anzahl = leer ? ZUSAMMEN.codeLaenge : code.length;
    for (let i = 0; i < anzahl; i += 1) {
      const x = BREITE / 2 + (i - (anzahl - 1) / 2) * (groesse + 24);
      teile.push(szene.add.rectangle(x, y, groesse, groesse, 0x170b2c, 0.6).setRounded(16).setStrokeStyle(3, code[i] === undefined ? FARBEN.rand : 0xffd166));
      if (code[i] !== undefined) teile.push(this.kalamprioBild(ZUSAMMEN.codeBilder[code[i]], x, y + groesse / 2 - 8, groesse - 22, groesse - 16));
    }
    return teile;
  }

  zustandGeaendert() {
    if (!this.fensterOffen()) return;
    // Wer sich beim Code vertippt hat, sieht den Hinweis und kann es nochmal versuchen.
    this.fensterZeigen(zuZweit.zustand === 'aus' && this.ansicht === 'eingeben' && !zuZweit.fehler ? 'eingeben' : null);
  }

  // Die andere hat sich gemeldet. Beim ersten Mal sagt das Spiel Hallo.
  gemeldet() {
    if (begruesst || !zuZweit.partner) return;
    begruesst = true;
    melodieSpielen('gefangen');
    this.nachricht(mitName(S.verbunden, zuZweit.partner.name));
    if (this.fensterOffen()) this.fensterZeigen();
  }

  // Eine kurze Nachricht oben auf dem Bildschirm, die nach ein paar Sekunden verschwindet.
  nachricht(text) {
    const szene = this.szene;
    const schild = szene.add
      .text(BREITE / 2, 170, text, schrift(28, '#f6f0ff', { fontStyle: '600', align: 'center', wordWrap: { width: 900 } }))
      .setOrigin(0.5)
      .setStroke('#2a1650', 8);
    szene.festkleben([schild], VORNE + 60);
    szene.tweens.add({ targets: schild, alpha: 0, delay: 3000, duration: 700, onComplete: () => schild.destroy() });
  }

  getrennt(name) {
    const szene = this.szene;
    this.frage = null;
    this.gefragt = null;
    this.zugesagt = null;
    if (this.tausch) {
      this.tausch = null;
      szene.gespraechSchliessen();
    }
    if (this.fensterOffen()) this.fensterZeigen();
    this.nachricht(mitName(S.getrennt, name));
    // Hinter dem Freundschaftstor kann man allein nicht bleiben.
    if (szene.ort.nurZuZweit && !szene.wechselt) {
      szene.gespraechSchliessen();
      const zurueck = szene.ort.zurueckNach;
      szene.saetzeNacheinander([mitName(S.alleinZurueck, name)], () => szene.ortWechseln(zurueck, vorDemTor(zurueck)), 'Okay');
    }
  }

  // ---------------------------------------------------- Fragen und Antworten

  // Man tippt die Figur der anderen an.
  angetippt() {
    const szene = this.szene;
    const partner = partnerDa();
    if (!partner || !this.frei()) return;
    if (abstand(szene.spieler.ort, partner) > ZUSAMMEN.nahGenug) {
      szene.saetzeNacheinander([`Geh näher zu ${partner.name}, dann könnt ihr kämpfen oder tauschen.`], null, 'Okay');
      return;
    }
    szene.gespraechZeigen(`Was möchtest du mit ${partner.name} machen?`, [
      ['Kämpfen', () => this.fragen('duell')],
      ['Tauschen', () => this.fragen('tausch')],
      ['Nichts', () => szene.gespraechSchliessen()],
    ]);
  }

  fragen(art) {
    const szene = this.szene;
    szene.gespraechSchliessen();
    const partner = partnerDa();
    if (!partner) return;
    const sagen = (satz) => szene.saetzeNacheinander([mitName(satz, partner.name)], null, 'Okay');
    if (art === 'duell' && meinTeam().length === 0) return sagen(S.keinKalamprio);
    if (art === 'duell' && !(partner.kampfteam?.length > 0)) return sagen(S.erKeinKalamprio);
    if (art === 'tausch' && spielstand.team.length === 0) return sagen('Du hast noch kein Kalamprio zum Tauschen.');
    if (art === 'tausch' && anbietbar(spielstand.team, partner.team ?? []).length === 0 && anbietbar(partner.team ?? [], spielstand.team).length === 0) {
      return sagen(S.nichtsZuTauschen);
    }
    const id = neueId();
    this.frage = { art, id };
    senden('frage', { art, id });
    szene.gespraechZeigen(`Du fragst ${partner.name} …`, [
      [
        'Abbrechen',
        () => {
          this.frage = null;
          senden('frageWeg', { id });
          szene.gespraechSchliessen();
        },
      ],
    ]);
    return undefined;
  }

  // Die andere fragt einen etwas. Wer gerade beschäftigt ist, sagt automatisch ab.
  wirdGefragt({ art, id }) {
    const szene = this.szene;
    if (!this.frei()) {
      senden('antwort', { art, id, ja: false, beschaeftigt: true });
      return;
    }
    this.gefragt = id;
    const antworten = (ja) => {
      this.gefragt = null;
      szene.gespraechSchliessen();
      if (ja && art === 'duell') this.zugesagt = id;
      senden('antwort', { art, id, ja });
      if (ja && art === 'tausch') this.tauschOeffnen(false);
    };
    szene.gespraechZeigen(mitName(art === 'duell' ? S.herausfordern : S.tauschen, this.name), [
      ['Ja!', () => antworten(true)],
      ['Nein', () => antworten(false)],
    ]);
  }

  // Die andere hat ihre Frage zurückgenommen.
  frageZurueck(id) {
    if (this.gefragt !== id) return;
    this.gefragt = null;
    this.szene.gespraechSchliessen();
  }

  antwortKommt({ art, id, ja, beschaeftigt }) {
    const szene = this.szene;
    if (this.frage?.id !== id) return;
    this.frage = null;
    szene.gespraechSchliessen();
    if (!ja) {
      szene.saetzeNacheinander([mitName(beschaeftigt ? S.beschaeftigt : S.nein, this.name)], null, 'Okay');
      return;
    }
    if (art === 'tausch') this.tauschOeffnen(true);
    else this.duellAnfangen(id);
  }

  // ------------------------------------------------------------- Kämpfe

  // Die andere hat Ja gesagt: Der Freundschaftskampf geht los. Wer gefragt
  // hat, ist Gerät 'a' und würfelt aus (zusammenkampf.js).
  duellAnfangen(id) {
    const partner = partnerDa();
    if (!partner || !(partner.kampfteam?.length > 0) || meinTeam().length === 0) return;
    const kampf = kampfErstellen({ art: 'duell', teamA: meinTeam(), teamB: partner.kampfteam });
    senden('kampfStart', { id, art: 'duell', kampf });
    this.szene.zuZweitKaempfen({ kampf, ich: 'a', id, partner: partner.name });
  }

  // Ein wildes Kalamprio! Steht die andere in der Nähe und ist frei, wird sie
  // gefragt, ob sie mitkämpft. Zurück kommt null (allein kämpfen) oder ein
  // Versprechen: Es liefert, was der Kampf zu zweit braucht, oder null, wenn
  // die andere doch nicht kann.
  hilfeHolen({ gegner, gegnerLevel, merkname }) {
    const szene = this.szene;
    const partner = partnerDa();
    const mein = meinTeam();
    const nah = partner && partner.ort === szene.ortName && abstand(szene.spieler.ort, partner) < ZUSAMMEN.nahGenug * 2;
    if (!nah || !partner.frei || !partner.kampfbereit || !(partner.kampfteam?.length > 0) || mein.length === 0) return null;
    const id = neueId();
    const kampf = kampfErstellen({
      art: 'zusammen',
      teamA: mein,
      teamB: partner.kampfteam,
      gegner: { kurzname: gegner, level: gegnerLevel },
      wildStaerker: ZUSAMMEN.wildeZuZweit,
    });
    senden('kampfStart', { id, art: 'zusammen', kampf, merkname });
    return new Promise((fertig) => {
      this.hilfe = {
        id,
        fertig: (ja) => {
          this.hilfe = null;
          fertig(ja ? { kampf, ich: 'a', id, partner: partner.name } : null);
        },
      };
      szene.time.delayedCall(2500, () => {
        if (this.hilfe?.id !== id) return;
        senden('kampfAus', { id });
        this.hilfe.fertig(false);
      });
    });
  }

  hilfeAntwort(id, ja) {
    if (this.hilfe?.id === id) this.hilfe.fertig(ja);
    // Zu spät: Man kämpft schon allein.
    else if (ja) senden('kampfAus', { id });
  }

  // Die andere hat einen Kampf zu zweit angefangen.
  kampfStart({ id, art, kampf, merkname }) {
    const szene = this.szene;
    const name = this.name;
    if (art === 'duell') {
      if (this.zugesagt !== id || szene.wechselt) {
        senden('kampfAus', { id });
        return;
      }
      this.zugesagt = null;
      szene.gespraechSchliessen();
      szene.zuZweitKaempfen({ kampf, ich: 'b', id, partner: name });
      return;
    }
    if (!this.frei() || !szene.kampfbereit() || !(kampf?.plaetze?.[1]?.team?.length > 0)) {
      senden('kampfAbsage', { id });
      return;
    }
    senden('kampfDa', { id });
    szene.zuZweitKaempfen({
      kampf,
      ich: 'b',
      id,
      partner: name,
      nachKampf: (gewonnen) => {
        // Das besiegte wilde Kalamprio ist auch hier eine Weile verschwunden.
        if (gewonnen && merkname) spielstand.wildeWiederDa[merkname] = Date.now() + REGELN.wildeKommenWiederSekunden * 1000;
      },
    });
  }

  // ------------------------------------------------------------- Tauschen

  tauschOeffnen(frager) {
    this.tausch = { frager, meins: null, ihrs: null, ihreErfahrung: 0, ichBereit: false, sieBereit: false };
    this.tauschZeigen();
  }

  // Links stehen die eigenen Kalamprios, die man anbieten kann, rechts steht,
  // was die andere anbietet. Wenn beide auf „Tauschen!“ getippt haben, wird getauscht.
  tauschZeigen() {
    const szene = this.szene;
    const tausch = this.tausch;
    const partner = partnerDa();
    if (!tausch) return;
    if (!partner) {
      this.tausch = null;
      szene.gespraechSchliessen();
      return;
    }
    szene.gespraechSchliessen();
    szene.laufziel = null;
    szene.zeigerFuehrt = false;
    const name = partner.name;
    const teile = [
      szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(szene, 60, 36, BREITE - 120, 652),
      szene.add.text(BREITE / 2, 78, `Tauschen mit ${name}`, schrift(38, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
      szene.add.text(380, 130, 'Du gibst:', schrift(24, '#d9c9ff')).setOrigin(0.5),
      szene.add.text(970, 130, 'Du bekommst:', schrift(24, '#d9c9ff')).setOrigin(0.5),
    ];

    // Links: die eigenen Kalamprios, die die andere noch nicht hat
    const meine = anbietbar(spielstand.team, partner.team ?? []);
    if (meine.length === 0) {
      teile.push(szene.add.text(380, 330, `Du hast kein Kalamprio, das ${name} noch nicht hat.`, schrift(22, '#ffd166', { align: 'center', wordWrap: { width: 480 } })).setOrigin(0.5));
    }
    const proReihe = 5;
    const reihen = Math.max(1, Math.ceil(meine.length / proReihe));
    const hoehe = Math.min(140, (420 - (reihen - 1) * 10) / reihen);
    meine.forEach((kurzname, nummer) => {
      const x = 140 + (nummer % proReihe) * 120;
      const y = 165 + Math.floor(nummer / proReihe) * (hoehe + 10) + hoehe / 2;
      const gewaehlt = tausch.meins === kurzname;
      const karte = szene.add
        .rectangle(x, y, 110, hoehe, FARBEN.knopf)
        .setRounded(14)
        .setStrokeStyle(gewaehlt ? 5 : 3, gewaehlt ? 0xffd166 : FARBEN.rand)
        .setInteractive({ useHandCursor: true });
      karte.on('pointerdown', () => {
        klick();
        tausch.meins = kurzname;
        tausch.ichBereit = false;
        tausch.sieBereit = false;
        senden('tauschAngebot', { kurzname, erfahrung: spielstand.erfahrung[kurzname] ?? 0 });
        this.tauschZeigen();
      });
      teile.push(
        karte,
        this.kalamprioBild(kurzname, x, y + hoehe / 2 - 24, hoehe - 40, 96),
        szene.add.text(x, y + hoehe / 2 - 12, `${KALAMPRIOS[kurzname].name} · Lv ${levelVon(kurzname)}`, schrift(13)).setOrigin(0.5),
      );
    });

    // Rechts: was die andere anbietet
    teile.push(szene.add.rectangle(970, 350, 340, 380, 0x170b2c, 0.5).setRounded(18).setStrokeStyle(3, tausch.ihrs ? 0xffd166 : FARBEN.rand));
    if (tausch.ihrs && KALAMPRIOS[tausch.ihrs]) {
      teile.push(
        this.kalamprioBild(tausch.ihrs, 970, 440, 240, 300),
        szene.add.text(970, 480, KALAMPRIOS[tausch.ihrs].name, schrift(28)).setOrigin(0.5),
        szene.add.text(970, 515, `Level ${levelAusErfahrung(tausch.ihreErfahrung ?? 0)}`, schrift(20, '#ffd166')).setOrigin(0.5),
      );
    } else {
      teile.push(szene.add.text(970, 350, `${name} sucht noch aus …`, schrift(24, '#d9c9ff')).setOrigin(0.5));
    }

    let status = 'Tippe links an, wen du gibst.';
    if (tausch.meins && !tausch.ihrs) status = `Warte, bis ${name} etwas aussucht.`;
    if (tausch.meins && tausch.ihrs) status = tausch.ichBereit ? `Warte, bis ${name} auch auf „Tauschen!“ tippt.` : 'Einverstanden? Dann tippe auf „Tauschen!“';
    if (tausch.sieBereit && !tausch.ichBereit) status = `${name} ist einverstanden!`;
    teile.push(szene.add.text(BREITE / 2, 572, status, schrift(22, '#ffd166')).setOrigin(0.5));

    const kannTauschen = tauschPasst(spielstand.team, partner.team ?? [], tausch.meins, tausch.ihrs);
    if (kannTauschen && !tausch.ichBereit) {
      teile.push(
        ...textKnopf(szene, BREITE / 2 + 20, 610, 280, 58, 'Tauschen!', () => {
          tausch.ichBereit = true;
          senden('tauschBereit', { bereit: true, meins: tausch.meins, ihrs: tausch.ihrs });
          this.tauschPruefen();
          if (this.tausch) this.tauschZeigen();
        }),
      );
    }
    teile.push(
      ...textKnopf(szene, BREITE / 2 - 300, 610, 280, 58, 'Abbrechen', () => {
        senden('tauschEnde');
        this.tausch = null;
        szene.gespraechSchliessen();
      }),
    );
    szene.festkleben(teile, VORNE + 100);
    szene.gespraech = teile;
  }

  tauschAngebot({ kurzname, erfahrung }) {
    const tausch = this.tausch;
    if (!tausch || !KALAMPRIOS[kurzname]) return;
    tausch.ihrs = kurzname;
    tausch.ihreErfahrung = erfahrung;
    // Hat sich das Angebot geändert, muss man sich neu entscheiden.
    tausch.ichBereit = false;
    tausch.sieBereit = false;
    this.tauschZeigen();
  }

  tauschBereit({ bereit, meins, ihrs }) {
    const tausch = this.tausch;
    if (!tausch) return;
    // Nur wenn sie dasselbe meint: ihr Angebot ist meins von ihr aus gesehen.
    tausch.sieBereit = bereit && meins === tausch.ihrs && ihrs === tausch.meins;
    this.tauschPruefen();
    if (this.tausch) this.tauschZeigen();
  }

  // Sind beide einverstanden, tauscht das Gerät, das gefragt hat, und sagt
  // es dem anderen.
  tauschPruefen() {
    const tausch = this.tausch;
    const partner = partnerDa();
    if (!tausch?.frager || !tausch.ichBereit || !tausch.sieBereit || !partner) return;
    if (!tauschPasst(spielstand.team, partner.team ?? [], tausch.meins, tausch.ihrs)) return;
    senden('tauschJetzt', { gibt: tausch.meins, bekommt: tausch.ihrs, erfahrung: spielstand.erfahrung[tausch.meins] ?? 0 });
    this.getauscht(tausch.meins, tausch.ihrs, tausch.ihreErfahrung);
  }

  // Von der anderen aus gesehen: Sie gibt, was man bekommt.
  tauschJetzt({ gibt, bekommt, erfahrung }) {
    const tausch = this.tausch;
    if (!tausch || bekommt !== tausch.meins || gibt !== tausch.ihrs) return;
    this.getauscht(tausch.meins, gibt, erfahrung);
  }

  getauscht(gibt, bekommt, erfahrung) {
    const szene = this.szene;
    tauschen(spielstand, gibt, bekommt, erfahrung);
    this.tausch = null;
    szene.gespraechSchliessen();
    melodieSpielen('gefangen');
    pling(1.5);
    szene.saetzeNacheinander([S.tauschFertig.replace('{neu}', KALAMPRIOS[bekommt].name)], null, 'Juhu!');
  }

  tauschAbgebrochen() {
    if (!this.tausch) return;
    this.tausch = null;
    this.szene.gespraechSchliessen();
    this.szene.saetzeNacheinander([`${this.name} hat das Tauschen beendet.`], null, 'Okay');
  }

  // ------------------------------------------------------- Freundschaftstor

  // Durch ein Tor mit zuZweit kommt man nur, wenn die andere mit davorsteht
  // oder schon auf der anderen Seite ist. Zurück kommt { geht, satz }.
  durchsTor(tuer) {
    const partner = partnerDa();
    if (!partner) return { geht: false, satz: S.nurZuZweit };
    if (partner.ort === tuer.nach) return { geht: true };
    if (partner.ort === this.szene.ortName && abstand(partner, tuer) < ZUSAMMEN.nahGenug + 60) return { geht: true };
    return { geht: false, satz: mitName(S.holDieAndere, partner.name) };
  }
}
