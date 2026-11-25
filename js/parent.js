/* ==========================================================================
   parent.js — l'espace parent.

   Accès : maintenir le petit cadenas (en haut à droite) 3 secondes,
   puis résoudre une addition. Un enfant de 4 ans n'y arrive pas par hasard.

   Contenu : séance (durée, temps joué, nouvelle séance), son et voix,
   niveau de la Cabane aux Mots, journal des activités, effacement.
   ========================================================================== */

import * as audio from './moteur/audio.js';
import * as voix from './moteur/voix.js';
import * as seance from './moteur/seance.js';
import * as scenes from './moteur/scenes.js';
import { donnees, sauver, toutEffacer } from './moteur/sauvegarde.js';

const LIEUX = {
  foret: 'la Forêt des Sons', jardin: 'le Jardin Musical', cabane: 'la Cabane aux Mots',
  atelier: "l'Atelier des Créatures", ciel: 'le Ciel des Couleurs', ecuries: 'les Écuries',
};
const ANIMAUX = {
  hibou: 'le hibou', grenouille: 'la grenouille', coucou: 'le coucou', pic: 'le pic',
  abeille: "l'abeille", sanglier: 'le sanglier', herisson: 'le hérisson (rare !)',
};
const PALIERS = ['Les sons', 'Les syllabes', 'Les mots', 'Les phrases', 'Les histoires'];

let panneau = null;

export function installer() {
  /* ----- Le cadenas : appui long de 3 s ----- */
  const bouton = document.createElement('button');
  bouton.id = 'parent-bouton';
  bouton.setAttribute('aria-label', 'Espace parent');
  bouton.innerHTML = `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#fff8ec" opacity=".8"/>
      <circle class="anneau" cx="50" cy="50" r="44" fill="none" stroke="#d98b6a" stroke-width="7"
              stroke-dasharray="276.5" stroke-dashoffset="276.5" transform="rotate(-90 50 50)"/>
      <path d="M36 46 v-8 a14 14 0 0 1 28 0 v8" fill="none" stroke="#9a8577" stroke-width="6"/>
      <rect x="30" y="45" width="40" height="28" rx="6" fill="#9a8577"/>
    </svg>`;
  document.body.appendChild(bouton);

  const anneau = bouton.querySelector('.anneau');
  let minuterie = null;
  const annuler = () => {
    clearTimeout(minuterie);
    anneau.style.transition = 'stroke-dashoffset .3s';
    anneau.style.strokeDashoffset = '276.5';
  };
  bouton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    anneau.style.transition = 'stroke-dashoffset 3s linear';
    anneau.style.strokeDashoffset = '0';
    minuterie = setTimeout(() => { annuler(); demanderCalcul(); }, 3000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => bouton.addEventListener(t, annuler));

  panneau = document.createElement('div');
  panneau.id = 'parent';
  panneau.className = 'cache-parent';
  document.body.appendChild(panneau);
}

/* ---------- Étape 2 : l'addition ---------- */

function demanderCalcul() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 4 + Math.floor(Math.random() * 6);
  let saisie = '';
  voix.taire();
  panneau.innerHTML = `
    <div class="parent-carte calcul">
      <h2>Espace parent</h2>
      <p>Combien font <strong>${a} + ${b}</strong> ?</p>
      <div class="saisie">&nbsp;</div>
      <div class="clavier">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join('')}
        <button data-n="effacer" aria-label="Effacer">⌫</button>
        <button data-n="0">0</button>
        <button data-n="ok" class="ok">OK</button>
      </div>
      <button class="fermer">Retour au jeu</button>
    </div>`;
  ouvrir();
  const affichage = panneau.querySelector('.saisie');
  panneau.querySelectorAll('.clavier button').forEach((btn) => btn.addEventListener('click', () => {
    const n = btn.dataset.n;
    if (n === 'effacer') saisie = saisie.slice(0, -1);
    else if (n === 'ok') {
      if (+saisie === a + b) return afficherPanneau();
      affichage.classList.add('faux');
      setTimeout(() => { affichage.classList.remove('faux'); }, 500);
      saisie = '';
    } else if (saisie.length < 3) saisie += n;
    affichage.innerHTML = saisie || '&nbsp;';
  }));
  panneau.querySelector('.fermer').addEventListener('click', fermer);
}

