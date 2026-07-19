# FocusLedger

FocusLedger es una aplicación web personal para gestionar finanzas, tareas, proyectos y sesiones de enfoque.

- **Repositorio:** https://github.com/Seb4s301/FocusLedger
- **Dominio de producción:** focusedger.sebascasavilca.lat
- **Backend en producción:** Azure App Service + Railway (auto-deploy desde `master`)
- **Frontend en producción:** Azure Static Web Apps

---

## Características

- Dashboard financiero con métricas y gráficos
- Registro de ingresos y egresos
- Gestión de proyectos y tareas
- Modo Focus con temporizador y reproducción de YouTube
- Notas rápidas del usuario

> **Nota:** la función de sugerencias financieras basada en IA (Ollama/LLM local) fue **eliminada** del proyecto. Ver sección "Historial de decisiones" más abajo.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend | Python + Flask + Gunicorn |
| Base de datos | Supabase (PostgreSQL) |
| Hosting Frontend | Azure Static Web Apps |
| Hosting Backend | Azure App Service |
| CI/CD | GitHub Actions |
| DNS | Cloudflare |

---

## Estructura del proyecto

```
FocusLedger/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # GitHub Actions → GitHub Pages
│       └── azure-deploy.yml        # GitHub Actions → Azure Static Web Apps
├── CNAME                            # Dominio personalizado (autogenerado por GitHub)
├── .gitignore
├── ARCHITECTURE.md
├── DEPLOY.md
├── CONTRIBUTING.md
├── README.md
│
├── backend/                         # Root Directory configurado en Railway
│   ├── app.py                       # Punto de entrada Flask (antes: src/app.py)
│   ├── api/                         # Rutas HTTP (antes: scripts sueltos)
│   │   ├── __init__.py
│   │   ├── finance.py               # antes: add_finance.py
│   │   ├── notes.py                 # antes: add_note.py
│   │   ├── projects.py              # antes: add_project.py
│   │   └── youtube.py               # antes: process_youtube.py
│   ├── lib/
│   │   ├── __init__.py
│   │   └── supabase_client.py       # cliente Supabase (service_role key)
│   ├── Procfile                     # web: gunicorn --bind 0.0.0.0:$PORT app:app
│   ├── railway.json                 # config explícita de build/deploy en Railway
│   ├── requirements.txt
│   └── runtime.txt
│
├── frontend/
│   ├── .env                         # (ignorado por git)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── features/
│       │   ├── auth/
│       │   ├── finance/             # sin suggestionService.js (IA removida)
│       │   ├── focus/
│       │   ├── notes/
│       │   └── tasks/
│       ├── lib/
│       │   └── supabase.js
│       └── pages/
│           ├── Dashboard.jsx        # sin card de sugerencias IA
│           ├── Finances.jsx
│           ├── Focus.jsx
│           ├── Login.jsx
│           ├── Notes.jsx
│           ├── Projects.jsx
│           └── Register.jsx
│
└── supabase/
    ├── schema.sql
    └── seed.sql
```

---

## Inicio rápido (desarrollo local)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173`.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
python app.py
```

Corre en `http://localhost:5000`.

---

## Variables de entorno

### `frontend/.env`

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### `backend/.env` (local) / Railway → Variables (producción)

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
YOUTUBE_API_KEY=tu-api-key-de-youtube
```

⚠️ El backend usa `SUPABASE_SERVICE_ROLE_KEY` (no la `ANON_KEY` del frontend).

---

## Despliegue en Azure

FocusLedger está desplegado en Microsoft Azure utilizando los siguientes servicios:

| Servicio | Recurso | URL |
|----------|---------|-----|
| Azure App Service | focusledger-api | https://focusledger-api.azurewebsites.net |
| Azure Static Web Apps | focusledger-web | https://happy-moss-0f9b3ad0f.7.azurestaticapps.net |
| Resource Group | focusledger-rg | East US / East US 2 |

### Recursos en Azure Portal

#### Resource Group — Todos los recursos desplegados

![Resource Group](FocusLedgerAzure/Captura%20de%20pantalla%202026-07-19%20114028.png)

#### Backend — Azure App Service (Python 3.11, B1 Linux)

![Backend App Service](FocusLedgerAzure/Captura%20de%20pantalla%202026-07-19%20114505.png)

#### Frontend — Azure Static Web Apps (conectado a GitHub)

![Frontend Static Web App](FocusLedgerAzure/Captura%20de%20pantalla%202026-07-19%20114411.png)

### Sitio funcionando en Azure

#### Login

![Login Page](FocusLedgerAzure/Captura%20de%20pantalla%202026-07-19%20114430.png)

#### Dashboard

![Dashboard](FocusLedgerAzure/Captura%20de%20pantalla%202026-07-19%20114443.png)

### CI/CD con GitHub Actions

El frontend se despliega automáticamente en cada push a `master` mediante GitHub Actions:

- **Workflow:** `.github/workflows/azure-deploy.yml`
- **Build:** Vite genera el bundle en `frontend/dist`
- **Deploy:** Azure Static Web Apps sube el build resultante
- **Variables de entorno:** Configuradas como GitHub Secrets y creadas como `.env` durante el build

---

### Frontend → GitHub Pages (legacy)

- Se dispara automáticamente en cada `git push` a `master` vía `.github/workflows/deploy.yml`.
- Requiere que **Settings → Pages → Source** esté en **"GitHub Actions"** (no "Deploy from a branch").
- El dominio personalizado se gestiona con el archivo `CNAME` en la raíz del repo (autogenerado por GitHub al configurar el dominio desde la web).

### Backend → Railway

- Conectado directamente al repositorio de GitHub → auto-deploy en cada push a `master`.
- **Root Directory:** `backend`
- **Start Command:** definido en `railway.json` y `Procfile` → `gunicorn --bind 0.0.0.0:$PORT app:app`
- Variables de entorno configuradas en el dashboard de Railway (Settings → Variables).
- Dominio público generado en Settings → Networking → "Generate Domain".

---

## Historial de decisiones importantes

- **IA/LLM eliminada (julio 2026):** se removió `suggestionService.js` (sugerencias financieras vía Ollama local) porque dependía de que cada usuario tuviera Ollama corriendo en su propia máquina, lo cual no es viable para una app pública multi-dispositivo. Las variables `VITE_LLM_*` fueron eliminadas de `.env` y `.env.example`.
- **Reestructuración del backend:** se pasó de `backend/src/app.py` + scripts sueltos en `backend/scripts/` a `backend/app.py` + rutas organizadas en `backend/api/`. Esto requirió actualizar las rutas en `Procfile` y `railway.json` (de `src.app:app` a `app:app`).
- **Servidor de producción:** se usa `gunicorn` en vez del servidor de desarrollo de Flask (`flask run`), ya que este último no es apto para producción.

---

## Documentación adicional

- Especificación y diseño: `.kiro/specs/focusledger`
- Arquitectura: `ARCHITECTURE.md`
- Guía de colaboración: `CONTRIBUTING.md`
- Despliegue: `DEPLOY.md`