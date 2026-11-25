/* ==========================================================================
   audio.js — tous les sons du jeu, fabriqués en direct avec la Web Audio API.
   Aucun fichier audio : chaque son est une petite « recette » (oscillateurs,
   bruit filtré, enveloppes de volume).

   Structure :  sons ──┐
                       ├─> volumeGeneral ─> haut-parleurs
          ambiance ────┘
   ========================================================================== */

let ctx = null;
let volumeGeneral = null;
let busSons = null;
let busAmbiance = null;
let bufferBruit = null;

/** À appeler au premier toucher de l'enfant (les navigateurs l'exigent). */
export function demarrer(volume = 0.8) {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    volumeGeneral = ctx.createGain();
    volumeGeneral.gain.value = volume;
    // Un compresseur doux évite tout son trop fort quand plusieurs se superposent
    const compresseur = ctx.createDynamicsCompressor();
    compresseur.threshold.value = -18;
    compresseur.ratio.value = 4;
    volumeGeneral.connect(compresseur).connect(ctx.destination);

    busSons = ctx.createGain();
    busSons.gain.value = 0.9;
    busSons.connect(volumeGeneral);
    busAmbiance = ctx.createGain();
    busAmbiance.gain.value = 0.5;
    busAmbiance.connect(volumeGeneral);

    // Une seconde de « bruit blanc », réutilisée pour le vent, les feuilles, la mer…
    bufferBruit = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = bufferBruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function reglerVolume(v) {
  if (volumeGeneral) volumeGeneral.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
}

export const pret = () => !!ctx;
const maintenant = () => ctx.currentTime;

/* ---------- Briques de base ---------- */

/** Un oscillateur avec enveloppe : montée rapide puis extinction douce. */
function ton({ freq = 440, type = 'sine', debut = 0, duree = 0.5, volume = 0.3,
               attaque = 0.01, versFreq = null, sortie = busSons, detune = 0 }) {
  const t = maintenant() + debut;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = detune;
  if (versFreq) o.frequency.exponentialRampToValueAtTime(versFreq, t + duree);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(sortie);
  o.start(t);
  o.stop(t + duree + 0.05);
  return { o, g };
}

/** Un souffle de bruit filtré (feuilles, vent, clic de bois…). */
function souffle({ debut = 0, duree = 0.3, volume = 0.2, filtre = 'bandpass',
                   freq = 1500, q = 1, attaque = 0.02, sortie = busSons }) {
  const t = maintenant() + debut;
  const src = ctx.createBufferSource();
  src.buffer = bufferBruit;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filtre;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(f).connect(g).connect(sortie);
  src.start(t, Math.random());
  src.stop(t + duree + 0.05);
}

/** Une cloche douce (fondamentale + partiel « cloche »). */
function cloche(freq, debut = 0, volume = 0.25, duree = 1.4, sortie = busSons) {
  ton({ freq, debut, duree, volume, sortie });
  ton({ freq: freq * 2.76, debut, duree: duree * 0.35, volume: volume * 0.25, sortie });
  ton({ freq: freq * 2, type: 'triangle', debut, duree: duree * 0.6, volume: volume * 0.15, sortie });
}

/* ---------- Sons de jeu (réactions immédiates) ---------- */

export const sons = {
  /** Petit « plop » quand on touche quelque chose de vivant. */
  plop() {
    if (!ctx) return;
    ton({ freq: 380, versFreq: 760, duree: 0.16, volume: 0.22 });
  },

  /** Petit carillon quand on touche le décor. */
  etincelle() {
    if (!ctx) return;
    const notes = [1046, 1175, 1318, 1568, 1760];
    cloche(notes[Math.floor(Math.random() * notes.length)], 0, 0.06, 0.9);
  },

  /** Feuilles qui bruissent (buisson secoué). */
  bruissement() {
    if (!ctx) return;
    for (let i = 0; i < 4; i++) {
      souffle({ debut: i * 0.08 + Math.random() * 0.03, duree: 0.18, volume: 0.16,
                freq: 2500 + Math.random() * 1500, q: 0.8 });
    }
  },

  /** Clapotis dans l'eau. */
  ploc() {
    if (!ctx) return;
    ton({ freq: 900, versFreq: 300, duree: 0.18, volume: 0.18 });
    souffle({ debut: 0.02, duree: 0.25, volume: 0.07, freq: 1200, q: 0.6 });
  },

  /** Découverte : petit arpège montant, doux. */
  magie() {
    if (!ctx) return;
    [784, 988, 1175, 1568].forEach((f, i) => cloche(f, i * 0.09, 0.08, 1.2));
  },

  /** Entrée dans une zone : glissando ascendant léger. */
  entree() {
    if (!ctx) return;
    [523, 659, 784].forEach((f, i) => cloche(f, i * 0.12, 0.1, 1));
  },

  /** Endroit encore endormi : deux notes descendantes très douces. */
  dodo() {
    if (!ctx) return;
    ton({ freq: 520, duree: 0.6, volume: 0.12, attaque: 0.08 });
    ton({ freq: 390, debut: 0.35, duree: 0.9, volume: 0.1, attaque: 0.08 });
  },

  /** Petit rire / sautillement des amis du jardin. */
  hihi() {
    if (!ctx) return;
    [0, 0.11, 0.22].forEach((d, i) =>
      ton({ freq: 900 + i * 120, versFreq: 1200 + i * 120, debut: d, duree: 0.09, volume: 0.1, type: 'triangle' }));
  },

  /** Note de fleur (jardin musical) : une cloche à la fréquence donnée. */
  note(freq) {
    if (!ctx) return;
    cloche(freq, 0, 0.22, 1.6);
  },

  /** Champignons-tambours : 0 = grave, 1 = bois, 2 = grelot. */
  tambour(type) {
    if (!ctx) return;
    if (type === 0) {
      ton({ freq: 160, versFreq: 48, duree: 0.45, volume: 0.6 });
      souffle({ duree: 0.05, volume: 0.06, filtre: 'lowpass', freq: 800 });
    } else if (type === 1) {
      ton({ freq: 520, versFreq: 260, duree: 0.18, volume: 0.35, type: 'triangle' });
      souffle({ duree: 0.04, volume: 0.08, freq: 2500, q: 2 });
    } else {
      for (let i = 0; i < 3; i++) souffle({ debut: i * 0.045, duree: 0.07, volume: 0.12, filtre: 'highpass', freq: 6000 });
      ton({ freq: 2093, debut: 0, duree: 0.25, volume: 0.04 });
    }
  },

  /** Le coquillage commence à écouter / s'arrête. */
  coquillageDebut() {
    if (!ctx) return;
    ton({ freq: 330, versFreq: 660, duree: 0.5, volume: 0.15, attaque: 0.1 });
  },
  coquillageFin() {
    if (!ctx) return;
    ton({ freq: 660, versFreq: 330, duree: 0.5, volume: 0.15, attaque: 0.1 });
  },

  /** Pot de peinture : « splash » doux. */
  splash() {
    if (!ctx) return;
    souffle({ duree: 0.3, volume: 0.15, filtre: 'lowpass', freq: 1200 });
    ton({ freq: 500, versFreq: 200, duree: 0.25, volume: 0.15 });
  },

  /** Changement de morceau de créature : « pouf ». */
  pouf() {
    if (!ctx) return;
    souffle({ duree: 0.25, volume: 0.18, freq: 900, q: 0.7 });
    ton({ freq: 300, versFreq: 600, duree: 0.2, volume: 0.12 });
  },

  /** La créature prend vie : longue gerbe magique. */
  vie() {
    if (!ctx) return;
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => cloche(f, i * 0.1, 0.09, 1.4));
  },

  /** Pluie douce (gouttes). */
  pluie() {
    if (!ctx) return;
    for (let i = 0; i < 14; i++) ton({ freq: 1800 + Math.random() * 1600, versFreq: 900, debut: Math.random() * 1.6, duree: 0.06, volume: 0.05 });
    souffle({ duree: 1.8, volume: 0.05, filtre: 'highpass', freq: 3000, attaque: 0.3 });
  },

  /** Arc-en-ciel / lever de soleil : accord lumineux. */
  arcEnCiel() {
    if (!ctx) return;
    [523, 659, 784, 988, 1175, 1318, 1568].forEach((f, i) => cloche(f, i * 0.14, 0.07, 2));
  },

  /** Nuit qui tombe : notes graves et lentes. */
  nuit() {
    if (!ctx) return;
    [392, 330, 262].forEach((f, i) => cloche(f, i * 0.3, 0.08, 2));
  },

  /** Poney : hennissement doux (stylisé). */
  hennissement() {
    if (!ctx) return;
    const t = maintenant();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(700, t);
    o.frequency.linearRampToValueAtTime(900, t + 0.2);
    o.frequency.linearRampToValueAtTime(450, t + 0.9);
    const vib = ctx.createOscillator(); vib.frequency.value = 14;
    const vg = ctx.createGain(); vg.gain.value = 40;
    vib.connect(vg).connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    o.connect(f).connect(g).connect(busSons);
    o.start(t); vib.start(t); o.stop(t + 1.05); vib.stop(t + 1.05);
  },

  /** Poney : petit souffle des naseaux. */
  ebrouement() {
    if (!ctx) return;
    souffle({ duree: 0.5, volume: 0.2, filtre: 'lowpass', freq: 700, attaque: 0.05 });
    souffle({ debut: 0.1, duree: 0.3, volume: 0.1, freq: 300, q: 2 });
  },

  /** Sabots : cloc-cloc. */
  sabots(n = 4) {
    if (!ctx) return;
    for (let i = 0; i < n; i++) {
      ton({ freq: 700, versFreq: 350, debut: i * 0.22, duree: 0.06, volume: 0.2, type: 'triangle' });
      ton({ freq: 520, versFreq: 260, debut: i * 0.22 + 0.09, duree: 0.06, volume: 0.15, type: 'triangle' });
    }
  },

  /** Croque une carotte / pomme. */
  croque() {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) souffle({ debut: i * 0.18, duree: 0.08, volume: 0.25, freq: 2500, q: 1.5, attaque: 0.005 });
  },

  /** Brosse : frotti-frotta. */
  brosse() {
    if (!ctx) return;
    souffle({ duree: 0.18, volume: 0.08, filtre: 'highpass', freq: 2500 });
  },

  /** Train de la Cabane aux Mots : tchou-tchou ! */
  tchou() {
    if (!ctx) return;
    [0, 0.35].forEach((d) => { ton({ freq: 587, debut: d, duree: 0.3, volume: 0.1, type: 'triangle' }); ton({ freq: 740, debut: d, duree: 0.3, volume: 0.08, type: 'triangle' }); });
  },

  /** Lilo se réveille. */
  reveil() {
    if (!ctx) return;
    [392, 523, 659, 784, 1046].forEach((f, i) => cloche(f, i * 0.13, 0.09, 1.3));
  },
};

