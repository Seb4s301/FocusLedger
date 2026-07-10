# Prompt de contexto — FocusLedger (para continuar en próxima conversación)

Copia y pega esto al inicio de una nueva conversación si necesitas retomar el trabajo sin repetir todo el contexto.

---

## Contexto del proyecto

Estoy desplegando **FocusLedger**, una app web personal (finanzas, tareas, proyectos, focus sessions).

- **Stack:** Frontend React/Vite → GitHub Pages. Backend Python/Flask/Gunicorn → Railway. BD → Supabase. DNS → Cloudflare.
- **Repo:** https://github.com/Seb4s301/FocusLedger
- **Dominio:** focusedger.sebascasavilca.lat
- **Estructura backend actual:** `backend/app.py` (punto de entrada), `backend/api/` (rutas: finance.py, notes.py, projects.py, youtube.py), `backend/lib/supabase_client.py`.
- Ya eliminamos toda la funcionalidad de IA/LLM (Ollama) del proyecto — no la reintroduzcas a menos que yo lo pida explícitamente.
- Railway ya está conectado a GitHub (auto-deploy en cada push a `master`), con Root Directory = `backend`.
- El `Procfile` y `railway.json` deben usar la ruta `app:app` (NO `src.app:app`, esa era la ruta vieja antes de reestructurar).

---

## Pendientes activos (en orden de prioridad)

### 1. 🔴 Arreglar el deploy de GitHub Pages
El workflow (`actions/deploy-pages@v5`) está fallando en el paso final con:
```
Error: Deployment failed, try again later.
```
Verificar:
- [ ] Que `Settings → Pages → Source` esté en **"GitHub Actions"** (no "Deploy from a branch")
- [ ] Que no haya dos workflows compitiendo por el mismo deploy en `.github/workflows/`
- [ ] Agregar bloque `concurrency` al workflow si no lo tiene:
  ```yaml
  concurrency:
    group: "pages"
    cancel-in-progress: false
  ```
- [ ] Si el error persiste tras confirmar lo anterior, puede ser un fallo transitorio de GitHub — reintentar con "Re-run jobs"

### 2. 🟡 Confirmar que Railway sirve el backend correctamente
- [ ] Verificar `Deploy Logs` en Railway → debe mostrar gunicorn arrancando sin errores de import
- [ ] Probar el endpoint de salud: `curl https://<tu-dominio>.up.railway.app/` (o el endpoint que exista en `app.py`)
- [ ] Confirmar variables de entorno en Railway: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`

### 3. 🟡 Convertir los scripts de `backend/api/` en rutas Flask reales
Actualmente `app.py` solo tiene una ruta de prueba (`/`). Falta:
- [ ] Definir rutas HTTP en `finance.py`, `notes.py`, `projects.py`, `youtube.py` (ej. `@app.route('/api/finance', methods=['POST'])`)
- [ ] Registrar esas rutas en `app.py` (usando Blueprints de Flask o imports directos)
- [ ] Decidir: ¿el frontend habla directo con Supabase (como ahora) para CRUD simple, y solo usa el backend Flask para lo que requiere lógica extra (ej. YouTube API)? Aclarar esta arquitectura antes de escribir las rutas.

### 4. 🟡 Configurar CORS en el backend
- [ ] En `app.py`, agregar `flask-cors` con los orígenes permitidos explícitos:
  ```python
  CORS(app, origins=[
      "https://focusedger.sebascasavilca.lat",
      "http://localhost:5173"
  ])
  ```

### 5. 🟢 Conectar el frontend a la URL real de Railway
- [ ] Generar dominio público en Railway (Settings → Networking → "Generate Domain") si no se ha hecho
- [ ] Actualizar `REACT_APP_API_URL` (o el nombre de variable equivalente en Vite: `VITE_API_URL`) en `.github/workflows/deploy.yml` con la URL real
- [ ] Verificar que el frontend consuma esa variable donde corresponda (buscar en `frontend/src` dónde se define la base URL del backend)

### 6. 🟢 Limpieza final
- [ ] Revisar que `requirements.txt` no tenga dependencias de testing (`pytest`, `hypothesis`) mezcladas con las de producción
- [ ] Confirmar que `backend/.env` (si existe) esté en `.gitignore`
- [ ] Actualizar `DEPLOY.md` con los pasos reales ya validados (Root Directory, variables, dominio) para que quede como documentación definitiva
- [ ] Hacer una prueba end-to-end completa: crear un dato desde el frontend en producción → confirmar que llega a Supabase

---

## Cómo quiero que me ayudes

- Dame comandos exactos para **PowerShell** (mi terminal es PowerShell en Windows, no Git Bash/MINGW64 — confirmar antes de dar comandos tipo `grep`, `cat`, etc.)
- Cuando pida revisar algo del código, pídeme que suba capturas o el contenido del archivo si no lo tienes ya — no asumas contenido de archivos que no has visto en esta conversación.
- Prefiero cambios puntuales sobre mi código real en vez de reescrituras completas.
- Todo en español.