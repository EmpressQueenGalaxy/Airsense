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

/* =========================
   NAVEGACIÓN ACTIVA - VERSIÓN ESTABLE
   Reemplaza la lógica anterior de navegación por esta.
   ========================= */

// Buscar el nav principal (ajusta el selector si tu nav tiene otro id/clase)
const mainNav = document.querySelector('.nav') || document.querySelector('nav[role="navigation"]');
const navLinks = mainNav ? Array.from(mainNav.querySelectorAll('a[href^="#"]')) : Array.from(document.querySelectorAll('.nav a[href^="#"]'));

// Mapear secciones asociadas a esos links
const sections = navLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

// Helper para marcar link activo
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

// CONTROL SCROLL PROGRAMÁTICO (clicks)
let isProgrammatic = false;
let programmaticTimer = null;
const PROGRAMMATIC_LOCK_MS = 700;

function clearProgrammaticLock() {
  isProgrammatic = false;
  if (programmaticTimer) {
    clearTimeout(programmaticTimer);
    programmaticTimer = null;
  }
}

// Click en enlaces del nav: marcar ya y hacer scroll suave
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const selector = link.getAttribute('href');
    const target = document.querySelector(selector);
    if (!target) return;

    const id = (target.id || selector.replace('#',''));
    setActiveLink(id);

    // bloquear hasta que termine scroll suave
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

// Si el usuario interrumpe el scroll (wheel/touch/keydown/mousedown), cancelar bloqueo
['wheel','touchstart','keydown','mousedown'].forEach(ev =>
  window.addEventListener(ev, () => {
    if (isProgrammatic) {
      clearProgrammaticLock();
      updateActiveFromObserverOrTop();
    }
  }, { passive: true })
);

/* INTERSECTIONOBSERVER + fallback por rects */
const ratioMap = new Map();
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => ratioMap.set(entry.target, entry.intersectionRatio));
  if (!isProgrammatic) updateActiveFromObserverOrTop();
}, { threshold: [0,0.1,0.25,0.5,0.75,1] });

sections.forEach(sec => io.observe(sec));

// Elegir sección por mayor ratio
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

// Fallback: sección cuyo top esté más arriba (10% desde top)
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

// Actualización final: prioridad a mapa solo si visibleRatio >= 0.25
function updateActiveFromObserverOrTop() {
  const mapa = document.querySelector('#mapa');
  if (mapa) {
    const r = mapa.getBoundingClientRect();
    const visibleMapa = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    const visibleRatio = (r.height > 0) ? (visibleMapa / r.height) : 0;
    if (visibleRatio >= 0.25) {
      setActiveLink('mapa');
      return;
    }
  }

  const byRatio = getSectionByMaxRatio(0.25);
  if (byRatio) { setActiveLink(byRatio.id); return; }

  const topSec = getTopSection(0.1);
  if (topSec) setActiveLink(topSec.id);
}

/* Scroll / resize handling con debounce ligero */
let scrollTimer = null;
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
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    updateActiveFromObserverOrTop();
    scrollTimer = null;
  }, 80);
}
window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);

/* INICIALIZACIÓN: usar hash si existe, sino preferir 'inicio' */
document.addEventListener('DOMContentLoaded', () => {
  ratioMap.clear();
  if (location.hash) {
    const h = location.hash.replace('#','');
    if (document.getElementById(h)) {
      setActiveLink(h);
      setTimeout(updateActiveFromObserverOrTop, 200);
      return;
    }
  }
  if (document.getElementById('inicio')) setActiveLink('inicio');
  else if (sections.length) setActiveLink(sections[0].id);

  setTimeout(updateActiveFromObserverOrTop, 120);
  setTimeout(updateActiveFromObserverOrTop, 700);
});

/* PRIORIDAD ESPECIAL: observar iframe #mapa si se puede */
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
      console.warn('No se puede observar iframe por CORS; fallback usado.');
    }
  });
}

