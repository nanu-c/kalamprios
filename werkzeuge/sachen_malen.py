"""Lässt eine OpenAI-Bild-KI die Sachen malen, die später ins Spiel gekommen sind,
im Stil des gemalten Hauses:

- am Mondsee: das alte Bootshaus des Fischers mit seiner Werkbank, das
  Wasserrad, die Flaschenpost, die Frösche, den Mondfisch, die Seerosenblätter
  und das Ölkännchen (es liegt in der Mine)
- hinter dem Freundschaftstor: die Nachtblumen und den Mondrosen-Busch
- im Lila Dorf: das Saatgut-Tütchen, den Keimling, das Lagerfeuer (ohne
  Flammen, die macht das Spiel selbst) und den Baumstamm zum Sitzen
- im verschollenen Stollen: den Sockel der Statue (die Inschrift schreibt das
  Spiel selbst darauf, damit sie sicher richtig dasteht)

Jede Sache wird einzeln gemalt, ausgeschnitten und bekommt einen
durchsichtigen Hintergrund. Dann wird sie im Stil der Welt eingefärbt: ein
bisschen weniger bunt, ins Lila verschoben und etwas dunkler, wie im
Mondlicht (siehe WELT_FARBEN). Das Ergebnis landet in public/bilder/gegenstaende/.

Starten (im Projektordner):  .venv/bin/python werkzeuge/sachen_malen.py
Nur ausschneiden, mit den schon gemalten Bildern (und nur fehlende malen):
                             .venv/bin/python werkzeuge/sachen_malen.py --ohne-ki
Nur bestimmte Sachen neu malen:
                             .venv/bin/python werkzeuge/sachen_malen.py frosch mondfisch

Das kostet ein bisschen Geld vom OpenAI-Konto. Die gemalten Bilder werden in
Gegenstände/<Name>-KI.png aufgehoben.
"""

import sys

import numpy as np
from PIL import Image

from bilder_vorbereiten import PROJEKT
from haeuser_malen import malen_lassen, vorbild
from kueche_malen import EINZELN_AUFTRAG, sache_ausschneiden, sachen_finden_einzeln

# So wird jede Sache eingefärbt, damit sie in die lila Nachtwelt passt:
#   bunt:   so viel von den Farben bleibt (1 heißt alles, 0 heißt grau)
#   toenen: (rot, grün, blau): so stark bleibt jede Farbe. Weniger Rot und
#           Grün und etwas mehr Blau macht es lila.
#   hell:   so hell wird alles (1 heißt unverändert)
WELT_FARBEN = {"bunt": 0.75, "toenen": (0.86, 0.76, 1.04), "hell": 0.92}
# Tiere und Pflanzen werden nur sanft eingefärbt, sonst ist der Frosch nicht
# mehr grün und die Blumen nicht mehr bunt.
SANFT = {"bunt": 0.95, "toenen": (0.95, 0.98, 1.03), "hell": 0.97}
LEBENDIG = {"frosch", "mondfisch", "flaschenpost", "seerosenblatt", "keimling", "rosenbusch"}


def welt_farben(bild, name=""):
    """Färbt ein ausgeschnittenes Bild im Stil der Welt ein. Durchsichtiges bleibt durchsichtig."""
    wie = SANFT if name in LEBENDIG or name.startswith("nachtblume-") else WELT_FARBEN
    farben = np.asarray(bild.convert("RGBA"), dtype=float) / 255.0
    rgb, deckkraft = farben[..., :3], farben[..., 3:]
    grau = rgb.mean(axis=2, keepdims=True)
    rgb = grau + (rgb - grau) * wie["bunt"]
    rgb = rgb * np.array(wie["toenen"]) * wie["hell"]
    ergebnis = np.concatenate([np.clip(rgb, 0.0, 1.0), deckkraft], axis=2)
    return Image.fromarray((ergebnis * 255).round().astype(np.uint8), "RGBA")


# Name im Spiel, was die KI malen soll, und wie groß das Bild im Spiel wird (Pixel).
SACHEN = [
    ("bootshaus", "a small old wooden boathouse at the edge of a lake, standing on short stilts, with a little wooden jetty in front, "
     "a fishing net hanging on the wall and, under a small roof on the side, a workbench with tools, gears and rolled-up blueprints", 340),
    ("wasserrad", "an old round wooden water wheel seen straight from the front, with eight paddles, no stand, no water", 240),
    ("flaschenpost", "a green glass bottle with a cork, lying on its side, with a rolled-up paper letter inside", 160),
    ("oelkanne", "an old small red oil can with a long thin metal spout", 160),
    ("frosch", "a small cute green frog sitting, seen from the front, with big round eyes", 140),
    ("mondfisch", "a magical silver-blue fish with shimmering scales like moonlight, seen from the side, with a flowing tail fin", 200),
    ("seerosenblatt", "a round green water lily pad seen from above at an angle, with a notch, and one small pink water lily flower on it", 160),
    ("samentuete", "a small paper seed packet without any writing on it, folded at the top, with a round empty white label", 160),
    ("keimling", "a tiny green seedling with two little leaves sprouting from a small mound of dark soil", 120),
    ("lagerfeuer-ki", "a ring of round grey stones with crossed firewood logs inside, not burning, seen a little from above", 220),
    ("sitzstamm-ki", "a short thick wooden log lying on its side, to sit on, seen from the front", 160),
    ("sockel", "an old cracked grey stone pedestal block for a statue, empty on top, with an empty smooth front face, no writing", 220),
    ("rosenbusch", "a round thorny dark green bush full of silvery-lilac roses", 200),
    ("nachtblume-mondwinde", "a magical night flower: a white glowing morning-glory trumpet flower on a green stem with two leaves", 200),
    ("nachtblume-nachtkerze", "a magical night flower: a pale yellow glowing evening primrose with four round petals on a green stem", 200),
    ("nachtblume-sternbluete", "a magical night flower: a light blue glowing star-shaped flower with five pointed petals on a green stem", 200),
    ("nachtblume-leuchtglocke", "a magical night flower: an arched green stem with three hanging glowing pink bell flowers", 200),
    ("nachtblume-mondrose", "a magical night flower: a silvery-lilac glowing rose on a green stem with leaves", 200),
]


def main():
    ohne_ki = "--ohne-ki" in sys.argv
    nur = [name for name in sys.argv[1:] if not name.startswith("--")]
    vorlage = vorbild()
    for name, was, hoehe in SACHEN:
        if nur and name not in nur:
            continue
        aufgehoben = PROJEKT / "Gegenstände" / f"{name.capitalize()}-KI.png"
        if not (ohne_ki and aufgehoben.exists()):
            print(f"Frage OpenAI nach: {name} …")
            malen_lassen(vorlage, EINZELN_AUFTRAG.format(was=was), "1024x1024").save(aufgehoben)
        (feld, maske), = sachen_finden_einzeln(Image.open(aufgehoben).convert("RGB"))
        ziel = PROJEKT / "public" / "bilder" / "gegenstaende" / f"{name}.png"
        welt_farben(sache_ausschneiden(feld, maske, name, hoehe), name).save(ziel)
        print(f"Fertig: {ziel.relative_to(PROJEKT)}")


if __name__ == "__main__":
    main()
