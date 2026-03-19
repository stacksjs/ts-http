import { resolve, dirname } from 'node:path'
import { serve } from '/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/bun-plugin/src/serve.ts'
import { createApiRoutes } from './src/api'
import type { DashboardConfig } from './src/types'

const dbPath = resolve(dirname(import.meta.path), 'httx.sqlite')

const dashboardConfig: DashboardConfig = {
  port: 4401,
  host: 'localhost',
  storage: { driver: 'sqlite', sqlite: { dbPath } },
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
    const parts = encoded.split(' ')
    if (parts.length >= 2) {
      const method = parts[0]
      const epPath = parts.slice(1).join(' ')
      return apiHandlers['/api/endpoints/:path'](method, epPath)
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
