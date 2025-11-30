/* ==========================================================================
   AIRSENSE - LÓGICA DE LA PÁGINA DE INICIO (VISOR.HTML)
   ==========================================================================
   Gestiona:
   1. El carrusel de imágenes y texto de la sección de inicio.
   2. El resaltado de la navegación principal al hacer scroll (Intersection Observer).
   ========================================================================== */

// ==========================================================================
// MÓDULO: CARRUSEL DE INICIO
// ==========================================================================
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const textElement = document.getElementById('slide-text');

const texts = [
  "¿Sabías que en Colombia mueren más de 17.000 personas cada año por culpa del aire que respiran?",
  "Monitorea la calidad del aire en el Valle del Cauca y aprende sobre los contaminantes.",
  "Explora las estaciones y descubre cómo mejorar la calidad del aire que respiras."
];

let current = 0;

/**
 * Muestra un slide específico basado en su índice.
 * @param {number} index - El índice (0, 1, 2) del slide a mostrar.
 */
function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
    dots[i].setAttribute('aria-selected', i === index);
  });
  textElement.textContent = texts[index];
  
}

// Avanza al siguiente slide, volviendo al primero si llega al final.
function nextSlide() {
  current = (current + 1) % slides.length;
  showSlide(current);
}

// Retrocede al slide anterior, yendo al último si estaba en el primero.
function prevSlide() {
  current = (current - 1 + slides.length) % slides.length;
  showSlide(current);
}

// --- Listeners del Carrusel ---
document.getElementById('next').addEventListener('click', nextSlide);
document.getElementById('prev').addEventListener('click', prevSlide);

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    current = i;
    showSlide(i);
  });
});

setInterval(nextSlide, 6000); // cambia cada 6 segundos
// Mostrar la primera diapositiva al cargar la página
showSlide(current);

/* =====================================================
    MÓDULO: NAVEGACIÓN ACTIVA POR SCROLL
====================================================== */

// == Helpers ==
const navLinks = document.querySelectorAll('.nav a');
let userClicked = false;
let clickTimeout = null;

function activateLink(link) {
  navLinks.forEach(l => {
    l.classList.remove('nav-active');
    l.removeAttribute('aria-current');
  });
  if (!link) return;
  link.classList.add('nav-active');
  link.setAttribute('aria-current', 'page');
}

// == CLICKS ==
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    userClicked = true;
    clearTimeout(clickTimeout);

    activateLink(e.currentTarget);

    clickTimeout = setTimeout(() => {
      userClicked = false;
    }, 1500);
  });
});

// == IntersectionObserver robusto ==
const sections = Array.from(navLinks)
  .map(link => document.getElementById(link.getAttribute('href').substring(1)))
  .filter(Boolean);

const ratios = new Map();

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: buildThresholdList()
};

function buildThresholdList() {
  let thresholds = [];
  for (let i = 0; i <= 100; i++) thresholds.push(i/100);
  return thresholds;
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    ratios.set(entry.target.id, entry.intersectionRatio);
  });

  if (userClicked) return;

  let best = null;
  let bestRatio = 0;

  for (let [id, ratio] of ratios.entries()) {
    if (ratio > bestRatio) {
      best = id;
      bestRatio = ratio;
    }
  }

  if (best && bestRatio > 0.12) {
    const chosenLink = document.querySelector(`.nav a[href="#${best}"]`);
    activateLink(chosenLink);
  }

}, observerOptions);

sections.forEach(s => {
  ratios.set(s.id, 0);
  observer.observe(s);
});

// == Fallback por scroll ==
let lastScrollTime = 0;
window.addEventListener('scroll', () => {
  lastScrollTime = Date.now();
});

setInterval(() => {
  if (userClicked) return;

  const now = Date.now();
  if (now - lastScrollTime > 80) {
    const viewportCenter = window.scrollY + (window.innerHeight / 2);

    let nearest = null;
    let minDist = Infinity;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const center = top + height/2;
      const dist = Math.abs(center - viewportCenter);

      if (dist < minDist) {
        minDist = dist;
        nearest = section;
      }
    });

    if (nearest) {
      const link = document.querySelector(`.nav a[href="#${nearest.id}"]`);
      activateLink(link);
    }
  }
}, 200);