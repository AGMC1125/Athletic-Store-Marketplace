import { useState } from 'react'
import { Modal } from '../../../components/ui'
import useAuthStore from '../../../store/authStore'
import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES, PLANS } from '../../../constants'
import { formatPrice } from '../../../utils/formatters'
import {
  Check, Zap, Star, MessageCircle, X,
  Package, ImageIcon, BadgeCheck, Instagram,
  Megaphone, ShieldCheck, Sparkles,
} from 'lucide-react'

// ── Features por plan ──────────────────────────────────────────────────────
const PLAN_FEATURES = {
  [PLANS.FREE]: [
    { icon: Package,    text: 'Hasta 5 productos publicados' },
    { icon: ImageIcon,  text: '3 fotos por color/variante' },
    { icon: ShieldCheck,text: 'Perfil público de tienda' },
    { icon: MessageCircle, text: 'Contacto directo por WhatsApp' },
  ],
  [PLANS.PRO]: [
    { icon: Package,    text: 'Hasta 50 productos publicados' },
    { icon: ImageIcon,  text: '3 fotos por color/variante' },
    { icon: ShieldCheck,text: 'Perfil público de tienda' },
    { icon: MessageCircle, text: 'Contacto directo por WhatsApp' },
    { icon: BadgeCheck, text: 'Badge de tienda verificada' },
    { icon: Megaphone,  text: 'Mayor visibilidad en el catálogo' },
    { icon: Instagram,  text: 'Campaña publicitaria en redes sociales (Instagram, Facebook y TikTok)' },
  ],
}

// ── UpgradeModal ───────────────────────────────────────────────────────────

function UpgradeModal({ isOpen, onClose }) {
  const { profile } = useAuthStore()
  const planName = PLAN_LABELS[PLANS.PRO]
  const price    = PLAN_PRICES[PLANS.PRO]

  const whatsappMessage = encodeURIComponent(
    `Hola, soy ${profile?.full_name ?? 'un usuario'} (correo: ${profile?.email ?? ''}) y me interesa el Plan ${planName} de Athletic Store Marketplace. ¿Me pueden dar más información?`
  )
  const whatsappUrl = `https://wa.me/529614551344?text=${whatsappMessage}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Activar Plan ${planName}`} size="sm">
      <div className="space-y-5">
        {/* Precio destacado */}
        <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-5 text-center">
          <p className="text-brand-gold text-3xl font-black">
            {formatPrice(price)}
            <span className="text-sm text-content-secondary font-normal">/mes</span>
          </p>
          <p className="text-sm text-content-secondary mt-1">Plan {planName}</p>
        </div>

        <p className="text-sm text-content-secondary text-center leading-relaxed">
          La activación del plan se gestiona directamente con nuestro equipo.
          Contáctanos y te ayudamos a activarlo de inmediato.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20c45e] text-white font-semibold text-sm transition-colors"
        >
          <MessageCircle size={18} />
          Solicitar por WhatsApp
        </a>

        <button
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm text-content-muted hover:text-content-primary transition-colors"
        >
          <X size={14} />
          Cancelar
        </button>
      </div>
    </Modal>
  )
}

// ── PlanCard ───────────────────────────────────────────────────────────────

