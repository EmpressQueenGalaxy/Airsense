/* ==========================================================================
   AIRSENSE - MÓDULO DE CONEXIÓN A BASE DE DATOS
   ==========================================================================
 * Gestiona toda la interacción con la base de datos PostgreSQL.
 * Proporciona funciones para consultar datos de calidad del aire, estaciones y municipios.
 */

// ==========================================================================
// IMPORTACIÓN DE DEPENDENCIAS
// ==========================================================================

const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { Pool } = require("pg");
const fs = require("node:fs");

// Verificación del entorno y variables de configuración
console.log("📁 Ruta actual:", __dirname);
console.log("📄 ¿Archivo .env encontrado?", fs.existsSync(__dirname + "/.env"));
console.log("🧩 Variables cargadas:", {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? "[OK]" : "[VACÍA]",
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

let pool;

/* ==========================================================================
   INICIALIZACIÓN DE LA CONEXIÓN
   ==========================================================================
*/
/**
 * Inicia la conexión a PostgreSQL
 * Intenta primero conectar con SSL (para Supabase) y si falla, usa conexión local
 */
async function conectarPostgres() {
  try {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: String(process.env.DB_PASSWORD).trim(),
      port: process.env.DB_PORT,
      ssl: { require: true, rejectUnauthorized: false },
    });

    const client = await pool.connect();
    console.log("✅ Conectado a PostgreSQL con SSL (Supabase)");
    client.release();
  } catch (err) {
    if (err.message.includes("does not support SSL")) {
      console.warn("⚠️ Supabase no acepta SSL, reintentando sin SSL...");

      pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: String(process.env.DB_PASSWORD).trim(),
        port: process.env.DB_PORT,
        ssl: false,
      });

      const client = await pool.connect();
      console.log("✅ Conectado a PostgreSQL sin SSL (modo local)");
      client.release();
    } else {
      console.error("❌ Error de conexión a PostgreSQL:", err.message);
    }
  }
}

conectarPostgres(); //ejecutar conexion al cargar el modulo

// ==========================================================================
// FUNCIÓN GENÉRICA DE CONSULTA
// ==========================================================================
/**
 * Ejecuta consultas SQL en la base de datos
 * @param {string} text - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros para la consulta
 */
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error("❌ Error en la consulta SQL:", err.message);
    throw err;
  } finally {
    client.release();
  }
};

// ==========================================================================
// CONSULTAS DE NEGOCIO
// ==========================================================================

/**
 * Obtiene todos los municipios registrados
 * @returns {Promise<Array>} Lista de municipios con sus coordenadas
 */
const getMunicipios = async () => {
  const sql = `
    SELECT id_municipio, nombre_municipio, latitud, longitud
    FROM municipios
    ORDER BY nombre_municipio;
  `;
  const res = await query(sql);
  return res.rows;
};

/**
 * Obtiene las estaciones de un municipio con su última ubicación conocida
 * @param {number} id_municipio - ID del municipio a consultar
 */
const getEstacionesPorMunicipio = async (id_municipio) => {
  const sql = `
    SELECT e.id_estacion, e.nombre_estacion, u.id_ubicacion, u.latitud, u.longitud, u.anio
    FROM estaciones e
    JOIN ubicaciones_estaciones u ON e.id_estacion = u.id_estacion
    WHERE e.id_municipio = $1
      AND u.anio = (
        SELECT MAX(anio)
        FROM ubicaciones_estaciones
        WHERE id_estacion = e.id_estacion
      )
    ORDER BY e.nombre_estacion;
  `;
  const res = await query(sql, [id_municipio]);
  return res.rows;
};

// Devuelve el diccionario de contaminantes
/**
 * Obtiene información de referencia sobre contaminantes
 * @returns {Promise<Array>} Lista de contaminantes con sus descripciones
 */
const getDiccionario = async () => {
  const sql = `
    SELECT 
      id_contaminante as id,
      simbolo,
      nombre,
      que_es,
      causas,
      consecuencias,
      color_hex
    FROM diccionario_contaminantes
    WHERE activo = true
    ORDER BY orden_visualizacion;
  `;
  const res = await query(sql);
  return res.rows;
};

// prepara el proximo filtro (años) segun la informacion de un municipio (por ej. si solo tiene 2 años de mediciones)
// entonces prepara el filtro y solo muestra esos 2 años en el frontend

/**
 * Obtiene los años con datos disponibles para un municipio
 * @param {number} idMunicipio - ID del municipio
 */
