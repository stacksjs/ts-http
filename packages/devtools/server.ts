import { serve } from 'bun-plugin-stx/serve'

await serve({
  patterns: ['src/pages/'],
  port: 4401,
})
