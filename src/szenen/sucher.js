// Durch den Sucher der Kamera schauen und von Hand scharf stellen, wie bei
// einer echten Kamera. Benutzt im Regenwald für die Pflanzenfotos.
//
// Wie scharf das Bild wird, hängt davon ab, wie weit die Pflanze weg ist:
// Steht man nah dran, muss der Schärfering auf „nah“, sonst weiter Richtung „weit“.
//
// Bedienung ohne Touch:  Mausrad oder ← → (auch A und D) zum Scharfstellen,
//                         Leertaste oder Enter zum Auslösen, Esc zum Abbrechen.
// Bedienung mit Touch:    mit dem Finger am Schärfering ziehen, auf den
//                         runden Auslöser tippen, mit ✕ abbrechen.
// (Die Knöpfe auf dem Bildschirm gehen auch mit der Maus.)

import Phaser from 'phaser';
import { ausloeser, klick, wackeln } from '../klang/geraeusche.js';
import { BREITE, HOEHE, schrift } from './stil.js';

const TIEFE = 300000;
const SCHARF_GENUG = 0.045; // so nah muss die Schärfe am richtigen Wert sein
const KOPIEN = 8; // so viele verschobene Kopien machen das Bild unscharf
const FENSTER = { x: 90, y: 40, breite: BREITE - 180, hoehe: HOEHE - 210 };

