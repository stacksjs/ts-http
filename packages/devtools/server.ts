import { serve } from '/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/bun-plugin/src/serve.ts'
import { createApiRoutes } from './src/api'
import type { DashboardConfig } from './src/types'

const dashboardConfig: DashboardConfig = {
  port: 4401,
  host: 'localhost',
  storage: { driver: 'sqlite', sqlite: { dbPath: 'httx.sqlite' } },
}

const apiHandlers = createApiRoutes(dashboardConfig)

const routes: Record<string, (req: Request) => Response | Promise<Response>> = {
  '/api/ingest': (req) => apiHandlers['/api/ingest'](req),
  '/api/stats': (req) => apiHandlers['/api/stats'](req),
  '/api/requests': (req) => apiHandlers['/api/requests'](req),
  '/api/endpoints': (req) => apiHandlers['/api/endpoints'](req),
  '/api/events': (req) => apiHandlers['/api/events'](req),
  '/api/alerts': (req) => apiHandlers['/api/alerts'](req),
}

function onRequest(req: Request): Response | Promise<Response> | null {
  const url = new URL(req.url)
  const pathname = url.pathname

  const requestMatch = pathname.match(/^\/api\/requests\/(.+)$/)
  if (requestMatch) {
    const id = decodeURIComponent(requestMatch[1])
    return apiHandlers['/api/requests/:id'](id)
  }

  const endpointMatch = pathname.match(/^\/api\/endpoints\/(.+)$/)
  if (endpointMatch) {
    const encoded = decodeURIComponent(endpointMatch[1])
    const dashSlash = encoded.indexOf('-/')
    if (dashSlash >= 0) {
      const method = encoded.slice(0, dashSlash)
      const path = encoded.slice(dashSlash + 1)
      return apiHandlers['/api/endpoints/:path'](method, path)
    }
  }

  return null
}

await serve({
  patterns: ['src/pages/'],
  port: 4401,
  routes,
  onRequest,
})
