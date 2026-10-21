import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import AppShellLayout from './AppShellLayout';
import RequireAuth from '../components/RequireAuth';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectPage from '../pages/ProjectPage';
import RequestsPage from '../pages/RequestsPage';
import HistoryPage from '../pages/HistoryPage';
import MaterialsPage from '../pages/MaterialsPage';
import ProfilePage from '../pages/ProfilePage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          {
            path: '/projects',
            element: <ProjectsPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
      {
        path: '/projects/:projectId',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <ProjectPage />,
          },
          {
            path: 'requests',
            element: <RequestsPage />,
          },
          {
            path: 'materials',
            element: <MaterialsPage />,
          },
          {
            path: 'history',
            element: <HistoryPage />,
          },
        ],
      },
    ],
  },
]);
