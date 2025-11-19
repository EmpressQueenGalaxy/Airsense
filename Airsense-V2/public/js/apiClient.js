/* ==========================================================================
   CONFIGURACIÓN DE LA URL BASE (ESTO ES LO QUE TE FALTABA)
   ========================================================================== */

// 1. Detectamos si estamos en tu PC (localhost o 127.0.0.1)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. Definimos la URL base:
//    - Si es local: Apuntamos al puerto 4000 (donde corre tu backend Node.js)
//    - Si es Vercel: Dejamos cadena vacía '' (para usar rutas relativas automáticas)
const API_BASE_URL = isLocal ? 'http://localhost:4000' : '';


/* ==========================================================================
   CLIENTE API
   ========================================================================== */

/**
 * Cliente genérico para hacer peticiones fetch a la API.
 * Maneja el 'try-catch', la validación 'response.ok' y el parseo de JSON.
 *
 * @param {string} url - La URL del endpoint de la API (ej. "/api/municipios")
 * @param {object} [options] - Opciones de fetch (method, headers, body, etc.)
 * @returns {Promise<any>} - Los datos de la respuesta en JSON.
 * @throws {Error} - Lanza un error estandarizado si la petición falla.
 */
async function apiClient(url, options = {}) {
  try {
    // Asegurarnos de que la URL empiece con / si no lo tiene
    const endpoint = url.startsWith('/') ? url : '/' + url;
    
    // AHORA SÍ: API_BASE_URL ya existe y funcionará
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    console.log(`📡 Fetching: ${fullUrl}`); // Útil para ver si apunta a 4000 o relativo

    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      // Intenta leer el error JSON que envía el backend
      const errorData = await response.json().catch(() => ({})); 
      
      // Crea un mensaje de error útil
      const errorMsg = errorData.error || errorData.mensaje || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return await response.json();

  } catch (error) {
    console.error(`❌ Error en cliente API [${url}]:`, error.message);
    throw error;
  }
}