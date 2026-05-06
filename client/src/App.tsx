import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'

const LandingPage   = lazy(() => import('./pages/LandingPage'))
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'))
const SupportPage   = lazy(() => import('./pages/SupportPage'))

const router = createBrowserRouter([
  { index: true, element: <Navigate to="/home" replace /> },
  {
    path: '/home',
    element: (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/companies',
    element: (
      <ProtectedRoute>
        <Suspense fallback={null}>
          <CompaniesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/support',
    element: (
      <ProtectedRoute>
        <Suspense fallback={null}>
          <SupportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
