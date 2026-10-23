# Kalamprios

Ein Spiel mit selbst gemalten Kalamprios, gebaut mit Phaser. Phaser ist kostenlos, es braucht kein Konto und keine Credits.

## Spiel starten

1. In VS Code oben im Menü auf **Terminal → Neues Terminal** klicken.
2. `npm run dev` eintippen und Enter drücken.
3. Im Browser <http://localhost:5173> öffnen.

Solange das Terminal läuft, lädt das Spiel bei jedem Speichern von selbst neu. Zum Beenden im Terminal **Strg + C** drücken.

## Online spielen

Das Spiel ist im Internet unter <https://nanu-c.github.io/kalamprios/>. Diesen Link kannst du deinen Freundinnen schicken.

Der Code liegt auf <https://github.com/nanu-c/kalamprios>. Sobald dort eine neue Version ankommt, prüft GitHub die Regeln, baut das Spiel und stellt es nach ein bis zwei Minuten online. Die Original-Fotos der Zeichnungen werden nicht hochgeladen.

## Diese Dateien gehören dir

| Datei | Was drinsteht |
|---|---|
| `src/daten/kalamprios.js` | alle Tiere mit ihren Werten |
| `src/daten/attacken.js` | alle Attacken mit Stärke, Pause und wie sie aussehen |
| `src/daten/elemente.js` | alle Elemente mit ihren Farben |
| `src/daten/charaktere.js` | die Figuren und was sie als Rivalin sagen, auch wenn sie die Kamera verschenken |
| `src/daten/geschichte.js` | die Geschichte: was am Anfang erzählt wird, was die dunklen Kristalle flüstern, was am Ende bei der Party erzählt wird und was die Rätselsteine zwischendurch sagen |
| `src/daten/orte.js` | alle Orte und wo das Spiel beginnt |
| `src/daten/orte/…` | ein Ort pro Datei (Lila Dorf, Kristallwald, Prismastahl-Mine, Mondsee): wo Häuser, Bäume, Pilze, Felsen, Gold, hohes Gras, Wege, Türen, Fangkristalle und wilde Kalamprios sind, und das Rätsel des Ortes |
| `src/daten/orte/geheimgang.js` | der Geheimgang: sechs Kammern mit Rätseln und die Schatzkammer |
| `src/daten/orte/unterwasser.js` | unter Wasser im Mondsee: Kalamprios, Seegras und die Müll-Aufgabe der alten Muschel |
| `src/daten/orte/regenwald.js` | der Regenwald hinter dem Portal: alle Pflanzen mit Namen und Notiz |
| `src/daten/orte/haus.js` | die Küche: Zutaten, Rezepte und was jedes Essen im Kampf bewirkt |
| `src/daten/orte/mondbluetental.js` | das Mondblütental hinter dem Freundschaftstor (nur zu zweit): Nachtblumen, Kalamprios, die Geschichte und das Rätsel „Blumenflüstern“ |
| `src/daten/orte/mondrosengarten.js` | der Garten der Mondrosen: das Rätsel „Rosentor“ und die Wolkentreppe hinauf zur Sternenwolke |
| `src/daten/orte/sternenwolke.js` | die Sternenwolke, die zweite Welt hoch oben am Himmel: das Rätsel mit den Sternplatten |
| `src/daten/orte/verschollenerStollen.js` | der verschollene Stollen tief in der Mine: das Spiegel-Rätsel und die Statue mit „Grüße von Mia“ |
| `src/daten/beet.js` | das Gartenbeet im Lila Dorf: welches Saatgut es gibt, was daraus wächst, wie langsam es wächst und wie wild es wird |
| `src/daten/zusammen.js` | zu zweit spielen: aus welchen Kalamprios der Code besteht, wie nah man beieinander sein muss, wie viel stärker wilde Kalamprios zu zweit sind, und was das Spiel dabei sagt |
| `src/daten/klaenge.js` | wie laut Musik und Geräusche sind, wie weit man Kalamprios rufen hört und wie jedes Kalamprio klingt |
| `src/daten/regeln.js` | Lauftempo, Erholungszeit, wie oft im Gras etwas auftaucht, wie oft eine Attacke danebengeht, ausgewichen oder abgewehrt wird, wie leicht man Kalamprios fängt, wie viel Erfahrung es für ein Level braucht, wie stark wilde Kalamprios und das geheime Kalamprio sind und wie viele Kalamprios mit in einen Kampf dürfen |

In jeder Datei steht oben erklärt, was die Angaben bedeuten. Wenn du dich vertippst, zeigt das Spiel einen Hinweis auf dem Bildschirm.

## So spielt man

