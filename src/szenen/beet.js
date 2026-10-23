// Das Gartenbeet im Lila Dorf und das Saatgut, das überall herumliegt.
// Wie das Beet wächst, rechnet welt/beetlogik.js aus, was man einstellen
// kann, steht in daten/beet.js. Wo das Beet liegt, steht bei beet in
// daten/orte/lilaDorf.js, wo Saatgut liegt, bei saatgut in der Datei des Ortes.

import Phaser from 'phaser';
import { anzahl, einpacken, herausnehmen } from '../beutel.js';
import { BEET } from '../daten/beet.js';
import { REGELN } from '../daten/regeln.js';
import { plopp, rascheln } from '../klang/geraeusche.js';
import { spielstand } from '../spielstand.js';
import { beetPlaetze, beetWachsen, freierBeetPlatz } from '../welt/beetlogik.js';
import { abstand } from '../welt/weltlogik.js';
import { feld, textKnopf } from './bausteine.js';
import { lichtschein } from './landschaft.js';
import { nachtblumeMalen } from './nachtblumen.js';
import { farbeAlsCss, STRICH, wuerfel } from './raetsel.js';
import { BREITE, FARBEN, HOEHE, schrift } from './stil.js';

const VORNE = 100000; // wie in WeltSzene.js
const AUFSAMMELN = 46;
const NACHSEHEN = 2000; // so oft (Millisekunden) wird nachgesehen, was gewachsen ist

// ------------------------------------------------------------ Malen

// Ein kleines Saatgut-Tütchen aus Papier, mit einem farbigen Bild darauf.
export function samenBildMalen(szene, art) {
  const name = `samen-${art}`;
  if (szene.textures.exists(name)) return name;
  const farbe = BEET.samen[art].farbe;
  const leinwand = szene.textures.createCanvas(name, 64, 80);
  const stift = leinwand.context;
  // Das gemalte Tütchen (werkzeuge/sachen_malen.py) bekommt einen Punkt in
  // der Farbe der Pflanze aufs Etikett.
  if (szene.textures.exists('samentuete')) {
    const tuete = szene.textures.get('samentuete').getSourceImage();
    const mass = Math.min(64 / tuete.width, 80 / tuete.height);
    const breite = tuete.width * mass;
    const hoehe = tuete.height * mass;
    stift.drawImage(tuete, (64 - breite) / 2, 80 - hoehe, breite, hoehe);
    stift.beginPath();
    stift.arc(32, 80 - hoehe * 0.42, Math.min(13, breite * 0.22), 0, Math.PI * 2);
    stift.fillStyle = farbeAlsCss(farbe);
    stift.fill();
    stift.lineWidth = 2.5;
    stift.strokeStyle = STRICH;
    stift.stroke();
    leinwand.refresh();
    return name;
  }
  const pfad = () => {
    stift.beginPath();
    stift.moveTo(10, 14);
    stift.lineTo(54, 12);
    stift.lineTo(56, 74);
    stift.lineTo(8, 76);
    stift.closePath();
  };
  pfad();
  stift.fillStyle = '#e8d4a8';
  stift.fill();
  stift.lineWidth = 3.5;
  stift.strokeStyle = STRICH;
  stift.lineJoin = 'round';
  stift.stroke();
  // oben zugefaltet
  stift.beginPath();
  stift.moveTo(10, 14);
  stift.lineTo(54, 12);
  stift.lineTo(54, 22);
  stift.lineTo(10, 24);
  stift.closePath();
  stift.fillStyle = '#c9b07a';
  stift.fill();
  stift.stroke();
  // ein farbiger Kreis mit Samenkörnern
  stift.beginPath();
  stift.arc(32, 50, 15, 0, Math.PI * 2);
  stift.fillStyle = farbeAlsCss(farbe);
  stift.fill();
  stift.lineWidth = 2.5;
  stift.stroke();
  const zufall = wuerfel(art.length * 13 + 5);
  stift.fillStyle = '#5a3a1e';
  for (let i = 0; i < 5; i += 1) {
    stift.beginPath();
    stift.ellipse(25 + zufall() * 14, 44 + zufall() * 12, 2.5, 4, zufall() * 3, 0, Math.PI * 2);
    stift.fill();
  }
  leinwand.refresh();
  return name;
}

