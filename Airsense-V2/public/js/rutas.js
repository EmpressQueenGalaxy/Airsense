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

const navLinks = document.querySelectorAll('.nav a');
const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveLink(id) {
  navLinks.forEach(link => {
    const isActive = link.getAttribute("href") === "#" + id;
    link.classList.toggle('nav-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : '');
  });
}

// Scroll suave
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Función para calcular la sección más visible (fallback)
function getMostVisibleSection() {
  const triggerPos = window.innerHeight * 0.5; // mitad de pantalla
  let current = sections[0].id;
  let maxVisible = 0;

  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (visibleHeight > maxVisible) {
      maxVisible = visibleHeight;
      current = sec.id;
    }
  });

  // Prioridad al mapa
  const mapaSection = document.querySelector("#mapa");
  if (mapaSection) {
    const rectMapa = mapaSection.getBoundingClientRect();
    const visibleMapa = Math.min(rectMapa.bottom, window.innerHeight) - Math.max(rectMapa.top, 0);
    if (visibleMapa > maxVisible) {
      current = "mapa";
    }
  }

  return current;
}

// Actualizar sección activa
function updateActive() {
  const id = getMostVisibleSection();
  setActiveLink(id);
}

// Observador de secciones (para cambios de visibilidad real)
const observer = new IntersectionObserver(entries => {
  updateActive(); // fallback con getBoundingClientRect
}, { threshold: 0.25 });

// Observar todas las secciones
sections.forEach(sec => observer.observe(sec));

// Eventos de scroll y resize
window.addEventListener('scroll', updateActive);
window.addEventListener('resize', updateActive);
document.addEventListener('DOMContentLoaded', updateActive);

// Prioridad absoluta al iframe del mapa
const iframeMapa = document.getElementById("iframe-mapa");
if (iframeMapa) {
  iframeMapa.addEventListener('load', () => {
    const observerMapa = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setActiveLink("mapa");
    }, { threshold: 0.25 });
    observerMapa.observe(iframeMapa.contentDocument.body);
  });
}
