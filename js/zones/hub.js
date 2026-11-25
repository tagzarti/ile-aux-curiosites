/* ==========================================================================
   hub.js — l'île vue de haut. On touche un lieu pour y entrer.
   Les lieux pas encore construits « dorment » (petits zzz) : on peut les
   toucher, Lilo dit que c'est une surprise pour bientôt.
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import * as scenes from '../moteur/scenes.js';
import { creerToile, el, auToucher, rebond, secouer, etincelles, onde, pointDansToile, attendre, auHasard } from '../moteur/outils.js';
import { arbre, sapin, fleur, nuage, luciolesDeco } from '../dessins.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { dessinCreature } from '../creatures.js';
import { crisCreature } from '../moteur/audio.js';
import * as seance from '../moteur/seance.js';
import { sautiller } from '../moteur/outils.js';

/* Chemins où les créatures inventées se promènent (entre les lieux) */
const CHEMINS = [[660, 470], [950, 460], [805, 410], [380, 480], [1240, 470], [660, 740], [960, 750], [805, 720], [420, 400], [1200, 560]];

/* ---------- Dessins des lieux ---------- */

const DESSIN_FORET = `
  ${sapin(-70, 40, 0.8, '#76ad8f')}
  ${arbre(60, 50, 0.9, '#7fb36d', '#94c682')}
  ${arbre(-10, 90, 1.1)}
  ${sapin(110, 110, 0.6, '#86bd9e')}`;

const DESSIN_JARDIN = `
  <ellipse cx="0" cy="70" rx="135" ry="45" fill="#c9e7b5"/>
  ${fleur(-80, 90, 1.1, '#f4b6c2')}
  ${fleur(-30, 80, 1.3, '#ffd3a8')}
  ${fleur(25, 95, 1.0, '#c9b6e4')}
  ${fleur(75, 85, 1.2, '#a6e3c8')}
  <g transform="translate(0 40)">
    <path d="M-30 50 Q-30 -10 0 -12 Q30 -10 30 50 Z" fill="#f2a7a0"/>
    <circle cx="-10" cy="10" r="7" fill="#fff8ec"/><circle cx="12" cy="0" r="6" fill="#fff8ec"/>
  </g>
  <g transform="translate(-40 -40)"><path d="M0 -8 v-30 l18 6 v26" fill="none" stroke="#4a3b35" stroke-width="4"/><circle cx="-5" cy="-6" r="7" fill="#4a3b35"/><circle cx="13" cy="0" r="7" fill="#4a3b35"/></g>`;

const DESSIN_CIEL = `
  ${nuage(0, 0, 1.1, '#ffffff', 1)}
  <path d="M-90 40 A90 90 0 0 1 90 40" fill="none" stroke="#f4b6c2" stroke-width="10" opacity=".8"/>
  <path d="M-75 40 A75 75 0 0 1 75 40" fill="none" stroke="#ffe08a" stroke-width="10" opacity=".8"/>
  <path d="M-60 40 A60 60 0 0 1 60 40" fill="none" stroke="#a6e3c8" stroke-width="10" opacity=".8"/>
  ${nuage(-20, 50, 0.6, '#ffffff', 1)}`;

const DESSIN_CABANE = `
  <rect x="-14" y="-10" width="28" height="110" rx="10" fill="#a8805f"/>
  <circle cx="0" cy="-60" r="85" fill="#8fc47e"/>
  <circle cx="-60" cy="-20" r="45" fill="#7fb36d"/>
  <circle cx="62" cy="-25" r="48" fill="#94c682"/>
  <rect x="-52" y="-58" width="104" height="70" rx="12" fill="#f2c48f"/>
  <path d="M-66 -54 L0 -108 L66 -54 Z" fill="#d98b6a" stroke="#d98b6a" stroke-width="10" stroke-linejoin="round"/>
  <rect x="-14" y="-30" width="28" height="42" rx="8" fill="#9a6a52"/>
  <rect x="22" y="-44" width="20" height="20" rx="5" fill="#fff3c9"/>
  <path d="M-30 12 L-40 100 M-14 12 L-24 100 M-38 35 H-18 M-36 60 H-20 M-34 85 H-22" stroke="#c49a74" stroke-width="5" stroke-linecap="round"/>`;

const DESSIN_ATELIER = `
  <ellipse cx="0" cy="70" rx="120" ry="28" fill="#000" opacity=".07"/>
  <rect x="-75" y="-20" width="150" height="90" rx="16" fill="#f7e1c4"/>
  <path d="M-95 -14 Q0 -110 95 -14 Z" fill="#c9b6e4"/>
  <rect x="-20" y="15" width="40" height="55" rx="12" fill="#9a6a52"/>
  <circle cx="-48" cy="20" r="14" fill="#f4b6c2"/><circle cx="48" cy="20" r="14" fill="#a6e3c8"/>
  <circle cx="-30" cy="-45" r="8" fill="#ffe08a"/><circle cx="0" cy="-58" r="8" fill="#f2a7a0"/><circle cx="30" cy="-45" r="8" fill="#a8dde8"/>`;