// Ein kleiner Keimling: zwei hellgrüne Blättchen an einem Stiel.
function keimlingMalen(szene) {
  const name = 'keimling';
  if (szene.textures.exists(name)) return name;
  const leinwand = szene.textures.createCanvas(name, 60, 60);
  const stift = leinwand.context;
  stift.lineCap = 'round';
  stift.strokeStyle = STRICH;
  stift.lineWidth = 6;
  stift.beginPath();
  stift.moveTo(30, 58);
  stift.lineTo(30, 30);
  stift.stroke();
  stift.strokeStyle = '#5fc46a';
  stift.lineWidth = 3;
  stift.stroke();
  for (const seite of [-1, 1]) {
    stift.beginPath();
    stift.ellipse(30 + seite * 11, 26, 12, 6, seite * -0.5, 0, Math.PI * 2);
    stift.fillStyle = '#8ae07a';
    stift.fill();
    stift.lineWidth = 2.5;
    stift.strokeStyle = STRICH;
    stift.stroke();
  }
  leinwand.refresh();
  return name;
}

// Das Bild der Pflanze, die aus diesem Saatgut wächst.
function pflanzenBild(szene, art) {
  const bild = BEET.samen[art].pflanze;
  if (bild.startsWith('nachtblume-')) return nachtblumeMalen(szene, bild.slice('nachtblume-'.length));
  return szene.textures.exists(bild) ? bild : 'keimling';
}

// ------------------------------------------------------------ Saatgut