1. Auf „Los geht’s!“ tippen, die Geschichte anhören (sie wird vorgelesen) oder überspringen, dann die Figur wählen. Die Figuren stehen auf einer Bühne im Scheinwerferlicht. Fährt man mit der Maus über eine, leuchtet sie heller.
   Das Spiel speichert sich alle paar Sekunden von selbst im Browser. Kommt man wieder, steht auf dem Startbildschirm „Weiterspielen“ und „Neues Spiel“. Bei „Neues Spiel“ fragt das Spiel nach, bevor es den Spielstand löscht. Der Spielstand gilt nur für diesen Browser auf diesem Gerät.
2. Das Spiel beginnt in einem chaotischen Kinderzimmer im gemalten Haus im Lila Dorf (`kinderzimmer` in `haus.js`). Ein Kalamprio hat man noch nicht. Laufen: mit den Pfeiltasten, mit W A S D oder indem man dorthin tippt. Unten geht es aus der Tür hinaus ins Dorf.

   Im Dorf steht die Rivalin am Weg zum Kristallwald und lässt niemanden vorbei. Sie hat Hunger auf Sternenpfannkuchen. Also: Honig im Dorf sammeln, in der Küche (im Haus mit dem blauen Dach) Sternenpfannkuchen kochen und zu ihr bringen. Als Dank schenkt sie einem das erste Kalamprio: Man sucht sich eins der Kalamprios mit `zumStart` aus, das andere behält sie. Dann geht sie in den Kristallwald, und der Weg ist frei (`erstNachGeschenk` beim Ausgang, `rivalinAmAnfang` in `lilaDorf.js`). Was sie sagt, steht in `charaktere.js`.
3. Am Rand führen Wege mit Schildern zum nächsten Ort: Lila Dorf → Kristallwald → Prismastahl-Mine → Mondsee.
4. Wilde Kalamprios laufen herum (im Kristallwald auch Tschank, Pflinia, Schnektata und Eulator, in der Mine Kristalta, Totantia und Zeittakel, am Mondsee Blitznara, Elefantia, Zetarata und Robossor), unter ihnen leuchtet ein Ring in der Farbe ihres Elements. Andere verstecken sich im hohen Gras (in der Mine im Geröll, am See im Schilf). Wer eines berührt, kämpft.
5. Die andere Figur wartet als Rivalin im Kristallwald, unten rechts vor dem Eingang zur Mine. Erst wenn man sie besiegt hat, darf man in die Mine (`erstNachRivalin` beim Ausgang). Mit nur einem Kalamprio kämpft sie gar nicht: Es müssen mindestens zwei mit in den Kampf kommen (`teamFuerRivalin` in `regeln.js`). Was sie dazu sagt, steht in `charaktere.js`. Wer sie zum ersten Mal besiegt, bekommt von ihr ihre Kamera geschenkt (siehe unten).
6. Nach einer Niederlage muss sich das Kalamprio kurz erholen.
7. Am Mondsee versteckt sich ein geheimes Kalamprio im Schilf. Spätestens nach drei anderen Kalamprios im Schilf taucht es auf. Es ist der Endgegner und hat Level 5 (`geheimesLevel` in `regeln.js`). Besiegen kann man es nur mit drei Kalamprios, die alle Level 3 haben (`teamFuerGeheimes` und `levelFuerGeheimes`), sonst schützt es ein Schild aus Licht. Mit drei Level-3-Kalamprios gewinnt man ungefähr 8 von 10 Kämpfen. Wer es besiegt oder fängt, hat das Spiel geschafft: Dann gibt es eine Party, und das Ende wird erzählt. Danach kann man mit „Weiterspielen“ am Mondsee weitermachen, Kalamprios fangen und trainieren. Die Party gibt es nur beim ersten Mal. Wer das geheime Kalamprio gefangen hat, trifft es nicht noch einmal.
8. An jedem Ort steht ein dunkler Kristall. Der Schatten hat ihm Licht und Farben ausgesaugt, darum ist er fast schwarz. Wer zu ihm geht, hört mehr über den Schatten, der das Licht stiehlt.
9. Man hat drei Fangkristalle dabei, weitere liegen in der Welt zum Aufsammeln. Im Kampf gegen ein wildes Kalamprio kann man einen werfen. Je schwächer das Kalamprio schon ist, desto eher klappt es. Gefangene Kalamprios kommen ins Team.
10. In einen Kampf dürfen höchstens drei Kalamprios mit (`imKampfHoechstens` in `regeln.js`). Mit dem Knopf „Team“ tippt man an, wer mitkommt; die Nummer zeigt die Reihenfolge, die 1 kämpft zuerst. Tippt man auf eines, das schon mitkommt, kämpft es zuerst. Mit dem × bleibt es da. Im Kampf kann man mit „Tauschen“ wechseln, das kostet einen Zug. Kann ein Kalamprio nicht mehr, kommt automatisch das nächste. Ein gefangenes Kalamprio kommt gleich mit, wenn noch Platz ist.
11. Kalamprios haben ein Level von 1 bis 3 (nur das geheime Kalamprio hat Level 5). Für jeden Sieg bekommen sie Erfahrung, so viel wie das Level des Gegners. Mit 5 Erfahrung kommt Level 2, mit 15 Level 3. Mit jedem Level wird ein Kalamprio viel stärker (`staerkeJeLevel` in `regeln.js`). Gegen ein wildes Level-3-Kalamprio braucht man darum mindestens zwei Kalamprios mit Level 2, und auch dann klappt es nicht immer. Mit dreien klappt es fast immer. Mit Level-1-Kalamprios schafft man es nie, auch nicht mit dreien. Nach einem Sieg sieht man, wie viel Erfahrung es bekommen hat und wie viel bis zum nächsten Level fehlt. Die wilden Kalamprios im Kristallwald haben Level 1 und sind ein kleines bisschen schwächer als deine (`wildeAufLevel1` in `regeln.js`), damit man am Anfang auch allein oft gewinnt. In der Mine haben sie Level 2, am Mondsee Level 3, die Rivalin ist so stark wie dein stärkstes Kalamprio.

    Nicht jede Attacke trifft richtig: Manchmal haut ein Kalamprio daneben, manchmal springt der Gegner zur Seite und weicht aus (wer schneller ist, weicht öfter aus), und manchmal wehrt er ab und bekommt nur die Hälfte ab. Wie oft das passiert, steht in `regeln.js`. Dort steht auch, wie viel jeder Treffer zählt (`schadenMal`): Je größer die Zahl, desto kürzer sind die Kämpfe.
