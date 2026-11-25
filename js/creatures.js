/* ==========================================================================
   creatures.js — dessin des créatures inventées dans l'Atelier.
   Une créature = { tete, corps, pattes, couleur, cri } (des numéros 0 à 3).
   Le même dessin sert dans l'Atelier et sur l'île, où elles se promènent.
   ========================================================================== */

export const COULEURS = [
  { hex: '#f4b6c2', nom: 'rose' },
  { hex: '#ffe08a', nom: 'jaune' },
  { hex: '#a8d4f5', nom: 'bleue' },
  { hex: '#b5dca0', nom: 'verte' },
  { hex: '#c9b6e4', nom: 'violette' },
  { hex: '#f9c08f', nom: 'orange' },
];

export const NOMS = {
  tete: ['une tête de chat', 'des antennes', 'des petites cornes', 'un bec'],
  corps: ['un corps tout rond', 'un grand corps', 'un corps en poire', 'un corps de chenille'],
  pattes: ['deux pattes', 'quatre pattes', 'des roulettes', 'des ailes'],
  cri: ['pouic', 'bloup', 'tralala', 'rrrou'],
};

/** Assombrit une couleur (pour les contours et les pattes). */
export function foncer(hex, f = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `rgb(${c.join(',')})`;
}

export function auHasardCreature() {
  const h = (n) => Math.floor(Math.random() * n);
  return { tete: h(4), corps: h(4), pattes: h(4), couleur: COULEURS[h(6)].hex, cri: h(4) };
}

export function decrire(c) {
  const couleur = COULEURS.find((x) => x.hex === c.couleur)?.nom || 'colorée';
  return `${couleur}, avec ${NOMS.tete[c.tete]}, ${NOMS.corps[c.corps]} et ${NOMS.pattes[c.pattes]} (cri « ${NOMS.cri[c.cri]} »)`;
}

/* ---------- Les morceaux ---------- */

function corps(type, coul, contour) {
  const ventre = 'fill="#ffffff" opacity=".35"';
  switch (type) {
    case 0: return `<circle cx="0" cy="20" r="72" fill="${coul}" stroke="${contour}" stroke-width="5"/>
                    <ellipse cx="0" cy="38" rx="42" ry="36" ${ventre}/>`;
    case 1: return `<ellipse cx="0" cy="5" rx="56" ry="88" fill="${coul}" stroke="${contour}" stroke-width="5"/>
                    <ellipse cx="0" cy="25" rx="30" ry="52" ${ventre}/>`;
    case 2: return `<path d="M0 -60 C40 -60 45 -20 60 20 C80 75 40 95 0 95 C-40 95 -80 75 -60 20 C-45 -20 -40 -60 0 -60 Z" fill="${coul}" stroke="${contour}" stroke-width="5"/>
                    <ellipse cx="0" cy="45" rx="38" ry="34" ${ventre}/>`;
    default: return `<circle cx="-70" cy="45" r="40" fill="${coul}" stroke="${contour}" stroke-width="5"/>
                     <circle cx="70" cy="45" r="40" fill="${coul}" stroke="${contour}" stroke-width="5"/>
                     <circle cx="0" cy="30" r="58" fill="${coul}" stroke="${contour}" stroke-width="5"/>
                     <ellipse cx="0" cy="45" rx="32" ry="26" ${ventre}/>`;
  }
}

function yeux(type) {
  const oeil = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 2}" cy="${y + 2}" r="${r * 0.55}" fill="#4a3b35"/><circle cx="${x + 4}" cy="${y - 2}" r="${r * 0.2}" fill="#fff"/>`;
  if (type === 1) return `<g class="cligne anime">${oeil(0, -100, 22)}</g>`;
  if (type === 2) return `<g class="cligne anime">${oeil(-24, -96, 12)}${oeil(0, -116, 12)}${oeil(24, -96, 12)}</g>`;
  return `<g class="cligne anime">${oeil(-20, -100, 14)}${oeil(20, -100, 14)}</g>`;
}

