/* ==========================================================================
   ecuries.js — Les Écuries de la Prairie (soin, empathie).

   Le poney a trois besoins (gardés sur la tablette) : faim, poussière, fatigue.
   Il montre une émotion simple dans une bulle : content ❤, a faim 🥕,
   tout poussiéreux, ou fatigué (zzz).
     - la brosse : la faire GLISSER sur le poney enlève la poussière ;
     - le panier : toucher = une carotte (ou une pomme) vole jusqu'à sa bouche ;
     - le panneau : une petite promenade (il revient un peu sale et fatigué) ;
     - la paille : une petite sieste.
   Rien ne se « perd » : le poney ne tombe jamais malade, il dit juste ce qu'il aimerait.
   ========================================================================== */

import * as audio from '../moteur/audio.js';
import * as voix from '../moteur/voix.js';
import { donnees, sauver, noter } from '../moteur/sauvegarde.js';
import { creerToile, el, auToucher, rebond, secouer, sautiller, etincelles, pointDansToile, attendre } from '../moteur/outils.js';
import { arbre, nuage, fleur } from '../dessins.js';

const PONEY = { x: 820, y: 520 };   // centre du corps
const BOUCHE = { x: PONEY.x - 222, y: PONEY.y - 122 };
const ROBE = '#ecc7a5', CRINIERE = '#c9b6e4', MUSEAU = '#f6e2cf', SABOT = '#8a6a50';

let actif = false;
let minuteries = [];

function dessinPoney() {
  return `
    <ellipse cx="0" cy="175" rx="190" ry="20" fill="#000" opacity=".08"/>
    <g class="queue anime">
      <path d="M140 -40 C210 -40 220 40 190 110 C175 60 165 20 135 0 Z" fill="${CRINIERE}"/>
    </g>
    <g class="pattes">
      ${[-100, -62, 62, 100].map((x) => `<rect x="${x - 17}" y="30" width="34" height="135" rx="16" fill="${x < 0 ? ROBE : '#e2b994'}"/><rect x="${x - 19}" y="145" width="38" height="26" rx="10" fill="${SABOT}"/>`).join('')}
    </g>
    <ellipse cx="0" cy="0" rx="155" ry="88" fill="${ROBE}"/>
    <ellipse cx="10" cy="30" rx="100" ry="45" fill="#f3d6bb" opacity=".7"/>
    <g class="poussiere"></g>
    <g class="tete-poney">
      <path d="M-95 -45 L-165 -150 L-110 -185 L-40 -55 Z" fill="${ROBE}"/>
      <g class="oreilles">
        <path d="M-140 -205 L-135 -255 L-110 -212 Z" fill="${ROBE}" stroke="${ROBE}" stroke-width="8" stroke-linejoin="round"/>
        <path d="M-115 -200 L-100 -245 L-88 -200 Z" fill="#e2b994" stroke="#e2b994" stroke-width="8" stroke-linejoin="round"/>
      </g>
      <ellipse cx="-165" cy="-165" rx="68" ry="52" fill="${ROBE}" transform="rotate(-18 -165 -165)"/>
      <ellipse cx="-212" cy="-130" rx="40" ry="32" fill="${MUSEAU}"/>
      <ellipse cx="-232" cy="-140" rx="5" ry="7" fill="#b08968"/>
      <g class="yeux-poney"></g>
      <path class="bouche-poney" d="" fill="none" stroke="#8a6a50" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="-180" cy="-150" rx="11" ry="7" fill="#f7a8a8" opacity=".6"/>
      <g fill="${CRINIERE}">
        <circle cx="-118" cy="-200" r="20"/><circle cx="-98" cy="-170" r="22"/><circle cx="-80" cy="-135" r="22"/>
        <circle cx="-62" cy="-100" r="20"/><circle cx="-48" cy="-68" r="18"/><circle cx="-142" cy="-212" r="14"/>
      </g>
    </g>
    <g class="bulle-humeur" transform="translate(-120 -330)"></g>`;
}

