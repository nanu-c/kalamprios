"""Macht aus dem gemalten Schriftzug "KALAMPRIOS" das Titelbild des Spiels.

1. Die Umrisse der Buchstaben werden aus dem Foto geholt (Sonstiges/Title.jpg).
2. Ein Bild-Programm von OpenAI malt sie bunt und glitzernd aus. Die Umrisse
   und die Stellen der Buchstaben bleiben dabei so, wie sie gemalt sind.
3. Der weiße Hintergrund wird durchsichtig.

Das Ergebnis landet in public/bilder/titel.png.

Starten (im Projektordner):  python3 werkzeuge/titel_verschoenern.py
Nur Schritt 3 noch einmal, mit dem schon ausgemalten Bild:
                             python3 werkzeuge/titel_verschoenern.py --ohne-ki

Der Schlüssel steht in der Datei .env (sie wird nicht hochgeladen).
Das ausgemalte Bild von OpenAI wird in Sonstiges/Titel-ausgemalt.png
aufgehoben, damit man es nicht jedes Mal neu bezahlen muss.
"""

import base64
import io
import sys
from pathlib import Path

import numpy as np
import requests
from PIL import Image
from scipy import ndimage

from bilder_vorbereiten import PROJEKT, flaechen_finden, uebereinander

TITEL = {"foto": "Sonstiges/Title.jpg", "ausschnitt": (1350, 0, 2450, 3900), "drehen": 90}
ZIEL = PROJEKT / "public" / "bilder" / "titel.png"
AUSGEMALT = PROJEKT / "Sonstiges" / "Titel-ausgemalt.png"
BREITE_IM_SPIEL = 1100

MODELL = "gpt-image-1"
AUFTRAG = (
    "This is a hand-drawn title for a children's video game. It spells KALAMPRIOS "
    "in outlined capital letters drawn by a child. Color in the inside of every letter "
    "so it looks magical: shining crystal colors in purple, lilac, pink and light blue, "
    "soft gradients, small glittering sparkles and tiny gem facets inside the letters. "
    "Keep every letter exactly where it is, with exactly the same outline shape and size. "
    "Do not move, redraw, straighten or add letters. Keep the background plain white."
)


def schluessel_lesen():
    """Liest den OpenAI-Schlüssel aus der Datei .env."""
    for zeile in (PROJEKT / ".env").read_text().splitlines():
        wert = zeile.split("=", 1)[1].strip() if "=" in zeile else zeile.strip()
        if wert.startswith("sk-"):
            return wert.strip("\"'")
    raise SystemExit("In .env steht kein OpenAI-Schlüssel (er beginnt mit sk-).")


def buchstaben_finden():
    """Gibt zurück: wie viel Bleistift wo ist und wo das Innere der Buchstaben ist.

    Das Innere eines Buchstabens grenzt (über den Strich hinweg) an das Papier
    außen herum. Die Löcher in A, P, R und O grenzen nur an den Buchstaben selbst.
    """
    linien, flaechen, papier, _ = flaechen_finden(TITEL)
    papier_maske = np.isin(flaechen, list(papier))
    nah_am_papier = ndimage.binary_dilation(papier_maske, iterations=14)
    innen = np.zeros(flaechen.shape, dtype=bool)
    for nummer in set(np.unique(flaechen)) - papier - {0}:
        flaeche = flaechen == nummer
        if (flaeche & nah_am_papier).any():
            innen |= flaeche
    # Bis unter die Mitte der Striche, damit zwischen Farbe und Umriss keine Lücke bleibt.
    innen = ndimage.binary_dilation(innen, iterations=3) & ~papier_maske | innen
    return linien, innen


