/* ==========================================================================
   AIRSENSE rutas.js - LÓGICA DE LA PÁGINA DE INICIO (VISOR.HTML)
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
   */
  function showSlide(index) {
    if (slides.length === 0) return;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-selected", i === index);
    });

    if (textElement) {
      textElement.textContent = texts[index];
    }
  }

  function nextSlide() {
    if (slides.length === 0) return;
    current = (current + 1) % slides.length;
    showSlide(current);
  }

  function prevSlide() {
    if (slides.length === 0) return;
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
    if (!link) return;

    navLinks.forEach(l => {
      l.classList.remove('nav-active');
      l.removeAttribute('aria-current');
    });
    link.classList.add('nav-active');
    link.setAttribute('aria-current', 'location');
  }

  // -----------------------------------------------------
  // --- LÓGICA DE CLIC (CORREGIDA PARA TU PROBLEMA) ---
  // -----------------------------------------------------

  function handleNavClick(event) {
    // 1. Avisamos que fue un clic manual
    userClicked = true;
    
    const link = event.currentTarget;
    activateLink(link); // Cambiamos color inmediatamente

    // 2. Reiniciamos el timer si hubo clics rápidos
    if (clickTimeout) clearTimeout(clickTimeout);

    // 3. CAMBIO CLAVE: Aumentamos a 1500ms (1.5 segundos).
    // Esto da tiempo a que la página baje hasta "Datos" sin que
    // el detector se despierte antes de tiempo al pasar por "Mapa".
    clickTimeout = setTimeout(() => { 
      userClicked = false; 
    }, 1500); 
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
    // CAMBIO CLAVE: Ajustado a -10% arriba.
    // Esto hace que la sección se active apenas el título toca la zona superior,
    // ayudando a que "Datos" se fije mejor.
    rootMargin: '-10% 0px -60% 0px',
    threshold: 0
  };

  // Función Callback del Observer
  const observerCallback = (entries) => {
    // Si el usuario hizo clic hace poco, NO hacemos nada (respetamos el clic)
    if (userClicked) return; 

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