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
    ],
  },
]);