function tete(type, coul, contour) {
  let deco = '';
  if (type === 0) deco = `<path d="M-46 -118 L-38 -168 L-10 -138 Z M46 -118 L38 -168 L10 -138 Z" fill="${coul}" stroke="${contour}" stroke-width="5" stroke-linejoin="round"/>
                          <path d="M-36 -130 L-34 -152 L-22 -138 Z M36 -130 L34 -152 L22 -138 Z" fill="#f7c6c6"/>`;
  if (type === 1) deco = `<path d="M-18 -140 Q-30 -180 -48 -186 M18 -140 Q30 -180 48 -186" fill="none" stroke="${contour}" stroke-width="5" stroke-linecap="round"/>
                          <circle cx="-48" cy="-186" r="11" fill="#ffe08a"/><circle cx="48" cy="-186" r="11" fill="#ffe08a"/>`;
  if (type === 2) deco = `<path d="M-40 -130 Q-58 -160 -40 -175 Q-30 -150 -22 -138 Z M40 -130 Q58 -160 40 -175 Q30 -150 22 -138 Z" fill="#fff3e3" stroke="#e7c98f" stroke-width="4"/>`;
  if (type === 3) deco = `<path d="M-6 -146 Q-10 -175 4 -182 Q4 -160 10 -146 Z M8 -146 Q14 -172 28 -172 Q20 -156 18 -142 Z" fill="${contour}"/>`;
  const bouche = type === 3
    ? `<path class="bouche" d="M-14 -78 L14 -78 L0 -60 Z" fill="#f2a65a" stroke="#f2a65a" stroke-width="4" stroke-linejoin="round"/>`
    : `<path class="bouche" d="M-14 -74 Q0 -62 14 -74" fill="none" stroke="#4a3b35" stroke-width="5" stroke-linecap="round"/>`;
  return `${deco}<circle cx="0" cy="-100" r="52" fill="${coul}" stroke="${contour}" stroke-width="5"/>
    <ellipse cx="-34" cy="-80" rx="9" ry="6" fill="#f7a8a8" opacity=".7"/><ellipse cx="34" cy="-80" rx="9" ry="6" fill="#f7a8a8" opacity=".7"/>
    ${yeux(type)}${bouche}`;
}

function pattes(type, coul, contour) {
  const p = (x) => `<rect x="${x - 13}" y="70" width="26" height="45" rx="13" fill="${contour}"/><ellipse cx="${x + 4}" cy="114" rx="20" ry="11" fill="${contour}"/>`;
  if (type === 0) return p(-28) + p(28);
  if (type === 1) return p(-55) + p(-20) + p(20) + p(55);
  if (type === 2) return `<rect x="-55" y="78" width="110" height="14" rx="7" fill="${contour}"/>
    <circle cx="-42" cy="100" r="22" fill="#6a6a7a"/><circle cx="-42" cy="100" r="8" fill="#d9d9e3"/>
    <circle cx="42" cy="100" r="22" fill="#6a6a7a"/><circle cx="42" cy="100" r="8" fill="#d9d9e3"/>`;
  return '';
}

function ailes(type) {
  if (type !== 3) return '';
  return `<g transform="translate(-60 0) rotate(-30)"><ellipse class="lilo-aile anime-bas" cx="0" cy="-40" rx="28" ry="50" fill="#ffffff" opacity=".8"/></g>
          <g transform="translate(60 0) rotate(30)"><ellipse class="lilo-aile droite anime-bas" cx="0" cy="-40" rx="28" ry="50" fill="#ffffff" opacity=".8"/></g>`;
}

/**
 * Dessin complet. Les morceaux sont dans des groupes data-morceau="tete|corps|pattes"
 * (l'Atelier s'en sert pour savoir ce que l'enfant touche).
 */
export function dessinCreature(c) {
  const contour = foncer(c.couleur);
  const vole = c.pattes === 3;
  return `
    <ellipse cx="0" cy="${vole ? 130 : 118}" rx="${vole ? 50 : 75}" ry="12" fill="#000" opacity=".1"/>
    <g class="${vole ? 'flotte' : ''}">
      <g data-morceau="pattes">${ailes(c.pattes)}${pattes(c.pattes, c.couleur, contour)}</g>
      <g data-morceau="corps">${corps(c.corps, c.couleur, contour)}</g>
      <g data-morceau="tete">${tete(c.tete, c.couleur, contour)}</g>
    </g>`;
}
