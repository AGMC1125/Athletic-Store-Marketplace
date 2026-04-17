import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui'
import { ROUTES } from '../../constants'

/**
 * Página de callback de autenticación.
 *
 * Supabase redirige aquí en dos casos:
 *   1. Verificación de correo electrónico tras el registro.
 *   2. Reset de contraseña (enlace enviado por correo).
 *
 * La URL llega con un fragment (#access_token=...&type=...) o
 * con query params (?code=...) según la versión del cliente.
 * El SDK de Supabase los procesa automáticamente; solo hay que
 * llamar a getSession() y reaccionar al evento PASSWORD_RECOVERY.
 */
function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let mounted = true

    async function handleCallback() {
      try {
        // Supabase JS v2 procesa el hash/fragment automáticamente.
        // exchangeCodeForSession maneja el PKCE code si viene en query params.
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const type = urlParams.get('type') // 'recovery' | 'signup' | etc.
        const errorParam = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        // ── Error devuelto por Supabase en la URL ──────────────
        if (errorParam) {
          if (!mounted) return
          setErrorMsg(errorDescription ?? errorParam)
          setStatus('error')
          return
        }

        // ── Intercambiar code por sesión (PKCE flow) ───────────
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            if (!mounted) return
            setErrorMsg(error.message)
            setStatus('error')
            return
          }
        }

        // ── Leer sesión resultante ─────────────────────────────
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          if (!mounted) return
          setErrorMsg('No se pudo verificar la sesión. El enlace puede haber expirado.')
          setStatus('error')
          return
        }

        if (!mounted) return

        // ── Redirigir según el tipo de callback ────────────────
        if (type === 'recovery') {
          // Password recovery: ir a la página de nueva contraseña
          navigate(ROUTES.RESET_PASSWORD, { replace: true })
        } else {
          // Verificación de email u otro: ir al dashboard
          navigate(ROUTES.DASHBOARD, { replace: true })
        }
      } catch (err) {
        console.error('[AuthCallback] Error inesperado:', err)
        if (!mounted) return
        setErrorMsg('Ocurrió un error al procesar el enlace. Intenta de nuevo.')
        setStatus('error')
      }
    }

    handleCallback()
    return () => { mounted = false }
  }, [navigate])

  // ── UI de carga ────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black gap-4">
        <Spinner size="lg" className="text-brand-gold" />
        <p className="text-content-secondary text-sm">Verificando tu cuenta…</p>
      </div>
    )
  }

  // ── UI de error ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black px-4">
      <div className="max-w-md w-full card-base p-8 text-center space-y-5">
        <div className="inline-flex p-4 rounded-full bg-state-error/10 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-state-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-content-primary">Enlace inválido o expirado</h1>
        <p className="text-sm text-content-secondary leading-relaxed">
          {errorMsg || 'No se pudo completar la verificación. El enlace puede haber expirado o ya fue usado.'}
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <a
            href={ROUTES.LOGIN}
            className="w-full py-2.5 rounded-xl bg-brand-gold text-brand-black font-semibold text-sm hover:bg-brand-gold-light transition-colors"
          >
            Ir al inicio de sesión
          </a>
          <a
            href={ROUTES.FORGOT_PASSWORD}
            className="w-full py-2.5 rounded-xl border border-white/10 text-content-secondary text-sm hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
          >
            Reenviar correo de recuperación
          </a>
        </div>
      </div>
    </div>
  )
}

export default AuthCallbackPage