/* ---------- Étape 3 : le panneau ---------- */

function afficherPanneau() {
  const d = donnees();
  const r = d.reglages;
  const voixTablette = voix.voixFrancaises();
  panneau.innerHTML = `
    <div class="parent-carte">
      <header><h2>Espace parent</h2><button class="fermer">Retour au jeu ✕</button></header>

      <section>
        <h3>Séance</h3>
        <p>Temps joué : <strong>${seance.minutesJouees()} min</strong> sur ${r.dureeMin} min.
           À la fin, Lilo annonce qu'elle va dormir et l'île s'endort doucement.</p>
        <div class="choix" data-reglage="dureeMin">
          ${[10, 15, 20].map((m) => `<button data-v="${m}" class="${r.dureeMin === m ? 'actif' : ''}">${m} min</button>`).join('')}
        </div>
        <button class="action nouvelle-seance">Nouvelle séance (remet le chrono à zéro)</button>
      </section>

      <section>
        <h3>Son et voix</h3>
        <label>Volume <input type="range" min="0" max="1" step="0.05" value="${r.volume}" class="volume"></label>
        <label>Voix de Lilo
          <select class="voix">
            <option value="">Lilo — voix Siwis (recommandée, hors-ligne)</option>
            ${voixTablette.map((v) => `<option value="${v.name}" ${r.voix === v.name ? 'selected' : ''}>Tablette — ${v.name}</option>`).join('')}
          </select>
        </label>
        <button class="action essai-voix">▶ Écouter la voix</button>
      </section>

      <section>
        <h3>Cabane aux Mots — niveau</h3>
        <p>Les niveaux s'ouvrent tout seuls quand l'enfant est à l'aise. Vous pouvez aussi choisir.</p>
        <div class="choix" data-reglage="palier">
          ${PALIERS.map((nom, i) => `<button data-v="${i + 1}" class="${d.cabane.palier === i + 1 ? 'actif' : ''}">${i + 1}. ${nom}</button>`).join('')}
        </div>
      </section>

      <section>
        <h3>Journal</h3>
        <p class="aide">De quoi parler avec votre enfant après le jeu.</p>
        ${journalHTML()}
      </section>

      <section>
        <h3>Données</h3>
        <p>Tout reste sur cette tablette : rien n'est envoyé sur Internet.</p>
        <button class="action danger effacer">Tout effacer (créatures, chansons, journal…)</button>
      </section>

      <section>
        <h3>Crédits</h3>
        <p class="aide">Voix de Lilo : Piper, voix « Siwis » (base SIWIS, licence CC BY 4.0).
          Police Andika : SIL International (licence OFL). Dessins, sons et code créés pour ce jeu.</p>
      </section>
    </div>`;

  panneau.querySelectorAll('.fermer').forEach((b) => b.addEventListener('click', fermer));

  panneau.querySelectorAll('.choix').forEach((groupe) => groupe.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => {
      const v = +b.dataset.v;
      if (groupe.dataset.reglage === 'dureeMin') r.dureeMin = v;
      else {
        d.cabane.palier = v;
        d.cabane.debloque = Math.max(d.cabane.debloque || 1, v);
      }
      sauver();
      groupe.querySelectorAll('button').forEach((x) => x.classList.toggle('actif', x === b));
    })));

  panneau.querySelector('.nouvelle-seance').addEventListener('click', () => {
    seance.recommencer();
    fermer();
    scenes.aller('accueil');
  });

  panneau.querySelector('.volume').addEventListener('input', (e) => {
    r.volume = +e.target.value;
    audio.reglerVolume(r.volume);
    sauver();
  });
  panneau.querySelector('.voix').addEventListener('change', (e) => {
    r.voix = e.target.value || null;
    appliquerVoix();
    sauver();
  });
  panneau.querySelector('.essai-voix').addEventListener('click', () => voix.dire('accueil_bonjour'));

  panneau.querySelector('.effacer').addEventListener('click', () => {
    if (confirm('Effacer toutes les créations, chansons et le journal ? Cette action est définitive.')) {
      toutEffacer();
      fermer();
      scenes.aller('accueil');
    }
  });
}

