import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      // Evitar que Vite recargue la página completa al perder conexión
      // brevemente (ej: al cambiar de pestaña y el OS suspende el socket).
      timeout: 60000,
      overlay: false,
    },
  },
})
