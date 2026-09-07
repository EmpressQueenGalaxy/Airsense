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

2.  **Navigate to the application directory and install dependencies with pnpm:**
    ```bash
     cd Airsense/Airsense-V2
     corepack enable
     pnpm install
    ```

3.  **Build the React frontend:**
    ```bash
     pnpm frontend:build
     ```

4.  **Configure the environment:**
     ```bash
     # Create Airsense/Airsense-V2/backend/.env with the database variables below.
     ```

5.  **Start the backend:**
     ```bash
     pnpm start
     ```

6.  **Start the React frontend in another terminal:**
     ```bash
     cd Airsense/Airsense-V2
     pnpm frontend:dev
     ```
     Open `http://localhost:5173`. Vite proxies `/api` requests to the backend on port 3000.

7.  **Environment variables:**
     - Create a `.env` file **in the `backend` subdirectory** (`Airsense/Airsense-V2/backend/.env`).
     - Add your database credentials. Do not commit real credentials:

    ```bash
    # Example .env file content (replace with actual credentials if different)
    DB_USER=your_database_user
    DB_PASSWORD=your_database_password
    DB_HOST=your_database_host
    DB_NAME=postgres
    DB_PORT=6543
    ```

The React frontend lives in `Airsense-V2/frontend` and the Express backend in `Airsense-V2/backend`. The root `pnpm build` command builds the React application:

```bash
pnpm frontend:build
```
  
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
For questions or collaboration, contact the project team at: **airsenseproyecto@gmail.com*