/* ==========================================================================
   voix.js — la voix de Lilo.

   dire('hub_bienvenue') :
     1. joue le fichier indiqué dans voix/index.json : ton enregistrement
        (voix/hub_bienvenue.mp3) s'il existe, sinon la voix Siwis générée
        (voix/lilo/hub_bienvenue.m4a) — voir outils/generer-voix.sh ;
     2. phrase absente de l'index : essaie voix/hub_bienvenue.mp3 ;
     3. sinon, lit le texte avec la synthèse vocale de l'appareil.
   Une seule phrase à la fois : une nouvelle phrase coupe la précédente.
   ========================================================================== */

import { REPLIQUES } from '../repliques.js';

let voixChoisie = null;
let nomVoixPrefere = null;     // réglable depuis l'espace parent (plus tard)
let volume = 1;
let derniereConsigne = null;   // ce que Lilo répète quand on la touche
let audioEnCours = null;
let jeton = 0;                 // pour ignorer la fin d'une phrase déjà coupée
const fichiersAbsents = new Set();
let indexVoix = {};            // identifiant → fichier dans voix/
let voixGeneree = true;        // faux = on préfère la voix de la tablette

// Liste des voix enregistrées / générées (lue une fois au démarrage)
const indexPret = fetch('voix/index.json')
  .then((r) => (r.ok ? r.json() : {}))
  .then((d) => { indexVoix = d.fichiers || {}; })
  .catch(() => {});
const ecouteurs = { debut: [], fin: [] };

/* ---------- Choix de la meilleure voix française ---------- */

function noterVoix(v) {
  const nom = v.name.toLowerCase();
  const lang = v.lang.replace('_', '-').toLowerCase();
  let score = 0;
  if (lang === 'fr-fr') score += 10;
  else if (lang.startsWith('fr')) score += 4;
  if (/natural|neural|premium|enhanced|amélie|amelie|audrey|aurélie|aurelie/.test(nom)) score += 6;
  if (/google/.test(nom)) score += 4;
  if (v.localService) score += 3;              // marche hors-ligne
  if (/femme|female|#1/.test(nom)) score += 1; // ton plus doux en général
  return score;
}

function choisirVoix() {
  if (!('speechSynthesis' in window)) return;
  const voix = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
  if (!voix.length) return;
  voixChoisie = (nomVoixPrefere && voix.find((v) => v.name === nomVoixPrefere))
    || voix.sort((a, b) => noterVoix(b) - noterVoix(a))[0];
}

if ('speechSynthesis' in window) {
  choisirVoix();
  speechSynthesis.addEventListener?.('voiceschanged', choisirVoix);
}

export function voixFrancaises() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
}
export function utiliserVoixGeneree(oui) { voixGeneree = oui; }
export function reglerVoix(nom) { nomVoixPrefere = nom; choisirVoix(); }
export function reglerVolumeVoix(v) { volume = v; }
export function surDebut(f) { ecouteurs.debut.push(f); }
export function surFin(f) { ecouteurs.fin.push(f); }

/* ---------- Parler ---------- */

/** Coupe la phrase en cours. */
export function taire() {
  jeton++;
  if (audioEnCours) { audioEnCours.pause(); audioEnCours = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  ecouteurs.fin.forEach((f) => f());
}

/**
 * Lilo dit la réplique `id`. Renvoie une promesse résolue quand elle a fini.
 * options.consigne = true : la phrase devient celle répétée au toucher de Lilo.
 */
export function dire(id, { consigne = false } = {}) {
  const texte = REPLIQUES[id];
  if (!texte) { console.warn('Réplique inconnue :', id); return Promise.resolve(); }
  if (consigne) derniereConsigne = id;
  taire();
  const monJeton = ++jeton;
  ecouteurs.debut.forEach((f) => f());

  return new Promise((resolve) => {
    let fini = false;
    const terminer = () => {
      if (fini) return;
      fini = true;
      if (monJeton === jeton) {
        audioEnCours = null;
        ecouteurs.fin.forEach((f) => f());
      }
      resolve();
    };

    const parSynthese = () => {
      if (monJeton !== jeton) return terminer();
      if (!('speechSynthesis' in window)) return setTimeout(terminer, 1500);
      // Après « | » : texte prévu pour la voix de la tablette (sons de lettres)
      const u = new SpeechSynthesisUtterance(texte.includes('|') ? texte.split('|')[1] : texte);
      u.lang = 'fr-FR';
      if (voixChoisie) u.voice = voixChoisie;
      u.rate = 0.85;   // débit lent
      u.pitch = 1.15;  // un peu plus aigu : petite luciole
      u.volume = volume;
      u.onend = terminer;
      u.onerror = terminer;
      // Sécurité : certains navigateurs « oublient » de signaler la fin
      setTimeout(terminer, 2500 + texte.length * 110);
      // Petit délai après cancel() : évite un bug connu de Chrome Android
      setTimeout(() => { if (monJeton === jeton) speechSynthesis.speak(u); else terminer(); }, 60);
    };

    if (fichiersAbsents.has(id)) return parSynthese();

    let fichier = indexVoix[id] || `${id}.mp3`;
    // Voix de la tablette choisie : on garde seulement tes enregistrements perso
    if (!voixGeneree && fichier.startsWith('lilo/')) return parSynthese();
    const audio = new Audio(`voix/${fichier}`);
    audio.volume = volume;
    audioEnCours = audio;
    audio.onended = terminer;
    audio.onerror = () => {
      fichiersAbsents.add(id);           // pas d'enregistrement : on retient pour la suite
      if (audioEnCours === audio) audioEnCours = null;
      parSynthese();
    };
    audio.play().catch(() => {});        // l'erreur éventuelle est gérée par onerror
  });
}

/** Lilo répète sa dernière consigne (quand l'enfant la touche). */
export function repeter() {
  if (derniereConsigne) return dire(derniereConsigne);
  return Promise.resolve();
}

/** Attendre que la liste des voix soit chargée (au démarrage du jeu). */
export const pret = () => indexPret;

export function parle() {
  return !!audioEnCours || ('speechSynthesis' in window && speechSynthesis.speaking);
}