const HUMEURS = {
  content: { yeux: 'ouverts', bouche: 'M-232 -112 Q-218 -100 -200 -110', bulle: '<path d="M0 12 C-30 -10 -18 -36 0 -22 C18 -36 30 -10 0 12 Z" fill="#f28b82"/>' },
  faim: { yeux: 'ouverts', bouche: 'M-226 -110 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0', bulle: '<path d="M-22 22 L18 -18 Q28 -10 22 0 Z" fill="#f9a65a"/><path d="M18 -18 l10 -14 M18 -18 l16 -4" stroke="#8fc47e" stroke-width="6" stroke-linecap="round"/>' },
  sale: { yeux: 'ouverts', bouche: 'M-232 -108 Q-216 -114 -200 -108', bulle: '<circle cx="-12" cy="4" r="14" fill="#c9a37a"/><circle cx="10" cy="-6" r="12" fill="#b08968"/><circle cx="14" cy="14" r="9" fill="#c9a37a"/>' },
  fatigue: { yeux: 'mi-clos', bouche: 'M-226 -108 Q-216 -104 -206 -108', bulle: '<text x="-18" y="12" font-size="34" font-family="system-ui" fill="#7a8ac0">z</text><text x="6" y="-4" font-size="24" font-family="system-ui" fill="#7a8ac0">z</text>' },
  dort: { yeux: 'fermes', bouche: 'M-226 -108 Q-216 -104 -206 -108', bulle: '' },
};