// Saatgut, das an diesem Ort herumliegt (saatgut beim Ort). Nach einer Weile
// liegt wieder welches da (zutatenWachsenNachSekunden in regeln.js).
export class Saatgut {
  constructor(szene) {
    this.szene = szene;
    for (const art of Object.keys(BEET.samen)) samenBildMalen(szene, art);
    this.tuetchen = (szene.ort.saatgut ?? []).map((punkt, nummer) => {
      const bild = szene.add.image(punkt.x, punkt.y, `samen-${punkt.art}`).setOrigin(0.5, 1).setScale(0.6).setDepth(szene.ort.dunkel ? 91000 : punkt.y);
      const schein = lichtschein(szene, punkt.x, punkt.y - 20, 100, 70, 0xfff3c4).setAlpha(0.5).setDepth(szene.ort.dunkel ? 91000 : punkt.y - 1);
      szene.tweens.add({ targets: bild, angle: { from: -6, to: 6 }, duration: 1200 + nummer * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { punkt, art: punkt.art, bild, schein, merkname: `saat-${szene.ortName}-${nummer}` };
    });
  }

  pruefen() {
    const szene = this.szene;
    const jetzt = Date.now();
    for (const tuete of this.tuetchen) {
      const da = jetzt >= (spielstand.zutatWiederDa[tuete.merkname] ?? 0);
      tuete.bild.setVisible(da);
      tuete.schein.setVisible(da);
      if (!da || abstand(szene.spieler.ort, tuete.punkt) > AUFSAMMELN) continue;
      einpacken(tuete.art);
      spielstand.zutatWiederDa[tuete.merkname] = jetzt + REGELN.zutatenWachsenNachSekunden * 1000;
      szene.beutelHuepfen();
      const plus = szene.add
        .text(tuete.punkt.x, tuete.punkt.y - 70, `+1 ${BEET.samen[tuete.art].name}`, schrift(24, '#fff3c4', { fontStyle: '600' }))
        .setOrigin(0.5)
        .setStroke('#3a2410', 6)
        .setDepth(VORNE - 1);
      szene.tweens.add({ targets: plus, y: plus.y - 50, alpha: 0, duration: 1300, onComplete: () => plus.destroy() });
    }
  }
}

// ------------------------------------------------------------ Das Beet

export class Beet {
  constructor(szene) {
    this.szene = szene;
    this.daten = szene.ort.beet;
    this.plaetze = beetPlaetze(this.daten);
    this.bilder = new Map(); // id einer Pflanze -> ihr Bild
    this.rankenStufe = -1;
    this.warDa = false;
    keimlingMalen(szene);
    for (const art of Object.keys(BEET.samen)) samenBildMalen(szene, art);
    this.erdeMalen();
    this.wachsen(true);
    szene.time.addEvent({ delay: NACHSEHEN, loop: true, callback: () => this.wachsen(false) });
  }

  // Die Erde mit Furchen und ein kleiner Holzzaun drumherum.
  erdeMalen() {
    const szene = this.szene;
    const { x, y, breite, hoehe } = this.daten;
    const stift = szene.add.graphics().setDepth(-4);
    stift.fillStyle(0x170b2c, 0.35);
    stift.fillRoundedRect(x - breite / 2 - 10, y - hoehe / 2 + 8, breite + 20, hoehe + 10, 30);
    stift.fillStyle(0x4a2e1e);
    stift.fillRoundedRect(x - breite / 2, y - hoehe / 2, breite, hoehe, 26);
    stift.lineStyle(4, 0x3a2216, 0.9);
    for (let reihe = 1; reihe <= 3; reihe += 1) {
      const fy = y - hoehe / 2 + (reihe * hoehe) / 4 + 10;
      stift.lineBetween(x - breite / 2 + 24, fy, x + breite / 2 - 24, fy);
    }
    stift.lineStyle(3, STRICH_ZAHL, 1);
    stift.strokeRoundedRect(x - breite / 2, y - hoehe / 2, breite, hoehe, 26);
    // Zaunpfosten
    const pfosten = szene.add.graphics().setDepth(y + hoehe / 2 + 2);
    for (let px = x - breite / 2; px <= x + breite / 2; px += 50) {
      for (const py of [y - hoehe / 2, y + hoehe / 2]) {
        pfosten.fillStyle(0x9a6a3a);
        pfosten.fillRoundedRect(px - 5, py - 30, 10, 34, 3);
        pfosten.lineStyle(2, STRICH_ZAHL, 1);
        pfosten.strokeRoundedRect(px - 5, py - 30, 10, 34, 3);
      }
    }
    pfosten.lineStyle(5, 0x8a5a2a, 1);
    for (const py of [y - hoehe / 2 - 18, y + hoehe / 2 - 18]) pfosten.lineBetween(x - breite / 2, py, x + breite / 2, py);
    this.ranken = szene.add.graphics().setDepth(y + hoehe / 2 + 3);
    szene.add
      .text(x - breite / 2 + 70, y - hoehe / 2 - 70, 'Gartenbeet', schrift(19, '#ffffff', { fontStyle: '600' }))
      .setOrigin(0.5)
      .setPadding(10, 6)
      .setBackgroundColor('#5a3a2a')
      .setDepth(y - hoehe / 2);
  }

  // Wo Ableger wachsen dürfen: nicht auf Häusern, Bäumen, Türen und Wegen hinaus.
  frei(punkt) {
    const szene = this.szene;
    const grenzen = szene.grenzen;
    if (punkt.x < grenzen.links + 30 || punkt.x > grenzen.rechts - 30 || punkt.y < grenzen.oben + 30 || punkt.y > grenzen.unten) return false;
    const ort = szene.ort;
    const fern = [...(ort.tueren ?? []), ...(ort.lagerfeuer ? [ort.lagerfeuer] : []), ...(ort.raetsel ? [ort.raetsel] : [])];
    if (fern.some((ding) => abstand(punkt, ding) < 260)) return false;
    return szene.hindernisse.every((h) => (h.radiusX ? true : abstand(punkt, h) > h.radius + 30));
  }

  get gepflanzt() {
    return spielstand.beet;
  }

  // Sieht nach, was gewachsen ist, und zeigt es. Neue Pflanzen ploppen aus der Erde.
  wachsen(amAnfang) {
    const szene = this.szene;
    const { pflanzen, wildheit } = beetWachsen({ gepflanzt: this.gepflanzt, jetzt: Date.now(), beet: this.daten, regeln: BEET, frei: (punkt) => this.frei(punkt) });
    this.wildheit = wildheit;
    this.pflanzen = pflanzen;
    for (const pflanze of pflanzen) {
      const keim = pflanze.stufe === 'keim';
      const name = keim ? 'keimling' : pflanzenBild(szene, pflanze.art);
      let bild = this.bilder.get(pflanze.id);
      const hoehe = keim ? 40 : BEET.samen[pflanze.art].groesse * pflanze.groesse;
      if (!bild) {
        bild = szene.add.image(pflanze.x, pflanze.y, name).setOrigin(0.5, 0.95).setDepth(pflanze.y).setFlipX(pflanze.id.length % 2 === 0);
        bild.setScale(hoehe / bild.height);
        this.bilder.set(pflanze.id, bild);
        szene.tweens.add({ targets: bild, angle: { from: -2, to: 2 }, duration: 1800 + (pflanze.x % 9) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        if (!amAnfang) {
          const ziel = bild.scale;
          bild.setScale(0);
          szene.tweens.add({ targets: bild, scale: ziel, duration: 600, ease: 'Back.easeOut' });
          if (abstand(szene.spieler.ort, pflanze) < 700) plopp(1.2);
        }
        continue;
      }
      if (bild.texture.key !== name) bild.setTexture(name);
      const ziel = hoehe / bild.height;
      if (Math.abs(bild.scale - ziel) > 0.005) szene.tweens.add({ targets: bild, scale: ziel, duration: 1500 });
    }
    this.rankenMalen();
  }

  // Je wilder das Beet, desto mehr Ranken klettern über den Zaun.
  rankenMalen() {
    const stufe = Math.floor(this.wildheit * 5);
    if (stufe === this.rankenStufe) return;
    this.rankenStufe = stufe;
    const { x, y, breite, hoehe } = this.daten;
    const stift = this.ranken;
    stift.clear();
    const zufall = wuerfel(99);
    for (let i = 0; i < stufe * 6; i += 1) {
      const sx = x - breite / 2 + zufall() * breite;
      const sy = zufall() < 0.5 ? y - hoehe / 2 - 18 : y + hoehe / 2 - 18;
      stift.lineStyle(5, 0x2f8a4a, 1);
      stift.beginPath();
      stift.moveTo(sx, sy);
      for (let t = 1; t <= 6; t += 1) stift.lineTo(sx + Math.sin(t * 1.3 + i) * 16, sy - 10 + t * (zufall() < 0.5 ? 9 : -9));
      stift.strokePath();
      stift.fillStyle(0x5fc46a);
      stift.fillEllipse(sx + 8, sy - 4, 14, 8);
    }
  }

  // ------------------------------------------------------ Im Beet stehen

  istDa() {
    const { x, y, breite, hoehe } = this.daten;
    const ort = this.szene.spieler.ort;
    return Math.abs(ort.x - x) < breite / 2 + 10 && Math.abs(ort.y - y) < hoehe / 2 + 10;
  }

  pruefen() {
    const da = this.istDa();
    if (da && !this.warDa && !this.szene.gespraech) this.sprechen();
    this.warDa = da;
  }

  // Was das Beet sagt, hängt davon ab, wie weit es ist.
  satz() {
    const S = BEET.saetze;
    if (this.gepflanzt.length === 0) return S.leer;
    if (this.wildheit >= 0.5) return S.ganzWild;
    if (this.wildheit > 0) return S.wild;
    if (this.pflanzen.every((pflanze) => pflanze.stufe === 'keim')) return S.keimt;
    return S.waechst;
  }

  sprechen() {
    const szene = this.szene;
    const knoepfe = [['Einsetzen', () => this.einsetzenZeigen()]];
    if (this.gepflanzt.length > 0) knoepfe.push(['Zähmen', () => this.zaehmen()]);
    knoepfe.push(['Tschüss', () => szene.gespraechSchliessen()]);
    szene.gespraechZeigen(this.satz(), knoepfe);
  }

  // Zeigt das Saatgut im Beutel. Was man antippt, wird eingesetzt.
  einsetzenZeigen() {
    const szene = this.szene;
    szene.gespraechSchliessen();
    const sachen = Object.keys(BEET.samen).filter((art) => anzahl(art) > 0);
    const platz = freierBeetPlatz(this.gepflanzt, this.plaetze.length);
    if (sachen.length === 0 || platz < 0) {
      szene.saetzeNacheinander([sachen.length === 0 ? BEET.saetze.keinSaatgut : BEET.saetze.voll], null, 'Okay');
      return;
    }
    const teile = [
      szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0b0518, 0.6).setOrigin(0).setInteractive(),
      feld(szene, 60, 60, BREITE - 120, 600),
      szene.add.text(BREITE / 2, 104, 'Was setzt du ein?', schrift(36, '#f6f0ff', { fontStyle: '600' })).setOrigin(0.5),
    ];
    const proReihe = 5;
    const reihen = Math.ceil(sachen.length / proReihe);
    sachen.forEach((art, nummer) => {
      const reihe = Math.floor(nummer / proReihe);
      const inDerReihe = reihe === reihen - 1 ? sachen.length - reihe * proReihe : proReihe;
      const x = BREITE / 2 + ((nummer % proReihe) - (inDerReihe - 1) / 2) * 210;
      const y = 250 + reihe * 200;
      const karte = szene.add.rectangle(x, y, 190, 180, FARBEN.knopf).setRounded(16).setStrokeStyle(3, FARBEN.rand).setInteractive({ useHandCursor: true });
      karte.on('pointerover', () => karte.setStrokeStyle(5, 0xffffff));
      karte.on('pointerout', () => karte.setStrokeStyle(3, FARBEN.rand));
      karte.on('pointerdown', () => this.einsetzen(art, platz));
      const bild = szene.add.image(x, y + 10, `samen-${art}`).setOrigin(0.5, 1);
      bild.setScale(90 / bild.height);
      teile.push(
        karte,
        bild,
        szene.add.text(x, y + 36, BEET.samen[art].name, schrift(18, '#ffffff', { align: 'center', wordWrap: { width: 170 } })).setOrigin(0.5, 0),
        szene.add.text(x + 70, y - 72, `× ${anzahl(art)}`, schrift(18, '#ffd166')).setOrigin(0.5),
      );
    });
    teile.push(...textKnopf(szene, BREITE / 2 - 120, 590, 240, 54, 'Zurück', () => szene.gespraechSchliessen()));
    szene.festkleben(teile, VORNE + 100);
    szene.gespraech = teile;
  }

  einsetzen(art, platz) {
    const szene = this.szene;
    szene.gespraechSchliessen();
    if (!herausnehmen(art)) return;
    spielstand.beet.push({ art, platz, zeit: Date.now() });
    rascheln(0.5);
    const punkt = this.plaetze[platz];
    const erde = szene.add.circle(punkt.x, punkt.y - 6, 18, 0x6a4430).setDepth(punkt.y - 1);
    szene.tweens.add({ targets: erde, scale: 1.6, alpha: 0, duration: 700, onComplete: () => erde.destroy() });
    this.wachsen(false);
    szene.saetzeNacheinander([BEET.saetze.eingesetzt.replace('{name}', BEET.samen[art].name)], null, 'Okay');
  }

  // Zähmen: Solange das Beet noch nicht wild ist, zupft man ein bisschen.
  // Ist es wild, wackelt alles, und die Pflanzen wachsen sofort wieder nach.
  zaehmen() {
    const szene = this.szene;
    szene.gespraechSchliessen();
    rascheln(1);
    const wild = this.wildheit > 0;
    for (const bild of this.bilder.values()) {
      const groesse = bild.scale;
      szene.tweens.add({ targets: bild, scaleY: groesse * (wild ? 0.6 : 0.9), duration: 200, yoyo: true, onComplete: () => wild && szene.tweens.add({ targets: bild, scale: groesse * 1.12, duration: 300, yoyo: true }) });
    }
    if (wild) szene.cameras.main.shake(300, 0.004);
    szene.time.delayedCall(wild ? 900 : 300, () => szene.saetzeNacheinander([wild ? BEET.saetze.nichtZaehmen : BEET.saetze.ordentlich], null, 'Okay'));
  }
}

// Die dunkle Strichfarbe als Zahl (für Phaser-Grafiken)
const STRICH_ZAHL = Phaser.Display.Color.HexStringToColor(STRICH).color;
