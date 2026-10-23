// Die Bilder für die Flaschenpost am Mondsee: die Flasche, die Frösche, das
// Ölkännchen, das Wasserrad, die Seerosenblätter und den Mondfisch. Das Spiel
// malt sie selbst, mit einem dunklen, etwas wackeligen Strich außen herum wie
// die Klangsteine.

import { farbeAlsCss, STRICH, wackelstrich, wuerfel } from './raetsel.js';

function leinwandMalen(szene, name, breite, hoehe, malen) {
  if (szene.textures.exists(name)) return;
  const leinwand = szene.textures.createCanvas(name, breite, hoehe);
  const stift = leinwand.context;
  stift.lineJoin = 'round';
  stift.lineCap = 'round';
  malen(stift, wuerfel(name.length * 17 + breite));
  leinwand.refresh();
}

// Füllen und dann den dunklen Strich drumherum.
function umriss(stift, pfad, fuellung, dicke = 3.5) {
  pfad();
  stift.fillStyle = fuellung;
  stift.fill();
  pfad();
  stift.lineWidth = dicke;
  stift.strokeStyle = STRICH;
  stift.stroke();
}

export function seeBilderMalen(szene) {
  // Eine grüne Glasflasche mit Korken und einem eingerollten Brief darin
  leinwandMalen(szene, 'flaschenpost', 60, 100, (stift) => {
    const glas = stift.createLinearGradient(10, 0, 50, 0);
    glas.addColorStop(0, 'rgba(120, 210, 170, 0.85)');
    glas.addColorStop(0.4, 'rgba(200, 255, 230, 0.9)');
    glas.addColorStop(1, 'rgba(70, 160, 130, 0.85)');
    umriss(stift, () => {
      stift.beginPath();
      stift.moveTo(24, 10);
      stift.lineTo(36, 10);
      stift.lineTo(36, 30);
      stift.quadraticCurveTo(52, 36, 52, 52);
      stift.lineTo(52, 88);
      stift.quadraticCurveTo(52, 96, 44, 96);
      stift.lineTo(16, 96);
      stift.quadraticCurveTo(8, 96, 8, 88);
      stift.lineTo(8, 52);
      stift.quadraticCurveTo(8, 36, 24, 30);
      stift.closePath();
    }, glas);
    umriss(stift, () => {
      stift.beginPath();
      stift.roundRect(21, 2, 18, 12, 3);
    }, '#b07a4a');
    // der Brief
    umriss(stift, () => {
      stift.beginPath();
      stift.roundRect(18, 50, 24, 36, 5);
    }, '#fff3d6', 2.5);
    stift.strokeStyle = 'rgba(120, 90, 60, 0.7)';
    stift.lineWidth = 1.5;
    for (const y of [58, 64, 70, 76]) wackelstrich(stift, [[22, y], [38, y]], wuerfel(y), 1);
  });

  // Ein grüner Frosch mit großen Augen
  leinwandMalen(szene, 'frosch', 80, 64, (stift) => {
    for (const seite of [-1, 1]) {
      umriss(stift, () => {
        stift.beginPath();
        stift.ellipse(40 + seite * 24, 52, 16, 9, seite * 0.4, 0, Math.PI * 2);
      }, '#4fae5a', 3);
    }
    umriss(stift, () => {
      stift.beginPath();
      stift.ellipse(40, 40, 28, 20, 0, 0, Math.PI * 2);
    }, '#6cc86a');
    stift.fillStyle = '#c8f0a8';
    stift.beginPath();
    stift.ellipse(40, 48, 16, 9, 0, 0, Math.PI * 2);
    stift.fill();
    for (const seite of [-1, 1]) {
      umriss(stift, () => {
        stift.beginPath();
        stift.arc(40 + seite * 13, 20, 9, 0, Math.PI * 2);
      }, '#6cc86a', 3);
      stift.fillStyle = '#ffffff';
      stift.beginPath();
      stift.arc(40 + seite * 13, 20, 6, 0, Math.PI * 2);
      stift.fill();
      stift.fillStyle = STRICH;
      stift.beginPath();
      stift.arc(40 + seite * 13 + 1, 21, 3, 0, Math.PI * 2);
      stift.fill();
    }
    stift.strokeStyle = STRICH;
    stift.lineWidth = 2.5;
    stift.beginPath();
    stift.arc(40, 38, 10, 0.2 * Math.PI, 0.8 * Math.PI);
    stift.stroke();
  });

  // Ein altes Ölkännchen mit langer Tülle
  leinwandMalen(szene, 'oelkanne', 90, 80, (stift) => {
    umriss(stift, () => {
      stift.beginPath();
      stift.moveTo(56, 40);
      stift.lineTo(86, 14);
      stift.lineTo(88, 20);
      stift.lineTo(62, 48);
      stift.closePath();
    }, '#8f9bb8', 3);
    umriss(stift, () => {
      stift.beginPath();
      stift.ellipse(36, 52, 28, 22, 0, 0, Math.PI * 2);
    }, '#c84a3a');
    umriss(stift, () => {
      stift.beginPath();
      stift.roundRect(28, 22, 16, 12, 3);
    }, '#8f9bb8', 3);
    stift.strokeStyle = STRICH;
    stift.lineWidth = 4;
    stift.beginPath();
    stift.arc(16, 44, 14, Math.PI * 0.6, Math.PI * 1.5);
    stift.stroke();
    stift.fillStyle = 'rgba(255, 255, 255, 0.6)';
    stift.beginPath();
    stift.ellipse(28, 44, 8, 4, -0.5, 0, Math.PI * 2);
    stift.fill();
  });

  // Ein rundes Seerosenblatt mit Einschnitt, manchmal mit einer Blüte
  leinwandMalen(szene, 'seerosenblatt', 90, 50, (stift) => {
    umriss(stift, () => {
      stift.beginPath();
      stift.moveTo(45, 25);
      stift.ellipse(45, 25, 40, 20, 0, 0.25, Math.PI * 2 - 0.25);
      stift.closePath();
    }, '#4fae6a', 3);
    stift.strokeStyle = 'rgba(30, 80, 40, 0.5)';
    stift.lineWidth = 2;
    for (const winkel of [1, 2, 3, 4, 5]) wackelstrich(stift, [[45, 25], [45 + Math.cos(winkel) * 30, 25 + Math.sin(winkel) * 15]], wuerfel(winkel), 1);
  });

  // Das alte Wasserrad: Speichen und Schaufeln aus Holz
  leinwandMalen(szene, 'wasserrad', 180, 180, (stift) => {
    const mitte = 90;
    for (let i = 0; i < 8; i += 1) {
      const winkel = (i / 8) * Math.PI * 2;
      stift.strokeStyle = STRICH;
      stift.lineWidth = 9;
      stift.beginPath();
      stift.moveTo(mitte, mitte);
      stift.lineTo(mitte + Math.cos(winkel) * 70, mitte + Math.sin(winkel) * 70);
      stift.stroke();
      stift.strokeStyle = '#9a6a3a';
      stift.lineWidth = 5;
      stift.stroke();
      const x = mitte + Math.cos(winkel) * 76;
      const y = mitte + Math.sin(winkel) * 76;
      stift.save();
      stift.translate(x, y);
      stift.rotate(winkel);
      umriss(stift, () => {
        stift.beginPath();
        stift.roundRect(-8, -16, 16, 32, 3);
      }, '#b07a4a', 3);
      stift.restore();
    }
    umriss(stift, () => {
      stift.beginPath();
      stift.arc(mitte, mitte, 66, 0, Math.PI * 2);
      stift.arc(mitte, mitte, 58, 0, Math.PI * 2, true);
    }, '#8a5a2a', 3);
    umriss(stift, () => {
      stift.beginPath();
      stift.arc(mitte, mitte, 13, 0, Math.PI * 2);
    }, '#5a3a2a', 3);
  });

  // Der Mondfisch: silberblau, mit Schuppen, die wie Mondlicht glänzen
  leinwandMalen(szene, 'mondfisch', 130, 80, (stift, zufall) => {
    umriss(stift, () => {
      stift.beginPath();
      stift.moveTo(100, 40);
      stift.lineTo(126, 18);
      stift.lineTo(122, 40);
      stift.lineTo(126, 62);
      stift.closePath();
    }, '#9cc0f2');
    const leib = stift.createLinearGradient(0, 14, 0, 66);
    leib.addColorStop(0, '#e8f4ff');
    leib.addColorStop(0.5, '#a8c8ff');
    leib.addColorStop(1, '#6a8ad8');
    umriss(stift, () => {
      stift.beginPath();
      stift.ellipse(56, 40, 48, 26, 0, 0, Math.PI * 2);
    }, leib);
    stift.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    stift.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      const x = 40 + (i % 3) * 16 + zufall() * 4;
      const y = 30 + Math.floor(i / 3) * 10;
      stift.beginPath();
      stift.arc(x, y, 5, Math.PI * 0.1, Math.PI * 0.9);
      stift.stroke();
    }
    umriss(stift, () => {
      stift.beginPath();
      stift.moveTo(50, 16);
      stift.quadraticCurveTo(64, 2, 78, 18);
      stift.closePath();
    }, '#c8dcff', 2.5);
    stift.fillStyle = '#ffffff';
    stift.beginPath();
    stift.arc(26, 34, 7, 0, Math.PI * 2);
    stift.fill();
    stift.fillStyle = STRICH;
    stift.beginPath();
    stift.arc(25, 34, 3.5, 0, Math.PI * 2);
    stift.fill();
    stift.fillStyle = farbeAlsCss(0xff9ad5, 0.3);
    stift.beginPath();
    stift.ellipse(30, 46, 6, 3, 0, 0, Math.PI * 2);
    stift.fill();
  });
}
