import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { User, Lock, Save, Eye, EyeOff, ShieldCheck, CreditCard, Calendar } from 'lucide-react'
import { Button, Input, ImageUpload } from '../../../components/ui'
import { profilesService } from '../../../services/profilesService'
import { supabase } from '../../../lib/supabase'
import useAuthStore from '../../../store/authStore'
import useUIStore from '../../../store/uiStore'
import { CLOUDINARY_FOLDERS, PLAN_LABELS, ROUTES } from '../../../constants'

// ── Esquemas Zod ─────────────────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),
})

const passwordSchema = z
  .object({
    password:        z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path:    ['confirmPassword'],
  })

// ── Sección: Info del perfil ─────────────────────────────────────────────────
function ProfileSection({ profile, onUpdated }) {
  const { addToast }     = useUIStore()
  const { setProfile }   = useAuthStore()
  // Inicializamos el avatar con el valor del perfil.
  // Usamos profile.id como key del componente desde el padre para hacer remount si cambia.
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver:      zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  })

  // Solo resincronizamos el nombre si el perfil cambia y el form no tiene edits pendientes
  useEffect(() => {
    if (!isDirty) {
      reset({ full_name: profile?.full_name ?? '' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.full_name])

  const mutation = useMutation({
    mutationFn: (values) =>
      profilesService.updateProfile(profile.id, {
        full_name:  values.full_name.trim(),
        avatar_url: avatarUrl,
      }),
    onSuccess: (updated) => {
      setProfile(updated)
      reset({ full_name: updated.full_name ?? '' })
      addToast({ message: 'Perfil actualizado correctamente', type: 'success' })
      onUpdated?.()
    },
    onError: (err) => {
      addToast({ message: err.message ?? 'Error al actualizar el perfil', type: 'error' })
    },
  })

  const hasChanges = isDirty || avatarUrl !== (profile?.avatar_url ?? null)

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
      {/* Avatar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-brand-gold/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-gold/10 flex items-center justify-center ring-2 ring-brand-gold/20">
              <User size={32} className="text-brand-gold/60" />
            </div>
          )}
        </div>
        <div className="flex-1 w-full">
          <p className="text-sm text-content-secondary mb-2">
            Foto de perfil (opcional)
          </p>
          <ImageUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            folder={CLOUDINARY_FOLDERS.STORE_LOGOS}
            aspectRatio="1:1"
            label=""
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Nombre completo */}
      <Input
        label="Nombre completo"
        required
        placeholder="Ej. Juan Pérez"
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      {/* Email (solo lectura) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-content-secondary">
          Correo electrónico
        </label>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-content-muted">
          {profile?.email ?? '—'}
          <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">No editable</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={mutation.isPending}
          disabled={!hasChanges || mutation.isPending}
        >
          <Save size={15} /> Guardar cambios
        </Button>
      </div>
    </form>
  )
}

// ── Sección: Cambiar contraseña ──────────────────────────────────────────────
function PasswordSection() {
  const { addToast } = useUIStore()
  const [showPwd,        setShowPwd]        = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: async ({ password }) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: () => {
      reset()
      addToast({ message: 'Contraseña actualizada correctamente', type: 'success' })
    },
    onError: (err) => {
      addToast({ message: err.message ?? 'Error al actualizar la contraseña', type: 'error' })
    },
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      {/* Nueva contraseña */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-content-secondary">
          Nueva contraseña <span className="text-brand-gold">*</span>
        </label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            className={`w-full rounded-lg border bg-brand-black-soft px-4 py-2.5 pr-11 text-sm text-content-primary placeholder:text-content-muted transition-colors focus:outline-none focus:ring-2 ${
              errors.password
                ? 'border-state-error focus:ring-state-error/30'
                : 'border-white/10 hover:border-white/20 focus:ring-brand-gold/50 focus:border-brand-gold'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-state-error mt-0.5">{errors.password.message}</p>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-content-secondary">
          Confirmar contraseña <span className="text-brand-gold">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPwd ? 'text' : 'password'}
            placeholder="Repite tu nueva contraseña"
            className={`w-full rounded-lg border bg-brand-black-soft px-4 py-2.5 pr-11 text-sm text-content-primary placeholder:text-content-muted transition-colors focus:outline-none focus:ring-2 ${
              errors.confirmPassword
                ? 'border-state-error focus:ring-state-error/30'
                : 'border-white/10 hover:border-white/20 focus:ring-brand-gold/50 focus:border-brand-gold'
            }`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
          >
            {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-state-error mt-0.5">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={mutation.isPending}
        >
          <Lock size={15} /> Actualizar contraseña
        </Button>
      </div>
    </form>
  )
}

// ── Sección: Información de cuenta ──────────────────────────────────────────
function AccountInfoSection({ profile }) {
  const plan      = profile?.plan ?? 'free'
  const role      = profile?.role ?? 'user'
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-content-muted uppercase tracking-wide flex items-center gap-1.5">
            <CreditCard size={12} /> Plan actual
          </label>
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/10 bg-white/5">
            <span className="text-sm text-content-primary font-medium">
              {PLAN_LABELS[plan] ?? plan}
            </span>
            {plan === 'free' && (
              <Link to={ROUTES.DASHBOARD_MEMBERSHIP}>
                <span className="text-xs text-brand-gold hover:underline">Mejorar</span>
              </Link>
            )}
          </div>
        </div>

        {/* Rol */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-content-muted uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck size={12} /> Rol
          </label>
          <div className="flex items-center px-4 py-2.5 rounded-lg border border-white/10 bg-white/5">
            <span className="text-sm text-content-primary">
              {role === 'admin' ? 'Administrador' : 'Vendedor'}
            </span>
            <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full text-content-muted">
              No editable
            </span>
          </div>
        </div>
      </div>

      {/* Miembro desde */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-content-muted uppercase tracking-wide flex items-center gap-1.5">
          <Calendar size={12} /> Miembro desde
        </label>
        <div className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5">
          <span className="text-sm text-content-primary">{createdAt}</span>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
function DashboardProfile() {
  const { profile, user } = useAuthStore()

  // Enriquece profile con email de auth
  const enrichedProfile = profile ? { ...profile, email: user?.email } : null

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Mi Perfil</h1>
        <p className="text-content-secondary mt-1">
          Administra tu información personal y credenciales de acceso.
        </p>
      </div>

      {/* Sección info personal */}
      <div className="card-base p-6 space-y-2">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-brand-gold/10">
            <User size={16} className="text-brand-gold" />
          </div>
          <h2 className="text-base font-semibold text-content-primary">Información personal</h2>
        </div>
        {enrichedProfile && <ProfileSection profile={enrichedProfile} />}
      </div>

      {/* Sección información de cuenta */}
      <div className="card-base p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-brand-gold/10">
            <ShieldCheck size={16} className="text-brand-gold" />
          </div>
          <h2 className="text-base font-semibold text-content-primary">Información de cuenta</h2>
        </div>
        {enrichedProfile && <AccountInfoSection profile={enrichedProfile} />}
      </div>

      {/* Sección contraseña */}
      <div className="card-base p-6 space-y-2">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-brand-gold/10">
            <Lock size={16} className="text-brand-gold" />
          </div>
          <h2 className="text-base font-semibold text-content-primary">Cambiar contraseña</h2>
        </div>
        <PasswordSection />
      </div>
    </div>
  )
}

export default DashboardProfile
