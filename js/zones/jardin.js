/* ==========================================================================
   jardin.js — Le Jardin Musical (créativité, rythme).

   - 5 fleurs-notes : une gamme « pentatonique » (do ré mi sol la), où toutes
     les notes sonnent bien ensemble : impossible de jouer « faux ».
     On peut toucher une fleur, ou glisser le doigt sur plusieurs (comme une harpe).
   - 3 champignons-tambours : grave, bois, grelot.
   - Le coquillage enregistre la suite de notes (pas le micro !) ;
     les trois amis la rejouent ensuite en dansant.
   - Toucher les amis : ils rejouent la dernière chanson (gardée sur la tablette).
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { creerToile, el, auToucher, rebond, sautiller, etincelles, pointDansToile, attendre, auHasard } from '../moteur/outils.js';
import { nuage, champignon, fleur, luciolesDeco } from '../dessins.js';

const FLEURS = [
  { x: 330, freq: 523.25, couleur: '#f4b6c2', coeur: '#ffe08a', tige: 150 }, // do
  { x: 530, freq: 587.33, couleur: '#ffd3a8', coeur: '#f2a7a0', tige: 175 }, // ré
  { x: 730, freq: 659.25, couleur: '#ffe08a', coeur: '#f2b08f', tige: 200 }, // mi
  { x: 930, freq: 783.99, couleur: '#a6e3c8', coeur: '#ffe08a', tige: 225 }, // sol
  { x: 1130, freq: 880.0, couleur: '#c9b6e4', coeur: '#fff3c9', tige: 250 }, // la
];

const CHAMPIGNONS = [
  { x: 450, y: 760, chapeau: '#f2a7a0' },
  { x: 760, y: 780, chapeau: '#c9b6e4' },
  { x: 1070, y: 760, chapeau: '#ffd3a8' },
];

/* Les trois amis danseurs (dessins originaux) */
const AMIS = {
  lapin: `
    <ellipse cx="-18" cy="-70" rx="13" ry="40" fill="#fff8ec" transform="rotate(-10 -18 -70)"/>
    <ellipse cx="18" cy="-70" rx="13" ry="40" fill="#fff8ec" transform="rotate(10 18 -70)"/>
    <ellipse cx="-18" cy="-70" rx="6" ry="28" fill="#f7c6c6" transform="rotate(-10 -18 -70)"/>
    <ellipse cx="18" cy="-70" rx="6" ry="28" fill="#f7c6c6" transform="rotate(10 18 -70)"/>
    <ellipse cx="0" cy="25" rx="42" ry="40" fill="#fff8ec"/>
    <circle cx="0" cy="-20" r="36" fill="#fff8ec"/>
    <circle cx="-13" cy="-24" r="5" fill="#4a3b35"/><circle cx="13" cy="-24" r="5" fill="#4a3b35"/>
    <ellipse cx="0" cy="-12" rx="5" ry="4" fill="#f2a7a0"/>
    <ellipse cx="-22" cy="-8" rx="7" ry="4" fill="#f7a8a8" opacity=".6"/><ellipse cx="22" cy="-8" rx="7" ry="4" fill="#f7a8a8" opacity=".6"/>`,
  escargot: `
    <path d="M-60 55 Q-70 20 -45 15 L50 15 Q70 40 60 55 Z" fill="#e8d6a8"/>
    <circle cx="10" cy="-5" r="45" fill="#f2b08f"/>
    <path d="M10 -5 m-30 0 a30 30 0 1 1 30 30 a20 20 0 1 1 -20 -20 a10 10 0 1 1 10 10" fill="none" stroke="#d98b6a" stroke-width="6" stroke-linecap="round"/>
    <circle cx="-52" cy="5" r="22" fill="#e8d6a8"/>
    <path d="M-60 -12 L-68 -40 M-46 -14 L-44 -44" stroke="#e8d6a8" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-68" cy="-42" r="6" fill="#4a3b35"/><circle cx="-44" cy="-46" r="6" fill="#4a3b35"/>
    <path d="M-62 14 Q-54 20 -46 14" fill="none" stroke="#4a3b35" stroke-width="3" stroke-linecap="round"/>`,
  oiseau: `
    <ellipse cx="0" cy="10" rx="45" ry="42" fill="#a8dde8"/>
    <ellipse cx="5" cy="25" rx="28" ry="24" fill="#e8f7fa"/>
    <ellipse cx="34" cy="8" rx="16" ry="26" fill="#86c7d6" transform="rotate(20 34 8)"/>
    <path d="M-10 -32 q6 -18 14 -2" fill="none" stroke="#86c7d6" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-14" cy="-6" r="6" fill="#4a3b35"/><circle cx="-12" cy="-8" r="2" fill="#fff"/>
    <path d="M-42 0 L-58 6 L-42 12 Z" fill="#f2b35a" stroke="#f2b35a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-8 50 v10 M10 50 v10" stroke="#f2b35a" stroke-width="5" stroke-linecap="round"/>`,
};

