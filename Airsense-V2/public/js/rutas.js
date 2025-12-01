/* ==========================================================================
   AIRSENSE - LÓGICA DE LA PÁGINA DE INICIO (visor.html)
   ==========================================================================
   Gestiona:
   1. El carrusel de imágenes y texto de la sección de inicio.
   2. El resaltado de la navegación principal al hacer scroll (Intersection Observer).
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
   NAVEGACIÓN ACTIVA UNIFICADA
========================================================================== */

// Enlaces del menú
const navLinks = document.querySelectorAll('.nav a');

// Todas las secciones que corresponden al menú
const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

// Función que marca el link activo
function setActiveLink(id) {
  navLinks.forEach(link => {
    link.classList.toggle('nav-active', link.getAttribute("href") === "#" + id);
    link.setAttribute('aria-current', link.getAttribute("href") === "#" + id ? "page" : "");
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

// Detectar sección visible en scroll
function updateActiveOnScroll() {
  let current = null;
  const triggerPos = window.innerHeight * 0.25;

  let minDistance = Infinity; // distancia mínima entre el trigger y el top de la sección

  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const distance = Math.abs(rect.top - triggerPos);
    if (distance < minDistance) {
      minDistance = distance;
      current = sec.getAttribute("id");
    }
  });

  // Prioridad al mapa si está visible
  const mapaSection = document.querySelector("#mapa");
  if (mapaSection) {
    const rectMapa = mapaSection.getBoundingClientRect();
    if (rectMapa.top <= triggerPos && rectMapa.bottom >= triggerPos) {
      current = "mapa";
    }
  }

  if (current) setActiveLink(current);
}

window.addEventListener("scroll", updateActiveOnScroll);
window.addEventListener("resize", updateActiveOnScroll);
document.addEventListener("DOMContentLoaded", updateActiveOnScroll);

// Observador para iframe mapa (solo si existe)
const iframeMapa = document.getElementById("iframe-mapa");
if (iframeMapa) {
  iframeMapa.addEventListener("load", () => {
    const iframeDocument = iframeMapa.contentDocument;
    const iframeBody = iframeDocument.body;

    const observerMapa = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setActiveLink("mapa");
      }
    }, { threshold: 0.25 });

    observerMapa.observe(iframeBody);
  });
}