/* ---------- Cris d'animaux (stylisés, doux, jamais effrayants) ---------- */

export const cris = {
  hibou() {
    // « Hou… hou-ou » : deux notes rondes avec un léger vibrato
    [[0, 0.5], [0.75, 0.28], [1.08, 0.6]].forEach(([d, duree]) => {
      const { o } = ton({ freq: 410, versFreq: 360, debut: d, duree, volume: 0.32, attaque: 0.08 });
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 6; lg.gain.value = 6;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(maintenant() + d); lfo.stop(maintenant() + d + duree + 0.1);
    });
  },

  grenouille() {
    // « Croâ, croâ » : son rauque, haché très vite
    [0, 0.45].forEach((d) => {
      const t = maintenant() + d;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(140, t);
      o.frequency.linearRampToValueAtTime(110, t + 0.3);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3;
      const hache = ctx.createGain();
      hache.gain.value = 0;
      const lfo = ctx.createOscillator();
      lfo.type = 'square'; lfo.frequency.value = 28;
      const lg = ctx.createGain(); lg.gain.value = 0.5;
      lfo.connect(lg).connect(hache.gain);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(f).connect(hache).connect(g).connect(busSons);
      o.start(t); lfo.start(t); o.stop(t + 0.35); lfo.stop(t + 0.35);
    });
  },

  coucou() {
    // « Cou-cou » : deux notes, la seconde plus grave (tierce)
    [0, 0.9].forEach((d) => {
      ton({ freq: 720, debut: d, duree: 0.3, volume: 0.3, attaque: 0.03 });
      ton({ freq: 580, debut: d + 0.32, duree: 0.45, volume: 0.3, attaque: 0.03 });
    });
  },

  pic() {
    // « Toc-toc-toc » : rafale de petits coups de bois
    for (let i = 0; i < 9; i++) {
      const d = i * 0.065;
      ton({ freq: 1300, versFreq: 700, debut: d, duree: 0.05, volume: 0.25, type: 'triangle' });
      souffle({ debut: d, duree: 0.03, volume: 0.07, freq: 3000, q: 3 });
    }
  },

  abeille() {
    // « Bzzz » : bourdonnement qui arrive et repart
    const t = maintenant();
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 230;
    const vib = ctx.createOscillator(); vib.frequency.value = 9;
    const vg = ctx.createGain(); vg.gain.value = 12;
    vib.connect(vg).connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.4);
    g.gain.setValueAtTime(0.12, t + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(f).connect(g).connect(busSons);
    o.start(t); vib.start(t); o.stop(t + 1.7); vib.stop(t + 1.7);
  },

  sanglier() {
    // « Groin, groin » : trois petits grognements graves
    [0, 0.32, 0.64].forEach((d) => {
      ton({ freq: 95, versFreq: 70, debut: d, duree: 0.22, volume: 0.45, type: 'sawtooth', attaque: 0.03,
            sortie: filtreVers(500) });
      souffle({ debut: d, duree: 0.2, volume: 0.12, filtre: 'lowpass', freq: 600 });
    });
  },

  herisson() {
    // Petits reniflements + un minuscule couinement
    for (let i = 0; i < 5; i++) souffle({ debut: i * 0.16, duree: 0.08, volume: 0.16, filtre: 'highpass', freq: 3500 });
    ton({ freq: 1500, versFreq: 1900, debut: 0.9, duree: 0.15, volume: 0.1, type: 'triangle' });
  },
};

