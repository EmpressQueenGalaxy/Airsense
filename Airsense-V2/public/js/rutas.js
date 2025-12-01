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
   AIRSENSE - NAVEGACIÓN ACTIVA 
========================================================================== */

const navLinks = document.querySelectorAll('.nav a');
const sections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveLink(id) {
  // solo cambiar si es distinto para evitar repintados
  navLinks.forEach(link => {
    const isActive = link.getAttribute("href") === "#" + id;
    if (isActive) {
      if (!link.classList.contains('nav-active')) {
        link.classList.add('nav-active');
        link.setAttribute('aria-current', 'page');
      }
    } else {
      if (link.classList.contains('nav-active')) {
        link.classList.remove('nav-active');
        link.removeAttribute('aria-current');
      }
    }
  });
}

/* ---- control de scroll programático ----
   Al hacer click: marcar inmediatamente y bloquear
   la lógica automática hasta que el scroll termine.
*/
let isProgrammatic = false;
let programmaticTimer = null;
const PROGRAMMATIC_LOCK_MS = 700; // ajustar si el scroll tarda más

function cancelProgrammaticLock() {
  isProgrammatic = false;
  if (programmaticTimer) {
    clearTimeout(programmaticTimer);
    programmaticTimer = null;
  }
}

/* Scroll suave al hacer click: marcar inmediatamente y bloquear */
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetSelector = link.getAttribute('href');
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const id = target.id || targetSelector.replace('#','');
    // marcar YA (evita que el indicador quede en la anterior)
    setActiveLink(id);

    // iniciar bloqueo programático
    isProgrammatic = true;
    if (programmaticTimer) clearTimeout(programmaticTimer);
    programmaticTimer = setTimeout(() => {
      isProgrammatic = false;
      programmaticTimer = null;
      updateActiveFromObserverOrTop(); // forzar actualización final
    }, PROGRAMMATIC_LOCK_MS);

    // hacer scroll suave
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* Si el usuario interrumpe (rueda el ratón, toca, usa teclado),
   cancelamos el bloqueo programático para que recupere control.
*/
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev =>
  window.addEventListener(ev, () => {
    if (isProgrammatic) {
      cancelProgrammaticLock();
      updateActiveFromObserverOrTop();
    }
  }, { passive: true })
);

/* ---- IntersectionObserver ----
   Observa todas las secciones y guarda el intersectionRatio en un mapa.
   Cuando NO haya bloqueo programático, elegimos la sección con mayor ratio.
*/
const ratioMap = new Map(); // section.element -> latest ratio

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    ratioMap.set(entry.target, entry.intersectionRatio);
  });

  // sólo actualizar si no estamos en scroll programático
  if (!isProgrammatic) {
    updateActiveFromObserverOrTop();
  }
}, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });

sections.forEach(sec => io.observe(sec));

/* ---- Lógica para elegir sección activa ----
   1) Si hay ratios registrados, elegir la sección con mayor ratio (>= 0.25)
   2) Si no hay ninguna con ratio suficiente, fallback: la sección cuyo top
      esté más cerca/por encima de un trigger (10% desde arriba).
*/
function getSectionByMaxRatio(minRatio = 0.25) {
  let best = null;
  let bestRatio = minRatio;
  for (const [sec, ratio] of ratioMap.entries()) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = sec;
    }
  }
  return best;
}

function getTopSection(triggerPercent = 0.1) {
  const trigger = window.innerHeight * triggerPercent;
  let current = sections[0];
  for (const sec of sections) {
    const r = sec.getBoundingClientRect();
    if (r.top <= trigger + 1) {
      current = sec;
    } else {
      break;
    }
  }
  return current;
}

function updateActiveFromObserverOrTop() {
  // prioridad absoluta al mapa solo si al menos 25% visible
  const mapa = document.querySelector('#mapa');
  if (mapa) {
    const r = mapa.getBoundingClientRect();
    const visibleMapa = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    const visibleRatio = visibleMapa / r.height;
    if (visibleRatio >= 0.25) {
      setActiveLink('mapa');
      return;
    }
  }

  // 1) intentar por ratio
  const byRatio = getSectionByMaxRatio(0.25);
  if (byRatio) {
    setActiveLink(byRatio.id);
    return;
  }

  // 2) fallback top-based
  const topSec = getTopSection(0.1);
  if (topSec) setActiveLink(topSec.id);
}

/* También actualizamos periódicamente cuando se redimensiona o scrollea
   (no es costoso: la función solo cambia si hay diferencia).
*/
let scrollUpdateTimer = null;
function onScrollOrResize() {
  if (isProgrammatic) {
    // refrescar el timer de bloqueo para esperar al final del scroll programático
    if (programmaticTimer) {
      clearTimeout(programmaticTimer);
    }
    programmaticTimer = setTimeout(() => {
      isProgrammatic = false;
      programmaticTimer = null;
      updateActiveFromObserverOrTop();
    }, PROGRAMMATIC_LOCK_MS);
    return;
  }

  // debounce ligero para evitar demasiadas llamadas
  if (scrollUpdateTimer) clearTimeout(scrollUpdateTimer);
  scrollUpdateTimer = setTimeout(() => {
    updateActiveFromObserverOrTop();
    scrollUpdateTimer = null;
  }, 80);
}

window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);

/* Al cargar la página forzamos una actualización final */
document.addEventListener('DOMContentLoaded', () => {
  // limpiar mapa inicial
  ratioMap.clear();
  // force resize/scroll handling after layout settle (imagenes/carrusel)
  setTimeout(updateActiveFromObserverOrTop, 120);
  setTimeout(updateActiveFromObserverOrTop, 700); // por si hay recursos tardíos
});

/* Prioridad especial para iframe #mapa (si lo usas dentro de iframe) */
const iframeMapa = document.getElementById('iframe-mapa');
if (iframeMapa) {
  iframeMapa.addEventListener('load', () => {
    try {
      const iframeBody = iframeMapa.contentDocument.body;
      const obs = new IntersectionObserver(entries => {
        if (entries[0] && entries[0].isIntersecting) {
          setActiveLink('mapa');
        } else {
          // cuando el mapa deja de intersectar, recalcular
          updateActiveFromObserverOrTop();
        }
      }, { threshold: 0.25 });
      obs.observe(iframeBody);
    } catch (err) {
      // si el iframe es cross-origin no se puede acceder al body — usar fallback
      console.warn('No se puede observar iframe por CORS; fallback activado.');
    }
  });
}
