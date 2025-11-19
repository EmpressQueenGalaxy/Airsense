// public/apiClient.js

/* ==========================================================================
   CONFIGURACIÓN DE LA URL BASE
   ========================================================================== */
// Detectamos si estamos en localhost o 127.0.0.1
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local, apuntamos al puerto 4000 (tu backend).
// Si estamos en Vercel (producción), dejamos la cadena vacía '' para usar rutas relativas.
const API_BASE_URL = isLocal ? 'http://localhost:4000' : '';

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
    
    // Construir la URL completa
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    // Log para ver en consola qué está pasando (solo útil para depurar)
    console.log(`📡 Fetching: ${fullUrl}`);

    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      // Intenta leer el error JSON que envía el backend (ej. { error: "..." })
      const errorData = await response.json().catch(() => ({})); 
      
      // Crea un mensaje de error útil
      const errorMsg = errorData.error || errorData.mensaje || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    // Devuelve el JSON
    return await response.json();

  } catch (error) {
    console.error(`❌ Error en cliente API [${url}]:`, error.message);
    // Vuelve a lanzar el error para que la función que lo llamó
    // pueda manejarlo y mostrar un mensaje al usuario.
    throw error;
  }
}