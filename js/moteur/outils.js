/* ==========================================================================
   outils.js — petites fonctions partagées par toutes les scènes :
   dessiner en SVG, réagir au toucher, petites animations.
   ========================================================================== */

export const NS = 'http://www.w3.org/2000/svg';

export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
export const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
export function melanger(liste) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/** Crée l'image SVG plein écran d'une scène (repère 1600 × 900). */
export function creerToile(conteneur, contenu = '') {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 900');
  // « slice » : l'image remplit tout l'écran, quitte à rogner un peu les bords
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.innerHTML = contenu;
  conteneur.appendChild(svg);
  return svg;
}

/** Crée un élément SVG avec ses attributs. */
export function el(tag, attrs = {}, parent = null, contenu = '') {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (contenu) e.innerHTML = contenu;
  if (parent) parent.appendChild(e);
  return e;
}

/** Convertit la position du doigt en coordonnées du dessin. */
export function pointDansToile(svg, evt) {
  const p = svg.createSVGPoint();
  p.x = evt.clientX; p.y = evt.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

/**
 * Réagit au toucher (doigt, stylet ou souris) dès que le doigt se pose :
 * pas d'attente, pas de double-tap.
 */
export function auToucher(element, action) {
  element.classList.add('touchable');
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    action(e);
  });
}

/* ---------- Animations courtes (Web Animations API) ---------- */

export function rebond(element, force = 1.12) {
  element.animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${force}, ${2 - force})` },
     { transform: `scale(${2 - force}, ${force})` }, { transform: 'scale(1)' }],
    { duration: 420, easing: 'ease-out' });
}

export function secouer(element) {
  element.animate(
    [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' },
     { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }],
    { duration: 500, easing: 'ease-in-out' });
}

export function sautiller(element, hauteur = 30) {
  element.animate(
    [{ transform: 'translateY(0)' }, { transform: `translateY(-${hauteur}px)` }, { transform: 'translateY(0)' }],
    { duration: 380, easing: 'ease-out' });
}

/** Une petite gerbe de points lumineux qui s'éteint doucement. */
export function etincelles(svg, x, y, couleur = '#fff3b0', nombre = 7) {
  for (let i = 0; i < nombre; i++) {
    const angle = (Math.PI * 2 * i) / nombre + Math.random() * 0.5;
    const dist = 40 + Math.random() * 40;
    const c = el('circle', { cx: x, cy: y, r: 6 + Math.random() * 6, fill: couleur, opacity: 0.9 }, svg);
    c.style.pointerEvents = 'none';
    c.animate(
      [{ transform: 'translate(0,0) scale(1)', opacity: 0.9 },
       { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(.3)`, opacity: 0 }],
      { duration: 900 + Math.random() * 300, easing: 'ease-out' }).onfinish = () => c.remove();
  }
}

/** Un rond qui s'élargit (goutte d'eau, toucher dans le vide). */
export function onde(svg, x, y, couleur = '#ffffff') {
  const c = el('circle', { cx: x, cy: y, r: 10, fill: 'none', stroke: couleur, 'stroke-width': 6, opacity: 0.8 }, svg);
  c.style.pointerEvents = 'none';
  c.animate([{ r: 10, opacity: 0.8 }, { r: 90, opacity: 0 }], { duration: 1000, easing: 'ease-out' })
    .onfinish = () => c.remove();
}
