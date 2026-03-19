#!/usr/bin/env bun
/**
 * Standalone CLI for @stacksjs/httx-dashboard
 *
 * Usage:
 *   bunx @stacksjs/httx-dashboard
 *   bunx @stacksjs/httx-dashboard --port 4401
 *   bunx @stacksjs/httx-dashboard --broadcast-port 6002
 */

import { resolve, dirname } from 'node:path'
import { loadConfig } from 'bunfig'
import { serve } from 'bun-plugin-stx/serve'
// TODO: replace with `import { BroadcastServer } from 'ts-broadcasting'` once npm package ships dist/
import { BroadcastServer } from '/Users/glennmichaeltorregosa/Documents/Projects/ts-broadcasting/packages/ts-broadcasting/src/server'
import { createApiRoutes } from './api'
import { createRecorder } from './recorder'
import type { DashboardConfig } from './types'
import type { RequestCompleteRecord } from '../../httx/src/types'

interface HttxDashboardConfig {
  dashboard: {
    port: number
    broadcastPort: number
  }
  storage: {
    driver: 'sqlite'
    dbPath: string
    maxAge: string
  }
  ignore: {
    hosts: string[]
    urls: string[]
  }
}

const defaultConfig: HttxDashboardConfig = {
  dashboard: {
    port: 4401,
    broadcastPort: 6002,
  },
  storage: {
    driver: 'sqlite',
    dbPath: resolve(dirname(import.meta.path), '..', 'httx.sqlite'),
    maxAge: '7d',
  },
  ignore: {
    hosts: [],
    urls: [],
  },
}

function printHelp(): void {
  console.log(`
  @stacksjs/httx-dashboard — HTTP request monitoring dashboard

  Usage:
    bunx @stacksjs/httx-dashboard [options]

  Options:
    --port <number>            Dashboard port (default: 4401)
    --broadcast-port <number>  WebSocket broadcast port (default: 6002)
    --db-path <path>           SQLite database path
    -h, --help                 Show this help message

  Config file:
    Auto-loads httx.config.ts from ./, ./config/, ./.config/

  Environment variables:
    HTTX_DASHBOARD_PORT        Dashboard port
    HTTX_BROADCAST_PORT        WebSocket broadcast port
    HTTX_DB_PATH               SQLite database path
`)
}

function parseArgs(): Partial<HttxDashboardConfig> {
  const args = process.argv.slice(2)
  const overrides: Partial<HttxDashboardConfig> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]

    if (arg === '-h' || arg === '--help') {
      printHelp()
      process.exit(0)
    }

    if (arg === '--port' && next) {
      overrides.dashboard = { ...defaultConfig.dashboard, ...overrides.dashboard, port: Number(next) }
      i++
    }
    else if (arg === '--broadcast-port' && next) {
      overrides.dashboard = { ...defaultConfig.dashboard, ...overrides.dashboard, broadcastPort: Number(next) }
      i++
    }
    else if (arg === '--db-path' && next) {
      overrides.storage = { ...defaultConfig.storage, ...overrides.storage, dbPath: resolve(next) }
      i++
    }
  }

  return overrides
}

function applyEnvVars(config: HttxDashboardConfig): HttxDashboardConfig {
  const envPort = process.env.HTTX_DASHBOARD_PORT
  const envBroadcastPort = process.env.HTTX_BROADCAST_PORT
  const envDbPath = process.env.HTTX_DB_PATH

  if (envPort) config.dashboard.port = Number(envPort)
  if (envBroadcastPort) config.dashboard.broadcastPort = Number(envBroadcastPort)
  if (envDbPath) config.storage.dbPath = resolve(envDbPath)

  return config
}

// --- Main ---

const cliOverrides = parseArgs()

const fileConfig = await loadConfig<HttxDashboardConfig>({
  name: 'httx',
  defaultConfig,
})

const envConfig = applyEnvVars(fileConfig)

// Merge: CLI flags > env vars > config file > defaults
const config: HttxDashboardConfig = {
  dashboard: { ...envConfig.dashboard, ...cliOverrides.dashboard },
  storage: { ...envConfig.storage, ...cliOverrides.storage },
  ignore: { ...envConfig.ignore },
}

const port = config.dashboard.port
const broadcastPort = config.dashboard.broadcastPort
const dbPath = config.storage.dbPath

console.log(`
  @stacksjs/httx-dashboard

  Dashboard:  http://localhost:${port}
  WebSocket:  ws://localhost:${broadcastPort}
  Database:   ${dbPath}

  Track requests in your app:

    import { trackRequests } from '@stacksjs/httx-dashboard'
    trackRequests()
`)

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

// Build dashboard config for API routes
const dashboardConfig: DashboardConfig = {
  port,
  host: 'localhost',
  broadcastPort,
  storage: { driver: 'sqlite', sqlite: { dbPath } },
}

const apiHandlers = createApiRoutes(dashboardConfig)
const recorder = createRecorder({ dbPath })

// Build routes
const routes: Record<string, (req: Request) => Response | Promise<Response>> = {
  '/api/ingest': async (req: Request) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'POST required' }, { status: 405 })
    }
    try {
      const body = await req.json() as RequestCompleteRecord
      if (!body.method || !body.url) {
        return Response.json({ error: 'Missing required fields: method, url' }, { status: 400 })
      }

      recorder(body)

      // Broadcast to connected dashboards
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
  patterns: ['src/pages/'],
  port,
  routes,
  onRequest,
})