def vorlage(linien, groesse):
    """Die Buchstaben als saubere schwarze Umrisse auf weißem Grund, für OpenAI."""
    grau = Image.fromarray(((1 - linien) * 255).astype(np.uint8))
    leinwand = Image.new("L", groesse, 255)
    leinwand.paste(grau, ((groesse[0] - grau.width) // 2, (groesse[1] - grau.height) // 2))
    return leinwand.convert("RGB")


def ausmalen_lassen(bild):
    """Schickt die Vorlage an OpenAI und bekommt sie ausgemalt zurück."""
    datei = io.BytesIO()
    bild.save(datei, format="PNG")
    antwort = requests.post(
        "https://api.openai.com/v1/images/edits",
        headers={"Authorization": f"Bearer {schluessel_lesen()}"},
        files={"image[]": ("titel.png", datei.getvalue(), "image/png")},
        data={
            "model": MODELL,
            "prompt": AUFTRAG,
            "size": f"{bild.width}x{bild.height}",
            "quality": "high",
            "input_fidelity": "high",
        },
        timeout=300,
    )
    if not antwort.ok:
        raise SystemExit(f"OpenAI sagt {antwort.status_code}: {antwort.text}")
    roh = base64.b64decode(antwort.json()["data"][0]["b64_json"])
    return Image.open(io.BytesIO(roh)).convert("RGB")


def hintergrund_entfernen(ausgemalt):
    """Macht den weißen Hintergrund durchsichtig. Die Buchstaben bleiben, wie OpenAI sie gemalt hat."""
    rgb = np.asarray(ausgemalt, dtype=float) / 255.0
    buchstaben = rgb.min(axis=2) < 0.9
    buchstaben = ndimage.binary_closing(buchstaben, iterations=2)
    # Weiße Glanzpunkte in den Buchstaben sind kleine Löcher: die füllen.
    # Die Löcher in A, P, R und O sind groß und bleiben durchsichtig.
    loecher, anzahl = ndimage.label(ndimage.binary_fill_holes(buchstaben) & ~buchstaben)
    if anzahl:
        groessen = ndimage.sum(np.ones_like(loecher), loecher, range(1, anzahl + 1))
        buchstaben |= np.concatenate(([False], groessen < 600))[loecher]
    # Krümel weg, die nicht zu einem Buchstaben gehören.
    stuecke, anzahl = ndimage.label(buchstaben)
    groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
    buchstaben = np.concatenate(([False], groessen >= 300))[stuecke]
    deckkraft = np.clip(ndimage.gaussian_filter(buchstaben.astype(float), 1.0) * 1.3, 0.0, 1.0)

    # Ein sanftes Leuchten außen herum, damit der Titel auf dunklem Grund strahlt.
    schein = np.clip(ndimage.gaussian_filter(buchstaben.astype(float), 14) * 1.6, 0.0, 1.0)
    return uebereinander([(np.array([0.78, 0.65, 1.0]), schein * 0.5), (rgb, deckkraft)])


def main():
    if "--ohne-ki" in sys.argv and AUSGEMALT.exists():
        ausgemalt = Image.open(AUSGEMALT).convert("RGB")
    else:
        linien, _ = buchstaben_finden()
        hoehe, breite = linien.shape
        # OpenAI malt Bilder in 1536 x 1024. Dahinein passt der Schriftzug,
        # wenn er auf 1500 Pixel Breite verkleinert wird.
        klein = (1500, round(hoehe * 1500 / breite))
        linien_klein = np.asarray(Image.fromarray((linien * 255).astype(np.uint8)).resize(klein, Image.LANCZOS)) / 255.0
        print("Frage OpenAI, ob es die Buchstaben ausmalt …")
        ausgemalt = ausmalen_lassen(vorlage(linien_klein, (1536, 1024)))
        AUSGEMALT.parent.mkdir(exist_ok=True)
        ausgemalt.save(AUSGEMALT)

    bild = hintergrund_entfernen(ausgemalt)
    bild = bild.crop(bild.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    if bild.width > BREITE_IM_SPIEL:
        bild = bild.resize((BREITE_IM_SPIEL, round(bild.height * BREITE_IM_SPIEL / bild.width)), Image.LANCZOS)
    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    bild.save(ZIEL)
    print(f"Fertig: {ZIEL.relative_to(PROJEKT)}  {bild.size}")


if __name__ == "__main__":
    main()
