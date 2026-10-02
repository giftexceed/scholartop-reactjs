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
    },
  },
  {
    // UI code must go through src/data/api (+ useLiveData) so the storage
    // backend can be swapped without touching components.
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/data/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'dexie', message: 'Use the data API in src/data/api instead.' },
          { name: 'dexie-react-hooks', message: 'Use useLiveData from src/data/useLiveData instead.' },
        ],
        patterns: [
          { group: ['**/data/local/*', '**/data/local'], message: 'Use the data API in src/data/api instead.' },
          { group: ['**/data/api/_context'], message: 'Internal to the data layer.' },
        ],
      }],
    },
  },
])
