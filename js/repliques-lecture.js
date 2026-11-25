/* ==========================================================================
   repliques-lecture.js — toutes les voix de la Cabane aux Mots, calculées
   à partir de lecture.js (sons, syllabes, mots, phrases, histoires).

   Les sons isolés sont écrits en « phonèmes » entre [[ ]] pour que la voix
   dise bien « mmm » et pas « èm ». Après le « | » : ce que dit la voix de
   la tablette si le fichier audio manque.
   ========================================================================== */

import { VOYELLES, CONSONNES, EXEMPLES, MOTS, PHRASES, HISTOIRES,
         idSon, idSyllabe, idMot, idPhrase, decouper } from './lecture.js';

const PHONEMES = {
  a: 'aː', i: 'iː', o: 'oː', u: 'yː', é: 'eː', e: 'əː',
  m: 'mːːː', l: 'lːːː', r: 'ʁːːː', s: 'sːːː', f: 'fːːː', v: 'vːːː', n: 'nːːː',
  p: 'pə', t: 'tə', d: 'də', b: 'bə',
};
const PHONEME_SIMPLE = { a: 'a', i: 'i', o: 'o', u: 'y', é: 'e', e: 'ə', m: 'm', l: 'l', r: 'ʁ', s: 's', f: 'f',
  v: 'v', n: 'n', p: 'p', t: 't', d: 'd', b: 'b' };
const LECTURE_TABLETTE = { m: 'mmm', l: 'lll', r: 'rrr', s: 'sss', f: 'fff', v: 'vvv', n: 'nnn', p: 'pe', t: 'te',
  d: 'de', b: 'be', a: 'a', i: 'i', o: 'o', u: 'u', é: 'é', e: 'e' };

export const REPLIQUES_LECTURE = {};
const r = REPLIQUES_LECTURE;

for (const l of [...VOYELLES, ...CONSONNES]) r[idSon(l)] = `[[ ${PHONEMES[l]} ]]|${LECTURE_TABLETTE[l]}`;

for (const c of CONSONNES) {
  for (const v of VOYELLES) {
    const s = c + v;
    // Les syllabes en « e » (me, le, te…) passent par les phonèmes, sinon la voix les déforme
    r[idSyllabe(s)] = v === 'e' ? `[[ ${PHONEME_SIMPLE[c]}ə ]]|${s}` : s;
  }
}

const mots = new Set(['lilo', ...Object.values(EXEMPLES), ...MOTS.map((m) => m.mot)]);
const textes = [...PHRASES.map((p) => p.texte), ...HISTOIRES.flatMap((h) => h.pages.map((p) => p.texte))];
textes.forEach((t) => decouper(t).forEach(({ mot }) => mots.add(mot.toLowerCase())));
for (const m of mots) r[idMot(m)] = m === 'lilo' ? 'Lilo' : m;

for (const t of textes) r[idPhrase(t)] = t;
for (const h of HISTOIRES) r[`titre_${h.id}`] = h.titre;
