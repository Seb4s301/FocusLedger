import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await login(email, password);

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '32px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <h1 style={{ marginBottom: '24px', color: 'var(--text-main)', textAlign: 'center' }}>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', marginTop: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="password" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Contraseña</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', marginTop: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--color-primary)', color: '#F5F5F5', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        {error && (
          <p style={{ color: 'var(--color-accent)', marginTop: '16px', background: 'var(--color-shadow)', padding: '10px', borderRadius: '6px', fontSize: '14px' }} role="alert">
            {error}
          </p>
        )}
      </form>
      <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
        ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Regístrate</Link>
      </p>
    </div>
  );
}

export default Login;
