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

// 1. Obtener todos los enlaces de la navegación principal
const navLinks = document.querySelectorAll('.nav a');
let userClicked = false; 

function activateLink(link) {
  navLinks.forEach(l => {
    l.classList.remove('nav-active');
    l.removeAttribute('aria-current');
  });
  link.classList.add('nav-active');
  link.setAttribute('aria-current', 'page');
}


// -----------------------------------------------------
// --- LÓGICA DE CLIC (Para respuesta inmediata) ---
// -----------------------------------------------------

function handleNavClick(event) {
  userClicked = true; // ← CORRECCIÓN CLAVE

  activateLink(event.currentTarget);

  // desactivar protección tras un lapso
  setTimeout(() => { 
    userClicked = false;
  }, 800); // ← tiempo ideal para evitar solapamiento
}

navLinks.forEach(link => {
  link.addEventListener('click', handleNavClick);
});


// ---------------------------------------------------------
// --- LÓGICA DE SCROLL (Para seguir al usuario) ---
// ---------------------------------------------------------

// 2. Obtener todas las secciones a las que los enlaces apuntan
const sections = Array.from(navLinks)
  .map(link => document.getElementById(link.getAttribute('href').substring(1)))
  .filter(section => section !== null);

// 3. Opciones para el observador
const observerOptions = {
  root: null, // Observa en relación al viewport (la ventana del navegador)
  rootMargin: '-40% 0px -40% 0px',
  threshold: 0
};

// 4. Función que se ejecuta cuando una sección entra o sale de la vista
const observerCallback = (entries) => {
  if (userClicked) return;

  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      const activeLink = document.querySelector(`.nav a[href="#${id}"]`);
      if (activeLink) activateLink(activeLink);
    }
  });
};

// 5. Crear y activar el observador
const observer = new IntersectionObserver(observerCallback, observerOptions);

// 6. Decirle al observador qué secciones debe "vigilar"
sections.forEach(section => {observer.observe(section);});