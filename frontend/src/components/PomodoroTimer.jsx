import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createPomodoroTimer,
  createCustomTimer,
  start,
  pause,
  reset,
  formatTime,
} from '../features/focus/timerService.js';

/**
 * PomodoroTimer.jsx
 *
 * Componente de temporizador con soporte para:
 * - Modo Pomodoro (trabajo + descanso)
 * - Modo personalizado (duración libre)
 * Muestra countdown MM:SS, botones Iniciar/Pausar/Reiniciar,
 * indicador visual de fase (trabajo/descanso).
 *
 * Requisitos: 6.2, 6.3, 6.4
 */

/**
 * @param {object} props
 * @param {'pomodoro'|'custom'} props.mode
 * @param {number} props.workMinutes - Minutos de trabajo para Pomodoro (default 25)
 * @param {number} props.breakMinutes - Minutos de descanso para Pomodoro (default 5)
 * @param {number} props.customMinutes - Duración en minutos para modo custom
 * @param {function} props.onPhaseEnd - Callback cuando un intervalo llega a cero (phase)
 * @param {function} props.onTimerReady - Callback con referencia al timer para que Focus pueda leer estado
 */
function PomodoroTimer({
  mode = 'pomodoro',
  workMinutes = 25,
  breakMinutes = 5,
  customMinutes = 25,
  onPhaseEnd,
  onTimerReady,
}) {
  const timerRef = useRef(null);
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState('work');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  // Inicializar timer al cambiar de modo o duración
  useEffect(() => {
    // Limpiar timer anterior
    if (timerRef.current) {
      pause(timerRef.current);
    }

    if (mode === 'pomodoro') {
      const t = createPomodoroTimer(workMinutes, breakMinutes);
      timerRef.current = t;
      setRemaining(t.remaining);
      setPhase('work');
      setRunning(false);
      setError('');
    } else {
      const { timer, error: err } = createCustomTimer(customMinutes);
      if (err) {
        setError(err);
        timerRef.current = null;
        return;
      }
      timerRef.current = timer;
      setRemaining(timer.remaining);
      setPhase('work');
      setRunning(false);
      setError('');
    }

    if (onTimerReady && timerRef.current) {
      onTimerReady(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        pause(timerRef.current);
      }
    };
  }, [mode, workMinutes, breakMinutes, customMinutes]);

  // Configurar callbacks del timer
  useEffect(() => {
    const timer = timerRef.current;
    if (!timer) return;

    timer.onTick = (rem, ph) => {
      setRemaining(rem);
      setPhase(ph);
    };

    timer.onPhaseEnd = (endedPhase) => {
      setRunning(false);
      // Notificar al componente padre
      if (onPhaseEnd) onPhaseEnd(endedPhase);

      // Notificación del browser
      try {
        if (Notification.permission === 'granted') {
          const msg = endedPhase === 'work'
            ? '¡Tiempo de trabajo completado! Toma un descanso.'
            : '¡Descanso terminado! Vuelve al trabajo.';
          new Notification('FocusLedger', { body: msg });
        }
      } catch {
        // Notifications no soportadas
      }

      // Actualizar remaining después del cambio de fase en Pomodoro
      if (timer.type === 'pomodoro') {
        setRemaining(timer.remaining);
        setPhase(timer.phase);
      }
    };
  }, [onPhaseEnd]);

  const handleStart = useCallback(() => {
    if (!timerRef.current) return;

    // Pedir permiso de notificaciones la primera vez
    try {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch {
      // Notifications no soportadas
    }

    start(timerRef.current);
    setRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    if (!timerRef.current) return;
    pause(timerRef.current);
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    if (!timerRef.current) return;
    reset(timerRef.current);
    setRemaining(timerRef.current.remaining);
    setPhase(timerRef.current.phase);
    setRunning(false);
  }, []);

  // ── Estilos ──
  const isWork = phase === 'work';
  const totalSeconds = timerRef.current
    ? (isWork
      ? (mode === 'pomodoro' ? timerRef.current.workMinutes : timerRef.current.durationMinutes) * 60
      : (timerRef.current.breakMinutes || 0) * 60)
    : 1;
  const progressPct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const phaseColor = isWork ? 'var(--color-primary)' : 'var(--text-secondary)';
  const phaseBg = isWork ? 'rgba(0, 100, 0, 0.08)' : 'var(--bg-surface)';
  const phaseLabel = isWork ? 'Trabajo' : 'Descanso';

  if (error) {
    return (
      <div style={{ color: 'var(--color-accent)', background: 'var(--color-shadow)', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
        {error}
      </div>
    );
  }

  return (
    <div
      id="pomodoro-timer"
      style={{
        background: phaseBg,
        border: `2px solid ${phaseColor}`,
        borderRadius: 16,
        padding: '28px 24px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Indicador de fase */}
      <div style={{ marginBottom: 12 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 16px',
            borderRadius: 9999,
            background: phaseColor,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {phaseLabel}
        </span>
      </div>

      {/* Countdown */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          fontFamily: "'Courier New', monospace",
          color: phaseColor,
          letterSpacing: '0.06em',
          lineHeight: 1.1,
          marginBottom: 16,
        }}
      >
        {formatTime(remaining)}
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 20,
          maxWidth: 240,
          margin: '0 auto 20px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(progressPct, 100)}%`,
            background: phaseColor,
            borderRadius: 999,
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {!running ? (
          <button
            id="timer-start-btn"
            onClick={handleStart}
            style={{
              padding: '10px 28px',
              background: phaseColor,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'opacity 0.15s',
            }}
          >
            {remaining < totalSeconds ? 'Reanudar' : 'Iniciar'}
          </button>
        ) : (
          <button
            id="timer-pause-btn"
            onClick={handlePause}
            style={{
              padding: '10px 28px',
              background: 'var(--text-secondary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Pausar
          </button>
        )}
        <button
          id="timer-reset-btn"
          onClick={handleReset}
          style={{
            padding: '10px 28px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}

export default PomodoroTimer;
