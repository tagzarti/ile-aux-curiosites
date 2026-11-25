/* ==========================================================================
   atelier.js — L'Atelier des Créatures (imagination).

   - Toucher la tête, le corps ou les pattes de la créature : ils changent.
   - Les pots de peinture (en bas) : la créature change de couleur.
   - Les 4 boutons ronds (à droite) : on choisit son cri.
   - La grande étoile : la créature prend vie, puis part vivre sur l'île
     (on la retrouvera en promenade sur l'île).
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { creerToile, el, auToucher, rebond, secouer, sautiller, etincelles, attendre } from '../moteur/outils.js';
import { COULEURS, dessinCreature, auHasardCreature, decrire } from '../creatures.js';

const MAX_CREATURES = 12;
const POS = { x: 680, y: 560 };   // pieds de la créature

/* Icônes des 4 cris : zigzag (pouic), bulles (bloup), notes (tralala), vagues (rrrou) */
const ICONES_CRI = [
  `<path d="M-30 10 L-15 -15 L0 10 L15 -15 L30 10" fill="none" stroke="#e0607e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  `<circle cx="-15" cy="10" r="14" fill="none" stroke="#4f9cc0" stroke-width="6"/><circle cx="14" cy="-8" r="10" fill="none" stroke="#4f9cc0" stroke-width="6"/><circle cx="18" cy="20" r="6" fill="none" stroke="#4f9cc0" stroke-width="5"/>`,
  `<path d="M-14 16 V-24 L20 -30 V10" fill="none" stroke="#9a6ac0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-20" cy="16" r="10" fill="#9a6ac0"/><circle cx="14" cy="10" r="10" fill="#9a6ac0"/>`,
  `<path d="M-32 -10 q8 -12 16 0 t16 0 t16 0 t16 0 M-32 12 q8 -12 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#c0884f" stroke-width="7" stroke-linecap="round"/>`,
];

let actif = false;
let minuteries = [];

export default {
  id: 'atelier',
  ambiance: 'atelier',
  avecLilo: true,
  avecMaison: true,

  entrer(conteneur) {
    actif = true;
    const svg = creerToile(conteneur, `
      <rect width="1600" height="900" fill="#efe6f7"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${i * 200}" y="0" width="100" height="900" fill="#e8ddf3"/>`).join('')}
      <rect x="0" y="660" width="1600" height="240" fill="#e2c7a6"/>
      <rect x="0" y="650" width="1600" height="24" rx="10" fill="#c9a37a"/>
      <g opacity=".9">
        <rect x="160" y="170" width="260" height="16" rx="8" fill="#c9a37a"/>
        <circle cx="200" cy="148" r="22" fill="#f4b6c2"/><rect x="240" y="120" width="34" height="50" rx="8" fill="#a8d4f5"/>
        <path d="M300 170 L320 110 L340 170 Z" fill="#ffe08a"/><circle cx="385" cy="150" r="20" fill="#b5dca0"/>
      </g>
      <ellipse class="socle" cx="${POS.x}" cy="${POS.y + 112}" rx="200" ry="40" fill="#d6b4e8" stroke="#b892d0" stroke-width="6"/>
      <g class="creature-pos" transform="translate(${POS.x} ${POS.y - 20})"><g transform="translate(0 -30) scale(1.3)"><g class="creature anime-bas"></g></g></g>
      <g class="pots"></g>
      <g class="cris"></g>
      <g class="etoile"></g>
    `);

    let c = auHasardCreature();
    let changements = 0;
    let conseilDonne = false;
    let enVie = false;
    const groupe = svg.querySelector('.creature');
    const pos = svg.querySelector('.creature-pos');

    function dessiner() {
      groupe.innerHTML = dessinCreature(c);
      groupe.querySelectorAll('[data-morceau]').forEach((m) => {
        auToucher(m, () => {
          if (enVie) return;
          const k = m.dataset.morceau;
          c[k] = (c[k] + 1) % 4;
          audio.sons.pouf();
          dessiner();
          const nouveau = groupe.querySelector(`[data-morceau="${k}"]`);
          rebond(nouveau, 1.12);
          etincelles(svg, POS.x, POS.y + (k === 'tete' ? -120 : k === 'corps' ? 0 : 100), c.couleur, 6);
          apresChangement();
        });
      });
    }

    function apresChangement() {
      changements++;
      if (changements === 6 && !conseilDonne) {
        conseilDonne = true;
        minuteries.push(setTimeout(() => {
          rebond(etoile.anime, 1.2);
          voix.dire('atelier_conseil', { consigne: true });
        }, 800));
      }
    }

    /* ----- Pots de peinture ----- */
    COULEURS.forEach((col, i) => {
      const x = 330 + i * 150;
      const g = el('g', { transform: `translate(${x} 790)` }, svg.querySelector('.pots'));
      const anime = el('g', { class: 'anime' }, g, `
        <path d="M-48 -30 L-40 50 Q0 62 40 50 L48 -30 Z" fill="#f4f0ea" stroke="#d9cfc4" stroke-width="5"/>
        <ellipse cx="0" cy="-30" rx="50" ry="16" fill="${col.hex}" stroke="${col.hex}" stroke-width="4"/>
        <path d="M-30 -24 Q-34 0 -24 10" fill="none" stroke="${col.hex}" stroke-width="10" stroke-linecap="round"/>`);
      el('circle', { cx: 0, cy: 0, r: 70, fill: 'transparent' }, g);
      auToucher(g, () => {
        if (enVie) return;
        rebond(anime);
        audio.sons.splash();
        c.couleur = col.hex;
        dessiner();
        rebond(groupe, 1.06);
        etincelles(svg, POS.x, POS.y - 40, col.hex, 10);
        apresChangement();
      });
    });

    /* ----- Les cris ----- */
    const boutonsCri = ICONES_CRI.map((icone, i) => {
      const y = 230 + i * 135;
      const g = el('g', { transform: `translate(1070 ${y})` }, svg.querySelector('.cris'));
      const anime = el('g', { class: 'anime' }, g);
      const rond = el('circle', { r: 58, fill: '#fff8ec', stroke: '#e7c98f', 'stroke-width': 6 }, anime);
      el('g', {}, anime, icone);
      auToucher(g, () => {
        if (enVie) return;
        c.cri = i;
        rebond(anime, 1.15);
        audio.crisCreature[i]();
        ouvrirBouche();
        boutonsCri.forEach((b, k) => b.setAttribute('stroke', k === i ? '#f2b35a' : '#e7c98f'));
        apresChangement();
      });
      return rond;
    });

    function ouvrirBouche() {
      const b = groupe.querySelector('.bouche');
      if (b) {
        b.classList.add('anime');
        b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6, 2)' }, { transform: 'scale(1)' }],
          { duration: 500, easing: 'ease-out' });
      }
      sautiller(groupe, 14);
    }

    /* ----- L'étoile magique : la créature prend vie ----- */
    const ge = el('g', { transform: 'translate(1300 470)' }, svg.querySelector('.etoile'));
    const etoile = { anime: el('g', { class: 'anime' }, ge, `
      <circle r="95" fill="#fff6cf" opacity=".8"/>
      <path d="M0 -78 L21 -26 L76 -22 L34 12 L48 66 L0 36 L-48 66 L-34 12 L-76 -22 L-21 -26 Z" fill="#ffe08a" stroke="#f2c24f" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="-14" cy="-4" r="5" fill="#8a6a50"/><circle cx="14" cy="-4" r="5" fill="#8a6a50"/>
      <path d="M-10 12 q10 8 20 0" fill="none" stroke="#8a6a50" stroke-width="4" stroke-linecap="round"/>`) };
    etoile.anime.classList.add('flotte');

    auToucher(ge, async () => {
      if (enVie) return;
      enVie = true;
      rebond(etoile.anime, 1.2);
      audio.sons.vie();
      etincelles(svg, POS.x, POS.y - 60, '#ffe08a', 16);
      etincelles(svg, POS.x, POS.y - 60, c.couleur, 10);
      groupe.classList.add('danse');
      await attendre(700);
      if (!actif) return;
      audio.crisCreature[c.cri]();
      ouvrirBouche();

      // Sauvegarde : elle va vivre sur l'île
      const d = donnees();
      d.creatures.push({ ...c, nee: new Date().toISOString() });
      if (d.creatures.length > MAX_CREATURES) d.creatures.shift();
      sauver();
      noter('creature', { description: decrire(c) });

      await voix.dire('atelier_vivante');
      if (!actif) return;
      audio.crisCreature[c.cri]();
      // Elle part en sautillant vers l'île…
      groupe.classList.remove('danse');
      const depart = pos.animate([
        { transform: `translate(${POS.x}px, ${POS.y - 20}px)` },
        { transform: `translate(${POS.x + 200}px, ${POS.y - 120}px)` },
        { transform: `translate(${POS.x + 450}px, ${POS.y - 20}px)` },
        { transform: `translate(${POS.x + 1100}px, ${POS.y - 100}px)` },
      ], { duration: 1800, easing: 'ease-in', fill: 'forwards' });
      await depart.finished.catch(() => {});
      if (!actif) return;
      // … et une nouvelle créature à inventer apparaît
      c = auHasardCreature();
      dessiner();
      pos.animate([{ transform: `translate(${POS.x}px, ${POS.y + 200}px) scale(.2)` },
                   { transform: `translate(${POS.x}px, ${POS.y - 20}px) scale(1)` }],
        { duration: 600, easing: 'ease-out', fill: 'forwards' });
      audio.sons.plop();
      enVie = false;
      voix.dire('atelier_encore', { consigne: true });
    });

    dessiner();
    minuteries.push(setTimeout(() => voix.dire('atelier_intro', { consigne: true }), 900));
  },

  quitter() {
    actif = false;
    minuteries.forEach(clearTimeout);
    minuteries = [];
  },
};
