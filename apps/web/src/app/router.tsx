import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import RequireAuth from '../components/RequireAuth';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectPage from '../pages/ProjectPage';
import RequestsPage from '../pages/RequestsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/projects',
        element: <ProjectsPage />,
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
        ],
      },
    ],
  },
]);

