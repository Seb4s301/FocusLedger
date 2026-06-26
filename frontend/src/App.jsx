import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth.js';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Finances from './pages/Finances.jsx';
import Projects from './pages/Projects.jsx';
import Focus from './pages/Focus.jsx';
import Notes from './pages/Notes.jsx';

/**
 * Componente que protege rutas privadas.
 * - Si está cargando: muestra spinner.
 * - Si no hay usuario: redirige a /login.
 * - Si hay usuario: renderiza la ruta hija con Navbar.
 */
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/notes" element={<Notes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
