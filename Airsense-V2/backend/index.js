/*==========================================================================
   AIRSENSE - SERVIDOR BACKEND
   ==========================================================================
* Configura el servidor Express para servir el frontend estático y exponer
 * los endpoints de consulta de datos de calidad del aire a través de PostgreSQL.
 */

/* ==========================================================================
  IMPORTACIÓN DE DEPENDENCIAS
   ========================================================================== */

const express = require("express");
const cors = require("cors");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const db = require("./basedatos");
const healthRoutes = require('./health');

// ==========================================================================
// UTILIDAD: MANEJADOR ASÍNCRONO DE ERRORES (apiHandler)
// ==========================================================================

/**
 * Manejador genérico para las rutas de la API (Controlador Asíncrono).
 * Ejecuta una función 'controladora' y captura cualquier error asíncrono,
 * enviando una respuesta 500 estandarizada en JSON.
 *
 * @param {function} controller - La función (req, res) que contiene la lógica del endpoint.
 * @param {string} [endpointName="la ruta"] - Nombre del endpoint para los logs de error.
 * @returns {function} Un nuevo middleware de Express.
 */
const apiHandler = (controller, endpointName = "la ruta") => {
  
  return async (req, res) => {
    try {
      // Ejecuta toda tu lógica (validaciones, BBDD, etc.)
      await controller(req, res);
      
    } catch (error) {
      // Si ALGO falla (un error en db.get... o cualquier otro)
      // esto lo captura.
      console.error(`❌ Error en ${endpointName}:`, error.message);
      res.status(500).json({ 
        error: `Error interno del servidor al procesar ${endpointName}` 
      });
    }
  };
};


/*Instancia principal de la aplicación Express
  Maneja todas las rutas y middlewares del servidor*/
const app = express();
const PORT = process.env.PORT || 3000; //Usa variable de entorno PORT (producción) o 3000 por defecto 
const frontendDist = path.join(__dirname, "../frontend/dist");
 
// ==========================================================================
// CONFIGURACIÓN DE MIDDLEWARES
// ==========================================================================
app.use(cors());                                            //permite que el fronted haga peticiones al backend desde diferente origen
app.use(express.json());                                    //habilita el procesamiento de peticiones en formato JSON
app.use('/api/health', healthRoutes);

// ==========================================================================
// CONFIGURACIÓN DE MIDDLEWARES ESTÁTICOS 
// ==========================================================================
app.use(express.static(frontendDist));

/* ==========================================================================
   ENDPOINTS DE LA API
 ==========================================================================

/**
 * @route GET /api/municipios
 * @description Obtiene la lista completa de municipios.
 */
app.get("/api/municipios", apiHandler(
  async (req, res) => {
    // La función db.getMunicipios() debe existir en tu basedatos.js
    const municipios = await db.getMunicipios(); 
    res.json(municipios);
  }, 
  "/api/municipios"
));

/**
 * @route GET /api/estaciones/:id_municipio
 * @description Obtiene todas las estaciones de un municipio específico.
 */
app.get("/api/estaciones/:id_municipio", apiHandler(
  async (req, res) => {
    const estaciones = await db.getEstacionesPorMunicipio(
      req.params.id_municipio
    );
    res.json(estaciones);
  }, 
  "Error al obtener estaciones"
));

/**
 * Ruta para obtener el listado completo de contaminantes y su descripción.
 * @returns {Array<Object>} Lista de objetos del diccionario de contaminantes.
 */
app.get("/api/diccionario", apiHandler(
  async (req, res) => {
    // Llama a la función de la base de datos para obtener el diccionario
    const diccionario = await db.getDiccionario(); 
    res.json(diccionario);
  }, 
  "/api/diccionario" // Nombre del endpoint para el log
));

/**
 * @route GET /api/anios/:id_municipio
 * @description Obtener años con datos disponibles por municipio
 * @param {string} req.params.id_municipio
 * @returns {object} 200 - JSON con nombre y array de años
 * @returns {object} 400 - Error de validación
 * @returns {object} 404 - No se encontraron registros
 */
app.get('/api/anios/:id_municipio', apiHandler(
  
  // 1er argumento: El controlador (toda tu lógica, SIN el try-catch)
  async (req, res) => {
    // Parsear y validar el parámetro
    const idMunicipio = parseInt(req.params.id_municipio);
    
    if (isNaN(idMunicipio) || idMunicipio <= 0) {
      return res.status(400).json({ 
        error: 'El ID del municipio debe ser un número entero positivo' 
      });
    }
    
    // Llamar a la función de base de datos
    const resultado = await db.getAniosPorMunicipio(idMunicipio);
    // Si no hay resultados
    if (!resultado) {
      return res.status(404).json({ 
        mensaje: 'No existen registros de calidad del aire para este municipio.' 
      });
    }
    // Respuesta exitosa
    res.status(200).json(resultado);
  }, 

  // 2do argumento: El nombre del endpoint para el log
  "/api/anios"
));

/**
 * Endpoint: Obtener estaciones por municipio y año con ubicaciones temporales
 * Ruta: GET /api/estaciones/:id_municipio/:anio
 * * NOTA: Esta ruta ha sido refactorizada para usar apiHandler.
 */
