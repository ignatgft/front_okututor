import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    setupFiles: ['src/testSetup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/styles/**',
        'src/assets/**',
        '**/*.css',
        'src/layouts/**',
        'src/pages/PgAdmin*.jsx',
        'src/pages/PgSupport*.jsx',
        'src/pages/PgMain.jsx',
        'src/pages/PgOAuthCallback.jsx',
        'src/pages/PgForgotPassword.jsx',
        'src/pages/PgResetPassword.jsx',
        'src/pages/PgVerifyEmail.jsx',
        'src/pages/PgNotFound.jsx',
        'src/pages/PgForbidden.jsx',
        'src/components/HomeSection/**',
        'src/components/admin/**',
        'src/components/support/**',
        'src/components/attachments/**',
        'src/components/AuthRegister/**',
        'src/components/Navbar.jsx',
        'src/components/Sidebar.jsx',
        'src/components/BottomNav.jsx',
        'src/components/DashboardLayout.jsx',
        'src/components/ErrorBoundary.jsx',
      ],
      thresholds: {
        statements: 15,
        branches: 12,
        functions: 12,
        lines: 15,
      },
    },
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
