/* ==========================================================================
   AIRSENSE - LÓGICA DE LA PÁGINA DE INICIO (visor.html)
   ==========================================================================
   Gestiona:
   1. Carrusel de imágenes y texto de la sección de inicio.
   2. Resaltado de la navegación principal al hacer scroll (estable y confiable).
========================================================================== */

/* ==========================================================================
   1. CARRUSEL DE INICIO
========================================================================== */
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const textElement = document.getElementById('slide-text');

const texts = [
  "¿Sabías que en Colombia mueren más de 17.000 personas cada año por culpa del aire que respiran?",
  "Monitorea la calidad del aire en el Valle del Cauca y aprende sobre los contaminantes.",
  "Explora las estaciones y descubre cómo mejorar la calidad del aire que respiras."
];

let current = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
    dots[i].setAttribute('aria-selected', i === index);
  });
  textElement.textContent = texts[index];
}

function nextSlide() {
  current = (current + 1) % slides.length;
  showSlide(current);
}

function prevSlide() {
  current = (current - 1 + slides.length) % slides.length;
  showSlide(current);
}

document.getElementById('next').addEventListener('click', nextSlide);
document.getElementById('prev').addEventListener('click', prevSlide);

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    current = i;
    showSlide(i);
  });
});

setInterval(nextSlide, 6000);
showSlide(current);

/* ==========================================================================
   AIRSENSE - NAVEGACIÓN ACTIVA 
========================================================================== */

/* seleccionar únicamente el nav principal y solo anchors con hash
   Evita recoger enlaces del footer u otros enlaces externos.
   Ajusta '#main-nav' si tu elemento nav tiene otro id/clase.
*/
const mainNav = document.querySelector('.nav') || document.getElementById('main-nav');
const navLinks = mainNav
  ? Array.from(mainNav.querySelectorAll('a[href^="#"]'))
  : Array.from(document.querySelectorAll('.nav a[href^="#"]'));

const sections = navLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

// helper: marca el link activo (no repinta si no cambia)
function setActiveLink(id) {
  navLinks.forEach(link => {
    const isActive = link.getAttribute('href') === "#" + id;
    if (isActive) {
      if (!link.classList.contains('nav-active')) {
        link.classList.add('nav-active');
        link.setAttribute('aria-current', 'page');
      }
    } else {
      if (link.classList.contains('nav-active')) {
        link.classList.remove('nav-active');
        link.removeAttribute('aria-current');
      }
    }
  });
}

/* ---- scroll programático control (clicks) ---- */
let isProgrammatic = false;
let programmaticTimer = null;
const PROGRAMMATIC_LOCK_MS = 700;

function cancelProgrammaticLock() {
  isProgrammatic = false;
  if (programmaticTimer) {
    clearTimeout(programmaticTimer);
    programmaticTimer = null;
  }
}

/* click en menú: marcar ya y hacer scroll suave */
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetSelector = link.getAttribute('href');
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const id = target.id || targetSelector.replace('#','');
    setActiveLink(id);

    // bloquear lógica automática durante el scroll suave
    isProgrammatic = true;
    if (programmaticTimer) clearTimeout(programmaticTimer);
    programmaticTimer = setTimeout(() => {
      isProgrammatic = false;
      programmaticTimer = null;
      updateActiveFromObserverOrTop();
    }, PROGRAMMATIC_LOCK_MS);

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* cancelar bloqueo si el usuario interrumpe */
['wheel','touchstart','keydown','mousedown'].forEach(ev =>
  window.addEventListener(ev, () => {
    if (isProgrammatic) {
      cancelProgrammaticLock();
      updateActiveFromObserverOrTop();
    }
  }, { passive: true })
);

/* ---- IntersectionObserver + mapa ---- */
const ratioMap = new Map();
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => ratioMap.set(entry.target, entry.intersectionRatio));
  if (!isProgrammatic) updateActiveFromObserverOrTop();
}, { threshold: [0,0.1,0.25,0.5,0.75,1] });

sections.forEach(sec => io.observe(sec));

function getSectionByMaxRatio(minRatio = 0.25) {
  let best = null;
  let bestRatio = minRatio;
  for (const [sec, ratio] of ratioMap.entries()) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = sec;
    }
  }
  return best;
}

function getTopSection(triggerPercent = 0.1) {
  const trigger = window.innerHeight * triggerPercent;
  let current = sections[0];
  for (const sec of sections) {
    const r = sec.getBoundingClientRect();
    if (r.top <= trigger + 1) current = sec;
    else break;
  }
  return current;
}

function updateActiveFromObserverOrTop() {
  // prioridad al mapa SOLO si está al menos 25% visible
  const mapa = document.querySelector('#mapa');
  if (mapa) {
    const r = mapa.getBoundingClientRect();
    const visibleMapa = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    const visibleRatio = r.height > 0 ? (visibleMapa / r.height) : 0;
    if (visibleRatio >= 0.25) {
      setActiveLink('mapa');
      return;
    }
  }

  // 1) por intersectionRatio
  const byRatio = getSectionByMaxRatio(0.25);
  if (byRatio) {
    setActiveLink(byRatio.id);
    return;
  }

  // 2) fallback top-based
  const topSec = getTopSection(0.1);
  if (topSec) setActiveLink(topSec.id);
}

/* eventos de scroll/resize */
let scrollUpdateTimer = null;
function onScrollOrResize() {
  if (isProgrammatic) {
    if (programmaticTimer) clearTimeout(programmaticTimer);
    programmaticTimer = setTimeout(() => {
      isProgrammatic = false;
      programmaticTimer = null;
      updateActiveFromObserverOrTop();
    }, PROGRAMMATIC_LOCK_MS);
    return;
  }
  if (scrollUpdateTimer) clearTimeout(scrollUpdateTimer);
  scrollUpdateTimer = setTimeout(() => {
    updateActiveFromObserverOrTop();
    scrollUpdateTimer = null;
  }, 80);
}
window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);

/* ---- INICIALIZACIÓN: forzar inicio en inicio (o hash si existe) ---- */
document.addEventListener('DOMContentLoaded', () => {
  ratioMap.clear();
  // si hay hash en URL y existe la sección: marcarla
  if (location.hash) {
    const h = location.hash.replace('#','');
    if (document.getElementById(h)) {
      setActiveLink(h);
      // dejar que el observer actualice luego
      setTimeout(updateActiveFromObserverOrTop, 200);
      return;
    }
  }

  // Preferir 'inicio' si existe; sino primera sección
  if (document.getElementById('inicio')) {
    setActiveLink('inicio');
  } else if (sections.length) {
    setActiveLink(sections[0].id);
  }

  // forzar algunos rechecks tras layout y carga de recursos
  setTimeout(updateActiveFromObserverOrTop, 120);
  setTimeout(updateActiveFromObserverOrTop, 700);
});

/* Prioridad especial para iframe #mapa (si puedes observarlo) */
const iframeMapa = document.getElementById('iframe-mapa');
if (iframeMapa) {
  iframeMapa.addEventListener('load', () => {
    try {
      const ibody = iframeMapa.contentDocument.body;
      const obs = new IntersectionObserver(entries => {
        if (entries[0] && entries[0].isIntersecting) setActiveLink('mapa');
        else updateActiveFromObserverOrTop();
      }, { threshold: 0.25 });
      obs.observe(ibody);
    } catch (err) {
      console.warn('No se puede observar iframe por CORS; fallback activado.');
    }
  });
}

