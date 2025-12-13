import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import { AccountProvider } from './contexts/AccountContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DomainDetail from './pages/DomainDetail';
import CustomHostnames from './pages/CustomHostnames';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

/**
 * 受保护的路由组件
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <AccountProvider>{children}</AccountProvider>;
}

/**
 * 主应用组件
 */
function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 受保护的路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="domain/:zoneId" element={<DomainDetail />} />
        <Route path="hostnames/:zoneId" element={<CustomHostnames />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
