// Malt die Orte: Boden, hohes Gras, Bäume, Häuser, Felsen, Kristalle und Seen.
// Das sind Platzhalter, bis es gemalte Landschaftsbilder gibt.

import { ORTE } from '../daten/orte.js';
import { AUSGANG_BREITE, hinterDemAusgang, weltGrenzen } from '../welt/weltlogik.js';
import { schrift } from './stil.js';

// Jedes Bild: wie groß es ist und wo der Fuß sitzt (in Pixeln von oben).
const BILDER = {
  baum: { breite: 220, hoehe: 270, fuss: 255 },
  'kristall-lila': { breite: 110, hoehe: 170, fuss: 160 },
  'kristall-blau': { breite: 110, hoehe: 170, fuss: 160 },
  'kristall-dunkel': { breite: 110, hoehe: 170, fuss: 160 },
  prismastahl: { breite: 120, hoehe: 180, fuss: 168 },
  felsen: { breite: 170, hoehe: 140, fuss: 126 },
  haus: { breite: 280, hoehe: 270, fuss: 256 },
  schild: { breite: 40, hoehe: 90, fuss: 86 },
};

// Farben für Boden und Flecken, je nachdem wie der Ort aussieht.
const BODEN = {
  dorf: { grund: 0x4a2a80, hell: 0x5a36a0, dunkel: 0x3f2370, weg: 0x9a84c8 },
  wald: { grund: 0x3b2170, hell: 0x46288a, dunkel: 0x331b62, weg: 0x6c55a0 },
  mine: { grund: 0x2b2340, hell: 0x372d52, dunkel: 0x211a33, weg: 0x5a4f6e },
  see: { grund: 0x2f2a6a, hell: 0x3a3580, dunkel: 0x28235a, weg: 0x7a6cb0 },
};

