import { createBrowserRouter } from 'react-router-dom'

// Layouts
import AuthInitializer  from '../components/layout/AuthInitializer'
import PublicLayout     from '../components/layout/PublicLayout'
import DashboardLayout  from '../components/layout/DashboardLayout'
import ProtectedRoute   from '../components/layout/ProtectedRoute'
import AdminRoute       from '../components/layout/AdminRoute'
import AdminLayout      from '../components/layout/AdminLayout'

// Public pages
import LandingPage        from '../pages/Landing'
import MarketplacePage    from '../pages/Marketplace'
import ProductDetailPage  from '../pages/ProductDetail'
import StoreProfilePage   from '../pages/StoreProfile'
import StoresPage         from '../pages/Stores'
import CartPage           from '../pages/Cart'
import CheckoutPage       from '../pages/Checkout'
import OrdersPage         from '../pages/Orders'
import NotFoundPage       from '../pages/NotFound'

// Auth pages
import LoginPage          from '../pages/Auth/LoginPage'
import RegisterPage       from '../pages/Auth/RegisterPage'
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage'
import AuthCallbackPage   from '../pages/Auth/AuthCallbackPage'
import ResetPasswordPage  from '../pages/Auth/ResetPasswordPage'

// Dashboard pages
import DashboardOrdersPage  from '../pages/Dashboard/Orders'
import DashboardOverview    from '../pages/Dashboard/Overview'
import DashboardStore       from '../pages/Dashboard/Store'
import DashboardProducts    from '../pages/Dashboard/Products'
import DashboardProductForm from '../pages/Dashboard/Products/ProductForm'
import DashboardMembership  from '../pages/Dashboard/Membership'
import DashboardPayment     from '../pages/Dashboard/PaymentSettings'
import DashboardProfile     from '../pages/Dashboard/Profile'

// Admin pages
import AdminOverview     from '../pages/Admin/Overview'
import AdminUsers        from '../pages/Admin/Users'
import AdminStores       from '../pages/Admin/Stores'
import AdminProducts     from '../pages/Admin/Products'
import AdminMemberships  from '../pages/Admin/Memberships'
import AdminBankAccounts from '../pages/Admin/BankAccounts'

import { ROUTES } from '../constants'

export const router = createBrowserRouter([
  {
    element: <AuthInitializer />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: ROUTES.HOME,     element: <LandingPage /> },
          { path: ROUTES.CATALOG,  element: <MarketplacePage /> },
          { path: ROUTES.PRODUCT,  element: <ProductDetailPage /> },
          { path: ROUTES.STORE,    element: <StoreProfilePage /> },
          { path: ROUTES.STORES,   element: <StoresPage /> },
          { path: ROUTES.CART,     element: <CartPage /> },
          { path: ROUTES.CHECKOUT, element: <CheckoutPage /> },
          { path: ROUTES.ORDERS,   element: <OrdersPage /> },
          { path: ROUTES.LOGIN,           element: <LoginPage /> },
          { path: ROUTES.REGISTER,        element: <RegisterPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: ROUTES.AUTH_CALLBACK,  element: <AuthCallbackPage /> },
          { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: ROUTES.DASHBOARD,               element: <DashboardOverview /> },
          { path: ROUTES.DASHBOARD_STORE,         element: <DashboardStore /> },
          { path: ROUTES.DASHBOARD_PRODUCTS,      element: <DashboardProducts /> },
          { path: ROUTES.DASHBOARD_PRODUCTS_NEW,  element: <DashboardProductForm /> },
          { path: ROUTES.DASHBOARD_PRODUCTS_EDIT, element: <DashboardProductForm /> },
          { path: ROUTES.DASHBOARD_ORDERS,        element: <DashboardOrdersPage /> },
          { path: ROUTES.DASHBOARD_MEMBERSHIP,    element: <DashboardMembership /> },
          { path: ROUTES.DASHBOARD_PAYMENT,       element: <DashboardPayment /> },
          { path: ROUTES.DASHBOARD_PROFILE,       element: <DashboardProfile /> },
        ],
      },
      {
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { path: ROUTES.ADMIN,               element: <AdminOverview /> },
          { path: ROUTES.ADMIN_USERS,         element: <AdminUsers /> },
          { path: ROUTES.ADMIN_STORES,        element: <AdminStores /> },
          { path: ROUTES.ADMIN_PRODUCTS,      element: <AdminProducts /> },
          { path: ROUTES.ADMIN_MEMBERSHIPS,   element: <AdminMemberships /> },
          { path: ROUTES.ADMIN_BANK_ACCOUNTS, element: <AdminBankAccounts /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
