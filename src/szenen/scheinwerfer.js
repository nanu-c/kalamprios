// Eine Auswahl wie auf einer Bühne: Jede Figur steht in ihrem eigenen
// Scheinwerferlicht. Fährt man mit der Maus (oder dem Finger) darüber, wird
// das Licht heller, und die Figur leuchtet. Wer angetippt wird, ist gewählt.
// Benutzt bei der Wahl der Figur (CharakterSzene) und wenn die Rivalin einem
// ein Kalamprio schenkt (WeltSzene).

import Phaser from 'phaser';
import { klick } from '../klang/geraeusche.js';
import { bilderErzeugen, lichtschein } from './landschaft.js';
import { BREITE, schrift } from './stil.js';

const LICHT = 0xfff0d0; // warmes Scheinwerferlicht

// eintraege: Liste von { bild, name, zusatz, zusatzFarbe, beimZeigen }.
// boden: wie weit unten die Figuren stehen, groesse: wie hoch sie sind.
// beimWaehlen(nummer) wird aufgerufen, wenn eine angetippt wird.
// Gibt alle Teile zurück, damit man sie wieder wegräumen kann.
export function scheinwerferAuswahl(szene, eintraege, beimWaehlen, { boden = 600, groesse = 320, tiefe = 0 } = {}) {
  bilderErzeugen(szene); // für den Lichtkegel und den Lichtschein
  const teile = [];
  const abstand = Math.min(460, (BREITE - 120) / eintraege.length);
  let gewaehlt = false;

  eintraege.forEach((eintrag, nummer) => {
    const x = BREITE / 2 + (nummer - (eintraege.length - 1) / 2) * abstand;

    // Der Lichtkegel kommt von oben, unten ist ein heller Fleck auf dem Boden.
    const kegel = szene.add
      .image(x, -40, 'lichtkegel')
      .setOrigin(0.5, 0)
      .setDisplaySize(abstand * 0.8, boden + 70)
      .setTint(LICHT)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.3);
    const fleck = lichtschein(szene, x, boden, abstand * 0.85, 90, LICHT).setAlpha(0.45);
    const schein = lichtschein(szene, x, boden - groesse / 2, groesse * 1.1, groesse * 1.3, LICHT).setAlpha(0);

    const figur = szene.add.image(x, boden + 8, eintrag.bild).setOrigin(0.5, 1);
    figur.setScale(Math.min(groesse / figur.height, (abstand - 60) / figur.width));
    const normal = figur.scale;
    // Ein zweites, hell aufaddiertes Bild lässt die Figur leuchten.
    const leuchten = szene.add.image(x, boden + 8, eintrag.bild).setOrigin(0.5, 1).setScale(normal).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);

    const name = szene.add.text(x, boden + 46, eintrag.name, schrift(34, '#d9c9ff', { fontStyle: '600' })).setOrigin(0.5).setStroke('#170b2c', 6);
    const zusatz = szene.add.text(x, boden + 86, eintrag.zusatz ?? '', schrift(22, eintrag.zusatzFarbe ?? '#d9c9ff')).setOrigin(0.5);

    // Das Licht flackert ganz leicht, wie bei einem echten Scheinwerfer.
    szene.tweens.add({ targets: kegel, alpha: 0.24, duration: 900 + nummer * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Staub tanzt im Licht, bis die Auswahl weggeräumt ist.
    const staub = szene.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (!figur.active) {
          staub.remove();
          return;
        }
        const korn = szene.add
          .circle(x + (Math.random() - 0.5) * abstand * 0.45, boden - Math.random() * boden * 0.8, 1.5 + Math.random() * 1.5, LICHT, 0.7)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScrollFactor(0)
          .setDepth(tiefe + 5);
        szene.tweens.add({ targets: korn, y: korn.y + 40, x: korn.x + (Math.random() - 0.5) * 30, alpha: 0, duration: 2200, onComplete: () => korn.destroy() });
      },
    });

    // Eine unsichtbare Fläche über Kegel und Figur: Darauf reagiert die Maus.
    const flaeche = szene.add.rectangle(x, boden / 2 + 40, abstand * 0.8, boden + 40, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    const hell = (an) => {
      szene.tweens.killTweensOf([kegel, fleck, schein, leuchten, figur]);
      szene.tweens.add({ targets: kegel, alpha: an ? 0.7 : 0.3, duration: 250 });
      szene.tweens.add({ targets: fleck, alpha: an ? 0.9 : 0.45, duration: 250 });
      szene.tweens.add({ targets: schein, alpha: an ? 0.55 : 0, duration: 250 });
      szene.tweens.add({ targets: leuchten, alpha: an ? 0.45 : 0, duration: 250 });
      szene.tweens.add({ targets: [figur, leuchten], scale: an ? normal * 1.06 : normal, duration: 250, ease: 'Back.easeOut' });
      name.setColor(an ? '#fff3c4' : '#d9c9ff');
      if (!an) szene.tweens.add({ targets: kegel, alpha: 0.24, delay: 260, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    };
    flaeche.on('pointerover', () => {
      hell(true);
      eintrag.beimZeigen?.();
    });
    flaeche.on('pointerout', () => hell(false));
    flaeche.on('pointerdown', () => {
      if (gewaehlt) return;
      gewaehlt = true;
      klick();
      hell(true);
      // Ein heller Blitz auf die gewählte Figur, dann geht es weiter.
      szene.tweens.add({ targets: leuchten, alpha: 1, duration: 150, yoyo: true });
      szene.tweens.add({ targets: kegel, alpha: 1, duration: 200 });
      szene.time.delayedCall(450, () => beimWaehlen(nummer));
    });
    teile.push(kegel, fleck, schein, figur, leuchten, name, zusatz, flaeche);
  });
  teile.forEach((teil, nummer) => teil.setDepth(tiefe + nummer));
  return teile;
}