// Ein Würfel, der bei jedem Spielstart dieselben Zahlen liefert.
// So sieht der Boden immer gleich aus.
function wuerfel(startwert) {
  let zustand = startwert;
  return () => {
    zustand = (zustand + 0x6d2b79f5) | 0;
    let wert = Math.imul(zustand ^ (zustand >>> 15), 1 | zustand);
    wert = (wert + Math.imul(wert ^ (wert >>> 7), 61 | wert)) ^ wert;
    return ((wert ^ (wert >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------ Einzelbilder

function baumMalen(stift) {
  stift.fillStyle(0x24103f);
  stift.fillRect(97, 150, 26, 105);
  stift.fillStyle(0x6f36b3);
  stift.fillCircle(110, 105, 88);
  stift.fillStyle(0x8546cc);
  stift.fillCircle(70, 85, 55);
  stift.fillCircle(145, 72, 48);
  stift.fillStyle(0x9c5fe0);
  stift.fillCircle(88, 62, 30);
}

function kristallMalen(stift, farbe, hell) {
  stift.fillStyle(hell);
  stift.fillTriangle(5, 160, 22, 92, 40, 160);
  stift.fillTriangle(20, 160, 55, 10, 55, 160);
  stift.fillStyle(farbe);
  stift.fillTriangle(55, 160, 55, 10, 90, 160);
  stift.fillTriangle(70, 160, 92, 100, 108, 160);
}

// Prismastahl glänzt silbern und schimmert an den Kanten in allen Farben.
function prismastahlMalen(stift) {
  stift.fillStyle(0xdfe6f5);
  stift.fillTriangle(10, 168, 30, 70, 50, 168);
  stift.fillTriangle(30, 168, 62, 8, 62, 168);
  stift.fillStyle(0x8f9bb8);
  stift.fillTriangle(62, 168, 62, 8, 96, 168);
  stift.fillTriangle(78, 168, 100, 96, 116, 168);
  stift.lineStyle(3, 0xff9ad5, 0.9);
  stift.lineBetween(62, 10, 32, 168);
  stift.lineStyle(3, 0x8ef0ff, 0.9);
  stift.lineBetween(62, 10, 94, 168);
  stift.lineStyle(2, 0xffe066, 0.8);
  stift.lineBetween(30, 72, 12, 168);
}

function felsenMalen(stift) {
  stift.fillStyle(0x4a4063);
  stift.fillEllipse(85, 90, 160, 80);
  stift.fillCircle(70, 66, 50);
  stift.fillCircle(110, 72, 42);
  stift.fillStyle(0x5f5480);
  stift.fillCircle(62, 54, 32);
  stift.fillCircle(108, 62, 24);
  stift.fillStyle(0x7a6e9c);
  stift.fillCircle(56, 44, 13);
}

// Ein rundes Dorfhaus mit spitzem Dach, Tür und leuchtenden Fenstern.
function hausMalen(stift) {
  stift.fillStyle(0xd8c8f0);
  stift.fillRect(45, 130, 190, 126);
  stift.fillStyle(0xbfa9e3);
  stift.fillRect(45, 130, 190, 14);
  stift.fillStyle(0x5a2c9a);
  stift.fillTriangle(20, 140, 140, 18, 260, 140);
  stift.fillStyle(0x7a44c4);
  stift.fillTriangle(140, 18, 260, 140, 140, 140);
  stift.fillStyle(0x3b1e66);
  stift.fillRoundedRect(118, 176, 44, 80, { tl: 22, tr: 22, bl: 0, br: 0 });
  stift.fillStyle(0xffe9a8);
  stift.fillCircle(80, 190, 18);
  stift.fillCircle(200, 190, 18);
  stift.fillStyle(0x8ef0ff);
  stift.fillTriangle(130, 30, 140, 0, 150, 30);
}

function schildMalen(stift) {
  stift.fillStyle(0x5a3a2a);
  stift.fillRect(16, 30, 8, 56);
}

// ------------------------------------------------------------------- Boden

// Mischt zwei Farben. anteil 0 ergibt die erste, anteil 1 die zweite.
function mischen(farbeA, farbeB, anteil) {
  const kanal = (verschiebung) => {
    const a = (farbeA >> verschiebung) & 0xff;
    const b = (farbeB >> verschiebung) & 0xff;
    return Math.round(a + (b - a) * anteil) << verschiebung;
  };
  return kanal(16) | kanal(8) | kanal(0);
}

function flecken(stift, ort, farben, zufall) {
  const anzahl = Math.round((ort.breite * ort.hoehe) / 9000);
  for (let i = 0; i < anzahl; i += 1) {
    stift.fillStyle(zufall() < 0.5 ? farben.hell : farben.dunkel, 0.55);
    stift.fillEllipse(zufall() * ort.breite, zufall() * ort.hoehe, 50 + zufall() * 130, 24 + zufall() * 50);
  }
}

function punkte(stift, ort, farben, anzahl, groesse, zufall) {
  for (let i = 0; i < anzahl; i += 1) {
    stift.fillStyle(farben[i % farben.length], 0.85);
    stift.fillCircle(zufall() * ort.breite, zufall() * ort.hoehe, groesse + zufall() * groesse);
  }
}

// Ein heller Weg vom Ausgang ein Stück in den Ort hinein.
function wegeMalen(stift, ort, farben) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    const lang = ort.stil === 'dorf' ? ort.breite * 0.75 : 380;
    const draussen = hinterDemAusgang(ausgang, grenzen, -200);
    const drinnen = hinterDemAusgang(ausgang, grenzen, lang);
    // Viele Kreise hintereinander: So wird der Weg rund. Erst ein breiter
    // Rand, dann die hellere Mitte.
    const laenge = Math.hypot(drinnen.x - draussen.x, drinnen.y - draussen.y);
    for (const [radius, anteil] of [[60, 0.35], [46, 0.55]]) {
      stift.fillStyle(mischen(farben.grund, farben.weg, anteil));
      for (let weit = 0; weit <= laenge; weit += 10) {
        stift.fillCircle(
          draussen.x + ((drinnen.x - draussen.x) * weit) / laenge,
          draussen.y + ((drinnen.y - draussen.y) * weit) / laenge,
          radius,
        );
      }
    }

    // In der Mine liegen Schienen auf dem Weg.
    if (ort.stil === 'mine') {
      const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
      stift.lineStyle(5, 0x8f9bb8, 0.9);
      for (const seite of [-22, 22]) {
        if (quer) stift.lineBetween(draussen.x, drinnen.y + seite, drinnen.x, drinnen.y + seite);
        else stift.lineBetween(drinnen.x + seite, draussen.y, drinnen.x + seite, drinnen.y);
      }
    }
  }
}

function grasMalen(stift, ort, zufall) {
  for (const gras of ort.hohesGras) {
    if (ort.stil === 'mine') {
      // Geröll: viele kleine Steine
      stift.fillStyle(0x3a3150);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 28);
      for (let y = gras.oben + 16; y < gras.oben + gras.hoehe - 10; y += 20) {
        for (let x = gras.links + 14; x < gras.links + gras.breite - 10; x += 22) {
          stift.fillStyle(zufall() < 0.5 ? 0x6e6488 : 0x857aa3);
          stift.fillEllipse(x + zufall() * 10, y + zufall() * 8, 12 + zufall() * 10, 8 + zufall() * 6);
        }
      }
    } else if (ort.stil === 'see') {
      // Schilf: dünne Halme mit braunen Kolben
      stift.fillStyle(0x24505a);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 28);
      for (let y = gras.oben + 34; y < gras.oben + gras.hoehe - 4; y += 22) {
        for (let x = gras.links + 14; x < gras.links + gras.breite - 10; x += 16) {
          const hx = x + zufall() * 8;
          const hy = y + zufall() * 6;
          stift.fillStyle(zufall() < 0.5 ? 0x4fae8a : 0x6cc79e);
          stift.fillRect(hx - 1.5, hy - 26, 3, 28);
          if (zufall() < 0.4) {
            stift.fillStyle(0x8a5a3a);
            stift.fillEllipse(hx, hy - 26, 7, 16);
          }
        }
      }
    } else {
      // Hohes Gras: eine blaugrüne Fläche mit vielen Halmen
      stift.fillStyle(0x245f6b);
      stift.fillRoundedRect(gras.links, gras.oben, gras.breite, gras.hoehe, 28);
      for (let y = gras.oben + 20; y < gras.oben + gras.hoehe - 8; y += 24) {
        for (let x = gras.links + 16; x < gras.links + gras.breite - 12; x += 22) {
          const hx = x + zufall() * 10;
          const hy = y + zufall() * 8;
          stift.fillStyle(zufall() < 0.5 ? 0x3fa59a : 0x58c7b8);
          stift.fillTriangle(hx - 6, hy + 9, hx, hy - 11, hx + 6, hy + 9);
        }
      }
    }
  }
}

// Ein See mit Ufer, Wellen, Seerosen und dem Spiegelbild des Mondes.
function seenMalen(stift, ort, zufall) {
  for (const see of ort.seen ?? []) {
    stift.fillStyle(0x8a76b8);
    stift.fillEllipse(see.x, see.y, see.breite + 60, see.hoehe + 50);
    stift.fillStyle(0x1d2f6e);
    stift.fillEllipse(see.x, see.y, see.breite, see.hoehe);
    stift.fillStyle(0x26408a);
    stift.fillEllipse(see.x, see.y, see.breite * 0.8, see.hoehe * 0.78);
    stift.fillStyle(0x2c4c9c);
    stift.fillEllipse(see.x, see.y, see.breite * 0.55, see.hoehe * 0.5);

    // Das Mondlicht auf dem Wasser
    stift.fillStyle(0xf3e9ff, 0.18);
    stift.fillEllipse(see.x, see.y - see.hoehe * 0.12, 220, 120);
    stift.fillStyle(0xf3e9ff, 0.85);
    stift.fillEllipse(see.x, see.y - see.hoehe * 0.12, 110, 54);
    for (let i = 1; i <= 5; i += 1) {
      stift.fillStyle(0xf3e9ff, 0.5 - i * 0.07);
      stift.fillEllipse(see.x, see.y - see.hoehe * 0.12 + i * 34, 120 - i * 14, 8);
    }

    // Wellen
    stift.lineStyle(3, 0x8ec8ff, 0.35);
    for (let i = 0; i < 40; i += 1) {
      const winkel = zufall() * Math.PI * 2;
      const weit = Math.sqrt(zufall()) * 0.85;
      const x = see.x + Math.cos(winkel) * (see.breite / 2) * weit;
      const y = see.y + Math.sin(winkel) * (see.hoehe / 2) * weit;
      stift.lineBetween(x - 18, y, x + 18, y);
    }

    // Seerosen am Rand
    for (let i = 0; i < 14; i += 1) {
      const winkel = zufall() * Math.PI * 2;
      const x = see.x + Math.cos(winkel) * (see.breite / 2) * 0.82;
      const y = see.y + Math.sin(winkel) * (see.hoehe / 2) * 0.8;
      stift.fillStyle(0x3fa59a);
      stift.fillCircle(x, y, 16);
      stift.fillStyle(0xff9ad5);
      stift.fillCircle(x + 4, y - 3, 6);
    }
  }
}

// Die Mine hat oben eine dunkle Felswand mit glänzenden Adern.
function felswandMalen(stift, ort, zufall) {
  stift.fillStyle(0x1a1328);
  stift.fillRect(0, 0, ort.breite, 150);
  for (let x = 0; x < ort.breite; x += 60) {
    stift.fillTriangle(x, 148, x + 30, 175 + zufall() * 25, x + 60, 148);
  }
  const adern = [0xb8c4d9, 0x8ef0ff, 0xff9ad5];
  for (let i = 0; i < 26; i += 1) {
    const x = zufall() * ort.breite;
    const y = 20 + zufall() * 110;
    stift.lineStyle(3, adern[i % adern.length], 0.7);
    stift.lineBetween(x, y, x + 30 + zufall() * 50, y + 10 + zufall() * 25);
  }
}

function bodenMalen(stift, ort) {
  const zufall = wuerfel(ort.breite + ort.hoehe + ort.stil.length);
  const farben = BODEN[ort.stil];
  stift.fillStyle(farben.grund);
  stift.fillRect(0, 0, ort.breite, ort.hoehe);
  flecken(stift, ort, farben, zufall);

  const flaeche = (ort.breite * ort.hoehe) / 15000;
  if (ort.stil === 'mine') {
    // Glitzernder Kristallstaub
    punkte(stift, ort, [0x8ef0ff, 0xb8c4d9, 0xff9ad5], Math.round(flaeche * 0.8), 1.5, zufall);
  } else {
    // Blüten
    punkte(stift, ort, [0xc9b8ff, 0x8ef0ff, 0xff9ad5], Math.round(flaeche), 2.5, zufall);
  }

  wegeMalen(stift, ort, farben);
  if (ort.stil === 'dorf') {
    // Der Dorfplatz rund um den großen Kristall
    const platz = (ort.kristalle ?? [])[2] ?? { x: ort.breite / 2, y: ort.hoehe / 2 };
    stift.fillStyle(farben.weg, 0.6);
    stift.fillCircle(platz.x, platz.y - 20, 210);
    stift.fillStyle(0xb9a8de, 0.5);
    stift.fillCircle(platz.x, platz.y - 20, 150);
  }
  if (ort.stil === 'mine') felswandMalen(stift, ort, zufall);
  seenMalen(stift, ort, zufall);
  grasMalen(stift, ort, zufall);

  // Schatten unter allem, was herumsteht
  stift.fillStyle(0x170b2c, 0.4);
  for (const baum of ort.baeume ?? []) stift.fillEllipse(baum.x, baum.y, 120, 36);
  for (const kristall of ort.kristalle ?? []) stift.fillEllipse(kristall.x, kristall.y, 96, 26);
  if (ort.dunklerKristall) stift.fillEllipse(ort.dunklerKristall.x, ort.dunklerKristall.y, 96, 26);
  for (const stahl of ort.prismastahl ?? []) stift.fillEllipse(stahl.x, stahl.y, 100, 28);
  for (const fels of ort.felsen ?? []) stift.fillEllipse(fels.x, fels.y - 4, 170, 40);
  for (const haus of ort.haeuser ?? []) stift.fillEllipse(haus.x, haus.y, 260, 40);
}

// Malt jedes Bild einmal und merkt es sich unter einem Namen.
export function bilderErzeugen(szene) {
  if (szene.textures.exists('baum')) return;
  const stift = szene.add.graphics();
  const malen = (name, wie) => {
    wie(stift);
    stift.generateTexture(name, BILDER[name].breite, BILDER[name].hoehe);
    stift.clear();
  };
  malen('baum', baumMalen);
  malen('kristall-lila', (s) => kristallMalen(s, 0x8a5be0, 0xb99cf0));
  malen('kristall-blau', (s) => kristallMalen(s, 0x5b8fe0, 0x9cc0f2));
  malen('kristall-dunkel', (s) => kristallMalen(s, 0x2a2238, 0x4a4060));
  malen('prismastahl', prismastahlMalen);
  malen('felsen', felsenMalen);
  malen('haus', hausMalen);
  malen('schild', schildMalen);
  stift.destroy();
}

function bodenErzeugen(szene, schluessel, ort) {
  const name = `boden-${schluessel}`;
  if (!szene.textures.exists(name)) {
    const stift = szene.add.graphics();
    bodenMalen(stift, ort);
    stift.generateTexture(name, ort.breite, ort.hoehe);
    stift.destroy();
  }
  return name;
}

// ---------------------------------------------------------------- Aufbauen

// Stellt den Ort mit dem Kurznamen schluessel auf. Gibt alles zurück, was die
// Figur verdecken kann (Bäume und Häuser), damit es durchsichtig werden kann.
// Was weiter unten steht, verdeckt, was weiter oben steht: Darum bekommt jedes
// Bild als Tiefe sein y.
export function ortAufbauen(szene, schluessel) {
  const ort = ORTE[schluessel];
  bilderErzeugen(szene);
  szene.add.image(0, 0, bodenErzeugen(szene, schluessel, ort)).setOrigin(0).setDepth(-10);

  const verdecker = [];
  const stellen = (name, x, y, verdeckt = false) => {
    const { hoehe, fuss, breite } = BILDER[name];
    const bild = szene.add.image(x, y, name).setOrigin(0.5, fuss / hoehe).setDepth(y);
    if (verdeckt) verdecker.push({ bild, x, y, hoehe: fuss, halbeBreite: breite / 2 + 10 });
    return bild;
  };

  for (const baum of ort.baeume ?? []) stellen('baum', baum.x, baum.y, true);
  for (const haus of ort.haeuser ?? []) stellen('haus', haus.x, haus.y, true);
  (ort.kristalle ?? []).forEach((punkt, nummer) => {
    const bild = stellen(nummer % 2 === 0 ? 'kristall-lila' : 'kristall-blau', punkt.x, punkt.y);
    // Im Dorf ist der mittlere Kristall auf dem Platz besonders groß.
    if (ort.stil === 'dorf' && nummer === 2) bild.setScale(1.6);
  });
  for (const stahl of ort.prismastahl ?? []) stellen('prismastahl', stahl.x, stahl.y);
  for (const fels of ort.felsen ?? []) stellen('felsen', fels.x, fels.y);
  if (ort.dunklerKristall) stellen('kristall-dunkel', ort.dunklerKristall.x, ort.dunklerKristall.y);

  randAufbauen(ort, stellen);
  schilderAufstellen(szene, ort, stellen);
  return verdecker;
}

// Der Rand: dichte Bäume rund um den Ort, in der Mine Felsen.
// Wo ein Weg hinausführt, bleibt eine Lücke.
function randAufbauen(ort, stellen) {
  const zufall = wuerfel(3 + ort.breite);
  const name = ort.stil === 'mine' ? 'felsen' : 'baum';
  const frei = (seite, wert) =>
    ort.ausgaenge.some(
      (ausgang) => ausgang.seite === seite && Math.abs(wert - ausgang.mitte) < AUSGANG_BREITE / 2 + 50,
    );

  const schritt = ort.stil === 'mine' ? 130 : 115;
  for (let x = 0; x <= ort.breite; x += schritt) {
    if (ort.stil !== 'mine' && !frei('oben', x)) stellen(name, x + zufall() * 30, 105 + zufall() * 35, true);
    if (!frei('unten', x)) {
      stellen(name, x + zufall() * 30, ort.hoehe + (ort.stil === 'mine' ? 70 : 180) + zufall() * 30, true);
    }
  }
  for (let y = 260; y <= ort.hoehe; y += 130) {
    const hier = y + zufall() * 30;
    if (!frei('links', hier)) stellen(name, 10 + zufall() * 30, hier, true);
    const dort = y + zufall() * 30;
    if (!frei('rechts', dort)) stellen(name, ort.breite - 10 - zufall() * 30, dort, true);
  }
}

// An jedem Ausgang steht ein Schild mit dem Namen des nächsten Ortes.
function schilderAufstellen(szene, ort, stellen) {
  const grenzen = weltGrenzen(ort);
  for (const ausgang of ort.ausgaenge) {
    const punkt = hinterDemAusgang(ausgang, grenzen, 40);
    const quer = ausgang.seite === 'links' || ausgang.seite === 'rechts';
    const x = quer ? punkt.x : punkt.x + AUSGANG_BREITE / 2 + 30;
    const y = quer ? punkt.y - AUSGANG_BREITE / 2 - 10 : punkt.y;
    stellen('schild', x, y);
    const pfeil = { links: '← ', rechts: '', oben: '↑ ', unten: '↓ ' }[ausgang.seite];
    const ende = ausgang.seite === 'rechts' ? ' →' : '';
    szene.add
      .text(x, y - 70, `${pfeil}${ORTE[ausgang.nach].name}${ende}`, schrift(20, '#ffffff'))
      .setOrigin(ausgang.seite === 'rechts' ? 0.85 : ausgang.seite === 'links' ? 0.15 : 0.5, 0.5)
      .setPadding(10, 6)
      .setBackgroundColor('#5a3a2a')
      .setDepth(y + 1);
  }
}
