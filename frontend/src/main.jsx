import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App.jsx';

const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
const canonicalUrl = `${siteUrl}/`;
const socialImageUrl = `${siteUrl}/og-image.svg`;

document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
document.querySelector('meta[property="og:image"]')?.setAttribute('content', socialImageUrl);
document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', socialImageUrl);

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AirSense',
  url: canonicalUrl,
  image: socialImageUrl,
  description: 'Explora datos históricos de calidad del aire, estaciones de monitoreo y contaminantes del Valle del Cauca, Colombia.',
  applicationCategory: 'Environmental monitoring',
  operatingSystem: 'Any',
  inLanguage: 'es-CO',
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Valle del Cauca, Colombia',
  },
};
const structuredDataScript = document.querySelector('#airsense-structured-data');
if (structuredDataScript) {
  structuredDataScript.textContent = JSON.stringify(structuredData);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
