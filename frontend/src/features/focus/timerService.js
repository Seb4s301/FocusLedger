/**
 * timerService.js
 *
 * Lógica del temporizador: Pomodoro (trabajo + descanso) y personalizado.
 * Cada timer es un objeto mutable con métodos start, pause, reset.
 * Emite callbacks al llegar a cero para que el módulo Focus pueda reaccionar.
 *
 * Requisitos: 6.2, 6.3, 6.4
 */

/**
 * Crea un timer Pomodoro con intervalos de trabajo y descanso.
 * @param {number} workMinutes - Minutos de trabajo (default 25)
 * @param {number} breakMinutes - Minutos de descanso (default 5)
 * @returns {object} Timer object
 */
export function createPomodoroTimer(workMinutes = 25, breakMinutes = 5) {
  return {
    type: 'pomodoro',
    workMinutes,
    breakMinutes,
    remaining: workMinutes * 60, // en segundos
    phase: 'work', // 'work' | 'break'
    running: false,
    intervalId: null,
    onTick: null,      // callback(remaining, phase)
    onPhaseEnd: null,  // callback(phase) — se llama cuando el intervalo llega a 0
  };
}

/**
 * Crea un timer personalizado con duración arbitraria.
 * @param {number} durationMinutes - Duración en minutos (1–180)
 * @returns {{ timer: object|null, error: string|null }}
 */
export function createCustomTimer(durationMinutes) {
  if (
    durationMinutes === null ||
    durationMinutes === undefined ||
    typeof durationMinutes !== 'number' ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 180
  ) {
    return {
      timer: null,
      error: 'La duración debe estar entre 1 y 180 minutos.',
    };
  }

  return {
    timer: {
      type: 'custom',
      durationMinutes,
      remaining: Math.floor(durationMinutes) * 60,
      phase: 'work',
      running: false,
      intervalId: null,
      onTick: null,
      onPhaseEnd: null,
    },
    error: null,
  };
}

/**
 * Inicia el countdown del timer.
 * @param {object} timer - Timer object (mutado in-place)
 */
export function start(timer) {
  if (timer.running) return;
  timer.running = true;

  timer.intervalId = setInterval(() => {
    timer.remaining -= 1;

    if (timer.onTick) {
      timer.onTick(timer.remaining, timer.phase);
    }

    if (timer.remaining <= 0) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
      timer.running = false;

      const endedPhase = timer.phase;

      if (timer.onPhaseEnd) {
        timer.onPhaseEnd(endedPhase);
      }

      // Si es Pomodoro, alternar entre work y break
      if (timer.type === 'pomodoro') {
        if (endedPhase === 'work') {
          timer.phase = 'break';
          timer.remaining = timer.breakMinutes * 60;
        } else {
          timer.phase = 'work';
          timer.remaining = timer.workMinutes * 60;
        }
      }
    }
  }, 1000);
}

/**
 * Pausa el timer.
 * @param {object} timer - Timer object
 */
export function pause(timer) {
  if (!timer.running) return;
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.running = false;
}

/**
 * Reinicia el timer a su duración original.
 * @param {object} timer - Timer object
 */
export function reset(timer) {
  pause(timer);

  if (timer.type === 'pomodoro') {
    timer.phase = 'work';
    timer.remaining = timer.workMinutes * 60;
  } else {
    timer.remaining = Math.floor(timer.durationMinutes) * 60;
    timer.phase = 'work';
  }
}

/**
 * Obtiene los minutos transcurridos desde el inicio del timer.
 * @param {object} timer - Timer object
 * @returns {number} Minutos transcurridos
 */
export function getElapsedMinutes(timer) {
  let totalSeconds;
  if (timer.type === 'pomodoro') {
    totalSeconds = timer.workMinutes * 60;
  } else {
    totalSeconds = Math.floor(timer.durationMinutes) * 60;
  }
  const elapsed = totalSeconds - timer.remaining;
  return Math.max(0, Math.ceil(elapsed / 60));
}

/**
 * Formatea segundos restantes como MM:SS.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
