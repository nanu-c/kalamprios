"""Macht aus den Fotos der Zeichnungen fertige Spielbilder.

Für jedes Foto: zuschneiden, gerade drehen und das Papier entfernen.
Bleistiftzeichnungen werden zu hell leuchtenden Linien. Bunte Zeichnungen
behalten ihre Farben und bekommen einen hellen Rand wie ein Sticker.
Landschaft und Gegenstände werden wie ein Ausmalbild ausgemalt: Jede Fläche
zwischen den Strichen bekommt eine passende Farbe.
Das Ergebnis landet in public/bilder/.

Starten (im Projektordner):  .venv/bin/python werkzeuge/bilder_vorbereiten.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
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
#   bunt:       (optional) True für Zeichnungen mit Buntstift: Die Farben bleiben.
#   ausmalen:   (optional) 'see', 'baum', 'kristall' oder 'mond': Die Zeichnung wird
#               ausgemalt, so wie es zu diesem Ding passt.
#   hoehe:      (optional) so hoch wird das Spielbild höchstens, sonst 640
#   ein_stueck: (optional, nur bunt) True: Nur das größte Stück bleibt, Flecken
#               auf dem Papier daneben fallen weg
#   farbschwelle: (optional, nur bunt) höher als 0.12, wenn Flecken vom Papier
#               mit ins Bild kommen
#   eng:        (optional, nur bunt) True: eng am Stift ausschneiden, mit
#               schmalem Rand. Gut bei Strichen mit viel Papier dazwischen
#               (Federn, dünne Beine).
#   toenen:     (optional, nur bunt) (rot, grün, blau): Die Farben werden ein
#               bisschen in diese Richtung getönt, 1 heißt unverändert
#   umriss:     (optional, nur bunt) Ecken (x, y) in Pixeln des zugeschnittenen
#               und gedrehten Bildes: Alles innerhalb gehört zur Zeichnung, auch
#               Papier ohne Farbe (zum Beispiel Hauswände mit ganz blassen Strichen)
#   papierfarbe: (optional, nur bunt) (rot, grün, blau) von 0 bis 1: In dieser
#               Farbe wird das Papier in der Zeichnung ausgemalt
#   farblos:    (optional, nur bunt) True: Die Farben werden ausgesaugt, übrig
#               bleibt fast Schwarz
#   schwelle:   (optional, nur Bleistift) höher als 0.045, wenn graue Flecken
#               vom Papier mit ins Bild kommen
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
        "foto": "Kalamprios/Bolo.jpg",
        "ziel": "kalamprios/bolo.png",
        "ausschnitt": (250, 380, 1200, 1010),
        "drehen": 0,
        "bunt": True,
    },
    {
        "foto": "Kalamprios/Mola.jpg",
        "ziel": "kalamprios/mola.png",
        "ausschnitt": (170, 350, 880, 860),
        "drehen": 0,
        "radieren": [(470, 780, 610, 860)],
        "bunt": True,
    },
    {
        "foto": "Kalamprios/Qalutu.jpg",
        "ziel": "kalamprios/qalutu.png",
        "ausschnitt": (100, 150, 690, 850),
        "drehen": 0,
        "radieren": [(260, 800, 360, 850), (560, 150, 700, 200)],
        "bunt": True,
    },
    {
        "foto": "Kalamprios/Geheimnis.jpg",
        "ziel": "kalamprios/geheimnis.png",
        "ausschnitt": (28, 630, 1100, 1285),
        "drehen": 0,
        "bunt": True,
    },
    {
        "foto": "Kalamprios/neu.jpg",
        "ziel": "kalamprios/kabon.png",
        "ausschnitt": (1330, 1450, 2350, 1925),
        "drehen": 180,
        "ein_stueck": True,
        "bunt": True,
    },
    {
        "foto": "Kalamprios/neu.jpg",
        "ziel": "kalamprios/simfita.png",
        "ausschnitt": (200, 1990, 1220, 2880),
        "drehen": 0,
        "radieren": [(370, 2600, 645, 2710)],
        "bunt": True,
    },
    {
        "foto": "Kalamprios/neu.jpg",
        "ziel": "kalamprios/taktik.png",
        "ausschnitt": (1440, 2370, 2200, 3160),
        "drehen": 0,
        "schwelle": 0.08,
    },
    {
        "foto": "Kalamprios/Tschank.jpg",
        "ziel": "kalamprios/tschank.png",
        "ausschnitt": (490, 820, 3480, 2560),
        "drehen": 90,
        "schwelle": 0.08,
    },
    {
        "foto": "Kalamprios/Blitznara.jpg",
        "ziel": "kalamprios/blitznara.png",
        "ausschnitt": (660, 360, 3100, 2960),
        "drehen": 0,
        "radieren": [(600, 2300, 820, 3000)],
        "schwelle": 0.06,
    },
    {
        "foto": "Kalamprios/Elefantia.jpg",
        "ziel": "kalamprios/elefantia.png",
        "ausschnitt": (1840, 260, 3000, 2520),
        "drehen": 90,
        "radieren": [(2680, 1940, 2860, 2520)],
        "bunt": True,
        "ein_stueck": True,
    },
    {
        "foto": "Kalamprios/Kristalta.jpg",
        "ziel": "kalamprios/kristalta.png",
        "ausschnitt": (1960, 1150, 3390, 2250),
        "drehen": 90,
        "bunt": True,
        "ein_stueck": True,
    },
    {
        "foto": "Kalamprios/Pflinia.jpg",
        "ziel": "kalamprios/pflinia.png",
        "ausschnitt": (2040, 1040, 3360, 2200),
        "drehen": 90,
        "bunt": True,
        "ein_stueck": True,
    },
    {
        "foto": "Kalamprios/Schnektata.jpg",
        "ziel": "kalamprios/schnektata.png",
        "ausschnitt": (2000, 330, 3640, 2580),
        "drehen": 90,
        "radieren": [(2990, 1940, 3460, 2900)],
        "bunt": True,
    },
    {
        "foto": "Kalamprios/Totantia.jpg",
        "ziel": "kalamprios/totantia.png",
        "ausschnitt": (1255, 1060, 2920, 2520),
        "drehen": 90,
        # Die Schrift "Kristall" und "Totantia" steht ganz nah an der Zeichnung.
        "radieren": [
            (2533, 990, 3100, 1268),
            (2610, 1450, 2700, 1515),
            (2633, 1700, 3010, 2012),
            (1250, 1955, 1470, 2520),
            (2600, 2400, 3000, 2600),
        ],
        "bunt": True,
        "ein_stueck": True,
    },
    {
        "foto": "Kalamprios/Zeltakel.jpg",
        "ziel": "kalamprios/zeittakel.png",
        "ausschnitt": (680, 1260, 1640, 2260),
        "drehen": 0,
        "bunt": True,
        "ein_stueck": True,
    },
    {
        "foto": "Kalamprios/Zetarata.jpg",
        "ziel": "kalamprios/zetarata.png",
        "ausschnitt": (1720, 1330, 2950, 2120),
        "drehen": 90,
        "bunt": True,
        "ein_stueck": True,
    },
    {
        "foto": "Kalamprios/Robossor.jpg",
        "ziel": "kalamprios/robossor.png",
        "ausschnitt": (500, 1880, 1540, 3200),
        "drehen": 0,
        "bunt": True,
        "ein_stueck": True,
        "eng": True,
        "farbschwelle": 0.18,
    },
    {
        "foto": "Kalamprios/Eulator.jpg",
        "ziel": "kalamprios/eulator.png",
        "ausschnitt": (850, 1430, 1980, 2820),
        "drehen": 0,
        "bunt": True,
        "ein_stueck": True,
        "eng": True,
        "farbschwelle": 0.18,
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
    {
        "foto": "Landschaft/Mondsee.jpg",
        "ziel": "landschaft/mondsee.png",
        "ausschnitt": (150, 400, 2980, 3780),
        "drehen": 90,
        "ausmalen": "see",
        "hoehe": 1300,
    },
    {
        "foto": "Landschaft/Bäume.jpg",
        "ziel": "landschaft/baum-rund.png",
        "ausschnitt": (380, 320, 2900, 1600),
        "drehen": 90,
        "ausmalen": "baum",
        "hoehe": 480,
    },
    {
        "foto": "Landschaft/Bäume.jpg",
        "ziel": "landschaft/baum-schief.png",
        "ausschnitt": (300, 2280, 2880, 3560),
        "drehen": 90,
        "ausmalen": "baum",
        "hoehe": 480,
    },
    {
        "foto": "Gegenstände/Fangkristall.jpg",
        "ziel": "gegenstaende/fangkristall.png",
        "ausschnitt": (1450, 1150, 2650, 2830),
        "drehen": 90,
        "ausmalen": "kristall",
        "hoehe": 300,
    },
    {
        "foto": "Landschaft/Mond.jpg",
        "ziel": "landschaft/mond.png",
        "ausschnitt": (1560, 920, 2820, 2120),
        "drehen": 0,
        "ausmalen": "mond",
        "hoehe": 300,
    },
    {
        "foto": "Landschaft/Pilz.jpg",
        "ziel": "landschaft/pilz.png",
        "ausschnitt": (590, 1300, 2230, 3245),
        "drehen": 0,
        "bunt": True,
        "farbschwelle": 0.22,
        # Ein bisschen lila wie der Kristallwald
        "toenen": (0.9, 0.8, 1.05),
        "ein_stueck": True,
        "hoehe": 300,
    },
    {
        "foto": "Landschaft/Stein.jpg",
        "ziel": "landschaft/stein.png",
        "ausschnitt": (440, 1050, 2740, 2700),
        "drehen": 0,
        "bunt": True,
        "ein_stueck": True,
        "hoehe": 360,
    },
    {
        "foto": "Landschaft/Stein2.jpg",
        "ziel": "landschaft/stein-schale.png",
        "ausschnitt": (430, 1030, 2600, 2620),
        "drehen": 180,
        "bunt": True,
        "ein_stueck": True,
        "hoehe": 360,
    },
    {
        "foto": "Landschaft/Stein3.jpg",
        "ziel": "landschaft/stein-beine.png",
        "ausschnitt": (960, 720, 3130, 2830),
        "drehen": 180,
        "bunt": True,
        "ein_stueck": True,
        "hoehe": 360,
    },
    {
        "foto": "Landschaft/Haus.jpg",
        "ziel": "landschaft/haus-1.png",
        "ausschnitt": (470, 640, 2510, 2420),
        "drehen": -90,
        "bunt": True,
        "ein_stueck": True,
        "umriss": [(317, 49), (1537, 24), (1766, 439), (1732, 463), (1741, 2035), (300, 2035), (300, 2005), (20, 1990), (0, 1720), (50, 1590), (122, 1580), (122, 439), (10, 390)],
        "papierfarbe": (0.86, 0.8, 0.95),
        "hoehe": 420,
    },
    # Derselbe Kristall zweimal: einmal bunt, einmal ausgesaugt vom Schatten.
    {
        "foto": "Landschaft/Kristal.jpg",
        "ziel": "landschaft/kristall-bunt.png",
        "ausschnitt": (1240, 600, 2700, 2880),
        "drehen": 180,
        "bunt": True,
        "ein_stueck": True,
        "hoehe": 340,
    },
    {
        "foto": "Landschaft/Kristal.jpg",
        "ziel": "landschaft/kristall-ausgesaugt.png",
        "ausschnitt": (1240, 600, 2700, 2880),
        "drehen": 180,
        "bunt": True,
        "ein_stueck": True,
        "farblos": True,
        "hoehe": 340,
    },
    {
        "foto": "Gegenstände/Rätselstein_nicht gelöst.jpg",
        "ziel": "gegenstaende/raetselstein.png",
        "ausschnitt": (600, 780, 2330, 3260),
        "drehen": 90,
        "bunt": True,
        "ein_stueck": True,
        "hoehe": 300,
    },
    {
        "foto": "Gegenstände/Rätselstein_gelöst.jpg",
        "ziel": "gegenstaende/raetselstein-geloest.png",
        "ausschnitt": (980, 1260, 2250, 2880),
        "drehen": 90,
        "bunt": True,
        "farbschwelle": 0.18,
        "ein_stueck": True,
        "hoehe": 300,
    },
]

LINIENFARBE = (246, 240, 255)  # fast weiß, leicht lila
LEUCHTFARBE = (190, 150, 255)  # lila Schein um die Linien
KOERPERFARBE = (38, 20, 66)  # dunkle Füllung, damit der Hintergrund nicht durchscheint

# Die Figuren (Kala, Pflanstaria) leuchten golden, damit man sie nicht mit
# den Kalamprios verwechselt.
FIGUR_FARBEN = {
    "linien": (255, 247, 226),  # fast weiß, leicht golden
    "leuchten": (255, 184, 72),  # goldener Schein
    "koerper": (54, 30, 46),  # dunkle, warme Füllung
}
HOEHE_IM_SPIEL = 640  # so hoch (in Pixeln) wird jedes Spielbild höchstens


def linien_finden(grau, schwelle=0.045):
    """Gibt für jeden Pixel an, wie viel Bleistift dort ist (0 = Papier, 1 = Strich).

    schwelle: so viel dunkler als das Papier muss es mindestens sein, damit es zählt.
    """
    grau = ndimage.gaussian_filter(grau, 1.5)
    # Das Papier ist nicht überall gleich hell (Schatten, Lampenlicht). Darum
    # schätzen wir die Papierhelligkeit rund um jeden Pixel und vergleichen damit.
    papier = ndimage.gaussian_filter(ndimage.maximum_filter(grau, size=61), 45)
    dunkler = 1.0 - grau / np.maximum(papier, 1e-6)
    linien = np.clip((dunkler - schwelle) / 0.16, 0.0, 1.0)

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


def bunt_vorbereiten(eintrag):
    """Schneidet eine Buntstiftzeichnung aus und behält ihre Farben."""
    foto = Image.open(PROJEKT / eintrag["foto"]).convert("RGB")
    for rechteck in eintrag.get("radieren", []):
        papier = foto.getpixel((rechteck[0], rechteck[1]))
        foto.paste(papier, rechteck)
    bild = foto.crop(eintrag["ausschnitt"])
    if eintrag["drehen"]:
        bild = bild.rotate(eintrag["drehen"], expand=True, fillcolor=bild.getpixel((0, 0)))
    rgb = np.asarray(bild, dtype=float) / 255.0

    # Die Helligkeit des Papiers rund um jeden Pixel schätzen. Dafür zählt nur
    # der dunkelste Farbkanal: Papier ist in allen Kanälen hell, Buntstift nicht.
    dunkelster = rgb.min(axis=2)
    papier = ndimage.gaussian_filter(ndimage.maximum_filter(dunkelster, size=61), 45)
    weiss = np.clip(rgb / np.maximum(papier, 1e-6)[..., None], 0.0, 1.0)  # Papier wird weiß

    # Farbe ist dort, wo mindestens ein Kanal deutlich dunkler ist als das Papier.
    farbig = ndimage.gaussian_filter((1.0 - weiss).max(axis=2), 1.2)
    striche = farbig > eintrag.get("farbschwelle", 0.12)
    stuecke, anzahl = ndimage.label(striche)
    if anzahl:
        groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
        striche = np.concatenate(([False], groessen >= 300))[stuecke]

    # Die Fläche der Zeichnung: Lücken schließen, innen füllen, ein Rand drumherum.
    eng = eintrag.get("eng", False)
    schliessen = 3 if eng else 8
    flaeche = ndimage.binary_closing(striche, iterations=schliessen, border_value=0)
    flaeche = ndimage.binary_fill_holes(flaeche)
    flaeche = ndimage.binary_dilation(flaeche, iterations=4 if eng else 9)
    if eintrag.get("umriss"):
        maske = Image.new("L", bild.size, 0)
        ImageDraw.Draw(maske).polygon(eintrag["umriss"], fill=255)
        flaeche = np.asarray(maske) > 0
    if eintrag.get("ein_stueck"):
        stuecke, anzahl = ndimage.label(flaeche)
        groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
        flaeche = stuecke == np.argmax(groessen) + 1
    deckkraft = np.clip(ndimage.gaussian_filter(flaeche.astype(float), 1.5) * 1.2, 0.0, 1.0)

    # Farben etwas kräftiger machen, damit sie auf dem dunklen Boden leuchten.
    grau = weiss.mean(axis=2, keepdims=True)
    farbe = np.clip(grau + (weiss - grau) * 1.35, 0.0, 1.0)
    # Wo kein Stift ist, wird das Papier ganz weiß, mit einem Hauch Lila.
    stift = np.clip(farbig / 0.15, 0.0, 1.0)[..., None]
    farbe = farbe * stift + np.array(eintrag.get("papierfarbe", (0.97, 0.95, 1.0))) * (1 - stift)
    if eintrag.get("toenen"):
        # Nur der Stift wird getönt, der helle Rand bleibt.
        farbe = farbe * (1 - stift) + farbe * np.array(eintrag["toenen"]) * stift
    if eng:
        # Papier ohne Stift wird durchsichtig, nur ein schmaler heller Rand bleibt.
        mit_rand = ndimage.gaussian_filter(ndimage.maximum_filter(stift[..., 0], size=5), 1.5)
        deckkraft = deckkraft * np.clip(mit_rand * 1.5, 0.0, 1.0)
    if eintrag.get("farblos"):
        # Ausgesaugt: fast schwarz. Nur die Striche schimmern noch ganz
        # schwach lila, damit man die Form erkennt.
        hell = farbe.mean(axis=2, keepdims=True)
        farbe = (0.05 + (1 - hell) * 0.16) * np.array([0.9, 0.8, 1.15])

    rgba = np.dstack([farbe * 255, deckkraft * 255]).round().astype(np.uint8)
    speichern(eintrag, Image.fromarray(rgba, "RGBA"))


# ---------------------------------------------------------------- Ausmalbilder


def farbe(zahl):
    """Macht aus einer Farbzahl wie 0x8a5be0 drei Werte von 0 bis 1."""
    return np.array([(zahl >> 16) & 0xFF, (zahl >> 8) & 0xFF, zahl & 0xFF]) / 255.0


def uebereinander(schichten):
    """Legt Schichten übereinander, die unterste zuerst.

    Jede Schicht ist (Farbe, Deckkraft). Die Farbe ist eine Farbe für alles
    oder ein Bild mit einer Farbe pro Pixel, die Deckkraft geht von 0 bis 1.
    """
    hoehe, breite = schichten[0][1].shape
    bild = np.zeros((hoehe, breite, 3))
    deckkraft = np.zeros((hoehe, breite))
    for schicht_farbe, schicht_deckkraft in schichten:
        neu = schicht_deckkraft + deckkraft * (1 - schicht_deckkraft)
        anteil = np.divide(schicht_deckkraft, neu, out=np.zeros_like(neu), where=neu > 0)[..., None]
        bild = bild * (1 - anteil) + np.asarray(schicht_farbe, dtype=float) * anteil
        deckkraft = neu
    return Image.fromarray(np.dstack([bild * 255, deckkraft * 255]).round().astype(np.uint8), "RGBA")


def flaechen_finden(eintrag, verkleinern=2):
    """Findet die Striche und nummeriert die Flächen dazwischen wie in einem Ausmalbild.

    Gibt zurück: wie viel Bleistift wo ist, die Nummer der Fläche an jedem Pixel
    (0 = Strich) und die Nummern der Flächen außen herum, die das Papier sind.
    """
    foto = Image.open(PROJEKT / eintrag["foto"]).convert("L")
    bild = foto.crop(eintrag["ausschnitt"])
    if eintrag["drehen"]:
        bild = bild.rotate(eintrag["drehen"], expand=True, fillcolor=bild.getpixel((0, 0)))
    # Die Fotos sind sehr groß. Halb so groß reicht und geht viel schneller.
    bild = bild.resize((bild.width // verkleinern, bild.height // verkleinern), Image.LANCZOS)
    linien = linien_finden(np.asarray(bild, dtype=float) / 255.0)

    # Kleine Lücken in den Strichen schließen, damit keine Farbe ausläuft.
    striche = ndimage.binary_closing(linien > 0.25, iterations=2)
    flaechen, anzahl = ndimage.label(~striche)
    rand = np.concatenate([flaechen[0], flaechen[-1], flaechen[:, 0], flaechen[:, -1]])
    papier = set(np.unique(rand)) - {0}
    groessen = ndimage.sum(np.ones_like(flaechen), flaechen, range(anzahl + 1))
    return linien, flaechen, papier, groessen


def unter_die_striche(farben, gemalt):
    """Malt die Farbe auch unter die Striche, jeweils von der nächsten Fläche."""
    _, (zeile, spalte) = ndimage.distance_transform_edt(~gemalt, return_indices=True)
    return farben[zeile, spalte]


def ausmalen(eintrag, farben, gemalt, linien, linienfarbe, mit_schein=False):
    """Legt die Striche über die ausgemalten Flächen und speichert das Bild."""
    farben = unter_die_striche(farben, gemalt)
    innen = ndimage.binary_fill_holes(gemalt | (linien > 0.25)).astype(float)
    schichten = [(farben, ndimage.gaussian_filter(innen, 1))]
    if mit_schein:
        schein = np.clip(ndimage.gaussian_filter(linien, 6) * 1.6, 0.0, 1.0)
        schichten.append((farbe(LEUCHTFARBE[0] << 16 | LEUCHTFARBE[1] << 8 | LEUCHTFARBE[2]), schein * 0.55))
    schichten.append((farbe(linienfarbe), linien))
    speichern(eintrag, uebereinander(schichten))


def see_ausmalen(eintrag):
    """Der Mondsee: Wasser, Steine am Ufer, Seerosen, Blüten und in der Mitte der Mond."""
    linien, flaechen, papier, groessen = flaechen_finden(eintrag)
    innen = [nummer for nummer in range(1, len(groessen)) if nummer not in papier]
    wasser_nummer = max(innen, key=lambda nummer: groessen[nummer])
    wasser = flaechen == wasser_nummer
    # Alles, was ganz vom Wasser umschlossen ist, schwimmt darauf.
    see = ndimage.binary_fill_holes(wasser)
    schwimmt = [n for n in innen if n != wasser_nummer and see[flaechen == n].mean() > 0.9]
    mond = max(schwimmt, key=lambda nummer: groessen[nummer])

    zufall = np.random.default_rng(7)
    farben = np.zeros(flaechen.shape + (3,))

    # Wasser: am Ufer dunkel, zur Mitte heller, rund um den Mond leuchtet es.
    tiefe = ndimage.distance_transform_edt(see)
    tiefe = np.clip(tiefe / tiefe.max() * 1.6, 0.0, 1.0)[..., None]
    wasserfarbe = farbe(0x1D2F6E) * (1 - tiefe) + farbe(0x3058B0) * tiefe
    vom_mond = ndimage.distance_transform_edt(flaechen != mond)
    glanz = np.exp(-vom_mond / (0.12 * see.shape[1]))[..., None] * 0.55
    wasserfarbe = wasserfarbe * (1 - glanz) + farbe(0xD8D0FF) * glanz
    farben[wasser] = wasserfarbe[wasser]

    for nummer in innen:
        if nummer == wasser_nummer:
            continue
        flaeche = flaechen == nummer
        if nummer == mond:
            farben[flaeche] = farbe(0xFFF6D6)
        elif nummer in schwimmt and groessen[nummer] < groessen[mond] * 0.1:
            farben[flaeche] = farbe(zufall.choice([0xFF9AD5, 0xFFC2E6]))  # Blüte
        elif nummer in schwimmt:
            farben[flaeche] = farbe(zufall.choice([0x3FA59A, 0x4FB88E]))  # Seerose
        else:
            farben[flaeche] = farbe(zufall.choice([0x8A76B8, 0x9C8ACB, 0x7A67A8]))  # Stein

    gemalt = (flaechen > 0) & ~np.isin(flaechen, list(papier))
    ausmalen(eintrag, farben, gemalt, linien, 0x1A1035)


def baum_ausmalen(eintrag):
    """Ein Baum: oben eine lila Krone, unten ein dunkler Stamm."""
    linien, flaechen, papier, _ = flaechen_finden(eintrag)
    # Der Umriss ist ein einziger langer Strich. Alles andere sind Falten im Papier.
    striche, anzahl = ndimage.label(linien > 0.25)
    if anzahl > 1:
        groessen = ndimage.sum(np.ones_like(striche), striche, range(1, anzahl + 1))
        umriss = ndimage.binary_dilation(striche == np.argmax(groessen) + 1, iterations=4)
        linien = linien * umriss
    baum = ndimage.binary_fill_holes((flaechen > 0) & ~np.isin(flaechen, list(papier)) | (linien > 0.25))
    stuecke, anzahl = ndimage.label(baum)
    groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
    baum = stuecke == np.argmax(groessen) + 1  # nur der Baum, keine Krümel daneben
    linien = linien * ndimage.binary_dilation(baum, iterations=3)

    # Die Krone ist breit, der Stamm schmal. Ein Kreis, etwas breiter als der
    # Stamm, passt nur in die Krone: Was er erreicht, ist Krone.
    zeilen = np.nonzero(baum.any(axis=1))[0]
    oben, unten = zeilen[0], zeilen[-1]
    stammbreite = min(baum[int(oben + anteil * (unten - oben))].sum() for anteil in (0.5, 0.6, 0.7, 0.8))
    radius = int(stammbreite * 0.62)
    # (So rechnet man schnell aus, wohin der Kreis überall kommt: Seine Mitte
    # passt dorthin, wo es bis zum Rand weit genug ist, und von da aus
    # reicht er noch einen Radius weit.)
    mitten = ndimage.distance_transform_edt(baum) >= radius
    krone = baum & (ndimage.distance_transform_edt(~mitten) <= radius)
    # Der Stamm ist das Stück, das bis ganz nach unten reicht.
    rest, _ = ndimage.label(baum & ~krone)
    unterste = rest[unten - 2][rest[unten - 2] > 0]
    stamm = rest == np.bincount(unterste).argmax() if unterste.size else np.zeros_like(baum)

    # Licht kommt von oben links.
    kronen_spalten = np.nonzero(krone.any(axis=0))[0]
    hell_y, hell_x = oben + radius, kronen_spalten[0] + radius
    yy, xx = np.indices(baum.shape)
    licht = np.clip(1 - np.hypot(yy - hell_y, xx - hell_x) / (radius * 3.5), 0.0, 1.0)[..., None]
    farben = farbe(0x6F36B3) * (1 - licht) + farbe(0xA36AE6) * licht
    farben[stamm] = farbe(0x3A1D5E)
    ausmalen(eintrag, farben, baum, linien, 0x1A0B30)


def kristall_ausmalen(eintrag):
    """Ein Kristall: jede Fläche in einer anderen Kristallfarbe, mit leuchtendem Rand."""
    linien, flaechen, papier, groessen = flaechen_finden(eintrag)
    tone = [0xB99CF0, 0x8A5BE0, 0x9CC0F2, 0x5B8FE0, 0xD9C9FF]
    farben = np.zeros(flaechen.shape + (3,))
    nummern = [n for n in range(1, len(groessen)) if n not in papier]
    for zaehler, nummer in enumerate(sorted(nummern, key=lambda n: -groessen[n])):
        farben[flaechen == nummer] = farbe(tone[zaehler % len(tone)])
    # Oben ein bisschen heller, wie Licht, das durch den Kristall scheint.
    hoehe = np.linspace(0.35, 0.0, flaechen.shape[0])[:, None, None]
    farben = farben * (1 - hoehe) + hoehe
    gemalt = np.isin(flaechen, nummern)
    ausmalen(eintrag, farben, gemalt, linien, 0xF6F0FF, mit_schein=True)


def mond_ausmalen(eintrag):
    """Der Mond: ganz dicht schraffiert, darum keine Flächen wie im Ausmalbild.

    Die Scheibe wird hell wie Mondlicht. Wo viel Bleistift ist (die Krater und
    die Schraffur), wird sie etwas dunkler und lila, so bleibt die Zeichnung zu sehen.
    """
    foto = Image.open(PROJEKT / eintrag["foto"]).convert("L")
    bild = foto.crop(eintrag["ausschnitt"])
    if eintrag["drehen"]:
        bild = bild.rotate(eintrag["drehen"], expand=True, fillcolor=bild.getpixel((0, 0)))
    bild = bild.resize((bild.width // 2, bild.height // 2), Image.LANCZOS)
    linien = linien_finden(np.asarray(bild, dtype=float) / 255.0, 0.03)

    # Die Scheibe: alles innerhalb der Schraffur, nur das größte Stück.
    scheibe = ndimage.binary_closing(linien > 0.15, iterations=10, border_value=0)
    scheibe = ndimage.binary_fill_holes(scheibe)
    stuecke, anzahl = ndimage.label(scheibe)
    groessen = ndimage.sum(np.ones_like(stuecke), stuecke, range(1, anzahl + 1))
    scheibe = stuecke == np.argmax(groessen) + 1
    linien = linien * scheibe

    # Licht kommt von oben links, unten rechts ist der Mond etwas lila.
    yy, xx = np.indices(scheibe.shape)
    hoehe, breite = scheibe.shape
    licht = np.clip(1 - np.hypot(yy - hoehe * 0.3, xx - breite * 0.3) / (max(hoehe, breite) * 0.9), 0.0, 1.0)[..., None]
    farben = farbe(0xC9B8F0) * (1 - licht) + farbe(0xFFF6D6) * licht
    bleistift = ndimage.gaussian_filter(linien, 1.0)[..., None] * 0.45
    farben = farben * (1 - bleistift) + farbe(0x8A76B8) * bleistift
    deckkraft = np.clip(ndimage.gaussian_filter(scheibe.astype(float), 2) * 1.3, 0.0, 1.0)
    speichern(eintrag, uebereinander([(farben, deckkraft)]))


AUSMALEN = {"see": see_ausmalen, "baum": baum_ausmalen, "kristall": kristall_ausmalen, "mond": mond_ausmalen}


def speichern(eintrag, ergebnis):
    """Schneidet den leeren Rand ab, verkleinert auf Spielgröße und speichert."""
    ergebnis = ergebnis.crop(ergebnis.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    faktor = eintrag.get("hoehe", HOEHE_IM_SPIEL) / max(ergebnis.size)
    if faktor < 1:
        ergebnis = ergebnis.resize(
            (round(ergebnis.width * faktor), round(ergebnis.height * faktor)), Image.LANCZOS
        )
    ziel = ZIEL / eintrag["ziel"]
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ergebnis.save(ziel)
    print(f"{eintrag['foto']}  ->  {ziel.relative_to(PROJEKT)}  {ergebnis.size}")


def vorbereiten(eintrag):
    if eintrag.get("ausmalen"):
        AUSMALEN[eintrag["ausmalen"]](eintrag)
        return
    if eintrag.get("bunt"):
        bunt_vorbereiten(eintrag)
        return
    foto = Image.open(PROJEKT / eintrag["foto"]).convert("L")
    for rechteck in eintrag.get("radieren", []):
        # Mit der Papierfarbe vom linken Rand des Rechtecks übermalen.
        papier = foto.getpixel((rechteck[0], rechteck[1]))
        foto.paste(papier, rechteck)
    bild = foto.crop(eintrag["ausschnitt"])
    if eintrag["drehen"]:
        bild = bild.rotate(eintrag["drehen"], expand=True)
    grau = np.asarray(bild, dtype=float) / 255.0

    linien = linien_finden(grau, eintrag.get("schwelle", 0.045))
    koerper = koerper_finden(linien)
    schein = np.clip(ndimage.gaussian_filter(linien, 9) * 1.6, 0.0, 1.0)

    # Drei Schichten übereinander: Körper, Schein, Linien.
    hoehe, breite = grau.shape
    farbe = np.zeros((hoehe, breite, 3))
    deckkraft = np.zeros((hoehe, breite))
    figur = eintrag["ziel"].startswith("charaktere/")
    koerperfarbe = FIGUR_FARBEN["koerper"] if figur else KOERPERFARBE
    leuchtfarbe = FIGUR_FARBEN["leuchten"] if figur else LEUCHTFARBE
    linienfarbe = FIGUR_FARBEN["linien"] if figur else LINIENFARBE
    for schicht_farbe, schicht_deckkraft in (
        (koerperfarbe, koerper * 0.78),
        (leuchtfarbe, schein * (0.75 if figur else 0.55)),
        (linienfarbe, linien),
    ):
        neu = schicht_deckkraft + deckkraft * (1 - schicht_deckkraft)
        anteil = np.divide(schicht_deckkraft, neu, out=np.zeros_like(neu), where=neu > 0)
        farbe = farbe * (1 - anteil[..., None]) + np.array(schicht_farbe) * anteil[..., None]
        deckkraft = neu

    rgba = np.dstack([farbe, deckkraft * 255]).round().astype(np.uint8)
    speichern(eintrag, Image.fromarray(rgba, "RGBA"))


if __name__ == "__main__":
    import sys

    # Mit Namen dahinter werden nur diese Bilder gemacht, zum Beispiel:
    #   .venv/bin/python werkzeuge/bilder_vorbereiten.py bolo mola
    nur = {name.lower() for name in sys.argv[1:]}
    for eintrag in ZEICHNUNGEN:
        if not nur or Path(eintrag["ziel"]).stem in nur:
            vorbereiten(eintrag)
