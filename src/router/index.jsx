import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import AuthInitializer  from '../components/layout/AuthInitializer'
import PublicLayout     from '../components/layout/PublicLayout'
import DashboardLayout  from '../components/layout/DashboardLayout'
import ProtectedRoute   from '../components/layout/ProtectedRoute'
import AdminRoute       from '../components/layout/AdminRoute'
import AdminLayout      from '../components/layout/AdminLayout'

// Public pages
import LandingPage      from '../pages/Landing'
import MarketplacePage  from '../pages/Marketplace'
import ProductDetailPage from '../pages/ProductDetail'
import StoreProfilePage from '../pages/StoreProfile'
import NotFoundPage     from '../pages/NotFound'

// Auth pages
import LoginPage          from '../pages/Auth/LoginPage'
import RegisterPage       from '../pages/Auth/RegisterPage'
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage'
import AuthCallbackPage   from '../pages/Auth/AuthCallbackPage'
import ResetPasswordPage  from '../pages/Auth/ResetPasswordPage'

// Dashboard pages
import DashboardOverview   from '../pages/Dashboard/Overview'
import DashboardStore      from '../pages/Dashboard/Store'
import DashboardProducts   from '../pages/Dashboard/Products'
import DashboardProductForm from '../pages/Dashboard/Products/ProductForm'
import DashboardMembership from '../pages/Dashboard/Membership'
import DashboardPayment    from '../pages/Dashboard/PaymentSettings'
import DashboardProfile    from '../pages/Dashboard/Profile'

// Admin pages
import AdminOverview      from '../pages/Admin/Overview'
import AdminUsers         from '../pages/Admin/Users'
import AdminStores        from '../pages/Admin/Stores'
import AdminProducts      from '../pages/Admin/Products'
import AdminMemberships   from '../pages/Admin/Memberships'
import AdminBankAccounts  from '../pages/Admin/BankAccounts'

import { ROUTES } from '../constants'

export const router = createBrowserRouter([
  {
    // AuthInitializer envuelve TODO para que useAuthInit() siempre corra
    element: <AuthInitializer />,
    children: [
      // ── Rutas públicas ───────────────────────────────────
      {
        element: <PublicLayout />,
        children: [
          { path: ROUTES.HOME,    element: <LandingPage /> },
          { path: ROUTES.CATALOG, element: <MarketplacePage /> },
          { path: ROUTES.PRODUCT, element: <ProductDetailPage /> },
          { path: ROUTES.STORE,   element: <StoreProfilePage /> },

          // Auth (solo para no autenticados)
          { path: ROUTES.LOGIN,           element: <LoginPage /> },
          { path: ROUTES.REGISTER,        element: <RegisterPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },

          // Auth callbacks (accesibles sin sesión activa)
          { path: ROUTES.AUTH_CALLBACK,   element: <AuthCallbackPage /> },
          { path: ROUTES.RESET_PASSWORD,  element: <ResetPasswordPage /> },
        ],
      },

      // ── Rutas privadas (Dashboard) ───────────────────────
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: ROUTES.DASHBOARD,                element: <DashboardOverview /> },
          { path: ROUTES.DASHBOARD_STORE,          element: <DashboardStore /> },
          { path: ROUTES.DASHBOARD_PRODUCTS,       element: <DashboardProducts /> },
          { path: ROUTES.DASHBOARD_PRODUCTS_NEW,   element: <DashboardProductForm /> },
          { path: ROUTES.DASHBOARD_PRODUCTS_EDIT,  element: <DashboardProductForm /> },
          { path: ROUTES.DASHBOARD_MEMBERSHIP,     element: <DashboardMembership /> },
          { path: ROUTES.DASHBOARD_PAYMENT,        element: <DashboardPayment /> },
          { path: ROUTES.DASHBOARD_PROFILE,        element: <DashboardProfile /> },
        ],
      },

      // ── Rutas admin (superadmin only) ───────────────────
      {
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { path: ROUTES.ADMIN,               element: <AdminOverview />      },
          { path: ROUTES.ADMIN_USERS,         element: <AdminUsers />         },
          { path: ROUTES.ADMIN_STORES,        element: <AdminStores />        },
          { path: ROUTES.ADMIN_PRODUCTS,      element: <AdminProducts />      },
          { path: ROUTES.ADMIN_MEMBERSHIPS,   element: <AdminMemberships />   },
          { path: ROUTES.ADMIN_BANK_ACCOUNTS, element: <AdminBankAccounts />  },
        ],
      },

      // ── 404 ─────────────────────────────────────────────
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
