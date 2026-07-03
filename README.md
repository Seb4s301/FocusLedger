# FocusLedger

FocusLedger es una aplicación web personal para gestionar finanzas, tareas, proyectos y sesiones de enfoque.

## Características

- Dashboard financiero con métricas y gráficos
- Registro de ingresos y egresos
- Gestión de proyectos y tareas
- Modo Focus con temporizador y reproducción de YouTube
- Notas rápidas del usuario

## Documentación

- Especificación y diseño: [.kiro/specs/focusledger](.kiro/specs/focusledger)
- Arquitectura: [ARCHITECTURE.md](ARCHITECTURE.md)
- Guía de colaboración: [CONTRIBUTING.md](CONTRIBUTING.md)
- Despliegue: [DEPLOY.md](DEPLOY.md)

## Inicio rápido

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend (scripts Python)

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
```

## Variables de entorno

Copia [.env.example](.env.example) a .env y completa los valores reales antes de ejecutar la app.

## Despliegue

El proyecto está preparado para desplegar el frontend en GitHub Pages mediante el workflow en [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
