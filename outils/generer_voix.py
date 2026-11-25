"""
generer_voix.py — fabrique la voix de Lilo pour chaque phrase du jeu.

Lit js/repliques.js, et pour chaque phrase :
  - génère un fichier audio avec la voix libre « Siwis » (Piper, sur le Mac) ;
  - le range dans voix/lilo/<identifiant>.m4a
Puis écrit voix/index.json : la liste des voix disponibles, que le jeu lit
au démarrage. Tes enregistrements perso (voix/<identifiant>.mp3) y sont
aussi listés, et passent toujours en priorité.

Seules les phrases nouvelles ou modifiées sont regénérées.
À lancer avec : ./outils/generer-voix.sh
"""

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
OUTILS = RACINE / "outils"
MODELE = OUTILS / "modeles" / "fr_FR-siwis-medium.onnx"
PIPER = OUTILS / ".venv" / "bin" / "piper"
DOSSIER_VOIX = RACINE / "voix"
DOSSIER_LILO = DOSSIER_VOIX / "lilo"
INDEX = DOSSIER_VOIX / "index.json"

LENTEUR = "1.15"  # > 1 = plus lent (débit doux pour un enfant de 4 ans)


def lire_repliques():
    """Demande à Node la liste complète des phrases (js/repliques.js)."""
    sortie = subprocess.run(["node", str(OUTILS / "lister-repliques.mjs")],
                            check=True, capture_output=True, text=True).stdout
    return json.loads(sortie)


def preparer_texte(texte):
    """Petits ajustements pour une lecture plus naturelle."""
    t = texte.split("|")[0]  # après « | » : version pour la voix de la tablette
    t = t.replace("…", ",").replace("Hmm", "Hum")
    return t


def empreinte(texte):
    return hashlib.sha1(f"{LENTEUR}|{texte}".encode("utf-8")).hexdigest()[:12]


def generer(texte, sortie):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "phrase.wav"
        subprocess.run(
            [str(PIPER), "-m", str(MODELE), "--length-scale", LENTEUR,
             "--sentence-silence", "0.25", "-f", str(wav)],
            input=preparer_texte(texte).encode("utf-8"),
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Conversion en AAC (.m4a) : léger et lu par Chrome sur Android
        subprocess.run(
            ["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", str(wav), str(sortie)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    if not PIPER.exists() or not MODELE.exists():
        sys.exit("Piper ou la voix Siwis est introuvable dans outils/. Voir le README.")

    DOSSIER_LILO.mkdir(parents=True, exist_ok=True)
    ancien = json.loads(INDEX.read_text()) if INDEX.exists() else {}
    anciennes_empreintes = ancien.get("empreintes", {})

    repliques = lire_repliques()
    fichiers, empreintes = {}, {}
    nouveaux = 0

    for ident, texte in repliques.items():
        perso = DOSSIER_VOIX / f"{ident}.mp3"
        if perso.exists():  # ton enregistrement passe en priorité
            fichiers[ident] = f"{ident}.mp3"
            continue
        cible = DOSSIER_LILO / f"{ident}.m4a"
        e = empreinte(texte)
        if not cible.exists() or anciennes_empreintes.get(ident) != e:
            print(f"  🎙️  {ident}")
            generer(texte, cible)
            nouveaux += 1
        fichiers[ident] = f"lilo/{ident}.m4a"
        empreintes[ident] = e

    # Ménage : on retire les voix de phrases qui n'existent plus
    for f in DOSSIER_LILO.glob("*.m4a"):
        if f.stem not in repliques:
            f.unlink()

    INDEX.write_text(json.dumps({"fichiers": fichiers, "empreintes": empreintes},
                                ensure_ascii=False, indent=1), encoding="utf-8")
    perso = sum(1 for v in fichiers.values() if v.endswith(".mp3"))
    print(f"\n✅ {len(fichiers)} phrases prêtes ({nouveaux} générées, {perso} avec ta voix).")


if __name__ == "__main__":
    main()