12. **Unter Wasser:** Im Schilf am Mondsee wächst ein leuchtendes Lungenkraut. Wer es pflückt, kann unter Wasser atmen (es kommt in den Beutel). Am Ufer links steigen Blasen auf: Das ist der Tauchplatz. Ohne Lungenkraut geht es dort nicht weiter (`braucht` bei der Tür in `mondsee.js`). Unter Wasser sieht man den See von der Seite: Oben ist die Wasseroberfläche, unten der Sandboden mit Kristallen und Seegras. Man schwimmt hoch und runter, etwas langsamer als an Land (`schwimmTempo` in `regeln.js`), und aus der Figur steigen Luftblasen. Die Wasser-Kalamprios wohnen hier (Bolo, Elefantia, Robossor), im Seegras verstecken sich noch mehr. Ganz oben in der Mitte geht es zurück ans Ufer.

    Am Grund liegt eine alte Muschel. Überall im See liegt Müll: Plastikflaschen, Plastiktüten, Dosen und Joghurtbecher, darum ist das Wasser trüb. Wer alle acht Teile einsammelt und zur Muschel zurückkommt, bekommt Fangkristalle, und das Wasser wird klar und glitzert. Wo der Müll liegt und was die Muschel sagt, steht in `src/daten/orte/unterwasser.js`.
13. **Der Regenwald:** Ganz oben rechts im Kristallwald, versteckt in der Ecke, wirbelt ein grünes Portal. Von weitem sieht man es kaum, aus der Nähe leuchtet es. Es führt in einen dichten Regenwald: riesige Ceiba-Bäume mit Brettwurzeln und viele schlanke, moosige Stämme wachsen oben aus dem Bild hinaus, überall liegen Wurzeln und Laub, dazwischen Büsche, Farne und Lianen. Große Blätter rahmen den Bildschirm ein, Licht fällt durch das Blätterdach, es nieselt, Nebel zieht vorbei, und man hört Vögel, Frösche, Zikaden und Tropfen. Wo was steht, steht in `regenwald.js` (`riesenbaeume`, `staemme`, `wurzeln`, `buesche`, `lianen`, `laub`). Beim ersten Mal ist die Figur verwirrt und wundert sich, dann forscht sie wie eine Biologin. Am Boden liegt ein Pflanzenalbum. Mit der Kamera (von der Rivalin) fotografiert man die 12 Pflanzen. Die Fotos kommen ins Pflanzenalbum, dort steht unter jedem Foto eine Notiz über die Pflanze. Ist es voll, gibt es Fangkristalle. Tippt man auf das Album, fragt das Spiel, welches Album man ansehen will.

    Fotografieren geht hier wie mit einer echten Kamera: Man schaut durch den Sucher und stellt das Bild von Hand scharf. Wie man den Schärfering drehen muss, hängt davon ab, wie weit die Pflanze weg ist. Die Ecken in der Mitte werden grün, wenn es scharf ist. Ohne Touch: Mausrad oder ← → zum Scharfstellen, Leertaste oder Enter zum Auslösen, Esc zum Abbrechen. Mit Touch: mit dem Finger am Schärfering ziehen und auf den runden Auslöser tippen. Ein unscharfes Foto zählt nicht.

    Die Pflanzen, ihre Namen und Notizen stehen in `src/daten/orte/regenwald.js`. Gemalt hat sie (und den Baum, die Wurzeln, Büsche, Lianen und Blätter) eine OpenAI-Bild-KI: `.venv/bin/python werkzeuge/pflanzen_malen.py`.
