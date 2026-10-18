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
| `src/daten/charaktere.js` | die Figuren und was sie als Rivalin sagen |
| `src/daten/geschichte.js` | die Geschichte: was am Anfang erzählt wird, was die dunklen Kristalle flüstern, was am Ende bei der Party erzählt wird und was die Rätselsteine zwischendurch sagen |
| `src/daten/orte.js` | alle Orte und wo das Spiel beginnt |
| `src/daten/orte/…` | ein Ort pro Datei (Lila Dorf, Kristallwald, Prismastahl-Mine, Mondsee): wo Häuser, Bäume, Felsen, Gold, hohes Gras, Wege, Fangkristalle und wilde Kalamprios sind, und das Rätsel des Ortes |
| `src/daten/klaenge.js` | wie laut Musik und Geräusche sind, wie weit man Kalamprios rufen hört und wie jedes Kalamprio klingt |
| `src/daten/regeln.js` | Lauftempo, Erholungszeit, wie oft im Gras etwas auftaucht, wie oft eine Attacke danebengeht, ausgewichen oder abgewehrt wird, wie leicht man Kalamprios fängt, wie viel Erfahrung es für ein Level braucht und wie viele Kalamprios mit in einen Kampf dürfen |

In jeder Datei steht oben erklärt, was die Angaben bedeuten. Wenn du dich vertippst, zeigt das Spiel einen Hinweis auf dem Bildschirm.

## So spielt man

1. Auf „Los geht’s!“ tippen, die Geschichte anhören (sie wird vorgelesen) oder überspringen, dann Figur und Kalamprio wählen.
   Das Spiel speichert sich alle paar Sekunden von selbst im Browser. Kommt man wieder, steht auf dem Startbildschirm „Weiterspielen“ und „Neues Spiel“. Bei „Neues Spiel“ fragt das Spiel nach, bevor es den Spielstand löscht. Der Spielstand gilt nur für diesen Browser auf diesem Gerät.
2. Das Spiel beginnt im Lila Dorf. Laufen: mit den Pfeiltasten, mit W A S D oder indem man dorthin tippt.
3. Am Rand führen Wege mit Schildern zum nächsten Ort: Lila Dorf → Kristallwald → Prismastahl-Mine → Mondsee.
4. Wilde Kalamprios laufen herum (im Kristallwald auch Tschank, Pflinia und Schnektata, in der Mine Kristalta, Totantia und Zeittakel, am Mondsee Blitznara, Elefantia und Zetarata), unter ihnen leuchtet ein Ring in der Farbe ihres Elements. Andere verstecken sich im hohen Gras (in der Mine im Geröll, am See im Schilf). Wer eines berührt, kämpft.
5. Die andere Figur wartet als Rivalin im Kristallwald, unten rechts vor dem Eingang zur Mine. Erst wenn man sie besiegt hat, darf man in die Mine (`erstNachRivalin` beim Ausgang). Mit nur einem Kalamprio kämpft sie gar nicht: Es müssen mindestens zwei mit in den Kampf kommen (`teamFuerRivalin` in `regeln.js`). Was sie dazu sagt, steht in `charaktere.js`.
6. Nach einer Niederlage muss sich das Kalamprio kurz erholen.
7. Am Mondsee versteckt sich ein geheimes Kalamprio im Schilf. Spätestens nach drei anderen Kalamprios im Schilf taucht es auf. Besiegen kann man es nur, wenn mindestens drei Kalamprios mit in den Kampf kommen (die Zahl steht in `regeln.js` bei `teamFuerGeheimes`), sonst schützt es ein Schild aus Licht. Wer es besiegt oder fängt, hat das Spiel geschafft: Dann gibt es eine Party, und das Ende wird erzählt. Danach kann man mit „Weiterspielen“ am Mondsee weitermachen, Kalamprios fangen und trainieren. Die Party gibt es nur beim ersten Mal. Wer das geheime Kalamprio gefangen hat, trifft es nicht noch einmal.
8. An jedem Ort steht ein dunkler Kristall. Wer zu ihm geht, hört mehr über den Schatten, der das Licht stiehlt.
9. Man hat drei Fangkristalle dabei, weitere liegen in der Welt zum Aufsammeln. Im Kampf gegen ein wildes Kalamprio kann man einen werfen. Je schwächer das Kalamprio schon ist, desto eher klappt es. Gefangene Kalamprios kommen ins Team.
10. In einen Kampf dürfen höchstens drei Kalamprios mit (`imKampfHoechstens` in `regeln.js`). Mit dem Knopf „Team“ tippt man an, wer mitkommt; die Nummer zeigt die Reihenfolge, die 1 kämpft zuerst. Tippt man auf eines, das schon mitkommt, kämpft es zuerst. Mit dem × bleibt es da. Im Kampf kann man mit „Tauschen“ wechseln, das kostet einen Zug. Kann ein Kalamprio nicht mehr, kommt automatisch das nächste. Ein gefangenes Kalamprio kommt gleich mit, wenn noch Platz ist.
11. Kalamprios haben ein Level von 1 bis 3. Für jeden Sieg bekommen sie Erfahrung, so viel wie das Level des Gegners. Mit 5 Erfahrung kommt Level 2, mit 15 Level 3. Mit jedem Level wird ein Kalamprio viel stärker (`staerkeJeLevel` in `regeln.js`). Gegen ein wildes Level-3-Kalamprio braucht man darum mindestens zwei Kalamprios mit Level 2, und auch dann klappt es nicht immer. Mit dreien klappt es fast immer. Mit Level-1-Kalamprios schafft man es nie, auch nicht mit dreien. Nach einem Sieg sieht man, wie viel Erfahrung es bekommen hat und wie viel bis zum nächsten Level fehlt. Die wilden Kalamprios in der Mine haben Level 2, am Mondsee Level 3, die Rivalin ist so stark wie dein stärkstes Kalamprio.

    Nicht jede Attacke trifft richtig: Manchmal haut ein Kalamprio daneben, manchmal springt der Gegner zur Seite und weicht aus (wer schneller ist, weicht öfter aus), und manchmal wehrt er ab und bekommt nur die Hälfte ab. Wie oft das passiert, steht in `regeln.js`.
