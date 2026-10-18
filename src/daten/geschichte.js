// Die Geschichte von Kalamprios. Diese Datei gehört dir!
//
// Jeder Satz in Anführungszeichen ist ein Textfeld. Man tippt auf „Weiter“,
// dann kommt das nächste. Die Sätze sind Platzhalter. Schreib gern eigene!
//
// anfang: wird erzählt, bevor man seine Figur wählt
// orte:   flüstert der dunkle Kristall an diesem Ort. Der Name links ist
//         der Kurzname aus orte.js. Wo der Kristall steht, steht in der
//         Datei des Ortes bei dunklerKristall.
// ende:   wird bei der Party erzählt, wenn man das geheime Kalamprio
//         besiegt oder gefangen hat
// raetsel: was die Rätselsteine zwischendurch sagen, an jedem Ort gleich.
//         (nochEinRaetsel und richtig sagt der Rätselstein am Mondsee, wenn
//         man nach dem Lösen wiederkommt und zum Spaß weiterrät.)
//         Was sie am Anfang und am Ende sagen, steht in der Datei des Ortes
//         bei raetsel. {fehlen} wird durch die Zahl ersetzt, die noch fehlt.

export const GESCHICHTE = {
  anfang: [
    'Im Land der Kalamprios leuchten überall Kristalle. Ihr Licht färbt die Bäume lila und macht die Kalamprios froh.',
    'Doch seit ein paar Nächten wird ein Kristall nach dem anderen dunkel.',
    'Jemand stiehlt ihr Licht. Niemand weiß, wer es ist. Man sieht nur einen Schatten, der schnell davonhuscht.',
    'Du willst herausfinden, wer dahintersteckt, und das Licht zurückbringen.',
    'Allein ist das zu gefährlich. Aber zum Glück gibt es die Kalamprios!',
  ],

  orte: {
    lilaDorf: [
      'Ein dunkler Kristall. Ganz leise flüstert er: „Hilf mir …“',
      '„Heute Nacht war der Schatten hier. Er hat mein Licht getrunken und ist dann in den Kristallwald gelaufen.“',
      '„Folge ihm! Der Weg zum Wald beginnt am Rand des Dorfes.“',
    ],
    kristallwald: [
      '„Psst … hier drüben!“ flüstert ein dunkler Kristall.',
      '„Der Schatten hat im Wald viele von uns ausgetrunken. Die wilden Kalamprios sind ganz unruhig davon.“',
      '„Er ist weitergezogen, tief hinein in die Prismastahl-Mine.“',
    ],
    prismastahlMine: [
      'Zwischen dem glänzenden Prismastahl steht ein dunkler Kristall.',
      '„Ich habe den Schatten gesehen! Er war groß und schnell, und sein Licht war nicht sein eigenes.“',
      '„Er wollte zum Mondsee. Dort ist das Mondlicht am stärksten …“',
    ],
    mondsee: [
      'Am Ufer steht der letzte dunkle Kristall. Er zittert ein wenig.',
      '„Hier am Mondsee ist der Schatten verschwunden. Niemand weiß, wohin.“',
      '„Manche sagen, im Schilf versteckt sich etwas Geheimnisvolles … Ob es mit dem Schatten zu tun hat?“',
      '„Aber pass auf: Es ist sehr stark. Nur mit drei Kalamprios im Team kannst du es besiegen.“',
    ],
  },

  ende: [
    'Geschafft! Das geheime Kalamprio gibt auf. Und plötzlich strömt das gestohlene Licht aus ihm heraus.',
    'Überall im Land fangen die Kristalle wieder an zu leuchten, einer nach dem anderen.',
    'Der Schatten ist verschwunden. Die Kalamprios sind wieder froh, und alle feiern ein großes Fest.',
    'Danke, dass du das Licht zurückgebracht hast!',
  ],

  raetsel: {
    suchWeiter: '„Such weiter! Es fehlen noch {fehlen}.“',
    nurNochEins: '„Such weiter! Nur noch eins fehlt.“',
    nochmalZeigen: '„Schau noch einmal gut hin!“',
    falscheAntwort: '„Hmm, das stimmt nicht. Denk noch einmal nach!“',
    naechsteFrage: '„Richtig! Und jetzt das nächste Rätsel …“',
    gefunden: 'Gefunden!',
    jetztDu: 'Jetzt du!',
    falscherStein: 'Huch! Nochmal von vorn.',
    rundeGeschafft: 'Super! Die nächste Runde wird länger.',
    nochEinRaetsel: '„Schön, dass du wieder da bist! Möchtest du noch ein Rätsel hören?“',
    richtig: '„Richtig! Das hast du toll gemacht.“',
  },
};
