Necesito que analices y reorganices mi proyecto FocusLedger para:
1. Despliegue en GitHub Pages (Frontend React/Vite)
2. Backend con Supabase (sin servidor propio)
3. Dominio personalizado: focusedger.sebascasavilca.lat

CONTEXTO DEL PROYECTO:
═════════════════════════════════════════════════════════════

Estructura actual:
FocusLedger/
├── frontend/               (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                (Python + Supabase)
│   ├── lib/
│   │   ├── supabase_client.py
│   │   └── otros módulos
│   ├── scripts/
│   │   ├── process_youtube.py
│   │   ├── manage_tasks.py
│   │   └── otros scripts
│   └── requirements.txt
├── supabase/               (Configuración DB)
│   ├── schema.sql
│   └── seed.sql
├── .env.example
├── .gitignore
└── README.md

Stack tecnológico:
- Frontend: React 18 + Vite + TailwindCSS (presumo)
- Backend: Python 3.9+ + Supabase (sin servidor propio)
- BD: Supabase PostgreSQL
- Despliegue: GitHub Pages + Cloudflare + Supabase

TAREAS:
═════════════════════════════════════════════════════════════

1. ANÁLISIS DE ESTRUCTURA
   - ¿La estructura actual es óptima para despliegue en GitHub Pages?
   - ¿Hay carpetas/archivos innecesarios que deban removerse?
   - ¿Falta algún archivo de configuración (vite.config.js, ESLint, etc.)?
   - ¿La separación frontend/backend tiene sentido o debería reorganizarse?

2. CONFIGURACIÓN PARA DESPLIEGUE
   - Genera/actualiza vite.config.js para:
     * Nombre del repositorio correcto
     * Base path si es necesario
     * Optimizaciones de build
   - Verifica que el .env.example tiene todas las variables necesarias
   - Asegúrate de que .gitignore está completo (especialmente .env)

3. REORGANIZACIÓN RECOMENDADA
   Si la estructura actual no es óptima, propón una nueva estructura y los pasos para migrar.
   
   Ejemplo de lo que PODRÍAS recomendar:
   FocusLedger/
   ├── frontend/           (todo el React)
   ├── backend/            (todo Python, si se mantiene)
   ├── docs/               (documentación, si no existe)
   ├── .github/
   │   └── workflows/      (GitHub Actions para deploy)
   ├── .env.example
   ├── .gitignore
   ├── README.md
   └── DEPLOY.md           (guía de despliegue)

4. ARCHIVOS A CREAR
   Crea o actualiza estos archivos si falta:
   
   a) .github/workflows/deploy.yml
      - Workflow que hace build de frontend automáticamente
      - Pusha a gh-pages automáticamente
      - Se ejecuta en cada push a main
   
   b) frontend/vite.config.js
      - Asegúrate de que está configurado para GitHub Pages
      - Incluir base path si es necesario
   
   c) frontend/.env.example
      - Todas las variables VITE_* necesarias
      - Con descripciones
   
   d) DEPLOY.md
      - Instrucciones paso a paso para:
        * Setup local (npm install, configurar .env)
        * Deploy automático (GitHub Pages + Cloudflare)
        * Troubleshooting

5. VALIDACIÓN
   - Verifica que no hay referencias hardcodeadas a "localhost"
   - Verifica que las APIs usan variables de entorno
   - Verifica que el CORS está configurado correctamente para Supabase
   - Verifica que no hay secretos en los archivos versionados

ENTREGA ESPERADA:
═════════════════════════════════════════════════════════════

1. Análisis escrito:
   - Problemas encontrados (si los hay)
   - Recomendaciones de mejora
   - Razones por qué

2. Plan de reorganización (si es necesario):
   - Estructura nueva propuesta
   - Archivos a crear
   - Archivos a mover/eliminar
   - Pasos para migrar sin perder datos

3. Código/Archivos a crear o actualizar:
   - Código completo y listo para copiar-pegar
   - Con comentarios explicativos
   - Siguiendo best practices de React y Vite

4. Checklist final:
   - ✅ Frontend listo para GitHub Pages
   - ✅ .env.example completo
   - ✅ .gitignore correcto
   - ✅ Variables de entorno bien configuradas
   - ✅ Documentación clara
