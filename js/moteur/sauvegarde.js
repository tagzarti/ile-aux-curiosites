/* ==========================================================================
   sauvegarde.js — mémoire du jeu, uniquement sur la tablette (localStorage).
   Rien n'est jamais envoyé sur Internet.
   ========================================================================== */

const CLE = 'ile-aux-curiosites-v1';

const PAR_DEFAUT = {
  reglages: { volume: 0.8, voix: null, dureeMin: 15 },
  journal: [],                       // { date, type, ... } pour l'espace parent
  foret: { decouverts: [] },         // animaux déjà rencontrés
  jardin: { chanson: null },         // dernière chanson enregistrée
  cabane: { palier: 1, debloque: 1, compteurs: {}, vus: {} }, // Cabane aux Mots
  creatures: [],                     // créatures de l'Atelier (elles se promènent sur l'île)
  ile: { fleurs: [], tresors: [] },  // fleurs plantées, trésors trouvés
  ciel: { arcEnCiel: false },
  poney: { faim: 0.3, poussiere: 0.4, fatigue: 0.2, maj: 0 },
};

let etat = charger();

function charger() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE));
    // On complète avec les valeurs par défaut (utile quand le jeu s'enrichit)
    return fusion(structuredClone(PAR_DEFAUT), brut || {});
  } catch (e) {
    return structuredClone(PAR_DEFAUT);
  }
}

function fusion(base, ajout) {
  for (const k of Object.keys(ajout)) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && ajout[k] && typeof ajout[k] === 'object') {
      fusion(base[k], ajout[k]);
    } else {
      base[k] = ajout[k];
    }
  }
  return base;
}

export function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* mémoire pleine : on ignore */ }
}

/** Accès direct à l'état (ex. donnees().foret.decouverts). Penser à sauver(). */
export function donnees() { return etat; }

/** Ajoute une ligne au journal du parent. */
export function noter(type, details = {}) {
  etat.journal.push({ date: new Date().toISOString(), type, ...details });
  if (etat.journal.length > 500) etat.journal.splice(0, etat.journal.length - 500);
  sauver();
}

export function toutEffacer() {
  etat = structuredClone(PAR_DEFAUT);
  sauver();
}
