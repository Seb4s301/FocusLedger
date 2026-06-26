import { supabase } from '../../lib/supabase.js';

/**
 * Registra un nuevo usuario con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {{ data, error }}
 */
export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

/**
 * Inicia sesión con email y contraseña.
 * Retorna un mensaje de error genérico si las credenciales son inválidas,
 * sin revelar cuál campo es incorrecto (Requisito 1.3).
 * @param {string} email
 * @param {string} password
 * @returns {{ data, error }}
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { data: null, error: { message: 'Credenciales incorrectas' } };
  }
  return { data, error: null };
}

/**
 * Cierra la sesión del usuario actual.
 * @returns {{ error }}
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Obtiene la sesión activa del usuario.
 * @returns {{ data: { session }, error }}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}