const getAniosPorMunicipio = async (idMunicipio) => {
  try {
    const query = `
      SELECT 
        m.nombre_municipio,
        ARRAY_AGG(DISTINCT med.anio ORDER BY med.anio DESC) AS anios_disponibles
      FROM municipios m
      INNER JOIN estaciones e ON m.id_municipio = e.id_municipio
      INNER JOIN mediciones med ON e.id_estacion = med.id_estacion
      WHERE m.id_municipio = $1
      GROUP BY m.nombre_municipio
    `;
    
    const resultado = await pool.query(query, [idMunicipio]);
    
    if (resultado.rows.length === 0) {
      return null;
    }
    
    return {
      municipio: resultado.rows[0].nombre_municipio,
      anios_disponibles: resultado.rows[0].anios_disponibles
    };
    
  } catch (error) {
    console.error('Error al obtener años por municipio:', error);
    throw error;
  }
};

/**
 * Obtiene estaciones activas en un municipio para un año específico
 */
const getEstacionesPorMunicipioYAnio = async (idMunicipio, anio) => {
  try {
    const sql = `
      WITH estaciones_con_mediciones AS (
        -- Paso 1: Identificar estaciones que tienen mediciones en el año solicitado
        SELECT DISTINCT e.id_estacion, e.nombre_estacion, e.tipo_estacion
        FROM estaciones e
        INNER JOIN mediciones med ON e.id_estacion = med.id_estacion
        WHERE e.id_municipio = $1 
          AND med.anio = $2
      ),
      ubicaciones_validas AS (
        -- Paso 2: Obtener la ubicación más reciente (año <= solicitado) para cada estación
        SELECT 
          ue.id_estacion,
          ue.id_ubicacion,
          ue.latitud,
          ue.longitud,
          ue.anio,
          ROW_NUMBER() OVER (
            PARTITION BY ue.id_estacion 
            ORDER BY ue.anio DESC
          ) AS rn
        FROM ubicaciones_estaciones ue
        WHERE ue.anio <= $2
      )
      -- Paso 3: Unir estaciones operativas con sus ubicaciones válidas
      SELECT 
        ecm.id_estacion,
        ecm.nombre_estacion,
        ecm.tipo_estacion,
        uv.id_ubicacion,
        uv.latitud,
        uv.longitud,
        uv.anio AS anio_ubicacion
      FROM estaciones_con_mediciones ecm
      INNER JOIN ubicaciones_validas uv 
        ON ecm.id_estacion = uv.id_estacion 
        AND uv.rn = 1
      ORDER BY ecm.nombre_estacion;
    `;
    
    const resultado = await pool.query(sql, [idMunicipio, anio]);
    
    return resultado.rows;
    
  } catch (error) {
    console.error('Error al obtener estaciones por municipio y año:', error);
    throw error;
  }
};

/**
 * Obtiene los contaminantes medidos en una estación en un año
 */
const getContaminantesPorEstacionYAnio = async (idEstacion, anio) => {
  try {
    const sql = `
      SELECT DISTINCT
        va.id_variable_ambiental,
        va.nombre_variable AS simbolo,
        va.unidades,
        te.id_exposicion,
        te.tiempo_horas,
        -- Construir etiqueta legible para el tiempo de exposición
        CASE 
          WHEN te.tiempo_horas = 1 THEN '1 hora'
          WHEN te.tiempo_horas = 3 THEN '3 horas'
          WHEN te.tiempo_horas = 8 THEN '8 horas'
          WHEN te.tiempo_horas = 24 THEN '24 horas'
          ELSE te.tiempo_horas || ' horas'
        END AS tiempo_exposicion_texto
      FROM mediciones m
      INNER JOIN tiempos_exposicion te ON m.id_exposicion = te.id_exposicion
      INNER JOIN variables_ambientales va ON te.id_variable_ambiental = va.id_variable_ambiental
      WHERE m.id_estacion = $1 
        AND m.anio = $2
        AND va.es_contaminante = true
      ORDER BY va.nombre_variable, te.tiempo_horas;
    `;
    
    const resultado = await pool.query(sql, [idEstacion, anio]);
    
    // Agrupar por contaminante para facilitar uso en frontend
    const contaminantesAgrupados = {};
    
    resultado.rows.forEach(row => {
      const simbolo = row.simbolo;
      
      if (!contaminantesAgrupados[simbolo]) {
        contaminantesAgrupados[simbolo] = {
          id_variable_ambiental: row.id_variable_ambiental,
          simbolo: row.simbolo,
          unidades: row.unidades,
          tiempos_exposicion: []
        };
      }
      
      contaminantesAgrupados[simbolo].tiempos_exposicion.push({
        id_exposicion: row.id_exposicion,
        tiempo_horas: row.tiempo_horas,
        tiempo_texto: row.tiempo_exposicion_texto
      });
    });
    
    // Convertir objeto a array
    return Object.values(contaminantesAgrupados);
    
  } catch (error) {
    console.error('Error al obtener contaminantes por estación y año:', error);
    throw error;
  }
};

