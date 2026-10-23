"""Lässt eine OpenAI-Bild-KI die Küche und das Kinderzimmer im Haus und die Sachen zum Kochen und
für den Geheimgang malen, im Stil des gemalten Hauses.

1. Die Küche: ein ganzes Zimmer, in das man hineingehen kann. Oben ist die
   Wand mit dem Herd, unten der Holzboden, auf dem man läuft.
2. Die Sachen: Zutaten, Gerichte, ein Kessel, eine Schatztruhe (zu und offen),
   ein Kochbuch und eine Muschel, alle auf einem Bild, vier Reihen mit je
   vier Sachen. Jede Sache wird ausgeschnitten und bekommt einen
   durchsichtigen Hintergrund.

Das Ergebnis landet in public/bilder/landschaft/kueche.jpg und in
public/bilder/gegenstaende/ (ein Bild pro Sache).

Starten (im Projektordner):  .venv/bin/python werkzeuge/kueche_malen.py
Nur ausschneiden, mit den schon gemalten Bildern:
                             .venv/bin/python werkzeuge/kueche_malen.py --ohne-ki

Das kostet ein bisschen Geld vom OpenAI-Konto. Die gemalten Bilder werden in
Landschaft/Kueche-KI.png und Gegenstände/Sachen-KI.png aufgehoben.
"""

import sys

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

from bilder_vorbereiten import PROJEKT, uebereinander
from haeuser_malen import malen_lassen, vorbild

STIL = (
    "Use exactly the same hand-drawn colored-pencil style as the house in the picture, "
    "drawn by a child: wobbly brown pencil outlines, visible pencil strokes, soft colors "
    "with lilac, blue-green and warm brown. "
)

KUECHE = STIL + (
    "Draw the inside of this house: a cozy kitchen seen from the front, like a stage. "
    "The top 40 percent of the picture is the back wall in soft lilac: on the left a big "
    "old stove with an oven door and a black cooking pot on top, in the middle a window with "
    "lilac curtains and the night sky with stars outside, on the right wooden shelves with "
    "jars and a hanging lamp that glows warm yellow. "
    "The bottom 60 percent is a wide, empty wooden plank floor seen a little from above, "
    "with a round blue-green rug in the middle. Nothing stands on the floor. "
    "No people, no animals, no text. Fill the whole picture, no white border."
)

KINDERZIMMER = STIL + (
    "Draw another room of this house: a very messy, chaotic children's bedroom seen from the front, like a stage. "
    "The top 40 percent of the picture is the back wall in soft lilac with children's drawings pinned to it, "
    "a round window with stars outside and a shelf with toys and crystals. On the left a bed with a messy, "
    "rumpled blanket and pillows. The bottom 60 percent is a wooden plank floor seen a little from above, with "
    "toys, building blocks, books, crayons, socks and a teddy bear scattered along the edges, but a clear "
    "empty path in the middle and at the bottom center where you can walk. No people, no animals, no text. "
    "Fill the whole picture, no white border."
)

# Die Sachen, Feld für Feld von links oben nach rechts unten.
SACHEN = [
    ("apfel", "a red apple"),
    ("ei", "a white egg"),
    ("mehl", "a small sack of flour without any writing on it"),
    ("milch", "a milk jug"),
    ("zucker", "a glass jar of sparkly crystal sugar"),
    ("mondbeeren", "a bunch of shiny lilac berries"),
    ("wasser", "a blue jug of water"),
    ("honig", "a pot of golden honey"),
    ("suppe", "a bowl of steaming lilac soup"),
    ("kuchen", "an apple cake on a plate"),
    ("pfannkuchen", "a stack of pancakes with honey and a star on top"),
    ("kessel", "an empty round black cauldron seen from the front, with a wide open top"),
    ("truhe-zu", "a closed wooden treasure chest with golden edges"),
    ("truhe-offen", "the same treasure chest open, full of glowing crystals and gold"),
    ("kochbuch", "a thick open recipe book"),
    ("muschel", "a big spiral sea shell"),
]

# Sachen, die später dazugekommen sind: Jede wird einzeln gemalt.
EINZELN = [
    ("beutel", "a small round brown leather pouch bag, closed with a lilac drawstring, with a little crystal charm"),
    ("kamera", "an old-fashioned instant photo camera in lilac and light blue, seen from the front, with a big round lens and a flash"),
    ("fotoalbum", "a closed photo album book with a lilac cover, a golden star on the front and a ribbon"),
    ("kristalltorte", "a tall round layer cake on a plate, decorated with sparkling pink and light blue sugar crystals on top"),
    ("zauberpunsch", "a round glass bowl full of glowing lilac punch with floating berries and little sparkles"),
    ("festmahl", "a big festive plate with a stack of pancakes, a slice of apple cake and a small bowl of lilac soup, with a golden star"),
    ("lungenkraut", "a small magical lungwort plant with spotted green leaves, blue and pink bell flowers and tiny glowing air bubbles around it"),
    ("plastikflasche", "an empty crumpled plastic bottle, a piece of trash"),
    ("plastiktuete", "a crumpled old plastic bag, a piece of trash"),
    ("dose", "a dented old tin can, a piece of trash"),
    ("joghurtbecher", "an empty dirty yoghurt cup, a piece of trash"),
]

