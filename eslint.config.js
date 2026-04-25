import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Setting state at the top of a fetch effect (loading=true, error='', clear stale data)
      // is the idiomatic React pattern; the lint rule's autofix would obscure intent.
      'react-hooks/set-state-in-effect': 'off',
      // Context files intentionally export both the provider component and a hook.
      // Splitting them across two files just to satisfy fast-refresh isn't worth it.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Vite config runs in Node, not the browser.
    files: ['vite.config.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