const DESSIN_ECURIES = `
  <ellipse cx="0" cy="72" rx="130" ry="26" fill="#000" opacity=".07"/>
  <path d="M-80 70 V-20 L0 -80 L80 -20 V70 Z" fill="#e9a99a" stroke="#e9a99a" stroke-width="10" stroke-linejoin="round"/>
  <path d="M-30 70 V10 H30 V70" fill="#fff3e3"/>
  <path d="M-30 10 L30 70 M30 10 L-30 70" stroke="#e9a99a" stroke-width="6"/>
  <circle cx="0" cy="-30" r="16" fill="#fff3e3"/>
  <path d="M-130 75 H-85 M130 75 H85 M-120 55 V80 M-100 55 V80 M100 55 V80 M120 55 V80 M-130 60 H-85 M130 60 H85" stroke="#c49a74" stroke-width="6" stroke-linecap="round"/>`;

/** Les lieux de l'île. `scene` = null : le lieu dort encore. */
const LIEUX = [
  { id: 'foret', x: 520, y: 340, dessin: DESSIN_FORET, scene: 'foret', voix: 'hub_foret' },
  { id: 'jardin', x: 1090, y: 330, dessin: DESSIN_JARDIN, scene: 'jardin', voix: 'hub_jardin' },
  { id: 'ciel', x: 805, y: 250, dessin: DESSIN_CIEL, scene: 'ciel', voix: 'hub_ciel' },
  { id: 'cabane', x: 810, y: 560, dessin: DESSIN_CABANE, scene: 'cabane', voix: 'hub_cabane' },
  { id: 'atelier', x: 500, y: 620, dessin: DESSIN_ATELIER, scene: 'atelier', voix: 'hub_atelier' },
  { id: 'ecuries', x: 1110, y: 630, dessin: DESSIN_ECURIES, scene: 'ecuries', voix: 'hub_ecuries' },
];

const ILE = 'M300 470 C260 260 560 150 820 165 C1100 150 1370 260 1330 470 C1360 690 1080 800 810 785 C520 800 250 690 300 470 Z';

let minuteries = [];

export default {
  id: 'hub',
  ambiance: 'ile',
  avecLilo: true,
  avecMaison: false,

  entrer(conteneur, { depuis }) {
    let vagues = '';
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * 1500, y = 40 + Math.random() * 820;
      vagues += `<path class="vague ${i % 2 ? 'b' : ''}" d="M${x.toFixed(0)} ${y.toFixed(0)} q20 -12 40 0 t40 0" fill="none" stroke="#e8f7fa" stroke-width="5" stroke-linecap="round" opacity=".6" pointer-events="none"/>`;
    }

    const svg = creerToile(conteneur, `
      <defs>
        <radialGradient id="mer" cx=".5" cy=".5" r=".75">
          <stop offset="0" stop-color="#a8dde8"/>
          <stop offset="1" stop-color="#6fb8cc"/>
        </radialGradient>
      </defs>
      <rect class="mer" width="1600" height="900" fill="url(#mer)"/>
      ${vagues}
      <path d="${ILE}" fill="none" stroke="#e8f7fa" stroke-width="90" opacity=".45" pointer-events="none"/>
      <path class="ile" d="${ILE}" fill="#b5dca0" stroke="#f4e3b5" stroke-width="44" stroke-linejoin="round"/>
      <g class="fleurs-plantees" pointer-events="none"></g>
      <g class="arc-ile" pointer-events="none"></g>
      <g class="lieux"></g>
      <g class="creatures"></g>
      <g class="surprises"></g>
      <g class="meteo" pointer-events="none"></g>
      <g pointer-events="none">${luciolesDeco(6, [320, 200, 960, 560])}</g>
      <g pointer-events="none" opacity=".85">
        <g class="derive">${nuage(0, 120, 0.9)}</g>
        <g class="derive lente" style="animation-delay:-50s">${nuage(0, 800, 0.7)}</g>
      </g>
    `);

    const groupeLieux = svg.querySelector('.lieux');
    let enRoute = false;
    let mesEndormis = 0;

    for (const lieu of LIEUX) {
      const g = el('g', { transform: `translate(${lieu.x} ${lieu.y})` }, groupeLieux);
      const anime = el('g', { class: 'anime' }, g, lieu.dessin);
      // Grande zone de toucher invisible (bien plus de 100 px)
      el('circle', { cx: 0, cy: 10, r: 150, fill: 'transparent' }, g);

      if (!lieu.scene) {
        anime.setAttribute('opacity', '0.6');
        anime.style.filter = 'saturate(.45)';
        el('g', { 'pointer-events': 'none' }, g, `
          <text class="zzz" x="70" y="-70" font-size="40" fill="#ffffff" font-family="system-ui">z</text>
          <text class="zzz" style="animation-delay:-1.7s" x="92" y="-95" font-size="30" fill="#ffffff" font-family="system-ui">z</text>`);
      }

      auToucher(g, async () => {
        rebond(anime);
        if (!lieu.scene) {
          audio.sons.dodo();
          secouer(anime);
          voix.dire(mesEndormis++ % 2 ? 'hub_endormi_2' : 'hub_endormi_1');
          return;
        }
        if (enRoute) return;
        enRoute = true;
        audio.sons.entree();
        etincelles(svg, lieu.x, lieu.y, '#fff3b0', 10);
        // Lilo annonce le lieu, puis on y va (au plus tard après 2,5 s)
        await Promise.race([voix.dire(lieu.voix), attendre(2500)]);
        scenes.aller(lieu.scene);
      });
    }

    // Toucher la mer : petit plouf. Toucher l'herbe : une étincelle.
    let premierPlouf = true;
    auToucher(svg.querySelector('.mer'), (e) => {
      const p = pointDansToile(svg, e);
      audio.sons.ploc();
      onde(svg, p.x, p.y);
      if (premierPlouf) { premierPlouf = false; voix.dire('hub_mer'); }
    });
    auToucher(svg.querySelector('.ile'), (e) => {
      const p = pointDansToile(svg, e);
      audio.sons.etincelle();
      etincelles(svg, p.x, p.y, auHasard(['#fff3b0', '#f4b6c2', '#c9b6e4']), 5);
    });

    ileVivante(svg);

    minuteries.push(setTimeout(() => {
      voix.dire(depuis === 'accueil' ? 'hub_bienvenue' : 'hub_retour', { consigne: true });
    }, 700));
  },

  quitter() {
    minuteries.forEach(clearTimeout);
    minuteries = [];
  },
};

