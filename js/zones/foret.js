/* ==========================================================================
   foret.js — La Forêt des Sons (curiosité, écoute).

   Des animaux se cachent derrière 6 buissons.
     1er toucher d'un buisson : il bruisse et on entend le cri de l'animal ;
                                Lilo demande « À ton avis, qui fait ce bruit ? »
     2e toucher               : l'animal sort, Lilo dit son nom et un petit fait.
     Ensuite                  : toucher l'animal lui fait refaire son cri.
   Quand tous sont sortis, ils se recachent (dans un nouvel ordre).
   Surprise rare : un hérisson remplace parfois un des animaux.
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { creerToile, el, auToucher, rebond, secouer, sautiller, etincelles, pointDansToile,
         attendre, auHasard, melanger } from '../moteur/outils.js';
import { arbre, sapin, buisson, luciolesDeco } from '../dessins.js';

/* ---------- Les animaux (dessins originaux, ronds et doux) ---------- */

const yeux = (dx, y, r, pupille = '#4a3b35') => `
  <g class="cligne anime">
    <circle cx="${-dx}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${dx}" cy="${y}" r="${r}" fill="#fff"/>
    <circle cx="${-dx + 2}" cy="${y + 2}" r="${r * 0.55}" fill="${pupille}"/><circle cx="${dx + 2}" cy="${y + 2}" r="${r * 0.55}" fill="${pupille}"/>
    <circle cx="${-dx + 5}" cy="${y - 2}" r="${r * 0.2}" fill="#fff"/><circle cx="${dx + 5}" cy="${y - 2}" r="${r * 0.2}" fill="#fff"/>
  </g>`;
const joues = (dx, y, c = '#f7a8a8') => `
  <ellipse cx="${-dx}" cy="${y}" rx="11" ry="7" fill="${c}" opacity=".6"/>
  <ellipse cx="${dx}" cy="${y}" rx="11" ry="7" fill="${c}" opacity=".6"/>`;

