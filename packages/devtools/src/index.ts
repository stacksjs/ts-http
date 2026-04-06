/**
 * httx Devtools — Public API
 *
 * Exports types, API route creators, and utilities for embedding
 * the httx dashboard. Page rendering is handled by stx — not here.
 *
 * For standalone dev: `bun server.ts`
 * For programmatic use: import { serveDashboard } from './index'
 */

import { serve } from 'bun-plugin-stx/serve'
// TODO: replace with `import { BroadcastServer } from 'ts-broadcasting'` once npm package ships dist/
import { BroadcastServer } from '/Users/glennmichaeltorregosa/Documents/Projects/ts-broadcasting/packages/ts-broadcasting/src/server'
import { createApiRoutes, resolveConfig } from './api'
import { createRecorder } from './recorder'
import type { DashboardConfig } from './types'
import type { RequestCompleteRecord } from '../../httx/src/types'

// Re-export plugin for Stacks integration
export { default as httxPlugin } from './plugin'
export type { HttxPluginOptions } from './plugin'

// Re-export types and API creators for library consumers
export type { DashboardConfig, DashboardStats, EndpointDetail, EndpointStats, EventLogEntry, HttpMethod, MonitoringAlert, RequestMetrics, RequestRecord, StatusDistribution, StorageConfig, TimeSeriesPoint, ThroughputPoint } from './types'
export { createApiRoutes, fetchAlerts, fetchDashboardStats, fetchEndpointDetail, fetchEndpointList, fetchEventLog, fetchMonitoringState, fetchRequestById, fetchRequestHistory } from './api'
export { createRecorder } from './recorder'
export { trackRequests, isTrackingRequests } from './track'
export type { TrackRequestsOptions } from './track'
export { putRequest, queryAllRequests, getRequestById, getRequestCount, pruneOldRequests, closeDb } from './storage'
export type { SqliteStorageConfig } from './storage'

/**
 * Start the httx devtools dashboard.
 *
 * This is the programmatic API for embedding httx in another app.
 * stx handles all page rendering, SPA routing, Crosswind CSS, etc.
 * This function only sets up the app-specific server logic:
 * - SQLite storage + recorder
 * - WebSocket broadcasting
 * - API routes
 */
export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)
  const broadcastPort = options.broadcastPort ?? 6002
  const wsUrl = `ws://localhost:${broadcastPort}/app`

  // Start WebSocket broadcast server
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
  console.log(`  ✓ WebSocket broadcasting on ${wsUrl}`)

  // Create recorder for SQLite storage
  const sqliteConfig = config.storage?.sqlite ?? {}
  const recorder = createRecorder(sqliteConfig)

  // Build API routes
  const apiHandlers = createApiRoutes(config)
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

  // Handle parameterized API routes
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
        return apiHandlers['/api/endpoints/:path'](parts[0], parts.slice(1).join(' '))
      }
    }

    return null
  }

  // Let stx handle everything: pages, routing, SPA, Crosswind CSS, HMR
  await serve({
    patterns: ['pages/'],
    port: config.port ?? 4401,
    routes,
    onRequest,
  })
}
