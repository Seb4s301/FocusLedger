import { supabase } from '../../lib/supabase.js';
import { markTaskComplete } from './taskService.js';

/**
 * Calcula el porcentaje de progreso de un proyecto.
 * Considera todas las tareas del proyecto (incluyendo subtareas).
 * @param {string} projectId
 * @returns {Promise<number>} Entero entre 0 y 100
 */
export async function calcProjectProgress(projectId) {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId);

  if (error || !tasks) {
    console.error('Error al calcular progreso del proyecto:', error?.message);
    return 0;
  }

  const total = tasks.length;
  if (total === 0) return 0;

  const completadas = tasks.filter((t) => t.status === 'completed').length;
  return Math.floor((completadas / total) * 100);
}

/**
 * Calcula el tiempo total trabajado en una tarea sumando todos sus time_logs.
 * @param {string} taskId
 * @returns {Promise<number>} Total en minutos (0 si no hay registros)
 */
export async function calcTotalTimeWorked(taskId) {
  const { data: logs, error } = await supabase
    .from('time_logs')
    .select('duration_min')
    .eq('task_id', taskId);

  if (error || !logs) {
    console.error('Error al calcular tiempo trabajado:', error?.message);
    return 0;
  }

  if (logs.length === 0) return 0;

  return logs.reduce((sum, log) => sum + (log.duration_min || 0), 0);
}

/**
 * Verifica si todas las subtareas de la tarea padre están completadas.
 * Si es así, marca automáticamente la tarea padre como completada.
 * @param {string} taskId - ID de la tarea que acaba de completarse
 * @returns {Promise<void>}
 */
export async function checkAndPropagateCompletion(taskId) {
  // Obtener la tarea para ver si tiene padre
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('parent_task_id')
    .eq('id', taskId)
    .single();

  if (taskError || !task || !task.parent_task_id) {
    // No tiene padre, no hay propagación que hacer
    return;
  }

  const parentTaskId = task.parent_task_id;

  // Obtener todas las subtareas del padre
  const { data: siblings, error: siblingsError } = await supabase
    .from('tasks')
    .select('status')
    .eq('parent_task_id', parentTaskId);

  if (siblingsError || !siblings) {
    console.error('Error al obtener subtareas del padre:', siblingsError?.message);
    return;
  }

  // Si todas las subtareas están completadas, completar el padre
  const allCompleted = siblings.length > 0 && siblings.every((t) => t.status === 'completed');
  if (allCompleted) {
    await markTaskComplete(parentTaskId);
  }
}
