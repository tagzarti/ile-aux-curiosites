/* ==========================================================================
   seance.js — durée de la séance et cycle jour/nuit.

   - Le temps ne compte que quand le jeu est à l'écran.
   - La lumière change doucement : jour → fin d'après-midi dorée → crépuscule.
   - À 90 % : Lilo prévient doucement. À 100 % : l'île s'endort (scène « dodo »).
   - Après une séance, le jeu reste « endormi » 30 minutes (sauf si le parent
     lance une nouvelle séance depuis l'espace parent).
   ========================================================================== */

import * as voix from './voix.js';
import * as scenes from './scenes.js';
import { donnees, noter } from './sauvegarde.js';

const CLE_REPOS = 'ile-aux-curiosites-repos';
const REPOS_MIN = 30;

let tempsJoue = 0;           // secondes
let enCours = false;
let prevenu = false;
let finie = false;
let minuterie = null;
let ecouteursLumiere = [];
let meteoSeance = 'soleil';

/** Le temps qu'il fait sur l'île pendant cette séance. */
export const meteo = () => meteoSeance;

export const dureeSecondes = () => donnees().reglages.dureeMin * 60;
export const progression = () => Math.min(1, tempsJoue / dureeSecondes());
export const minutesJouees = () => Math.floor(tempsJoue / 60);
export const estFinie = () => finie;

/** Vrai si une séance s'est terminée il y a moins de 30 minutes. */
export function auRepos() {
  const fin = +localStorage.getItem(CLE_REPOS) || 0;
  return Date.now() - fin < REPOS_MIN * 60 * 1000;
}

export function demarrer() {
  if (enCours) return;
  enCours = true;
  finie = false;
  prevenu = false;
  tempsJoue = 0;
  // Chaque séance : une météo (souvent du soleil), et les fleurs plantées grandissent
  const t = Math.random();
  meteoSeance = t < 0.6 ? 'soleil' : t < 0.85 ? 'nuageux' : 'pluie';
  donnees().ile.seances = (donnees().ile.seances || 0) + 1;
  noter('seance', { evenement: 'debut', duree: donnees().reglages.dureeMin });
  appliquerLumiere();
  minuterie = setInterval(tic, 5000);
}

/** Nouvelle séance (depuis l'espace parent). */
export function recommencer() {
  localStorage.removeItem(CLE_REPOS);
  clearInterval(minuterie);
  enCours = false;
  finie = false;
  tempsJoue = 0;
  appliquerLumiere();
}

function tic() {
  if (document.hidden || finie) return;
  tempsJoue += 5;
  appliquerLumiere();
  const p = progression();
  if (p >= 0.9 && !prevenu) {
    prevenu = true;
    quandCalme(() => voix.dire('seance_bientot'));
  }
  if (p >= 1) terminer();
}

/** Attend que Lilo ait fini de parler avant d'agir (pas de coupure brutale). */
function quandCalme(action, essais = 0) {
  if (voix.parle() && essais < 12) setTimeout(() => quandCalme(action, essais + 1), 1000);
  else action();
}

function terminer() {
  if (finie) return;
  finie = true;
  clearInterval(minuterie);
  enCours = false;
  localStorage.setItem(CLE_REPOS, String(Date.now()));
  noter('seance', { evenement: 'fin', minutes: minutesJouees() });
  quandCalme(async () => {
    await voix.dire('seance_fin');
    scenes.aller('dodo');
  });
}

/* ---------- Lumière du jour ---------- */

export function surLumiere(f) { ecouteursLumiere.push(f); }

function appliquerLumiere() {
  const p = progression();
  const voile = document.getElementById('lumiere');
  // 0 → 60 % : plein jour ; 60 → 85 % : lumière dorée ; 85 → 100 % : crépuscule
  let couleur = 'rgba(255, 170, 90, 0)';
  if (p > 0.6 && p <= 0.85) {
    const t = (p - 0.6) / 0.25;
    couleur = `rgba(255, 170, 90, ${(0.16 * t).toFixed(3)})`;
  } else if (p > 0.85) {
    const t = Math.min(1, (p - 0.85) / 0.15);
    const r = Math.round(255 - 175 * t), g = Math.round(170 - 90 * t), b = Math.round(90 + 70 * t);
    couleur = `rgba(${r}, ${g}, ${b}, ${(0.16 + 0.16 * t).toFixed(3)})`;
  }
  if (voile) voile.style.backgroundColor = couleur;
  ecouteursLumiere.forEach((f) => f(p));
}
