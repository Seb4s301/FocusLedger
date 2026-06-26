import { useState, useEffect, useRef } from 'react';
import { listProjects, listTasks } from '../features/tasks/taskService.js';
import { calcTotalTimeWorked } from '../features/tasks/progressService.js';
import { startSession, endSession, cancelSession } from '../features/focus/focusService.js';
import { getElapsedMinutes } from '../features/focus/timerService.js';
import PomodoroTimer from '../components/PomodoroTimer.jsx';
import YouTubeCard from '../components/YouTubeCard.jsx';

/**
 * Focus.jsx
 *
 * Página principal del modo Focus.
 *
 * - Selector de tarea (dropdown con proyectos y tareas del usuario)
 * - Selector de modo de timer (Pomodoro / Personalizado)
 * - Integra PomodoroTimer y YouTubeCard
 * - Botón "Iniciar sesión" → focusService.startSession()
 * - Botones "Finalizar" y "Cancelar" → endSession / cancelSession
 * - Muestra tiempo total acumulado de la tarea seleccionada
 *
 * Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 8.1
 */

function Focus() {
  // ── Proyectos y tareas ──
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({}); // { projectId: Task[] }
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskTimeTotal, setTaskTimeTotal] = useState(null);

  // ── Timer ──
  const [timerMode, setTimerMode] = useState('pomodoro'); // 'pomodoro' | 'custom'
  const [customMinutes, setCustomMinutes] = useState(25);
  const timerObjRef = useRef(null);

  // ── Sesión ──
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionResult, setSessionResult] = useState(''); // feedback tras finalizar/cancelar

  // ── Cargar proyectos y tareas al montar ──
  useEffect(() => {
    loadProjectsAndTasks();
  }, []);

  async function loadProjectsAndTasks() {
    const projs = await listProjects();
    setProjects(projs);

    const taskMap = {};
    await Promise.all(
      projs.map(async (p) => {
        const tasks = await listTasks(p.id);
        taskMap[p.id] = tasks;
      })
    );
    setTasksByProject(taskMap);
  }

  // ── Cargar tiempo total cuando cambia la tarea seleccionada ──
  useEffect(() => {
    if (!selectedTaskId) {
      setTaskTimeTotal(null);
      return;
    }
    calcTotalTimeWorked(selectedTaskId).then(setTaskTimeTotal);
  }, [selectedTaskId, sessionActive]);

  // ── Handlers ──

  async function handleStartSession() {
    setSessionError('');
    setSessionResult('');

    if (!selectedTaskId) {
      setSessionError('Debes seleccionar una tarea antes de iniciar.');
      return;
    }

    const plannedDuration =
      timerMode === 'pomodoro' ? 25 : (parseInt(customMinutes, 10) || 25);

    const { data, error } = await startSession({
      taskId: selectedTaskId,
      plannedDuration,
    });

    if (error) {
      setSessionError(error.message);
      return;
    }

    setSessionId(data.id);
    setSessionActive(true);
  }

  async function handleEndSession() {
    if (!sessionId) return;

    // Calcular duración real a partir del timer
    let actualDuration = 1;
    if (timerObjRef.current) {
      actualDuration = getElapsedMinutes(timerObjRef.current);
      if (actualDuration < 1) actualDuration = 1;
    }

    const { error } = await endSession(sessionId, actualDuration);

    if (error) {
      setSessionError(error.message);
      return;
    }

    setSessionActive(false);
    setSessionId(null);
    setSessionResult(`Sesión finalizada — ${actualDuration} min registrados.`);

    // Refrescar tiempo total
    if (selectedTaskId) {
      calcTotalTimeWorked(selectedTaskId).then(setTaskTimeTotal);
    }
  }

  async function handleCancelSession() {
    if (!sessionId) return;

    const { error } = await cancelSession(sessionId);

    if (error) {
      setSessionError(error.message);
      return;
    }

    setSessionActive(false);
    setSessionId(null);
    setSessionResult('Sesión cancelada — no se registró tiempo.');
  }

  function handleTimerReady(timerObj) {
    timerObjRef.current = timerObj;
  }

  // ── Construir opciones de tareas agrupadas por proyecto ──
  const taskOptions = [];
  projects.forEach((p) => {
    const tasks = tasksByProject[p.id] || [];
    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    if (pendingTasks.length > 0) {
      taskOptions.push({ type: 'group', label: p.name, id: p.id });
      pendingTasks.forEach((t) => {
        const indent = t.parent_task_id ? '    └ ' : '';
        taskOptions.push({ type: 'task', label: `${indent}${t.name}`, id: t.id });
      });
    }
  });

  // ── Encontrar nombre de tarea seleccionada ──
  let selectedTaskName = '';
  if (selectedTaskId) {
    for (const tasks of Object.values(tasksByProject)) {
      const found = tasks.find((t) => t.id === selectedTaskId);
      if (found) {
        selectedTaskName = found.name;
        break;
      }
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Modo Focus</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>
        Selecciona una tarea, configura el timer y concéntrate.
      </p>

      {/* ── Mensajes ── */}
      {sessionError && (
        <div
          id="focus-error"
          role="alert"
          style={{
            color: 'var(--color-accent)',
            background: 'var(--color-shadow)',
            border: '1px solid var(--color-accent)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {sessionError}
        </div>
      )}
      {sessionResult && (
        <div
          id="focus-result"
          style={{
            color: 'var(--color-primary)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--color-primary)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {sessionResult}
        </div>
      )}

      {/* ── Layout principal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* ── Columna izquierda: Configuración + Timer ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Selector de tarea */}
          <section
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <label
              htmlFor="task-selector"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}
            >
              Tarea
            </label>
            <select
              id="task-selector"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={sessionActive}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                background: sessionActive ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                color: 'var(--text-main)',
                cursor: sessionActive ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">— Selecciona una tarea —</option>
              {taskOptions.map((opt) =>
                opt.type === 'group' ? (
                  <optgroup key={opt.id} label={opt.label} />
                ) : (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                )
              )}
            </select>

            {/* Tiempo acumulado */}
            {selectedTaskId && taskTimeTotal !== null && (
              <div
                id="task-time-total"
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>⏱</span>
                Tiempo acumulado: <strong style={{ color: 'var(--text-main)' }}>{taskTimeTotal} min</strong>
              </div>
            )}
          </section>

          {/* Selector de modo de timer */}
          <section
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 10 }}>
              Modo del temporizador
            </span>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                id="mode-pomodoro-btn"
                onClick={() => { if (!sessionActive) setTimerMode('pomodoro'); }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  border: timerMode === 'pomodoro' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: timerMode === 'pomodoro' ? 'rgba(0,100,0,0.1)' : 'var(--bg-secondary)',
                  color: timerMode === 'pomodoro' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: timerMode === 'pomodoro' ? 600 : 400,
                  fontSize: 14,
                  cursor: sessionActive ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                🍅 Pomodoro
              </button>
              <button
                id="mode-custom-btn"
                onClick={() => { if (!sessionActive) setTimerMode('custom'); }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  border: timerMode === 'custom' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: timerMode === 'custom' ? 'rgba(0,100,0,0.1)' : 'var(--bg-secondary)',
                  color: timerMode === 'custom' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: timerMode === 'custom' ? 600 : 400,
                  fontSize: 14,
                  cursor: sessionActive ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ⏳ Personalizado
              </button>
            </div>

            {timerMode === 'custom' && (
              <div>
                <label
                  htmlFor="custom-duration"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  Duración (1–180 min)
                </label>
                <input
                  id="custom-duration"
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => {
                    if (!sessionActive) setCustomMinutes(parseInt(e.target.value, 10) || 1);
                  }}
                  disabled={sessionActive}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    background: sessionActive ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            )}
          </section>

          {/* Timer */}
          <PomodoroTimer
            mode={timerMode}
            workMinutes={25}
            breakMinutes={5}
            customMinutes={customMinutes}
            onTimerReady={handleTimerReady}
            onPhaseEnd={(phase) => {
              if (phase === 'work' && timerMode === 'custom') {
                // Timer custom terminó: finalizar sesión automáticamente
                handleEndSession();
              }
            }}
          />

          {/* Botones de sesión */}
          <div style={{ display: 'flex', gap: 10 }}>
            {!sessionActive ? (
              <button
                id="start-session-btn"
                onClick={handleStartSession}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                🚀 Iniciar sesión de focus
              </button>
            ) : (
              <>
                <button
                  id="end-session-btn"
                  onClick={handleEndSession}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✅ Finalizar sesión
                </button>
                <button
                  id="cancel-session-btn"
                  onClick={handleCancelSession}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Cancelar sesión
                </button>
              </>
            )}
          </div>

          {/* Info de sesión activa */}
          {sessionActive && selectedTaskName && (
            <div
              id="session-info"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-primary)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--color-primary)',
              }}
            >
              <strong>Sesión activa</strong> — Trabajando en: <span style={{color: 'var(--text-main)'}}>{selectedTaskName}</span>
            </div>
          )}
        </div>

        {/* ── Columna derecha: YouTube ── */}
        <div>
          <YouTubeCard />
        </div>
      </div>
    </div>
  );
}

export default Focus;