function PlanCard({ planKey, isCurrent, onUpgrade }) {
  const isPro   = planKey === PLANS.PRO
  const price   = PLAN_PRICES[planKey]
  const limit   = PLAN_LIMITS[planKey]
  const features = PLAN_FEATURES[planKey]

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
      isPro
        ? 'border-brand-gold/40 bg-gradient-to-b from-brand-gold/5 to-transparent shadow-[0_0_40px_rgba(212,175,55,0.08)]'
        : 'border-white/10 bg-brand-black-card'
    }`}>
      {/* Badge recomendado */}
      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-gold text-black">
            <Sparkles size={11} />
            RECOMENDADO
          </span>
        </div>
      )}

      {/* Plan actual */}
      {isCurrent && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-content-secondary border border-white/10">
            <Check size={11} />
            Activo
          </span>
        </div>
      )}

      {/* Encabezado */}
      <div className="mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
          isPro ? 'bg-brand-gold/15 border border-brand-gold/30' : 'bg-white/5 border border-white/10'
        }`}>
          {isPro
            ? <Zap size={18} className="text-brand-gold" />
            : <Star size={18} className="text-content-muted" />
          }
        </div>
        <h3 className={`text-lg font-bold mb-1 ${isPro ? 'text-brand-gold' : 'text-content-primary'}`}>
          Plan {PLAN_LABELS[planKey]}
        </h3>
        <div className="flex items-baseline gap-1">
          {price === 0 ? (
            <span className="text-3xl font-black text-content-primary">Gratis</span>
          ) : (
            <>
              <span className="text-3xl font-black text-content-primary">{formatPrice(price)}</span>
              <span className="text-sm text-content-muted">/mes</span>
            </>
          )}
        </div>
        <p className="text-xs text-content-muted mt-1">
          {limit === Infinity ? 'Productos ilimitados' : `Hasta ${limit} productos`}
        </p>
      </div>

      {/* Divider */}
      <div className={`h-px mb-5 ${isPro ? 'bg-brand-gold/15' : 'bg-white/5'}`} />

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-6">
        {features.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm">
            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              isPro ? 'bg-brand-gold/15 text-brand-gold' : 'bg-white/5 text-content-muted'
            }`}>
              <Check size={10} strokeWidth={3} />
            </div>
            <span className={isPro ? 'text-content-secondary' : 'text-content-muted'}>{text}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className={`text-center py-2.5 text-sm font-medium rounded-xl ${
          isPro
            ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
            : 'bg-white/5 text-content-muted'
        }`}>
          <Check size={14} className="inline mr-1.5" />
          Plan actual
        </div>
      ) : isPro ? (
        <button
          onClick={onUpgrade}
          className="w-full py-3 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 active:scale-95 transition-all"
        >
          <Zap size={14} className="inline mr-1.5" />
          Activar Plan Pro
        </button>
      ) : (
        <div className="text-center py-2.5 text-sm text-content-muted bg-white/3 rounded-xl border border-white/5">
          Plan base
        </div>
      )}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────

function DashboardMembership() {
  const { profile }    = useAuthStore()
  const currentPlan    = profile?.plan ?? PLANS.FREE
  const isPro          = currentPlan === PLANS.PRO
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Membresía</h1>
        <p className="text-content-secondary mt-1 text-sm">
          Elige el plan que mejor se adapte a tu tienda.
        </p>
      </div>

      {/* Banner de estado actual */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 border ${
        isPro
          ? 'border-brand-gold/30 bg-brand-gold/5'
          : 'border-white/10 bg-white/3'
      }`}>
        <div className={`p-3 rounded-xl ${isPro ? 'bg-brand-gold/15' : 'bg-white/8'}`}>
          {isPro
            ? <Zap size={22} className="text-brand-gold" />
            : <Star size={22} className="text-content-muted" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-content-muted mb-0.5">Tu plan actual</p>
          <p className={`text-lg font-bold ${isPro ? 'text-brand-gold' : 'text-content-primary'}`}>
            Plan {PLAN_LABELS[currentPlan]}
          </p>
          <p className="text-sm text-content-secondary">
            {PLAN_LIMITS[currentPlan] === Infinity
              ? 'Productos ilimitados'
              : `Hasta ${PLAN_LIMITS[currentPlan]} productos publicados`}
          </p>
        </div>
        {!isPro && (
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-gold text-black font-bold text-sm hover:bg-brand-gold/90 transition-all active:scale-95"
          >
            <Zap size={14} />
            Mejorar a Pro
          </button>
        )}
      </div>

      {/* Comparación de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {[PLANS.FREE, PLANS.PRO].map((planKey) => (
          <PlanCard
            key={planKey}
            planKey={planKey}
            isCurrent={currentPlan === planKey}
            onUpgrade={() => setShowModal(true)}
          />
        ))}
      </div>

      {/* Nota */}
      <p className="text-xs text-content-muted max-w-lg">
        Los pagos se gestionan manualmente por el momento. Al solicitar el Plan Pro,
        nuestro equipo te contactará para completar la activación.
      </p>

      <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

export default DashboardMembership