EINZELN_AUFTRAG = STIL + (
    "Draw one single small object for a game, centered, with plenty of empty white space around it: {was}. "
    "Plain pure white background, no text, no shadows."
)

SACHEN_AUFTRAG = STIL + (
    "Draw 16 separate small objects for a game, arranged in a grid of 4 columns and "
    "4 rows, each object centered in its own cell with plenty of empty white space "
    "around it, nothing touching the cell borders and no lines between the cells. "
    "Row by row, from top left: "
    + "; ".join(beschreibung for _, beschreibung in SACHEN)
    + ". Leave a wide empty white margin around the whole picture, especially at the top, "
    "so that every object is complete. Plain pure white background, no text, no shadows."
)

KUECHE_GROESSE = (1536, 1024)
SACHE_HOEHE = 200


def sachen_finden(bild):
    """Findet die einzelnen Sachen auf dem Bild und gibt sie Reihe für Reihe zurück.

    Jede Sache ist (Ausschnitt, Maske). Die Sachen liegen nicht ganz genau
    im Raster, darum sucht das Werkzeug zusammenhängende Flächen.
    """
    # Ein weißer Rand rundherum, damit Sachen, die an den Bildrand stoßen, ganz bleiben.
    bild = ImageOps.expand(bild, border=40, fill=(255, 255, 255))
    rgb = np.asarray(bild, dtype=float) / 255.0
    gemalt = rgb.min(axis=2) < 0.85
    gemalt = ndimage.binary_fill_holes(ndimage.binary_closing(gemalt, iterations=4))
    # Was nah beieinander liegt (zum Beispiel der Dampf über der Suppe), gehört zusammen.
    gruppen, anzahl = ndimage.label(ndimage.binary_dilation(gemalt, iterations=12))
    stuecke = []
    for nummer, lage in enumerate(ndimage.find_objects(gruppen), start=1):
        maske = (gruppen[lage] == nummer) & gemalt[lage]
        if maske.sum() < 2000:
            continue
        mitte_y = (lage[0].start + lage[0].stop) / 2
        mitte_x = (lage[1].start + lage[1].stop) / 2
        stuecke.append((mitte_y, mitte_x, lage, maske))
    if len(stuecke) != len(SACHEN):
        raise SystemExit(f"Auf dem Bild sind {len(stuecke)} Sachen, es sollten {len(SACHEN)} sein.")
    # In Reihen sortieren: Wer ungefähr gleich hoch liegt, ist in derselben Reihe.
    stuecke.sort(key=lambda stueck: stueck[0])
    reihen = [stuecke[i : i + 4] for i in range(0, len(stuecke), 4)]
    return [(bild.crop((l[1].start, l[0].start, l[1].stop, l[0].stop)), m) for reihe in reihen for _, _, l, m in sorted(reihe, key=lambda s: s[1])]


def sachen_finden_einzeln(bild):
    """Wie sachen_finden, aber für ein Bild mit nur einer Sache: das größte Stück.

    Der Hintergrund ist nicht immer reines Weiß (manchmal cremefarben wie
    Papier). Darum wird seine Farbe am Rand des Bildes gemessen.
    """
    rand = np.concatenate([np.asarray(bild)[:8].reshape(-1, 3), np.asarray(bild)[-8:].reshape(-1, 3)])
    papier = tuple(int(wert) for wert in np.median(rand, axis=0))
    bild = ImageOps.expand(bild, border=40, fill=papier)
    rgb = np.asarray(bild, dtype=float) / 255.0
    anders = np.abs(rgb - np.array(papier) / 255.0).max(axis=2)
    gemalt = ndimage.binary_fill_holes(ndimage.binary_closing(anders > 0.13, iterations=4))
    gruppen, anzahl = ndimage.label(ndimage.binary_dilation(gemalt, iterations=12))
    groessen = ndimage.sum(np.ones_like(gruppen), gruppen, range(1, anzahl + 1))
    nummer = int(np.argmax(groessen)) + 1
    lage = ndimage.find_objects(gruppen)[nummer - 1]
    maske = (gruppen[lage] == nummer) & gemalt[lage]
    return [(bild.crop((lage[1].start, lage[0].start, lage[1].stop, lage[0].stop)), maske)]


