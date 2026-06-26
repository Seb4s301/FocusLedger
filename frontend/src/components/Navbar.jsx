import { NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';

/**
 * Navbar.jsx
 *
 * Navegación principal de FocusLedger.
 * Links a todas las rutas protegidas y botón de logout.
 *
 * Requisitos: 1.5
 */

const navItems = [
  { to: '/',         label: 'Dashboard', icon: '📊' },
  { to: '/finances', label: 'Finanzas',  icon: '💰' },
  { to: '/projects', label: 'Proyectos', icon: '📁' },
  { to: '/focus',    label: 'Focus',     icon: '🎯' },
  { to: '/notes',    label: 'Notas',     icon: '📝' },
];

function Navbar() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <nav
      id="main-navbar"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        fontFamily: 'sans-serif',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo / Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
          FocusLedger
        </span>
      </div>

      {/* Links de navegación */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-surface)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Usuario + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
        )}
        <button
          id="logout-btn"
          onClick={handleLogout}
          style={{
            padding: '6px 16px',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
