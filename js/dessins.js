/* ==========================================================================
   dessins.js — petits dessins SVG réutilisables (arbres, fleurs, nuages…).
   Chaque fonction renvoie un morceau de SVG (texte), placé en (x, y).
   Les groupes avec « transform » positionnent ; les groupes internes animent.
   ========================================================================== */

const r = (min, max) => (min + Math.random() * (max - min)).toFixed(1);

export function arbre(x, y, s = 1, c1 = '#8fc47e', c2 = '#a6d48f') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="balancer lent anime-bas" style="animation-delay:-${r(0, 7)}s">
      <rect x="-11" y="-14" width="22" height="56" rx="9" fill="#a8805f"/>
      <circle cx="0" cy="-52" r="50" fill="${c1}"/>
      <circle cx="-30" cy="-24" r="34" fill="${c1}"/>
      <circle cx="30" cy="-26" r="36" fill="${c2}"/>
      <circle cx="12" cy="-70" r="26" fill="${c2}" opacity=".8"/>
      <circle cx="-18" cy="-62" r="7" fill="#ffffff" opacity=".25"/>
    </g>
  </g>`;
}

export function sapin(x, y, s = 1, c = '#7fb79a') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="balancer lent anime-bas" style="animation-delay:-${r(0, 7)}s">
      <rect x="-9" y="-8" width="18" height="40" rx="7" fill="#a8805f"/>
      <path d="M0 -130 Q10 -110 40 -70 Q20 -70 55 -30 Q30 -28 60 6 Q0 18 -60 6 Q-30 -28 -55 -30 Q-20 -70 -40 -70 Q-10 -110 0 -130 Z" fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>
    </g>
  </g>`;
}

export function fleur(x, y, s = 1, couleur = '#f4b6c2', coeur = '#ffe08a', tige = 70) {
  let petales = '';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    petales += `<circle cx="${(Math.cos(a) * 19).toFixed(1)}" cy="${(Math.sin(a) * 19).toFixed(1)}" r="15" fill="${couleur}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="balancer anime-bas" style="animation-delay:-${r(0, 5)}s">
      <path d="M0 0 Q-6 ${-tige / 2} 0 ${-tige}" fill="none" stroke="#7fb36d" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-14" cy="${-tige * 0.4}" rx="14" ry="7" fill="#8fc47e" transform="rotate(-25 -14 ${-tige * 0.4})"/>
      <g transform="translate(0 ${-tige})">${petales}<circle r="13" fill="${coeur}"/></g>
    </g>
  </g>`;
}

export function nuage(x, y, s = 1, couleur = '#ffffff', opacite = 0.9) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${opacite}">
    <ellipse cx="0" cy="0" rx="80" ry="34" fill="${couleur}"/>
    <circle cx="-30" cy="-22" r="34" fill="${couleur}"/>
    <circle cx="20" cy="-34" r="42" fill="${couleur}"/>
    <circle cx="58" cy="-10" r="28" fill="${couleur}"/>
  </g>`;
}

export function buisson(c1 = '#7fb36d', c2 = '#94c682', baies = '#f4a3a3') {
  return `
    <ellipse cx="0" cy="62" rx="150" ry="20" fill="#000" opacity=".08"/>
    <circle cx="-85" cy="10" r="62" fill="${c1}"/>
    <circle cx="85" cy="12" r="60" fill="${c1}"/>
    <rect x="-140" y="20" width="280" height="45" rx="22" fill="${c1}"/>
    <circle cx="0" cy="-22" r="82" fill="${c2}"/>
    <circle cx="-48" cy="22" r="56" fill="${c2}"/>
    <circle cx="52" cy="24" r="54" fill="${c2}"/>
    <circle cx="-40" cy="-30" r="8" fill="${baies}"/>
    <circle cx="30" cy="-48" r="8" fill="${baies}"/>
    <circle cx="70" cy="0" r="8" fill="${baies}"/>
    <circle cx="-90" cy="0" r="7" fill="${baies}"/>
    <circle cx="-30" cy="-70" r="12" fill="#fff" opacity=".18"/>`;
}

export function champignon(chapeau = '#f2a7a0', pois = '#fff8ec') {
  return `
    <ellipse cx="0" cy="92" rx="90" ry="14" fill="#000" opacity=".08"/>
    <path d="M-38 10 Q-46 80 -34 92 L34 92 Q46 80 38 10 Z" fill="#fbecd6"/>
    <ellipse cx="0" cy="12" rx="60" ry="12" fill="#efd8b8"/>
    <path d="M-110 14 Q-110 -95 0 -100 Q110 -95 110 14 Q0 30 -110 14 Z" fill="${chapeau}"/>
    <circle cx="-55" cy="-40" r="15" fill="${pois}"/>
    <circle cx="10" cy="-68" r="18" fill="${pois}"/>
    <circle cx="60" cy="-28" r="13" fill="${pois}"/>
    <circle cx="-10" cy="-15" r="10" fill="${pois}"/>
    <circle cx="-14" cy="55" r="5" fill="#4a3b35"/>
    <circle cx="14" cy="55" r="5" fill="#4a3b35"/>
    <path d="M-9 68 Q0 75 9 68" fill="none" stroke="#4a3b35" stroke-width="4" stroke-linecap="round"/>`;
}

/** Petites lucioles décoratives qui voltigent. */
export function luciolesDeco(n, zone = [0, 0, 1600, 900], couleur = '#fff3b0') {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = zone[0] + Math.random() * zone[2], y = zone[1] + Math.random() * zone[3];
    s += `<circle class="luciole-deco" style="animation-delay:-${r(0, 9)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r(4, 8)}" fill="${couleur}" pointer-events="none"/>`;
  }
  return s;
}
