import { resolve, dirname } from 'node:path'
import { serve } from '/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/bun-plugin/src/serve.ts'
// TODO: replace with `import { BroadcastServer } from 'ts-broadcasting'` once npm package ships dist/
import { BroadcastServer } from '/Users/glennmichaeltorregosa/Documents/Projects/ts-broadcasting/packages/ts-broadcasting/src/server'
import { createApiRoutes } from './src/api'
import { createRecorder } from './src/recorder'
import type { DashboardConfig } from './src/types'
import type { RequestCompleteRecord } from '../httx/src/types'

const dbPath = resolve(dirname(import.meta.path), 'httx.sqlite')
const broadcastPort = 6002

const dashboardConfig: DashboardConfig = {
  port: 4401,
  host: 'localhost',
  broadcastPort,
  storage: { driver: 'sqlite', sqlite: { dbPath } },
}

const apiHandlers = createApiRoutes(dashboardConfig)
const recorder = createRecorder(dashboardConfig.storage?.sqlite ?? {})

// Start WebSocket broadcast server for real-time updates
const broadcastServer = new BroadcastServer({
  connections: {
    default: {
      driver: 'bun',
      host: '0.0.0.0',
      port: broadcastPort,
    },
  },
  default: 'default',
  debug: false,
})
await broadcastServer.start()
console.log(`  ✓ WebSocket broadcasting on ws://localhost:${broadcastPort}/app`)

const routes: Record<string, (req: Request) => Response | Promise<Response>> = {
  '/api/ingest': async (req) => {
    if (req.method !== 'POST') return apiHandlers['/api/ingest'](req)

    try {
      const body = await req.json() as RequestCompleteRecord
      if (!body.method || !body.url) {
        return Response.json({ error: 'Missing required fields: method, url' }, { status: 400 })
      }

      recorder(body)

      broadcastServer.broadcast('dashboard', 'request.recorded', {
        method: body.method,
        url: body.url,
        status: body.status,
        duration: body.duration,
        timestamp: Date.now(),
      })

      return Response.json({ ok: true })
    }
    catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
  },
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
  patterns: ['pages/'],
  port: 4401,
  routes,
  onRequest,
})
