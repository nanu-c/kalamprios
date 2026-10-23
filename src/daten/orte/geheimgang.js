// Der Geheimgang: sechs Kammern tief unter dem Kristallwald, jede mit einem
// Rätsel, und am Ende die Schatzkammer. Diese Datei gehört dir!
//
// Man findet ihn im Kristallwald: Dort steht ein Ring aus leuchtenden
// Pilzen (bei tueren in kristallwald.js). Wer sich in die Mitte stellt,
// findet die Treppe nach unten.
//
// Die Kammern sind Orte wie die anderen (was die Angaben bedeuten, steht oben
// in kristallwald.js). Der Weg in die nächste Kammer ist verschüttet, bis das
// Rätsel gelöst ist. Die Rätsel werden von Kammer zu Kammer schwerer.
//
// Diese Rätsel-Arten gibt es nur hier im Geheimgang:
//
//   'farben':   Farben mischen. Bei kessel steht ein Kessel, bei toepfe drei
//               Farbtöpfe (rot, gelb, blau). Man läuft über zwei Farbtöpfe,
//               dann mischt der Kessel die Farben. Bei runden stehen die
//               Farben, die man mischen soll: 'orange', 'gruen' oder 'lila'.
//   'stimmen':  Wer ruft da? Ein Kalamprio ruft, und man läuft auf das Bild
//               des Kalamprios, das so klingt. Bei platten stehen die Bilder,
//               bei muschel eine Muschel: Wer drüberläuft, hört den Ruf noch
//               einmal. runden: wie oft man richtig raten muss.
//   'paare':    Bilderpaare finden. Bei mitte steht die Mitte der Platten,
//               spalten mal reihen Platten liegen da (zusammen eine gerade Zahl).
//               Unter jeder Platte ist ein Kalamprio, jedes gibt es zweimal.
//               Läuft man über eine Platte, dreht sie sich um.
//   'weg':      Der unsichtbare Weg über den Abgrund. Ein Raster aus spalten
//               mal reihen Steinplatten (jede groesse Pixel groß, links oben
//               bei links und oben). Nur manche tragen. Der Weg leuchtet kurz
//               auf, dann muss man ihn sich merken.
//   'spiegel':  Ein Lichtstrahl aus der Pilzlampe soll den dunklen Kristall
//               treffen. Im Raster (spalten mal reihen Felder, jedes groesse
//               Pixel) stehen Spiegel. Läuft man über einen Spiegel, dreht er
//               sich: '/' oder '\\' (so schreibt man den Spiegel, der von
//               links oben nach rechts unten geht). Die Pilzlampe steht links
//               neben der Reihe startReihe, der Kristall rechts neben der
//               Reihe zielReihe.
//   'lichter':  Alle Lichter an! Läuft man über eine Platte, wechseln sie und
//               ihre Nachbarn (oben, unten, links, rechts) zwischen an und
//               aus. Bei runden steht, auf wie viele Platten das Spiel am
//               Anfang tritt, um sie durcheinanderzubringen: je mehr, desto
//               schwerer. Wer sich verlaufen hat, tritt auf den Neustart-Stein.
//
// Was die Rätselsteine sagen, wird vorgelesen. Wer hier einen Satz ändert,
// startet danach im Terminal `npm run stimmen`.

const KAMMER = { stil: 'gang', breite: 1800, hoehe: 1100, wildeKalamprios: [], tiereImGras: [], hohesGras: [] };

export const GEHEIMGANG_FARBEN = {
  ...KAMMER,
  name: 'Farbkammer',
  ausgaenge: [
    { nach: 'kristallwald', seite: 'links', mitte: 600 },
    { nach: 'geheimgangStimmen', seite: 'rechts', mitte: 600, erstNachRaetsel: true },
  ],
  kristalle: [{ x: 1600, y: 330 }, { x: 220, y: 980 }],
  raetsel: {
    art: 'farben',
    x: 360,
    y: 400,
    aufgabe: [
      'Ein Rätselstein! Er leuchtet in allen Farben. Neben ihm steht ein Kessel, und davor drei Farbtöpfe.',
      '„Willkommen im Geheimgang! Nur wer klug ist, kommt bis zur Schatzkammer.“',
      '„Über dem Kessel siehst du eine Farbe. Lauf über zwei Farbtöpfe, dann mischt der Kessel ihre Farben. Triffst du die Farbe, geht es weiter.“',
    ],
    kessel: { x: 950, y: 560 },
    toepfe: [
      { x: 700, y: 840, farbe: 'rot' },
      { x: 950, y: 920, farbe: 'gelb' },
      { x: 1200, y: 840, farbe: 'blau' },
    ],
    runden: ['orange', 'gruen', 'lila'],
    geschafft: '„Alle drei Farben gemischt! Du bist ein echter Farbzauberer. Der Weg in die nächste Kammer ist frei.“',
    belohnung: { fangkristalle: 1 },
  },
};

