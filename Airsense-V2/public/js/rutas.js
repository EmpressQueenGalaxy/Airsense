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
   2. NAVEGACIÓN ACTIVA POR SCROLL (VERSIÓN ESTABLE)
========================================================================== */

// Enlaces del menú
const navLinks = document.querySelectorAll('.nav a');

// Todas las secciones que corresponden al menú
const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

// Marca el enlace activo
function activateLink(link) {
  navLinks.forEach(l => {
    l.classList.remove('nav-active');
    l.removeAttribute('aria-current');
  });

  if (!link) return;

  link.classList.add('nav-active');
  link.setAttribute('aria-current', 'page');
}

// Evento click → marca manualmente
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    activateLink(e.currentTarget);
  });
});

// ========== SCROLL DETECTA SECCIÓN ACTUAL ==========
window.addEventListener("scroll", () => {
  let current = null;
  const scrollPos = window.scrollY + window.innerHeight / 3; // detección REAL

  sections.forEach(sec => {
    if (!sec) return;

    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;

    if (scrollPos >= top && scrollPos < bottom) {
      current = sec.getAttribute("id");
    }
  });

  // Si el mapa está visible → PRIORIDAD TOTAL
  const mapaSection = document.querySelector("#mapa");
  if (mapaSection) {
    const mapaTop = mapaSection.offsetTop;
    const mapaBottom = mapaTop + mapaSection.offsetHeight;

    if (scrollPos >= mapaTop && scrollPos < mapaBottom) {
      current = "mapa"; // prioridad absoluta
    }
  }

  // Aplicar en el menú
  navLinks.forEach(a => {
    a.classList.remove("nav-active");
    if (a.getAttribute("href") === "#" + current) {
      a.classList.add("nav-active");
    }
  });
});

/* ==========================================================================
   3. COMUNICACIÓN CON EL IFRAME DEL MAPA
========================================================================== */

window.addEventListener("message", (event) => {
  if (event.data === "mapa-visible") {
    const linkMapa = document.querySelector('.nav a[href="#mapa"]');
    activateLink(linkMapa);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const iframeMapa = document.getElementById("iframe-mapa");
  if (!iframeMapa) return;

  iframeMapa.addEventListener("load", () => {
    const iframeDocument = iframeMapa.contentDocument;
    const iframeBody = iframeDocument.body;

    const observerMapa = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          window.postMessage("mapa-visible", "*");
        }
      },
      { threshold: 0.25 }
    );

    observerMapa.observe(iframeBody);
  });
});
