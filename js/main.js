/* ==========================================================================
   main.js — point de départ du jeu.
   Branche Lilo, le bouton maison, les scènes, et le mode hors-ligne.
   ========================================================================== */

import * as scenes from './moteur/scenes.js';
import * as lilo from './moteur/lilo.js';
import * as voix from './moteur/voix.js';
import { donnees } from './moteur/sauvegarde.js';
import { sons } from './moteur/audio.js';

import accueil from './zones/accueil.js';
import hub from './zones/hub.js';
import foret from './zones/foret.js';
import jardin from './zones/jardin.js';
import dodo from './zones/dodo.js';
import cabane from './zones/cabane.js';
import atelier from './zones/atelier.js';
import ciel from './zones/ciel.js';
import ecuries from './zones/ecuries.js';
import * as parent from './parent.js';

[accueil, hub, foret, jardin, dodo, cabane, atelier, ciel, ecuries].forEach(scenes.enregistrer);
parent.installer();

lilo.installer();
voix.reglerVolumeVoix(1);
parent.appliquerVoix();

// Bouton maison : retour à l'île
document.getElementById('maison').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sons.plop();
  scenes.aller('hub');
});

// Pas de menu au toucher long, pas de zoom par geste
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// Si l'application passe en arrière-plan, Lilo se tait
document.addEventListener('visibilitychange', () => {
  if (document.hidden) voix.taire();
});

scenes.aller('accueil');

/* ---------- Mode hors-ligne (PWA) ----------
   Le « service worker » garde une copie du jeu sur la tablette.
   Désactivé sur l'ordinateur de développement pour voir les changements tout de suite. */
const enDeveloppement = ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && !enDeveloppement && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
