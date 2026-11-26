/* ==========================================================================
   repliques-lecture.js — toutes les voix de la Cabane aux Mots, calculées
   à partir de lecture.js (sons, syllabes, mots, phrases, histoires).

   Les sons isolés sont écrits en « phonèmes » entre [[ ]] pour que la voix
   dise bien « mmm » et pas « èm ». Après le « | » : ce que dit la voix de
   la tablette si le fichier audio manque.
   ========================================================================== */

import { VOYELLES, CONSONNES, EXEMPLES, MOTS, PHRASES, HISTOIRES,
         idSon, idSyllabe, idMot, idPhrase, decouper } from './lecture.js';

/* Comment on fait entendre chaque lettre (en phonèmes, avec l'accent tonique « ˈ »).
   Voyelles : leur son pur. Consonnes : leur son suivi d'un petit « e » très léger
   (« mə », « sə »), comme on l'apprend en maternelle — jamais le nom de la lettre (« èm »). */
const PHONEME = { a: 'a', i: 'i', o: 'o', u: 'y', é: 'e', e: 'ə', m: 'm', l: 'l', r: 'ʁ', s: 's', f: 'f',
  v: 'v', n: 'n', p: 'p', t: 't', d: 'd', b: 'b' };
const VOYELLES_SET = new Set(['a', 'i', 'o', 'u', 'é', 'e']);
const sonLettre = (l) => (VOYELLES_SET.has(l) ? `ˈ${PHONEME[l]}` : `ˈ${PHONEME[l]}ə`);
/* Version « écrite » des sons, utilisée par la voix Hélène (Inworld) et la voix de la tablette :
   choisie à l'oreille le 26/11/2026 (bien meilleure que les phonèmes). */
const LECTURE_TABLETTE = { m: 'mmmm', l: 'llll', r: 'rrrr', s: 'ssss', f: 'ffff', v: 'vvvv', n: 'nnnn', p: 'peu', t: 'teu',
  d: 'deu', b: 'beu', a: 'a', i: 'i', o: 'o', u: 'u', é: 'é', e: 'eu' };

/* Mots que la voix lisait mal : on lui donne la bonne prononciation. */
const PRONONCIATIONS = { igloo: 'iɡlˈu', rigolent: 'ʁiɡˈɔl', usine: 'yzˈin' };
const corriger = (texte) => texte.replace(/[a-zàâéèêëîïôûùç]+/gi, (m) => (PRONONCIATIONS[m.toLowerCase()] ? `[[ ${PRONONCIATIONS[m.toLowerCase()]} ]]` : m));

export const REPLIQUES_LECTURE = {};
const r = REPLIQUES_LECTURE;

for (const l of [...VOYELLES, ...CONSONNES]) r[idSon(l)] = `[[ ${sonLettre(l)} ]]|${LECTURE_TABLETTE[l]}`;

for (const c of CONSONNES) {
  for (const v of VOYELLES) {
    const s = c + v;
    // Toujours en phonèmes : sinon la voix lit parfois le nom des lettres (« bé » → « bi »)
    r[idSyllabe(s)] = `[[ ˈ${PHONEME[c]}${PHONEME[v]} ]]|${v === 'e' ? c + 'eu' : s}`;
  }
}

const mots = new Set(['lilo', ...Object.values(EXEMPLES).filter(Boolean), ...MOTS.map((m) => m.mot)]);
const textes = [...PHRASES.map((p) => p.texte), ...HISTOIRES.flatMap((h) => h.pages.map((p) => p.texte))];
textes.forEach((t) => decouper(t).forEach(({ mot }) => mots.add(mot.toLowerCase())));
for (const m of mots) r[idMot(m)] = m === 'lilo' ? 'Lilo' : (PRONONCIATIONS[m] ? `${corriger(m)}|${m}` : m);

for (const t of textes) r[idPhrase(t)] = corriger(t) === t ? t : `${corriger(t)}|${t}`;
for (const h of HISTOIRES) r[`titre_${h.id}`] = h.titre;
