#!/bin/bash
# Lance le jeu sur ce Mac. Ouvre ensuite l'adresse affichée dans un navigateur.
cd "$(dirname "$0")"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo ""
echo "  🏝️  L'Île aux Mille Curiosités est lancée !"
echo ""
echo "  Sur ce Mac       : http://localhost:8000"
[ -n "$IP" ] && echo "  Sur la tablette  : http://$IP:8000   (même Wi-Fi que le Mac)"
echo ""
echo "  Pour arrêter : appuie sur Ctrl + C"
echo ""
python3 -m http.server 8000
