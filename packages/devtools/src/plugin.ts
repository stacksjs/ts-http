/**
 * httx Devtools — STX Plugin
 *
 * Registers httx dashboard as a Stacks plugin.
 * Pages are served under the configured prefix (default: /_httx),
 * API routes are registered via addRoute(), and request tracking
 * is optionally started.
 *
 * Usage in stx.config.ts:
 * ```ts
 * export default {
 *   plugins: [
 *     ['@stacksjs/httx', { path: '/_httx' }]
 *   ]
 * }
 * ```
 */

import { createApiRoutes, resolveConfig } from './api'
import { createRecorder } from './recorder'
import type { DashboardConfig } from './types'
import type { RequestCompleteRecord } from '../../httx/src/types'

export interface HttxPluginOptions {
  /** URL prefix for the dashboard (default: '/_httx') */
  path?: string

  /** Storage configuration */
  storage?: {
    /** SQLite database path (default: 'storage/framework/httx.sqlite') */
    dbPath?: string
  }

  /** Start tracking fetch() calls automatically (default: false) */
  autoTrack?: boolean

  /** WebSocket broadcast port (default: 6002) */
  broadcastPort?: number

  /** Auth gate — function that returns true if request is authorized */
  auth?: {
    gate?: (req: Request) => boolean | Promise<boolean>
  }
}

export default {
  name: '@stacksjs/httx',

  // STX will resolve pages from this directory relative to the plugin package
  pages: '../pages',

  // Functions directory for composables (httxPath, httxApi, etc.)
  functions: '../functions',

  // Stores directory
  stores: '../stores',

  async setup(options: HttxPluginOptions, stx: any) {
    const prefix = options.path ?? '/_httx'
    const dbPath = options.storage?.dbPath ?? 'storage/framework/httx.sqlite'
    const broadcastPort = options.broadcastPort ?? 6002

    // Set global base path so pages/stores can read it at runtime
    globalThis.__httxBasePath = prefix
    globalThis.__httxWsUrl = `ws://localhost:${broadcastPort}/app`

    // Build dashboard config for the API layer
    const dashboardConfig: DashboardConfig = {
      storage: {
        driver: 'sqlite',
        sqlite: { dbPath },
      },
    }

    const resolvedConfig = resolveConfig(dashboardConfig)
    const apiHandlers = createApiRoutes(resolvedConfig)
    const recorder = createRecorder({ dbPath })

    // Register API routes with prefix
    const apiRoutes: Record<string, string> = {
      '/api/stats': '/api/stats',
      '/api/requests': '/api/requests',
      '/api/endpoints': '/api/endpoints',
      '/api/events': '/api/events',
      '/api/alerts': '/api/alerts',
    }

    for (const [routePath, handlerKey] of Object.entries(apiRoutes)) {
      stx.addRoute(`${prefix}${routePath}`, (req: Request) => {
        return apiHandlers[handlerKey as keyof typeof apiHandlers](req)
      })
    }

    // Ingest endpoint — accepts POSTed request records, stores in SQLite, broadcasts
    stx.addRoute(`${prefix}/api/ingest`, async (req: Request) => {
      if (req.method !== 'POST') {
        return Response.json({ error: 'POST required' }, { status: 405 })
      }

      // Auth gate
      if (options.auth?.gate) {
        const authorized = await options.auth.gate(req)
        if (!authorized) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      try {
        const body = await req.json() as RequestCompleteRecord
        if (!body.method || !body.url) {
          return Response.json({ error: 'Missing required fields: method, url' }, { status: 400 })
        }
        recorder(body)

        // Broadcast if available
        try {
          const broadcastServer = (globalThis as any).__httxBroadcastServer
          if (broadcastServer) {
            broadcastServer.broadcast('dashboard', 'request.recorded', {
              method: body.method,
              url: body.url,
              status: body.status,
              duration: body.duration,
              timestamp: Date.now(),
            })
          }
        }
        catch {}

        return Response.json({ ok: true })
      }
      catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
      }
    })

    // Parameterized routes — requests/:id and endpoints/:path
    // These need pattern matching, so we register a catch-all handler
    stx.addRoute(`${prefix}/api/requests/:id`, async (req: Request) => {
      const url = new URL(req.url)
      const match = url.pathname.match(new RegExp(`^${prefix}/api/requests/(.+)$`))
      if (!match) return Response.json({ error: 'Not found' }, { status: 404 })
      const id = decodeURIComponent(match[1])
      return apiHandlers['/api/requests/:id'](id)
    })

    stx.addRoute(`${prefix}/api/endpoints/:path`, async (req: Request) => {
      const url = new URL(req.url)
      const match = url.pathname.match(new RegExp(`^${prefix}/api/endpoints/(.+)$`))
      if (!match) return Response.json({ error: 'Not found' }, { status: 404 })
      const encoded = decodeURIComponent(match[1])
      const parts = encoded.split(' ')
      if (parts.length >= 2) {
        return apiHandlers['/api/endpoints/:path'](parts[0], parts.slice(1).join(' '))
      }
      return Response.json({ error: 'Invalid endpoint format' }, { status: 400 })
    })

    // Auto-track fetch() if enabled
    if (options.autoTrack) {
      const { trackRequests } = await import('./track')
      trackRequests({
        endpoint: `http://localhost:${stx.config?.port ?? 3000}${prefix}/api/ingest`,
        dbPath: undefined, // Use HTTP mode, not direct SQLite
      })
    }

    // Start broadcasting server if available
    try {
      // TODO: replace with `import { BroadcastServer } from 'ts-broadcasting'` once npm package ships dist/
      const { BroadcastServer } = await import('/Users/glennmichaeltorregosa/Documents/Projects/ts-broadcasting/packages/ts-broadcasting/src/server')
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
      ;(globalThis as any).__httxBroadcastServer = broadcastServer
      console.log(`  [httx] WebSocket broadcasting on ws://localhost:${broadcastPort}/app`)
    }
    catch {
      // Broadcasting not available — dashboard still works without real-time updates
    }

    console.log(`  [httx] Dashboard mounted at ${prefix}/`)
  },
}