14. In der Prismastahl-Mine ist es stockdunkel, nur ganz nah um die Figur ist es hell. Am Rand liegen gemalte Steine, deren Kristalle durch die Dunkelheit leuchten. Dort glitzert auch Gold. Der Weg zum Mondsee ist verschüttet und im Dunkeln nicht zu finden. Erst wenn man das Rätsel der Mine gelöst hat, rollen die Felsen weg (`erstNachRaetsel` beim Ausgang).
15. An jedem Ort steht ein Rätselstein mit einem goldenen Fragezeichen. Wer zu ihm geht, bekommt ein Rätsel:
    - Lila Dorf: drei goldene Glöckchen finden, die hinter Häusern und Bäumen liegen.
    - Kristallwald: Fünf bunte Klangsteine liegen auf einer Lichtung. Sie leuchten nacheinander auf und singen dabei. Dann läuft man in derselben Reihenfolge über sie. Es gibt drei Runden, jede ist länger (`runden` im Rätsel), und die Reihenfolge ist jedes Mal anders. Wer sich vertut, sieht die Runde noch einmal.
    - Prismastahl-Mine: drei Glühsteine im Dunkeln finden. Danach scheint das Licht um die Figur viel weiter, und der Weg zum Mondsee wird frei.
    - Mondsee: drei Rätselfragen beantworten. Der Rätselstein kennt viele und fragt jedes Mal andere (`wieViele` im Rätsel). Wer später wiederkommt, kann zum Spaß weiterraten.

    Als Belohnung gibt es Fangkristalle. Ist ein Rätsel gelöst, wird aus dem Fragezeichen ein Stern, und der Rätselstein wechselt zum gemalten „gelösten“ Stein. Er leuchtet und schimmert in seinen Farben. Wie man eigene Rätsel baut, steht oben in `src/daten/orte/kristallwald.js` bei `raetsel`.
16. **Der Geheimgang:** Ganz unten im Kristallwald steht ein Ring aus leuchtenden Pilzen. Wer sich in die Mitte stellt, findet eine geheime Treppe nach unten. Dort liegen sechs Kammern, jede mit einem neuen Rätsel, von leicht bis schwer:
    - Farbkammer: Über zwei Farbtöpfe laufen, damit der Kessel die richtige Farbe mischt (Orange, Grün, Lila).
    - Rufkammer: Aus der Muschel ruft ein Kalamprio. Man läuft auf das Bild des Kalamprios, das so klingt.
    - Bilderkammer: Bilderpaare finden. Unter zwölf Platten schlafen Kalamprios, jedes zweimal.
    - Abgrund: Über den Abgrund führt nur ein unsichtbarer Weg. Er leuchtet kurz auf, dann muss man ihn sich merken. Wer danebentritt, fällt und fängt vorn wieder an.
    - Spiegelkammer: Die Spiegel so drehen, dass das Licht der Pilzlampe den ausgesaugten Kristall trifft. Dann bekommt er seine Farben zurück.
    - Lichterkammer: Alle neun Lichter anmachen. Jede Platte schaltet auch ihre Nachbarn um.

    Hinter der letzten Kammer liegt die Schatzkammer. In der Truhe sind Fangkristalle, und alle Kalamprios im Team bekommen viel Erfahrung. Über die Treppe dort kommt man gleich zurück in den Kristallwald. Die Rätsel stellt man in `src/daten/orte/geheimgang.js` ein.
17. **Kochen:** Im Lila Dorf kann man in das Haus mit dem blauen Dach hineingehen, dort ist die Küche. Am Herd sucht man ein Rezept aus, sammelt die Zutaten ein, geht zurück zum Herd und rührt um. Wasser, Mehl, Ei und Milch liegen in der Küche. Die anderen Zutaten wachsen draußen und kommen beim Pflücken in den Beutel: Pilze und Äpfel im Kristallwald (die Äpfel bei Tschank), Honig im Lila Dorf, Kristallzucker in der Mine und Mondbeeren am Mondsee. Nach einer Weile wachsen sie nach (`zutatenWachsenNachSekunden` in `regeln.js`). Fehlt etwas, sagt der Herd, wo es wächst. Das fertige Essen kommt in den Beutel.

    Am Herd öffnet sich das Kochbuch mit allen Rezepten. Drei Rezepte kennt man am Anfang nicht: Sie liegen als leuchtendes Rezeptbuch irgendwo in der Welt, und im Kochbuch steht bis dahin „???“ mit dem Ort, an dem man suchen muss. Diese Rezepte brauchen als Zutat Essen, das man vorher selbst gekocht hat:
    - Kristalltorte (Rezept in der Mine): Apfelkuchen, Kristallzucker und Milch. Macht im Kampf ganz gesund und ein bisschen stärker.
    - Zauberpunsch (Rezept am Mondsee): Mondsuppe, Honig und Mondbeeren. Weckt im Kampf alle besiegten Kalamprios im Team wieder auf.
    - Sternenfestmahl (Rezept in der Schatzkammer): Sternenpfannkuchen, Mondsuppe und Apfelkuchen. Macht ganz gesund und doppelt so stark.

    Eigene Rezepte schreibt man in `src/daten/orte/haus.js`. Dort steht auch, wie man ein Rezept irgendwo versteckt (`fundort`). Im Kampf macht Mondsuppe das Kalamprio wieder ganz gesund, Apfelkuchen bringt die Hälfte der Lebenspunkte zurück, und mit Sternenpfannkuchen greift es bis zum Ende des Kampfes 1,5-mal so stark an. Rezepte und Zutaten stehen in `src/daten/orte/haus.js`.
