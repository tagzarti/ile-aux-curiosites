/* ==========================================================================
   dodo.js — fin de séance : l'île s'endort doucement.
   Lilo dit bonne nuit puis s'endort. On peut encore toucher l'écran
   (petites étoiles, sons très doux), mais plus rien ne s'ouvre.
   Pour rejouer : attendre 30 min, ou « Nouvelle séance » dans l'espace parent.
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { poserLilo } from '../moteur/lilo.js';
import { creerToile, attendre, etincelles, pointDansToile } from '../moteur/outils.js';
import { fondNuit } from './accueil.js';

let actif = false;

export default {
  id: 'dodo',
  ambiance: 'nuit',
  avecLilo: false,
  avecMaison: false,

  async entrer(conteneur) {
    actif = true;
    const svg = creerToile(conteneur, fondNuit(false) + `
      <g opacity=".85">
        <path d="M480 720 C470 640 620 600 800 610 C980 600 1130 640 1120 720 Z" fill="#6f9c8c"/>
        <g transform="translate(640 640)"><circle r="40" fill="#5c8a77"/><circle cx="30" cy="10" r="30" fill="#5c8a77"/></g>
        <g transform="translate(980 650)"><rect x="-40" y="-30" width="80" height="50" rx="10" fill="#8a7f9e"/><rect x="-10" y="-5" width="20" height="25" fill="#ffe9a8" opacity=".8"/></g>
      </g>`);

    const zone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zone.setAttribute('transform', 'translate(800 400) scale(1.8)');
    svg.appendChild(zone);
    const lilo = poserLilo(zone);
    lilo.setAttribute('x', -100); lilo.setAttribute('y', -100);
    lilo.setAttribute('width', 200); lilo.setAttribute('height', 200);
    lilo.style.overflow = 'visible';

    let chuts = 0;
    svg.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = pointDansToile(svg, e);
      audio.sons.etincelle();
      etincelles(svg, p.x, p.y, '#fff6d0', 4);
      if (++chuts % 6 === 0 && !voix.parle()) voix.dire('seance_chut');
    });

    await attendre(1200);
    if (!actif) return;
    lilo.classList.add('parle');
    await voix.dire('seance_bonne_nuit');
    lilo.classList.remove('parle');
    if (!actif) return;
    lilo.classList.add('dort');
    el_zzz(svg);
  },

  quitter() { actif = false; },
};

function el_zzz(svg) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('pointer-events', 'none');
  g.innerHTML = `
    <text class="zzz" x="900" y="290" font-size="46" fill="#fff6d0" font-family="system-ui">z</text>
    <text class="zzz" style="animation-delay:-1.2s" x="930" y="260" font-size="36" fill="#fff6d0" font-family="system-ui">z</text>
    <text class="zzz" style="animation-delay:-2.4s" x="955" y="235" font-size="28" fill="#fff6d0" font-family="system-ui">z</text>`;
  svg.appendChild(g);
}
