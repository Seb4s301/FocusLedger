import { supabase } from '../../lib/supabase.js';

const MAX_CONTENT_LENGTH = 5000;

/**
 * noteService.js
 *
 * CRUD de notas del usuario.
 *
 * Requisitos: 9.1
 */

/**
 * Crea una nueva nota.
 * @param {{ content: string }} params
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function createNote({ content }) {
  if (!content || content.trim() === '') {
    return { data: null, error: { message: 'El contenido de la nota no puede estar vacío.' } };
  }
  if (content.trim().length > MAX_CONTENT_LENGTH) {
    return { data: null, error: { message: `El contenido no puede exceder ${MAX_CONTENT_LENGTH} caracteres.` } };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('notes')
    .insert({ content: content.trim(), user_id: user.id })
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Lista todas las notas del usuario autenticado, ordenadas por fecha de creación descendente.
 * @returns {Promise<object[]>}
 */
export async function listNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al listar notas:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Elimina una nota por su ID.
 * @param {string} noteId
 * @returns {{ error: { message: string }|null }}
 */
export async function deleteNote(noteId) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}