18. **Der Beutel:** Oben links neben „Team“ ist der Beutel. Darin sind die Fangkristalle, das Essen aus der Küche und die gesammelten Zutaten. Wer draufdrückt, sieht, was drin ist. Im Kampf tippt man auf „Beutel“ und dann auf die Sache, die man benutzen will. Das kostet einen Zug, danach ist der Gegner dran. Fangkristalle gehen nur gegen wilde Kalamprios.
19. **Kamera und Fotoalbum:** Wer die Rivalin zum ersten Mal besiegt, bekommt ihre Kamera. Dann sind oben links neben dem Beutel zwei Knöpfe: die Kamera und das Fotoalbum (mit der Zahl der Fotos). Mit der Kamera fotografiert man das wilde Kalamprio, das am nächsten ist (`fotoWeite` in `regeln.js`). Im Kampf ist oben in der Mitte ein Foto-Knopf, wenn der Gegner noch nicht im Album ist. So kann man auch Kalamprios fotografieren, die sich im Gras verstecken, sogar das geheime. Ein Foto kostet keinen Zug. Im Fotoalbum blättert man mit den Pfeilen, auf jeder Seite sind vier Fotos. Wer noch fehlt, ist nur ein dunkler Schatten. Ist das Album voll, gibt es Fangkristalle als Belohnung (`albumVollFangkristalle`).
20. Der Knopf unten links schaltet das Vollbild ein. Am Handy spielt man quer.
21. Der Knopf daneben schaltet den Ton an und aus. Jeder Ort hat seine eigene Musik, auch der Geheimgang und die Küche. Für Kämpfe gibt es vier Kampflieder, bei jedem Kampf kommt ein anderes dran, und im Kampf ist die Musik etwas leiser (`kampflieder` und `musikImKampf` in `klaenge.js`). Jedes Kalamprio hat eine eigene Stimme. Im Kampf ruft es, wenn es auftaucht und wenn es angreift, und quiekt kurz, wenn es getroffen wird. Wilde Kalamprios hört man nur, wenn man in der Nähe ist: Je näher man hingeht, desto lauter rufen sie, so wie das Licht in der Mine nur in der Nähe hell ist. In der dunklen Mine hört man sie, bevor man sie sieht. Auch der dunkle Kristall summt, wenn man näher kommt.

## Die Flaschenpost vom Mondsee

Am Ufer des Mondsees treibt eine Flaschenpost. Darin bittet der letzte Mondfisch um Hilfe: Sein See ist krank, und er traut sich nicht mehr hervor. Drei ganz verschiedene Aufgaben machen den See wieder gesund:

- **Müll einsammeln:** die Aufgabe der alten Muschel unter Wasser.
- **Frösche heimbringen:** Vier Frösche haben sich rund um den See verirrt. Man hört sie quaken. Wer einen findet, dem hüpft er hinterher, und man bringt ihn zur Froschbucht am Ufer.
- **Das Wasserrad ölen:** Ein altes Wasserrad quietscht so laut, dass man es schon von Weitem hört. Dafür braucht man ein Ölkännchen. Das liegt in der Prismastahl-Mine.

Zu jeder Aufgabe gibt es einen kleinen Naturtipp. Wer danach zur Flasche zurückkommt, sieht den Mondfisch glitzernd aus dem Wasser springen. Er bedankt sich mit Fangkristallen und schwimmt danach leuchtend im See herum. Die Idee ist von dem alten Spiel „Auf der Suche nach dem Uhps“ inspiriert. Alles steht bei `flaschenpost` in `src/daten/orte/mondsee.js`.

## Das alte Bootshaus am Mondsee

Am Südufer des Mondsees steht das alte Bootshaus eines Fischers. Er hat hier früher Boote repariert und Maschinen für den See erfunden. Auf seiner Werkbank liegen noch die Baupläne für verrückte Maschinen, so wie bei Pettersson und Findus. Jede Maschine ist halbfertig. Unten liegen Bauteile in einer Kiste: Rampe, Wippe, Dominosteine, Sprungfeder, Trichter, und auch ein paar Sachen, die gar nicht passen (Kissen, Löffel). Man tippt ein Bauteil an und dann den leeren Platz in der Maschine. Mit „Los!“ rollt eine Kugel los, und ein Teil stößt das nächste an. Fehlt etwas, plumpst die Kugel herunter.

