"""
generer_voix.py — fabrique la voix de Lilo pour chaque phrase du jeu.

Lit js/repliques.js, et pour chaque phrase :
  - génère un fichier audio :
      * avec Microsoft Azure (voix neuronale) si une clé est dans outils/azure.env ;
      * sinon avec la voix libre « Siwis » (Piper, sur le Mac, hors-ligne) ;
  - le range dans voix/lilo/<identifiant>.m4a
Puis écrit voix/index.json : la liste des voix disponibles, que le jeu lit
au démarrage. Tes enregistrements perso (voix/<identifiant>.mp3) y sont
aussi listés, et passent toujours en priorité.

Seules les phrases nouvelles ou modifiées sont regénérées.
À lancer avec : ./outils/generer-voix.sh
"""

import hashlib
import json
import re
import subprocess
import time
import urllib.error
import urllib.request
from xml.sax.saxutils import escape
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

LENTEUR = "1.15"  # Piper : > 1 = plus lent (débit doux pour un enfant de 4 ans)
CONFIG_AZURE = OUTILS / "azure.env"


def lire_config_azure():
    """Lit outils/azure.env (clé, région, voix, vitesse). None si pas de clé."""
    if not CONFIG_AZURE.exists():
        return None
    conf = {}
    for ligne in CONFIG_AZURE.read_text(encoding="utf-8").splitlines():
        if "=" in ligne and not ligne.strip().startswith("#"):
            k, v = ligne.split("=", 1)
            conf[k.strip()] = v.strip()
    if not conf.get("AZURE_CLE"):
        return None
    conf.setdefault("AZURE_REGION", "francecentral")
    conf.setdefault("AZURE_VOIX", "fr-FR-DeniseNeural")
    conf.setdefault("AZURE_VITESSE", "-10%")
    return conf


AZURE = lire_config_azure()


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


def moteur():
    if AZURE:
        return f"azure|{AZURE['AZURE_VOIX']}|{AZURE['AZURE_VITESSE']}"
    return f"piper|siwis|{LENTEUR}"


def empreinte(texte):
    return hashlib.sha1(f"{moteur()}|{texte}".encode("utf-8")).hexdigest()[:12]


def ssml(texte, voix=None, vitesse=None):
    """Transforme une réplique en SSML Azure. Les passages [[ … ]] deviennent des phonèmes (API)."""
    voix = voix or AZURE["AZURE_VOIX"]
    vitesse = vitesse or AZURE["AZURE_VITESSE"]
    morceaux = texte.split("|")
    t, secours = morceaux[0], (morceaux[1] if len(morceaux) > 1 else "a")
    corps, pos = "", 0
    for m in re.finditer(r"\[\[\s*(.+?)\s*\]\]", t):
        corps += escape(t[pos:m.start()])
        mot = secours if m.start() == 0 and m.end() == len(t.strip()) else "mot"
        corps += f'<phoneme alphabet="ipa" ph="{escape(m.group(1), {chr(34): "&quot;"})}">{escape(mot)}</phoneme>'
        pos = m.end()
    corps += escape(t[pos:])
    return (f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR">'
            f'<voice name="{voix}"><prosody rate="{vitesse}">{corps}</prosody></voice></speak>')


def appeler_azure(document, wav):
    """Envoie le SSML à Azure et enregistre le son (WAV). Réessaie si Azure demande d'attendre."""
    url = f"https://{AZURE['AZURE_REGION']}.tts.speech.microsoft.com/cognitiveservices/v1"
    for essai in range(8):
        req = urllib.request.Request(url, data=document.encode("utf-8"), method="POST", headers={
            "Ocp-Apim-Subscription-Key": AZURE["AZURE_CLE"],
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
            "User-Agent": "ile-aux-curiosites",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as rep:
                Path(wav).write_bytes(rep.read())
                return
        except urllib.error.HTTPError as err:
            if err.code == 429:  # offre gratuite : 20 demandes par minute
                time.sleep(int(err.headers.get("Retry-After", "10")) + 1)
                continue
            if err.code in (401, 403):
                sys.exit("Azure refuse la clé : vérifie AZURE_CLE et AZURE_REGION dans outils/azure.env.")
            raise
    sys.exit("Azure ne répond pas, réessaie plus tard.")


def generer(texte, sortie):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "phrase.wav"
        if AZURE:
            appeler_azure(ssml(texte), wav)
        else:
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
    if not AZURE and (not PIPER.exists() or not MODELE.exists()):
        sys.exit("Piper ou la voix Siwis est introuvable dans outils/. Voir le README.")
    print(f"Voix utilisée : {'Azure — ' + AZURE['AZURE_VOIX'] if AZURE else 'Siwis (Piper)'}")

    DOSSIER_LILO.mkdir(parents=True, exist_ok=True)
    ancien = json.loads(INDEX.read_text()) if INDEX.exists() else {}
    anciennes_empreintes = ancien.get("empreintes", {})

    repliques = lire_repliques()
    fichiers, empreintes = {}, {}
    nouveaux = 0

    for ident, texte in repliques.items():
        perso = next((DOSSIER_VOIX / f"{ident}{ext}" for ext in (".m4a", ".mp3", ".wav")
                      if (DOSSIER_VOIX / f"{ident}{ext}").exists()), None)
        if perso:  # ton enregistrement passe en priorité
            fichiers[ident] = perso.name
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
    perso = sum(1 for v in fichiers.values() if not v.startswith("lilo/"))
    print(f"\n✅ {len(fichiers)} phrases prêtes ({nouveaux} générées, {perso} avec ta voix).")


if __name__ == "__main__":
    main()
