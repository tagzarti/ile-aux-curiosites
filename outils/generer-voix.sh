#!/bin/bash
# Regénère la voix de Lilo (à lancer après avoir modifié js/repliques.js
# ou ajouté un enregistrement perso dans voix/).
cd "$(dirname "$0")/.."
echo "Fabrication de la voix de Lilo…"
outils/.venv/bin/python outils/generer_voix.py