const COQUILLAGE = `
  <ellipse cx="0" cy="70" rx="100" ry="16" fill="#000" opacity=".08"/>
  <path d="M0 70 L-95 -10 Q-80 -90 0 -95 Q80 -90 95 -10 Z" fill="#fbe3d6" stroke="#f2b8a0" stroke-width="8" stroke-linejoin="round"/>
  <path d="M0 70 L-60 -80 M0 70 L-25 -94 M0 70 L25 -94 M0 70 L60 -80" stroke="#f2b8a0" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="0" cy="72" rx="26" ry="14" fill="#f2b8a0"/>`;

let minuteries = [];
let actif = false;

export default {
  id: 'jardin',
  ambiance: 'jardin',
  avecLilo: true,
  avecMaison: true,

  entrer(conteneur) {
    actif = true;
    const svg = creerToile(conteneur, `
      <defs>
        <linearGradient id="ciel-jardin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#cdebf3"/>
          <stop offset="1" stop-color="#f6efd9"/>
        </linearGradient>
      </defs>
      <rect class="fond" width="1600" height="900" fill="url(#ciel-jardin)"/>
      <circle cx="260" cy="140" r="70" fill="#fff1b8" opacity=".9" pointer-events="none"/>
      <g pointer-events="none" opacity=".9">
        <g class="derive lente">${nuage(0, 110, 0.9)}</g>
        <g class="derive" style="animation-delay:-35s">${nuage(0, 200, 0.6)}</g>
      </g>
      <path d="M0 520 Q300 460 600 500 T1200 480 T1600 470 V900 H0 Z" fill="#cbe7b4" pointer-events="none"/>
      <path class="sol" d="M0 600 Q400 560 800 590 T1600 570 V900 H0 Z" fill="#b5dca0"/>
      <ellipse cx="1350" cy="330" rx="230" ry="70" fill="#a6d48f"/>
      <g class="amis"></g>
      <g class="fleurs"></g>
      <g class="champignons"></g>
      <g class="coquillage"></g>
      <g pointer-events="none">${luciolesDeco(6, [200, 150, 1200, 500], '#ffffff')}</g>
    `);

    const decor = (e) => {
      const p = pointDansToile(svg, e);
      audio.sons.etincelle();
      etincelles(svg, p.x, p.y, auHasard(['#fff3b0', '#f4b6c2', '#c9b6e4']), 5);
    };
    auToucher(svg.querySelector('.fond'), decor);
    auToucher(svg.querySelector('.sol'), decor);

    /* ----- Les amis danseurs ----- */
    const amis = [['lapin', 1265, 280], ['escargot', 1380, 315], ['oiseau', 1490, 270]].map(([nom, x, y], i) => {
      const g = el('g', { transform: `translate(${x} ${y})` }, svg.querySelector('.amis'));
      const anime = el('g', { class: `anime-bas ${i % 2 ? 'b' : ''}` }, g, AMIS[nom]);
      el('circle', { cx: 0, cy: 0, r: 75, fill: 'transparent' }, g);
      return { g, anime };
    });
    const sautAmi = () => sautiller(auHasard(amis).anime, 18);
    // Une seule zone de toucher pour les trois amis : rejouer la chanson
    amis.forEach(({ g }) => auToucher(g, () => {
      audio.sons.hihi();
      amis.forEach(({ anime }) => sautiller(anime, 20));
      if (enregistrement || lecture) return;
      if (donnees().jardin.chanson?.length) rejouer(donnees().jardin.chanson, false);
      else voix.dire('jardin_pas_chanson', { consigne: true });
    }));

    /* ----- Fleurs et champignons ----- */
    const instruments = [];   // index → { jouer() }

    FLEURS.forEach((f, i) => {
      const g = el('g', { transform: `translate(${f.x} 600)`, 'data-instrument': i }, svg.querySelector('.fleurs'));
      const anime = el('g', { class: 'anime-bas' }, g, fleur(0, 0, 1.7, f.couleur, f.coeur, f.tige / 1.7));
      // zone de toucher : toute la hauteur de la fleur, 160 de large
      el('rect', { x: -80, y: -f.tige - 70, width: 160, height: f.tige + 90, rx: 60, fill: 'transparent' }, g);
      const jouer = () => {
        audio.sons.note(f.freq);
        rebond(anime, 1.1);
        etincelles(svg, f.x, 600 - f.tige, f.couleur, 6);
        sautAmi();
      };
      instruments[i] = { jouer };
    });

    CHAMPIGNONS.forEach((c, j) => {
      const i = FLEURS.length + j;
      const g = el('g', { transform: `translate(${c.x} ${c.y})`, 'data-instrument': i }, svg.querySelector('.champignons'));
      const anime = el('g', { class: 'anime-bas' }, g, champignon(c.chapeau));
      el('ellipse', { cx: 0, cy: 0, rx: 120, ry: 105, fill: 'transparent' }, g);
      const jouer = () => {
        audio.sons.tambour(j);
        anime.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.15,.8)' }, { transform: 'scale(.95,1.06)' }, { transform: 'scale(1,1)' }],
          { duration: 320, easing: 'ease-out' });
        sautAmi();
      };
      instruments[i] = { jouer };
    });

    /* Toucher ET glisser : chaque doigt joue l'instrument qu'il survole */
    const survol = new Map(); // doigt → instrument touché en dernier
    const instrumentSous = (x, y) => {
      const cible = document.elementFromPoint(x, y)?.closest('[data-instrument]');
      return cible ? +cible.dataset.instrument : null;
    };
    const jouerInstrument = (i) => {
      instruments[i].jouer();
      if (enregistrement) noterNote(i);
      apresNote();
    };
    svg.addEventListener('pointerdown', (e) => {
      const i = instrumentSous(e.clientX, e.clientY);
      if (i === null) return;
      e.preventDefault();
      survol.set(e.pointerId, i);
      jouerInstrument(i);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!survol.has(e.pointerId)) return;
      const i = instrumentSous(e.clientX, e.clientY);
      if (i !== null && i !== survol.get(e.pointerId) && i < FLEURS.length) {
        survol.set(e.pointerId, i);
        jouerInstrument(i);
      }
    });
    const lacher = (e) => survol.delete(e.pointerId);
    svg.addEventListener('pointerup', lacher);
    svg.addEventListener('pointercancel', lacher);

    /* ----- Le coquillage : enregistrer sa chanson ----- */
    const gc = el('g', { transform: 'translate(1360 720)' }, svg.querySelector('.coquillage'));
    const coquille = el('g', { class: 'anime' }, gc, COQUILLAGE);
    el('circle', { cx: 0, cy: 0, r: 120, fill: 'transparent' }, gc);

    let enregistrement = null;  // { debut, notes: [{t, i}] } pendant qu'on écoute
    let lecture = false;
    let finSilence = null;

    auToucher(gc, () => {
      if (lecture) return;
      if (!enregistrement) commencerEnregistrement();
      else terminerEnregistrement();
    });

    function commencerEnregistrement() {
      enregistrement = { debut: null, notes: [] };
      audio.sons.coquillageDebut();
      coquille.classList.add('ecoute');
      voix.dire('jardin_ecoute', { consigne: true });
      // Si rien n'est joué pendant 12 s, on arrête gentiment
      finSilence = setTimeout(() => terminerEnregistrement(), 12000);
      minuteries.push(finSilence);
    }

    function noterNote(i) {
      const t = performance.now();
      if (enregistrement.debut === null) enregistrement.debut = t;
      enregistrement.notes.push({ t: Math.round(t - enregistrement.debut), i });
      // La chanson se termine toute seule après 4 s sans note, ou à 40 notes
      clearTimeout(finSilence);
      finSilence = setTimeout(() => terminerEnregistrement(), 4000);
      minuteries.push(finSilence);
      if (enregistrement.notes.length >= 40) terminerEnregistrement();
    }

    async function terminerEnregistrement() {
      if (!enregistrement) return;
      clearTimeout(finSilence);
      const notes = enregistrement.notes;
      enregistrement = null;
      coquille.classList.remove('ecoute');
      audio.sons.coquillageFin();
      if (!notes.length) { voix.dire('jardin_rien'); return; }
      donnees().jardin.chanson = notes;
      // Chaque chanson plante une fleur sur l'île (elle grandira aux séances suivantes)
      const ile = donnees().ile;
      ile.fleurs.push({
        x: Math.round(920 + Math.random() * 380), y: Math.round(430 + Math.random() * 90),
        couleur: auHasard(['#f4b6c2', '#ffd3a8', '#ffe08a', '#a6e3c8', '#c9b6e4']), seance: ile.seances || 0,
      });
      if (ile.fleurs.length > 20) ile.fleurs.shift();
      sauver();
      noter('chanson', { lieu: 'jardin', notes: notes.length });
      await attendre(600);
      if (actif) rejouer(notes, true);
    }

    async function rejouer(notes, annoncer) {
      lecture = true;
      if (annoncer) await voix.dire('jardin_rejoue');
      if (!actif) return;
      amis.forEach(({ anime }) => anime.classList.add('danse'));
      const t0 = performance.now();
      for (const n of notes) {
        const attente = n.t - (performance.now() - t0);
        if (attente > 0) await attendre(attente);
        if (!actif) return;
        instruments[n.i].jouer();
      }
      await attendre(900);
      if (!actif) return;
      amis.forEach(({ anime }) => anime.classList.remove('danse'));
      lecture = false;
      if (annoncer) voix.dire('jardin_amis', { consigne: true });
    }

    /* Après un moment de jeu libre, Lilo suggère (une fois) le coquillage */
    let notesJouees = 0;
    let suggere = false;
    function apresNote() {
      notesJouees++;
      if (!suggere && notesJouees === 12 && !enregistrement && !lecture) {
        suggere = true;
        minuteries.push(setTimeout(() => {
          if (!enregistrement && !lecture) {
            rebond(coquille, 1.15);
            voix.dire('jardin_coquillage_idee', { consigne: true });
          }
        }, 1500));
      }
    }

    minuteries.push(setTimeout(() => voix.dire('jardin_intro', { consigne: true }), 900));
  },

  quitter() {
    actif = false;
    minuteries.forEach(clearTimeout);
    minuteries = [];
  },
};