export default {
  id: 'ecuries',
  ambiance: 'ecuries',
  avecLilo: true,
  avecMaison: true,

  entrer(conteneur) {
    actif = true;
    const svg = creerToile(conteneur, `
      <defs>
        <linearGradient id="ciel-prairie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#bfe4f5"/><stop offset="1" stop-color="#f4f1dc"/>
        </linearGradient>
      </defs>
      <rect class="fond" width="1600" height="900" fill="url(#ciel-prairie)"/>
      <g class="paysage">
        <g pointer-events="none"><g class="derive lente">${nuage(0, 120, 0.8)}</g></g>
        <path d="M-400 470 Q0 400 400 450 T1200 440 T2000 450 V900 H-400 Z" fill="#cfe8b8"/>
        ${arbre(1380, 470, 1.1)}${arbre(130, 460, 0.9, '#a6d48f', '#b5dca0')}
        <path d="M-400 600 Q400 560 800 590 T2000 580 V900 H-400 Z" fill="#b5dca0"/>
        <g stroke="#d9b58c" stroke-width="12" stroke-linecap="round">
          ${[-300, -100, 100, 300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900].map((x) => `<path d="M${x} 640 V560"/>`).join('')}
          <path d="M-300 580 H1900 M-300 615 H1900"/>
        </g>
        ${fleur(980, 860, 0.9, '#f4b6c2')}${fleur(1140, 870, 0.8, '#ffe08a')}${fleur(260, 880, 0.8, '#c9b6e4')}
      </g>
      <g class="paille"></g>
      <g class="poney-pos" transform="translate(${PONEY.x} ${PONEY.y})"><g class="poney"></g></g>
      <g class="outils"></g>
      <g class="vol" pointer-events="none"></g>
    `);

    const d = donnees();
    const p = d.poney;
    // Le temps passé hors des écuries : le poney a un peu faim (doucement)
    if (p.maj) {
      const heures = (Date.now() - p.maj) / 3.6e6;
      p.faim = Math.min(1, p.faim + heures * 0.15);
      p.fatigue = Math.max(0, p.fatigue - heures * 0.2);
    }
    p.maj = Date.now();

    const groupe = svg.querySelector('.poney');
    const pos = svg.querySelector('.poney-pos');
    groupe.innerHTML = dessinPoney();
    const yeux = groupe.querySelector('.yeux-poney');
    const bouche = groupe.querySelector('.bouche-poney');
    const bulle = groupe.querySelector('.bulle-humeur');
    const poussiere = groupe.querySelector('.poussiere');
    const queue = groupe.querySelector('.queue');
    let occupe = false;   // pendant la promenade ou la sieste
    let humeurActuelle = null;

    function humeur() {
      if (occupe === 'sieste') return 'dort';
      if (p.fatigue > 0.7) return 'fatigue';
      if (p.faim > 0.6) return 'faim';
      if (p.poussiere > 0.45) return 'sale';
      return 'content';
    }

    function majPoney() {
      const h = humeur();
      const H = HUMEURS[h];
      yeux.innerHTML = H.yeux === 'ouverts'
        ? `<g class="cligne anime"><circle cx="-162" cy="-180" r="10" fill="#4a3b35"/><circle cx="-159" cy="-184" r="3.5" fill="#fff"/></g>`
        : H.yeux === 'mi-clos'
          ? `<path d="M-174 -178 Q-162 -172 -150 -178" fill="none" stroke="#4a3b35" stroke-width="5" stroke-linecap="round"/><path d="M-172 -182 H-152" stroke="#4a3b35" stroke-width="3"/>`
          : `<path d="M-174 -180 Q-162 -172 -150 -180" fill="none" stroke="#4a3b35" stroke-width="5" stroke-linecap="round"/>`;
      bouche.setAttribute('d', H.bouche);
      bouche.setAttribute('fill', h === 'faim' ? '#c86b5e' : 'none');
      if (h !== humeurActuelle) {
        bulle.innerHTML = H.bulle ? `<g class="flotte"><circle r="46" fill="#fff" opacity=".92"/><circle cx="30" cy="48" r="10" fill="#fff" opacity=".92"/><circle cx="42" cy="68" r="6" fill="#fff" opacity=".92"/>${H.bulle}</g>` : '';
        humeurActuelle = h;
      }
      // Taches de poussière
      const n = Math.round(p.poussiere * 12);
      while (poussiere.childElementCount > n) poussiere.lastElementChild.remove();
      while (poussiere.childElementCount < n) {
        el('circle', { cx: -110 + Math.random() * 220, cy: -55 + Math.random() * 100, r: 9 + Math.random() * 12, fill: '#b08968', opacity: 0.45 }, poussiere);
      }
      queue.classList.toggle('balancer', h === 'content');
      p.maj = Date.now();
      sauver();
    }

    function direHumeur() {
      voix.dire({ content: 'ecuries_content', faim: 'ecuries_faim', sale: 'ecuries_sale', fatigue: 'ecuries_fatigue', dort: 'ecuries_dodo' }[humeur()], { consigne: true });
    }

    /* ----- Toucher le poney ----- */
    auToucher(pos, () => {
      if (occupe) return;
      if (humeur() === 'content') audio.sons.hennissement(); else audio.sons.ebrouement();
      sautiller(groupe, 16);
      if (!voix.parle()) direHumeur();
    });

    /* ----- Le panier : carottes et pommes ----- */
    const outils = svg.querySelector('.outils');
    const gp = el('g', { transform: 'translate(1290 760)' }, outils);
    const panier = el('g', { class: 'anime' }, gp, `
      <path d="M-50 -60 Q0 -130 50 -60" fill="none" stroke="#b08968" stroke-width="9"/>
      <path d="M-32 -46 L-6 -100 L6 -96 Z" fill="#f9a65a"/><path d="M-6 -100 l-4 -14 M-6 -100 l10 -10" stroke="#8fc47e" stroke-width="5" stroke-linecap="round"/>
      <circle cx="26" cy="-62" r="20" fill="#f28b82"/><path d="M26 -82 q2 -8 8 -10" stroke="#8a6a50" stroke-width="4" fill="none"/>
      <path d="M-75 -55 H75 L60 30 Q0 45 -60 30 Z" fill="#d9a877" stroke="#c49a74" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-68 -25 H68 M-64 5 H64" stroke="#c49a74" stroke-width="5"/>`);
    el('circle', { cx: 0, cy: -30, r: 90, fill: 'transparent' }, gp);
    let repas = 0;
    let premierRepas = true;
    auToucher(gp, async () => {
      if (occupe) return;
      rebond(panier);
      const pomme = repas++ % 2 === 1;
      const v = el('g', {}, svg.querySelector('.vol'), pomme
        ? `<circle r="26" fill="#f28b82"/><path d="M0 -26 q2 -10 10 -12" stroke="#8a6a50" stroke-width="5" fill="none"/>`
        : `<path d="M-14 26 L8 -36 L18 -30 Z" fill="#f9a65a" stroke="#f9a65a" stroke-width="6" stroke-linejoin="round"/><path d="M12 -34 l-4 -16 M12 -34 l12 -10" stroke="#8fc47e" stroke-width="6" stroke-linecap="round"/>`);
      await v.animate([
        { transform: 'translate(1290px, 700px) scale(1)' },
        { transform: `translate(${(1290 + BOUCHE.x) / 2}px, 380px) scale(1.2)` },
        { transform: `translate(${BOUCHE.x}px, ${BOUCHE.y}px) scale(.6)` },
      ], { duration: 900, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {});
      v.remove();
      if (!actif) return;
      audio.sons.croque();
      const tete = groupe.querySelector('.tete-poney');
      tete.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(8px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(8px)' }, { transform: 'translateY(0)' }], { duration: 600 });
      const avant = p.faim;
      p.faim = Math.max(0, p.faim - 0.35);
      noter('poney', { soin: 'repas' });
      majPoney();
      await attendre(700);
      if (!actif) return;
      if (avant <= 0.05) voix.dire('ecuries_plein');
      else if (premierRepas || p.faim === 0) { premierRepas = false; audio.sons.hennissement(); voix.dire('ecuries_miam'); }
    });

    /* ----- La brosse : à faire glisser sur le poney ----- */
    const BROSSE0 = { x: 1290, y: 330 };
    const gb = el('g', { transform: `translate(${BROSSE0.x} ${BROSSE0.y})` }, outils);
    const brosse = el('g', { class: 'anime' }, gb, `
      <rect x="-70" y="-26" width="140" height="52" rx="24" fill="#c9b6e4" stroke="#a88fcf" stroke-width="6"/>
      <path d="M-55 26 v26 M-35 26 v26 M-15 26 v26 M5 26 v26 M25 26 v26 M45 26 v26" stroke="#8a6a50" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-30" cy="-8" rx="16" ry="7" fill="#fff" opacity=".4"/>`);
    el('circle', { cx: 0, cy: 10, r: 80, fill: 'transparent' }, gb);
    gb.classList.add('touchable');
    let glisse = null;
    let dernierSon = 0;
    let deplacementTotal = 0;
    gb.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (occupe) return;
      try { gb.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
      glisse = { dernier: pointDansToile(svg, e) };
      deplacementTotal = 0;
      rebond(brosse, 1.1);
      audio.sons.plop();
    });
    gb.addEventListener('pointermove', (e) => {
      if (!glisse) return;
      const pt = pointDansToile(svg, e);
      gb.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      const dist = Math.hypot(pt.x - glisse.dernier.x, pt.y - glisse.dernier.y);
      glisse.dernier = pt;
      deplacementTotal += dist;
      // Sur le corps du poney ?
      const surPoney = Math.abs(pt.x - PONEY.x) < 175 && Math.abs(pt.y - PONEY.y) < 110;
      if (surPoney && dist > 4) {
        const t = performance.now();
        if (t - dernierSon > 160) { audio.sons.brosse(); dernierSon = t; }
        if (Math.random() < 0.25) etincelles(svg, pt.x, pt.y + 30, '#fff8ec', 3);
        const avant = p.poussiere;
        p.poussiere = Math.max(0, p.poussiere - dist / 2500);
        if (Math.round(avant * 12) !== Math.round(p.poussiere * 12)) majPoney();
        if (avant > 0.08 && p.poussiere <= 0.08) {
          p.poussiere = 0;
          majPoney();
          audio.sons.hennissement();
          etincelles(svg, PONEY.x, PONEY.y - 40, '#ffe08a', 14);
          noter('poney', { soin: 'brosse' });
          voix.dire('ecuries_propre');
        }
      }
    });
    const lacherBrosse = () => {
      if (!glisse) return;
      glisse = null;
      if (deplacementTotal < 20) voix.dire('ecuries_brosse_aide');
      gb.animate([{ transform: gb.getAttribute('transform').replace(/translate\(([-\d.]+) ([-\d.]+)\)/, 'translate($1px, $2px)') },
                  { transform: `translate(${BROSSE0.x}px, ${BROSSE0.y}px)` }], { duration: 400, easing: 'ease-out' });
      gb.setAttribute('transform', `translate(${BROSSE0.x} ${BROSSE0.y})`);
    };
    gb.addEventListener('pointerup', lacherBrosse);
    gb.addEventListener('pointercancel', lacherBrosse);

    /* ----- Le panneau « promenade » ----- */
    const gs = el('g', { transform: 'translate(1290 560)' }, outils);
    const panneau = el('g', { class: 'anime' }, gs, `
      <rect x="-8" y="-20" width="16" height="110" rx="6" fill="#b08968"/>
      <path d="M-70 -70 H50 L80 -40 L50 -10 H-70 Z" fill="#f6e2cf" stroke="#c49a74" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-50 -40 q10 -14 20 0 t20 0 t20 0" fill="none" stroke="#8fc47e" stroke-width="6" stroke-linecap="round"/>
      <circle cx="40" cy="-40" r="7" fill="#b08968"/>`);
    el('circle', { cx: 0, cy: -20, r: 85, fill: 'transparent' }, gs);
    auToucher(gs, async () => {
      if (occupe) return;
      rebond(panneau);
      if (p.fatigue > 0.7) { voix.dire('ecuries_fatigue', { consigne: true }); return; }
      occupe = 'promenade';
      await voix.dire('ecuries_promenade');
      if (!actif) return;
      audio.sons.hennissement();
      const paysage = svg.querySelector('.paysage');
      // Le poney trotte (il sautille), le paysage défile
      groupe.classList.add('danse');
      const sabots = setInterval(() => audio.sons.sabots(4), 900);
      minuteries.push(sabots);
      audio.sons.sabots(4);
      await paysage.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-380px)' }, { transform: 'translateX(0)' }],
        { duration: 5000, easing: 'ease-in-out' }).finished.catch(() => {});
      clearInterval(sabots);
      groupe.classList.remove('danse');
      if (!actif) return;
      p.fatigue = Math.min(1, p.fatigue + 0.35);
      p.poussiere = Math.min(1, p.poussiere + 0.45);
      p.faim = Math.min(1, p.faim + 0.2);
      occupe = false;
      noter('poney', { soin: 'promenade' });
      majPoney();
      audio.sons.ebrouement();
      voix.dire('ecuries_retour');
    });

    /* ----- La paille : la sieste ----- */
    const gpa = el('g', { transform: 'translate(440 780)' }, svg.querySelector('.paille'));
    const paille = el('g', { class: 'anime' }, gpa, `
      <ellipse cx="0" cy="20" rx="130" ry="40" fill="#f2d27a"/>
      <path d="M-110 10 l40 -24 M-80 20 l50 -30 M-40 25 l30 -40 M0 20 l40 -34 M40 25 l50 -30 M80 15 l30 -20 M-60 -5 l20 30 M20 -8 l20 30" stroke="#e2b94f" stroke-width="5" stroke-linecap="round"/>`);
    el('ellipse', { cx: 0, cy: 10, rx: 140, ry: 70, fill: 'transparent' }, gpa);
    auToucher(gpa, async () => {
      if (occupe) return;
      rebond(paille);
      if (p.fatigue < 0.4) { voix.dire('ecuries_pas_sommeil'); sautiller(groupe, 20); audio.sons.hennissement(); return; }
      occupe = 'sieste';
      majPoney();
      audio.sons.nuit();
      const pattes = groupe.querySelector('.pattes');
      pattes.style.transformBox = 'fill-box';
      pattes.style.transformOrigin = '50% 0%';
      pattes.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.35)' }], { duration: 900, fill: 'forwards' });
      pos.animate([{ transform: `translate(${PONEY.x}px, ${PONEY.y}px)` }, { transform: `translate(${PONEY.x}px, ${PONEY.y + 85}px)` }], { duration: 900, fill: 'forwards' });
      bulle.innerHTML = `<g pointer-events="none"><text class="zzz" x="0" y="0" font-size="44" fill="#7a8ac0" font-family="system-ui">z</text><text class="zzz" style="animation-delay:-1.2s" x="24" y="-26" font-size="32" fill="#7a8ac0" font-family="system-ui">z</text></g>`;
      humeurActuelle = 'dort';
      await voix.dire('ecuries_dodo');
      await attendre(5000);
      if (!actif) return;
      pattes.animate([{ transform: 'scaleY(.35)' }, { transform: 'scaleY(1)' }], { duration: 700, fill: 'forwards' });
      pos.animate([{ transform: `translate(${PONEY.x}px, ${PONEY.y + 85}px)` }, { transform: `translate(${PONEY.x}px, ${PONEY.y}px)` }], { duration: 700, fill: 'forwards' });
      p.fatigue = 0;
      occupe = false;
      noter('poney', { soin: 'sieste' });
      majPoney();
      audio.sons.hennissement();
      voix.dire('ecuries_reveil');
    });

    // Le temps passe doucement pendant qu'on joue
    minuteries.push(setInterval(() => {
      if (occupe) return;
      p.faim = Math.min(1, p.faim + 0.04);
      p.fatigue = Math.min(1, p.fatigue + 0.02);
      const avant = humeurActuelle;
      majPoney();
      if (humeurActuelle !== avant && humeurActuelle !== 'content' && !voix.parle()) direHumeur();
    }, 30000));

    majPoney();
    minuteries.push(setTimeout(async () => {
      await voix.dire('ecuries_intro', { consigne: true });
      if (actif && humeur() !== 'content') { await attendre(600); if (actif) direHumeur(); }
    }, 900));
  },

  quitter() {
    actif = false;
    minuteries.forEach((m) => { clearTimeout(m); clearInterval(m); });
    minuteries = [];
  },
};
