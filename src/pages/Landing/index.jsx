import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import {
  Store, Package, Users, ChevronRight,
  CheckCircle, ArrowRight, Zap, Shield, Globe,
  TrendingUp, Clock, Award, Target, Sparkles, BarChart3,
  CircleDot, MessageCircle,
} from 'lucide-react'
import { Button } from '../../components/ui'
import { ROUTES, CATEGORY_LABELS, CATEGORY_ICONS } from '../../constants'

// ─────────────────────────────────────────────────────────────
// Hook: Intersection Observer para animaciones al hacer scroll
// ─────────────────────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el) } },
      { threshold: 0.15, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

// ─────────────────────────────────────────────────────────────
// Hook: Contador animado
// ─────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, inView = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView || typeof target !== 'number') return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return count
}

// ─────────────────────────────────────────────────────────────
// Componente: Canvas Three.js — red de partículas doradas
// ─────────────────────────────────────────────────────────────
function ParticleCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth
    const H = container.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // Scene + Camera
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000)
    camera.position.z = 30

    // ── Partículas ──
    const PARTICLE_COUNT = 120
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      velocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: 0,
      })
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0xD4AF37,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // ── Líneas entre partículas cercanas ──
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.12,
    })

    let linesMesh = null

    function buildLines() {
      const pos = geo.attributes.position.array
      const lineVerts = []
      const MAX_DIST = 14

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = pos[i*3]   - pos[j*3]
          const dy = pos[i*3+1] - pos[j*3+1]
          const dz = pos[i*3+2] - pos[j*3+2]
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
          if (dist < MAX_DIST) {
            lineVerts.push(pos[i*3], pos[i*3+1], pos[i*3+2])
            lineVerts.push(pos[j*3], pos[j*3+1], pos[j*3+2])
          }
        }
      }

      if (linesMesh) {
        scene.remove(linesMesh)
        linesMesh.geometry.dispose()
      }
      const lineGeo = new THREE.BufferGeometry()
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3))
      linesMesh = new THREE.LineSegments(lineGeo, lineMat)
      scene.add(linesMesh)
    }

    buildLines()

    // ── Mouse parallax ──
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.6
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.6
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Animación ──
    let frameId
    let tick = 0

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      tick++

      const pos = geo.attributes.position.array
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i*3]     += velocities[i].x
        pos[i*3 + 1] += velocities[i].y

        if (Math.abs(pos[i*3])     > 40) velocities[i].x *= -1
        if (Math.abs(pos[i*3 + 1]) > 25) velocities[i].y *= -1
      }
      geo.attributes.position.needsUpdate = true

      // Rebuild lines every 3 frames
      if (tick % 3 === 0) buildLines()

      // Camera gentle parallax
      camera.position.x += (mouse.x * 4 - camera.position.x) * 0.04
      camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.04

      // Slow rotation of particle cloud
      points.rotation.z += 0.0004

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      const W2 = container.clientWidth
      const H2 = container.clientHeight
      camera.aspect = W2 / H2
      camera.updateProjectionMatrix()
      renderer.setSize(W2, H2)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// Componente: Wrapper con animación de entrada al scroll