12. In der Prismastahl-Mine ist es stockdunkel, nur ganz nah um die Figur ist es hell. Dort glitzert auch Gold. Der Weg zum Mondsee ist verschüttet und im Dunkeln nicht zu finden. Erst wenn man das Rätsel der Mine gelöst hat, rollen die Felsen weg (`erstNachRaetsel` beim Ausgang).
13. An jedem Ort steht ein Rätselstein mit einem goldenen Fragezeichen. Wer zu ihm geht, bekommt ein Rätsel:
    - Lila Dorf: drei goldene Glöckchen finden, die hinter Häusern und Bäumen liegen.
    - Kristallwald: Fünf bunte Klangsteine liegen auf einer Lichtung. Sie leuchten nacheinander auf und singen dabei. Dann läuft man in derselben Reihenfolge über sie. Es gibt drei Runden, jede ist länger (`runden` im Rätsel), und die Reihenfolge ist jedes Mal anders. Wer sich vertut, sieht die Runde noch einmal.
    - Prismastahl-Mine: drei Glühsteine im Dunkeln finden. Danach scheint das Licht um die Figur viel weiter, und der Weg zum Mondsee wird frei.
    - Mondsee: drei Rätselfragen beantworten. Der Rätselstein kennt viele und fragt jedes Mal andere (`wieViele` im Rätsel). Wer später wiederkommt, kann zum Spaß weiterraten.

    Als Belohnung gibt es Fangkristalle. Ist ein Rätsel gelöst, wird aus dem Fragezeichen ein Stern. Wie man eigene Rätsel baut, steht oben in `src/daten/orte/kristallwald.js` bei `raetsel`.
14. Der Knopf unten links schaltet das Vollbild ein. Am Handy spielt man quer.
15. Der Knopf daneben schaltet den Ton an und aus. Jeder Ort hat seine eigene Musik, und im Kampf läuft Kampfmusik. Jedes Kalamprio hat eine eigene Stimme. Wilde Kalamprios hört man nur, wenn man in der Nähe ist: Je näher man hingeht, desto lauter rufen sie, so wie das Licht in der Mine nur in der Nähe hell ist. In der dunklen Mine hört man sie, bevor man sie sieht. Auch der dunkle Kristall summt, wenn man näher kommt.

## Eine neue Zeichnung ins Spiel bringen

