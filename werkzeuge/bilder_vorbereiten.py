"""Macht aus den Fotos der Bleistiftzeichnungen fertige Spielbilder.

Für jedes Foto: zuschneiden, gerade drehen, das Papier entfernen und die
Bleistiftlinien hell leuchten lassen. Das Ergebnis landet in public/bilder/.

Starten (im Projektordner):  python3 werkzeuge/bilder_vorbereiten.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

PROJEKT = Path(__file__).resolve().parent.parent
ZIEL = PROJEKT / "public" / "bilder"

# Ein Eintrag pro Zeichnung:
#   foto:       wo das Foto liegt
#   ziel:       wie das Spielbild heißen soll
#   ausschnitt: (links, oben, rechts, unten) in Pixeln des Fotos
#   drehen:     um wie viel Grad gegen den Uhrzeigersinn gedreht wird
#   radieren:   (optional) Rechtecke im Foto, die nicht zur Zeichnung gehören,
#               zum Beispiel ein Buchstabe vom Namen, der ins Bild ragt
ZEICHNUNGEN = [
    {
        "foto": "Kalamprios/Kalampria.jpg",
        "ziel": "kalamprios/kalampria.png",
        "ausschnitt": (480, 660, 1800, 2900),
        "drehen": 0,
        "radieren": [(840, 2858, 940, 2900)],
    },
    {
        "foto": "Kalamprios/Bisakatze.jpg",
        "ziel": "kalamprios/bisakatze.png",
        "ausschnitt": (880, 1040, 2080, 2300),
        "drehen": 0,
    },
    {
        "foto": "Charaktere/Kapapa.jpg",
        "ziel": "kalamprios/kapapa.png",
        "ausschnitt": (1300, 900, 3880, 2100),
        "drehen": 90,
    },
    {
        "foto": "Charaktere/kala.jpg",
        "ziel": "charaktere/kala.png",
        "ausschnitt": (900, 1080, 1740, 2700),
        "drehen": 0,
    },
    {
        "foto": "Charaktere/pflanstaria.jpg",
        "ziel": "charaktere/pflanstaria.png",
        "ausschnitt": (1792, 740, 2880, 1760),
        "drehen": 90,
    },
]

LINIENFARBE = (246, 240, 255)  # fast weiß, leicht lila
LEUCHTFARBE = (190, 150, 255)  # lila Schein um die Linien
KOERPERFARBE = (38, 20, 66)  # dunkle Füllung, damit der Hintergrund nicht durchscheint
HOEHE_IM_SPIEL = 640  # so hoch (in Pixeln) wird jedes Spielbild höchstens


def linien_finden(grau):
    """Gibt für jeden Pixel an, wie viel Bleistift dort ist (0 = Papier, 1 = Strich)."""
    grau = ndimage.gaussian_filter(grau, 1.5)
    # Das Papier ist nicht überall gleich hell (Schatten, Lampenlicht). Darum
    # schätzen wir die Papierhelligkeit rund um jeden Pixel und vergleichen damit.
    papier = ndimage.gaussian_filter(ndimage.maximum_filter(grau, size=61), 45)
    dunkler = 1.0 - grau / np.maximum(papier, 1e-6)
    linien = np.clip((dunkler - 0.045) / 0.16, 0.0, 1.0)

    # Kleine Flecken und Staubkörner auf dem Papier wegwerfen.
    stuecke, anzahl = ndimage.label(linien > 0.2)
    if anzahl:
        groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
        behalten = np.concatenate(([False], groessen >= 900))[stuecke]
        behalten = ndimage.binary_dilation(behalten, iterations=6)
        linien = linien * behalten
    return linien


def koerper_finden(linien):
    """Findet die Fläche innerhalb der Umrisse, auch wenn die Striche Lücken haben."""
    striche = linien > 0.25
    geschlossen = ndimage.binary_closing(striche, iterations=28, border_value=0)
    gefuellt = ndimage.binary_fill_holes(geschlossen)
    return ndimage.gaussian_filter(gefuellt.astype(float), 4)


def vorbereiten(eintrag):
    foto = Image.open(PROJEKT / eintrag["foto"]).convert("L")
    for rechteck in eintrag.get("radieren", []):
        # Mit der Papierfarbe vom linken Rand des Rechtecks übermalen.
        papier = foto.getpixel((rechteck[0], rechteck[1]))
        foto.paste(papier, rechteck)
    bild = foto.crop(eintrag["ausschnitt"])
    if eintrag["drehen"]:
        bild = bild.rotate(eintrag["drehen"], expand=True)
    grau = np.asarray(bild, dtype=float) / 255.0

    linien = linien_finden(grau)
    koerper = koerper_finden(linien)
    schein = np.clip(ndimage.gaussian_filter(linien, 9) * 1.6, 0.0, 1.0)

    # Drei Schichten übereinander: Körper, Schein, Linien.
    hoehe, breite = grau.shape
    farbe = np.zeros((hoehe, breite, 3))
    deckkraft = np.zeros((hoehe, breite))
    for schicht_farbe, schicht_deckkraft in (
        (KOERPERFARBE, koerper * 0.78),
        (LEUCHTFARBE, schein * 0.55),
        (LINIENFARBE, linien),
    ):
        neu = schicht_deckkraft + deckkraft * (1 - schicht_deckkraft)
        anteil = np.divide(schicht_deckkraft, neu, out=np.zeros_like(neu), where=neu > 0)
        farbe = farbe * (1 - anteil[..., None]) + np.array(schicht_farbe) * anteil[..., None]
        deckkraft = neu

    rgba = np.dstack([farbe, deckkraft * 255]).round().astype(np.uint8)
    ergebnis = Image.fromarray(rgba, "RGBA")

    # Leeren Rand abschneiden und auf Spielgröße verkleinern.
    ergebnis = ergebnis.crop(ergebnis.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    faktor = HOEHE_IM_SPIEL / max(ergebnis.size)
    ergebnis = ergebnis.resize(
        (round(ergebnis.width * faktor), round(ergebnis.height * faktor)), Image.LANCZOS
    )

    ziel = ZIEL / eintrag["ziel"]
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ergebnis.save(ziel)
    print(f"{eintrag['foto']}  ->  {ziel.relative_to(PROJEKT)}  {ergebnis.size}")


if __name__ == "__main__":
    for eintrag in ZEICHNUNGEN:
        vorbereiten(eintrag)