app.get('/api/estaciones/:id_municipio/:anio', apiHandler(
  async (req, res) => {
    // Parsear y validar parámetros
    const idMunicipio = parseInt(req.params.id_municipio);
    const anio = parseInt(req.params.anio);

    // Validación de ID de municipio
    if (isNaN(idMunicipio) || idMunicipio <= 0) {
      return res.status(400).json({
        error: 'El ID del municipio debe ser un número entero positivo'
      });
    }

    // Validación de año (rango razonable según tus datos)
    // Se mantiene la validación de rango 2011-2023 por contexto del proyecto
    if (isNaN(anio) || anio < 2011 || anio > 2023) {
      return res.status(400).json({
        error: 'El año debe ser un número entre 2011 y 2023'
      });
    }

    // Llamar a la función de base de datos
    const estaciones = await db.getEstacionesPorMunicipioYAnio(idMunicipio, anio);

    // Si no hay estaciones operativas en ese año
    if (estaciones.length === 0) {
      return res.status(404).json({
        mensaje: `No hay estaciones con datos de calidad del aire para este municipio en el año ${anio}.`,
        sugerencia: 'Intente con otro año disponible'
      });
    }

    // Respuesta exitosa con metadata
    res.status(200).json({
      municipio_id: idMunicipio,
      anio_consultado: anio,
      total_estaciones: estaciones.length,
      estaciones: estaciones
    });
  },
  "/api/estaciones/:id_municipio/:anio" // Nombre del endpoint para el log
));

/**
 * Endpoint: Obtener contaminantes medidos en una estación durante un año
 * Ruta: GET /api/contaminantes/:id_estacion/:anio
 * * * NOTA: La ruta original ha sido refactorizada para usar el apiHandler.
 */
app.get('/api/contaminantes/:id_estacion/:anio', apiHandler(
  async (req, res) => {
    // Parsear y validar parámetros
    const idEstacion = parseInt(req.params.id_estacion);
    const anio = parseInt(req.params.anio);
    
    // Validación de ID de estación
    if (isNaN(idEstacion) || idEstacion <= 0) {
      return res.status(400).json({ 
        error: 'El ID de la estación debe ser un número entero positivo' 
      });
    }
    
    // Validación de año (rango razonable según tus datos)
    if (isNaN(anio) || anio < 2011 || anio > 2023) {
      return res.status(400).json({ 
        error: 'El año debe ser un número entre 2011 y 2023' 
      });
    }
    
    // Llamar a la función de base de datos
    const contaminantes = await db.getContaminantesPorEstacionYAnio(idEstacion, anio);
    
    // Si no hay contaminantes medidos en ese año
    if (contaminantes.length === 0) {
      return res.status(404).json({ 
        mensaje: `No hay datos de contaminantes para esta estación en el año ${anio}.`,
        sugerencia: 'Verifique que la estación estuviera operativa en ese año'
      });
    }
    
    // Respuesta exitosa con metadata
    res.status(200).json({
      estacion_id: idEstacion,
      anio_consultado: anio,
      total_contaminantes: contaminantes.length,
      contaminantes: contaminantes
    });
    
  },
  "/api/contaminantes/:id_estacion/:anio" // Segundo argumento: nombre para el log de errores
));

/**
 * @route GET /api/datos
 * @description Obtener datos históricos completos de un contaminante
 * @param {string} req.query.estacion
 * @param {string} req.query.anio
 * @param {string} req.query.exposicion
*/
app.get('/api/datos', apiHandler(
  
  // 1er Argumento: El controlador (toda tu lógica interna)
  async (req, res) => {
    // Extraer y validar query parameters
    const estacionParam = req.query.estacion;
    const anioParam = req.query.anio;
    const exposicionParam = req.query.exposicion;
    
    // Validar que todos los parámetros estén presentes
    if (!estacionParam || !anioParam || !exposicionParam) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos',
        parametros_requeridos: {
          estacion: 'ID de la estación (número)',
          anio: 'Año a consultar (2011-2023)',
          exposicion: 'ID de exposición (número)'
        },
        ejemplo: '/api/datos?estacion=8986&anio=2015&exposicion=4'
      });
    }
    
    // Parsear parámetros
    const idEstacion = parseInt(estacionParam);
    const anio = parseInt(anioParam);
    const idExposicion = parseInt(exposicionParam);
    
    // Validar ID de estación
    if (isNaN(idEstacion) || idEstacion <= 0) {
      return res.status(400).json({ 
        error: 'El ID de la estación debe ser un número entero positivo' 
      });
    }
    
    // Validar año
    if (isNaN(anio) || anio < 2011 || anio > 2023) {
      return res.status(400).json({ 
        error: 'El año debe ser un número entre 2011 y 2023' 
      });
    }
    // Validar ID de exposición
    if (isNaN(idExposicion) || idExposicion <= 0) {
      return res.status(400).json({ 
        error: 'El ID de exposición debe ser un número entero positivo' 
      });
    }
    // Llamar a la función de base de datos
    const datos = await db.getDatosHistoricosPorContaminante(idEstacion, anio, idExposicion);
    // Si no hay datos para esa combinación
    if (!datos) {
      return res.status(404).json({ 
        mensaje: 'No se encontraron datos para la combinación especificada',
        parametros_consultados: {
          estacion: idEstacion,
          anio: anio,
          exposicion: idExposicion
        },
        sugerencia: 'Verifique que existan mediciones para este contaminante en la estación y año seleccionados'
      });
    }
    // Respuesta exitosa
    res.status(200).json(datos);
  }, 
  // 2do Argumento: Nombre del endpoint para el log de errores
  "/api/datos"
));

// ==========================================================================
// FRONTEND REACT
// ==========================================================================
// Las rutas de la API se registran antes de este fallback para que React no
// intercepte respuestas JSON.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendDist, "index.html"), (error) => {
    if (error) {
      next(error);
    }
  });
});

// ==========================================================================
// MANEJO DE ERRORES GLOBALES
// ==========================================================================

// Previene que el servidor se caiga por errores asíncronos no capturados (ej: fallo DB)
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Promesa rechazada sin capturar:", reason);
});

// ==========================================================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================================================

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend iniciado en local: http://localhost:${PORT}`);
  });
}

// IMPORTANTE: Exportar la app para que Vercel la pueda ejecutar
module.exports = app;