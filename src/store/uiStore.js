import { create } from 'zustand'

/**
 * Store de UI.
 * Gestiona estado global de interfaz: toasts, modales, etc.
 */
const useUIStore = create((set) => ({
  // ── Toast / Notificaciones ─────────────────────────────
  toasts: [],

  addToast: ({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, duration)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // ── Sidebar del Dashboard ──────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

export default useUIStore
