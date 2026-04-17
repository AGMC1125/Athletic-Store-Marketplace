import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { ToastContainer } from '../ui'

/**
 * Layout para páginas públicas: landing, catálogo, detalle, etc.
 * Incluye Navbar y Footer.
 */
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-black">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  )
}

export default PublicLayout