// ─────────────────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView()

  const transforms = {
    up:    'translateY(40px)',
    left:  'translateX(-40px)',
    right: 'translateX(40px)',
    scale: 'scale(0.92)',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: inView ? 'none' : transforms[direction],
        opacity: inView ? 1 : 0,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Three.js background */}
      <ParticleCanvas />

      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black via-brand-black/95 to-brand-black" style={{ zIndex: 1 }} />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative container-app py-20 md:py-1 text-center" style={{ zIndex: 2 }}>

        {/* Badge */}
        <div
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease 0ms, transform 0.6s ease 0ms',
          }}
          className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-brand-gold/20 bg-brand-gold/5 backdrop-blur-sm"
        >
          <Sparkles size={13} className="text-brand-gold" />
          <span className="text-xs font-semibold text-brand-gold uppercase tracking-widest">
            El Marketplace Deportivo Profesional
          </span>
          <Award size={13} className="text-brand-gold" />
        </div>

        {/* Headline */}
        <h1
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 120ms, transform 0.7s ease 120ms',
          }}
          className="font-black mb-8"
        >
          <span
            className="block text-content-primary"
            style={{ fontSize: 'clamp(2.4rem, 7vw, 5.5rem)', lineHeight: 1.08, marginBottom: '0.25em' }}
          >
            Transforma tu tienda
          </span>
          <span
            className="block"
            style={{
              fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
              lineHeight: 1.08,
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 40%, #B8960C 80%, #D4AF37 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 4s linear infinite',
            }}
          >
            en un negocio digital
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 240ms, transform 0.7s ease 240ms',
          }}
          className="text-content-secondary text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-6 leading-relaxed font-light"
        >
          Conecta con miles de atletas y entusiastas del deporte.{' '}
          <span className="text-content-primary font-medium">Publica tu catálogo</span>,
          recibe pedidos y{' '}
          <span className="text-content-primary font-medium">haz crecer tu negocio</span> sin complicaciones.
        </p>

        {/* CTAs */}
        <div
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 360ms, transform 0.7s ease 360ms',
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="group relative overflow-hidden min-w-[260px] inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-brand-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-brand-gold/30"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D76E, #D4AF37)', backgroundSize: '200% auto' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #F5D76E, #D4AF37, #B8960C)', backgroundSize: '200% auto' }} />
            <Store size={20} className="relative z-10 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10">Crear mi tienda gratis</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate(ROUTES.CATALOG)}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base text-content-primary border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-brand-gold/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Explorar catálogo
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Trust badges */}
        <div
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.7s ease 480ms',
          }}
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2"
        >
          {['Sin tarjeta de crédito', 'Setup en 5 minutos', 'Soporte incluido'].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-content-muted">
              <CheckCircle size={12} className="text-brand-gold/70 shrink-0" />
              {item}
            </span>
          ))}
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          style={{
            opacity: loaded ? 0.5 : 0,
            transition: 'opacity 1s ease 1200ms',
          }}
        >
          <span className="text-xs text-content-muted tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-brand-gold/50 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0% center }
          100% { background-position: 200% center }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) }
          50%       { transform: translateY(-12px) }
        }
      `}</style>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────

// Sub-componente para evitar llamar hooks dentro de .map()
function StatItem({ icon: Icon, value, suffix, label, sub, inView, delay }) {
  const count = useCountUp(value, 1600, inView)
  return (
    <div
      className="text-center group cursor-default"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-gold/10 mb-3 group-hover:bg-brand-gold/20 transition-colors">
        <Icon size={22} className="text-brand-gold" />
      </div>
      <p className="text-3xl md:text-4xl font-black text-brand-gold">
        {count}{suffix}
      </p>
      <p className="text-sm font-semibold text-content-primary mt-1">{label}</p>
      <p className="text-xs text-content-muted mt-0.5">{sub}</p>
    </div>
  )
}

function StatsSection() {
  const [ref, inView] = useInView()

  const stats = [
    { icon: TrendingUp, value: 100, suffix: '%',   label: 'Gratis para empezar',      sub: 'Sin costos ocultos' },
    { icon: Clock,      value: 5,   suffix: ' min', label: 'Tiempo de setup',          sub: 'Empieza hoy mismo' },
    { icon: BarChart3,  value: 0,   suffix: '%',    label: 'Comisión por venta',       sub: 'Ganas tú, siempre' },
    { icon: Target,     value: 24,  suffix: '/7',   label: 'Visibilidad del catálogo', sub: 'Sin interrupciones' },
  ]

  return (
    <section ref={ref} className="py-16 border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.03) 50%, transparent)' }} />
      <div className="container-app">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <StatItem key={s.label} {...s} inView={inView} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  footwear:           '/categories/calzado.png',
  socks:              '/categories/calcetas.png',
  shin_guards:        '/categories/espinilleras.png',
  goalkeeper_gloves:  '/categories/guantes.png',
}

function CategoriesSection() {
  const navigate = useNavigate()
  const [titleRef, titleIn] = useInView()

  const categories = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
    image: CATEGORY_IMAGES[value],
  }))

  return (
    <section className="py-14 relative overflow-hidden">
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />
      <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent" />

      <div className="container-app">
        {/* Título */}
        <div
          ref={titleRef}
          className="text-center mb-10"
          style={{
            opacity: titleIn ? 1 : 0,
            transform: titleIn ? 'none' : 'translateY(30px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/15">
            <Package size={13} className="text-brand-gold" />
            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Categorías</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-content-primary mb-4">
            Todo el equipamiento deportivo
            <span className="block mt-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              en un solo lugar
            </span>
          </h2>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Desde calzado profesional hasta accesorios para cada disciplina
          </p>
        </div>

        {/* Cards con imagen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <Reveal key={cat.value} delay={i * 80} direction="up">
              <button
                onClick={() => navigate(`${ROUTES.CATALOG}?categoria=${cat.value}`)}
                className="w-full group relative rounded-2xl overflow-hidden border border-white/8 hover:border-brand-gold/40 transition-all duration-300 focus:outline-none"
                style={{ aspectRatio: '3/4' }}
              >
                {/* Imagen de fondo */}
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-brand-black-card" />
                )}

                {/* Overlay gradiente oscuro en la parte inferior */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Gold border glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: 'inset 0 0 0 2px rgba(212,175,55,0.5)' }} />

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm md:text-base font-bold text-white group-hover:text-brand-gold transition-colors leading-tight">
                    {cat.label}
                  </p>
                  <p className="text-xs text-white/60 mt-0.5 group-hover:text-brand-gold/70 transition-colors">
                    Ver productos →
                  </p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-10" delay={400}>
          <button
            onClick={() => navigate(ROUTES.CATALOG)}
            className="group inline-flex items-center gap-2 text-sm text-content-muted hover:text-brand-gold transition-colors"
          >
            Ver todos los productos disponibles
            <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// BENEFICIOS
// ─────────────────────────────────────────────────────────────
function BenefitsSection() {
  const benefits = [
    {
      icon: Globe,
      title: 'Alcance Digital',
      desc: 'Convierte tu tienda local en un negocio digital. Atrae clientes de toda la región sin invertir en infraestructura.',
      gradient: 'from-cyan-500/10 to-blue-500/5',
      border: 'hover:border-cyan-500/30',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      dir: 'left',
    },
    {
      icon: Zap,
      title: 'Setup Instantáneo',
      desc: 'Plataforma diseñada para dueños de negocio. Sin curva de aprendizaje, sin fricciones técnicas.',
      gradient: 'from-yellow-500/10 to-orange-500/5',
      border: 'hover:border-yellow-500/30',
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10',
      dir: 'up',
    },
    {
      icon: Shield,
      title: 'Cero Riesgo',
      desc: 'Plan gratuito permanente con 5 productos. Escala solo cuando tu negocio crezca, sin ataduras.',
      gradient: 'from-emerald-500/10 to-green-500/5',
      border: 'hover:border-emerald-500/30',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      dir: 'up',
    },
    {
      icon: MessageCircle,
      title: 'Contacto Directo',
      desc: 'Tus clientes te contactan vía WhatsApp o teléfono. Tú controlas la conversación y la venta.',
      gradient: 'from-purple-500/10 to-pink-500/5',
      border: 'hover:border-purple-500/30',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      dir: 'right',
    },
  ]

  return (
    <section className="py-14 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.02) 50%, transparent 100%)' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

      <div className="container-app relative">
        <Reveal className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/15">
            <Sparkles size={13} className="text-brand-gold" />
            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Beneficios</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-content-primary mb-4">
            Tu tienda merece
            <span className="block mt-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              estar en el mapa digital
            </span>
          </h2>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Herramientas profesionales para llevar tu negocio al siguiente nivel
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 100} direction={b.dir}>
              <div className={`relative h-full p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${b.gradient} ${b.border} transition-all duration-300 group cursor-default overflow-hidden`}>
                {/* Top shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className={`relative inline-flex p-3.5 rounded-xl ${b.iconBg} mb-5 border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-60 transition-opacity rounded-xl"
                    style={{ background: 'rgba(212,175,55,0.4)' }} />
                  <b.icon size={26} className={`relative z-10 ${b.iconColor}`} />
                </div>

                <h3 className="text-base font-bold text-content-primary mb-3 group-hover:text-brand-gold transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// CÓMO FUNCIONA
// ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { num: '01', icon: Users,      title: 'Regístrate',          desc: 'Crea tu cuenta en menos de 2 minutos. Solo necesitas email y contraseña.', detail: 'Sin costos ocultos' },
    { num: '02', icon: Store,      title: 'Configura tu tienda', desc: 'Agrega nombre, ubicación, contacto y sube el banner de tu negocio.',         detail: 'Todo personalizable' },
    { num: '03', icon: Package,    title: 'Publica productos',   desc: 'Sube fotos, descripción, precio y stock. Hasta 5 productos en el plan free.', detail: 'Sistema intuitivo' },
    { num: '04', icon: TrendingUp, title: 'Recibe clientes',     desc: 'Tu catálogo es visible al público. Los compradores te contactan directo.',    detail: 'Sin intermediarios' },
  ]

  return (
    <section className="py-14 relative overflow-hidden">
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />

      <div className="container-app">
        <Reveal className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/15">
            <Target size={13} className="text-brand-gold" />
            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Proceso</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-content-primary mb-4">
            Tan simple como{' '}
            <span style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              1, 2, 3, 4
            </span>
          </h2>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Desde el registro hasta tu primera venta en minutos, no en semanas
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Línea conectora */}
          <div className="hidden lg:block absolute top-[3.75rem] left-[12.5%] right-[12.5%] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.1), rgba(212,175,55,0.5), rgba(212,175,55,0.1))' }} />

          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 120} direction="up">
              <div className="relative flex flex-col items-center text-center group cursor-default">
                {/* Número */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-brand-gold/40 blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div
                    className="relative w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center font-black text-2xl text-brand-black shadow-xl group-hover:scale-110 transition-transform duration-300 z-10"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D76E)' }}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Ícono */}
                <div className="mb-4 p-2.5 rounded-xl bg-brand-black-card border border-white/8 group-hover:border-brand-gold/20 transition-colors">
                  <step.icon size={20} className="text-brand-gold" />
                </div>

                <h3 className="text-base font-bold text-content-primary mb-2 group-hover:text-brand-gold transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed mb-3">
                  {step.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-brand-gold/70 font-medium">
                  <CircleDot size={10} />
                  {step.detail}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA inline */}
        <Reveal className="mt-8" delay={500}>
          <div className="text-center p-8 rounded-2xl border border-brand-gold/10 bg-brand-gold/3"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 100%)' }}>
            <p className="text-content-secondary mb-5 text-sm">¿Listo para empezar tu transformación digital?</p>
            <button
              onClick={() => window.location.href = ROUTES.REGISTER}
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-brand-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-brand-gold/20"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D76E)' }}
            >
              <Store size={18} />
              Crear mi tienda ahora
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// PLANES
// ─────────────────────────────────────────────────────────────
function PlansSection() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Gratuito',
      badge: null,
      price: '0',
      period: 'Para siempre',
      description: 'Perfecto para comenzar tu presencia digital',
      features: [
        { text: 'Hasta 5 productos publicados', highlight: false },
        { text: 'Perfil público de tienda', highlight: false },
        { text: 'Contacto directo por WhatsApp', highlight: false },
        { text: 'Visible en catálogo público', highlight: false },
        { text: '3 fotos por variante de color', highlight: false },
      ],
      cta: 'Empezar gratis',
      popular: false,
      disabled: false,
    },
    {
      name: 'Pro',
      badge: 'Recomendado',
      price: '299',
      period: 'MXN / mes',
      description: 'Para tiendas que quieren crecer y destacar',
      features: [
        { text: 'Hasta 50 productos publicados', highlight: true },
        { text: 'Todo del plan gratuito', highlight: false },
        { text: 'Badge de tienda verificada', highlight: true },
        { text: 'Mayor visibilidad en el catálogo', highlight: true },
        { text: 'Campaña en Instagram, Facebook y TikTok', highlight: true },
      ],
      cta: 'Activar Plan Pro',
      popular: true,
      disabled: false,
    },
  ]

  return (
    <section className="py-14 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <div className="container-app relative">
        <Reveal className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/15">
            <Award size={13} className="text-brand-gold" />
            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Precios</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-content-primary mb-4">
            Planes para{' '}
            <span style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              cada etapa
            </span>
          </h2>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Comienza gratis y escala cuando estés listo. Sin sorpresas, sin letra pequeña.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-center">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100} direction="up">
              <div
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.popular
                    ? 'shadow-2xl shadow-brand-gold/15 md:scale-105'
                    : plan.disabled
                      ? 'opacity-55'
                      : 'hover:border-white/20'
                }`}
                style={{
                  border: plan.popular
                    ? '1px solid rgba(212,175,55,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Popular gradient border glow */}
                {plan.popular && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 60px rgba(212,175,55,0.05)' }} />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-0 left-0 right-0 flex justify-center">
                    <div className={`px-4 py-1 text-xs font-bold tracking-wide ${
                      plan.popular
                        ? 'bg-brand-gold text-brand-black'
                        : 'bg-surface-elevated text-content-muted border-x border-b border-white/10'
                    }`}>
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`p-7 pt-9 ${plan.popular ? 'bg-gradient-to-b from-brand-gold/5 to-transparent' : ''}`}>
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-content-primary mb-1">{plan.name}</h3>
                    <p className="text-xs text-content-muted">{plan.description}</p>
                  </div>

                  <div className="mb-7">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-5xl font-black ${plan.popular ? 'text-brand-gold' : 'text-content-primary'}`}>
                        ${plan.price}
                      </span>
                      {plan.price !== '???' && (
                        <span className="text-sm text-content-muted">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <CheckCircle size={16} className={`shrink-0 mt-0.5 ${f.highlight ? 'text-brand-gold' : 'text-state-success'}`} />
                        <span className={`text-sm ${f.highlight ? 'text-content-primary font-medium' : 'text-content-secondary'}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !plan.disabled && navigate(ROUTES.REGISTER)}
                    disabled={plan.disabled}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                      plan.popular
                        ? 'text-brand-black hover:opacity-90'
                        : plan.disabled
                          ? 'border border-white/10 text-content-muted cursor-not-allowed'
                          : 'border border-white/10 text-content-primary hover:border-brand-gold/30 hover:text-brand-gold'
                    }`}
                    style={plan.popular ? { background: 'linear-gradient(135deg, #D4AF37, #F5D76E)' } : {}}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6" delay={400}>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {['Todos los planes incluyen soporte por email', 'Sin comisiones por venta', 'Cancela cuando quieras'].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-content-muted">
                <CheckCircle size={13} className="text-state-success shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// CTA FINAL
// ─────────────────────────────────────────────────────────────
function CTASection() {
  const navigate  = useNavigate()
  const [ref, inView] = useInView()
  const canvasRef = useRef(null)

  // Mini particle canvas for CTA background
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ctx = el.getContext('2d')
    let w = el.offsetWidth, h = el.offsetHeight
    el.width = w; el.height = h

    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.5,
    }))

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > w) d.vx *= -1
        if (d.y < 0 || d.y > h) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(212,175,55,0.35)'
        ctx.fill()
      })
      // Lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 80) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(212,175,55,${0.08 * (1 - dist / 80)})`
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section
      ref={ref}
      className="py-14 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.03) 50%, transparent 100%)' }}
    >
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />

      {/* Mini canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" />

      {/* Radial spotlight */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />

      <div className="container-app text-center relative">
        <div className="max-w-4xl mx-auto">
          {/* Icon */}
          <Reveal>
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D76E)' }}
            >
              <Award size={36} className="text-brand-black" />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2
              className={`text-3xl sm:text-5xl md:text-6xl font-black text-content-primary mb-6 leading-tight transition-all duration-1000 ${inView ? 'opacity-100' : 'opacity-0'}`}
            >
              Da el salto digital que
              <span className="block mt-2"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                tu tienda necesita
              </span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-content-secondary text-lg md:text-xl mb-5 leading-relaxed max-w-2xl mx-auto">
              Únete a los dueños de tiendas deportivas que ya aprovechan el poder del comercio digital.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-6 max-w-xl mx-auto">
              {['Sin costos iniciales', 'Sin compromisos', 'Sin complicaciones técnicas'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-content-muted">
                  <CheckCircle size={13} className="text-brand-gold/60 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => navigate(ROUTES.REGISTER)}
                className="group relative overflow-hidden min-w-[280px] inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-brand-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-brand-gold/30"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D76E, #D4AF37)', backgroundSize: '200% auto' }}
              >
                <Store size={20} className="group-hover:rotate-12 transition-transform" />
                Registrar mi tienda — Gratis
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate(ROUTES.CATALOG)}
                className="group inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-content-secondary border border-white/8 hover:border-brand-gold/20 hover:text-brand-gold transition-all duration-300"
              >
                Ver tiendas activas
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Reveal>

          {/* Mini stats */}
          <Reveal delay={500}>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/5">
              {[
                { icon: Shield,   text: '100% Gratuito para empezar' },
                { icon: Clock,    text: 'Setup en menos de 5 minutos' },
                { icon: Users,    text: 'Sin límite de clientes' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 group cursor-default">
                  <div className="p-2 rounded-lg bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
                    <item.icon size={15} className="text-brand-gold" />
                  </div>
                  <span className="text-sm text-content-secondary font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────
function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <BenefitsSection />
      <HowItWorksSection />
      <PlansSection />
      <CTASection />
    </>
  )
}

export default LandingPage
