"""
echantillons_azure.py — fabrique des échantillons pour choisir la voix Azure de Lilo.
Pour chaque voix : une phrase de Lilo, des sons de lettres, des syllabes et des mots.
Résultat : ~/Desktop/echantillons-voix-lilo/azure/
"""

import sys
import subprocess
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generer_voix as g  # noqa: E402

if not g.AZURE:
    sys.exit("Pas de clé Azure dans outils/azure.env.")

SORTIE = Path.home() / "Desktop" / "echantillons-voix-lilo" / "azure"
SORTIE.mkdir(parents=True, exist_ok=True)

VOIX = {
    "denise": "fr-FR-DeniseNeural",          # femme, chaleureuse
    "eloise": "fr-FR-EloiseNeural",          # voix d'enfant
    "vivienne": "fr-FR-VivienneMultilingualNeural",  # femme, très naturelle
}

PHRASE = "Bonjour ! Je suis Lilo, la petite luciole. À ton avis, qui se cache dans ce buisson ?"
# Sons de lettres puis syllabes et mots, séparés par une petite pause
SONS = ["[[ ˈa ]]|a", "[[ ˈy ]]|u", "[[ ˈe ]]|é", "[[ mːː ]]|m", "[[ ˈmə ]]|m", "[[ sːː ]]|s", "[[ ˈsə ]]|s",
        "[[ ˈʁə ]]|r", "[[ ˈpə ]]|p", "[[ ˈtə ]]|t"]
SYLLABES = ["[[ ˈma ]]|ma", "[[ ˈly ]]|lu", "[[ ˈve ]]|vé", "[[ ˈbə ]]|be", "[[ ˈʁi ]]|ri", "[[ ˈso ]]|so",
            "moto", "vélo", "fusée", "igloo"]


def suite(elements, voix):
    """Plusieurs éléments dans un seul SSML, avec des pauses."""
    morceaux = []
    for e in elements:
        doc = g.ssml(e, voix=voix)
        interieur = doc.split('">', 2)[2].rsplit("</prosody>", 1)[0]
        morceaux.append(interieur)
    corps = '<break time="700ms"/>'.join(morceaux)
    return (f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR">'
            f'<voice name="{voix}"><prosody rate="{g.AZURE["AZURE_VITESSE"]}">{corps}</prosody></voice></speak>')


for nom, voix in VOIX.items():
    for titre, doc in [("1-phrase", g.ssml(PHRASE, voix=voix)), ("2-sons", suite(SONS, voix)), ("3-syllabes-mots", suite(SYLLABES, voix))]:
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "x.wav"
            g.appeler_azure(doc, wav)
            subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", str(wav), str(SORTIE / f"{nom}-{titre}.m4a")], check=True)
        print(f"  ✓ {nom}-{titre}")
print(f"\nÉchantillons dans : {SORTIE}")
