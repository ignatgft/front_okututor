import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/oauth2": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/login/oauth2": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/v3/api-docs": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/swagger-ui": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/actuator": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    setupFiles: ['src/testSetup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/main.jsx',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/types/**',
        'src/styles/**',
        'src/assets/**',
        '**/*.css',
        'src/layouts/**',
        'src/pages/**',
        'src/components/HomeSection/**',
        'src/components/admin/**',
        'src/components/support/**',
        'src/components/attachments/**',
        'src/components/AuthRegister/**',
        'src/components/Navbar.tsx',
        'src/components/Sidebar.tsx',
        'src/components/BottomNav.tsx',
        'src/components/DashboardLayout.tsx',
        'src/components/ErrorBoundary.tsx',
      ],
      // Phase 2: 100% TS achieved (221 files). Baseline shifted to ~20% due to 0% pages/calendar now included.
      // Roadmap: add targeted tests for utils/schedule/support to raise stepwise to 70/60/70/70.
      thresholds: {
        statements: 20,
        branches: 18,
        functions: 15,
        lines: 20,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor-react";
            if (id.includes("@tanstack/react-query")) return "vendor-react-query";
            if (id.includes("livekit-client")) return "vendor-livekit";
            if (id.includes("i18next") || id.includes("react-i18next")) return "vendor-i18n";
            if (id.includes("react-router")) return "vendor-router";
            if (id.includes("zustand")) return "vendor-zustand";
            if (id.includes("lucide-react")) return "vendor-lucide";
            // remaining vendors
            if (id.includes("node_modules")) return "vendor";
          }
          // heavy pages — keep separate chunks
          if (id.includes("src/pages/PgDashboard")) return "page-dashboard";
          if (id.includes("src/pages/PgCourse")) return "page-course";
          if (id.includes("src/pages/PgLesson")) return "page-lesson";
          return undefined;
        },
      }
    }
  }

})
