import { supabase } from '../../lib/supabase.js';

/**
 * Crea un nuevo proyecto.
 * @param {{ name: string, description?: string }} params
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function createProject({ name, description }) {
  if (!name || name.trim() === '') {
    return { data: null, error: { message: 'El nombre del proyecto es requerido.' } };
  }

  const payload = { name: name.trim() };
  if (description && description.trim() !== '') {
    payload.description = description.trim();
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Lista todos los proyectos del usuario autenticado, ordenados por fecha de creación descendente.
 * @returns {Promise<object[]>}
 */
export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al listar proyectos:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Crea una nueva tarea asociada a un proyecto.
 * @param {{ name: string, projectId: string, parentTaskId?: string }} params
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function createTask({ name, projectId, parentTaskId }) {
  if (!name || name.trim() === '') {
    return { data: null, error: { message: 'El nombre de la tarea es requerido.' } };
  }

  const payload = {
    name: name.trim(),
    project_id: projectId,
  };

  if (parentTaskId) {
    payload.parent_task_id = parentTaskId;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Lista todas las tareas de un proyecto, ordenadas por fecha de creación ascendente.
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function listTasks(projectId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al listar tareas:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Crea una subtarea asociada a una tarea padre.
 * Obtiene el project_id del padre para incluirlo en la subtarea.
 * @param {{ name: string, parentTaskId: string }} params
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function createSubtask({ name, parentTaskId }) {
  if (!name || name.trim() === '') {
    return { data: null, error: { message: 'El nombre de la subtarea es requerido.' } };
  }

  // Obtener el project_id del padre
  const { data: parentTask, error: parentError } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', parentTaskId)
    .single();

  if (parentError || !parentTask) {
    return { data: null, error: { message: 'No se encontró la tarea padre.' } };
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      name: name.trim(),
      parent_task_id: parentTaskId,
      project_id: parentTask.project_id,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Marca una tarea como completada, registrando la fecha y hora de finalización.
 * @param {string} taskId
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function markTaskComplete(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Elimina una tarea por su ID.
 * @param {string} taskId
 * @returns {{ error: { message: string }|null }}
 */
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}
