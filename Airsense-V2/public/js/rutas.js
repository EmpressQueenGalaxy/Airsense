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
   2. NAVEGACIÓN ACTIVA CON INTERSECTION OBSERVER
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

// Scroll suave al hacer click
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// IntersectionObserver confiable para todas las secciones
const observer = new IntersectionObserver(entries => {
  // Filtrar las secciones que estén al menos 50% visibles
  const visibleSections = entries
    .filter(e => e.intersectionRatio >= 0.5)
    .sort((a, b) => a.target.offsetTop - b.target.offsetTop);

  if (visibleSections.length === 0) return;

  // Tomar la primera visible en el orden del documento
  const topSection = visibleSections[0].target;
  setActiveLink(topSection.id);
}, { threshold: 0.5 });

// Observar todas las secciones
sections.forEach(sec => observer.observe(sec));

// Prioridad absoluta al iframe del mapa (si existe)
const iframeMapa = document.getElementById("iframe-mapa");
if (iframeMapa) {
  iframeMapa.addEventListener("load", () => {
    const iframeBody = iframeMapa.contentDocument.body;

    const observerMapa = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setActiveLink("mapa"); // Prioridad absoluta
      }
    }, { threshold: 0.25 });

    observerMapa.observe(iframeBody);
  });
}
