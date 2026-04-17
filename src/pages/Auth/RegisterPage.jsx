import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, CheckCircle } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { useAuthActions } from '../../hooks/useAuth'
import useUIStore from '../../store/uiStore'
import { ROUTES } from '../../constants'
import { useState } from 'react'

const schema = z.object({
  fullName:        z.string().min(3, 'Ingresa tu nombre completo'),
  email:           z.string().email('Correo inválido'),
  password:        z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

function RegisterPage() {
  const { signUp } = useAuthActions()
  const { addToast } = useUIStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ fullName, email, password }) {
    setIsLoading(true)
    try {
      await signUp({ email, password, fullName })
      setSuccess(true)
    } catch (err) {
      addToast({ message: err.message ?? 'Error al registrarse', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center animate-slide-up">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-full bg-state-success/10 border border-state-success/30">
              <CheckCircle size={40} className="text-state-success" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">¡Registro exitoso!</h2>
          <p className="text-content-secondary mb-6">
            Revisa tu correo electrónico y haz clic en el enlace de verificación para activar tu cuenta.
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.LOGIN)}>
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 mb-4">
            <ShoppingBag size={32} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-content-primary">Registra tu tienda</h1>
          <p className="text-content-secondary text-sm mt-1">Gratis — hasta 5 productos</p>
        </div>

        <div className="card-base p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />
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
              placeholder="Mínimo 6 caracteres"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Crear cuenta gratis
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-content-secondary mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to={ROUTES.LOGIN} className="text-brand-gold hover:text-brand-gold-light font-medium transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