export const GEHEIMGANG_STIMMEN = {
  ...KAMMER,
  name: 'Rufkammer',
  ausgaenge: [
    { nach: 'geheimgangFarben', seite: 'links', mitte: 600 },
    { nach: 'geheimgangPaare', seite: 'rechts', mitte: 600, erstNachRaetsel: true },
  ],
  kristalle: [{ x: 1620, y: 980 }],
  raetsel: {
    art: 'stimmen',
    x: 360,
    y: 400,
    aufgabe: [
      'Ein Rätselstein mit einer großen Muschel daneben. Aus der Muschel kommt ein Ruf.',
      '„Hör gut hin! Welches Kalamprio ruft da? Lauf auf sein Bild.“',
      '„Wenn du den Ruf noch einmal hören willst, lauf über die Muschel.“',
    ],
    muschel: { x: 950, y: 420 },
    platten: [
      { x: 560, y: 780 },
      { x: 820, y: 780 },
      { x: 1080, y: 780 },
      { x: 1340, y: 780 },
    ],
    runden: 3,
    geschafft: '„Du hast wirklich gute Ohren! Die Kalamprios sind stolz auf dich. Geh weiter!“',
    belohnung: { fangkristalle: 1 },
  },
};

export const GEHEIMGANG_PAARE = {
  ...KAMMER,
  name: 'Bilderkammer',
  ausgaenge: [
    { nach: 'geheimgangStimmen', seite: 'links', mitte: 600 },
    { nach: 'geheimgangWeg', seite: 'rechts', mitte: 600, erstNachRaetsel: true },
  ],
  kristalle: [{ x: 1640, y: 320 }, { x: 240, y: 1000 }],
  raetsel: {
    art: 'paare',
    x: 330,
    y: 400,
    aufgabe: [
      'Ein Rätselstein vor zwölf Steinplatten. Unter jeder Platte schläft ein Kalamprio.',
      '„Lauf über eine Platte, dann dreht sie sich um. Jedes Kalamprio ist zweimal da. Findest du alle Paare?“',
      '„Drehst du zwei verschiedene um, legen sie sich wieder schlafen. Merk dir gut, wer wo liegt!“',
    ],
    mitte: { x: 1000, y: 650 },
    spalten: 4,
    reihen: 3,
    geschafft: '„Alle Paare gefunden! Was für ein Gedächtnis! Der Weg ist frei.“',
    belohnung: { fangkristalle: 1 },
  },
};

export const GEHEIMGANG_WEG = {
  ...KAMMER,
  name: 'Abgrund',
  breite: 1900,
  hoehe: 1000,
  ausgaenge: [
    { nach: 'geheimgangPaare', seite: 'links', mitte: 560 },
    { nach: 'geheimgangSpiegel', seite: 'rechts', mitte: 560, erstNachRaetsel: true },
  ],
  raetsel: {
    art: 'weg',
    x: 260,
    y: 360,
    aufgabe: [
      'Ein Rätselstein am Rand eines tiefen Abgrunds. Über den Abgrund führen Steinplatten.',
      '„Aber Vorsicht! Nur manche Platten tragen dich. Die anderen fallen in die Tiefe.“',
      '„Gleich leuchtet der sichere Weg auf. Merk ihn dir gut, und dann lauf hinüber!“',
    ],
    links: 520,
    oben: 180,
    spalten: 6,
    reihen: 5,
    groesse: 156,
    geschafft: '„Du hast es geschafft, ohne hinunterzufallen! Mutig und klug. Der Weg ist frei.“',
    belohnung: { fangkristalle: 1 },
  },
};

