// Der Mondsee: ein großer See im Mondlicht, der letzte Ort.
// Diese Datei gehört dir! Was die Angaben bedeuten, steht oben in kristallwald.js.
// Am See ist das hohe Gras Schilf.
// Der See ist gemalt (Landschaft/Mondsee.jpg): mit Steinen am Ufer, Seerosen,
// Blüten und dem Mond, der sich in der Mitte spiegelt.

export const MONDSEE = {
  name: 'Mondsee',
  stil: 'see',
  breite: 3120,
  hoehe: 2080,

  ausgaenge: [{ nach: 'prismastahlMine', seite: 'links', mitte: 650 }],

  // Am Ufer steigen Blasen auf: Hier kann man in den See tauchen. Das geht
  // nur, wenn man das Lungenkraut gefunden hat (braucht). Ohne hört man ohne.
  tueren: [
    {
      x: 925,
      y: 1140,
      nach: 'unterwasser',
      art: 'tauchplatz',
      braucht: 'lungenkraut',
      ankunft: { x: 820, y: 1140 },
      ohne: 'Das Wasser ist tief und dunkel. Ohne Luft kannst du hier nicht tauchen. Vielleicht wächst irgendwo ein Kraut, mit dem man unter Wasser atmen kann?',
    },
  ],

  // Besondere Dinge, die man nur einmal findet. Sie kommen in den Beutel.
  besonderes: [
    {
      art: 'lungenkraut',
      name: 'Lungenkraut',
      x: 2560,
      y: 1900,
      info: 'Damit kannst du unter Wasser atmen.',
      satz: 'Du hast ein Lungenkraut gefunden! Seine Blätter sind voller kleiner Luftbläschen. Damit kannst du unter Wasser atmen. Am Ufer des Sees steigen Blasen auf: Dort kannst du tauchen!',
    },
  ],

  // Hier flüstert der dunkle Kristall die Geschichte (Sätze in geschichte.js)
  dunklerKristall: { x: 620, y: 830 },

  // Das alte Bootshaus am Ufer: Hier hat ein alter Fischer früher Boote
  // repariert und an Maschinen für den See getüftelt. Auf seiner Werkbank
  // liegen noch die Baupläne (szenen/erfindung.js). x und y: wo das Bootshaus
  // steht. Jede Maschine ist halbfertig. Man setzt die fehlenden Teile ein, drückt
  // auf „Los!“, und eine Kugel stößt ein Teil nach dem anderen an.
  // Die Pläne kommen nacheinander dran, jeder ist ein bisschen schwerer.
  //   start:    wo die Kugel am Anfang wartet (auf dem Bildschirm, 1280 mal 720)
  //   schritte: die Teile der Maschine, der Reihe nach. teil ist 'rampe',
  //             'wippe', 'domino', 'feder' oder 'trichter'. Mit slot: true ist
  //             der Platz leer, und man muss das Teil selbst einsetzen.
  //             Der letzte Schritt ist das ziel: 'baum', 'eimer' oder 'futter'.
  //   teile:    was in der Kiste liegt. Es dürfen auch falsche Teile dabei
  //             sein: 'kissen' oder 'loeffel'.
  //   belohnung: was man beim ersten Mal bekommt: fangkristalle, oder eine
  //             sache (Kurzname aus dem Beutel) mit anzahl. bild und text
  //             zeigt das Spiel dabei groß an.
  werkbank: {
    x: 1850,
    y: 1700,
    satz: 'Das alte Bootshaus des Fischers. Hier hat er früher Boote repariert und Maschinen für den See erfunden. Auf seiner Werkbank liegen noch die Baupläne, aber fertig gebaut hat er sie nie …',
    alleFertig: 'Alle Maschinen des alten Fischers laufen! Du bist ein echtes Erfinder-Genie. Willst du eine noch einmal laufen lassen?',
    erfindungen: [
      {
        name: 'Der Mondbeeren-Schüttler',
        aufgabe: 'Die Mondbeeren hängen zu hoch! Baue die Maschine fertig: Die Kugel soll den Baum anstoßen.',
        start: { x: 190, y: 180 },
        schritte: [
          { teil: 'rampe', x: 330, y: 270, slot: true },
          { teil: 'wippe', x: 560, y: 440, slot: true },
          { ziel: 'baum', x: 900, y: 520 },
        ],
        teile: ['wippe', 'kissen', 'rampe'],
        geschafft: 'Rums! Der Baum wackelt, und die Mondbeeren purzeln in den Korb!',
        belohnung: { sache: 'mondbeeren', anzahl: 3, bild: 'mondbeeren', text: '+3 Mondbeeren' },
      },
      {
        name: 'Der Seerosen-Gießer',
        aufgabe: 'Die kleine Seerose hat Durst. Die Kugel soll den Eimer anstoßen, damit er Wasser über sie kippt.',
        start: { x: 170, y: 170 },
        schritte: [
          { teil: 'rampe', x: 280, y: 260, slot: true },
          { teil: 'domino', x: 530, y: 350, slot: true },
          { teil: 'rampe', x: 790, y: 410, slot: true },
          { ziel: 'eimer', x: 980, y: 480 },
        ],
        teile: ['domino', 'feder', 'rampe', 'kissen', 'rampe'],
        geschafft: 'Platsch! Der Eimer kippt, und die Seerose blüht auf!',
        belohnung: { sache: 'seerosensamen', anzahl: 2, bild: 'samen-seerosensamen', text: '+2 Seerosensamen' },
      },
      {
        name: 'Der Futterautomat für den Mondfisch',
        aufgabe: 'Der Mondfisch hat Hunger! Die Kugel soll unten auf die Futterklappe fallen. Aber erst muss sie ganz nach oben …',
        start: { x: 200, y: 330 },
        schritte: [
          { teil: 'feder', x: 240, y: 480, slot: true },
          { teil: 'rampe', x: 470, y: 250, slot: true },
          { teil: 'domino', x: 700, y: 330, slot: true },
          { teil: 'trichter', x: 900, y: 400, slot: true },
          { ziel: 'futter', x: 940, y: 490 },
        ],
        teile: ['trichter', 'loeffel', 'rampe', 'feder', 'kissen', 'domino'],
        geschafft: 'Die Klappe geht auf, das Futter rieselt ins Wasser … und der Mondfisch springt vor Freude!',
        belohnung: { fangkristalle: 4, bild: 'fangkristall', text: '+4 Fangkristalle' },
      },
    ],
  },

  // Die Flaschenpost: Am Ufer treibt eine Flasche mit einem Brief vom letzten
  // Mondfisch. Der See ist krank, und er traut sich nicht mehr hervor. Drei
  // Dinge machen ihn wieder gesund:
  //   - den Müll unter Wasser einsammeln (die Aufgabe der alten Muschel in unterwasser.js)
  //   - die verirrten Frösche (froesche) zur Froschbucht (bucht) zurückbringen:
  //     Wer einen findet, dem hüpft er hinterher
  //   - das quietschende Wasserrad (wasserrad) ölen. Dafür braucht es das
  //     Ölkännchen (braucht), das in der Prismastahl-Mine liegt
  // Zu jeder Aufgabe gibt es einen Naturtipp (tipp). Ist alles geschafft,
  // zeigt sich der Mondfisch, und es gibt eine Belohnung.
  flaschenpost: {
    flasche: { x: 1450, y: 1770 },
    brief: [
      'Am Ufer schaukelt eine Flasche im Wasser. Darin steckt ein eingerollter Brief!',
      '„Hallo, wer auch immer das hier findet! Ich bin der letzte Mondfisch im Mondsee.“',
      '„Mein See ist krank. Überall treibt Müll, die Frösche haben sich verirrt, und ein altes Wasserrad quietscht so laut, dass ich mich nicht mehr hervortraue.“',
      '„Bitte hilf mir! Wenn der See wieder gesund ist, komm hierher zurück. Dann zeige ich mich. Dein Mondfisch“',
    ],
    nochZuTun: 'Der Mondfisch traut sich noch nicht hervor. Noch zu tun:',
    aufgaben: {
      muell: 'den Müll unter Wasser einsammeln',
      froesche: 'die verirrten Frösche zur Froschbucht bringen',
      wasserrad: 'das quietschende Wasserrad ölen',
    },
    muellOrt: 'unterwasser',

    bucht: { x: 2400, y: 1150 },
    froesche: [
      { x: 330, y: 1700 },
      { x: 2720, y: 430 },
      { x: 1150, y: 300 },
      { x: 2600, y: 1780 },
    ],
    froschGefunden: 'Quak! Ein kleiner Frosch hat sich verirrt. Er hüpft dir hinterher. Bring ihn zur Froschbucht!',
    froschDaheim: 'Quak, quak! Der Frosch springt auf ein Seerosenblatt. Hier ist er zu Hause.',
    froescheTipp:
      'Alle Frösche sind wieder zu Hause! Naturtipp: Frösche brauchen ein Ufer mit vielen Pflanzen. Dort legen sie ihren Laich ab, und daraus schlüpfen Kaulquappen.',

    wasserrad: { x: 1560, y: 500 },
    braucht: 'oelkanne',
    wasserradLaut: 'Das alte Wasserrad quietscht fürchterlich! Kein Wunder, dass sich die Tiere erschrecken. Mit ein bisschen Öl wäre es leise. Die Bergleute in der Mine hatten bestimmt Öl …',
    wasserradTipp:
      'Du ölst das Wasserrad, und es dreht sich ganz leise. Endlich Ruhe! Naturtipp: Lärm stresst Tiere. Viele Fische und Vögel verstecken sich, wenn es zu laut ist, und finden dann kein Futter.',
    muellTipp: 'Naturtipp: Plastik verrottet im Wasser fast nie. Fische und Vögel halten kleine Stücke für Futter, und davon werden sie krank.',

    mondfisch: [
      'Plötzlich blubbert es im Wasser … und ein silberner Fisch springt glitzernd heraus! Das ist der Mondfisch!',
      '„Danke, danke! Der Müll ist weg, die Frösche quaken wieder, und es ist endlich still. Mein See ist wieder gesund!“',
      '„Jetzt traue ich mich wieder hervor. Hier, für dich! Und komm mich bald besuchen.“',
    ],
    belohnung: { fangkristalle: 6 },
    besuch: 'Der Mondfisch springt fröhlich aus dem Wasser und winkt dir mit der Flosse.',
  },

  wildeKalamprios: [
    { art: 'bolo', x: 680, y: 1140 },
    { art: 'mola', x: 1820, y: 390 },
    { art: 'bolo', x: 2700, y: 1300 },
    { art: 'mola', x: 1620, y: 1920 },
    { art: 'taktik', x: 2920, y: 1360 },
    { art: 'blitznara', x: 2250, y: 560 },
    { art: 'elefantia', x: 2500, y: 1500 },
    { art: 'zetarata', x: 900, y: 350 },
    { art: 'robossor', x: 2380, y: 1960 },
  ],

  // Am Mondsee sind die wilden Kalamprios stärker.
  wildesLevel: 3,

  tiereImGras: ['bolo', 'mola', 'taktik', 'blitznara', 'elefantia', 'zetarata', 'robossor'],
  hohesGras: [
    { links: 230, oben: 1460, breite: 570, hoehe: 390 },
    { links: 2440, oben: 310, breite: 520, hoehe: 360 },
    { links: 2240, oben: 1640, breite: 620, hoehe: 360 },
  ],

  // Das geheime Kalamprio versteckt sich im Schilf.
  // chance: 0.04 bedeutet: 4 von 100 Begegnungen im Schilf.
  // spaetestensNach: 3 bedeutet: Nach höchstens 3 anderen Kalamprios im
  // Schilf kommt es ganz sicher. Danach wird wieder von vorn gezählt.
  geheimesImGras: { art: 'geheimnis', chance: 0.04, spaetestensNach: 3 },

  // Das gemalte Bild ist 1300 mal 1086 Pixel groß. Damit es nicht verzerrt
  // wird, sollte breite geteilt durch hoehe ungefähr 1.2 sein.
  // Über dem See liegt leichter Nebel.
  nebel: 0.5,

  seen: [{ x: 1620, y: 1140, breite: 1350, hoehe: 1120, bild: 'mondsee' }],

  baeume: [
    { x: 430, y: 390 },
    { x: 1300, y: 380 },
    { x: 2210, y: 360 },
    { x: 340, y: 1360 },
    { x: 2860, y: 990 },
    { x: 2830, y: 1790 },
    { x: 1000, y: 620 },
    { x: 2560, y: 1060 },
    { x: 1110, y: 1950 },
  ],

  kristalle: [
    { x: 810, y: 550 },
    { x: 2910, y: 730 },
    { x: 1300, y: 1900 },
    { x: 910, y: 1920 },
  ],

  zutaten: [
    { art: 'mondbeeren', x: 520, y: 560 },
    { art: 'mondbeeren', x: 2700, y: 600 },
  ],

  saatgut: [
    { art: 'seerosensamen', x: 610, y: 600 },
  ],

  fangkristalle: [
    { x: 2660, y: 810 },
    { x: 2080, y: 1900 },
  ],

  // Das Rätsel: Rätselfragen. Bei jedem Versuch stellt der Rätselstein
  // andere Fragen, durcheinander aus der Liste bei fragen. Wer so viele
  // richtig beantwortet, wie bei wieViele steht, hat das Rätsel gelöst.
  // Die Antworten sollten kurz sein, sonst passen sie nicht auf die Knöpfe.
  // Die Antworten stehen auch in der Frage, damit sie mit vorgelesen werden.
  raetsel: {
    art: 'frage',
    x: 420,
    y: 750,
    aufgabe: [
      'Ein alter Rätselstein mit einem goldenen Fragezeichen. Er glitzert im Mondlicht.',
      '„Ich kenne viele Rätsel, und jedes Mal frage ich etwas anderes. Wenn du drei richtig beantwortest, bekommst du etwas Schönes.“',
    ],
    wieViele: 3,
    fragen: [
      {
        frage: '„Ich bin rund und leuchte in der Nacht. Im See siehst du mich gleich zweimal. Bin ich ein Stern, der Mond oder eine Laterne?“',
        antworten: ['Ein Stern', 'Der Mond', 'Eine Laterne'],
        richtig: 'Der Mond',
      },
      {
        frage: '„Was wird immer nasser, je mehr es trocknet: ein Fisch, der Regen oder ein Handtuch?“',
        antworten: ['Ein Fisch', 'Der Regen', 'Ein Handtuch'],
        richtig: 'Ein Handtuch',
      },
      {
        frage: '„Ich habe Zähne, aber ich beiße nie. Ich mache deine Haare schön. Bin ich ein Kamm, eine Gabel oder ein Hai?“',
        antworten: ['Ein Kamm', 'Eine Gabel', 'Ein Hai'],
        richtig: 'Ein Kamm',
      },
      {
        frage: '„Ich habe viele Blätter, aber ich bin kein Baum. Man kann mich lesen. Bin ich ein Buch, ein Salat oder eine Blume?“',
        antworten: ['Ein Buch', 'Ein Salat', 'Eine Blume'],
        richtig: 'Ein Buch',
      },
      {
        frage: '„Je mehr du von mir wegnimmst, desto größer werde ich. Bin ich ein Loch, ein Kuchen oder ein Berg?“',
        antworten: ['Ein Loch', 'Ein Kuchen', 'Ein Berg'],
        richtig: 'Ein Loch',
      },
      {
        frage: '„Ich habe Zeiger, aber keine Finger, und ich laufe, aber ich habe keine Beine. Bin ich eine Uhr, ein Hund oder ein Fluss?“',
        antworten: ['Eine Uhr', 'Ein Hund', 'Ein Fluss'],
        richtig: 'Eine Uhr',
      },
      {
        frage: '„Ich bin immer bei dir, aber du kannst mich nie fangen. Im Dunkeln verschwinde ich. Bin ich dein Schatten, dein Rucksack oder der Wind?“',
        antworten: ['Dein Schatten', 'Dein Rucksack', 'Der Wind'],
        richtig: 'Dein Schatten',
      },
      {
        frage: '„Ich falle vom Himmel, bin weiß und kalt, und in deiner warmen Hand schmelze ich. Bin ich Schnee, Zucker oder eine Feder?“',
        antworten: ['Schnee', 'Zucker', 'Eine Feder'],
        richtig: 'Schnee',
      },
      {
        frage: '„Ich habe einen Hals, aber keinen Kopf, und oft ist Wasser in mir. Bin ich eine Flasche, eine Giraffe oder ein Eimer?“',
        antworten: ['Eine Flasche', 'Eine Giraffe', 'Ein Eimer'],
        richtig: 'Eine Flasche',
      },
      {
        frage: '„Welches Kalamprio hat Flügel und schwebt über dem Boden: Mola, Kapapa oder Bolo?“',
        antworten: ['Mola', 'Kapapa', 'Bolo'],
        richtig: 'Mola',
      },
      {
        frage: '„Was gehört dir, aber andere benutzen es viel öfter als du: dein Name, dein Bett oder dein Teller?“',
        antworten: ['Dein Name', 'Dein Bett', 'Dein Teller'],
        richtig: 'Dein Name',
      },
      {
        frage: '„Wie viele Beine hat eine Spinne: sechs, acht oder zehn?“',
        antworten: ['Sechs', 'Acht', 'Zehn'],
        richtig: 'Acht',
      },
    ],
    geschafft: '„Richtig! Du bist wirklich klug. Hier, nimm diese Fangkristalle mit.“',
    belohnung: { fangkristalle: 3 },
  },
};