export const ANIMAUX = {
  hibou: `
    <ellipse cx="-62" cy="20" rx="20" ry="46" fill="#9a7455"/>
    <ellipse cx="62" cy="20" rx="20" ry="46" fill="#9a7455"/>
    <path d="M-52 -50 L-62 -98 L-24 -70 Z M52 -50 L62 -98 L24 -70 Z" fill="#b08968" stroke="#b08968" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="0" cy="10" rx="68" ry="80" fill="#b08968"/>
    <ellipse cx="0" cy="38" rx="44" ry="48" fill="#ecdcc2"/>
    <path d="M-20 25 q6 6 12 0 M8 25 q6 6 12 0 M-8 48 q6 6 12 0" fill="none" stroke="#c9ad8a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="-27" cy="-25" r="31" fill="#e4c48e"/><circle cx="27" cy="-25" r="31" fill="#e4c48e"/>
    ${yeux(27, -25, 23)}
    <path d="M-10 -4 L10 -4 L0 14 Z" fill="#f2a65a" stroke="#f2a65a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-25 88 v10 M-15 88 v10 M15 88 v10 M25 88 v10" stroke="#f2a65a" stroke-width="6" stroke-linecap="round"/>`,

  grenouille: `
    <ellipse cx="-70" cy="62" rx="34" ry="18" fill="#86c36b"/>
    <ellipse cx="70" cy="62" rx="34" ry="18" fill="#86c36b"/>
    <ellipse cx="0" cy="22" rx="88" ry="58" fill="#9bd17f"/>
    <ellipse cx="0" cy="42" rx="56" ry="34" fill="#d9f0c6"/>
    <circle cx="-42" cy="-30" r="30" fill="#9bd17f"/><circle cx="42" cy="-30" r="30" fill="#9bd17f"/>
    ${yeux(42, -32, 19)}
    <path d="M-42 14 Q0 44 42 14" fill="none" stroke="#4a3b35" stroke-width="5" stroke-linecap="round"/>
    ${joues(58, 10)}`,

  coucou: `
    <path d="M50 10 L130 -10 L120 30 Z" fill="#7f95ad" stroke="#7f95ad" stroke-width="10" stroke-linejoin="round"/>
    <ellipse cx="10" cy="20" rx="72" ry="58" fill="#9fb3c8"/>
    <ellipse cx="-5" cy="38" rx="48" ry="36" fill="#eef2f6"/>
    <path d="M-30 30 q8 5 16 0 M-2 30 q8 5 16 0 M-18 48 q8 5 16 0 M10 48 q8 5 16 0" fill="none" stroke="#b9c6d4" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="45" cy="10" rx="34" ry="24" fill="#8aa0b7" transform="rotate(-15 45 10)"/>
    <circle cx="-35" cy="-40" r="44" fill="#9fb3c8"/>
    <g class="cligne anime"><circle cx="-45" cy="-48" r="13" fill="#fff"/><circle cx="-47" cy="-46" r="7" fill="#4a3b35"/><circle cx="-44" cy="-50" r="2.5" fill="#fff"/></g>
    <path d="M-76 -40 L-100 -32 L-76 -26 Z" fill="#f2b35a" stroke="#f2b35a" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="-48" cy="-22" rx="9" ry="6" fill="#f7a8a8" opacity=".6"/>
    <path d="M-10 76 v14 M20 76 v14" stroke="#f2b35a" stroke-width="6" stroke-linecap="round"/>`,

  pic: `
    <path d="M40 30 L100 70 L70 80 Z" fill="#6f9e68" stroke="#6f9e68" stroke-width="10" stroke-linejoin="round"/>
    <ellipse cx="15" cy="25" rx="62" ry="62" fill="#8cc07f"/>
    <ellipse cx="0" cy="45" rx="38" ry="36" fill="#f1ecd2"/>
    <ellipse cx="45" cy="25" rx="26" ry="40" fill="#76aa6e"/>
    <circle cx="-25" cy="-45" r="42" fill="#8cc07f"/>
    <path d="M-62 -60 Q-30 -110 10 -62 Q-25 -74 -62 -60 Z" fill="#ef8f8f" stroke="#ef8f8f" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="-40" cy="-38" r="17" fill="#fff"/>
    <g class="cligne anime"><circle cx="-38" cy="-44" r="11" fill="#fff"/><circle cx="-40" cy="-42" r="6.5" fill="#4a3b35"/><circle cx="-37" cy="-46" r="2.3" fill="#fff"/></g>
    <path d="M-62 -36 L-112 -30 L-62 -22 Z" fill="#c9a36b" stroke="#c9a36b" stroke-width="4" stroke-linejoin="round"/>`,

  abeille: `
    <defs><clipPath id="corps-abeille"><ellipse cx="10" cy="10" rx="78" ry="56"/></clipPath></defs>
    <g transform="translate(-5 -40) rotate(-20)"><ellipse class="lilo-aile anime-bas" cx="0" cy="-30" rx="26" ry="40" fill="#dff3fb" opacity=".85"/></g>
    <g transform="translate(35 -40) rotate(20)"><ellipse class="lilo-aile droite anime-bas" cx="0" cy="-30" rx="24" ry="38" fill="#dff3fb" opacity=".85"/></g>
    <g clip-path="url(#corps-abeille)">
      <ellipse cx="10" cy="10" rx="78" ry="56" fill="#ffd96b"/>
      <rect x="-12" y="-60" width="22" height="140" rx="10" fill="#8a6a50"/>
      <rect x="30" y="-60" width="22" height="140" rx="10" fill="#8a6a50"/>
      <rect x="72" y="-60" width="22" height="140" rx="10" fill="#8a6a50"/>
    </g>
    <path d="M-48 -38 Q-60 -80 -80 -82 M-30 -44 Q-30 -88 -46 -96" fill="none" stroke="#8a6a50" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-80" cy="-82" r="7" fill="#8a6a50"/><circle cx="-46" cy="-96" r="7" fill="#8a6a50"/>
    ${yeux(16, -6, 13).replace(/cx="(-?[\d.]+)"/g, (m, v) => `cx="${(+v - 32).toFixed(1)}"`)}
    <path d="M-58 22 Q-46 34 -34 22" fill="none" stroke="#4a3b35" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="-66" cy="12" rx="9" ry="6" fill="#f7a8a8" opacity=".6"/>`,

  sanglier: `
    <path d="M-30 -66 q10 -20 20 0 q10 -22 20 0 q10 -20 20 0" fill="#7f5e48"/>
    <path d="M-70 -40 L-80 -86 L-40 -62 Z M70 -40 L80 -86 L40 -62 Z" fill="#8f6a52" stroke="#8f6a52" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="0" cy="10" rx="90" ry="72" fill="#a07a5f"/>
    <ellipse cx="0" cy="40" rx="62" ry="36" fill="#b8937a"/>
    ${yeux(30, -16, 14)}
    <ellipse cx="0" cy="30" rx="36" ry="26" fill="#ecb9a8"/>
    <ellipse cx="-12" cy="30" rx="7" ry="10" fill="#b77e6d"/><ellipse cx="12" cy="30" rx="7" ry="10" fill="#b77e6d"/>
    <path d="M-34 52 q-6 -14 -2 -22 M34 52 q6 -14 2 -22" fill="none" stroke="#fff8ec" stroke-width="7" stroke-linecap="round"/>
    ${joues(56, 18)}`,

  herisson: `
    <path d="M-95 60 L-100 20 L-80 30 L-90 -10 L-62 4 L-66 -40 L-38 -20 L-30 -60 L-8 -30 L8 -66 L22 -30 L44 -58 L50 -18 L78 -40 L74 0 L100 -10 L90 30 L108 34 L95 60 Z" fill="#9a7455" stroke="#9a7455" stroke-width="10" stroke-linejoin="round"/>
    <ellipse cx="0" cy="34" rx="90" ry="40" fill="#b08968"/>
    <path d="M-110 50 Q-120 10 -70 6 Q-40 10 -40 50 Z" fill="#f1dcc0"/>
    <circle cx="-118" cy="40" r="10" fill="#4a3b35"/>
    <g class="cligne anime"><circle cx="-78" cy="24" r="10" fill="#fff"/><circle cx="-80" cy="26" r="6" fill="#4a3b35"/><circle cx="-77" cy="22" r="2.2" fill="#fff"/></g>
    <ellipse cx="-74" cy="44" rx="9" ry="6" fill="#f7a8a8" opacity=".7"/>`,
};