// bildName: das Bild, das man fotografiert. entfernung: von 0 (ganz nah) bis
// 1 (weit weg). Gibt ein Promise zurück: true, wenn ein scharfes Foto gelungen
// ist, false, wenn man abgebrochen hat.
export function sucherOeffnen(szene, bildName, entfernung) {
  return new Promise((fertig) => {
    const teile = [];
    const neu = (ding) => {
      teile.push(ding);
      return ding.setScrollFactor(0);
    };
    const mitte = { x: FENSTER.x + FENSTER.breite / 2, y: FENSTER.y + FENSTER.hoehe / 2 };
    // Das richtige Ziel für die Schärfe, mit einer kleinen Überraschung
    const ziel = Phaser.Math.Clamp(entfernung + (Math.random() - 0.5) * 0.1, 0.06, 0.94);
    // Am Anfang ist es deutlich unscharf.
    let schaerfe = ziel > 0.5 ? ziel - 0.35 - Math.random() * 0.1 : ziel + 0.35 + Math.random() * 0.1;
    let fertigGemacht = false;

    // Was man durch den Sucher sieht: grüner, unscharfer Regenwald und die Pflanze
    neu(szene.add.rectangle(0, 0, BREITE, HOEHE, 0x0a120a).setOrigin(0).setInteractive());
    neu(szene.add.rectangle(mitte.x, mitte.y, FENSTER.breite, FENSTER.hoehe, 0x5a9a5a));
    const blaetter = [];
    for (let i = 0; i < 14; i += 1) {
      blaetter.push(
        neu(szene.add.ellipse(FENSTER.x + Math.random() * FENSTER.breite, FENSTER.y + Math.random() * FENSTER.hoehe, 120 + Math.random() * 160, 60 + Math.random() * 80, [0x3f7a3a, 0x6ab05a, 0x2f5a2a][i % 3], 0.7)),
      );
    }
    const kopien = Array.from({ length: KOPIEN + 1 }, () => neu(szene.add.image(mitte.x, mitte.y + 20, bildName)));
    const groesse = Math.min((FENSTER.hoehe - 80) / kopien[0].height, (FENSTER.breite - 200) / kopien[0].width);
    for (const kopie of kopien) kopie.setScale(groesse);

    // Der Rahmen des Suchers: dunkel außen herum, mit runden Ecken
    const rahmen = neu(szene.add.graphics());
    rahmen.fillStyle(0x0a0a0a, 1);
    rahmen.fillRect(0, 0, BREITE, FENSTER.y);
    rahmen.fillRect(0, FENSTER.y + FENSTER.hoehe, BREITE, HOEHE - FENSTER.y - FENSTER.hoehe);
    rahmen.fillRect(0, 0, FENSTER.x, HOEHE);
    rahmen.fillRect(FENSTER.x + FENSTER.breite, 0, BREITE - FENSTER.x - FENSTER.breite, HOEHE);
    rahmen.lineStyle(4, 0x2a2a2a, 1);
    rahmen.strokeRoundedRect(FENSTER.x, FENSTER.y, FENSTER.breite, FENSTER.hoehe, 24);
    // Gitterlinien wie im Sucher
    rahmen.lineStyle(1, 0xffffff, 0.25);
    for (const teil of [1, 2]) {
      rahmen.lineBetween(FENSTER.x + (FENSTER.breite * teil) / 3, FENSTER.y, FENSTER.x + (FENSTER.breite * teil) / 3, FENSTER.y + FENSTER.hoehe);
      rahmen.lineBetween(FENSTER.x, FENSTER.y + (FENSTER.hoehe * teil) / 3, FENSTER.x + FENSTER.breite, FENSTER.y + (FENSTER.hoehe * teil) / 3);
    }
    // Ein roter Punkt: Die Kamera ist an.
    const rec = neu(szene.add.circle(FENSTER.x + 40, FENSTER.y + 36, 9, 0xff4d6d));
    szene.tweens.add({ targets: rec, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    neu(szene.add.text(FENSTER.x + 58, FENSTER.y + 24, 'Sucher', schrift(20, '#ffffff')));

    // Die Schärfe-Ecken in der Mitte: rot = unscharf, grün = scharf
    const ecken = neu(szene.add.graphics());
    const scharfText = neu(szene.add.text(mitte.x, FENSTER.y + 36, '', schrift(26, '#7bff9a', { fontStyle: 'bold' })).setOrigin(0.5).setStroke('#000000', 6));

    // Unten der Schärfering: ein breites Band mit Rillen. Daran zieht man.
    const ring = { x: 200, y: HOEHE - 120, breite: BREITE - 520, hoehe: 64 };
    neu(szene.add.rectangle(ring.x, ring.y, ring.breite, ring.hoehe, 0x2a2a2a).setOrigin(0).setStrokeStyle(3, 0x555555));
    const rillen = neu(szene.add.graphics());
    neu(szene.add.text(ring.x - 12, ring.y + ring.hoehe / 2, 'nah', schrift(20, '#bbbbbb')).setOrigin(1, 0.5));
    neu(szene.add.text(ring.x + ring.breite + 12, ring.y + ring.hoehe / 2, 'weit', schrift(20, '#bbbbbb')).setOrigin(0, 0.5));
    const marke = neu(szene.add.triangle(0, ring.y - 6, 0, 0, 16, 0, 8, 14, 0xffd166));
    const ringFlaeche = neu(szene.add.rectangle(ring.x, ring.y - 20, ring.breite, ring.hoehe + 40, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true, draggable: false }));

    // Der Auslöser: groß und rund, rechts unten
    const knopf = neu(szene.add.circle(BREITE - 170, HOEHE - 92, 52, 0xeeeeee).setStrokeStyle(8, 0x888888).setInteractive({ useHandCursor: true }));
    neu(szene.add.circle(BREITE - 170, HOEHE - 92, 36, 0xff6b6b));
    // Abbrechen
    const weg = neu(szene.add.circle(BREITE - 60, 60, 30, 0x333333).setStrokeStyle(3, 0x888888).setInteractive({ useHandCursor: true }));
    neu(szene.add.text(BREITE - 60, 58, '✕', schrift(30, '#ffffff')).setOrigin(0.5));

    // Was man tun soll, je nachdem, ob es ein Touch-Gerät ist
    const touch = szene.sys.game.device.input.touch;
    const hinweis = touch ? 'Zieh mit dem Finger am Schärfering · Tipp auf den Auslöser' : 'Mausrad oder ← → zum Scharfstellen · Leertaste zum Auslösen · Esc zum Abbrechen';
    neu(szene.add.text(ring.x + ring.breite / 2, HOEHE - 32, hinweis, schrift(19, '#dddddd')).setOrigin(0.5));
    const meldung = neu(szene.add.text(mitte.x, FENSTER.y + FENSTER.hoehe - 40, '', schrift(28, '#ffffff', { fontStyle: '600' })).setOrigin(0.5).setStroke('#000000', 6));

    teile.forEach((teil, nummer) => teil.setDepth(TIEFE + nummer));

    // Zeichnet alles neu, wenn sich die Schärfe ändert.
    const zeigen = () => {
      const abweichung = Math.abs(schaerfe - ziel);
      const weit = Math.min(abweichung, 0.6) * 90;
      kopien.forEach((kopie, nummer) => {
        if (nummer === KOPIEN) {
          kopie.setPosition(mitte.x, mitte.y + 20).setAlpha(Phaser.Math.Clamp(1 - abweichung * 3, 0.15, 1));
          return;
        }
        const winkel = (nummer / KOPIEN) * Math.PI * 2;
        kopie.setPosition(mitte.x + Math.cos(winkel) * weit, mitte.y + 20 + Math.sin(winkel) * weit).setAlpha(abweichung < 0.01 ? 0 : 0.2);
      });
      // Auch der Hintergrund verschwimmt (er ist weiter weg als die Pflanze).
      for (const blatt of blaetter) blatt.setAlpha(0.35 + Math.min(abweichung, 0.4));
      const scharf = abweichung <= SCHARF_GENUG;
      const farbe = scharf ? 0x7bff9a : abweichung < 0.15 ? 0xffd166 : 0xff6b6b;
      ecken.clear();
      ecken.lineStyle(5, farbe, 1);
      const g = 70;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const ex = mitte.x + dx * g;
        const ey = mitte.y + dy * g;
        ecken.lineBetween(ex, ey, ex - dx * 22, ey);
        ecken.lineBetween(ex, ey, ex, ey - dy * 22);
      }
      scharfText.setText(scharf ? 'Scharf!' : '');
      // Die Rillen am Ring wandern mit, wie wenn man dreht.
      rillen.clear();
      rillen.lineStyle(4, 0x777777, 1);
      for (let x = 0; x < ring.breite; x += 22) {
        const rx = ring.x + ((x + schaerfe * 400) % ring.breite);
        rillen.lineBetween(rx, ring.y + 10, rx, ring.y + ring.hoehe - 10);
      }
      marke.setX(ring.x + schaerfe * ring.breite - 8);
    };

    const drehen = (um) => {
      if (fertigGemacht) return;
      const vorher = schaerfe;
      schaerfe = Phaser.Math.Clamp(schaerfe + um, 0, 1);
      if (Math.floor(vorher * 40) !== Math.floor(schaerfe * 40)) klick();
      meldung.setText('');
      zeigen();
    };

    // --- Bedienung ---
    // Am Ring ziehen (Finger oder Maus): nach rechts weiter, nach links näher
    let ziehtVon = null;
    ringFlaeche.on('pointerdown', (zeiger) => {
      ziehtVon = zeiger.x;
    });
    const bewegt = (zeiger) => {
      if (ziehtVon === null || !zeiger.isDown) return;
      drehen((zeiger.x - ziehtVon) / ring.breite);
      ziehtVon = zeiger.x;
    };
    const losgelassen = () => {
      ziehtVon = null;
    };
    szene.input.on('pointermove', bewegt);
    szene.input.on('pointerup', losgelassen);
    // Mausrad
    const rad = (zeiger, objekte, dx, dy) => drehen(dy * -0.0006);
    szene.input.on('wheel', rad);
    // Tasten
    const taste = (ereignis) => {
      const code = ereignis.code;
      if (code === 'ArrowLeft' || code === 'KeyA') drehen(-0.02);
      else if (code === 'ArrowRight' || code === 'KeyD') drehen(0.02);
      else if (code === 'Space' || code === 'Enter') ausloesen();
      else if (code === 'Escape') schliessen(false);
    };
    szene.input.keyboard.on('keydown', taste);

    const schliessen = (gelungen) => {
      if (fertigGemacht) return;
      fertigGemacht = true;
      szene.input.off('pointermove', bewegt);
      szene.input.off('pointerup', losgelassen);
      szene.input.off('wheel', rad);
      szene.input.keyboard.off('keydown', taste);
      szene.tweens.killTweensOf(rec);
      for (const teil of teile) teil.destroy();
      fertig(gelungen);
    };

    const ausloesen = () => {
      if (fertigGemacht) return;
      ausloeser();
      // Der Verschluss: kurz ganz schwarz
      const verschluss = szene.add.rectangle(mitte.x, mitte.y, FENSTER.breite, FENSTER.hoehe, 0x000000).setScrollFactor(0).setDepth(TIEFE + 500);
      szene.tweens.add({ targets: verschluss, alpha: 0, duration: 260, onComplete: () => verschluss.destroy() });
      if (Math.abs(schaerfe - ziel) <= SCHARF_GENUG) {
        szene.time.delayedCall(300, () => schliessen(true));
        return;
      }
      wackeln();
      meldung.setText(Math.abs(schaerfe - ziel) < 0.15 ? 'Fast! Noch ein kleines bisschen drehen.' : 'Unscharf! Dreh am Schärfering.');
      szene.cameras.main.shake(150, 0.003);
    };
    knopf.on('pointerdown', ausloesen);
    weg.on('pointerdown', () => {
      klick();
      schliessen(false);
    });

    zeigen();
  });
}
