# 🏝️ L'Île aux Mille Curiosités

Jeu d'éveil pour un enfant de 4 ans : sans texte, sans score, sans publicité, sans Internet.
Lilo, une petite luciole, guide l'enfant avec sa voix.

**Les lieux de l'île** :
- 🌲 **Forêt des Sons** : des animaux cachés dans les buissons, on écoute, on devine.
- 🌸 **Jardin Musical** : fleurs-notes, champignons-tambours ; le coquillage enregistre « sa chanson ».
- 🏡 **Cabane aux Mots** : apprendre à lire à son rythme, des sons jusqu'aux histoires (5 niveaux).
- 🎨 **Atelier des Créatures** : inventer une créature, qui part ensuite vivre sur l'île.
- 🌈 **Ciel des Couleurs** : mélanger les nuages, faire pleuvoir, arc-en-ciel, jour et nuit.
- 🐴 **Écuries de la Prairie** : brosser, nourrir, promener le poney, et le laisser faire la sieste.

**L'île vit** : les créatures inventées s'y promènent, chaque chanson plante une fleur qui
grandit d'une séance à l'autre, la météo change, et des surprises rares apparaissent
(une baleine, un trésor dans le sable…). La lumière passe doucement du jour au crépuscule
pendant la séance, puis Lilo annonce qu'elle a sommeil et l'île s'endort.

## Espace parent

Maintenir le **petit cadenas** (en haut à droite) **3 secondes**, puis répondre à l'addition.
On y trouve : durée de séance (10 / 15 / 20 min), « Nouvelle séance », volume, choix de la voix,
niveau de la Cabane aux Mots, **journal** (lieux visités, animaux trouvés, chansons, créatures,
mots lus…) pour en parler avec l'enfant, et l'effacement des données.

> Après une séance terminée, Lilo reste endormie 30 minutes. Pour rejouer plus tôt :
> espace parent → « Nouvelle séance ».

---

## 1. Lancer le jeu sur le Mac

Dans le Terminal :

```bash
cd ~/Projects/ile-aux-curiosites
./lancer.sh
```

Ouvre ensuite **http://localhost:8000** dans Chrome.
Pour arrêter le jeu, appuie sur **Ctrl + C** dans le Terminal.

## 2. Tester sur la tablette Android (même Wi-Fi que le Mac)

1. Lance `./lancer.sh` : il affiche une adresse du type `http://192.168.1.23:8000`.
2. Tape cette adresse dans **Chrome** sur la tablette.
3. Tiens la tablette **en paysage** et touche Lilo pour la réveiller.

> Dans ce mode de test, le jeu ne s'installe pas sur l'écran d'accueil et ne marche pas hors-ligne.
> C'est normal : il faut une adresse sécurisée (https). L'étape 3 règle ça.

**Si Mac demande d'autoriser « python3 » à recevoir des connexions**, réponds « Autoriser ».

## 3. Installer le jeu pour de vrai (icône + hors-ligne) — étape à venir

Le jeu sera publié sur **GitHub Pages** (gratuit, https). Ensuite, sur la tablette :
Chrome → menu **⋮** → **Ajouter à l'écran d'accueil** → **Installer**.
Une fois ouvert une fois, il marche **sans Internet**.

## 4. La voix de Lilo

Lilo parle avec **Siwis**, une voix française libre et naturelle (licence CC-BY 4.0).
Chaque phrase est un petit fichier audio rangé dans `voix/lilo/`. Elle fonctionne donc
hors-ligne et sonne pareil sur toutes les tablettes.

**Après avoir ajouté ou modifié une phrase** dans `js/repliques.js`, lance :

```bash
cd ~/Projects/ile-aux-curiosites
./outils/generer-voix.sh
```

Seules les phrases nouvelles ou modifiées sont refaites (environ 1 seconde chacune).
Ce script a besoin de **Node** (déjà installé sur ce Mac).

### Ajouter des mots, des phrases ou des histoires à la Cabane aux Mots
Tout est dans `js/lecture.js` (mots découpés en syllabes, phrases, histoires page par page).
Après modification, lance `./outils/generer-voix.sh` : les voix des nouveaux mots sont créées.
Un nouveau mot a besoin d'un dessin dans `js/dessins-mots.js` (sinon un rond s'affiche).

### Mettre TA voix à la place de Siwis
1. Ouvre `js/repliques.js` : chaque phrase a un **identifiant** (ex. `hub_bienvenue`).
2. Enregistre la phrase et exporte-la en **.mp3** au nom exact de l'identifiant : `hub_bienvenue.mp3`.
3. Dépose-la dans **`voix/`** (pas dans `voix/lilo/`).
4. Lance `./outils/generer-voix.sh` : ton enregistrement passe devant Siwis.

Tu peux n'en enregistrer que quelques-unes : les autres restent en Siwis.

**Conseils** : parler lentement et chaleureusement, une phrase par fichier, sans blanc au début.
Si tu modifies le jeu installé, augmente le numéro `VERSION` dans `sw.js`.

## 5. Comment le jeu est construit

```
index.html          la page (Lilo + bouton maison + la scène)
css/style.css       couleurs, animations douces
js/main.js          démarrage
js/repliques.js     toutes les phrases de Lilo
js/lecture.js       contenu de la Cabane aux Mots (sons, syllabes, mots, phrases, histoires)
js/repliques-lecture.js  voix de la lecture (calculées depuis lecture.js)
js/dessins-mots.js  dessins des mots à lire
js/creatures.js     dessin des créatures de l'Atelier
js/parent.js        espace parent
js/dessins.js       arbres, fleurs, nuages, champignons (SVG)
js/moteur/
  audio.js          tous les sons, fabriqués en direct (Web Audio)
  voix.js           la voix de Lilo (fichier mp3 ou synthèse)
  lilo.js           le dessin et le comportement de Lilo
  scenes.js         passage d'un lieu à l'autre en fondu
  seance.js         durée de séance, lumière du jour, fin douce
  sauvegarde.js     mémoire du jeu (uniquement sur la tablette)
  outils.js         petites fonctions d'animation et de toucher
js/zones/           un fichier par lieu : accueil, hub, foret, jardin, cabane,
                    atelier, ciel, ecuries, dodo (fin de séance)
polices/            police Andika (SIL, licence OFL) pour la lecture
voix/               index.json + tes enregistrements .mp3 (facultatif)
voix/lilo/          la voix Siwis générée (une phrase = un fichier)
outils/             générateur de voix (Piper, uniquement sur le Mac)
sw.js, manifest.json   installation et mode hors-ligne
```

**Vie privée** : aucune connexion Internet pendant le jeu, aucun lien, aucun achat, aucun traceur.
Seules données gardées : dans le navigateur de la tablette (animaux découverts, chansons, créatures, état du poney, niveau de lecture, journal).

Voir aussi **[CHECKLIST.md](CHECKLIST.md)** avant de faire jouer l'enfant.

## Crédits

- **Voix de Lilo** : synthèse avec [Piper](https://github.com/OHF-Voice/piper1-gpl), voix `fr_FR-siwis-medium`,
  entraînée sur la base SIWIS (Université d'Édimbourg / Idiap), licence **CC BY 4.0**.
- **Police Andika** : © SIL International, licence **SIL Open Font License 1.1** (voir `polices/OFL.txt`).
- Dessins, sons et code : créés pour ce jeu.
