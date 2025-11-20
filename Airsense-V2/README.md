# AirSense 🌍💨

**Interactive geospatial viewer for historical air quality data (Valle del Cauca, Colombia — 2011–2023).**

---

## Overview
AirSense is a web application that visualizes historical air quality data across 10 municipalities of Valle del Cauca. The platform provides an interactive map with monitoring stations, filters by municipality, year, and pollutant, and a color-coded legend aligned with environmental quality standards to help citizens, authorities, researchers, and organizations make informed decisions.

---

## Features
- Interactive map of Valle del Cauca with panning and zoom.
- Display of monitoring stations as map markers.
- Filters by municipality, year, and pollutant (contaminant).
- Color-coded legend to interpret air quality levels.
- Compound (pollutant) dictionary for non-technical users.

---

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript, Leaflet.js, Tailwind CSS
- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL  
- **Hosting:** Vercel

---

## Data Sources
- Historical datasets: DAGMA, CVC, regional monitoring stations, public community sensors (all public datasets).  
- Time range: 2011 — 2023.  
- ~24 monitored chemical compounds across 10 municipalities.
- **Official Data Source:** [Calidad Del Aire En Colombia - Promedio Anual](https://www.datos.gov.co/Ambiente-y-Desarrollo-Sostenible/Calidad-Del-Aire-En-Colombia-Promedio-Anual-/kekd-7v7h/about_data)

---

## Prerequisites (developers)
> **Note:** Many environment-specific details are currently **Por definir**. This is a placeholder list until the project reaches implementation:

- **Git:** To clone the repository.
- **Node.js:** Version 18.x or higher (recommended for stability and compatibility with project dependencies).
- **Access credentials:** A `.env` file with database credentials is required to run the backend. Contact the team for access details.
- (Optional) PostgreSQL client tools for local queries (if needed).

---

## Installation

> **Important for local development:**  
> This project is optimized for cloud deployment (Vercel/Render). Running it locally requires additional setup steps (like compiling Tailwind CSS) not needed in production.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/EmpressQueenGalaxy/Airsense.git  
    ```

2.  **Navigate to the project root and install dependencies:**
    ```bash
    cd Airsense
    npm install
    # Installs dependencies for the main project (including Tailwind if configured at root)
    ```

3.  **Install Tailwind CSS dependencies (if not already installed at root):**
    ```bash
    # If step 2 didn't install Tailwind dependencies, run this in the project root:
    npm install -D tailwindcss postcss autoprefixer
    ```

4.  **Initialize Tailwind CSS (if `tailwind.config.js` is missing):**
    ```bash
    # Only run if `tailwind.config.js` does not exist in the project root
    npx tailwindcss init -p
    ```
    *Note: The `tailwind.config.js` file should already be present and configured to watch files in `./public/**/*.{html,js}`.*

5.  **Compile the CSS:**
    *This step generates the `estilo.css` file required by the frontend.*
    ```bash
    # Run from the project root (Airsense directory)
    npx tailwindcss -i ./src/input.css -o ./public/estilo.css --minify
    ```

6.  **Environment configuration:**
    - Create a `.env` file **in the `backend` subdirectory** (`Airsense/backend/.env`).
    - Add your database credentials to the `.env` file:

    ```bash
    # Example .env file content (replace with actual credentials if different)
    DB_USER=postgres.czcidrooqhaxysxhxqbr
    DB_PASSWORD=contaminacionaire
    DB_HOST=aws-1-us-east-2.pooler.supabase.com
    DB_NAME=postgres
    DB_PORT=6543
    ```

7.  **Start the development server:**
    ```bash
    # Navigate to the backend directory
    cd backend
    node index.js
    # or
    node --watch index.js # Automatically restarts the server on code changes
    ```

8.  **Open the frontend in your browser:**
    - The backend server will typically run on `http://localhost:3000` (or another port specified by your `index.js`).
    - Open your browser and navigate to the URL where the backend server is running (e.g., `http://localhost:3000`).
  
---

## Usage (end user)
- The final product will be a public web page. End users only need to open the deployed URL to:
  - See the interactive map
  - Use filters (municipality, year, pollutant)
  - Read the compound dictionary
  - Interpret the color legend to assess air quality

---

## License
This project is released under the **MIT License**. See the `LICENSE` file for details.

---

## Authors
- Andres Lopez  
- Katherine Lopez  
- Luz Amelia Ibarguen  
- Nicolas Sanchez

---

## Contact
For questions or collaboration, contact the project team at: **airsenseproyecto@gmail.com**