Es gibt drei Pläne, jeder ein bisschen schwerer: den Mondbeeren-Schüttler (Mondbeeren für die Küche), den Seerosen-Gießer (Seerosensamen fürs Beet) und den Futterautomaten für den Mondfisch (Fangkristalle). Erst wenn eine Maschine läuft, kommt der nächste Plan. Eigene Pläne schreibt man bei `werkbank` in `src/daten/orte/mondsee.js`.

## Der verschollene Stollen

Wer das Rätsel in der Prismastahl-Mine gelöst hat, findet im Licht ganz rechts in der Wand einen alten Stollen (`verschollenerStollen.js`). Darin wartet ein Spiegel-Rätsel: Man dreht die Spiegel, bis der Lichtstrahl der Pilzlampe den dunklen Kristall trifft. Dann rumpelt es, und eine verschollene Statue steigt aus dem Boden: ein Kalamprio aus Stein. Auf dem Sockel steht „Grüße von Mia“. Was auf der Statue steht und welches Kalamprio sie zeigt, steht bei `statue` in `verschollenerStollen.js`.

## Das Gartenbeet

Unten im Lila Dorf liegt eine Wiese mit einem Gartenbeet. An vielen Orten liegt Saatgut in kleinen Tütchen (bei `saatgut` in der Datei des Ortes): Pilzsporen und Apfelkerne im Kristallwald, ein Kristallkeim in der Mine, Seerosensamen am Mondsee, Orchideen-, Passionsblumen- und Kannenpflanzensamen im Regenwald, Nachtkerzensamen im Dorf und Mondwindensamen im Mondblütental (nur zu zweit). Es kommt in den Beutel und liegt nach einer Weile wieder da.

Wer ins Beet läuft, kann Saatgut einsetzen. Dann wächst es in echter Zeit, auch wenn man gerade nicht spielt: Erst ist es ein kleiner Keimling, nach einer Stunde eine große Pflanze. Danach wird sie wild: Sie wird immer größer und streut alle 45 Minuten einen Ableger, auch über den Zaun hinaus. Manchmal wird aus einem Ableger sogar eine andere Pflanze aus dem Beet, und Ranken klettern über den Zaun. Am Anfang kann man noch zupfen („Zähmen“), aber ist das Beet einmal wild, wächst alles sofort nach. Zähmen kann man es dann nicht mehr. Wie schnell alles wächst, steht in `src/daten/beet.js`.

## Zu zweit spielen

Zwei können auf zwei Geräten zusammen spielen, zum Beispiel auf zwei Tablets oder einem Handy und einem Laptop. Jede spielt mit ihrem eigenen Spielstand.

1. Beide gehen im Lila Dorf zum **Lagerfeuer** (gleich neben dem Freundschaftstor). Das ist der Treffpunkt. Nur dort gibt es oben rechts den Knopf **„Zu zweit“**, und beim Hinkommen geht das Fenster dazu von selbst auf.
2. Auf dem ersten Gerät auf **„Spiel öffnen“** tippen. Das Spiel zeigt einen Code aus vier Kalamprios.
3. Auf dem zweiten Gerät auf **„Code eingeben“** tippen und dieselben vier Kalamprios der Reihe nach antippen.
4. Schon seid ihr verbunden. Oben rechts steht dann überall, mit wem du spielst und wo die andere gerade ist. Trennen kann man die Verbindung wieder am Lagerfeuer.

Was man zu zweit machen kann:

- **Zusammen herumlaufen:** Ist die andere am selben Ort, sieht man ihre Figur mit ihrem Namen und einem rosa Ring.
- **Gegeneinander kämpfen:** Zur anderen Figur gehen und sie antippen, dann „Kämpfen“. Sagt sie Ja, gibt es einen Freundschaftskampf: dein Kampfteam gegen ihres. Jede wählt auf ihrem Gerät. Wer gewinnt, bekommt Erfahrung, und niemand muss sich danach erholen.
- **Zusammen gegen wilde Kalamprios:** Steht die andere in der Nähe, wenn man ein wildes Kalamprio trifft, kämpft sie mit. Ihr steht dann beide links. Das wilde Kalamprio hat dafür mehr Lebenspunkte (`wildeZuZweit` in `zusammen.js`). Gegen die Rivalin und das geheime Kalamprio kämpft man immer allein.
- **Tauschen:** Die andere Figur antippen, dann „Tauschen“. Jede sucht ein Kalamprio aus, das die andere noch nicht hat. Wenn beide auf „Tauschen!“ tippen, wird getauscht. Das Kalamprio nimmt seine Erfahrung mit.
- **Hinter dem Freundschaftstor:** Im Lila Dorf steht ein goldenes Freundschaftstor. Es öffnet sich nur, wenn ihr zu zweit davorsteht. Dahinter liegen zwei Welten mit einer eigenen Geschichte: Der Schatten ist auch hier durchgehuscht und hat den Nachtblumen ihr Leuchten und dem Himmel sein Sternenlicht genommen. Die drei Rätsel dort kann man wirklich nur zu zweit lösen:
  - **Mondblütental** (erste Welt, voller Nachtblumen): Rätsel „Blumenflüstern“. Nur eine von euch sieht, in welcher Reihenfolge die fünf großen Mondblüten leuchten, und sagt es der anderen. Die andere läuft in dieser Reihenfolge darüber. Jede Runde tauscht ihr.
  - **Garten der Mondrosen** (auch erste Welt): Rätsel „Rosentor“. Ein Ring aus dornigen Mondrosen sperrt den Mondtau ein. Das Tor geht nur auf, solange jemand auf dem weit entfernten Mondstein steht. Eine hält es offen, die andere holt den Mondtau. Dann wächst die Wolkentreppe.
  - **Sternenwolke** (zweite Welt, oben am Himmel, Kalamprios mit Level 3): Rätsel „Sternplatten“. Immer zwei Platten leuchten auf, und auf beiden muss gleichzeitig jemand stehen. Danach kehrt das Sternenlicht zurück.

  Reißt die Verbindung ab, trägt einen ein warmer Wind zurück vor das Freundschaftstor.

