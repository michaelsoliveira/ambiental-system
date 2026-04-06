import { defineConfig } from 'tsup'

export default defineConfig({
  /** Um único bundle a partir do servidor; evita tratar scripts/*.csv/.sql como entrada. */
  entry: ['src/http/server.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ['@saas/auth', '@saas/env'],
})