export const GEHEIMGANG_SPIEGEL = {
  ...KAMMER,
  name: 'Spiegelkammer',
  hoehe: 1150,
  ausgaenge: [
    { nach: 'geheimgangWeg', seite: 'links', mitte: 640 },
    { nach: 'geheimgangLichter', seite: 'rechts', mitte: 820, erstNachRaetsel: true },
  ],
  raetsel: {
    art: 'spiegel',
    x: 300,
    y: 380,
    aufgabe: [
      'Ein Rätselstein. Daneben strahlt eine Pilzlampe, und ganz hinten steht ein Kristall, dem der Schatten alle Farben ausgesaugt hat.',
      '„Wenn das Licht der Pilzlampe den Kristall trifft, bekommt er seine Farben zurück.“',
      '„Lauf über die Spiegel, dann drehen sie sich. Lenk den Lichtstrahl bis zum Kristall!“',
    ],
    links: 540,
    oben: 330,
    spalten: 7,
    reihen: 5,
    groesse: 140,
    startReihe: 4,
    zielReihe: 0,
    spiegel: [
      { spalte: 3, reihe: 4, stellung: '\\' },
      { spalte: 3, reihe: 1, stellung: '/' },
      { spalte: 1, reihe: 1, stellung: '\\' },
      { spalte: 1, reihe: 2, stellung: '/' },
      { spalte: 5, reihe: 2, stellung: '\\' },
      { spalte: 5, reihe: 0, stellung: '\\' },
      { spalte: 0, reihe: 1, stellung: '/' },
      { spalte: 4, reihe: 4, stellung: '/' },
      { spalte: 6, reihe: 3, stellung: '\\' },
    ],
    geschafft: '„Der Kristall leuchtet wieder in allen Farben! So bekommen wir das Licht zurück. Geh weiter, du bist fast da!“',
    belohnung: { fangkristalle: 2 },
  },
};

export const GEHEIMGANG_LICHTER = {
  ...KAMMER,
  name: 'Lichterkammer',
  ausgaenge: [
    { nach: 'geheimgangSpiegel', seite: 'links', mitte: 600 },
    { nach: 'schatzkammer', seite: 'rechts', mitte: 600, erstNachRaetsel: true },
  ],
  kristalle: [{ x: 1620, y: 320 }, { x: 1640, y: 990 }],
  raetsel: {
    art: 'lichter',
    x: 330,
    y: 400,
    aufgabe: [
      'Der letzte Rätselstein. Vor ihm liegen neun Lichtplatten, manche leuchten, manche sind dunkel.',
      '„Läufst du über eine Platte, wechseln sie und ihre Nachbarn: Was leuchtet, geht aus, und was dunkel ist, geht an.“',
      '„Mach alle Lichter an! Wenn du dich verläufst, tritt auf den Neustart-Stein. Es gibt zwei Runden, die zweite ist schwerer.“',
    ],
    mitte: { x: 980, y: 660 },
    neustart: { x: 420, y: 900 },
    runden: [3, 5],
    geschafft: '„Alle Lichter leuchten! Du hast alle Rätsel des Geheimgangs gelöst. Hinter mir liegt die Schatzkammer.“',
    belohnung: { fangkristalle: 2 },
  },
};

// Die Schatzkammer. Wer die Truhe öffnet, bekommt den Schatz: Fangkristalle,
// und jedes Kalamprio, das mit in den Kampf geht, bekommt so viel
// Erfahrung. Den Schatz gibt es nur einmal. Über die Treppe kommt man gleich zurück in den Kristallwald.
export const SCHATZKAMMER = {
  name: 'Schatzkammer',
  stil: 'gang',
  breite: 1500,
  hoehe: 1000,
  wildeKalamprios: [],
  tiereImGras: [],
  hohesGras: [],
  ausgaenge: [{ nach: 'geheimgangLichter', seite: 'links', mitte: 560 }],
  tueren: [{ x: 1250, y: 400, nach: 'kristallwald', art: 'treppe' }],
  kristalle: [{ x: 480, y: 330 }, { x: 1020, y: 330 }, { x: 330, y: 900 }, { x: 1180, y: 920 }],
  gold: [{ x: 600, y: 760 }, { x: 900, y: 790 }],
  schatz: {
    x: 750,
    y: 560,
    belohnung: { fangkristalle: 5, erfahrung: 10 },
    satz: 'Die Truhe springt auf! Sie ist voller Fangkristalle, und ein warmes Licht strahlt heraus. Die Kalamprios, die mit dir kämpfen, werden stärker!',
    leer: 'Die Truhe ist leer. Aber sie glitzert noch ein bisschen.',
  },
};