def schrift_wegradieren(rgb, maske):
    """Übermalt dunkle Schrift auf einer Fläche mit der Farbe drumherum (für den Mehlsack)."""
    innen = ndimage.binary_erosion(maske, iterations=14)
    hell = rgb.mean(axis=2)
    schrift = innen & (hell < np.median(hell[innen]) - 0.12)
    schrift = ndimage.binary_dilation(schrift, iterations=3) & innen
    flaeche = innen & ~schrift
    farbe = np.median(rgb[flaeche], axis=0)
    rgb = rgb.copy()
    rgb[schrift] = farbe
    # Ein bisschen Buntstift-Körnung drüber, damit es nicht wie ein Fleck aussieht
    rgb[schrift] += (np.random.default_rng(3).random((schrift.sum(), 1)) - 0.5) * 0.05
    return np.clip(rgb, 0.0, 1.0)


def sache_ausschneiden(feld, maske, name, hoehe=None):
    """Macht den Hintergrund durchsichtig und bringt die Sache auf Spielgröße."""
    rgb = np.asarray(feld, dtype=float) / 255.0
    if name == "mehl":
        rgb = schrift_wegradieren(rgb, maske)
    if name == "milch":
        # Der Milchkrug ist sonst genauso blau wie der Wasserkrug: Er wird weiß.
        grau = rgb.mean(axis=2, keepdims=True)
        rgb = np.clip(grau * 0.55 + 0.45, 0.0, 1.0) * np.array([1.0, 0.98, 0.95])
    deckkraft = np.clip(ndimage.gaussian_filter(maske.astype(float), 1.0) * 1.3, 0.0, 1.0)
    bild = uebereinander([(rgb, deckkraft)])
    faktor = (hoehe or SACHE_HOEHE) / max(bild.size)
    return bild.resize((round(bild.width * faktor), round(bild.height * faktor)), Image.LANCZOS)


def main():
    ohne_ki = "--ohne-ki" in sys.argv
    vorlage = vorbild()

    aufgehoben = PROJEKT / "Landschaft" / "Kueche-KI.png"
    if not (ohne_ki and aufgehoben.exists()):
        print("Frage OpenAI nach der Küche …")
        malen_lassen(vorlage, KUECHE, "1536x1024").save(aufgehoben)
    kueche = Image.open(aufgehoben).convert("RGB").resize(KUECHE_GROESSE, Image.LANCZOS)
    ziel = PROJEKT / "public" / "bilder" / "landschaft" / "kueche.jpg"
    kueche.save(ziel, quality=88)
    print(f"Fertig: {ziel.relative_to(PROJEKT)}")

    aufgehoben = PROJEKT / "Landschaft" / "Kinderzimmer-KI.png"
    if not (ohne_ki and aufgehoben.exists()):
        print("Frage OpenAI nach dem Kinderzimmer …")
        malen_lassen(vorlage, KINDERZIMMER, "1536x1024").save(aufgehoben)
    zimmer = Image.open(aufgehoben).convert("RGB").resize(KUECHE_GROESSE, Image.LANCZOS)
    ziel = PROJEKT / "public" / "bilder" / "landschaft" / "kinderzimmer.jpg"
    zimmer.save(ziel, quality=88)
    print(f"Fertig: {ziel.relative_to(PROJEKT)}")

    aufgehoben = PROJEKT / "Gegenstände" / "Sachen-KI.png"
    if not (ohne_ki and aufgehoben.exists()):
        print("Frage OpenAI nach den Sachen …")
        malen_lassen(vorlage, SACHEN_AUFTRAG, "1024x1024").save(aufgehoben)
    sachen = Image.open(aufgehoben).convert("RGB")
    for (name, _), (feld, maske) in zip(SACHEN, sachen_finden(sachen)):
        ziel = PROJEKT / "public" / "bilder" / "gegenstaende" / f"{name}.png"
        sache_ausschneiden(feld, maske, name).save(ziel)
        print(f"Fertig: {ziel.relative_to(PROJEKT)}")

    for name, was in EINZELN:
        aufgehoben = PROJEKT / "Gegenstände" / f"{name.capitalize()}-KI.png"
        if not (ohne_ki and aufgehoben.exists()):
            print(f"Frage OpenAI nach: {name} …")
            malen_lassen(vorlage, EINZELN_AUFTRAG.format(was=was), "1024x1024").save(aufgehoben)
        (feld, maske), = sachen_finden_einzeln(Image.open(aufgehoben).convert("RGB"))
        ziel = PROJEKT / "public" / "bilder" / "gegenstaende" / f"{name}.png"
        sache_ausschneiden(feld, maske, name).save(ziel)
        print(f"Fertig: {ziel.relative_to(PROJEKT)}")


if __name__ == "__main__":
    main()
