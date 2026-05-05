import { createBrowserRouter, Navigate } from 'react-router';
import RootLayout from './components/layouts/RootLayout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RequestManagement from './pages/RequestManagement';
import DataAccessControl from './pages/DataAccessControl';
import ActivityLogs from './pages/ActivityLogs';
import MyRequests from './pages/MyRequests';
import NewRequest from './pages/NewRequest';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/layouts/ProtectedRoute';
import SecurityOverview from './pages/SecurityOverview';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', Component: StudentDashboard },
      { path: 'admin-dashboard', Component: AdminDashboard },
      { path: 'requests', Component: MyRequests },
      { path: 'new-request', Component: NewRequest },
      { path: 'admin/requests', Component: RequestManagement },
      { path: 'admin/access-control', Component: DataAccessControl },
      { path: 'admin/activity-logs', Component: ActivityLogs },
      { path: 'unauthorized', Component: Unauthorized },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
      { path: 'admin/security', element: <ProtectedRoute requiredRole="admin"><SecurityOverview /></ProtectedRoute> },

      // Student routes
      { path: 'dashboard', element: <ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute> },
      { path: 'requests', element: <ProtectedRoute requiredRole="student"><MyRequests /></ProtectedRoute> },
      { path: 'new-request', element: <ProtectedRoute requiredRole="student"><NewRequest /></ProtectedRoute> },

      // Admin routes
      { path: 'admin-dashboard', element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute> },
      { path: 'admin/requests', element: <ProtectedRoute requiredRole="admin"><RequestManagement /></ProtectedRoute> },
      { path: 'admin/access-control', element: <ProtectedRoute requiredRole="admin"><DataAccessControl /></ProtectedRoute> },
      { path: 'admin/activity-logs', element: <ProtectedRoute requiredRole="admin"><ActivityLogs /></ProtectedRoute> },
    ],
  },
]);
