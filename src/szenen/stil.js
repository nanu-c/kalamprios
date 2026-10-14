// Größe, Farben und Schrift, die alle Bildschirme gemeinsam benutzen.

export const BREITE = 1280;
export const HOEHE = 720;

export const FARBEN = {
  feld: 0x2a1650, // Hintergrund von Textfeldern
  rand: 0xa98bff, // Rahmen
  knopf: 0x4a2a8a,
  kpGut: 0x7be08a,
  kpMittel: 0xffd166,
  kpWenig: 0xff6b8b,
};

export function schrift(groesse, farbe = '#ffffff', extras = {}) {
  return {
    fontFamily: 'Fredoka, "Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    fontSize: `${groesse}px`,
    color: farbe,
    ...extras,
  };
}

// Macht aus einer Farbzahl wie 0xffe066 den Text '#ffe066', den Schriften brauchen.
export function farbeAlsText(farbe) {
  return `#${farbe.toString(16).padStart(6, '0')}`;
}
