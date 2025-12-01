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
   2. NAVEGACIÓN ACTIVA UNIFICADA Y ESTABLE
========================================================================== */

// Enlaces del menú
const navLinks = document.querySelectorAll('.nav a');

// Secciones correspondientes a cada link
const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

// Función para marcar un link como activo
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

// Función para actualizar el link activo basado en scroll
function updateActiveOnScroll() {
  const triggerPos = window.innerHeight * 0.25; // punto de referencia

  let current = null;
  let minDistance = Infinity;

  // Detecta la sección más cercana al trigger
  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const distance = Math.abs(rect.top - triggerPos);
    if (distance < minDistance) {
      minDistance = distance;
      current = sec.getAttribute("id");
    }
  });

  // Prioridad absoluta al mapa si está visible
  const mapaSection = document.querySelector("#mapa");
  if (mapaSection) {
    const rectMapa = mapaSection.getBoundingClientRect();
    if (rectMapa.top <= triggerPos && rectMapa.bottom >= triggerPos) {
      current = "mapa";
    }
  }

  if (current) setActiveLink(current);
}

// Eventos de scroll, resize y carga
window.addEventListener("scroll", updateActiveOnScroll);
window.addEventListener("resize", updateActiveOnScroll);
document.addEventListener("DOMContentLoaded", updateActiveOnScroll);

// Observador para iframe del mapa
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

/* ========================================================================== 
   TRUCO VISUAL DE DEPURACIÓN - SECCIONES ACTIVAS
========================================================================== */

// Crear una línea horizontal que indique el triggerPos
const debugLine = document.createElement('div');
debugLine.style.position = 'fixed';
debugLine.style.left = '0';
debugLine.style.width = '100%';
debugLine.style.height = '2px';
debugLine.style.background = 'red';
debugLine.style.zIndex = '9999';
debugLine.style.top = (window.innerHeight * 0.25) + 'px';
document.body.appendChild(debugLine);

// Resaltar sección activa visualmente
function highlightSection() {
  const triggerPos = window.innerHeight * 0.25;
  let closestSection = null;
  let minDistance = Infinity;

  sections.forEach(sec => {
    sec.style.outline = ''; // limpiar borde previo
    const rect = sec.getBoundingClientRect();
    const distance = Math.abs(rect.top - triggerPos);
    if (distance < minDistance) {
      minDistance = distance;
      closestSection = sec;
    }
  });

  if (closestSection) {
    closestSection.style.outline = '3px dashed orange'; // resalta la sección activa
  }
}

// Actualizar resalte al hacer scroll o resize
window.addEventListener('scroll', highlightSection);
window.addEventListener('resize', () => {
  debugLine.style.top = (window.innerHeight * 0.25) + 'px';
  highlightSection();
});
document.addEventListener('DOMContentLoaded', highlightSection);
