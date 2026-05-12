import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      // Forbid `any` in production source — escape hatch must be an explicit
      // eslint-disable comment so it's reviewable.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    // Kysely migrations idiomatically take Kysely<any> because the schema
    // they operate on is exactly what's being changed — a concrete DB type
    // would defeat the purpose.
    files: ['src/db/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
