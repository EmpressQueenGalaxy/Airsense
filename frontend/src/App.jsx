import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { apiClient } from './api.js';

const defaultCenter = [4, -76.55];
const defaultZoom = 8.5;

const stationIcon = (selected) =>
  L.divIcon({
    className: 'station-marker-wrapper',
    html: `<span class="station-marker${selected ? ' station-marker--selected' : ''}"></span>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -34],
  });

function MapViewport({ selectedStation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedStation) {
      map.flyTo([selectedStation.latitud, selectedStation.longitud], 14);
    }
  }, [map, selectedStation]);

  return null;
}

function SelectField({ label, value, onChange, disabled, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={onChange} disabled={disabled}>
        {children}
      </select>
    </label>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
      {unit && <small>{unit}</small>}
    </article>
  );
}

function QualityPanel({ result, onExample }) {
  if (!result) {
    return (
      <article className="quality-panel quality-panel--empty">
        <span className="badge">Resultado de consulta</span>
        <h3>Tu lectura aparecerá aquí</h3>
        <p>Selecciona una estación y un contaminante para convertir los datos en una historia clara sobre el aire.</p>
        <button className="button button-primary example-button" onClick={onExample}>Ver ejemplo</button>
      </article>
    );
  }

  const { clasificacion, contaminante, estacion, estadisticas } = result;
  return (
    <article className="quality-panel" style={{ '--quality-color': clasificacion?.color || 'var(--lime)' }}>
      <div className="quality-top">
        <span className="badge">Lectura seleccionada</span>
        <span>{result.anio}</span>
      </div>
      <h3>{clasificacion?.nivel || 'Sin datos'}</h3>
      <p className="quality-context">
        {contaminante?.simbolo} · promedio anual
      </p>
      <div className="quality-reading">
        <strong>{estadisticas?.promedio ?? '—'}</strong>
        <span>{contaminante?.unidades || 'unidades'}<br />promedio</span>
      </div>
      <p className="quality-description">
        {clasificacion?.descripcion || 'No hay información suficiente para clasificar esta medición.'}
      </p>
      <div className="quality-meta">
        <span>{estacion?.nombre}</span>
        <span>{estacion?.municipio}</span>
        <span>{clasificacion?.fuente || result.fuente || 'Datos públicos'}</span>
      </div>
    </article>
  );
}

function App() {
  const [municipios, setMunicipios] = useState([]);
  const [years, setYears] = useState([]);
  const [stations, setStations] = useState([]);
  const [pollutants, setPollutants] = useState([]);
  const [dictionary, setDictionary] = useState([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedPollutant, setSelectedPollutant] = useState('');
  const [selectedStationData, setSelectedStationData] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('Cargando información del territorio...');
  const [error, setError] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dictionaryOffset, setDictionaryOffset] = useState(0);
  const [openDictionaryId, setOpenDictionaryId] = useState(null);

  const selectedPollutantData = useMemo(
    () => pollutants.flatMap((pollutant) => pollutant.tiempos_exposicion.map((exposure) => ({
      ...exposure,
      simbolo: pollutant.simbolo,
      unidades: pollutant.unidades,
    }))).find((item) => String(item.id_exposicion) === selectedPollutant),
    [pollutants, selectedPollutant],
  );

  useEffect(() => {
    Promise.all([apiClient('/municipios'), apiClient('/diccionario')])
      .then(([municipiosData, dictionaryData]) => {
        setMunicipios(municipiosData);
        setDictionary(dictionaryData);
        setStatus('');
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus('');
      });
  }, []);

  useEffect(() => {
    const updateScrollProgress = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0);
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    if (!selectedMunicipio) {
      setYears([]);
      setStations([]);
      setSelectedYear('');
      setSelectedStation('');
      setSelectedStationData(null);
      return;
    }

    setStatus('Buscando años con mediciones disponibles...');
    setError('');
    apiClient(`/anios/${selectedMunicipio}`)
      .then((data) => {
        const availableYears = data.anios_disponibles;
        setYears(availableYears);
        if (availableYears.length === 1) setSelectedYear(String(availableYears[0]));
        setStatus('');
      })
      .catch((loadError) => {
        setYears([]);
        setError(loadError.message);
        setStatus('');
      });
  }, [selectedMunicipio]);

  useEffect(() => {
    if (!selectedMunicipio || !selectedYear) {
      setStations([]);
      setSelectedStation('');
      setSelectedStationData(null);
      return;
    }

    setStatus('Localizando estaciones de monitoreo...');
    setError('');
    apiClient(`/estaciones/${selectedMunicipio}/${selectedYear}`)
      .then((data) => {
        const availableStations = data.estaciones;
        setStations(availableStations);
        if (availableStations.length === 1) {
          selectStation(availableStations[0].id_estacion);
        } else {
          setSelectedStation('');
          setSelectedStationData(null);
        }
        setStatus('');
      })
      .catch((loadError) => {
        setStations([]);
        setError(loadError.message);
        setStatus('');
      });
  }, [selectedMunicipio, selectedYear]);

  useEffect(() => {
    if (!selectedStation || !selectedYear) {
      setPollutants([]);
      setSelectedPollutant('');
      return;
    }

    setStatus('Revisando contaminantes medidos...');
    setError('');
    apiClient(`/contaminantes/${selectedStation}/${selectedYear}`)
      .then((data) => {
        const availablePollutants = data.contaminantes;
        const exposureOptions = availablePollutants.flatMap((pollutant) => pollutant.tiempos_exposicion);
        setPollutants(availablePollutants);
        setSelectedPollutant(exposureOptions.length === 1 ? String(exposureOptions[0].id_exposicion) : '');
        setStatus('');
      })
      .catch((loadError) => {
        setPollutants([]);
        setError(loadError.message);
        setStatus('');
      });
  }, [selectedStation, selectedYear]);

  const selectStation = (stationId) => {
    const station = stations.find((item) => String(item.id_estacion) === String(stationId));
    setSelectedStation(String(stationId));
    setSelectedStationData(station || null);
  };

  const clearFilters = () => {
    setSelectedMunicipio('');
    setSelectedYear('');
    setSelectedStation('');
    setSelectedPollutant('');
    setStations([]);
    setPollutants([]);
    setSelectedStationData(null);
    setResult(null);
    setError('');
  };

  const loadData = () => {
    if (!selectedStation || !selectedYear || !selectedPollutant) return;
    setStatus('Preparando una lectura de calidad...');
    setError('');
    apiClient(`/datos?estacion=${selectedStation}&anio=${selectedYear}&exposicion=${selectedPollutant}`)
      .then((data) => {
        setResult(data);
        setStatus('');
      })
      .catch((loadError) => {
        setResult(null);
        setError(loadError.message);
        setStatus('');
      });
  };

  const loadExample = async () => {
    setStatus('Cargando una consulta de ejemplo...');
    setError('');
    setResult(null);

    try {
      let example = null;
      for (const municipio of municipios) {
        const yearsData = await apiClient(`/anios/${municipio.id_municipio}`);
        const availableYear = yearsData.anios_disponibles?.[0];
        if (!availableYear) continue;

        const stationsData = await apiClient(`/estaciones/${municipio.id_municipio}/${availableYear}`);
        const station = stationsData.estaciones?.[0];
        if (!station) continue;

        const pollutantsData = await apiClient(`/contaminantes/${station.id_estacion}/${availableYear}`);
        const exposure = pollutantsData.contaminantes
          ?.flatMap((pollutant) => pollutant.tiempos_exposicion)
          .find((item) => item.id_exposicion);
        if (!exposure) continue;

        example = {
          municipio,
          year: String(availableYear),
          station,
          pollutants: pollutantsData.contaminantes,
          exposure: String(exposure.id_exposicion),
        };
        break;
      }

      if (!example) throw new Error('No hay una combinación de consulta disponible para mostrar.');

      setSelectedMunicipio(String(example.municipio.id_municipio));
      setYears([Number(example.year)]);
      setSelectedYear(example.year);
      setStations([example.station]);
      setSelectedStation(String(example.station.id_estacion));
      setSelectedStationData(example.station);
      setPollutants(example.pollutants);
      setSelectedPollutant(example.exposure);
      const data = await apiClient(`/datos?estacion=${example.station.id_estacion}&anio=${example.year}&exposicion=${example.exposure}`);
      setResult(data);
      setStatus('');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('');
    }
  };

  const mapTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="app app--dark">
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${scrollProgress / 100})` }} />
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#inicio" aria-label="AirSense, volver al inicio">
            <span className="brand-mark">✦</span>
            <span className="brand-copy">
              <span className="brand-name">AirSense</span>
            </span>
          </a>
          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#sobre-airsense">Sobre AirSense</a>
            <a href="#explorar">Explorar</a>
            <a href="#resultado">Resultados</a>
            <a href="#diccionario">Diccionario</a>
            <a href="#fuentes">Fuentes</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-glow" />
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Valle del Cauca · Colombia</span>
              <h1>Entender el aire es <em>cuidar la vida.</em></h1>
              <p className="hero-lead">
                Explora 13 años de historia ambiental —de 2011 a 2023— y conoce el comportamiento de 7 contaminantes que afectan la calidad del aire en el Valle del Cauca.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#explorar">Comenzar a explorar</a>
                <a className="button button-quiet" href="#diccionario">Conocer los contaminantes</a>
              </div>
            </div>
            <div className="air-visual" aria-label="Visualización de monitoreo de calidad del aire">
              <div className="air-atmosphere">
                <span className="atmosphere-glow" />
                <span className="atmosphere-ring ring-one" />
                <span className="atmosphere-ring ring-two" />
                <span className="atmosphere-ring ring-three" />
                <span className="air-particle particle-one" />
                <span className="air-particle particle-two" />
                <span className="air-particle particle-three" />
                <div className="air-core" />
              </div>
            </div>
          </div>
        </section>

        <section className="section overview-section" id="sobre-airsense">
          <div className="container">
            <div className="section-head overview-head">
              <div><span className="section-kicker">¿Qué es AirSense?</span><h2>Los datos del aire, más fáciles de entender.</h2></div>
              <p>AirSense permite explorar registros históricos de calidad del aire en el Valle del Cauca entre 2011 y 2023. Organiza la consulta por municipio, año, estación y contaminante para facilitar el acceso a la información ambiental del territorio.</p>
            </div>
            <h3 className="overview-subtitle">¿Cómo consultar?</h3>
            <div className="overview-grid">
              <article className="overview-card"><span className="overview-number">01</span><h3>Pregunta por un lugar</h3><p>Comienza con un municipio y encuentra las estaciones disponibles para esa zona.</p></article>
              <article className="overview-card"><span className="overview-number">02</span><h3>Elige un momento</h3><p>Explora los años con información disponible y evita asumir que todos los periodos tienen la misma cobertura.</p></article>
              <article className="overview-card"><span className="overview-number">03</span><h3>Interpreta una lectura</h3><p>Consulta un contaminante, su tiempo de exposición y sus estadísticas antes de sacar conclusiones.</p></article>
            </div>
          </div>
        </section>

        <section className="section" id="explorar">
          <div className="container">
            <div className="section-head">
              <div><span className="section-kicker">Explora el territorio</span><h2>Una lectura situada del aire.</h2></div>
              <p>Elige un lugar, un momento y una estación para descubrir qué estaba pasando en el aire.</p>
            </div>

            <div className="exploration-grid">
            <div className="query-panel">
              <div className="query-head">
                <div><span className="badge">Consulta guiada</span></div>
                <button className="button button-reset" onClick={clearFilters}>Limpiar selección ↺</button>
              </div>
              <div className="query-grid">
                <SelectField label="01 · Lugar" value={selectedMunicipio} onChange={(event) => setSelectedMunicipio(event.target.value)}>
                  <option value="">Selecciona un municipio</option>
                  {municipios.map((municipio) => <option key={municipio.id_municipio} value={municipio.id_municipio}>{municipio.nombre_municipio}</option>)}
                </SelectField>
                <SelectField label="02 · Tiempo" value={selectedYear} disabled={!selectedMunicipio} onChange={(event) => setSelectedYear(event.target.value)}>
                  <option value="">Elige un año</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </SelectField>
                <SelectField label="03 · Estación" value={selectedStation} disabled={!selectedYear} onChange={(event) => selectStation(event.target.value)}>
                  <option value="">Elige una estación</option>
                  {stations.map((station) => <option key={station.id_estacion} value={station.id_estacion}>{station.nombre_estacion}</option>)}
                </SelectField>
                <SelectField label="04 · Medición" value={selectedPollutant} disabled={!selectedStation} onChange={(event) => setSelectedPollutant(event.target.value)}>
                  <option value="">Elige un contaminante</option>
                  {pollutants.flatMap((pollutant) => pollutant.tiempos_exposicion.map((exposure) => (
                    <option key={exposure.id_exposicion} value={exposure.id_exposicion}>{pollutant.simbolo} · {exposure.tiempo_texto}</option>
                  )))}
                </SelectField>
                <button className="button button-primary query-submit" disabled={!selectedPollutant} onClick={loadData}>Ver lectura</button>
              </div>
              <div className="query-footer">
                <span>{error || status || (selectedPollutantData ? `${selectedPollutantData.simbolo} · ${selectedPollutantData.tiempo_texto}` : 'Completa los cuatro pasos para consultar')}</span>
              </div>
            </div>

            <div className="workspace">
              <section className="map-reading-grid">
              <section className="panel map-panel" aria-labelledby="map-title">
                <div className="panel-heading"><div><span className="section-kicker">Mapa interactivo</span><h3 id="map-title">¿Dónde estamos mirando?</h3></div><span className="map-status">{stations.length} estaciones visibles</span></div>
                <div className="map-shell">
                  <MapContainer center={defaultCenter} zoom={defaultZoom} className="map">
                    <TileLayer url={mapTiles} attribution="© OpenStreetMap contributors" />
                    <MapViewport selectedStation={selectedStationData} />
                    {municipios.map((municipio) => (
                      <CircleMarker key={municipio.id_municipio} center={[municipio.latitud, municipio.longitud]} radius={selectedMunicipio === String(municipio.id_municipio) ? 9 : 6} eventHandlers={{ click: () => setSelectedMunicipio(String(municipio.id_municipio)) }}>
                        <Popup>{municipio.nombre_municipio}</Popup>
                      </CircleMarker>
                    ))}
                    {stations.map((station) => (
                      <Marker key={station.id_estacion} position={[station.latitud, station.longitud]} icon={stationIcon(selectedStation === String(station.id_estacion))} eventHandlers={{ click: () => selectStation(station.id_estacion) }}>
                        <Popup><strong>{station.nombre_estacion}</strong><br />{station.tipo_estacion || 'Estación de monitoreo'}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                  <span className="map-coordinates">Valle del Cauca · vista regional</span>
                </div>
                <div className="legend"><span className="legend-item"><i className="legend-dot legend-good" />Municipios</span><span className="legend-item"><i className="legend-dot legend-regular" />Estaciones activas</span><span className="legend-item"><i className="legend-dot legend-muted" />Sin selección</span></div>
              </section>

              <aside className="result-stack" id="resultado">
                <QualityPanel result={result} onExample={loadExample} />
              </aside>
              </section>
            </div>
            </div>

            {result && (
              <section className="stats-grid" aria-label="Estadísticas de la medición">
                <StatCard label="Promedio" value={result.estadisticas?.promedio} unit={result.contaminante?.unidades} />
                <StatCard label="Mediana" value={result.estadisticas?.mediana} unit={result.contaminante?.unidades} />
                <StatCard label="Máximo" value={result.estadisticas?.maximo} unit={result.contaminante?.unidades} />
                <StatCard label="Mínimo" value={result.estadisticas?.minimo} unit={result.contaminante?.unidades} />
                <StatCard label="Percentil 98" value={result.estadisticas?.percentil_98} unit={result.contaminante?.unidades} />
                <StatCard label="Representatividad" value={result.calidad_datos?.representatividad_temporal} unit="%" />
              </section>
            )}
          </div>
        </section>

        <section className="section section-muted" id="diccionario">
          <div className="container dictionary-layout">
            <div><span className="section-kicker">Diccionario de contaminantes</span><h2>Conoce qué estamos midiendo.</h2><p className="section-lead">Una guía sencilla para entender los 7 contaminantes monitoreados, sus fuentes y el impacto que pueden tener en la salud y el ambiente.</p></div>
            <div className="dictionary-carousel" aria-label="Carrusel de contaminantes">
              <div className="dictionary-carousel-controls">
                <span>{dictionary.length ? `${dictionaryOffset + 1}–${Math.min(dictionaryOffset + 4, dictionary.length)} de ${dictionary.length}` : 'Cargando...'}</span>
                <div>
                  <button className="carousel-button" onClick={() => setDictionaryOffset(Math.max(0, dictionaryOffset - 1))} disabled={dictionaryOffset === 0} aria-label="Ver contaminantes anteriores">Anterior</button>
                  <button className="carousel-button" onClick={() => setDictionaryOffset(Math.min(Math.max(0, dictionary.length - 4), dictionaryOffset + 1))} disabled={dictionaryOffset >= Math.max(0, dictionary.length - 4)} aria-label="Ver contaminantes siguientes">Siguiente</button>
                </div>
              </div>
              <div className="dictionary-list">
                {dictionary.length === 0 ? <p>Cargando el diccionario...</p> : dictionary.slice(dictionaryOffset, dictionaryOffset + 4).map((item, index) => (
                  <article className={`dictionary-item dictionary-item--${index % 2 ? 'yellow' : 'peach'} ${openDictionaryId === item.id ? 'is-flipped' : ''}`} key={item.id}>
                    <div className="dictionary-card-face dictionary-card-front">
                      <button className="dictionary-card-button" onClick={() => setOpenDictionaryId(openDictionaryId === item.id ? null : item.id)} aria-label={`Conocer más sobre ${item.nombre}`}>
                        <span className="dictionary-card-art"><b className="pollutant-code" style={{ background: item.color_hex || undefined }}>{item.simbolo}</b><small>CONTAMINANTE 0{dictionaryOffset + index + 1}</small><strong>{item.nombre}</strong></span><span className="dictionary-plus">Ver detalles +</span>
                      </button>
                    </div>
                    <div className="dictionary-card-face dictionary-card-back">
                      <button className="dictionary-card-button" onClick={() => setOpenDictionaryId(null)} aria-label={`Cerrar información sobre ${item.nombre}`}>
                        <span className="dictionary-card-art"><small>{item.simbolo} · DETALLE</small><strong>{item.nombre}</strong></span><span className="dictionary-plus">Cerrar</span>
                        <span className="dictionary-content"><p>{item.que_es}</p>{item.causas && <p><strong>Fuentes:</strong> {item.causas}</p>}{item.consecuencias && <p><strong>Impacto:</strong> {item.consecuencias}</p>}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="sources-section" id="fuentes">
        <div className="container">
          <div className="sources-heading"><span className="section-kicker">Fuentes y documentación</span><h2>De dónde salen los resultados.</h2></div>
          <div className="source-grid">
            <article><h3>CVC</h3><p>Corporación Autónoma Regional del Valle del Cauca. Operador de estaciones departamentales.</p></article>
            <article><h3>DAGMA Cali</h3><p>Red urbana de monitoreo del Distrito Especial de Santiago de Cali.</p></article>
            <article><h3>Datos abiertos</h3><p>Información pública para consultar y comprender el comportamiento ambiental.</p></article>
            <article><h3>IDEAM &amp; ANLA</h3><p>Referentes nacionales para criterios de calidad y representatividad.</p></article>
          </div>
          <div className="methodology"><strong>Nota metodológica</strong><p>Las consultas muestran datos ambientales históricos disponibles para cada estación, año y tiempo de exposición. No sustituyen diagnósticos médicos ni evaluaciones particulares.</p></div>
        </div>
      </section>

      <footer className="site-footer"><div className="container footer-inner"><div><span className="brand-name">● AirSense Valle del Cauca</span><p>Infraestructura cívica de datos ambientales para el cuidado de la salud colectiva y la biósfera.</p></div><div className="footer-links"><span><strong>Fuentes oficiales</strong>CVC · DAGMA Cali<br />IDEAM · Datos abiertos</span><span><strong>Estándares</strong>Resolución 2254 de 2017<br />Protocolo OMS 2021</span></div><small>© 2025 AirSense · Datos públicos para decisiones informadas.</small></div></footer>
    </div>
  );
}

export default App;
