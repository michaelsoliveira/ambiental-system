import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    server: 'src/http/server.ts',
    'oc-worker': 'src/omnichannel/oc-worker.ts',
    'oc-beat': 'src/omnichannel/oc-beat.ts',
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ['@saas/auth', '@saas/env'],
})
