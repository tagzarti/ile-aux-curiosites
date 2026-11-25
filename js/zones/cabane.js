/* ==========================================================================
   cabane.js — La Cabane aux Mots (apprendre à lire, à son rythme).

   À droite, une échelle de 5 barreaux = 5 niveaux (paliers) :
     1. les sons   2. les syllabes   3. les mots   4. les phrases   5. les histoires
   Un niveau s'ouvre tout seul quand l'enfant a assez joué au précédent
   (le parent peut aussi choisir dans l'espace parent).
   Jamais d'échec : un morceau touché « au mauvais moment » chante quand même.
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { creerToile, el, auToucher, rebond, secouer, sautiller, etincelles, attendre, melanger, NS } from '../moteur/outils.js';
import { VOYELLES, CONSONNES, EXEMPLES, MOTS, PHRASES, HISTOIRES,
         idSon, idSyllabe, idMot, idPhrase, decouper } from '../lecture.js';
import { dessinMot } from '../dessins-mots.js';

/* Quand ouvrir le niveau suivant (nombre de réussites dans le niveau) */
const SEUILS = { 1: 12, 2: 10, 3: 6, 4: 5 };
const COULEURS = { voyelle: '#e0607e', consonne: '#4f7cc0', muet: '#b5aca6', texte: '#4a3b35' };
const LETTRES_VOYELLES = 'aeiouyéèêàâîïôûù';
const POLICE = "Andika, 'Comic Sans MS', system-ui, sans-serif";

let actif = false;
let minuteries = [];
let jeton = 0; // change à chaque nouvel écran : stoppe les lectures en cours

/* ---------- Petits outils d'écriture ---------- */

/** Écrit un mot en couleurs (voyelles roses, consonnes bleues, muettes grises). */
function ecrire(parent, texte, x, y, taille, { couleurs = true, muet = '', couleur = COULEURS.texte } = {}) {
  const t = el('text', {
    x, y, 'font-size': taille, 'font-family': POLICE, 'text-anchor': 'middle',
    'dominant-baseline': 'middle', 'pointer-events': 'none',
  }, parent);
  for (const c of texte) {
    const ts = document.createElementNS(NS, 'tspan');
    ts.textContent = c;
    ts.setAttribute('fill', !couleurs ? couleur : LETTRES_VOYELLES.includes(c.toLowerCase()) ? COULEURS.voyelle : COULEURS.consonne);
    t.appendChild(ts);
  }
  if (muet) {
    const ts = document.createElementNS(NS, 'tspan');
    ts.textContent = muet;
    ts.setAttribute('fill', COULEURS.muet);
    t.appendChild(ts);
  }
  return t;
}

/** Une bulle ronde touchable avec une lettre ou une syllabe dedans. */
function bulle(parent, texte, x, y, r, fond = '#fff8ec') {
  const g = el('g', { transform: `translate(${x} ${y})` }, parent);
  const anime = el('g', { class: 'anime' }, g);
  el('circle', { r, fill: fond, stroke: '#e7c98f', 'stroke-width': 6 }, anime);
  ecrire(anime, texte, 0, 4, r * 1.15);
  return { g, anime };
}