/* ---------- Cris des créatures de l'Atelier ---------- */
export const crisCreature = [
  // 0 « pouic » : petit couinement qui rebondit
  () => { [0, 0.18].forEach((d) => ton({ freq: 900, versFreq: 1600, debut: d, duree: 0.14, volume: 0.18, type: 'triangle' })); },
  // 1 « bloup » : bulles rondes et graves
  () => { [0, 0.2, 0.34].forEach((d, i) => ton({ freq: 260 - i * 30, versFreq: 520 - i * 40, debut: d, duree: 0.16, volume: 0.3 })); },
  // 2 « tralala » : petite mélodie chantée
  () => { [659, 784, 880, 784, 1046].forEach((f, i) => ton({ freq: f, debut: i * 0.12, duree: 0.16, volume: 0.15, type: 'triangle', attaque: 0.02 })); },
  // 3 « rrrou » : ronronnement doux
  () => {
    const t = maintenant();
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 95;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 22;
    const lg = ctx.createGain(); lg.gain.value = 0.12;
    lfo.connect(lg).connect(g.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1, t + 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(f).connect(g).connect(env).connect(busSons);
    o.start(t); lfo.start(t); o.stop(t + 1.2); lfo.stop(t + 1.2);
  },
];

/** Petit filtre passe-bas branché sur la sortie des sons (sert au sanglier). */
function filtreVers(freq) {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = freq;
  f.connect(busSons);
  return f;
}

/* ---------- Ambiances (une par lieu, en boucle, très douces) ---------- */

/** Fond de bruit filtré qui « respire » lentement (mer, vent…). */
function fondRespirant({ freq, q = 0.7, filtre = 'lowpass', volume = 0.05, vitesse = 0.1, ampleur = 0.6 }) {
  const src = ctx.createBufferSource();
  src.buffer = bufferBruit; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filtre; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0;
  const lfo = ctx.createOscillator(); lfo.frequency.value = vitesse;
  const lg = ctx.createGain(); lg.gain.value = volume * ampleur;
  const base = ctx.createConstantSource(); base.offset.value = volume;
  lfo.connect(lg).connect(g.gain);
  base.connect(g.gain);
  src.connect(f).connect(g).connect(busAmbiance);
  src.start(); lfo.start(); base.start();
  return () => { [src, lfo, base].forEach((n) => { try { n.stop(); } catch (e) {} }); };
}

/** Répète une action à intervalle aléatoire (chant d'oiseau lointain…). */
function deTempsEnTemps(min, max, action) {
  let id;
  const suivant = () => { id = setTimeout(() => { action(); suivant(); }, (min + Math.random() * (max - min)) * 1000); };
  suivant();
  return () => clearTimeout(id);
}

function oiseauLointain() {
  const base = 2200 + Math.random() * 1200;
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    ton({ freq: base, versFreq: base * 1.3, debut: i * 0.14, duree: 0.1, volume: 0.025, sortie: busAmbiance });
  }
}

