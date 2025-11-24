/* ==========================================================================
   AIRSENSE rutas.js- LÓGICA DE LA PÁGINA DE INICIO (VISOR.HTML)
   ==========================================================================
   Gestiona:
   1. El carrusel de imágenes y texto de la sección de inicio.
   2. El resaltado de la navegación principal al hacer scroll (Intersection Observer).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // MÓDULO: CARRUSEL DE INICIO
  // ==========================================================================
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const textElement = document.getElementById('slide-text');

  // Botones de control (verificamos si existen antes de usarlos)
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');

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
      slide.classList.toggle("active", i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-selected", i === index);
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

  // --- Listeners del Carrusel (Solo si los botones existen) ---
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      current = i;
      showSlide(i);
    });
  });

  // Auto-play (solo si hay slides)
  if (slides.length > 0) {
    setInterval(nextSlide, 6000);
    showSlide(current); // Mostrar la primera diapositiva al cargar
  }

  /* =====================================================
      MÓDULO: NAVEGACIÓN ACTIVA POR SCROLL
  ====================================================== */

  // Buscar enlaces DENTRO del .nav o etiquetas <nav>
  const navLinks = document.querySelectorAll('.nav a, nav a');
  let userClicked = false; // <-- Evita que el observer sobrescriba un clic reciente
  let clickTimeout;

  // Función que activa un enlace y desactiva los demás
  function activateLink(link) {
    navLinks.forEach(l => {
      l.classList.remove('nav-active');
      l.removeAttribute('aria-current');
    });
    link.classList.add('nav-active');
    link.setAttribute('aria-current', 'location');
  }

  // -----------------------------------------------------
  // --- LÓGICA DE CLIC (Para respuesta inmediata) ---
  // -----------------------------------------------------

  function handleNavClick(event) {
    userClicked = true;
    const link = event.currentTarget;
    activateLink(link);

    // Bloquea temporalmente el observer
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => { userClicked = false; }, 1000);
  }

  // Asigna la función de clic a CADA enlace
  navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });


  // ---------------------------------------------------------
  // --- LÓGICA DE SCROLL (Para seguir al usuario) ---
  // ---------------------------------------------------------

  // Obtener secciones mapeando los href de los enlaces
  const sections = Array.from(navLinks)
    .map(link => {
      const href = link.getAttribute('href');
      // Solo nos sirven los enlaces internos (que empiezan con #)
      if (href && href.startsWith('#')) {
        return document.getElementById(href.substring(1));
      }
      return null;
    })
    .filter(section => section !== null);

  const observerOptions = {
    root: null,
    rootMargin: '-15% 0px -60% 0px',
    threshold: 0
  };

  // Función Callback del Observer
  const observerCallback = (entries) => {
    if (userClicked) return; // Ignora si hubo un clic reciente

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        // Buscar enlace correspondiente
        const activeLink = document.querySelector(`.nav a[href="#${id}"], nav a[href="#${id}"]`);
        
        if (activeLink) activateLink(activeLink);
      }
    });
  };

  // ---------------------------------------------------------
  // --- ACTIVACIÓN FINAL DEL OBSERVADOR ---
  // ---------------------------------------------------------
  // Verificamos si hay secciones para observar antes de encenderlo
  if (sections.length > 0) {
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => {
      observer.observe(section);
    });
  }

}); // <--- FIN DEL DOMContentLoaded