/* ==========================================================================
   AIRSENSE rutas.js - CORRECCIÓN DEFINITIVA DE MAPA/DATOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. CARRUSEL (Sin cambios, funciona bien)
  // ==========================================================================
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const textElement = document.getElementById('slide-text');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');

  const texts = [
    "¿Sabías que en Colombia mueren más de 17.000 personas cada año por culpa del aire que respiran?",
    "Monitorea la calidad del aire en el Valle del Cauca y aprende sobre los contaminantes.",
    "Explora las estaciones y descubre cómo mejorar la calidad del aire que respiras."
  ];

  let current = 0;

  function showSlide(index) {
    if (slides.length === 0) return;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    if (textElement && texts[index]) textElement.textContent = texts[index];
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

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  dots.forEach((dot, i) => dot.addEventListener('click', () => { current = i; showSlide(i); }));

  if (slides.length > 0) {
    setInterval(nextSlide, 6000);
    showSlide(current);
  }

  // ==========================================================================
  // 2. NAVEGACIÓN "LÁSER" (SOLUCIÓN AL PROBLEMA DE MAPA)
  // ==========================================================================
  
  const navLinks = document.querySelectorAll('.nav a, nav a');
  let isUserClicking = false; 
  let clickTimeout;

  function activateLink(link) {
    if (!link) return;
    navLinks.forEach(l => {
      l.classList.remove('nav-active');
      l.removeAttribute('aria-current');
    });
    link.classList.add('nav-active');
    link.setAttribute('aria-current', 'location');
  }

  // --- LÓGICA DE CLIC (El "Candado") ---
  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      // 1. Activar candado: Prohibimos al detector cambiar nada
      isUserClicking = true;
      
      // 2. Pintar inmediatamente lo que el usuario eligió
      activateLink(event.currentTarget); 

      // 3. Reiniciar temporizador
      if (clickTimeout) clearTimeout(clickTimeout);
      
      // 4. Mantener el candado cerrado 1.5 SEGUNDOS
      // Esto obliga al navegador a ignorar el paso por "Mapa"
      clickTimeout = setTimeout(() => { 
        isUserClicking = false; 
      }, 1500);
    });
  });

  // --- LÓGICA DE SCROLL (El "Puntero Láser") ---
  const sections = Array.from(navLinks)
    .map(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) return document.getElementById(href.substring(1));
      return null;
    })
    .filter(section => section !== null);

  const observerOptions = {
    root: null,
    // LA SOLUCIÓN TÉCNICA:
    // Antes mirábamos una zona grande (-10% a -60%).
    // Ahora miramos una LÍNEA FINA (-20% a -75%).
    // Esto hace casi imposible que toque dos secciones a la vez.
    rootMargin: '-20% 0px -75% 0px',
    threshold: 0
  };

  const observerCallback = (entries) => {
    // Si el candado está activo (usuario hizo clic), NO HACEMOS NADA.
    if (isUserClicking) return; 

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const activeLink = document.querySelector(`.nav a[href="#${id}"], nav a[href="#${id}"]`);
        
        // Verificación extra: Si es "Mapa" pero estamos bajando mucho, ignorar (opcional)
        if (activeLink) activateLink(activeLink);
      }
    });
  };

  if (sections.length > 0) {
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
  }

});