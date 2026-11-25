/* ==========================================================================
   lilo.js — Lilo, la petite luciole compagne.
   Elle flotte dans le coin de l'écran, brille quand elle parle,
   et répète sa dernière consigne quand on la touche.
   ========================================================================== */

import * as voix from './voix.js';
import { sons } from './audio.js';

let compteur = 0;

/** Le dessin de Lilo (SVG). `id` rend les dégradés uniques par dessin. */
export function dessinLilo() {
  const id = `l${compteur++}`;
  return `
  <defs>
    <radialGradient id="halo-${id}">
      <stop offset="0" stop-color="#fff6b8" stop-opacity="1"/>
      <stop offset=".55" stop-color="#ffe98a" stop-opacity=".5"/>
      <stop offset="1" stop-color="#ffe08a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="corps-${id}" cx=".4" cy=".35">
      <stop offset="0" stop-color="#fffbe0"/>
      <stop offset="1" stop-color="#ffd86b"/>
    </radialGradient>
  </defs>
  <g class="lilo-corps anime">
    <circle class="lilo-halo anime" cx="0" cy="0" r="92" fill="url(#halo-${id})"/>
    <g transform="translate(-26 -36) rotate(-28)">
      <ellipse class="lilo-aile anime-bas" cx="0" cy="-26" rx="20" ry="32" fill="#ffffff" opacity=".75"/>
    </g>
    <g transform="translate(26 -36) rotate(28)">
      <ellipse class="lilo-aile droite anime-bas" cx="0" cy="-26" rx="20" ry="32" fill="#ffffff" opacity=".75"/>
    </g>
    <path d="M-14 -40 Q-22 -70 -38 -74" fill="none" stroke="#8a6a50" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 -40 Q22 -70 38 -74" fill="none" stroke="#8a6a50" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-38" cy="-74" r="7" fill="#ffe08a"/>
    <circle cx="38" cy="-74" r="7" fill="#ffe08a"/>
    <circle cx="0" cy="40" r="30" fill="#fff3a6"/>
    <circle cx="0" cy="0" r="48" fill="url(#corps-${id})"/>
    <g class="lilo-yeux-ouverts">
      <g class="cligne anime">
        <circle cx="-17" cy="-6" r="12" fill="#fff"/>
        <circle cx="17" cy="-6" r="12" fill="#fff"/>
        <circle cx="-15" cy="-4" r="7.5" fill="#4a3b35"/>
        <circle cx="19" cy="-4" r="7.5" fill="#4a3b35"/>
        <circle cx="-12.5" cy="-7" r="2.6" fill="#fff"/>
        <circle cx="21.5" cy="-7" r="2.6" fill="#fff"/>
      </g>
    </g>
    <g class="lilo-yeux-fermes">
      <path d="M-28 -4 Q-17 4 -6 -4" fill="none" stroke="#4a3b35" stroke-width="4" stroke-linecap="round"/>
      <path d="M6 -4 Q17 4 28 -4" fill="none" stroke="#4a3b35" stroke-width="4" stroke-linecap="round"/>
    </g>
    <ellipse cx="-31" cy="12" rx="8" ry="5" fill="#f7a8a8" opacity=".7"/>
    <ellipse cx="31" cy="12" rx="8" ry="5" fill="#f7a8a8" opacity=".7"/>
    <ellipse class="lilo-bouche anime" cx="0" cy="17" rx="7" ry="4.5" fill="#c86b5e"/>
  </g>`;
}

/** Insère un dessin de Lilo dans un élément (bouton ou scène). */
export function poserLilo(conteneur, { dort = false } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-100 -100 200 200');
  svg.innerHTML = dessinLilo();
  if (dort) svg.classList.add('dort');
  conteneur.appendChild(svg);
  return svg;
}

/* ---------- La Lilo du coin de l'écran ---------- */

let bouton = null;
let dessin = null;

export function installer() {
  bouton = document.getElementById('lilo');
  dessin = poserLilo(bouton);

  // Lilo brille quand elle parle
  voix.surDebut(() => dessin.classList.add('parle'));
  voix.surFin(() => dessin.classList.remove('parle'));

  bouton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sons.plop();
    dessin.classList.remove('lilo-saut');
    void dessin.getBoundingClientRect(); // relance l'animation
    dessin.classList.add('lilo-saut');
    voix.repeter();
  });
}

export function montrer(visible = true) {
  bouton.classList.toggle('cache', !visible);
}