1. Das Foto in den Ordner `Kalamprios` oder `Charaktere` legen.
2. Das Foto in `werkzeuge/bilder_vorbereiten.py` eintragen. Dafür braucht es den Ausschnitt in Pixeln, am besten Claude darum bitten. Bei Buntstift-Zeichnungen kommt `"bunt": True` dazu, dann bleiben die Farben. Bleistift-Figuren aus `Charaktere` leuchten golden, Bleistift-Kalamprios lila, damit man sie nicht verwechselt.
3. Im Terminal `.venv/bin/python werkzeuge/bilder_vorbereiten.py` starten. Das fertige Spielbild liegt dann in `public/bilder`. Mit Namen dahinter (zum Beispiel `.venv/bin/python werkzeuge/bilder_vorbereiten.py bolo`) wird nur dieses Bild neu gemacht.
4. Das Tier in `src/daten/kalamprios.js` eintragen.

Das Bilder-Werkzeug braucht numpy, scipy und pillow. Die liegen im Ordner `.venv` (der wird nicht hochgeladen). Fehlt der Ordner, macht man ihn so neu: `sudo apt install python3-venv`, dann `python3 -m venv .venv` und `.venv/bin/pip install -r werkzeuge/requirements.txt`.

## Landschaft, Gegenstände und Titel

Den Rätselstein und die Klangsteine malt das Spiel selbst im selben Stil (dunkler, wackeliger Strich außen herum), das goldene Fragezeichen ist gezeichnet und keine Schrift. Das steht in `src/szenen/raetsel.js`.

Der Mondsee, zwei Bäume (`Landschaft`) und der Fangkristall (`Gegenstände`) werden wie ein Ausmalbild ausgemalt: Jede Fläche zwischen den Strichen bekommt eine passende Farbe. Der Mond (`Landschaft/Mond.jpg`) ist ganz dicht schraffiert, er wird hell wie Mondlicht, und die Schraffur bleibt als Schatten zu sehen. Er steht am Himmel auf dem Startbildschirm, bei der Auswahl, in der Geschichte und am Ende. Auch das geht mit `.venv/bin/python werkzeuge/bilder_vorbereiten.py`, zum Beispiel `.venv/bin/python werkzeuge/bilder_vorbereiten.py mondsee`.

Den Titel-Schriftzug (`Sonstiges/Title.jpg`) hat eine OpenAI-Bild-KI ausgemalt, die Umrisse der Buchstaben sind dabei geblieben. Neu machen: `.venv/bin/python werkzeuge/titel_verschoenern.py`. Das kostet ein bisschen Geld vom OpenAI-Konto. Das ausgemalte Bild wird in `Sonstiges/Titel-ausgemalt.png` aufgehoben. Mit `--ohne-ki` dahinter wird nur der Hintergrund noch einmal entfernt, ohne OpenAI zu fragen.

## Musik und Geräusche

Alle Töne rechnet der Browser selbst aus, es gibt keine Tondateien. Wie laut alles ist und wie jedes Kalamprio klingt, steht in `src/daten/klaenge.js`. Dort steht auch, welche Stimmen es gibt.

Die Lieder stehen in `src/klang/lieder.js`, mit Akkorden und Noten wie auf einem Notenblatt. Wer dort eine Melodie ändert, kann mit `npm test` prüfen, ob jeder Takt noch acht Achtel hat.

Wie eine Attacke aussieht, steht bei `effekt` in `src/daten/attacken.js`. Oben in der Datei steht, welche es gibt, zum Beispiel `'biss'`, `'bombe'` oder `'strahl'`. Jede Attacke hat ihr eigenes Geräusch.

## Die Vorlese-Stimme

Die Geschichte, die dunklen Kristalle und die Rätselsteine werden vorgelesen. Die Aufnahmen liegen in `public/stimme` und kommen von einer OpenAI-Stimme.

Wenn du in `src/daten/geschichte.js` oder bei einem Rätsel in `src/daten/orte/…` einen Satz änderst oder dazuschreibst, im Terminal `npm run stimmen` starten. Dann werden nur die neuen Sätze gesprochen. Neue Sätze spricht die Stimme etwas zügiger, die alten Aufnahmen bleiben, wie sie sind. Bis dahin liest die Stimme des Browsers sie vor.

Dafür braucht es den OpenAI-Schlüssel in der Datei `.env`. Diese Datei wird nie hochgeladen, der Schlüssel bleibt geheim.

## Die Kampfregeln prüfen

`npm test` im Terminal rechnet die Regeln aus `src/kampf/kampflogik.js` nach.

`npm run kampfprobe` spielt tausende Kämpfe gegen die wilden Kalamprios vom Mondsee durch und zeigt, wie oft man mit 1, 2 oder 3 Kalamprios gewinnt. Andere Stärken kann man so ausprobieren, ohne etwas zu ändern: `npm run kampfprobe -- "[1, 1.1, 1.6]"`.
