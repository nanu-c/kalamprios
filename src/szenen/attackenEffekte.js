// Die Animationen der Attacken. Jedes Element hat seinen eigenen Effekt.
// Starke Attacken (mit Pause) sind größer und lassen den Bildschirm aufblitzen.
//
// Jeder Effekt bekommt:
//   szene: der Kampfbildschirm
//   von:   die Mitte des Angreifers { x, y }
//   nach:  die Mitte des Getroffenen { x, y }
//   stark: true bei einer starken Attacke
// und gibt ein Versprechen (Promise) zurück, das im Moment des Treffers fertig ist.

const VORNE = 1000; // Effekte liegen über den Kalamprios

// ----------------------------------------------------------------- Helfer

function tween(szene, einstellungen) {
  return new Promise((fertig) => szene.tweens.add({ ...einstellungen, onComplete: fertig }));
}

function warten(szene, millisekunden) {
  return new Promise((fertig) => szene.time.delayedCall(millisekunden, fertig));
}

function zufall(min, max) {
  return min + Math.random() * (max - min);
}

// Lässt etwas verblassen und danach verschwinden.
function ausblenden(szene, ziele, dauer = 300, extras = {}) {
  szene.tweens.add({
    targets: ziele,
    alpha: 0,
    duration: dauer,
    ...extras,
    onComplete: () => [].concat(ziele).forEach((ziel) => ziel.destroy()),
  });
}

// Ein Ring, der am Ziel größer wird und verblasst.
function ring(szene, ort, farbe, groesse = 120, dicke = 6) {
  const kreis = szene.add.circle(ort.x, ort.y, 20).setStrokeStyle(dicke, farbe).setDepth(VORNE);
  ausblenden(szene, kreis, 450, { scale: groesse / 20 });
}

// Viele kleine Punkte, die vom Ziel wegspritzen.
function funken(szene, ort, farbe, anzahl = 10, weite = 110) {
  for (let i = 0; i < anzahl; i += 1) {
    const winkel = zufall(0, Math.PI * 2);
    const punkt = szene.add.circle(ort.x, ort.y, zufall(4, 8), farbe).setDepth(VORNE);
    ausblenden(szene, punkt, zufall(300, 550), {
      x: ort.x + Math.cos(winkel) * zufall(weite * 0.4, weite),
      y: ort.y + Math.sin(winkel) * zufall(weite * 0.4, weite),
      scale: 0.3,
    });
  }
}

// Mehrere Dinge nacheinander vom Angreifer zum Ziel fliegen lassen.
async function schwarm(szene, von, nach, anzahl, machen, dauer = 380, abstand = 70, streuung = 50) {
  const fluege = [];
  for (let i = 0; i < anzahl; i += 1) {
    const ding = machen(i).setPosition(von.x, von.y).setDepth(VORNE);
    const ziel = { x: nach.x + zufall(-streuung, streuung), y: nach.y + zufall(-streuung, streuung) };
    fluege.push(
      tween(szene, { targets: ding, x: ziel.x, y: ziel.y, delay: i * abstand, duration: dauer, ease: 'Quad.easeIn' }).then(
        () => ausblenden(szene, ding, 180, { scale: 1.6 }),
      ),
    );
  }
  await fluege[Math.min(1, fluege.length - 1)];
  return Promise.all(fluege);
}

// ---------------------------------------------------------------- Effekte

