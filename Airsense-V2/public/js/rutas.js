/* ==========================================================================
   AIRSENSE - LÓGICA DE LA PÁGINA DE INICIO (visor.html)
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

// Detectar la sección visible y marcar activo el enlace del menú
function activarMenuSegunScroll() {
  let posicionActual = window.scrollY + 150; // margen para header

  sections.forEach(section => {
    let top = section.offsetTop;
    let height = section.offsetHeight;
    let id = section.getAttribute("id");

    if (posicionActual >= top && posicionActual < top + height) {
      navLinks.forEach(link => link.classList.remove("nav-active"));

      // Buscar el enlace cuyo href coincide con la sección visible
      let activo = document.querySelector(`.nav a[href="#${id}"]`);
      if (activo) activo.classList.add("nav-active");
    }
  });
}

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

// == IntersectionObserver  ==
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

// Observador para detectar qué sección está visible
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      const link = document.querySelector(`nav a[href="#${id}"]`);

      if (entry.intersectionRatio > 0.55) {
        // 🔥 EXCLUSIVO: quitamos todas las clases antes de activar una sola
        enlaces.forEach((a) => a.classList.remove("active"));

        // Activamos solo el enlace de esa sección
        if (link) link.classList.add("active");
      }
    });
  },
  {
    threshold: [0.55], // Marca activa solo si MÁS DEL 55% es visible
  }
);

// Observamos todas las secciones
secciones.forEach((sec) => observer.observe(sec));

// =====================================================
//    COMUNICACIÓN CON EL IFRAME DEL MAPA
// =====================================================

window.addEventListener("message", (event) => {
  if (event.data === "mapa-visible") {
    const linkMapa = document.querySelector('.nav a[href="#mapa"]');
    activateLink(linkMapa);
  }
});

  document.addEventListener("DOMContentLoaded", () => {
  const iframeMapa = document.getElementById("iframe-mapa");

  if (!iframeMapa) {
    console.error("❌ No se encontró el iframe del mapa");
    return;
  }

  iframeMapa.addEventListener("load", () => {
    console.log("✅ Iframe del mapa cargado");

    const iframeDocument = iframeMapa.contentDocument;
    const iframeBody = iframeDocument.body;

    // Aquí va el observer SIN tocar mapa.html
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

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(sec => {
    const top = window.scrollY;
    if (top >= sec.offsetTop - 150) {
      current = sec.getAttribute("id");
    }
  });

  navLinks.forEach(a => {
    a.classList.remove("nav-active");
    if (a.getAttribute("href") === "#" + current) {
      a.classList.add("nav-active");
    }
  });
});