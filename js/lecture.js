/* ==========================================================================
   lecture.js — le contenu de la Cabane aux Mots (méthode syllabique).

   Palier 1 : les SONS des lettres (pas leur nom) : « mmm », « a »…
   Palier 2 : les SYLLABES : une consonne + une voyelle → « ma ».
   Palier 3 : les MOTS : on assemble les syllabes → le dessin apparaît.
   Palier 4 : les PHRASES : chaque mot se touche ; Lilo peut lire avec l'enfant.
   Palier 5 : les HISTOIRES : petits livres illustrés.

   Les voyelles sont en rose, les consonnes en bleu, les lettres muettes
   en gris (comme dans beaucoup de méthodes de maternelle).
   Les mots n'utilisent que des sons simples pour pouvoir être vraiment lus.

   Pour ajouter un mot / une phrase : l'ajouter ici, puis lancer
   ./outils/generer-voix.sh (qui fabrique aussi les voix de la lecture).
   ========================================================================== */

export const VOYELLES = ['a', 'i', 'o', 'u', 'é', 'e'];
export const CONSONNES = ['m', 'l', 'r', 's', 'f', 'v', 'n', 'p', 't', 'd', 'b'];

/** Un exemple (avec dessin) pour chaque lettre. */
export const EXEMPLES = {
  a: 'abeille', i: 'igloo', o: 'orange', u: 'lune', é: 'étoile', e: 'melon',
  m: 'moto', l: 'lune', r: 'rat', s: 'salade', f: 'fusée', v: 'vélo',
  n: 'nid', p: 'pomme', t: 'tomate', d: 'domino', b: 'banane',
};

/** Les mots à construire (palier 3). « muet » = lettre qu'on n'entend pas. */
export const MOTS = [
  { mot: 'moto', syllabes: ['mo', 'to'] },
  { mot: 'lama', syllabes: ['la', 'ma'] },
  { mot: 'vélo', syllabes: ['vé', 'lo'] },
  { mot: 'lune', syllabes: ['lu', 'ne'] },
  { mot: 'rat', syllabes: ['ra'], muet: 't' },
  { mot: 'tomate', syllabes: ['to', 'ma', 'te'] },
  { mot: 'salade', syllabes: ['sa', 'la', 'de'] },
  { mot: 'banane', syllabes: ['ba', 'na', 'ne'] },
  { mot: 'domino', syllabes: ['do', 'mi', 'no'] },
  { mot: 'fusée', syllabes: ['fu', 'sé'], muet: 'e' },
];

/** Les phrases (palier 4) et ce qu'on dessine au-dessus. */
export const PHRASES = [
  { texte: 'Lilo a une moto.', dessins: ['lilo', 'moto'] },
  { texte: 'Le lama a une tomate.', dessins: ['lama', 'tomate'] },
  { texte: 'Le rat va sur la lune.', dessins: ['rat', 'lune'] },
  { texte: 'La fusée va vite.', dessins: ['fusée'] },
  { texte: 'Le lama a un vélo.', dessins: ['lama', 'vélo'] },
  { texte: 'Le rat a une banane.', dessins: ['rat', 'banane'] },
  { texte: 'Lilo a un domino.', dessins: ['lilo', 'domino'] },
  { texte: 'Le lama a une salade.', dessins: ['lama', 'salade'] },
];

/** Les histoires (palier 5) : une page = une phrase + des dessins. */
export const HISTOIRES = [
  {
    id: 'moto', titre: 'La moto de Lilo', couverture: ['lilo', 'moto'],
    pages: [
      { texte: 'Lilo a une moto.', dessins: ['lilo', 'moto'] },
      { texte: 'La moto va vite, vite, vite !', dessins: ['moto'] },
      { texte: 'Lilo a vu un lama.', dessins: ['lilo', 'lama'] },
      { texte: 'Le lama a une tomate.', dessins: ['lama', 'tomate'] },
      { texte: 'Lilo et le lama rigolent !', dessins: ['lilo', 'lama'] },
      { texte: 'Fin.', dessins: ['moto'] },
    ],
  },
  {
    id: 'lune', titre: 'Le rat et la lune', couverture: ['rat', 'lune'],
    pages: [
      { texte: 'Le rat a une fusée.', dessins: ['rat', 'fusée'] },
      { texte: 'La fusée va sur la lune.', dessins: ['fusée', 'lune'] },
      { texte: 'Sur la lune, le rat a vu un lama !', dessins: ['rat', 'lama'] },
      { texte: 'Le lama a une salade.', dessins: ['lama', 'salade'] },
      { texte: 'Le rat et le lama dorment sur la lune.', dessins: ['rat', 'lama', 'lune'] },
      { texte: 'Fin.', dessins: ['lune'] },
    ],
  },
];

/* ---------- Identifiants des voix (même règle que outils/generer_voix.py) ---------- */

export const sansAccent = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const idSon = (lettre) => `son_${sansAccent(lettre) === 'e' && lettre === 'é' ? 'e_aigu' : sansAccent(lettre)}`;
export const idSyllabe = (s) => `syl_${sansAccent(s).replace('é', 'e')}${s.includes('é') ? '_aigu' : ''}`;
export const idMot = (m) => `mot_${sansAccent(m).replace(/[^a-z]/g, '')}`;

/** Découpe une phrase en mots (on garde la ponctuation collée pour l'affichage). */
export function decouper(texte) {
  return texte.split(' ').map((brut) => ({ brut, mot: brut.replace(/[.,!?]/g, '') })).filter((m) => m.mot);
}
export const idPhrase = (t) => `phr_${sansAccent(t).replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '')}`;
