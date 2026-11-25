/* ==========================================================================
   sw.js — « service worker » : garde une copie du jeu sur la tablette
   pour qu'il marche sans Internet.

   ⚠️ À chaque nouvelle version du jeu, augmenter le numéro de VERSION
   (sinon la tablette garde l'ancienne copie).
   ========================================================================== */

const VERSION = 'ile-v5';

const FICHIERS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './img/icone.svg',
  './img/icone-192.png',
  './img/icone-512.png',
  './js/main.js',
  './js/repliques.js',
  './js/dessins.js',
  './js/moteur/audio.js',
  './js/moteur/voix.js',
  './js/moteur/lilo.js',
  './js/moteur/outils.js',
  './js/moteur/scenes.js',
  './js/moteur/sauvegarde.js',
  './js/zones/accueil.js',
  './js/zones/hub.js',
  './js/zones/foret.js',
  './js/zones/jardin.js',
  './js/zones/dodo.js',
  './js/zones/cabane.js',
  './js/zones/atelier.js',
  './js/zones/ciel.js',
  './js/zones/ecuries.js',
  './js/parent.js',
  './js/lecture.js',
  './js/repliques-lecture.js',
  './js/dessins-mots.js',
  './js/creatures.js',
  './js/moteur/seance.js',
  './polices/Andika-Bold.ttf',
  './voix/index.json',
];

// Installation : on met tout le jeu de côté, y compris toutes les voix de Lilo
// (la liste des fichiers de voix est lue dans voix/index.json)
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(FICHIERS);
    try {
      const index = await (await fetch('./voix/index.json', { cache: 'no-store' })).json();
      const voix = [...new Set(Object.values(index.fichiers || {}))].map((f) => `./voix/${f}`);
      await cache.addAll(voix);
    } catch (err) { /* pas de voix : la synthèse prendra le relais */ }
    await self.skipWaiting();
  })());
});

// Activation : on jette les anciennes versions
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

// Chaque demande : d'abord la copie locale ; sinon Internet (et on garde une copie,
// utile pour les enregistrements de voix du dossier /voix).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((copie) => copie || fetch(e.request).then((rep) => {
      if (rep.status === 200 && new URL(e.request.url).origin === location.origin) {
        const clone = rep.clone();
        caches.open(VERSION).then((c) => c.put(e.request, clone));
      }
      return rep;
    })));
});