export function appliquerVoix() {
  const r = donnees().reglages;
  voix.reglerVoix(r.voix);
  voix.utiliserVoixGeneree(!r.voix);
}

function ouvrir() { panneau.classList.remove('cache-parent'); }
function fermer() { panneau.classList.add('cache-parent'); panneau.innerHTML = ''; }

/* ---------- Le journal, jour par jour ---------- */

function journalHTML() {
  const jours = new Map();
  for (const e of donnees().journal) {
    const jour = e.date.slice(0, 10);
    if (!jours.has(jour)) jours.set(jour, []);
    jours.get(jour).push(e);
  }
  if (!jours.size) return '<p>Rien pour l\'instant.</p>';

  const blocs = [...jours.entries()].reverse().slice(0, 14).map(([jour, evts]) => {
    const date = new Date(jour + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const lignes = [];
    const visites = {};
    evts.filter((e) => e.type === 'visite' && LIEUX[e.lieu]).forEach((e) => { visites[e.lieu] = (visites[e.lieu] || 0) + 1; });
    if (Object.keys(visites).length) {
      lignes.push('Lieux visités : ' + Object.entries(visites).map(([l, n]) => `${LIEUX[l]}${n > 1 ? ` (${n} fois)` : ''}`).join(', '));
    }
    const minutes = evts.filter((e) => e.type === 'seance' && e.evenement === 'fin').reduce((s, e) => s + e.minutes, 0);
    if (minutes) lignes.push(`Temps de jeu (séances terminées) : ${minutes} min`);
    const animaux = [...new Set(evts.filter((e) => e.type === 'decouverte').map((e) => ANIMAUX[e.animal] || e.animal))];
    if (animaux.length) lignes.push('Animaux trouvés dans la forêt : ' + animaux.join(', '));
    const chansons = evts.filter((e) => e.type === 'chanson').length;
    if (chansons) lignes.push(`Chansons composées : ${chansons}`);
    const creatures = evts.filter((e) => e.type === 'creature');
    if (creatures.length) lignes.push('Créatures inventées : ' + creatures.map((c) => c.description).join(' ; '));
    const couleurs = [...new Set(evts.filter((e) => e.type === 'couleur').map((e) => e.couleur))];
    if (couleurs.length) lignes.push('Couleurs fabriquées dans le ciel : ' + couleurs.join(', '));
    const soins = evts.filter((e) => e.type === 'poney').map((e) => e.soin);
    if (soins.length) {
      const c = (s) => soins.filter((x) => x === s).length;
      lignes.push(`Soins au poney : ${c('brosse')} brossage(s), ${c('repas')} repas, ${c('promenade')} promenade(s), ${c('sieste')} sieste(s)`);
    }
    const lectures = evts.filter((e) => e.type === 'lecture');
    if (lectures.length) {
      const quoi = [...new Set(lectures.map((e) => e.quoi))].slice(0, 15);
      lignes.push(`Cabane aux Mots : ${quoi.join(', ')}`);
    }
    const surprises = evts.filter((e) => e.type === 'surprise');
    if (surprises.length) lignes.push('Surprises trouvées : ' + [...new Set(surprises.map((e) => e.quoi))].join(', '));
    if (!lignes.length) lignes.push('Une petite promenade sur l\'île.');
    return `<div class="jour"><h4>${date}</h4><ul>${lignes.map((l) => `<li>${l}</li>`).join('')}</ul></div>`;
  });
  return blocs.join('');
}
