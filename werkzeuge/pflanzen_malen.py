"""Lässt eine OpenAI-Bild-KI die Pflanzen für den Regenwald malen, im Stil des
gemalten Hauses (Buntstift, wackelige Striche).

Jede Pflanze (und jedes Stück Regenwald wie Bäume, Wurzeln, Büsche) wird einzeln gemalt, ausgeschnitten und bekommt einen
durchsichtigen Hintergrund. Das Ergebnis landet in public/bilder/pflanzen/.
Welche Pflanzen es gibt, steht in src/daten/orte/regenwald.js. Hier steht nur,
wie sie aussehen sollen (auf Englisch, für die Bild-KI).

Starten (im Projektordner):  .venv/bin/python werkzeuge/pflanzen_malen.py
Nur ausschneiden, mit den schon gemalten Bildern:
                             .venv/bin/python werkzeuge/pflanzen_malen.py --ohne-ki

Das kostet ein bisschen Geld vom OpenAI-Konto. Die gemalten Bilder werden in
Landschaft/Pflanzen-KI/ aufgehoben.
"""

import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from scipy import ndimage
from PIL import Image

from bilder_vorbereiten import PROJEKT
from haeuser_malen import malen_lassen, vorbild
from kueche_malen import STIL, sache_ausschneiden, sachen_finden_einzeln

PFLANZEN = {
    "monstera": "a big monstera plant with large glossy green leaves full of holes and slits",
    "bromelie": "a bromeliad plant with a rosette of stiff green leaves and a bright red and pink flower spike in the middle",
    "orchidee": "a delicate orchid with several lilac and white flowers on a curved stem and a few thick green leaves",
    "kannenpflanze": "a carnivorous pitcher plant (nepenthes) with green and red striped pitchers hanging from tendrils",
    "helikonie": "a heliconia plant with hanging zigzag red and yellow flower bracts like lobster claws and long leaves",
    "baumfarn": "a small tree fern with a thin brown trunk and a crown of long feathery green fronds",
    "kakaobaum": "a small cacao tree with big yellow-orange cacao pods growing directly from the trunk",
    "rafflesia": "a rafflesia, a giant red flower with five big spotted petals lying on the ground",
    "passionsblume": "a passion flower vine with a round purple, white and blue flower with many thin threads",
    "bananenstaude": "a banana plant with huge long torn green leaves and a bunch of green bananas with a purple bud",
    "riesenseerose": "a giant amazon water lily with huge round floating leaves with upturned rims and one white-pink flower",
    "ingwerbluete": "a torch ginger plant with a tall stem and a big glowing red-pink torch-shaped flower",
}

# Noch mehr Regenwald, nur zum Anschauen: riesige Bäume, Wurzeln, Büsche,
# Lianen und Blätter.
DEKO = {
    "ceiba": "the lower part of a gigantic ceiba (kapok) rainforest tree: a very tall, thick, light grey trunk "
    "rising straight up out of the top edge of the picture, with huge winding buttress roots spreading wide "
    "at the bottom, some moss and a few small plants growing on the trunk. The trunk is cut off by the top edge",
    "wurzeln": "a wide tangle of thick brown twisted tree roots lying flat on the forest floor, seen from the side",
    "busch": "a dense round green rainforest bush with many different big leaves",
    "farnbusch": "a low wide bush of bright green ferns",
    "liane": "a long green liana vine hanging straight down with leaves and a few small flowers, very tall and thin",
    "blaetter": "a small pile of fallen big tropical leaves in green, yellow and brown",
}

AUFTRAG = STIL + (
    "Draw one single rainforest plant for a nature game, centered, standing upright, the whole plant "
    "visible with nothing cut off, with plenty of empty white space around it: {was}. "
    "Plain pure white background, no ground, no text, no shadows."
)


DEKO_AUFTRAG = STIL + (
    "Draw one single element for a rainforest scene in a game, centered: {was}. "
    "Plain pure white background, no text, no shadows."
)