const recettesAmbiance = {
  // Hub : la mer qui respire + quelques oiseaux
  ile() {
    const a = fondRespirant({ freq: 450, volume: 0.09, vitesse: 0.11 });
    const b = deTempsEnTemps(5, 12, oiseauLointain);
    return () => { a(); b(); };
  },
  // Forêt : vent dans les arbres + oiseaux lointains + grillons légers
  foret() {
    const a = fondRespirant({ freq: 800, filtre: 'bandpass', q: 0.5, volume: 0.05, vitesse: 0.07 });
    const b = deTempsEnTemps(4, 10, oiseauLointain);
    const c = deTempsEnTemps(7, 15, () => {
      for (let i = 0; i < 6; i++) ton({ freq: 4200, debut: i * 0.07, duree: 0.04, volume: 0.012, sortie: busAmbiance });
    });
    return () => { a(); b(); c(); };
  },
  // Jardin : brise légère + rares carillons très lointains
  jardin() {
    const a = fondRespirant({ freq: 1200, volume: 0.03, vitesse: 0.09 });
    const b = deTempsEnTemps(9, 18, () => {
      const f = [1568, 1760, 2093][Math.floor(Math.random() * 3)];
      cloche(f, 0, 0.02, 1.5, busAmbiance);
    });
    return () => { a(); b(); };
  },
  // Cabane aux Mots : intérieur calme, un oiseau dehors de temps en temps
  cabane() {
    const a = fondRespirant({ freq: 600, volume: 0.02, vitesse: 0.05 });
    const b = deTempsEnTemps(10, 20, oiseauLointain);
    return () => { a(); b(); };
  },
  // Atelier : petit ronron de machine douce + tintements
  atelier() {
    const a = fondRespirant({ freq: 300, volume: 0.04, vitesse: 0.2, ampleur: 0.3 });
    const b = deTempsEnTemps(6, 14, () => {
      const f = [1318, 1568, 1760][Math.floor(Math.random() * 3)];
      cloche(f, 0, 0.02, 1, busAmbiance);
      cloche(f * 1.5, 0.15, 0.015, 1, busAmbiance);
    });
    return () => { a(); b(); };
  },
  // Ciel : grand souffle aérien
  ciel() {
    const a = fondRespirant({ freq: 1500, filtre: 'bandpass', q: 0.3, volume: 0.04, vitesse: 0.05, ampleur: 0.8 });
    return a;
  },
  // Écuries : prairie, grillons et oiseaux
  ecuries() {
    const a = fondRespirant({ freq: 900, volume: 0.03, vitesse: 0.08 });
    const b = deTempsEnTemps(4, 9, oiseauLointain);
    const c = deTempsEnTemps(6, 12, () => {
      for (let i = 0; i < 8; i++) ton({ freq: 4400, debut: i * 0.06, duree: 0.035, volume: 0.01, sortie: busAmbiance });
    });
    return () => { a(); b(); c(); };
  },
  // Accueil : presque silence, un souffle de nuit
  nuit() {
    return fondRespirant({ freq: 350, volume: 0.04, vitesse: 0.06 });
  },
};

/** Change d'ambiance en fondu enchaîné. nom = null pour le silence. */
let nomAmbiance = null;
let arretAmbiance = null;
let jetonAmbiance = 0;
export function ambiance(nom) {
  if (!ctx || nomAmbiance === nom) return;
  nomAmbiance = nom;
  const jeton = ++jetonAmbiance;
  const ancienne = arretAmbiance;
  arretAmbiance = null;
  if (ancienne) {
    busAmbiance.gain.setTargetAtTime(0, maintenant(), 0.25);
    setTimeout(ancienne, 1150);
  }
  if (!nom || !recettesAmbiance[nom]) return;
  setTimeout(() => {
    if (jeton !== jetonAmbiance) return; // on a déjà changé de lieu entre-temps
    arretAmbiance = recettesAmbiance[nom]();
    busAmbiance.gain.setTargetAtTime(0.5, maintenant(), 0.8);
  }, ancienne ? 1200 : 0);
}