Die Geräte schicken sich alles direkt (mit PeerJS, das ist kostenlos und braucht kein Konto). Nur zum Finden fragen sie einmal kurz einen Vermittler im Internet, darum braucht es Internet. Am besten klappt es, wenn beide Geräte im selben WLAN sind. In manchen Handynetzen finden sich die Geräte nicht, dann sagt das Spiel Bescheid. Bricht die Verbindung ab, kann man sich mit demselben Code wieder verbinden.

## Eine neue Zeichnung ins Spiel bringen

1. Das Foto in den Ordner `Kalamprios` oder `Charaktere` legen.
2. Das Foto in `werkzeuge/bilder_vorbereiten.py` eintragen. Dafür braucht es den Ausschnitt in Pixeln, am besten Claude darum bitten. Bei Buntstift-Zeichnungen kommt `"bunt": True` dazu, dann bleiben die Farben. Bleistift-Figuren aus `Charaktere` leuchten golden, Bleistift-Kalamprios lila, damit man sie nicht verwechselt.
3. Im Terminal `.venv/bin/python werkzeuge/bilder_vorbereiten.py` starten. Das fertige Spielbild liegt dann in `public/bilder`. Mit Namen dahinter (zum Beispiel `.venv/bin/python werkzeuge/bilder_vorbereiten.py bolo`) wird nur dieses Bild neu gemacht.
4. Das Tier in `src/daten/kalamprios.js` eintragen.

Das Bilder-Werkzeug braucht numpy, scipy und pillow. Die liegen im Ordner `.venv` (der wird nicht hochgeladen). Fehlt der Ordner, macht man ihn so neu: `sudo apt install python3-venv`, dann `python3 -m venv .venv` und `.venv/bin/pip install -r werkzeuge/requirements.txt`.

## Landschaft, Gegenstände und Titel

Der Rätselstein ist gemalt (`Gegenstände/Rätselstein_nicht gelöst.jpg` und `Rätselstein_gelöst.jpg`). Die Klangsteine und die Platten im Geheimgang malt das Spiel selbst im selben Stil (dunkler, wackeliger Strich außen herum), das goldene Fragezeichen über dem Rätselstein ist gezeichnet und keine Schrift. Das steht in `src/szenen/raetsel.js` und `src/szenen/geheimraetsel.js`.

Auch gemalt sind: das Haus (`Landschaft/Haus.jpg`), der Pilz (`Landschaft/Pilz.jpg`, er wird ein bisschen lila getönt, sein Kopf leuchtet wie eine Lampe), die drei Steine am Rand der Mine (`Landschaft/Stein*.jpg`) und der Kristall (`Landschaft/Kristal.jpg`). Den Kristall gibt es zweimal: bunt (in der Geschichte und am Ende) und ausgesaugt, fast schwarz (der dunkle Kristall). Für den Haus-Umriss, bei dem die Bleistiftwände sehr blass sind, steht in `werkzeuge/bilder_vorbereiten.py` bei `umriss` eine Liste von Ecken.

Zwei weitere Häuser im selben Stil hat eine OpenAI-Bild-KI gemalt: `.venv/bin/python werkzeuge/haeuser_malen.py`. Die Küche und die Sachen zum Kochen und für den Geheimgang (Zutaten, Essen, Kessel, Schatztruhe, Muschel, Beutel, Kamera, Fotoalbum, Kristalltorte, Zauberpunsch, Festmahl, Lungenkraut und den Müll) und das Kinderzimmer auch: `.venv/bin/python werkzeuge/kueche_malen.py`. Beides kostet ein bisschen Geld vom OpenAI-Konto. Die gemalten Bilder werden in `Landschaft` und `Gegenstände` aufgehoben, mit `--ohne-ki` dahinter werden sie nur noch einmal ausgeschnitten.