def stamm_fuellen(maske):
    """Füllt den Stamm Zeile für Zeile von der linken bis zur rechten Kante.

    Der Stamm ist fast so hell wie das Papier. Ohne das hätte er Löcher, die
    oben am Bildrand offen sind (darum hilft „Löcher füllen“ dort nicht).
    Unten, wo sich die Wurzeln ausbreiten, bleibt es, wie es ist.
    """
    maske = maske.copy()
    hoehe = maske.shape[0]
    for zeile in range(int(hoehe * 0.75)):
        spalten = np.nonzero(maske[zeile])[0]
        if spalten.size:
            maske[zeile, spalten[0] : spalten[-1] + 1] = True
    return maske


def papierloecher_entfernen(feld, maske):
    """Macht große Flächen in Papierfarbe innerhalb der Pflanze durchsichtig.

    Beim Ausschneiden werden Löcher gefüllt, damit helle Stellen der Zeichnung
    nicht verschwinden. Bei Pflanzen sind das aber oft Lücken zwischen den
    Blättern oder die Löcher in den Monstera-Blättern: Dort soll man durchsehen.
    """
    rgb = np.asarray(feld, dtype=float) / 255.0
    papier = np.median(rgb[~maske], axis=0) if (~maske).any() else np.array([1.0, 1.0, 1.0])
    wie_papier = np.abs(rgb - papier).max(axis=2) < 0.1
    loecher, anzahl = ndimage.label(maske & wie_papier)
    if anzahl == 0:
        return maske
    groessen = ndimage.sum(np.ones_like(loecher), loecher, range(1, anzahl + 1))
    gross = np.concatenate(([False], groessen > 120))[loecher]
    # Ein schmaler Rand bleibt stehen, damit die Striche nicht angeknabbert werden.
    gross = ndimage.binary_erosion(gross, iterations=2)
    return maske & ~gross


def eine_pflanze(name, was, vorlage, ohne_ki):
    ordner = PROJEKT / "Landschaft" / "Pflanzen-KI"
    ordner.mkdir(parents=True, exist_ok=True)
    aufgehoben = ordner / f"{name}.png"
    if not (ohne_ki and aufgehoben.exists()):
        print(f"Frage OpenAI nach: {name} …", flush=True)
        # Der Baum und die Liane sind hoch, darum ein hohes Bild
        groesse = "1024x1536" if name in ("ceiba", "liane") else "1024x1024"
        auftrag = DEKO_AUFTRAG.format(was=was) if name in DEKO else AUFTRAG.format(was=was)
        malen_lassen(vorlage, auftrag, groesse).save(aufgehoben)
    (feld, maske), = sachen_finden_einzeln(Image.open(aufgehoben).convert("RGB"))
    if name == "ceiba":
        maske = stamm_fuellen(maske)
    else:
        maske = papierloecher_entfernen(feld, maske)
    bild = sache_ausschneiden(feld, maske, name)
    # Große Teile (Baum, Liane) bleiben größer, damit sie im Spiel scharf sind.
    if name in ("ceiba", "liane"):
        bild = sache_ausschneiden(feld, maske, name, hoehe=900)
    ziel = PROJEKT / "public" / "bilder" / "pflanzen" / f"{name}.png"
    ziel.parent.mkdir(parents=True, exist_ok=True)
    bild.save(ziel)
    print(f"Fertig: {ziel.relative_to(PROJEKT)}", flush=True)


def main():
    ohne_ki = "--ohne-ki" in sys.argv
    vorlage = vorbild()
    with ThreadPoolExecutor(max_workers=4) as arbeiter:
        alle = {**PFLANZEN, **DEKO}
        for ergebnis in [arbeiter.submit(eine_pflanze, name, was, vorlage, ohne_ki) for name, was in alle.items()]:
            ergebnis.result()


if __name__ == "__main__":
    main()