const COMMUNS = ['hibou', 'grenouille', 'coucou', 'pic', 'abeille', 'sanglier'];

const BUISSONS = [
  [400, 430], [800, 400], [1200, 430],
  [540, 730], [920, 740], [1290, 730],
];

const TEINTES = [
  ['#7fb36d', '#94c682'], ['#76ad8f', '#8cc4a2'], ['#86b86f', '#9fd08a'],
];

let minuteries = [];
let actif = false; // faux dès qu'on quitte la forêt (stoppe les suites en attente)

export default {
  id: 'foret',
  ambiance: 'foret',
  avecLilo: true,
  avecMaison: true,

  entrer(conteneur) {
    actif = true;
    const svg = creerToile(conteneur, `
      <defs>
        <linearGradient id="fond-foret" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d9efd0"/>
          <stop offset=".55" stop-color="#bfe2b0"/>
          <stop offset="1" stop-color="#a4d396"/>
        </linearGradient>
      </defs>
      <rect class="fond" width="1600" height="900" fill="url(#fond-foret)"/>
      <g opacity=".45" pointer-events="none">
        <path d="M200 0 L340 0 L600 900 L420 900 Z" fill="#fffbe6" opacity=".35"/>
        <path d="M1000 0 L1100 0 L1300 900 L1150 900 Z" fill="#fffbe6" opacity=".3"/>
      </g>
      <g pointer-events="none" opacity=".55">
        ${sapin(120, 300, 1.4, '#a9cfb3')}${arbre(330, 270, 1.1, '#b4d8a5', '#c2e0b5')}
        ${sapin(620, 260, 1.2, '#a9cfb3')}${arbre(1000, 270, 1.2, '#b4d8a5', '#c2e0b5')}
        ${sapin(1300, 290, 1.5, '#a9cfb3')}${arbre(1520, 270, 1, '#b4d8a5', '#c2e0b5')}
      </g>
      <path class="sol" d="M0 560 Q400 500 800 540 T1600 520 V900 H0 Z" fill="#9ccc8c"/>
      <g class="arbres-avant">
        ${arbre(90, 600, 1.6)}${sapin(1510, 620, 1.5, '#76ad8f')}
      </g>
      <g class="buissons"></g>
      <g pointer-events="none">${luciolesDeco(10, [100, 100, 1400, 700])}</g>
    `);

    // Toucher le décor : une petite étincelle (le monde est vivant)
    const decor = (e) => {
      const p = pointDansToile(svg, e);
      audio.sons.etincelle();
      etincelles(svg, p.x, p.y, auHasard(['#fff3b0', '#d9f0c6', '#ffffff']), 5);
    };
    auToucher(svg.querySelector('.fond'), decor);
    auToucher(svg.querySelector('.sol'), decor);
    svg.querySelectorAll('.arbres-avant > g').forEach((a) =>
      auToucher(a, () => { audio.sons.bruissement(); secouer(a.firstElementChild); }));

    /* ----- Les buissons et leurs habitants ----- */
    const groupe = svg.querySelector('.buissons');
    const sauvegarde = donnees().foret;
    let premiereQuestion = true;
    let derniereQuestion = '';
    let enReinitialisation = false;

    const cachettes = BUISSONS.map(([x, y], i) => {
      const g = el('g', { transform: `translate(${x} ${y})` }, groupe);
      const pos = el('g', {}, g);               // monte / descend
      const animalAnime = el('g', { class: 'anime' }, pos);  // saute
      const teinte = TEINTES[i % TEINTES.length];
      const feuillage = el('g', { class: 'anime-bas' }, g, buisson(teinte[0], teinte[1]));
      const c = { g, pos, animalAnime, feuillage, etat: 'cache', animal: null, x, y };
      cacher(c, true);
      auToucher(g, () => toucher(c));
      return c;
    });

    function distribuer() {
      const liste = melanger(COMMUNS);
      // Surprise rare (1 fois sur 5) : le hérisson prend la place d'un ami
      if (Math.random() < 0.2) liste[Math.floor(Math.random() * liste.length)] = 'herisson';
      cachettes.forEach((c, i) => {
        c.animal = liste[i];
        c.animalAnime.innerHTML = ANIMAUX[c.animal];
        c.etat = 'cache';
      });
    }

    function cacher(c, immediat = false) {
      c.pos.animate([{ transform: 'translateY(-170px) scale(1)' }, { transform: 'translateY(10px) scale(.5)' }],
        { duration: immediat ? 0 : 600, easing: 'ease-in', fill: 'forwards' });
    }
    function sortir(c) {
      c.pos.animate([{ transform: 'translateY(10px) scale(.5)' }, { transform: 'translateY(-190px) scale(1.05)' },
                     { transform: 'translateY(-170px) scale(1)' }],
        { duration: 700, easing: 'ease-out', fill: 'forwards' });
    }

    function poserQuestion() {
      let id;
      if (premiereQuestion) { id = 'foret_question_1'; premiereQuestion = false; }
      else { id = auHasard(['foret_question_2', 'foret_question_3'].filter((q) => q !== derniereQuestion)); }
      derniereQuestion = id;
      voix.dire(id, { consigne: true });
    }

    async function toucher(c) {
      if (enReinitialisation) return;
      if (c.etat === 'cache') {
        // 1er toucher : on entend qui se cache
        c.etat = 'ecoute';
        audio.sons.bruissement();
        secouer(c.feuillage);
        await attendre(350);
        if (!actif) return;
        audio.cris[c.animal]();
        minuteries.push(setTimeout(poserQuestion, 1700));
      } else if (c.etat === 'ecoute') {
        // 2e toucher : l'animal sort !
        c.etat = 'sorti';
        audio.sons.bruissement();
        rebond(c.feuillage, 1.08);
        sortir(c);
        audio.sons.plop();
        await attendre(500);
        if (!actif) return;
        audio.sons.magie();
        etincelles(svg, c.x, c.y - 170, '#fff3b0', 9);
        audio.cris[c.animal]();
        minuteries.push(setTimeout(async () => {
          await voix.dire(`foret_${c.animal}`);
          if (actif) verifierTous();
        }, 1400));
        if (!sauvegarde.decouverts.includes(c.animal)) { sauvegarde.decouverts.push(c.animal); sauver(); }
        noter('decouverte', { lieu: 'foret', animal: c.animal });
      } else {
        // Déjà sorti : il refait son cri en sautillant
        sautiller(c.animalAnime, 25);
        audio.cris[c.animal]();
      }
    }

    async function verifierTous() {
      if (enReinitialisation || !cachettes.every((c) => c.etat === 'sorti')) return;
      enReinitialisation = true;
      await attendre(1200);
      if (!actif) return;
      await voix.dire('foret_tous');
      if (!actif) return;
      cachettes.forEach((c, i) => minuteries.push(setTimeout(() => { audio.sons.bruissement(); cacher(c); }, i * 180)));
      await attendre(1600);
      if (!actif) return;
      distribuer();
      enReinitialisation = false;
      voix.dire('foret_intro', { consigne: true });
    }

    distribuer();
    minuteries.push(setTimeout(() => voix.dire('foret_intro', { consigne: true }), 900));
  },

  quitter() {
    actif = false;
    minuteries.forEach(clearTimeout);
    minuteries = [];
  },
};
