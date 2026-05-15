import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import ProtectedRoute from '../components/ui/ProtectedRoute'

const LandingPage   = lazy(() => import('../pages/LandingPage'))
const CompaniesPage = lazy(() => import('../pages/CompaniesPage'))
const SupportPage   = lazy(() => import('../pages/SupportPage'))

const SuspenseLayout = () => (
  <Suspense fallback={<div>loading...</div>}> 
    <Outlet />
  </Suspense>
)

const ProtectedLayout = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
)

const router = createBrowserRouter([
  { index: true, element: <Navigate to="/home" replace /> },
  
  {
    element: <SuspenseLayout />,
    children: [
      { path: '/home', element: <LandingPage /> },
    ],
  },

  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <SuspenseLayout />,
        children: [
          { path: '/companies', element: <CompaniesPage /> },
          { path: '/support', element: <SupportPage /> },
        ],
      },
    ],
  },
])

export default router