/** Un dessin de mot placé et mis à l'échelle. */
function dessin(parent, mot, x, y, echelle = 1) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${echelle})` }, parent);
  return el('g', { class: 'anime' }, g, dessinMot(mot));
}

/** Gros bouton rond avec une flèche (page suivante / précédente). */
function fleche(parent, x, y, sens = 1) {
  const g = el('g', { transform: `translate(${x} ${y})` }, parent);
  const anime = el('g', { class: 'anime' }, g);
  el('circle', { r: 62, fill: '#b5dca0', stroke: '#8fc47e', 'stroke-width': 6 }, anime);
  el('path', { d: sens > 0 ? 'M-18 -28 L22 0 L-18 28 Z' : 'M18 -28 L-22 0 L18 28 Z', fill: '#fff', stroke: '#fff', 'stroke-width': 10, 'stroke-linejoin': 'round' }, anime);
  return { g, anime };
}

/** Bouton « on lit ensemble » : une petite Lilo avec des ondes sonores. */
function boutonLireEnsemble(parent, x, y) {
  const g = el('g', { transform: `translate(${x} ${y})` }, parent);
  const anime = el('g', { class: 'anime' }, g);
  el('circle', { r: 62, fill: '#fff3c9', stroke: '#ffd86b', 'stroke-width': 6 }, anime);
  el('circle', { cx: -10, cy: 0, r: 26, fill: '#ffe08a' }, anime);
  el('circle', { cx: -18, cy: -4, r: 4, fill: '#4a3b35' }, anime);
  el('circle', { cx: -2, cy: -4, r: 4, fill: '#4a3b35' }, anime);
  el('path', { d: 'M24 -18 q12 18 0 36 M36 -28 q20 28 0 56', fill: 'none', stroke: '#e0a64a', 'stroke-width': 6, 'stroke-linecap': 'round' }, anime);
  return { g, anime };
}

/* ---------- La scène ---------- */

export default {
  id: 'cabane',
  ambiance: 'cabane',
  avecLilo: true,
  avecMaison: true,

  async entrer(conteneur) {
    actif = true;
    const svg = creerToile(conteneur, `
      <defs>
        <linearGradient id="bois" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6dfbd"/><stop offset="1" stop-color="#ecc99b"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bois)"/>
      ${[1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M0 ${i * 120} H1600" stroke="#e2bd8c" stroke-width="4" opacity=".6"/>`).join('')}
      <rect x="0" y="830" width="1600" height="70" fill="#d9a877"/>
      <g opacity=".9">
        <circle cx="170" cy="150" r="70" fill="#cdebf3" stroke="#c49a74" stroke-width="14"/>
        <path d="M170 80 V220 M100 150 H240" stroke="#c49a74" stroke-width="8"/>
      </g>
      <rect class="tableau" x="230" y="95" width="1130" height="740" rx="50" fill="#fffaf1" stroke="#e2bd8c" stroke-width="10"/>
      <g class="planche"></g>
      <g class="echelle"></g>
    `);
    await document.fonts.load(`80px Andika`).catch(() => {});
    if (!actif) return;

    const planche = svg.querySelector('.planche');
    const d = donnees().cabane;
    d.compteurs ||= {};
    d.vus ||= {};
    d.debloque = Math.max(d.debloque || 1, d.palier || 1);

    /* ----- L'échelle des niveaux ----- */
    const ICONES = [
      (g) => ecrire(g, 'a', 0, 4, 70),
      (g) => ecrire(g, 'ma', 0, 4, 56),
      (g) => { const x = el('g', { transform: 'scale(.32)' }, g, dessinMot('moto')); return x; },
      (g) => el('path', { d: 'M-30 -18 H30 M-30 0 H30 M-30 18 H14', stroke: '#4a3b35', 'stroke-width': 8, 'stroke-linecap': 'round' }, g),
      (g) => el('g', {}, g, `<path d="M-34 -24 Q-17 -32 0 -22 Q17 -32 34 -24 V26 Q17 18 0 28 Q-17 18 -34 26 Z" fill="#f4b6c2" stroke="#d98b6a" stroke-width="5" stroke-linejoin="round"/><path d="M0 -22 V28" stroke="#d98b6a" stroke-width="5"/>`),
    ];
    const barreaux = [];
    const echelle = svg.querySelector('.echelle');
    el('path', { d: 'M1413 150 V840 M1483 150 V840', stroke: '#c49a74', 'stroke-width': 12, 'stroke-linecap': 'round' }, echelle);

    function dessinerEchelle() {
      barreaux.forEach((b) => b.remove());
      barreaux.length = 0;
      for (let n = 1; n <= 5; n++) {
        const y = 210 + (5 - n) * 140; // niveau 1 en bas, 5 en haut
        const g = el('g', { transform: `translate(1448 ${y})` }, echelle);
        const anime = el('g', { class: 'anime' }, g);
        const ouvert = n <= d.debloque;
        el('circle', { r: 58, fill: n === d.palier ? '#ffe9a8' : '#fff8ec', stroke: n === d.palier ? '#f2b35a' : '#e2bd8c', 'stroke-width': n === d.palier ? 9 : 6 }, anime);
        const icone = el('g', { opacity: ouvert ? 1 : 0.25 }, anime);
        ICONES[n - 1](icone);
        if (!ouvert) el('g', { 'pointer-events': 'none' }, g, `<text class="zzz" x="30" y="-30" font-size="30" fill="#b5aca6" font-family="system-ui">z</text>`);
        auToucher(g, () => {
          rebond(anime);
          if (!ouvert) { audio.sons.dodo(); voix.dire('cabane_ferme'); return; }
          audio.sons.plop();
          if (n !== d.palier) { d.palier = n; sauver(); dessinerEchelle(); afficher(); }
        });
        barreaux.push(g);
      }
    }

    /** Compte une réussite dans le niveau ; ouvre le suivant au bon moment. */
    function reussite(n, cle, quoi) {
      d.vus[n] ||= [];
      if (cle && !d.vus[n].includes(cle)) d.vus[n].push(cle);
      d.compteurs[n] = (d.compteurs[n] || 0) + 1;
      if (quoi) noter('lecture', { palier: n, quoi });
      const progres = n <= 2 ? d.vus[n].length : d.compteurs[n];
      if (SEUILS[n] && progres >= SEUILS[n] && d.debloque === n) {
        d.debloque = n + 1;
        sauver();
        minuteries.push(setTimeout(async () => {
          if (!actif) return;
          audio.sons.magie();
          dessinerEchelle();
          etincelles(svg, 1448, 210 + (5 - d.debloque) * 140, '#ffe08a', 12);
          await voix.dire('cabane_debloque');
        }, 2500));
      }
      sauver();
    }

    function vider() {
      jeton++;
      voix.taire();
      minuteries.forEach(clearTimeout);
      minuteries = [];
      planche.innerHTML = '';
    }

    /* ======================= Niveau 1 : les sons ======================= */
    function niveauSons() {
      const exemple = el('g', {}, planche);
      const ligne = (lettres, y) => lettres.forEach((l, i) => {
        const x = 810 + (i - (lettres.length - 1) / 2) * 155;
        const b = bulle(planche, l, x, y, 62, VOYELLES.includes(l) ? '#fdeef1' : '#eef4fc');
        auToucher(b.g, async () => {
          const j = jeton;
          rebond(b.anime, 1.15);
          etincelles(svg, x, y, VOYELLES.includes(l) ? '#f4b6c2' : '#a8c8f0', 5);
          await voix.dire(idSon(l));
          if (j !== jeton || !actif) return;
          // Puis un mot exemple qui commence par ce son, avec son dessin
          exemple.innerHTML = '';
          const mot = EXEMPLES[l];
          if (mot) {
            const des = dessin(exemple, mot, 640, 735, 0.48);
            const t = ecrire(exemple, mot, 760, 740, 86, { couleurs: false, couleur: '#9a8f88' });
            t.setAttribute('text-anchor', 'start');
            // La première lettre (celle qu'on vient d'entendre) en couleur et plus grande
            const premiere = t.firstChild;
            premiere.setAttribute('fill', VOYELLES.includes(l) ? COULEURS.voyelle : COULEURS.consonne);
            premiere.setAttribute('font-size', 120);
            rebond(des, 1.1);
            await voix.dire(idMot(mot));
          } else {
            // Le « e » n'a pas de mot exemple : il rechante juste son son
            rebond(b.anime, 1.2);
            await attendre(250);
            if (j === jeton) await voix.dire(idSon(l));
          }
          if (j === jeton) reussite(1, l, `son « ${l} »`);
        });
      });
      ligne(VOYELLES, 210);
      ligne(CONSONNES.slice(0, 6), 375);
      ligne(CONSONNES.slice(6), 540);
      voix.dire('cabane_p1', { consigne: true });
    }

    /* ===================== Niveau 2 : les syllabes ===================== */
    function niveauSyllabes() {
      let gauche = null, droite = null;
      const train = el('g', { transform: 'translate(0 0)' }, planche);
      // Locomotive + deux wagons
      train.innerHTML = `
        <g transform="translate(390 650)">
          <rect x="-70" y="-60" width="140" height="110" rx="24" fill="#f28b82"/>
          <rect x="-40" y="-110" width="40" height="55" rx="10" fill="#f28b82"/>
          <circle cx="-20" cy="-125" r="16" fill="#fff" opacity=".7" class="flotte"/>
          <rect x="10" y="-40" width="45" height="40" rx="10" fill="#cdebf3"/>
          <circle cx="-40" cy="60" r="24" fill="#4a4a5a"/><circle cx="40" cy="60" r="24" fill="#4a4a5a"/>
        </g>
        <path d="M470 700 H1180" stroke="#c49a74" stroke-width="10" stroke-linecap="round"/>`;
      const wagon = (x) => {
        const g = el('g', { transform: `translate(${x} 650)` }, train);
        el('rect', { x: -110, y: -95, width: 220, height: 150, rx: 26, fill: '#fff3c9', stroke: '#f2c24f', 'stroke-width': 6 }, g);
        el('circle', { cx: -60, cy: 65, r: 24, fill: '#4a4a5a' }, g);
        el('circle', { cx: 60, cy: 65, r: 24, fill: '#4a4a5a' }, g);
        const contenu = el('g', {}, g);
        return { g, contenu };
      };
      const wg = wagon(640), wd = wagon(880);
      const resultat = el('g', {}, planche);

      const remplir = (w, l) => { w.contenu.innerHTML = ''; ecrire(w.contenu, l, 0, -15, 130); rebond(w.contenu, 1.15); };

      async function essayer() {
        if (!gauche || !droite) return;
        const j = jeton;
        const s = gauche + droite;
        await attendre(500);
        if (j !== jeton) return;
        resultat.innerHTML = '';
        const bulleS = el('g', { transform: 'translate(1180 650)' }, resultat);
        const anime = el('g', { class: 'anime' }, bulleS);
        el('rect', { x: -100, y: -95, width: 200, height: 150, rx: 40, fill: '#e9f6df', stroke: '#8fc47e', 'stroke-width': 6 }, anime);
        ecrire(anime, s, 0, -15, 110);
        audio.sons.tchou();
        rebond(anime, 1.15);
        etincelles(svg, 1180, 640, '#b5dca0', 8);
        await voix.dire(idSyllabe(s));
        if (j === jeton) reussite(2, s, `syllabe « ${s} »`);
      }

      CONSONNES.forEach((l, i) => {
        const rang = i < 6 ? 0 : 1;
        const x = 810 + (rang === 0 ? i - 2.5 : i - 6 - 2) * 135;
        const b = bulle(planche, l, x, 170 + rang * 120, 57, '#eef4fc');
        auToucher(b.g, () => {
          rebond(b.anime, 1.2);
          voix.dire(idSon(l));
          gauche = l; remplir(wg, l); essayer();
        });
      });
      VOYELLES.forEach((l, i) => {
        const x = 810 + (i - 2.5) * 135;
        const b = bulle(planche, l, x, 410, 57, '#fdeef1');
        auToucher(b.g, () => {
          rebond(b.anime, 1.2);
          voix.dire(idSon(l));
          droite = l; remplir(wd, l); essayer();
        });
      });
      voix.dire('cabane_p2', { consigne: true });
    }

    /* ======================= Niveau 3 : les mots ======================= */
    function niveauMots() {
      const dejaFaits = d.vus[3] || [];
      const liste = [...MOTS.filter((m) => !dejaFaits.includes(m.mot)), ...MOTS.filter((m) => dejaFaits.includes(m.mot))];
      let index = 0;

      const montrerMot = () => {
        const j = ++jeton;
        planche.innerHTML = '';
        const m = liste[index % liste.length];
        const n = m.syllabes.length;
        const largeur = 230;
        const x0 = 810 - ((n - 1) * largeur) / 2 - (m.muet ? 40 : 0);

        // Le dessin, d'abord en ombre
        const image = dessin(planche, m.mot, 810, 245, 0.95);
        image.style.opacity = '0.12';
        image.style.filter = 'grayscale(1)';

        // Les cases à remplir
        const cases = m.syllabes.map((s, i) => {
          const x = x0 + i * largeur;
          el('rect', { x: x - 100, y: 395, width: 200, height: 150, rx: 30, fill: '#fff', stroke: '#e2bd8c', 'stroke-width': 5, 'stroke-dasharray': '16 12' }, planche);
          return { x, s, rempli: false };
        });
        if (m.muet) ecrire(planche, m.muet, x0 + n * largeur - 60, 475, 110, { couleurs: false, couleur: COULEURS.muet });

        // Les morceaux mélangés
        let ordre = melanger(m.syllabes.map((s, i) => ({ s, i })));
        if (n > 1 && ordre.every((o, k) => o.i === k)) ordre = ordre.reverse();
        let prochain = 0;
        let essaisRates = 0;
        const morceaux = ordre.map((o, k) => {
          const x = 810 + (k - (n - 1) / 2) * 250;
          const g = el('g', { transform: `translate(${x} 715)` }, planche);
          const anime = el('g', { class: 'anime' }, g);
          el('rect', { x: -95, y: -70, width: 190, height: 140, rx: 34, fill: '#fff3c9', stroke: '#f2c24f', 'stroke-width': 6 }, anime);
          ecrire(anime, o.s, 0, -5, 100);
          const morceau = { g, anime, ...o, place: false };
          auToucher(g, async () => {
            if (morceau.place) return;
            voix.dire(idSyllabe(o.s));
            if (o.i === prochain) {
              // Il vole jusqu'à sa case
              morceau.place = true;
              const c = cases[o.i];
              g.animate([{ transform: `translate(${x}px, 715px)` }, { transform: `translate(${c.x}px, 470px)` }],
                { duration: 500, easing: 'ease-out', fill: 'forwards' });
              audio.sons.plop();
              prochain++;
              essaisRates = 0;
              if (prochain === n) { await attendre(700); if (j === jeton) motFini(m, cases, image, j); }
            } else {
              secouer(anime);
              if (++essaisRates >= 2) {
                essaisRates = 0;
                await attendre(700);
                if (j !== jeton) return;
                await voix.dire('cabane_p3_aide');
                if (j !== jeton) return;
                await voix.dire(idMot(m.mot));
                const bon = morceaux.find((mm) => mm.i === prochain);
                if (bon && j === jeton) rebond(bon.anime, 1.2);
              }
            }
          });
          return morceau;
        });
        if (index === 0) voix.dire('cabane_p3', { consigne: true });
      };

      async function motFini(m, cases, image, j) {
        image.style.transition = 'opacity .8s, filter .8s';
        image.style.opacity = '1';
        image.style.filter = 'none';
        audio.sons.magie();
        rebond(image, 1.15);
        etincelles(svg, 810, 245, '#ffe08a', 12);
        // Lilo relit : syllabe par syllabe, puis le mot entier
        const reperes = [];
        for (const c of cases) {
          const r = el('rect', { x: c.x - 100, y: 395, width: 200, height: 150, rx: 30, fill: '#ffe9a8', opacity: 0 }, planche);
          planche.insertBefore(r, planche.firstChild);
          reperes.push(r);
        }
        await attendre(500);
        for (let i = 0; i < cases.length; i++) {
          if (j !== jeton) return;
          reperes[i].setAttribute('opacity', 1);
          await voix.dire(idSyllabe(cases[i].s));
          reperes[i].setAttribute('opacity', 0);
        }
        if (j !== jeton) return;
        reperes.forEach((r) => r.setAttribute('opacity', 1));
        await voix.dire(idMot(m.mot));
        if (j !== jeton) return;
        reussite(3, m.mot, `mot « ${m.mot} »`);
        // Flèche « mot suivant »
        const f = fleche(planche, 1270, 740);
        rebond(f.anime, 1.2);
        auToucher(f.g, () => { audio.sons.plop(); index++; montrerMot(); });
        // Toucher le dessin : il relit le mot
        auToucher(image.parentNode, () => { rebond(image, 1.1); voix.dire(idMot(m.mot)); });
      }

      montrerMot();
    }

    /* ======= Niveaux 4 et 5 : une phrase à lire (phrase seule ou page de livre) ======= */

    /**
     * Affiche une phrase + ses dessins. Chaque mot se touche.
     * Le bouton « lire ensemble » : Lilo lit mot par mot (le mot s'allume), puis toute la phrase.
     * surLue() est appelé quand la phrase a été lue (tous les mots touchés, ou lue ensemble).
     */
    function pagePhrase(zone, phrase, surLue) {
      const j = jeton;
      // Dessins
      const nb = phrase.dessins.length;
      phrase.dessins.forEach((m, i) => {
        const des = dessin(zone, m, 810 + (i - (nb - 1) / 2) * 300, 290, nb > 2 ? 0.9 : 1.15);
        auToucher(des.parentNode, () => { rebond(des, 1.12); audio.sons.etincelle(); if (m !== 'lilo') voix.dire(idMot(m)); });
      });

      // La phrase, sur une ou deux lignes
      const mots = decouper(phrase.texte);
      const taille = 84;
      const groupes = mots.map((m) => {
        const g = el('g', {}, zone);
        const fond = el('rect', { rx: 18, fill: '#ffe9a8', opacity: 0 }, g);
        const t = ecrire(g, m.brut, 0, 0, taille, { couleurs: false });
        t.setAttribute('text-anchor', 'start');
        return { g, fond, t, ...m, largeur: 0, touche: false };
      });
      groupes.forEach((gr) => { gr.largeur = gr.t.getComputedTextLength(); });
      const espace = 30, maxLargeur = 1050;
      const lignes = [[]];
      let l = 0;
      for (const gr of groupes) {
        if (l + gr.largeur > maxLargeur && lignes.at(-1).length) { lignes.push([]); l = 0; }
        lignes.at(-1).push(gr);
        l += gr.largeur + espace;
      }
      lignes.forEach((ligne, k) => {
        const total = ligne.reduce((s, gr) => s + gr.largeur, 0) + espace * (ligne.length - 1);
        let x = 810 - total / 2;
        const y = (lignes.length === 1 ? 570 : 530) + k * 115;
        for (const gr of ligne) {
          gr.t.setAttribute('x', x);
          gr.t.setAttribute('y', y);
          gr.fond.setAttribute('x', x - 10);
          gr.fond.setAttribute('y', y - 55);
          gr.fond.setAttribute('width', gr.largeur + 20);
          gr.fond.setAttribute('height', 110);
          x += gr.largeur + espace;
        }
      });

      let dejaLue = false;
      const marquerLue = () => { if (!dejaLue) { dejaLue = true; surLue?.(); } };

      groupes.forEach((gr) => auToucher(gr.g, () => {
        voix.dire(idMot(gr.mot.toLowerCase()));
        gr.fond.setAttribute('opacity', 1);
        setTimeout(() => gr.fond.setAttribute('opacity', 0), 900);
        gr.touche = true;
        if (groupes.every((x) => x.touche)) marquerLue();
      }));

      const lire = boutonLireEnsemble(zone, 420, 760);
      let lecture = false;
      auToucher(lire.g, async () => {
        if (lecture) return;
        lecture = true;
        rebond(lire.anime, 1.15);
        for (const gr of groupes) {
          if (j !== jeton) return;
          gr.fond.setAttribute('opacity', 1);
          await voix.dire(idMot(gr.mot.toLowerCase()));
          gr.fond.setAttribute('opacity', 0);
          await attendre(120);
        }
        if (j !== jeton) return;
        groupes.forEach((gr) => gr.fond.setAttribute('opacity', 0.5));
        await voix.dire(idPhrase(phrase.texte));
        if (j !== jeton) return;
        groupes.forEach((gr) => gr.fond.setAttribute('opacity', 0));
        lecture = false;
        marquerLue();
      });
    }

    /* ===================== Niveau 4 : les phrases ===================== */
    function niveauPhrases() {
      let index = (d.compteurs[4] || 0) % PHRASES.length;
      const montrer = () => {
        jeton++;
        voix.taire();
        planche.innerHTML = '';
        const p = PHRASES[index % PHRASES.length];
        pagePhrase(planche, p, () => {
          audio.sons.magie();
          reussite(4, null, `phrase « ${p.texte} »`);
        });
        const f = fleche(planche, 1290, 760);
        auToucher(f.g, () => { audio.sons.plop(); rebond(f.anime); index++; montrer(); });
      };
      montrer();
      voix.dire('cabane_p4', { consigne: true });
    }

    /* ===================== Niveau 5 : les histoires ===================== */
    function niveauHistoires() {
      const etagere = () => {
        jeton++;
        planche.innerHTML = '';
        HISTOIRES.forEach((h, i) => {
          const x = 810 + (i - (HISTOIRES.length - 1) / 2) * 420;
          const g = el('g', { transform: `translate(${x} 470)` }, planche);
          const anime = el('g', { class: 'anime' }, g);
          el('rect', { x: -170, y: -260, width: 340, height: 470, rx: 30, fill: i % 2 ? '#c9b6e4' : '#f4b6c2', stroke: '#fff', 'stroke-width': 10 }, anime);
          el('rect', { x: -140, y: -230, width: 280, height: 260, rx: 24, fill: '#fffaf1' }, anime);
          h.couverture.forEach((m, k) => {
            const n = h.couverture.length;
            const gg = el('g', { transform: `translate(${(k - (n - 1) / 2) * 120} -100) scale(.55)` }, anime);
            gg.innerHTML = dessinMot(m);
          });
          // Titre : écrit en petit (les livres ont un titre), et dit par Lilo
          const t = ecrire(anime, h.titre, 0, 120, 40, { couleurs: false, couleur: '#fff' });
          t.setAttribute('font-size', h.titre.length > 16 ? 36 : 42);
          auToucher(g, async () => {
            rebond(anime, 1.06);
            audio.sons.entree();
            const j = jeton;
            await voix.dire(`titre_${h.id}`);
            if (j === jeton) livre(h, 0);
          });
        });
        voix.dire('cabane_p5', { consigne: true });
      };

      const livre = (h, page) => {
        jeton++;
        voix.taire();
        planche.innerHTML = '';
        const p = h.pages[page];
        pagePhrase(planche, p, null);
        // Petits points : où on en est dans le livre
        h.pages.forEach((_, k) => el('circle', { cx: 810 + (k - (h.pages.length - 1) / 2) * 34, cy: 130, r: 10, fill: k === page ? '#f2b08f' : '#f0e2cc' }, planche));
        if (page > 0) {
          const prec = fleche(planche, 600, 760, -1);
          auToucher(prec.g, () => { audio.sons.plop(); livre(h, page - 1); });
        }
        const suiv = fleche(planche, 1290, 760, 1);
        auToucher(suiv.g, async () => {
          audio.sons.plop();
          if (page < h.pages.length - 1) return livre(h, page + 1);
          // Fin du livre
          const j = jeton;
          audio.sons.magie();
          etincelles(svg, 810, 400, '#ffe08a', 14);
          reussite(5, h.id, `histoire « ${h.titre} »`);
          await voix.dire('cabane_fin_livre');
          if (j === jeton) etagere();
        });
        if (page === 0) voix.dire('cabane_p5_page', { consigne: true });
      };

      etagere();
    }

    /* ----- Afficher le niveau choisi ----- */
    function afficher() {
      vider();
      [niveauSons, niveauSyllabes, niveauMots, niveauPhrases, niveauHistoires][d.palier - 1]();
    }

    dessinerEchelle();
    if (!d.introFaite) {
      d.introFaite = true;
      sauver();
      await voix.dire('cabane_intro');
      if (!actif) return;
    }
    afficher();
  },

  quitter() {
    actif = false;
    jeton++;
    minuteries.forEach(clearTimeout);
    minuteries = [];
  },
};
