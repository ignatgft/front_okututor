import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    pool: 'threads',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['src/api/**', 'src/store/**']
    }
  },

  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // split large vendor libs
          react: ['react', 'react-dom'],
          // split heavy pages
          dashboard: ['src/pages/PgDashboard.jsx'],
          lesson: ['src/pages/PgLesson.jsx'],
          course: ['src/pages/PgCourse.jsx']
        }
      }
    }
  }

})
