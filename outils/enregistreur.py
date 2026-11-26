"""
enregistreur.py — petit serveur local pour enregistrer TA voix
(sons des lettres et syllabes de la Cabane aux Mots).

Lancement : ./outils/enregistrer-voix.sh
Il ouvre la page http://localhost:8001/outils/enregistreur.html

Chaque enregistrement est :
  - nettoyé dans le navigateur (silences coupés, volume égalisé) ;
  - converti ici en .m4a et rangé dans voix/<identifiant>.m4a ;
  - ajouté à voix/index.json (il passe devant la voix Siwis).
Le serveur n'écoute que sur cet ordinateur (127.0.0.1).
"""

import json
import re
import sys
import subprocess
import tempfile
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

RACINE = Path(__file__).resolve().parent.parent
VOIX = RACINE / "voix"
INDEX = VOIX / "index.json"
PORT = 8001
ID_VALIDE = re.compile(r"^[a-z0-9_]{1,60}$")
EXTENSIONS_PERSO = (".m4a", ".mp3", ".wav")


def lire_index():
    return json.loads(INDEX.read_text(encoding="utf-8")) if INDEX.exists() else {"fichiers": {}, "empreintes": {}}


def ecrire_index(index):
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


def enregistrements_perso():
    return sorted(f.stem for f in VOIX.iterdir() if f.suffix in EXTENSIONS_PERSO)


class Gestionnaire(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def repondre(self, code, donnees):
        corps = json.dumps(donnees).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def do_GET(self):
        if urlparse(self.path).path == "/api/etat":
            return self.repondre(200, {"perso": enregistrements_perso()})
        return super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        ident = parse_qs(url.query).get("id", [""])[0]
        if not ID_VALIDE.match(ident):
            return self.repondre(400, {"erreur": "identifiant invalide"})

        if url.path == "/api/enregistrer":
            taille = int(self.headers.get("Content-Length", 0))
            if not 0 < taille < 20_000_000:
                return self.repondre(400, {"erreur": "taille invalide"})
            wav = self.rfile.read(taille)
            with tempfile.TemporaryDirectory() as tmp:
                source = Path(tmp) / "son.wav"
                source.write_bytes(wav)
                cible = VOIX / f"{ident}.m4a"
                subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "96000", str(source), str(cible)],
                               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            for ext in (".mp3", ".wav"):  # un seul enregistrement par identifiant
                (VOIX / f"{ident}{ext}").unlink(missing_ok=True)
            index = lire_index()
            index["fichiers"][ident] = f"{ident}.m4a"
            ecrire_index(index)
            print(f"  🎙️  {ident} enregistré")
            return self.repondre(200, {"ok": True})

        if url.path == "/api/effacer":
            for ext in EXTENSIONS_PERSO:
                (VOIX / f"{ident}{ext}").unlink(missing_ok=True)
            index = lire_index()
            if (VOIX / "lilo" / f"{ident}.m4a").exists():
                index["fichiers"][ident] = f"lilo/{ident}.m4a"
            else:
                index["fichiers"].pop(ident, None)
            ecrire_index(index)
            print(f"  🗑️  {ident} effacé (retour à la voix Siwis)")
            return self.repondre(200, {"ok": True})

        return self.repondre(404, {"erreur": "inconnu"})

    def log_message(self, *args):
        pass  # pas de bavardage dans le Terminal


if __name__ == "__main__":
    adresse = f"http://localhost:{PORT}/outils/enregistreur.html"
    try:
        serveur = ThreadingHTTPServer(("127.0.0.1", PORT), partial(Gestionnaire, directory=str(RACINE)))
    except OSError:
        # Déjà lancé (dans un autre onglet du Terminal) : on rouvre simplement la page
        print(f"\n  L'enregistreur tourne déjà. J'ouvre la page : {adresse}\n")
        webbrowser.open(adresse)
        sys.exit(0)
    print(f"\n  🎙️  Enregistreur de voix prêt : {adresse}")
    print("  Pour arrêter : Ctrl + C\n")
    if "--sans-navigateur" not in sys.argv:
        webbrowser.open(adresse)
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\n  À bientôt ! N'oublie pas de publier la nouvelle version (voir le README).")
