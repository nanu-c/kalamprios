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
| `src/daten/geschichte.js` | die Geschichte: was am Anfang erzählt wird und was die dunklen Kristalle flüstern |
| `src/daten/orte.js` | alle Orte und wo das Spiel beginnt |
| `src/daten/orte/…` | ein Ort pro Datei (Lila Dorf, Kristallwald, Prismastahl-Mine, Mondsee): wo Häuser, Bäume, Felsen, hohes Gras, Wege und wilde Kalamprios sind |
| `src/daten/regeln.js` | Lauftempo, Erholungszeit und wie oft im Gras etwas auftaucht |

In jeder Datei steht oben erklärt, was die Angaben bedeuten. Wenn du dich vertippst, zeigt das Spiel einen Hinweis auf dem Bildschirm.

## So spielt man

1. Die Geschichte anhören (oder überspringen), dann Figur und Kalamprio wählen.
2. Das Spiel beginnt im Lila Dorf. Laufen: mit den Pfeiltasten, mit W A S D oder indem man dorthin tippt.
3. Am Rand führen Wege mit Schildern zum nächsten Ort: Lila Dorf → Kristallwald → Prismastahl-Mine → Mondsee.
4. Wilde Kalamprios laufen herum oder verstecken sich im hohen Gras (in der Mine im Geröll, am See im Schilf). Wer eines berührt, kämpft.
5. Die andere Figur wartet als Rivalin im Kristallwald, oben rechts.
6. Nach einer Niederlage muss sich das Kalamprio kurz erholen.
7. Am Mondsee versteckt sich ganz selten ein geheimes Kalamprio …
8. An jedem Ort steht ein dunkler Kristall. Wer zu ihm geht, erfährt mehr über den Schatten, der das Licht stiehlt.
9. Der Knopf unten links schaltet das Vollbild ein. Am Handy spielt man quer.

## Eine neue Zeichnung ins Spiel bringen

1. Das Foto in den Ordner `Kalamprios` oder `Charaktere` legen.
2. Das Foto in `werkzeuge/bilder_vorbereiten.py` eintragen. Dafür braucht es den Ausschnitt in Pixeln, am besten Claude darum bitten. Bei Buntstift-Zeichnungen kommt `"bunt": True` dazu, dann bleiben die Farben.
3. Im Terminal `python3 werkzeuge/bilder_vorbereiten.py` starten. Das fertige Spielbild liegt dann in `public/bilder`. Mit Namen dahinter (zum Beispiel `python3 werkzeuge/bilder_vorbereiten.py bolo`) wird nur dieses Bild neu gemacht.
4. Das Tier in `src/daten/kalamprios.js` eintragen.

## Die Kampfregeln prüfen

`npm test` im Terminal rechnet die Regeln aus `src/kampf/kampflogik.js` nach.
