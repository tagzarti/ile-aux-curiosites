/* ==========================================================================
   ciel.js — Le Ciel des Couleurs (éveil, cause → effet).

   - Glisser un nuage sur un autre : les couleurs se mélangent
     (rouge + jaune = orange, jaune + bleu = vert, rouge + bleu = violet).
   - Toucher un nuage : il pleut de sa couleur, les fleurs en dessous se colorent.
   - Pluie + soleil = arc-en-ciel.
   - Toucher le soleil (ou la lune) : le jour devient nuit, et inversement.
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { creerToile, el, auToucher, rebond, etincelles, pointDansToile, attendre, auHasard } from '../moteur/outils.js';
import { fleur } from '../dessins.js';

const TEINTES = {
  rouge: '#f28b82', jaune: '#ffd966', bleu: '#7ab8f5',
  orange: '#f9a65a', vert: '#8fd18a', violet: '#b48ee0', marron: '#b08968',
};
const PRIMAIRES = ['rouge', 'jaune', 'bleu'];
const MELANGES = { 'jaune+rouge': 'orange', 'bleu+jaune': 'vert', 'bleu+rouge': 'violet' };
const FLEURS_X = [330, 560, 790, 1020, 1250];

let actif = false;
let minuteries = [];

function dessinNuage(couleur) {
  const c = TEINTES[couleur];
  return `
    <ellipse cx="0" cy="0" rx="105" ry="45" fill="${c}"/>
    <circle cx="-40" cy="-28" r="45" fill="${c}"/>
    <circle cx="26" cy="-44" r="55" fill="${c}"/>
    <circle cx="74" cy="-12" r="36" fill="${c}"/>
    <ellipse cx="-20" cy="-40" rx="18" ry="10" fill="#fff" opacity=".35"/>
    <g class="cligne anime"><circle cx="-18" cy="-6" r="7" fill="#4a3b35"/><circle cx="22" cy="-6" r="7" fill="#4a3b35"/></g>
    <path d="M-10 12 q12 10 24 0" fill="none" stroke="#4a3b35" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="-36" cy="8" rx="9" ry="6" fill="#fff" opacity=".4"/><ellipse cx="42" cy="8" rx="9" ry="6" fill="#fff" opacity=".4"/>`;
}

export default {
  id: 'ciel',
  ambiance: 'ciel',
  avecLilo: true,
  avecMaison: true,

  entrer(conteneur) {
    actif = true;
    let etoiles = '';
    for (let i = 0; i < 45; i++) {
      etoiles += `<circle class="etoile-nuit luciole-deco" style="animation-delay:-${(Math.random() * 9).toFixed(1)}s" cx="${(Math.random() * 1600).toFixed(0)}" cy="${(Math.random() * 600).toFixed(0)}" r="${(2 + Math.random() * 3).toFixed(1)}" fill="#fff6d0"/>`;
    }
    const svg = creerToile(conteneur, `
      <defs>
        <linearGradient id="ciel-jour" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#e3f4fb"/>
        </linearGradient>
        <linearGradient id="ciel-soir" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2f3b6e"/><stop offset="1" stop-color="#6a78b5"/>
        </linearGradient>
      </defs>
      <rect class="fond" width="1600" height="900" fill="url(#ciel-jour)"/>
      <rect class="fond-nuit" width="1600" height="900" fill="url(#ciel-soir)" opacity="0" pointer-events="none" style="transition:opacity 2.5s"/>
      <g class="etoiles" opacity="0" style="transition:opacity 3s" pointer-events="none">${etoiles}</g>
      <g class="arc" opacity="0" pointer-events="none" style="transition:opacity 2s">
        ${['#f28b82', '#f9a65a', '#ffd966', '#8fd18a', '#7ab8f5', '#b48ee0'].map((c, i) =>
          `<path d="M150 760 A650 560 0 0 1 1450 760" fill="none" stroke="${c}" stroke-width="34" opacity=".75" transform="translate(0 ${i * 34}) scale(1 1)"/>`).join('')}
      </g>
      <g class="astre"></g>
      <path class="sol" d="M0 760 Q400 720 800 745 T1600 735 V900 H0 Z" fill="#b5dca0"/>
      <g class="fleurs"></g>
      <g class="pluie" pointer-events="none"></g>
      <g class="nuages"></g>
    `);

    const fondNuit = svg.querySelector('.fond-nuit');
    const groupeEtoiles = svg.querySelector('.etoiles');
    const arc = svg.querySelector('.arc');
    const groupePluie = svg.querySelector('.pluie');
    const groupeNuages = svg.querySelector('.nuages');
    let nuit = false;
    let premierePluie = true;
    let premierMelange = true;

    /* ----- Les fleurs (blanches au début) ----- */
    const fleurs = FLEURS_X.map((x) => {
      const g = el('g', {}, svg.querySelector('.fleurs'));
      const f = { x, g, couleur: '#ffffff' };
      f.dessiner = () => { g.innerHTML = fleur(x, 830, 1.5, f.couleur, '#ffe08a', 60); };
      f.dessiner();
      auToucher(g, () => { audio.sons.etincelle(); rebond(g.firstElementChild.firstElementChild); });
      return f;
    });

    /* ----- Soleil / lune ----- */
    const astre = el('g', { transform: 'translate(1300 160)' }, svg.querySelector('.astre'));
    const astreAnime = el('g', { class: 'anime' }, astre);
    const dessinerAstre = () => {
      astreAnime.innerHTML = nuit
        ? `<circle r="75" fill="#fff3c9"/><circle cx="32" cy="-22" r="66" fill="#3a467a"/>`
        : `<g class="balancer lent anime">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -95 V-120" stroke="#ffd966" stroke-width="12" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g>
           <circle r="78" fill="#ffe08a"/><circle cx="-24" cy="-8" r="7" fill="#8a6a50"/><circle cx="24" cy="-8" r="7" fill="#8a6a50"/>
           <path d="M-18 18 q18 16 36 0" fill="none" stroke="#8a6a50" stroke-width="6" stroke-linecap="round"/>`;
    };
    dessinerAstre();
    auToucher(astre, async () => {
      nuit = !nuit;
      rebond(astreAnime, 1.2);
      fondNuit.setAttribute('opacity', nuit ? 1 : 0);
      groupeEtoiles.setAttribute('opacity', nuit ? 1 : 0);
      arc.setAttribute('opacity', 0);
      dessinerAstre();
      if (nuit) { audio.sons.nuit(); voix.dire('ciel_nuit'); }
      else { audio.sons.arcEnCiel(); voix.dire('ciel_jour'); }
    });

    /* ----- Les nuages ----- */
    const nuages = [];

    function creerNuage(couleur, x, y, depuisBord = false) {
      const g = el('g', { transform: `translate(${x} ${y})` }, groupeNuages);
      const echelle = el('g', { class: 'anime' }, g);
      const anime = el('g', { class: 'flotte' }, echelle, dessinNuage(couleur));
      anime.style.animationDelay = `-${(Math.random() * 4).toFixed(1)}s`;
      const n = { g, echelle, couleur, x, y, ne: Date.now() };
      nuages.push(n);
      brancherGlisser(n);
      if (depuisBord) {
        g.animate([{ transform: `translate(${x < 800 ? -250 : 1850}px, ${y}px)` }, { transform: `translate(${x}px, ${y}px)` }],
          { duration: 1500, easing: 'ease-out' });
      } else {
        echelle.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' });
      }
      return n;
    }

    function retirerNuage(n) {
      nuages.splice(nuages.indexOf(n), 1);
      n.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => n.g.remove();
    }

    function placer(n) { n.g.setAttribute('transform', `translate(${n.x} ${n.y})`); }

    function brancherGlisser(n) {
      n.g.classList.add('touchable');
      let depart = null;
      n.g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { n.g.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
        const p = pointDansToile(svg, e);
        depart = { px: p.x, py: p.y, x: n.x, y: n.y, bouge: false };
        groupeNuages.appendChild(n.g); // passe au premier plan
        audio.sons.plop();
        rebond(n.echelle, 1.06);
      });
      n.g.addEventListener('pointermove', (e) => {
        if (!depart) return;
        const p = pointDansToile(svg, e);
        const dx = p.x - depart.px, dy = p.y - depart.py;
        if (Math.hypot(dx, dy) > 18) depart.bouge = true;
        n.x = Math.max(80, Math.min(1520, depart.x + dx));
        n.y = Math.max(90, Math.min(560, depart.y + dy));
        placer(n);
      });
      const lacher = () => {
        if (!depart) return;
        const bouge = depart.bouge;
        depart = null;
        if (!bouge) return pleuvoir(n);
        const cible = nuages.find((m) => m !== n && Math.hypot(m.x - n.x, m.y - n.y) < 170);
        if (cible) melanger(n, cible);
      };
      n.g.addEventListener('pointerup', lacher);
      n.g.addEventListener('pointercancel', lacher);
    }

    /* ----- Mélanger deux nuages ----- */
    async function melanger(a, b) {
      let resultat;
      if (a.couleur === b.couleur) resultat = a.couleur;
      else resultat = MELANGES[[a.couleur, b.couleur].sort().join('+')] || 'marron';
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
      retirerNuage(a);
      retirerNuage(b);
      audio.sons.magie();
      etincelles(svg, x, y, TEINTES[a.couleur], 8);
      etincelles(svg, x, y, TEINTES[b.couleur], 8);
      creerNuage(resultat, x, y);
      if (resultat !== a.couleur || a.couleur !== b.couleur) {
        if (!PRIMAIRES.includes(resultat)) {
          voix.dire(`ciel_${resultat}`);
          noter('couleur', { couleur: resultat });
        }
      }
      if (premierMelange) {
        premierMelange = false;
        minuteries.push(setTimeout(() => { if (!voix.parle()) voix.dire('ciel_pluie', { consigne: true }); }, 4500));
      }
      // Trop de nuages ? le plus ancien des mélanges s'en va
      while (nuages.length > 6) retirerNuage(nuages.find((m) => !PRIMAIRES.includes(m.couleur)) || nuages[0]);
      // Il faut toujours les 3 couleurs de base : elles reviennent doucement
      minuteries.push(setTimeout(completerPrimaires, 1800));
    }

    function completerPrimaires() {
      if (!actif) return;
      PRIMAIRES.forEach((coul, i) => {
        if (!nuages.some((n) => n.couleur === coul)) {
          const x = [300, 800, 1150][i] + (Math.random() * 80 - 40);
          creerNuage(coul, x, 180 + Math.random() * 120, true);
        }
      });
    }

    /* ----- La pluie ----- */
    let pluieEnCours = 0;
    async function pleuvoir(n) {
      const couleur = TEINTES[n.couleur];
      audio.sons.pluie();
      pluieEnCours++;
      for (let i = 0; i < 16; i++) {
        const x = n.x - 80 + Math.random() * 160;
        const goutte = el('path', { d: `M${x} ${n.y + 30} q-6 14 0 20 q6 -6 0 -20`, fill: couleur, stroke: couleur, 'stroke-width': 4 }, groupePluie);
        goutte.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${760 - n.y}px)`, opacity: 0.6 }],
          { duration: 900 + Math.random() * 300, delay: i * 90, easing: 'ease-in' }).onfinish = () => goutte.remove();
      }
      await attendre(1200);
      if (!actif) return;
      // Les fleurs sous le nuage prennent sa couleur
      let colorees = 0;
      fleurs.forEach((f) => {
        if (Math.abs(f.x - n.x) < 150 && f.couleur !== couleur) {
          f.couleur = couleur;
          f.dessiner();
          rebond(f.g.firstElementChild.firstElementChild, 1.15);
          etincelles(svg, f.x, 730, couleur, 6);
          colorees++;
        }
      });
      if (premierePluie && colorees) { premierePluie = false; voix.dire('ciel_fleurs'); }
      await attendre(900);
      pluieEnCours--;
      // Pluie + soleil = arc-en-ciel
      if (!nuit && pluieEnCours === 0 && actif && arc.getAttribute('opacity') !== '1') {
        arc.setAttribute('opacity', 1);
        audio.sons.arcEnCiel();
        await voix.dire('ciel_arc');
        const d = donnees();
        d.ciel.arcEnCiel = new Date().toISOString().slice(0, 10);
        sauver();
        noter('couleur', { couleur: 'arc-en-ciel' });
        minuteries.push(setTimeout(() => arc.setAttribute('opacity', 0), 15000));
      }
    }

    /* ----- Toucher le ciel : petites étoiles / étincelles ----- */
    auToucher(svg.querySelector('.fond'), (e) => {
      const p = pointDansToile(svg, e);
      audio.sons.etincelle();
      etincelles(svg, p.x, p.y, nuit ? '#fff6d0' : auHasard(Object.values(TEINTES)), 5);
    });
    auToucher(svg.querySelector('.sol'), (e) => {
      const p = pointDansToile(svg, e);
      audio.sons.etincelle();
      etincelles(svg, p.x, p.y, '#d9f0c6', 5);
    });

    creerNuage('rouge', 330, 260);
    creerNuage('jaune', 760, 200);
    creerNuage('bleu', 1120, 300);
    minuteries.push(setTimeout(() => voix.dire('ciel_intro', { consigne: true }), 900));
  },

  quitter() {
    actif = false;
    minuteries.forEach(clearTimeout);
    minuteries = [];
  },
};