const EFFEKTE = {
  // Ein heller Mondstrahl und Ringe
  async mond(szene, von, nach, stark) {
    const dicke = stark ? 34 : 18;
    const strahl = szene.add
      .rectangle(von.x, von.y, 1, dicke, 0xe6dcff, 0.9)
      .setOrigin(0, 0.5)
      .setRotation(Math.atan2(nach.y - von.y, nach.x - von.x))
      .setDepth(VORNE);
    const kern = szene.add
      .rectangle(von.x, von.y, 1, dicke * 0.35, 0xffffff)
      .setOrigin(0, 0.5)
      .setRotation(strahl.rotation)
      .setDepth(VORNE);
    const laenge = Math.hypot(nach.x - von.x, nach.y - von.y);
    await tween(szene, { targets: [strahl, kern], scaleX: laenge, duration: 260, ease: 'Cubic.easeOut' });
    for (let i = 0; i < (stark ? 3 : 1); i += 1) {
      szene.time.delayedCall(i * 120, () => ring(szene, nach, 0xc9b8ff, stark ? 200 : 130));
    }
    ausblenden(szene, [strahl, kern], 350);
  },

  // Ein zuckender Blitz
  async elektro(szene, von, nach, stark) {
    const blitze = stark ? 3 : 1;
    for (let b = 0; b < blitze; b += 1) {
      const stift = szene.add.graphics().setDepth(VORNE);
      const punkte = [von];
      const teile = 8;
      for (let i = 1; i < teile; i += 1) {
        punkte.push({
          x: von.x + ((nach.x - von.x) * i) / teile + zufall(-20, 20),
          y: von.y + ((nach.y - von.y) * i) / teile + zufall(-45, 45),
        });
      }
      punkte.push(nach);
      for (const [breite, farbe] of [[stark ? 16 : 10, 0xfff3a0], [4, 0xffffff]]) {
        stift.lineStyle(breite, farbe, 0.95);
        stift.beginPath();
        stift.moveTo(punkte[0].x, punkte[0].y);
        for (const punkt of punkte.slice(1)) stift.lineTo(punkt.x, punkt.y);
        stift.strokePath();
      }
      funken(szene, nach, 0xffe066, stark ? 14 : 8);
      await warten(szene, 90);
      ausblenden(szene, stift, 160);
    }
  },

  // Kristallsplitter fliegen los
  async kristall(szene, von, nach, stark) {
    await schwarm(szene, von, nach, stark ? 9 : 5, (i) => {
      const groesse = stark ? 30 : 22;
      return szene.add
        .triangle(0, 0, 0, groesse * 2, groesse / 2, 0, groesse, groesse * 2, i % 2 ? 0x8ef0ff : 0xc9b8ff)
        .setRotation(Math.atan2(nach.y - von.y, nach.x - von.x) + Math.PI / 2);
    }, 320, 55);
    funken(szene, nach, 0x8ef0ff, 12);
    ring(szene, nach, 0x8ef0ff, 140, 4);
  },

  // Glänzende Klingen in Regenbogenfarben
  async prismastahl(szene, von, nach, stark) {
    const farben = [0xff9ad5, 0xffe066, 0x8ef0ff, 0xb8c4d9];
    await schwarm(szene, von, nach, stark ? 6 : 3, (i) =>
      szene.add.rectangle(0, 0, 70, 10, farben[i % farben.length]).setStrokeStyle(2, 0xffffff), 300, 80, 30);
    for (let i = 0; i < 2; i += 1) {
      const schnitt = szene.add
        .rectangle(nach.x, nach.y, 200, 6, 0xffffff)
        .setRotation(i ? 0.7 : -0.7)
        .setDepth(VORNE);
      ausblenden(szene, schnitt, 300, { scaleX: 1.5 });
    }
  },

  // Wirbelnde Blätter
  async pflanze(szene, von, nach, stark) {
    await schwarm(szene, von, nach, stark ? 10 : 6, (i) => {
      const blatt = szene.add.ellipse(0, 0, 30, 14, i % 2 ? 0x7be08a : 0x4fae6a);
      szene.tweens.add({ targets: blatt, rotation: Math.PI * 4, duration: 600 });
      return blatt;
    }, 420, 50, 60);
    funken(szene, nach, 0x7be08a, 8);
  },

  // Dunkler Rauch hüllt den Gegner ein
  async schatten(szene, von, nach, stark) {
    await schwarm(szene, von, nach, stark ? 7 : 4, () => szene.add.circle(0, 0, 28, 0x3a2a5c, 0.9).setStrokeStyle(3, 0x8d7bc4), 420, 60, 30);
    for (let i = 0; i < (stark ? 9 : 6); i += 1) {
      const rauch = szene.add
        .circle(nach.x + zufall(-70, 70), nach.y + zufall(-80, 60), zufall(30, 50), 0x241a3a, 0.8)
        .setDepth(VORNE);
      ausblenden(szene, rauch, zufall(500, 800), { scale: 1.6, y: rauch.y - 40 });
    }
  },

  // Felsbrocken fallen von oben auf den Gegner
  async stein(szene, von, nach, stark) {
    const brocken = stark ? 5 : 3;
    const faelle = [];
    for (let i = 0; i < brocken; i += 1) {
      const x = nach.x + zufall(-60, 60);
      const fels = szene.add.circle(x, -60, zufall(22, stark ? 40 : 30), 0x8a7a66).setStrokeStyle(4, 0x5a4f44).setDepth(VORNE);
      faelle.push(
        tween(szene, { targets: fels, y: nach.y + zufall(-30, 40), delay: i * 110, duration: 380, ease: 'Quad.easeIn' }).then(() => {
          szene.cameras.main.shake(80, 0.004);
          funken(szene, { x: fels.x, y: fels.y }, 0xc2a888, 6, 80);
          ausblenden(szene, fels, 200);
        }),
      );
    }
    await faelle[0];
  },

  // Windwirbel fegen über das Feld
  async luft(szene, von, nach, stark) {
    await schwarm(szene, von, nach, stark ? 6 : 3, () => {
      const wirbel = szene.add.arc(0, 0, 40, 30, 300, false).setStrokeStyle(6, 0xdff6ff, 0.9);
      szene.tweens.add({ targets: wirbel, rotation: -Math.PI * 6, duration: 700 });
      return wirbel;
    }, 450, 70, 40);
    for (let i = 0; i < 4; i += 1) {
      const strich = szene.add
        .rectangle(nach.x - 120, nach.y + zufall(-70, 70), 80, 4, 0xffffff, 0.8)
        .setDepth(VORNE);
      ausblenden(szene, strich, 350, { x: nach.x + 140 });
    }
  },

  // Blasen und ein Spritzer
  async wasser(szene, von, nach, stark) {
    await schwarm(szene, von, nach, stark ? 12 : 7, () =>
      szene.add.circle(0, 0, zufall(10, stark ? 24 : 18), 0x5ec8ff, 0.7).setStrokeStyle(3, 0xd8f4ff), 380, 45, 40);
    funken(szene, nach, 0x8ec8ff, stark ? 16 : 10, 130);
    ring(szene, nach, 0x5ec8ff, 150, 5);
  },

  // Das geheime Kalamprio: ein pinker Sternenregen
  async geheim(szene, von, nach, stark) {
    await schwarm(szene, von, nach, stark ? 10 : 6, (i) =>
      szene.add.star(0, 0, 5, 8, 20, i % 2 ? 0xff6fcf : 0xffe066), 400, 50, 60);
    funken(szene, nach, 0xff6fcf, 14, 140);
    ring(szene, nach, 0xff6fcf, 180, 6);
  },
};

// Spielt den passenden Effekt. Unbekannte Elemente bekommen den Mond-Effekt.
export async function attackeAnimieren(szene, element, von, nach, stark) {
  if (stark) szene.cameras.main.flash(200, 255, 255, 255);
  const effekt = EFFEKTE[element] ?? EFFEKTE.mond;
  await effekt(szene, von, nach, stark);
}
