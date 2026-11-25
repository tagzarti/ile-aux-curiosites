/* ==========================================================================
   accueil.js — écran de départ : Lilo dort sous les étoiles.
   Le premier toucher la réveille ; c'est aussi lui qui « autorise » le son
   (les tablettes bloquent le son tant qu'on n'a pas touché l'écran).
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import * as scenes from '../moteur/scenes.js';
import { poserLilo } from '../moteur/lilo.js';
import { donnees } from '../moteur/sauvegarde.js';
import * as seance from '../moteur/seance.js';
import { creerToile, attendre, etincelles } from '../moteur/outils.js';

let verrouEcran = null;

/** Plein écran + écran toujours allumé + paysage (si la tablette le permet). */
async function preparerTablette() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch (e) { /* refusé : pas grave */ }
  try { await screen.orientation?.lock?.('landscape'); } catch (e) { /* idem */ }
  try {
    if ('wakeLock' in navigator) {
      verrouEcran = await navigator.wakeLock.request('screen');
      // Le verrou saute quand l'appli passe en arrière-plan : on le reprend au retour
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) { try { verrouEcran = await navigator.wakeLock.request('screen'); } catch (e) {} }
      });
    }
  } catch (e) { /* idem */ }
}

export function etoiles(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 1600, y = Math.random() * 520, r = 1.5 + Math.random() * 3;
    s += `<circle class="luciole-deco" style="animation-delay:-${(Math.random() * 9).toFixed(1)}s;animation-duration:${(10 + Math.random() * 8).toFixed(1)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff6d0"/>`;
  }
  return s;
}

/** Ciel de nuit avec collines (partagé avec la scène « dodo »). */
export function fondNuit(avecZzz = false) {
  return `
      <defs>
        <linearGradient id="ciel-nuit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3d4a7a"/>
          <stop offset="1" stop-color="#7b8cc2"/>
        </linearGradient>
      </defs>
      <rect class="fond" width="1600" height="900" fill="url(#ciel-nuit)"/>
      ${etoiles(40)}
      <circle cx="1300" cy="170" r="70" fill="#fff3c9" opacity=".9"/>
      <circle cx="1328" cy="150" r="62" fill="#3f4c7c"/>
      <path d="M0 760 Q400 640 800 720 T1600 700 V900 H0 Z" fill="#5f8f80"/>
      <path d="M0 820 Q500 740 900 800 T1600 790 V900 H0 Z" fill="#4f7e70"/>
      ${avecZzz ? `<g class="zzz-groupe" pointer-events="none">
        <text class="zzz" x="930" y="330" font-size="46" fill="#fff6d0" font-family="system-ui">z</text>
        <text class="zzz" style="animation-delay:-1.2s" x="960" y="300" font-size="36" fill="#fff6d0" font-family="system-ui">z</text>
        <text class="zzz" style="animation-delay:-2.4s" x="985" y="275" font-size="28" fill="#fff6d0" font-family="system-ui">z</text>
      </g>` : ''}`;
}

export default {
  id: 'accueil',
  ambiance: null,
  avecLilo: false,
  avecMaison: false,
  journal: false,

  entrer(conteneur) {
    const svg = creerToile(conteneur, fondNuit(true));

    // Grosse Lilo endormie au centre (zone de toucher : tout l'écran)
    const zoneLilo = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zoneLilo.setAttribute('transform', 'translate(800 450) scale(2.3)');
    svg.appendChild(zoneLilo);
    const dessin = poserLilo(zoneLilo, { dort: true });
    dessin.setAttribute('x', -100); dessin.setAttribute('y', -100);
    dessin.setAttribute('width', 200); dessin.setAttribute('height', 200);
    dessin.style.overflow = 'visible';

    let reveillee = false;
    svg.addEventListener('pointerdown', async (e) => {
      e.preventDefault();
      if (reveillee) return;

      // Séance finie il y a peu : Lilo dort encore (le parent peut relancer)
      if (seance.auRepos()) {
        audio.demarrer(donnees().reglages.volume);
        audio.sons.dodo();
        etincelles(svg, 800, 450, '#fff3b0', 5);
        if (!voix.parle()) voix.dire('seance_repos');
        return;
      }
      reveillee = true;

      audio.demarrer(donnees().reglages.volume);
      seance.demarrer();
      preparerTablette();
      audio.sons.reveil();
      etincelles(svg, 800, 450, '#fff3b0', 12);
      dessin.classList.remove('dort');
      svg.querySelector('.zzz-groupe').remove();

      await attendre(500);
      dessin.classList.add('parle');
      await voix.dire('accueil_bonjour');
      dessin.classList.remove('parle');
      await attendre(300);
      scenes.aller('hub');
    });
  },

  quitter() {},
};
