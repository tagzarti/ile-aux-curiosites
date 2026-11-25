/* ==========================================================================
   dessins-mots.js — un petit dessin pour chaque mot de la Cabane aux Mots.
   Chaque dessin tient dans un carré d'environ 200 × 200 centré sur (0, 0).
   ========================================================================== */

import { dessinLilo } from './moteur/lilo.js';
import { ANIMAUX } from './zones/foret.js';

const yeux = (x1, x2, y, r = 7) => `
  <g class="cligne anime">
    <circle cx="${x1}" cy="${y}" r="${r}" fill="#4a3b35"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#4a3b35"/>
    <circle cx="${x1 + 2}" cy="${y - 2}" r="${r * 0.35}" fill="#fff"/><circle cx="${x2 + 2}" cy="${y - 2}" r="${r * 0.35}" fill="#fff"/>
  </g>`;

export const DESSINS_MOTS = {
  lilo: () => `<g transform="scale(.9)">${dessinLilo()}</g>`,

  abeille: () => `<g transform="scale(.85)">${ANIMAUX.abeille}</g>`,

  moto: () => `
    <circle cx="-62" cy="45" r="38" fill="#4a4a5a"/><circle cx="-62" cy="45" r="16" fill="#d9d9e3"/>
    <circle cx="66" cy="45" r="38" fill="#4a4a5a"/><circle cx="66" cy="45" r="16" fill="#d9d9e3"/>
    <path d="M-62 45 L-20 -5 L45 -5 L66 45" fill="none" stroke="#8a8aa0" stroke-width="10" stroke-linecap="round"/>
    <path d="M-45 -10 Q-10 -55 40 -20 L35 10 L-35 10 Z" fill="#f28b82"/>
    <rect x="-20" y="-40" width="50" height="14" rx="7" fill="#4a3b35"/>
    <path d="M45 -20 L60 -55 M50 -55 H75" stroke="#8a8aa0" stroke-width="9" stroke-linecap="round"/>
    <circle cx="78" cy="-30" r="10" fill="#ffe08a"/>`,

  lama: () => `
    <ellipse cx="10" cy="30" rx="70" ry="42" fill="#f3e6cf"/>
    <path d="M-25 60 v38 M-5 62 v36 M35 62 v36 M55 60 v38" stroke="#e5d2b0" stroke-width="16" stroke-linecap="round"/>
    <rect x="-62" y="-80" width="36" height="110" rx="18" fill="#f3e6cf"/>
    <ellipse cx="-50" cy="-82" rx="34" ry="28" fill="#f3e6cf"/>
    <path d="M-66 -104 l-6 -24 l16 14 Z M-36 -106 l2 -24 l12 18 Z" fill="#e5d2b0" stroke="#e5d2b0" stroke-width="6" stroke-linejoin="round"/>
    ${yeux(-64, -40, -86, 5)}
    <ellipse cx="-58" cy="-66" rx="14" ry="9" fill="#e9c9b5"/>
    <path d="M-62 30 Q10 0 70 30 L70 45 Q10 15 -62 45 Z" fill="#f4b6c2"/>
    <path d="M74 20 q16 -6 14 12" fill="none" stroke="#e5d2b0" stroke-width="12" stroke-linecap="round"/>`,

  'vélo': () => `
    <circle cx="-60" cy="35" r="42" fill="none" stroke="#4a4a5a" stroke-width="10"/>
    <circle cx="62" cy="35" r="42" fill="none" stroke="#4a4a5a" stroke-width="10"/>
    <path d="M-60 35 L-15 -20 L45 -20 L62 35 M-15 -20 L5 35 L45 -20 M5 35 L-60 35" fill="none" stroke="#7ab8f5" stroke-width="9" stroke-linejoin="round"/>
    <path d="M-25 -32 H5" stroke="#4a3b35" stroke-width="10" stroke-linecap="round"/>
    <path d="M45 -20 L40 -50 L62 -55" fill="none" stroke="#8a8aa0" stroke-width="8" stroke-linecap="round"/>`,

  lune: () => `
    <circle cx="0" cy="0" r="80" fill="#fff1b8"/>
    <circle cx="32" cy="-22" r="74" fill="#3d4a7a" opacity="0"/>
    <circle cx="-25" cy="-30" r="12" fill="#f4e09a"/><circle cx="20" cy="30" r="16" fill="#f4e09a"/><circle cx="35" cy="-25" r="8" fill="#f4e09a"/>
    <path d="M-35 5 q8 8 16 0 M15 5 q8 8 16 0" fill="none" stroke="#8a7a50" stroke-width="5" stroke-linecap="round"/>
    <path d="M-12 30 q12 10 24 0" fill="none" stroke="#8a7a50" stroke-width="5" stroke-linecap="round"/>`,

  rat: () => `
    <path d="M60 40 Q120 40 110 -10" fill="none" stroke="#e9b8a6" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="10" cy="30" rx="65" ry="42" fill="#b8b0b8"/>
    <path d="M-40 10 Q-95 20 -100 38 Q-70 50 -35 45 Z" fill="#b8b0b8"/>
    <circle cx="-30" cy="-12" r="22" fill="#b8b0b8"/><circle cx="-30" cy="-12" r="12" fill="#f4b6c2"/>
    ${yeux(-62, -45, 18, 5)}
    <circle cx="-100" cy="38" r="7" fill="#f28b82"/>
    <path d="M-20 70 v12 M30 70 v12" stroke="#e9b8a6" stroke-width="8" stroke-linecap="round"/>`,

  tomate: () => `
    <circle cx="0" cy="15" r="78" fill="#f28b82"/>
    <ellipse cx="-30" cy="-15" rx="18" ry="12" fill="#fff" opacity=".35"/>
    <path d="M0 -60 l-30 -12 l22 2 l-6 -24 l14 20 l14 -20 l-6 24 l22 -2 l-30 12 Z" fill="#8fc47e" stroke="#8fc47e" stroke-width="6" stroke-linejoin="round"/>`,

  salade: () => `
    <circle cx="0" cy="20" r="72" fill="#a6d48f"/>
    <circle cx="-38" cy="5" r="42" fill="#bfe2a8"/><circle cx="38" cy="5" r="42" fill="#bfe2a8"/>
    <circle cx="0" cy="-20" r="45" fill="#cfeab9"/>
    <path d="M0 60 V-10 M-30 40 L0 10 M30 40 L0 10" stroke="#e8f5dc" stroke-width="6" stroke-linecap="round"/>`,

  banane: () => `
    <path d="M-80 -30 Q-70 70 70 50 Q90 45 85 35 Q-30 50 -55 -40 Z" fill="#ffd96b" stroke="#f2c24f" stroke-width="6" stroke-linejoin="round"/>
    <path d="M-80 -30 l-8 -16 l18 6 Z" fill="#8a6a50"/>`,

  domino: () => `
    <g transform="rotate(-12)">
      <rect x="-50" y="-90" width="100" height="180" rx="18" fill="#fff8ec" stroke="#4a3b35" stroke-width="8"/>
      <path d="M-40 0 H40" stroke="#4a3b35" stroke-width="6"/>
      <circle cx="-22" cy="-62" r="10" fill="#4a3b35"/><circle cx="22" cy="-22" r="10" fill="#4a3b35"/>
      <circle cx="-22" cy="28" r="10" fill="#4a3b35"/><circle cx="22" cy="28" r="10" fill="#4a3b35"/>
      <circle cx="-22" cy="66" r="10" fill="#4a3b35"/><circle cx="22" cy="66" r="10" fill="#4a3b35"/>
    </g>`,

  'fusée': () => `
    <g transform="rotate(20)">
      <path d="M0 -95 Q45 -50 38 40 L-38 40 Q-45 -50 0 -95 Z" fill="#fff8ec" stroke="#c9b6e4" stroke-width="6"/>
      <circle cx="0" cy="-20" r="18" fill="#a8dde8" stroke="#c9b6e4" stroke-width="6"/>
      <path d="M-38 10 L-65 55 L-38 45 Z M38 10 L65 55 L38 45 Z" fill="#f28b82"/>
      <path d="M-22 45 Q0 110 22 45 Z" fill="#ffd96b"/>
    </g>`,

  igloo: () => `
    <path d="M-90 50 A90 90 0 0 1 90 50 Z" fill="#eef6fb" stroke="#a8c8dc" stroke-width="5"/>
    <path d="M-80 10 H80 M-60 -25 H60 M-30 -52 H30 M-40 10 v-35 M20 10 v-35 M-10 -25 v-27 M50 50 v-40 M-60 50 v-40" stroke="#a8c8dc" stroke-width="4"/>
    <path d="M-25 50 A25 25 0 0 1 25 50 Z" fill="#6a7a8a"/>`,

  orange: () => `
    <circle cx="0" cy="10" r="78" fill="#f9a65a"/>
    <ellipse cx="-28" cy="-20" rx="16" ry="10" fill="#fff" opacity=".3"/>
    <path d="M0 -66 q-4 -16 4 -24" fill="none" stroke="#8a6a50" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="22" cy="-80" rx="22" ry="10" fill="#8fc47e" transform="rotate(-20 22 -80)"/>`,

  'étoile': () => `
    <path d="M0 -90 L24 -30 L88 -26 L38 14 L56 78 L0 42 L-56 78 L-38 14 L-88 -26 L-24 -30 Z" fill="#ffe08a" stroke="#f2c24f" stroke-width="8" stroke-linejoin="round"/>
    ${yeux(-18, 18, -5, 6)}
    <path d="M-12 18 q12 10 24 0" fill="none" stroke="#8a6a50" stroke-width="5" stroke-linecap="round"/>`,

  melon: () => `
    <circle cx="0" cy="10" r="80" fill="#c4e3a0"/>
    <path d="M0 -70 Q-40 10 0 90 M0 -70 Q40 10 0 90 M-55 -45 Q-80 10 -55 68 M55 -45 Q80 10 55 68" fill="none" stroke="#a6cf80" stroke-width="7"/>
    <path d="M0 -70 q4 -14 -2 -22" fill="none" stroke="#8a6a50" stroke-width="6" stroke-linecap="round"/>`,

  usine: () => `
    <path d="M-90 80 V-10 L-50 -40 V-10 L-10 -40 V-10 L30 -40 V-10 L90 -10 V80 Z" fill="#c9b6e4" stroke="#a88fcf" stroke-width="6" stroke-linejoin="round"/>
    <rect x="55" y="-90" width="26" height="80" rx="6" fill="#a88fcf"/>
    <circle class="flotte" cx="72" cy="-108" r="16" fill="#eef2f6"/><circle class="flotte" cx="92" cy="-124" r="11" fill="#eef2f6"/>
    <rect x="-70" y="10" width="28" height="26" rx="6" fill="#fff3c9"/><rect x="-25" y="10" width="28" height="26" rx="6" fill="#fff3c9"/>
    <rect x="20" y="10" width="28" height="26" rx="6" fill="#fff3c9"/><rect x="-14" y="46" width="28" height="34" rx="6" fill="#8a6a50"/>`,

  nid: () => `
    <ellipse cx="0" cy="20" rx="90" ry="50" fill="#c9a37a"/>
    <ellipse cx="0" cy="5" rx="70" ry="28" fill="#8a6a50"/>
    <ellipse cx="-28" cy="-5" rx="22" ry="28" fill="#dff3fb"/><ellipse cx="10" cy="-10" rx="22" ry="28" fill="#fff8ec"/><ellipse cx="40" cy="0" rx="20" ry="26" fill="#dff3fb"/>
    <path d="M-85 20 Q0 70 85 20 M-80 35 Q0 80 80 35" fill="none" stroke="#a8805f" stroke-width="5"/>`,

  pomme: () => `
    <path d="M0 -40 C-60 -80 -100 -10 -70 40 C-50 80 -20 85 0 70 C20 85 50 80 70 40 C100 -10 60 -80 0 -40 Z" fill="#f28b82"/>
    <ellipse cx="-38" cy="-15" rx="14" ry="20" fill="#fff" opacity=".3"/>
    <path d="M0 -40 q4 -24 14 -36" fill="none" stroke="#8a6a50" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="34" cy="-70" rx="22" ry="11" fill="#8fc47e" transform="rotate(-25 34 -70)"/>`,
};

/** Dessin d'un mot (ou d'un petit cercle doux si le dessin manque). */
export function dessinMot(mot) {
  const f = DESSINS_MOTS[mot];
  return f ? f() : '<circle r="60" fill="#f4e3b5"/>';
}