Der Mondsee, zwei Bäume (`Landschaft`) und der Fangkristall (`Gegenstände`) werden wie ein Ausmalbild ausgemalt: Jede Fläche zwischen den Strichen bekommt eine passende Farbe. Der Mond (`Landschaft/Mond.jpg`) ist ganz dicht schraffiert, er wird hell wie Mondlicht, und die Schraffur bleibt als Schatten zu sehen. Er steht am Himmel auf dem Startbildschirm, in der Geschichte und am Ende. Auch das geht mit `.venv/bin/python werkzeuge/bilder_vorbereiten.py`, zum Beispiel `.venv/bin/python werkzeuge/bilder_vorbereiten.py mondsee`.

Den Titel-Schriftzug (`Sonstiges/Title.jpg`) hat eine OpenAI-Bild-KI ausgemalt, die Umrisse der Buchstaben sind dabei geblieben. Neu machen: `.venv/bin/python werkzeuge/titel_verschoenern.py`. Das kostet ein bisschen Geld vom OpenAI-Konto. Das ausgemalte Bild wird in `Sonstiges/Titel-ausgemalt.png` aufgehoben. Mit `--ohne-ki` dahinter wird nur der Hintergrund noch einmal entfernt, ohne OpenAI zu fragen.

Die Sachen, die später dazugekommen sind (Bootshaus, Wasserrad, Flaschenpost, Frösche, Mondfisch, Seerosenblätter, Ölkännchen, Nachtblumen, Mondrosen-Busch, Saatgut-Tütchen, Keimling, Lagerfeuer-Holz, Baumstamm und Statuen-Sockel), hat auch eine OpenAI-Bild-KI gemalt: `.venv/bin/python werkzeuge/sachen_malen.py`. Mit Namen dahinter werden nur diese Sachen neu gemalt, zum Beispiel `.venv/bin/python werkzeuge/sachen_malen.py frosch`. Danach färbt das Werkzeug jede Sache im Stil der Welt ein: etwas weniger bunt, ins Lila verschoben und etwas dunkler, wie im Mondlicht. Tiere und Pflanzen nur sanft, damit der Frosch grün bleibt. Wie stark, steht oben in `werkzeuge/sachen_malen.py` bei `WELT_FARBEN` und `SANFT`. Mit `--ohne-ki` wird nur neu eingefärbt, ohne die KI zu fragen. Die Flammen des Lagerfeuers und die Inschrift auf der Statue macht das Spiel selbst.

## Musik und Geräusche

Alle Töne rechnet der Browser selbst aus, es gibt keine Tondateien. Wie laut alles ist und wie jedes Kalamprio klingt, steht in `src/daten/klaenge.js`. Dort steht auch, welche Stimmen es gibt.

Die Lieder stehen in `src/klang/lieder.js`, mit Akkorden und Noten wie auf einem Notenblatt. Wer dort eine Melodie ändert, kann mit `npm test` prüfen, ob jeder Takt noch acht Achtel hat.

Wie eine Attacke aussieht, steht bei `effekt` in `src/daten/attacken.js`. Oben in der Datei steht, welche es gibt, zum Beispiel `'biss'`, `'bombe'` oder `'strahl'`. Jede Attacke hat ihr eigenes Geräusch.

## Die Vorlese-Stimme

Die Geschichte, die dunklen Kristalle und die Rätselsteine werden vorgelesen. Die Aufnahmen liegen in `public/stimme` und kommen von einer OpenAI-Stimme.

Wenn du in `src/daten/geschichte.js`, bei einem Rätsel in `src/daten/orte/…`, beim Pilzring, bei den Rezepten oder bei der Schatztruhe einen Satz änderst oder dazuschreibst, im Terminal `npm run stimmen` starten. Dann werden nur die neuen Sätze gesprochen. Neue Sätze spricht die Stimme etwas zügiger, die alten Aufnahmen bleiben, wie sie sind. Bis dahin liest die Stimme des Browsers sie vor.

Dafür braucht es den OpenAI-Schlüssel in der Datei `.env`. Diese Datei wird nie hochgeladen, der Schlüssel bleibt geheim.

## Die Kampfregeln prüfen

`npm test` im Terminal rechnet die Regeln aus `src/kampf/kampflogik.js` nach.

`npm run kampfprobe` spielt tausende Kämpfe gegen die wilden Kalamprios vom Mondsee und gegen das geheime Kalamprio durch und zeigt, wie oft man mit 1, 2 oder 3 Kalamprios gewinnt und wie viele Angriffe ein Kampf im Schnitt dauert. Andere Stärken kann man so ausprobieren, ohne etwas zu ändern: `npm run kampfprobe -- "[1, 1.1, 1.6]"`.
