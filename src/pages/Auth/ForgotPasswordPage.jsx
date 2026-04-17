import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { useAuthActions } from '../../hooks/useAuth'
import { ROUTES } from '../../constants'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('Correo inválido'),
})

function ForgotPasswordPage() {
  const { resetPassword } = useAuthActions()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email }) {
    setIsLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-slide-up">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-full bg-brand-gold/10 border border-brand-gold/20">
              <Mail size={36} className="text-brand-gold" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-content-primary mb-2">Correo enviado</h2>
          <p className="text-content-secondary mb-6 text-sm">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link to={ROUTES.LOGIN} className="text-brand-gold text-sm hover:text-brand-gold-light transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-content-primary">Recuperar contraseña</h1>
          <p className="text-content-secondary text-sm mt-1 text-center">
            Ingresa tu correo y te enviaremos un enlace
          </p>
        </div>
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
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Enviar enlace de recuperación
            </Button>
          </form>
        </div>
        <div className="text-center mt-5">
          <Link to={ROUTES.LOGIN} className="text-sm text-content-secondary hover:text-brand-gold transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