/**
 * Evalúa la calidad del aire (Buena, Regular, Mala)
 * Clasifica los niveles de contaminantes basándose en las Guías de Calidad del Aire (AQG) de la OMS 2021.
 *
 * @param {string} contaminante - Símbolo del contaminante ('PM2.5', 'O3', 'NO2', etc.).
 * @param {number} valor - Valor de la concentración del contaminante.
 * @param {number} tiempoHoras - Tiempo de exposición para el límite (1, 8, 24, etc.).
 * @returns {{nivel: string, color: string, descripcion: string, limites_oms: Object}} Objeto con la clasificación.
 */
function clasificarCalidadAire(contaminante, valor, tiempoHoras) {
  // 🆕 DEBUG: Ver qué está recibiendo la función
  console.log("═══════════════════════════════════════");
  console.log("🔬 ENTRADA clasificarCalidadAire:");
  console.log("   Contaminante recibido:", `"${contaminante}"`);
  console.log("   Tipo:", typeof contaminante);
  console.log("   Valor:", valor);
  console.log("   Tiempo horas:", tiempoHoras);
  
  if (valor === null || valor === undefined || isNaN(valor)) {
    console.log("❌ Valor inválido, retornando 'Sin datos'");
    return {
      nivel: "Sin datos",
      color: "#9E9E9E",
      descripcion: "No hay información disponible para esta medición"
    };
  }

  // Límites OMS 2021
  const limites = {
    'O3': {
      1: [100, 160],
      8: [60, 100]
    },
    'PM10': {
      1: [50, 100],
      24: [45, 75]
    },
    'PM2.5': {
      1: [15, 25],
      24: [15, 25]
    },
    'SO2': {
      1: [100, 196],
      3: [100, 250],
      24: [40, 125]
    },
    'NO2': {
      1: [200, 360],
      24: [25, 50]
    },
    'CO': {
      1: [4000, 10000],
      8: [7000, 10000]
    },
    'NO': {
      1: [100, 200]
    }
  };

  // DEBUG: Ver si encuentra el contaminante
  console.log("   ¿Existe en límites?", contaminante in limites);
  console.log("   Límites disponibles:", Object.keys(limites));

  const rangosContaminante = limites[contaminante];
  if (!rangosContaminante) {
    console.log("❌ No se encontró el contaminante en los límites");
    return {
      nivel: "Sin datos",
      color: "#9E9E9E",
      descripcion: `No hay parámetros de referencia para ${contaminante}`
    };
  }

  const rangos = rangosContaminante[tiempoHoras];
  if (!rangos) {
    console.log("❌ No se encontró el tiempo de exposición");
    return {
      nivel: "Sin datos",
      color: "#9E9E9E",
      descripcion: `No hay parámetros para ${contaminante} con ${tiempoHoras}h de exposición`
    };
  }

  const [limiteBuena, limiteRegular] = rangos;

  // DEBUG: Ver la comparación
  console.log("   Límites encontrados: [", limiteBuena, ",", limiteRegular, "]");
  console.log("   Comparación:");
  console.log("     ¿", valor, "<=", limiteBuena, "?", valor <= limiteBuena);
  console.log("     ¿", valor, "<=", limiteRegular, "?", valor <= limiteRegular);

  // Clasificar según los límites
  let resultado;
  if (valor <= limiteBuena) {
    resultado = {
      nivel: "Buena",
      color: "#00E400",
      descripcion: "La calidad del aire cumple con los estándares de la OMS y no representa riesgo para la salud"
    };
  } else if (valor <= limiteRegular) {
    resultado = {
      nivel: "Regular",
      color: "#ff8800",
      descripcion: "La calidad del aire supera las recomendaciones de la OMS. Puede afectar a personas sensibles (niños, ancianos, personas con enfermedades respiratorias)"
    };
  } else {
    resultado = {
      nivel: "Mala",
      color: "#FF0000",
      descripcion: "La calidad del aire supera significativamente los límites seguros de la OMS y puede afectar la salud de toda la población"
    };
  }
  
  // 🆕 Agregamos la referencia de límites OMS
  resultado.limites_oms = {
    buena: limiteBuena,
    regular: limiteRegular,
    tiempo_horas: tiempoHoras,
    fuente: "OMS 2021"
  };

  console.log("✅ RESULTADO:", resultado.nivel, "-", resultado.color);
  console.log("═══════════════════════════════════════\n");
  
  return resultado;
}

/**
 * Provee descripciones de los niveles de calidad del aire
 */
