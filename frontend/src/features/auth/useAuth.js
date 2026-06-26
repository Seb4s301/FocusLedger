import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { login as authLogin, register as authRegister, logout as authLogout } from './authService.js';

/**
 * Hook de autenticación que mantiene el estado del usuario sincronizado
 * con Supabase Auth mediante onAuthStateChange.
 *
 * @returns {{ user, loading, login, register, logout }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Suscribirse a cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    return await authLogin(email, password);
  };

  const register = async (email, password) => {
    return await authRegister(email, password);
  };

  const logout = async () => {
    return await authLogout();
  };

  return { user, loading, login, register, logout };
}
