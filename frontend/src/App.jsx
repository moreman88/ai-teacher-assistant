import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';

// Placeholder pages - will be implemented fully later
const Tasks = () => (
  <div className="p-8">
    <h2 className="text-xl font-semibold mb-4">Мои задания</h2>
    <p className="text-gray-500">Страница в разработке...</p>
  </div>
);

const Journal = () => (
  <div className="p-8">
    <h2 className="text-xl font-semibold mb-4">Журнал</h2>
    <p className="text-gray-500">Страница в разработке...</p>
  </div>
);

const Groups = () => (
  <div className="p-8">
    <h2 className="text-xl font-semibold mb-4">Группы</h2>
    <p className="text-gray-500">Страница в разработке...</p>
  </div>
);

const Evaluate = () => (
  <div className="p-8">
    <h2 className="text-xl font-semibold mb-4">Оценивание с ИИ</h2>
    <p className="text-gray-500">Страница в разработке...</p>
  </div>
);

const Settings = () => (
  <div className="p-8">
    <h2 className="text-xl font-semibold mb-4">Настройки</h2>
    <p className="text-gray-500">Страница в разработке...</p>
  </div>
);

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }) {
  const { token } = useAuthStore();
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/evaluate" element={<Evaluate />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