function obtenerDescripcionNivel(nivel) {
  const descripciones = {
    'Buena': 'La calidad del aire es satisfactoria y no representa riesgo para la salud',
    'Regular': 'La calidad del aire es aceptable, pero puede afectar a personas sensibles',
    'Mala': 'La calidad del aire es mala y puede afectar la salud de la población',
    'Sin datos': 'No hay información disponible'
  };
  return descripciones[nivel] || 'Sin descripción disponible';
}

/**
 * Obtiene el histórico completo de mediciones para un contaminante
 */
const getDatosHistoricosPorContaminante = async (idEstacion, anio, idExposicion) => {
  try {
    const sql = `
      SELECT 
        -- Datos de la medición
        m.id_medicion,
        m.anio,
        m.promedio,
        m.mediana,
        m.percentil_98,
        m.maximo,
        m.minimo,
        m.excedencias_limite_actual,
        m.porcentaje_excedencias,
        m.dias_excendecias,
        m.no_datos,
        m.representatividad_temporal,
        m.fecha_hora_maximo,
        m.fecha_hora_minimo,
        
        -- Información de la estación
        e.id_estacion,
        e.nombre_estacion,
        e.tipo_estacion,
        
        -- Información del municipio
        mun.id_municipio,
        mun.nombre_municipio,
        
        -- Información del contaminante
        va.id_variable_ambiental,
        va.nombre_variable AS simbolo_contaminante,
        va.unidades,
        
        -- Información del tiempo de exposición
        te.id_exposicion,
        te.tiempo_horas,
        CASE 
          WHEN te.tiempo_horas = 1 THEN '1 hora'
          WHEN te.tiempo_horas = 3 THEN '3 horas'
          WHEN te.tiempo_horas = 8 THEN '8 horas'
          WHEN te.tiempo_horas = 24 THEN '24 horas'
          ELSE te.tiempo_horas || ' horas'
        END AS tiempo_exposicion_texto
        
      FROM mediciones m
      INNER JOIN estaciones e ON m.id_estacion = e.id_estacion
      INNER JOIN municipios mun ON e.id_municipio = mun.id_municipio
      INNER JOIN tiempos_exposicion te ON m.id_exposicion = te.id_exposicion
      INNER JOIN variables_ambientales va ON te.id_variable_ambiental = va.id_variable_ambiental
      WHERE m.id_estacion = $1 
        AND m.anio = $2 
        AND m.id_exposicion = $3
      LIMIT 1;
    `;
    
    const resultado = await pool.query(sql, [idEstacion, anio, idExposicion]);
    
    if (resultado.rows.length === 0) {
      return null;
    }
    
    const datos = resultado.rows[0];
    
    // Clasificar calidad del aire
    const clasificacion = clasificarCalidadAire(
      datos.simbolo_contaminante, 
      parseFloat(datos.promedio),
      datos.tiempo_horas
    );
    
    // Estructurar respuesta
    return {
      estacion: {
        nombre: datos.nombre_estacion,
        tipo: datos.tipo_estacion,
        municipio: datos.nombre_municipio,
      },
      anio: datos.anio,
      contaminante: {
        id_variable: datos.id_variable_ambiental,
        simbolo: datos.simbolo_contaminante,
        unidades: datos.unidades,
        tiempo_exposicion: {
          id: datos.id_exposicion,
          horas: datos.tiempo_horas,
          texto: datos.tiempo_exposicion_texto
        }
      },
      estadisticas: {
        promedio: parseFloat(datos.promedio),
        mediana: parseFloat(datos.mediana),
        percentil_98: parseFloat(datos.percentil_98),
        maximo: parseFloat(datos.maximo),
        minimo: parseFloat(datos.minimo),
        fecha_hora_maximo: datos.fecha_hora_maximo,
        fecha_hora_minimo: datos.fecha_hora_minimo
      },
      excedencias: {
        dias_excendecias: datos.dias_excendecias,
        excedencias_limite_actual: datos.excedencias_limite_actual,
        porcentaje_excedencias: parseFloat(datos.porcentaje_excedencias)
      },
      calidad_datos: {
        representatividad_temporal: parseFloat(datos.representatividad_temporal),
      },
      clasificacion: clasificacion
    };
    
  } catch (error) {
    console.error('Error al obtener datos históricos:', error);
    throw error;
  }
};

// ==========================================================================
// EXPORTACIÓN DEL MÓDULO
// ==========================================================================

//Interfaz pública del módulo de base de datos, usada en otros archivos
module.exports = {
  query,
  getMunicipios,
  getEstacionesPorMunicipio,
  getDiccionario,
  getAniosPorMunicipio,
  getEstacionesPorMunicipioYAnio,
  getContaminantesPorEstacionYAnio,
  getDatosHistoricosPorContaminante
};
