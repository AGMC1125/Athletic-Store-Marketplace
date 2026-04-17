import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { useAuthActions } from '../../hooks/useAuth'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { ROUTES } from '../../constants'
import { useState, useEffect } from 'react'

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

function LoginPage() {
  const { signIn } = useAuthActions()
  const { addToast } = useUIStore()
  const { isAuthenticated, isLoading: authLoading, profile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  const from = location.state?.from ?? ROUTES.DASHBOARD

  // Navegar cuando la sesión Y la carga inicial terminen (authLoading: false).
  // Usamos profile?.role — si el perfil falló al cargar (null), toma la ruta
  // por defecto (from / dashboard) sin bloquear la navegación.
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const destination = profile?.role === 'admin' ? ROUTES.ADMIN : from
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, authLoading, profile, from, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values) {
    setIsLoading(true)
    try {
      await signIn(values)
      // No navegamos aquí — el useEffect de arriba detecta isAuthenticated y navega
      addToast({ message: '¡Bienvenido de vuelta!', type: 'success' })
    } catch (err) {
      addToast({ message: err.message ?? 'Error al iniciar sesión', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 mb-4">
            <ShoppingBag size={32} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-content-primary">Iniciar sesión</h1>
          <p className="text-content-secondary text-sm mt-1">
            Accede al panel de tu tienda
          </p>
        </div>

        {/* Form */}
        <div className="card-base p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="text-right">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-brand-gold hover:text-brand-gold-light transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Iniciar sesión
            </Button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-content-secondary mt-5">
          ¿No tienes cuenta?{' '}
          <Link to={ROUTES.REGISTER} className="text-brand-gold hover:text-brand-gold-light font-medium transition-colors">
            Registra tu tienda gratis
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