/* ==========================================================================
   L'île vivante : elle change avec ce que l'enfant a fait.
   ========================================================================== */
function ileVivante(svg) {
  const d = donnees();

  /* ----- Les fleurs plantées (une par chanson) poussent d'une séance à l'autre ----- */
  const fleurs = svg.querySelector('.fleurs-plantees');
  for (const f of d.ile.fleurs) {
    const age = Math.min(3, (d.ile.seances || 0) - (f.seance || 0));
    if (age <= 0) {
      el('g', { transform: `translate(${f.x} ${f.y})` }, fleurs,
        '<path d="M0 0 q-4 -14 0 -22" stroke="#7fb36d" stroke-width="5" fill="none"/><ellipse cx="-7" cy="-16" rx="8" ry="4" fill="#8fc47e"/><ellipse cx="7" cy="-20" rx="8" ry="4" fill="#8fc47e"/>');
    } else {
      fleurs.insertAdjacentHTML('beforeend', fleur(f.x, f.y, 0.3 + age * 0.15, f.couleur, '#ffe08a', 30 + age * 8));
    }
  }

  /* ----- Arc-en-ciel fabriqué aujourd'hui dans le Ciel des Couleurs ----- */
  if (d.ciel.arcEnCiel === new Date().toISOString().slice(0, 10)) {
    svg.querySelector('.arc-ile').innerHTML = ['#f28b82', '#f9a65a', '#ffd966', '#8fd18a', '#7ab8f5', '#b48ee0'].map((c, i) =>
      `<path d="M560 260 A250 170 0 0 1 1060 260" transform="translate(0 ${i * 14})" fill="none" stroke="${c}" stroke-width="14" opacity=".5"/>`).join('');
  }

  /* ----- Les créatures de l'Atelier se promènent ----- */
  const groupe = svg.querySelector('.creatures');
  d.creatures.forEach((c, i) => {
    const chemin = melangerChemins(i);
    const g = el('g', { transform: `translate(${chemin[0][0]} ${chemin[0][1]}) scale(.3)` }, groupe);
    const corps = el('g', { class: 'anime-bas' }, g, dessinCreature(c));
    el('circle', { cx: 0, cy: -20, r: 190, fill: 'transparent' }, g);
    g.animate(chemin.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px) scale(.3)` })),
      { duration: 26000 + i * 3000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: -i * 4000 });
    auToucher(g, () => {
      crisCreature[c.cri]();
      sautiller(corps, 60);
    });
  });

  /* ----- Météo de la séance ----- */
  const meteo = svg.querySelector('.meteo');
  const temps = seance.meteo();
  if (temps === 'nuageux' || temps === 'pluie') {
    meteo.innerHTML = `
      <g class="derive" style="animation-delay:-20s">${nuage(0, 260, 1.2, '#ffffff', 0.8)}</g>
      <g class="derive lente" style="animation-delay:-70s">${nuage(0, 520, 1, '#f4f7fb', 0.8)}</g>`;
  }
  if (temps === 'pluie') {
    let gouttes = '';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 1600, y = Math.random() * 900;
      gouttes += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-6 18" stroke="#e8f7fa" stroke-width="4" stroke-linecap="round" opacity=".6"/>`;
    }
    meteo.insertAdjacentHTML('beforeend', `<g class="pluie-douce">${gouttes}</g>`);
  }

  /* ----- Surprises rares (sans pression) ----- */
  const surprises = svg.querySelector('.surprises');
  const tirage = Math.random();
  if (tirage < 0.15) {
    // Une baleine toute douce qui dit bonjour au loin
    const g = el('g', { transform: 'translate(1440 790)' }, surprises);
    const b = el('g', { class: 'flotte' }, g, `
      <path d="M-90 10 Q-80 -50 0 -50 Q70 -50 90 0 Q100 30 60 30 L-60 30 Q-95 30 -90 10 Z" fill="#8fb6d9"/>
      <path d="M85 -5 L130 -35 L120 5 L130 40 Z" fill="#8fb6d9"/>
      <path d="M-70 10 Q0 30 70 10" fill="none" stroke="#dbe9f5" stroke-width="10" stroke-linecap="round"/>
      <circle cx="-45" cy="-15" r="7" fill="#4a3b35"/><path d="M-70 0 q8 8 18 2" fill="none" stroke="#4a3b35" stroke-width="4" stroke-linecap="round"/>
      <g class="jet"><path d="M-10 -55 q-6 -30 -24 -40 M-10 -55 q0 -36 0 -46 M-10 -55 q8 -30 24 -40" fill="none" stroke="#e8f7fa" stroke-width="7" stroke-linecap="round"/></g>`);
    el('circle', { cx: 0, cy: -20, r: 120, fill: 'transparent' }, g);
    g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 3000 });
    let vue = false;
    auToucher(g, () => {
      audio.sons.ploc();
      audio.sons.magie();
      onde(svg, 1440, 800);
      b.querySelector('.jet').animate([{ transform: 'translateY(10px) scale(.6)', opacity: 0.4 }, { transform: 'translateY(-20px) scale(1.2)', opacity: 1 }, { transform: 'none', opacity: 1 }], { duration: 800 });
      voix.dire('hub_baleine');
      if (!vue) { vue = true; noter('surprise', { quoi: 'une baleine qui dit bonjour' }); }
    });
  } else if (tirage < 0.27) {
    // Un trésor caché dans le sable
    const spots = [[330, 560], [1300, 380], [700, 790], [1000, 170]];
    const [x, y] = spots[Math.floor(Math.random() * spots.length)];
    const g = el('g', { transform: `translate(${x} ${y})` }, surprises);
    const t = el('g', { class: 'anime' }, g, `
      <ellipse cx="0" cy="12" rx="40" ry="14" fill="#e8cf95"/>
      <circle class="luciole-deco" cx="0" cy="0" r="10" fill="#fff3b0"/>
      <circle class="luciole-deco" style="animation-delay:-3s" cx="10" cy="-6" r="6" fill="#ffffff"/>`);
    el('circle', { cx: 0, cy: 0, r: 70, fill: 'transparent' }, g);
    let ouvert = false;
    auToucher(g, () => {
      if (ouvert) { audio.sons.etincelle(); return; }
      ouvert = true;
      const quoi = auHasard(['un coquillage tout brillant', 'une étoile de mer', 'une perle toute douce']);
      t.innerHTML = `
        <rect x="-42" y="-30" width="84" height="50" rx="10" fill="#c9a37a" stroke="#a8805f" stroke-width="5"/>
        <path d="M-42 -30 Q0 -70 42 -30" fill="#d9b58c" stroke="#a8805f" stroke-width="5"/>
        <circle cx="0" cy="-34" r="16" fill="${quoi.includes('perle') ? '#fff8ec' : quoi.includes('étoile') ? '#f9a65a' : '#f4b6c2'}"/>`;
      rebond(t, 1.3);
      audio.sons.magie();
      etincelles(svg, x, y - 30, '#ffe08a', 14);
      d.ile.tresors.push({ quoi, date: new Date().toISOString() });
      sauver();
      noter('surprise', { quoi });
      voix.dire('hub_tresor');
    });
  }
}

/** Un chemin de promenade différent pour chaque créature. */
function melangerChemins(i) {
  const n = CHEMINS.length;
  return [0, 1, 2, 3].map((k) => CHEMINS[(i * 3 + k * (i % 3 + 1)) % n]);
}
