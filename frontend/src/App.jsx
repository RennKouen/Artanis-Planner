import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Characters from './pages/Characters.jsx';
import Bestiary from './pages/Bestiary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/personagens"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Characters />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bestiario"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Bestiary />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/personagens" replace />} />
    </Routes>
  );
}
