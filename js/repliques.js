/* ==========================================================================
   repliques.js — TOUTES les phrases dites dans le jeu.

   Chaque phrase a un identifiant (à gauche). Pour remplacer la voix de
   synthèse par TA voix : enregistre la phrase et dépose le fichier dans
   le dossier /voix avec le nom   <identifiant>.mp3
   Exemple :  voix/hub_bienvenue.mp3
   Le jeu utilisera automatiquement ton enregistrement s'il existe.

   Règle : une seule phrase courte par réplique (consignes pour 4 ans).
   ========================================================================== */

import { REPLIQUES_LECTURE } from './repliques-lecture.js';

export const REPLIQUES = {
  ...REPLIQUES_LECTURE,

  // ---------- Accueil ----------
  accueil_bonjour: "Bonjour ! Je suis Lilo, la petite luciole. Viens, on explore l'île !",

  // ---------- Île (hub) ----------
  hub_bienvenue: "Voici notre île ! Touche un endroit pour y aller.",
  hub_retour: "Te revoilà sur l'île ! Où veux-tu aller ?",
  hub_foret: "La Forêt des Sons !",
  hub_jardin: "Le Jardin Musical !",
  hub_endormi_1: "Chut… Cet endroit dort encore. Bientôt, une surprise !",
  hub_endormi_2: "Oh ! Ici, ça se prépare… Et si on essayait autre chose ?",
  hub_mer: "Plouf ! L'eau est toute douce aujourd'hui.",
  hub_ciel: "Le Ciel des Couleurs !",
  hub_cabane: "La Cabane aux Mots !",
  hub_atelier: "L'Atelier des Créatures !",
  hub_ecuries: "Les Écuries de la Prairie !",
  hub_baleine: "Oh ! Une baleine qui dit bonjour !",
  hub_tresor: "Un trésor caché ! Regarde comme il brille.",

  // ---------- Forêt des Sons ----------
  foret_intro: "Des amis se cachent dans les buissons… Touche un buisson pour écouter !",
  foret_question_1: "Écoute… À ton avis, qui fait ce bruit ? Touche encore pour voir !",
  foret_question_2: "À ton avis, qui se cache là-dessous ?",
  foret_question_3: "Hmm… Quel animal fait ça ?",
  foret_tous: "Tu as trouvé tous les amis de la forêt ! Ils vont se cacher encore…",

  foret_hibou: "C'est le hibou ! Il voit très bien dans le noir.",
  foret_grenouille: "C'est la grenouille ! Elle saute très loin avec ses grandes pattes.",
  foret_coucou: "C'est le coucou ! Il chante son prénom : cou-cou !",
  foret_pic: "C'est le pic ! Il tape sur les arbres avec son bec : toc, toc, toc !",
  foret_abeille: "C'est l'abeille ! Elle fabrique le miel avec les fleurs.",
  foret_sanglier: "C'est le sanglier ! Il cherche à manger avec son gros nez.",
  foret_herisson: "Oh, un hérisson ! Il est tout piquant, et il se roule en boule.",

  // ---------- Jardin Musical ----------
  jardin_intro: "Touche les fleurs et les champignons pour faire de la musique !",
  jardin_coquillage_idee: "Et si tu touchais le coquillage pour enregistrer ta chanson ?",
  jardin_ecoute: "Je t'écoute ! Joue ta chanson.",
  jardin_rejoue: "Écoute ! Les amis jouent ta chanson !",
  jardin_rien: "Oh ! Et si on essayait autre chose ?",
  jardin_amis: "Touche les amis, ils rejouent ta chanson !",
  jardin_pas_chanson: "Les amis attendent ta chanson : touche le coquillage !",
  jardin_bravo: "Quelle jolie chanson !",

  // ---------- Séance (fin douce) ----------
  seance_bientot: "Bientôt, l'île va aller dormir… Encore un petit moment de jeu !",
  seance_fin: "Oh… Lilo commence à avoir sommeil. On dit bonne nuit à l'île ?",
  seance_bonne_nuit: "Bonne nuit, la petite île. À bientôt pour de nouvelles curiosités !",
  seance_chut: "Chut… Tout le monde dort sur l'île.",
  seance_repos: "Lilo fait encore dodo… On jouera un peu plus tard !",

  // ---------- Cabane aux Mots ----------
  cabane_intro: "Bienvenue dans la Cabane aux Mots ! Ici, les lettres chantent.",
  cabane_p1: "Touche une lettre pour entendre sa chanson !",
  cabane_p2: "Touche une lettre bleue, puis une lettre rose : elles chantent ensemble !",
  cabane_p3: "Touche les morceaux dans l'ordre pour construire le mot !",
  cabane_p3_aide: "Écoute bien le mot…",
  cabane_p4: "Essaie de lire la phrase ! Touche un mot si tu as besoin d'aide.",
  cabane_p5: "Choisis un livre !",
  cabane_p5_page: "À toi de lire ! Touche un mot, ou touche le bouton pour lire avec moi.",
  cabane_fin_livre: "Fin de l'histoire ! Tu veux en lire une autre ?",
  cabane_debloque: "Oh ! Une nouvelle marche s'ouvre sur l'échelle !",
  cabane_ferme: "Cette marche s'ouvrira bientôt, quand tu seras prêt !",

  // ---------- Atelier des Créatures ----------
  atelier_intro: "Touche la tête, le corps ou les pattes pour inventer une créature !",
  atelier_conseil: "Choisis une couleur et un cri, puis touche l'étoile magique !",
  atelier_vivante: "Ta créature est vivante ! Elle part se promener sur l'île.",
  atelier_encore: "Et si on en inventait une autre ?",

  // ---------- Ciel des Couleurs ----------
  ciel_intro: "Fais glisser un nuage sur un autre pour mélanger les couleurs !",
  ciel_orange: "Du rouge et du jaune… ça fait de l'orange !",
  ciel_vert: "Du jaune et du bleu… ça fait du vert !",
  ciel_violet: "Du rouge et du bleu… ça fait du violet !",
  ciel_marron: "Oh, du marron, comme la terre !",
  ciel_pluie: "Touche un nuage, et il va pleuvoir !",
  ciel_fleurs: "Regarde, les fleurs prennent la couleur de la pluie !",
  ciel_arc: "La pluie et le soleil… un arc-en-ciel !",
  ciel_nuit: "La nuit tombe… Regarde les étoiles !",
  ciel_jour: "Bonjour le soleil !",

  // ---------- Écuries de la Prairie ----------
  ecuries_intro: "Voici le poney ! Touche les objets pour t'occuper de lui.",
  ecuries_content: "Le poney est tout content !",
  ecuries_faim: "Le poney a faim… Qu'est-ce qu'on pourrait lui donner ?",
  ecuries_sale: "Il est plein de poussière… Et si on le brossait ?",
  ecuries_fatigue: "Le poney bâille… Il a sommeil.",
  ecuries_brosse_aide: "Fais glisser la brosse sur le poney !",
  ecuries_propre: "Tout doux, tout beau ! Il est tout propre.",
  ecuries_miam: "Miam ! Il adore ça.",
  ecuries_plein: "Il n'a plus faim, son ventre est tout rond !",
  ecuries_promenade: "En route pour une promenade !",
  ecuries_retour: "Quelle belle promenade ! Il s'est un peu sali.",
  ecuries_dodo: "Chut… il fait une petite sieste.",
  ecuries_reveil: "Il est tout reposé !",
  ecuries_pas_sommeil: "Il n'a pas sommeil, il veut jouer !",
};
