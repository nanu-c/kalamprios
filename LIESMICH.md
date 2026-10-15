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
| `src/daten/attacken.js` | alle Attacken mit Stärke und Pause |
| `src/daten/elemente.js` | alle Elemente mit ihren Farben |
| `src/daten/charaktere.js` | die Figuren und was sie als Rivalin sagen |
| `src/daten/geschichte.js` | die Geschichte: was am Anfang erzählt wird, was die dunklen Kristalle flüstern und was am Ende bei der Party erzählt wird |
| `src/daten/orte.js` | alle Orte und wo das Spiel beginnt |
| `src/daten/orte/…` | ein Ort pro Datei (Lila Dorf, Kristallwald, Prismastahl-Mine, Mondsee): wo Häuser, Bäume, Felsen, Gold, hohes Gras, Wege, Fangkristalle und wilde Kalamprios sind |
| `src/daten/regeln.js` | Lauftempo, Erholungszeit, wie oft im Gras etwas auftaucht, wie leicht man Kalamprios fängt und wie viele Siege es für ein Level braucht |

In jeder Datei steht oben erklärt, was die Angaben bedeuten. Wenn du dich vertippst, zeigt das Spiel einen Hinweis auf dem Bildschirm.

## So spielt man

1. Auf „Los geht’s!“ tippen, die Geschichte anhören (sie wird vorgelesen) oder überspringen, dann Figur und Kalamprio wählen.
2. Das Spiel beginnt im Lila Dorf. Laufen: mit den Pfeiltasten, mit W A S D oder indem man dorthin tippt.
3. Am Rand führen Wege mit Schildern zum nächsten Ort: Lila Dorf → Kristallwald → Prismastahl-Mine → Mondsee.
4. Wilde Kalamprios laufen herum oder verstecken sich im hohen Gras (in der Mine im Geröll, am See im Schilf). Wer eines berührt, kämpft.
5. Die andere Figur wartet als Rivalin im Kristallwald, oben rechts.
6. Nach einer Niederlage muss sich das Kalamprio kurz erholen.
7. Am Mondsee versteckt sich ein geheimes Kalamprio im Schilf. Spätestens nach drei anderen Kalamprios im Schilf taucht es auf. Besiegen kann man es nur mit mindestens drei Kalamprios im Team (die Zahl steht in `regeln.js` bei `teamFuerGeheimes`), sonst schützt es ein Schild aus Licht. Wer es besiegt oder fängt, hat das Spiel geschafft: Dann gibt es eine Party, und das Ende wird erzählt.
8. An jedem Ort steht ein dunkler Kristall. Wer zu ihm geht, hört mehr über den Schatten, der das Licht stiehlt.
9. Man hat drei Fangkristalle dabei, weitere liegen in der Welt zum Aufsammeln. Im Kampf gegen ein wildes Kalamprio kann man einen werfen. Je schwächer das Kalamprio schon ist, desto eher klappt es. Gefangene Kalamprios kommen ins Team.
10. Mit dem Knopf „Team“ wählt man, wer kämpft. Auch im Kampf kann man mit „Tauschen“ wechseln, das kostet einen Zug. Kann ein Kalamprio nicht mehr, kommt automatisch das nächste aus dem Team.
11. Kalamprios haben ein Level von 1 bis 3. Mit 4 Siegen kommt Level 2, mit 10 Siegen Level 3. Mit jedem Level wird ein Kalamprio ein bisschen stärker. Die wilden Kalamprios am Mondsee haben Level 3, die Rivalin ist so stark wie dein stärkstes Kalamprio.
12. In der Prismastahl-Mine ist es dunkel, nur rund um die Figur ist es hell. Dort glitzert auch Gold.
13. Der Knopf unten links schaltet das Vollbild ein. Am Handy spielt man quer.

## Eine neue Zeichnung ins Spiel bringen

1. Das Foto in den Ordner `Kalamprios` oder `Charaktere` legen.
2. Das Foto in `werkzeuge/bilder_vorbereiten.py` eintragen. Dafür braucht es den Ausschnitt in Pixeln, am besten Claude darum bitten. Bei Buntstift-Zeichnungen kommt `"bunt": True` dazu, dann bleiben die Farben.
3. Im Terminal `python3 werkzeuge/bilder_vorbereiten.py` starten. Das fertige Spielbild liegt dann in `public/bilder`. Mit Namen dahinter (zum Beispiel `python3 werkzeuge/bilder_vorbereiten.py bolo`) wird nur dieses Bild neu gemacht.
4. Das Tier in `src/daten/kalamprios.js` eintragen.

## Landschaft, Gegenstände und Titel

Der Mondsee, zwei Bäume (`Landschaft`) und der Fangkristall (`Gegenstände`) werden wie ein Ausmalbild ausgemalt: Jede Fläche zwischen den Strichen bekommt eine passende Farbe. Auch das geht mit `python3 werkzeuge/bilder_vorbereiten.py`, zum Beispiel `python3 werkzeuge/bilder_vorbereiten.py mondsee`.

Den Titel-Schriftzug (`Sonstiges/Title.jpg`) hat eine OpenAI-Bild-KI ausgemalt, die Umrisse der Buchstaben sind dabei geblieben. Neu machen: `python3 werkzeuge/titel_verschoenern.py`. Das kostet ein bisschen Geld vom OpenAI-Konto. Das ausgemalte Bild wird in `Sonstiges/Titel-ausgemalt.png` aufgehoben. Mit `--ohne-ki` dahinter wird nur der Hintergrund noch einmal entfernt, ohne OpenAI zu fragen.

## Die Vorlese-Stimme

Die Geschichte und die dunklen Kristalle werden vorgelesen. Die Aufnahmen liegen in `public/stimme` und kommen von einer OpenAI-Stimme.

Wenn du in `src/daten/geschichte.js` einen Satz änderst oder dazuschreibst, im Terminal `npm run stimmen` starten. Dann werden nur die neuen Sätze gesprochen. Bis dahin liest die Stimme des Browsers sie vor.

Dafür braucht es den OpenAI-Schlüssel in der Datei `.env`. Diese Datei wird nie hochgeladen, der Schlüssel bleibt geheim.

## Die Kampfregeln prüfen

`npm test` im Terminal rechnet die Regeln aus `src/kampf/kampflogik.js` nach.
