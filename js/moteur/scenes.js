/* ==========================================================================
   scenes.js — passe d'un lieu à l'autre en fondu doux.

   Chaque scène (accueil, île, zones) est un objet :
     {
       id: 'foret',
       ambiance: 'foret',          // nom de l'ambiance sonore (audio.js)
       avecLilo: true,             // Lilo visible dans le coin ?
       avecMaison: true,           // bouton « retour à l'île » visible ?
       entrer(conteneur, params),  // dessine la scène et branche les touchers
       quitter(),                  // arrête minuteries et sons de la scène
     }
   ========================================================================== */

import * as audio from './audio.js';
import * as voix from './voix.js';
import * as lilo from './lilo.js';
import { noter } from './sauvegarde.js';
import { attendre } from './outils.js';

const scenes = {};
let courante = null;
let enTransition = false;

export function enregistrer(scene) { scenes[scene.id] = scene; }
export const sceneCourante = () => courante?.id;

export async function aller(id, params = {}) {
  const scene = scenes[id];
  if (!scene || enTransition) return;
  enTransition = true;
  const conteneur = document.getElementById('scene');
  const maison = document.getElementById('maison');

  voix.taire();
  if (courante) {
    conteneur.classList.add('fondu');
    await attendre(450);
    try { courante.quitter?.(); } catch (e) { console.error(e); }
  }

  conteneur.innerHTML = '';
  const precedente = courante?.id;
  courante = scene;
  maison.classList.toggle('cache', !scene.avecMaison);
  lilo.montrer(scene.avecLilo !== false);
  audio.ambiance(scene.ambiance || null);
  scene.entrer(conteneur, { ...params, depuis: precedente });
  if (scene.journal !== false) noter('visite', { lieu: id });

  conteneur.classList.remove('fondu');
  await attendre(450);
  enTransition = false;
}
