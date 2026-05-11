import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

// Flat config using only deps installed at the workspace root
// (@typescript-eslint/parser and @typescript-eslint/eslint-plugin), so we
// don't have to duplicate eslint devDeps in @hitster/server.
export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
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
]
