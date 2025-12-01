/* ========================================================================== 
   AIRSENSE - LÓGICA DE LA PÁGINA DE INICIO (visor.html)
   ==========================================================================
   Gestiona:
   1. Carrusel de imágenes y texto de la sección de inicio.
   2. Resaltado de la navegación principal al hacer scroll (unificado y estable).
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
   2. NAVEGACIÓN ACTIVA UNIFICADA Y SINCRONIZADA
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

function updateActiveOnScroll() {
  const triggerPos = window.innerHeight * 0.25; // punto de referencia
  let current = sections[0].id; // default a primera sección

  for (const sec of sections) {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= triggerPos) {
      current = sec.id;
    } else {
      break; // todas las siguientes están abajo del trigger
    }
  }

  // Prioridad absoluta al mapa
  const mapaSection = document.querySelector("#mapa");
  if (mapaSection) {
    const rectMapa = mapaSection.getBoundingClientRect();
    if (rectMapa.top <= triggerPos && rectMapa.bottom >= triggerPos) {
      current = "mapa";
    }
  }

  setActiveLink(current);
}

window.addEventListener("scroll", updateActiveOnScroll);
window.addEventListener("resize", updateActiveOnScroll);
document.addEventListener("DOMContentLoaded", updateActiveOnScroll);
