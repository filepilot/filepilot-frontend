import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production CSP only allows the live API origin. In dev we need to inject
// http://localhost:8080 (or whatever VITE_API_URL points at) so the SPA can
// reach the local backend without weakening prod policy.
const devCspPlugin = (mode) => ({
  name: 'inject-dev-csp',
  transformIndexHtml(html) {
    if (mode !== 'development') return html
    const devOrigin = (process.env.VITE_API_URL || 'http://localhost:8080')
      .replace(/\/api\/?$/, '')
    return html.replace(
      'connect-src \'self\' https://api.filepilot.dev',
      `connect-src 'self' ${devOrigin} https://api.filepilot.dev`
    )
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), devCspPlugin(mode)],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    css: false,
  },
}))
