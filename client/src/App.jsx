import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Jobs } from './pages/Jobs.jsx';
import { JobDetail } from './pages/JobDetail.jsx';
import { Profile } from './pages/Profile.jsx';
import { Applications } from './pages/Applications.jsx';
import { ApplicationDetail } from './pages/ApplicationDetail.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute>
              <ApplicationDetail />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
