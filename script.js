/* =========================================================
   Para Nirvana — script
   ========================================================= */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const scene = $('scene');
  const seed = $('seed');
  const letterBtn = $('letterBtn');
  const letter = $('letter');
  const closeBtn = $('closeLetter');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ⏱️ Tiempos de la animación (milisegundos desde que se toca la semilla) */
  const BLOOM_AT = 2700;  // cuando el tallo llega arriba y empieza a abrirse
  const DONE_AT = 7600;   // cuando termina de abrirse y aparece su nombre + la carta

  /* ---------- Aleatorio con semilla (siempre se ve igual) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(2109);
  const between = (min, max) => min + rand() * (max - min);

  /* ---------- Estrellas ---------- */
  function makeStars() {
    const box = $('stars');
    const count = window.innerWidth < 600 ? 55 : 110;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      const size = between(1, 2.6).toFixed(1);
      s.style.cssText =
        `left:${between(0, 100).toFixed(1)}%;top:${between(0, 58).toFixed(1)}%;` +
        `width:${size}px;height:${size}px;` +
        `--tw:${between(2.5, 6).toFixed(1)}s;--td:${between(0, 6).toFixed(1)}s`;
      frag.appendChild(s);
    }
    box.appendChild(frag);
  }

  /* ---------- Luciérnagas ---------- */
  function makeFlies() {
    const box = $('flies');
    const count = window.innerWidth < 600 ? 16 : 26;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const f = document.createElement('i');
      f.style.cssText =
        `left:${between(2, 98).toFixed(1)}%;top:${between(30, 92).toFixed(1)}%;` +
        `--dx:${between(-60, 60).toFixed(0)}px;--dy:${between(-90, 40).toFixed(0)}px;` +
        `--dur:${between(7, 14).toFixed(1)}s;--blink:${between(3, 6).toFixed(1)}s;` +
        `--delay:-${between(0, 10).toFixed(1)}s`;
      frag.appendChild(f);
    }
    box.appendChild(frag);
  }

  /* ---------- La flor ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  const SEPAL = 'M0 -12 C -9 -24 -10 -42 0 -54 C 10 -42 9 -24 0 -12 Z';
  const OUTER = 'M0 -12 C -24 -38 -27 -86 0 -112 C 27 -86 24 -38 0 -12 Z';
  const INNER = 'M0 -10 C -18 -32 -21 -68 0 -92 C 21 -68 18 -32 0 -10 Z';

  function makePetal(parent, d, crease, fill, angle, sx, sy, delay) {
    const wrap = svgEl('g', { transform: `rotate(${angle.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})` });
    const petal = svgEl('g', { class: 'petal' });
    petal.style.setProperty('--d', `${delay.toFixed(2)}s`);
    petal.appendChild(svgEl('path', { d, fill }));
    petal.appendChild(svgEl('path', {
      d: crease, fill: 'none', stroke: '#b86a00',
      'stroke-opacity': '.22', 'stroke-width': '1.4', 'stroke-linecap': 'round'
    }));
    wrap.appendChild(petal);
    parent.appendChild(wrap);
  }

  function buildFlower() {
    const sepals = $('sepals');
    const outer = $('petalsOuter');
    const inner = $('petalsInner');
    const seeds = $('seeds');

    // Sépalos verdes por detrás
    const SEPALS = 14;
    for (let i = 0; i < SEPALS; i++) {
      sepals.appendChild(svgEl('path', {
        d: SEPAL, fill: '#2f8a5c',
        transform: `rotate(${(i * (360 / SEPALS) + 6).toFixed(2)})`
      }));
    }

    // Pétalos exteriores (se abren primero, en espiral)
    const N = 18;
    for (let i = 0; i < N; i++) {
      makePetal(
        outer, OUTER, 'M0 -24 L0 -94', 'url(#petalOuter)',
        i * (360 / N) + between(-3, 3),
        between(.92, 1.08), between(.93, 1.07),
        i * 0.09
      );
    }

    // Pétalos interiores (desfasados media vuelta)
    for (let i = 0; i < N; i++) {
      makePetal(
        inner, INNER, 'M0 -22 L0 -76', 'url(#petalInner)',
        i * (360 / N) + 10 + between(-3, 3),
        between(.92, 1.08), between(.93, 1.07),
        0.5 + i * 0.09
      );
    }

    // Semillas del centro (espiral áurea, como en un girasol)
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    for (let i = 1; i <= 110; i++) {
      const r = 3.45 * Math.sqrt(i);
      const t = i * GOLDEN;
      seeds.appendChild(svgEl('circle', {
        cx: (r * Math.cos(t)).toFixed(2),
        cy: (r * Math.sin(t)).toFixed(2),
        r: (0.9 + (r / 36) * 1.4).toFixed(2),
        fill: '#ffcf6b',
        opacity: (0.25 + (r / 36) * 0.4).toFixed(2)
      }));
    }
  }

  /* ---------- Secuencia ---------- */
  function start() {
    if (scene.classList.contains('grow')) return;
    scene.classList.add('grow');
    seed.disabled = true;

    const bloomAt = reduceMotion ? 0 : BLOOM_AT;
    const doneAt = reduceMotion ? 50 : DONE_AT;

    setTimeout(() => scene.classList.add('bloom'), bloomAt);
    setTimeout(() => {
      scene.classList.add('done');
      const a = document.activeElement;
      if (!a || a === document.body || a === seed) {
        letterBtn.focus({ preventScroll: true });
      }
    }, doneAt);
  }

  /* ---------- Carta ---------- */
  function setupLetter() {
    document.querySelectorAll('.paper .line').forEach((el, i) => {
      el.style.setProperty('--i', i);
    });

    letterBtn.addEventListener('click', () => {
      letter.showModal();
      letter.querySelector('.paper').scrollTop = 0;
    });
    closeBtn.addEventListener('click', () => letter.close());

    // Cerrar al tocar fuera de la carta
    letter.addEventListener('click', (e) => {
      if (e.target === letter) letter.close();
    });
  }

  /* ---------- Inicio ---------- */
  makeStars();
  makeFlies();
  buildFlower();
  setupLetter();

  seed.addEventListener('click', start);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => scene.classList.add('ready'));
  });
})();
