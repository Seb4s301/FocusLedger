import { supabase } from '../../lib/supabase.js';

/**
 * focusService.js
 *
 * Gestión de sesiones de focus: iniciar, finalizar y cancelar.
 * Al finalizar una sesión, se inserta un time_log y se actualiza el
 * total_time_min de la tarea.
 *
 * Requisitos: 6.1, 6.5, 6.6, 6.7, 8.1
 */

/**
 * Inicia una nueva sesión de focus.
 * @param {{ taskId: string, plannedDuration: number }} params
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function startSession({ taskId, plannedDuration }) {
  if (!taskId) {
    return {
      data: null,
      error: { message: 'Debes seleccionar una tarea antes de iniciar.' },
    };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      task_id: taskId,
      planned_duration: plannedDuration,
      status: 'active',
      started_at: new Date().toISOString(),
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Finaliza una sesión de focus.
 * - Actualiza focus_sessions con status='completed', actual_duration y ended_at.
 * - Inserta un time_log con la duración real.
 * - Actualiza el total_time_min de la tarea.
 *
 * @param {string} sessionId
 * @param {number} actualDuration - Minutos efectivamente trabajados
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function endSession(sessionId, actualDuration) {
  // 1. Obtener la sesión para conocer el task_id
  const { data: session, error: fetchError } = await supabase
    .from('focus_sessions')
    .select('task_id')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    return { data: null, error: { message: fetchError?.message || 'Sesión no encontrada.' } };
  }

  // 2. Actualizar la sesión como completada
  const { data: updatedSession, error: updateError } = await supabase
    .from('focus_sessions')
    .update({
      status: 'completed',
      actual_duration: actualDuration,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError) {
    return { data: null, error: { message: updateError.message } };
  }

  // 3. Insertar time_log (solo si la duración es > 0)
  if (actualDuration > 0) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error: logError } = await supabase
      .from('time_logs')
      .insert({
        session_id: sessionId,
        task_id: session.task_id,
        duration_min: actualDuration,
        user_id: user.id,
      });

    if (logError) {
      console.error('Error al insertar time_log:', logError.message);
    }

    // 4. Actualizar total_time_min de la tarea
    const { data: task } = await supabase
      .from('tasks')
      .select('total_time_min')
      .eq('id', session.task_id)
      .single();

    if (task) {
      await supabase
        .from('tasks')
        .update({ total_time_min: (task.total_time_min || 0) + actualDuration })
        .eq('id', session.task_id);
    }
  }

  return { data: updatedSession, error: null };
}

/**
 * Cancela una sesión de focus.
 * No registra time_log ni actualiza total_time_min.
 *
 * @param {string} sessionId
 * @returns {{ error: { message: string }|null }}
 */
export async function cancelSession(sessionId) {
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      status: 'cancelled',
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}
