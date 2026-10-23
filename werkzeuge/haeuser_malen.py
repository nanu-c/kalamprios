"""Lässt eine OpenAI-Bild-KI zwei weitere Häuser malen, im Stil des gemalten Hauses.

1. Das gemalte Haus (Landschaft/Haus.jpg) wird ausgeschnitten und gerade gedreht.
2. OpenAI bekommt es als Vorbild und malt ein ähnliches, aber anderes Haus,
   so als hätte es dasselbe Kind mit Buntstiften gemalt.
3. Der weiße Hintergrund wird durchsichtig.

Das Ergebnis landet in public/bilder/landschaft/haus-2.png und haus-3.png.

Starten (im Projektordner):  .venv/bin/python werkzeuge/haeuser_malen.py
Nur Schritt 3 noch einmal, mit den schon gemalten Häusern:
                             .venv/bin/python werkzeuge/haeuser_malen.py --ohne-ki

Das kostet ein bisschen Geld vom OpenAI-Konto. Die gemalten Bilder werden in
Landschaft/Haus-KI-2.png und Haus-KI-3.png aufgehoben, damit man sie nicht
jedes Mal neu bezahlen muss.
"""

import base64
import io
import sys

import numpy as np
import requests
from PIL import Image
from scipy import ndimage

from bilder_vorbereiten import PROJEKT, ZEICHNUNGEN, uebereinander
from titel_verschoenern import MODELL, schluessel_lesen

HOEHE_IM_SPIEL = 420

# Was das zweite und das dritte Haus anders haben als das gemalte.
HAEUSER = {
    2: "a round tower house with a pointed pink roof, a little balcony, a round window, "
    "a flag on top and a flower pot next to the door",
    3: "a wide cottage with a dark blue roof, two windows with crystal flower boxes, "
    "a lantern hanging next to the door, a small chimney and a wooden bench in front",
}

AUFTRAG = (
    "This is a house drawn by a child with colored pencils for a children's video game. "
    "Draw ONE different house in exactly the same hand-drawn colored-pencil style, "
    "with the same wobbly pencil outlines, visible pencil strokes and similar colors "
    "(blue-green roof shading, warm brown wood, soft lilac). The new house is {wie}. "
    "Show the whole house from the front, standing upright, centered, with nothing cut off. "
    "Color in the walls in a soft light lilac so that no white paper is left inside the house. "
    "Keep the background plain pure white, with no ground, no shadow, no text and no other objects."
)


def vorbild():
    """Das gemalte Haus, ausgeschnitten und gerade gedreht, auf weißem Grund."""
    eintrag = next(e for e in ZEICHNUNGEN if e["ziel"] == "landschaft/haus-1.png")
    bild = Image.open(PROJEKT / eintrag["foto"]).convert("RGB").crop(eintrag["ausschnitt"])
    bild = bild.rotate(eintrag["drehen"], expand=True)
    bild.thumbnail((1000, 1000))
    leinwand = Image.new("RGB", (1024, 1536), (255, 255, 255))
    leinwand.paste(bild, ((1024 - bild.width) // 2, (1536 - bild.height) // 2))
    return leinwand


def malen_lassen(vorlage, auftrag, groesse="1024x1536"):
    """Schickt das Vorbild und den Auftrag an OpenAI und bekommt ein neues Bild zurück."""
    datei = io.BytesIO()
    vorlage.save(datei, format="PNG")
    antwort = requests.post(
        "https://api.openai.com/v1/images/edits",
        headers={"Authorization": f"Bearer {schluessel_lesen()}"},
        files={"image[]": ("haus.png", datei.getvalue(), "image/png")},
        data={
            "model": MODELL,
            "prompt": auftrag,
            "size": groesse,
            "quality": "high",
        },
        timeout=300,
    )
    if not antwort.ok:
        raise SystemExit(f"OpenAI sagt {antwort.status_code}: {antwort.text}")
    roh = base64.b64decode(antwort.json()["data"][0]["b64_json"])
    return Image.open(io.BytesIO(roh)).convert("RGB")


def hintergrund_entfernen(gemalt):
    """Macht den weißen Hintergrund durchsichtig. Nur das größte Stück (das Haus) bleibt."""
    rgb = np.asarray(gemalt, dtype=float) / 255.0
    haus = rgb.min(axis=2) < 0.8
    haus = ndimage.binary_closing(haus, iterations=4)
    haus = ndimage.binary_fill_holes(haus)
    # Krümel vom Papier am Rand abknabbern
    haus = ndimage.binary_opening(haus, iterations=3)
    stuecke, anzahl = ndimage.label(haus)
    groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
    haus = stuecke == np.argmax(groessen) + 1
    deckkraft = np.clip(ndimage.gaussian_filter(haus.astype(float), 1.0) * 1.3, 0.0, 1.0)
    return uebereinander([(rgb, deckkraft)])


def main():
    ohne_ki = "--ohne-ki" in sys.argv
    for nummer, wie in HAEUSER.items():
        aufgehoben = PROJEKT / "Landschaft" / f"Haus-KI-{nummer}.png"
        if ohne_ki and aufgehoben.exists():
            gemalt = Image.open(aufgehoben).convert("RGB")
        else:
            print(f"Frage OpenAI nach Haus {nummer} …")
            gemalt = malen_lassen(vorbild(), AUFTRAG.format(wie=wie))
            gemalt.save(aufgehoben)

        bild = hintergrund_entfernen(gemalt)
        bild = bild.crop(bild.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
        faktor = HOEHE_IM_SPIEL / bild.height
        bild = bild.resize((round(bild.width * faktor), HOEHE_IM_SPIEL), Image.LANCZOS)
        ziel = PROJEKT / "public" / "bilder" / "landschaft" / f"haus-{nummer}.png"
        bild.save(ziel)
        print(f"Fertig: {ziel.relative_to(PROJEKT)}  {bild.size}")


if __name__ == "__main__":
    main()
