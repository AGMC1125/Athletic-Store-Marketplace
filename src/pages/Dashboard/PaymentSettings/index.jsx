import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Landmark, Save, CheckCircle2, AlertCircle, Info, Building2, CreditCard, User } from 'lucide-react'
import { Button, Input } from '../../../components/ui'
import { bankAccountsService } from '../../../services/bankAccountsService'
import useAuthStore from '../../../store/authStore'
import useUIStore from '../../../store/uiStore'

// ── Catálogo de bancos mexicanos ─────────────────────────────────────────────
const MEXICAN_BANKS = [
  'BBVA',
  'Banorte',
  'Santander',
  'Citibanamex',
  'HSBC',
  'Scotiabank',
  'Banco Azteca',
  'BanCoppel',
  'Inbursa',
  'BanRegio',
  'Compartamos Banco',
  'Banco del Bienestar',
  'STP (Sistema de Transferencias y Pagos)',
  'Nu México',
  'Hey Banco',
  'Otro',
]

// ── Schema de validación ─────────────────────────────────────────────────────
const bankSchema = z.object({
  clabe: z
    .string()
    .regex(/^\d{18}$/, 'La CLABE debe contener exactamente 18 dígitos numéricos'),
  bank_name: z
    .string()
    .min(2, 'Selecciona un banco')
    .max(100, 'Máximo 100 caracteres'),
  holder_name: z
    .string()
    .min(3, 'El nombre del titular debe tener al menos 3 caracteres')
    .max(120, 'Máximo 120 caracteres'),
})

// ── Alert reutilizable ───────────────────────────────────────────────────────
function Alert({ variant = 'info', icon: Icon, title, children, className = '' }) {
  const variants = {
    info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    error:   'bg-red-500/10 border-red-500/20 text-red-400',
  }

  return (
    <div className={`rounded-xl border p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon size={20} className="flex-shrink-0 mt-0.5" />}
        <div className="flex-1 space-y-1">
          {title && <p className="font-semibold text-sm">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
function PaymentSettings() {
  const { store } = useAuthStore()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState(false)

  // Cargar cuenta bancaria existente
  const { data: bankAccount, isLoading } = useQuery({
    queryKey: ['bank-account', store?.id],
    queryFn: () => bankAccountsService.getBankAccount(store.id),
    enabled: !!store?.id,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(bankSchema),
    mode: 'onChange',
    defaultValues: {
      clabe:       '',
      bank_name:   '',
      holder_name: '',
    },
  })

  // Pre-cargar datos si ya existen
  useEffect(() => {
    if (bankAccount) {
      reset({
        clabe:       bankAccount.clabe       ?? '',
        bank_name:   bankAccount.bank_name   ?? '',
        holder_name: bankAccount.holder_name ?? '',
      })
    }
  }, [bankAccount, reset])

  const mutation = useMutation({
    mutationFn: (values) => bankAccountsService.upsertBankAccount(store.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-account', store?.id] })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
      addToast({ message: 'Método de pago guardado correctamente', type: 'success' })
    },
    onError: (err) => {
      console.error('Error saving bank account:', err)
      const msg = err?.message ?? ''
      if (msg.includes('char_length')) {
        addToast({ message: 'La CLABE debe tener exactamente 18 dígitos', type: 'error' })
      } else {
        addToast({ message: 'Error al guardar. Intenta nuevamente.', type: 'error' })
      }
    },
  })

  const clabeValue = watch('clabe')
  const isEditing = !!bankAccount

  // Sin tienda, no puede configurar pagos
  if (!store) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-gold/10">
              <Landmark size={24} className="text-brand-gold" />
            </div>
            Método de Pago
          </h1>
        </div>
        <Alert variant="warning" icon={AlertCircle} title="Primero crea tu tienda">
          Para configurar tu método de pago, primero necesitas crear tu tienda en la sección
          "Mi Tienda" del menú lateral.
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-content-secondary">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-gold/10">
            <Landmark size={24} className="text-brand-gold" />
          </div>
          Método de Pago
        </h1>
        <p className="text-content-secondary mt-2 leading-relaxed">
          Configura tu cuenta bancaria para recibir pagos por transferencia.
          Esta información se mostrará a tus clientes cuando realicen un pedido.
        </p>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <Alert variant="success" icon={CheckCircle2} title="¡Datos guardados!">
          Tu método de pago se actualizó correctamente. Los clientes verán esta información al realizar una compra.
        </Alert>
      )}

      {/* Info para nuevos */}
      {!isEditing && (
        <Alert variant="info" icon={Info} title="Método de pago por transferencia">
          Configura tu cuenta bancaria para que los clientes puedan pagarte directamente vía transferencia SPEI.
          Asegúrate de ingresar correctamente la CLABE interbancaria.
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Building2 size={20} className="text-brand-gold" />
            <h2 className="text-lg font-bold text-content-primary">Datos Bancarios</h2>
          </div>

          {/* CLABE */}
          <div>
            <Input
              label="CLABE interbancaria"
              placeholder="Ej: 012345678901234567"
              required
              maxLength={18}
              error={errors.clabe?.message}
              icon={CreditCard}
              {...register('clabe')}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-content-muted">
                18 dígitos numéricos de tu cuenta CLABE
              </p>
              <p className={`text-xs ${clabeValue?.length === 18 ? 'text-green-400' : 'text-content-muted'}`}>
                {clabeValue?.length ?? 0}/18
              </p>
            </div>
          </div>

          {/* Banco receptor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-secondary">
              Banco receptor <span className="text-brand-gold">*</span>
            </label>
            <select
              className={`w-full rounded-lg border bg-brand-black-soft px-4 py-2.5 text-sm text-content-primary transition-colors focus:outline-none focus:ring-2 ${
                errors.bank_name
                  ? 'border-state-error focus:ring-state-error/30'
                  : 'border-white/10 hover:border-white/20 focus:ring-brand-gold/50 focus:border-brand-gold'
              }`}
              {...register('bank_name')}
            >
              <option value="">Selecciona un banco</option>
              {MEXICAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
            {errors.bank_name && (
              <p className="text-xs text-state-error">{errors.bank_name.message}</p>
            )}
          </div>

          {/* Nombre del titular */}
          <Input
            label="Nombre del titular"
            placeholder="Ej: Juan Pérez López"
            required
            error={errors.holder_name?.message}
            icon={User}
            {...register('holder_name')}
          />

          <p className="text-xs text-content-muted leading-relaxed">
            Asegúrate de que el nombre del titular coincida exactamente con el registrado en el banco.
            Esta información será visible para los compradores al momento de realizar una transferencia.
          </p>
        </div>

        {/* Submit */}
        <div className="card-base p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 backdrop-blur-sm bg-brand-black-card/95 border-brand-gold/20">
          <div className="flex-1">
            <p className="text-sm text-content-secondary">
              {isDirty
                ? 'Tienes cambios sin guardar'
                : isEditing
                  ? 'No hay cambios pendientes'
                  : 'Completa los campos para guardar'}
            </p>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
            className="w-full sm:w-auto min-w-[200px]"
          >
            <Save size={18} />
            {isEditing ? 'Actualizar Datos' : 'Guardar Método de Pago'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PaymentSettings
