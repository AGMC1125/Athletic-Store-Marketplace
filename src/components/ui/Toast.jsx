import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import useUIStore from '../../store/uiStore'

const ICONS = {
  success: <CheckCircle size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertCircle size={18} />,
  info:    <Info size={18} />,
}

const STYLES = {
  success: 'border-state-success/40 text-state-success',
  error:   'border-state-error/40 text-state-error',
  warning: 'border-state-warning/40 text-state-warning',
  info:    'border-state-info/40 text-state-info',
}

function Toast({ id, message, type = 'info' }) {
  const { removeToast } = useUIStore()
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border bg-brand-black-soft shadow-card animate-slide-up min-w-[280px] max-w-sm',
        STYLES[type]
      )}
      role="alert"
    >
      <span className="mt-0.5 shrink-0">{ICONS[type]}</span>
      <p className="text-sm text-content-primary flex-1">{message}</p>
      <button onClick={() => removeToast(id)} className="shrink-0 hover:opacity-70" aria-label="Cerrar">
        <X size={14} />
      </button>
    </div>
  )
}

/** Container de toasts, va en el root de la app */
export function ToastContainer() {
  const { toasts } = useUIStore()
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => <Toast key={t.id} {...t} />)}
    </div>
  )
}

export default Toast
