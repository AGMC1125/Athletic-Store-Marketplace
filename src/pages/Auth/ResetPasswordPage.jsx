import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../../components/ui'
import { ROUTES } from '../../constants'

const schema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/**
 * Página de restablecimiento de contraseña.
 * El usuario llega aquí desde AuthCallbackPage cuando el tipo de enlace es 'recovery'.
 * En este punto Supabase ya tiene una sesión activa con el token de recuperación.
 */
function ResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  async function onSubmit({ password }) {
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setServerError(error.message ?? 'Error al actualizar la contraseña')
      return
    }
    setDone(true)
    setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 3000)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black px-4">
        <div className="max-w-md w-full card-base p-8 text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-state-success/10 mb-2">
            <CheckCircle2 size={32} className="text-state-success" />
          </div>
          <h1 className="text-xl font-bold text-content-primary">¡Contraseña actualizada!</h1>
          <p className="text-sm text-content-secondary">
            Tu contraseña se cambió correctamente. Redirigiendo al dashboard…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black px-4">
      <div className="max-w-md w-full card-base p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-xl bg-brand-gold/10 mb-4">
            <Lock size={24} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-content-primary">Nueva contraseña</h1>
          <p className="text-sm text-content-secondary mt-1">
            Elige una contraseña segura para tu cuenta.
          </p>
        </div>

        {/* Error del servidor */}
        {serverError && (
          <div className="rounded-xl border border-state-error/30 bg-state-error/10 px-4 py-3 text-sm text-state-error">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contraseña */}
          <div className="relative">
            <Input
              label="Nueva contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              required
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-9 text-content-muted hover:text-content-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirmar */}
          <div className="relative">
            <Input
              label="Confirmar contraseña"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repite la contraseña"
              required
              icon={Lock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-9 text-content-muted hover:text-content-secondary transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Guardar nueva contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
