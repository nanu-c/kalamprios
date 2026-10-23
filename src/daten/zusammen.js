// Zu zweit spielen, auf zwei Geräten. Diese Datei gehört dir!
//
// So geht es: Beide gehen zum Lagerfeuer im Lila Dorf. Dort erscheint oben
// rechts der Knopf „Zu zweit“. Eine tippt darauf und dann auf „Spiel öffnen“. Dann zeigt das Spiel einen Code aus vier Kalamprios.
// Die andere tippt auf ihrem Gerät am Lagerfeuer auch auf „Zu zweit“, dann auf „Code
// eingeben“, und tippt dieselben vier Kalamprios an. Schon seid ihr verbunden.
// Jede spielt mit ihrem eigenen Spielstand weiter.
//
// codeBilder:      aus diesen Kalamprios (Kurznamen aus kalamprios.js) wird
//                  der Code gemacht. Es müssen mindestens 4 sein.
// codeLaenge:      so viele Kalamprios hat ein Code
// nahGenug:        so nah (in Pixeln) muss man bei der anderen stehen, um sie
//                  herauszufordern, zu tauschen oder ihr im Kampf zu helfen
// wildeZuZweit:    Wer zu zweit gegen ein wildes Kalamprio kämpft, macht es
//                  stärker: Es hat so viel mal mehr Lebenspunkte. 1 ist gleich
//                  stark, 1.6 bedeutet 1,6-mal so viele Lebenspunkte.
// zuZweitImKampf:  so viele Kalamprios darf jede in einen Kampf zu zweit mitnehmen
// saetze:          was das Spiel sagt. {name} wird durch den Namen der
//                  anderen Figur ersetzt, {ort} durch den Namen eines Ortes.

export const ZUSAMMEN = {
  codeBilder: ['kalampria', 'bisakatze', 'qalutu', 'bolo', 'kabon', 'tschank', 'eulator', 'blitznara'],
  codeLaenge: 4,
  nahGenug: 260,
  wildeZuZweit: 1.6,
  zuZweitImKampf: 3,

  saetze: {
    verbunden: 'Juhu! Du spielst jetzt mit {name} zusammen.',
    getrennt: 'Die Verbindung zu {name} ist weg.',
    woanders: '{name} ist gerade hier: {ort}',
    herausfordern: '{name} fordert dich zu einem Freundschaftskampf heraus! Niemand muss sich danach erholen.',
    tauschen: '{name} möchte mit dir Kalamprios tauschen.',
    nein: '{name} möchte gerade nicht.',
    beschaeftigt: '{name} ist gerade beschäftigt. Versuch es gleich noch einmal!',
    keinKalamprio: 'Du brauchst erst ein Kalamprio, das kämpfen kann.',
    erKeinKalamprio: '{name} hat gerade kein Kalamprio, das kämpfen kann.',
    tauschFertig: 'Getauscht! {neu} ist jetzt in deinem Team.',
    nichtsZuTauschen: 'Ihr habt dieselben Kalamprios. Da gibt es nichts zu tauschen!',
    nurZuZweit: 'Das Freundschaftstor bleibt zu. Es öffnet sich nur, wenn ihr zu zweit davorsteht. Am Lagerfeuer gleich nebenan könnt ihr euch verbinden!',
    holDieAndere: 'Das Freundschaftstor bleibt zu. Es öffnet sich nur, wenn {name} auch hier davorsteht.',
    amFeuer: 'Am Lagerfeuer ist es schön warm. Hier wartest du auf {name}.',
    alleinZurueck: 'Ohne {name} kannst du hinter dem Freundschaftstor nicht bleiben. Ein warmer Wind trägt dich zurück ins Lila Dorf.',
  },
};
